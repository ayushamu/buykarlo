"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// Helper function to check admin rights
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

// Create a new Referral Partner
export async function createPartner(input: {
  name: string
  platform: string
  handle: string
  email?: string
  phone?: string
  upiId?: string
  referralCode: string
  rewardPerListing?: number
}) {
  try {
    const access = await checkAdminAccess()
    if (!access.isAdmin) return { error: access.error }

    const supabase = await createClient()

    const cleanCode = input.referralCode.trim().toUpperCase()
    if (!cleanCode) {
      return { error: "Referral code is required." }
    }

    // Ensure code has no spaces or special characters
    const alphanumericCode = cleanCode.replace(/[^A-Z0-9]/g, "")
    if (alphanumericCode !== cleanCode) {
      return { error: "Referral code must contain only letters and numbers." }
    }

    // Check if referral code is already taken
    const { data: existing } = await supabase
      .from("partners")
      .select("id")
      .eq("referral_code", cleanCode)
      .maybeSingle()

    if (existing) {
      return { error: `Referral code "${cleanCode}" is already taken.` }
    }

    const { data, error } = await supabase
      .from("partners")
      .insert({
        name: input.name.trim(),
        platform: input.platform.trim(),
        handle: input.handle.trim(),
        email: input.email?.trim() || null,
        phone: input.phone?.trim() || null,
        upi_id: input.upiId?.trim() || null,
        referral_code: cleanCode,
        reward_per_listing: input.rewardPerListing || 10.00,
        status: "active"
      })
      .select("id")
      .single()

    if (error) {
      console.error("Error creating partner:", error)
      return { error: error.message }
    }

    revalidatePath("/admin/partners")
    return { success: true, partnerId: data.id }
  } catch (err: any) {
    console.error("createPartner Exception:", err)
    return { error: "An unexpected error occurred." }
  }
}

// Fetch all partners with aggregated stats
export async function getPartnersWithStats() {
  try {
    const access = await checkAdminAccess()
    if (!access.isAdmin) return { error: access.error }

    const supabase = await createClient()

    const { data: stats, error } = await supabase
      .rpc("get_partners_stats")

    if (error) {
      console.error("Error executing get_partners_stats RPC:", error)
      return { error: error.message }
    }

    return { success: true, partners: stats || [] }
  } catch (err: any) {
    console.error("getPartnersWithStats Exception:", err)
    return { error: "An unexpected error occurred." }
  }
}

// Fetch detailed profile for a single partner (metrics + recent referred activity)
export async function getPartnerDetails(partnerId: string) {
  try {
    const access = await checkAdminAccess()
    if (!access.isAdmin) return { error: access.error }

    const supabase = await createClient()

    // 1. Get aggregated stats by filtering get_partners_stats
    const { data: statsArray, error: statsError } = await supabase
      .rpc("get_partners_stats")
    
    if (statsError) {
      console.error("Error fetching partner details via RPC:", statsError)
      return { error: statsError.message }
    }

    const partnerStats = (statsArray || []).find((p: any) => p.id === partnerId)
    if (!partnerStats) {
      return { error: "Partner not found." }
    }

    // 2. Fetch recent signups
    const { data: recentSignups, error: signupError } = await supabase
      .from("profiles")
      .select("id, full_name, email, phone, created_at")
      .eq("referred_by", partnerId)
      .order("created_at", { ascending: false })
      .limit(10)

    if (signupError) {
      console.error("Error fetching recent signups for partner:", signupError)
    }

    // 3. Fetch recent listings (inner join on referred_by)
    const { data: recentListings, error: listingsError } = await supabase
      .from("listings")
      .select(`
        id,
        title,
        price,
        status,
        created_at,
        seller:profiles!listings_seller_id_fkey!inner(full_name, email, referred_by)
      `)
      .eq("seller.referred_by", partnerId)
      .order("created_at", { ascending: false })
      .limit(10)

    if (listingsError) {
      console.error("Error fetching recent listings for partner:", listingsError)
    }

    const formattedListings = (recentListings || []).map((l: any) => ({
      id: l.id,
      title: l.title,
      price: Number(l.price),
      status: l.status,
      createdAt: l.created_at,
      sellerName: l.seller?.full_name || "Campus User",
      sellerEmail: l.seller?.email || "No email"
    }))

    return {
      success: true,
      partner: partnerStats,
      recentSignups: recentSignups || [],
      recentListings: formattedListings
    }
  } catch (err: any) {
    console.error("getPartnerDetails Exception:", err)
    return { error: "An unexpected error occurred." }
  }
}

// Toggle partner status (active/inactive)
export async function updatePartnerStatus(partnerId: string, status: "active" | "inactive") {
  try {
    const access = await checkAdminAccess()
    if (!access.isAdmin) return { error: access.error }

    const supabase = await createClient()

    const { error } = await supabase
      .from("partners")
      .update({ status })
      .eq("id", partnerId)

    if (error) {
      console.error("Error updating partner status:", error)
      return { error: error.message }
    }

    revalidatePath("/admin/partners")
    return { success: true }
  } catch (err: any) {
    console.error("updatePartnerStatus Exception:", err)
    return { error: "An unexpected error occurred." }
  }
}

// Record a partner payout (admin records payment)
export async function recordPartnerPayout(partnerId: string, amount: number) {
  try {
    const access = await checkAdminAccess()
    if (!access.isAdmin) return { error: access.error }

    const supabase = await createClient()

    // Get current paid amount
    const { data: partner, error: fetchError } = await supabase
      .from("partners")
      .select("total_paid")
      .eq("id", partnerId)
      .single()

    if (fetchError || !partner) {
      return { error: "Partner not found." }
    }

    const newTotalPaid = Number(partner.total_paid || 0) + amount

    const { error: updateError } = await supabase
      .from("partners")
      .update({ total_paid: newTotalPaid })
      .eq("id", partnerId)

    if (updateError) {
      console.error("Error updating partner payout:", updateError)
      return { error: updateError.message }
    }

    // Insert payout ledger record
    const { error: insertError } = await supabase
      .from("partner_payouts")
      .insert({
        partner_id: partnerId,
        amount: amount
      })

    if (insertError) {
      console.error("Error inserting partner payout ledger record:", insertError)
      return { error: `Failed to create payout ledger record: ${insertError.message}` }
    }

    revalidatePath("/admin/partners")
    return { success: true }
  } catch (err: any) {
    console.error("recordPartnerPayout Exception:", err)
    return { error: "An unexpected error occurred." }
  }
}

// Delete a Referral Partner (admin only)
export async function deletePartner(partnerId: string) {
  try {
    const access = await checkAdminAccess()
    if (!access.isAdmin) return { error: access.error }

    const supabase = await createClient()

    const { error } = await supabase
      .from("partners")
      .delete()
      .eq("id", partnerId)

    if (error) {
      console.error("Error deleting partner:", error)
      return { error: error.message }
    }

    revalidatePath("/admin/partners")
    return { success: true }
  } catch (err: any) {
    console.error("deletePartner Exception:", err)
    return { error: "An unexpected error occurred." }
  }
}

