"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function toggleSaveListing(listingId: string) {
  try {
    const supabase = await createClient()

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: "Unauthorized. Please log in first." }
    }

    // 2. Check if already saved
    const { data: existing, error: findError } = await supabase
      .from("saved_listings")
      .select("listing_id")
      .eq("user_id", user.id)
      .eq("listing_id", listingId)
      .maybeSingle()

    if (findError) {
      console.error("Error finding saved listing:", findError)
      return { error: "Database error." }
    }

    let isSaved = false

    if (existing) {
      // Delete record (unsave)
      const { error: deleteError } = await supabase
        .from("saved_listings")
        .delete()
        .eq("user_id", user.id)
        .eq("listing_id", listingId)

      if (deleteError) {
        console.error("Error deleting saved listing:", deleteError)
        return { error: "Failed to remove item." }
      }
      isSaved = false
    } else {
      // Insert record (save)
      const { error: insertError } = await supabase
        .from("saved_listings")
        .insert({
          user_id: user.id,
          listing_id: listingId
        })

      if (insertError) {
        console.error("Error inserting saved listing:", insertError)
        return { error: "Failed to save item." }
      }
      isSaved = true
    }

    revalidatePath("/cart")
    revalidatePath("/")

    return { success: true, isSaved }
  } catch (error) {
    console.error("toggleSaveListing Exception:", error)
    return { error: "An unexpected error occurred." }
  }
}

export async function getSavedListings() {
  try {
    const supabase = await createClient()

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: "Unauthorized. Please log in first." }
    }

    // 2. Query saved listings joined with listing details
    const { data, error } = await supabase
      .from("saved_listings")
      .select(`
        listing_id,
        listing:listings(
          id,
          slug,
          title,
          price,
          condition,
          status,
          images:listing_images(storage_path, display_order),
          profiles:seller_id(department, email)
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching saved listings:", error)
      return { error: error.message }
    }

    // Format listing objects
    const formatted = (data || [])
      .filter((s: any) => s.listing && s.listing.status === "active")
      .map((s: any) => {
        const l = s.listing
        const sortedImages = l.images ? [...l.images].sort((a: any, b: any) => a.display_order - b.display_order) : []
        const imageUrl = sortedImages.length > 0 ? sortedImages[0].storage_path : null
        const sellerDepartment = (l.profiles as any)?.department || null

        return {
          id: l.id,
          slug: l.slug,
          title: l.title,
          price: Number(l.price),
          condition: l.condition,
          imageUrl,
          sellerDepartment,
          isTrustedSeller: ["buykarlo.official@gmail.com", "help@buykarlo.in"].includes((l.profiles as any)?.email)
        }
      })

    return { success: true, listings: formatted }
  } catch (error) {
    console.error("getSavedListings Exception:", error)
    return { error: "An unexpected error occurred." }
  }
}
