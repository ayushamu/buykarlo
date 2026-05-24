"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// Helper function to check if the current user is an admin
async function checkAdminAccess() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: "Unauthorized. Please log in first.", isAdmin: false }
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle()

  if (profileError || !profile || !profile.is_admin) {
    return { error: "Permission denied. Admin role required.", isAdmin: false }
  }

  return { isAdmin: true, user }
}

export async function getAdminOverviewStats() {
  try {
    const access = await checkAdminAccess()
    if (!access.isAdmin) return { error: access.error }

    const supabase = await createClient()

    // 1. Fetch total counts
    const { count: totalListings } = await supabase
      .from("listings")
      .select("*", { count: "exact", head: true })

    const { count: activeListings } = await supabase
      .from("listings")
      .select("*", { count: "exact", head: true })
      .eq("status", "active")

    const { count: totalUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })

    const { count: pendingReports } = await supabase
      .from("reports")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending")

    // 2. Fetch category distribution
    const { data: categoryData } = await supabase
      .from("categories")
      .select("id, name, slug")

    const categoryDistribution = []
    if (categoryData) {
      for (const cat of categoryData) {
        const { count } = await supabase
          .from("listings")
          .select("*", { count: "exact", head: true })
          .eq("category_id", cat.id)
        
        categoryDistribution.push({
          name: cat.name,
          slug: cat.slug,
          count: count || 0
        })
      }
    }

    return {
      success: true,
      stats: {
        totalListings: totalListings || 0,
        activeListings: activeListings || 0,
        totalUsers: totalUsers || 0,
        pendingReports: pendingReports || 0
      },
      categoryDistribution
    }
  } catch (error) {
    console.error("getAdminOverviewStats Exception:", error)
    return { error: "Failed to load admin stats." }
  }
}

export async function getModerationReports() {
  try {
    const access = await checkAdminAccess()
    if (!access.isAdmin) return { error: access.error }

    const supabase = await createClient()

    // Fetch reports with joined listing details and reporter profile details
    const { data: reports, error } = await supabase
      .from("reports")
      .select(`
        id,
        reason,
        status,
        created_at,
        listing:listing_id(
          id,
          title,
          price,
          condition,
          status,
          campus,
          slug,
          seller:seller_id(id, full_name, email, university, department)
        ),
        reporter:reporter_id(id, full_name, email, university, department)
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching moderation reports:", error)
      return { error: error.message }
    }

    return { success: true, reports: reports || [] }
  } catch (error) {
    console.error("getModerationReports Exception:", error)
    return { error: "Failed to load moderation reports." }
  }
}

export async function resolveReport(reportId: string, action: "dismiss" | "unlist") {
  try {
    const access = await checkAdminAccess()
    if (!access.isAdmin) return { error: access.error }

    const supabase = await createClient()

    // 1. Fetch the report to know the associated listing
    const { data: report, error: reportError } = await supabase
      .from("reports")
      .select("listing_id")
      .eq("id", reportId)
      .single()

    if (reportError || !report) {
      return { error: "Report not found." }
    }

    const listingId = report.listing_id

    if (action === "unlist") {
      // Unlist listing: Set status of listing to 'hidden' (or deleted)
      const { error: listingUpdateError } = await supabase
        .from("listings")
        .update({ status: "hidden" })
        .eq("id", listingId)

      if (listingUpdateError) {
        console.error("Error unlisting item:", listingUpdateError)
        return { error: "Failed to unlist the item." }
      }

      // Mark all pending reports for this listing as resolved
      const { error: reportsUpdateError } = await supabase
        .from("reports")
        .update({ status: "resolved" })
        .eq("listing_id", listingId)
        .eq("status", "pending")

      if (reportsUpdateError) {
        console.error("Error resolving related reports:", reportsUpdateError)
      }
    } else {
      // Dismiss specific report: Mark this report as dismissed
      const { error: reportUpdateError } = await supabase
        .from("reports")
        .update({ status: "dismissed" })
        .eq("id", reportId)

      if (reportUpdateError) {
        console.error("Error dismissing report:", reportUpdateError)
        return { error: "Failed to dismiss report." }
      }
    }

    revalidatePath("/")
    revalidatePath("/explore")
    revalidatePath("/admin/listings")
    revalidatePath("/admin/reports")

    return { success: true }
  } catch (error) {
    console.error("resolveReport Exception:", error)
    return { error: "An unexpected error occurred." }
  }
}

export async function adjustUserTrustScore(userId: string, changeAmount: number, reason: string) {
  try {
    const access = await checkAdminAccess()
    if (!access.isAdmin) return { error: access.error }

    const supabase = await createClient()

    // 1. Get current trust score
    const { data: profile, error: fetchError } = await supabase
      .from("profiles")
      .select("trust_score")
      .eq("id", userId)
      .single()

    if (fetchError || !profile) {
      return { error: "User profile not found." }
    }

    const currentScore = profile.trust_score || 50
    const newScore = Math.max(0, Math.min(100, currentScore + changeAmount)) // Clamp between 0 and 100

    // 2. Update trust score
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ trust_score: newScore })
      .eq("id", userId)

    if (updateError) {
      console.error("Error updating user trust score:", updateError)
      return { error: "Failed to update trust score." }
    }

    return { success: true, newScore }
  } catch (error) {
    console.error("adjustUserTrustScore Exception:", error)
    return { error: "An unexpected error occurred." }
  }
}

export async function flagListingByStudent(listingId: string, reason: string) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: "Unauthorized. Please log in first." }
    }

    // Insert new report record
    const { error } = await supabase
      .from("reports")
      .insert({
        listing_id: listingId,
        reporter_id: user.id,
        reason: reason.trim(),
        status: "pending"
      })

    if (error) {
      console.error("Error inserting report:", error)
      return { error: "Failed to flag listing. Please try again." }
    }

    return { success: true }
  } catch (error) {
    console.error("flagListingByStudent Exception:", error)
    return { error: "An unexpected error occurred." }
  }
}

export async function getAdminListings() {
  try {
    const access = await checkAdminAccess()
    if (!access.isAdmin) return { error: access.error }

    const supabase = await createClient()

    const { data: listings, error } = await supabase
      .from("listings")
      .select(`
        id,
        slug,
        title,
        price,
        condition,
        status,
        campus,
        created_at,
        category:categories(name),
        seller:profiles!listings_seller_id_fkey(full_name, email)
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching admin listings:", error)
      return { error: error.message }
    }

    return { success: true, listings: listings || [] }
  } catch (error) {
    console.error("getAdminListings Exception:", error)
    return { error: "Failed to fetch admin listings." }
  }
}

export async function unlistListingByAdmin(listingId: string) {
  try {
    const access = await checkAdminAccess()
    if (!access.isAdmin) return { error: access.error }

    const supabase = await createClient()

    const { error } = await supabase
      .from("listings")
      .update({ status: "hidden" })
      .eq("id", listingId)

    if (error) {
      console.error("Error unlisting listing:", error)
      return { error: "Failed to unlist the item." }
    }

    revalidatePath("/")
    revalidatePath("/explore")
    revalidatePath("/admin/listings")

    return { success: true }
  } catch (error) {
    console.error("unlistListingByAdmin Exception:", error)
    return { error: "An unexpected error occurred." }
  }
}

export async function setUserAdminStatusByEmail(email: string, isAdmin: boolean) {
  try {
    const access = await checkAdminAccess()
    if (!access.isAdmin) return { error: access.error }

    const supabase = await createClient()

    const { data: profile, error: findError } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("email", email.trim())
      .maybeSingle()

    if (findError || !profile) {
      return { error: "User profile with this email not found. Make sure the email matches exactly." }
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ is_admin: isAdmin })
      .eq("id", profile.id)

    if (updateError) {
      console.error("Error setting admin status:", updateError)
      return { error: "Failed to update admin role." }
    }

    return { success: true, name: profile.full_name }
  } catch (error) {
    console.error("setUserAdminStatusByEmail Exception:", error)
    return { error: "An unexpected error occurred." }
  }
}

export async function setUserTrustScoreByEmail(email: string, score: number) {
  try {
    const access = await checkAdminAccess()
    if (!access.isAdmin) return { error: access.error }

    const supabase = await createClient()

    const { data: profile, error: findError } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("email", email.trim())
      .maybeSingle()

    if (findError || !profile) {
      return { error: "User profile with this email not found. Make sure the email matches exactly." }
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ trust_score: Math.max(0, Math.min(100, score)) })
      .eq("id", profile.id)

    if (updateError) {
      console.error("Error setting trust score:", updateError)
      return { error: "Failed to update trust score." }
    }

    return { success: true, name: profile.full_name }
  } catch (error) {
    console.error("setUserTrustScoreByEmail Exception:", error)
    return { error: "An unexpected error occurred." }
  }
}

