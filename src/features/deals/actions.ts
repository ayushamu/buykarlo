"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { sendReviewReminderEmail } from "@/lib/email"

/**
 * Fetches the list of students who have messaged the seller about a specific listing.
 * This is used to populate the "Who did you sell this to?" selection modal.
 */
export async function getListingChatPartners(listingId: string) {
  try {
    const supabase = await createClient()

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: "Unauthorized. Please log in." }
    }

    // 2. Fetch conversations for this listing where the user is the seller
    const { data: conversations, error: fetchError } = await supabase
      .from("conversations")
      .select(`
        buyer_id,
        buyer:buyer_id (
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .eq("listing_id", listingId)
      .eq("seller_id", user.id)

    if (fetchError) {
      console.error("Error fetching listing chat partners:", fetchError)
      return { error: "Failed to load chat partners." }
    }

    // Map and filter unique profiles
    const partners = conversations
      ?.map((c: any) => {
        const profile = Array.isArray(c.buyer) ? c.buyer[0] : c.buyer
        return profile
      })
      .filter((p): p is any => p !== null && p !== undefined) || []

    return { success: true, partners }
  } catch (err: any) {
    console.error("getListingChatPartners exception:", err)
    return { error: err.message || "An unexpected error occurred." }
  }
}

/**
 * Completes a deal: marks the listing as "sold", inserts a deal transaction record,
 * boosts the seller's trust score by +5 points, and dispatches review reminder emails via Resend.
 */
export async function completeDeal(listingId: string, buyerId: string | null) {
  try {
    const supabase = await createClient()

    // 1. Authenticate user
    const { data: { user: sellerUser }, error: authError } = await supabase.auth.getUser()
    if (authError || !sellerUser) {
      return { error: "Unauthorized. Please log in first." }
    }

    // 2. Fetch the listing details and verify ownership
    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("id, title, price, seller_id, status")
      .eq("id", listingId)
      .single()

    if (listingError || !listing) {
      return { error: "Listing not found." }
    }

    if (listing.seller_id !== sellerUser.id) {
      return { error: "Permission denied. You do not own this listing." }
    }

    if (listing.status === "sold") {
      return { error: "Listing is already marked as sold." }
    }

    // 3. Update listing status to 'sold'
    const { error: updateListingError } = await supabase
      .from("listings")
      .update({ status: "sold" })
      .eq("id", listingId)

    if (updateListingError) {
      console.error("Failed to update listing status:", updateListingError)
      return { error: "Failed to mark listing as sold." }
    }

    // 4. Create the Deal record
    const { data: deal, error: dealError } = await supabase
      .from("deals")
      .insert({
        listing_id: listingId,
        seller_id: sellerUser.id,
        buyer_id: buyerId,
        price: listing.price,
        status: "completed"
      })
      .select("id")
      .single()

    if (dealError || !deal) {
      console.error("Failed to create deal record:", dealError)
      // Note: We don't rollback status update to avoid user frustration, but we report the error.
      return { error: "Failed to record transaction deal." }
    }

    // 5. Boost Seller Trust Score (+5 points, capped at 100)
    const { data: sellerProfile } = await supabase
      .from("profiles")
      .select("trust_score, full_name, email")
      .eq("id", sellerUser.id)
      .single()

    if (sellerProfile) {
      const currentScore = sellerProfile.trust_score || 50
      const newScore = Math.min(currentScore + 5, 100)

      await supabase
        .from("profiles")
        .update({ trust_score: newScore })
        .eq("id", sellerUser.id)
    }

    // 6. Trigger emails asynchronously via Resend (only if sold to a BuyKarlo buyer)
    if (buyerId && sellerProfile) {
      const { data: buyerProfile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", buyerId)
        .single()

      if (buyerProfile && buyerProfile.email) {
        const sellerName = sellerProfile.full_name || "Campus Seller"
        const buyerName = buyerProfile.full_name || "Campus Buyer"

        // Send reminder email to buyer
        sendReviewReminderEmail(
          buyerProfile.email,
          sellerName,
          listing.title,
          deal.id,
          "buyer"
        ).catch((err) => console.error("Error sending review email to buyer:", err))

        // Send reminder email to seller
        if (sellerProfile.email) {
          sendReviewReminderEmail(
            sellerProfile.email,
            buyerName,
            listing.title,
            deal.id,
            "seller"
          ).catch((err) => console.error("Error sending review email to seller:", err))
        }
      }
    }

    // Revalidate paths
    revalidatePath("/")
    revalidatePath("/dashboard")
    revalidatePath("/dashboard/listings")
    revalidatePath("/messages")

    return { success: true, dealId: deal.id }
  } catch (err: any) {
    console.error("completeDeal exception:", err)
    return { error: err.message || "An unexpected error occurred." }
  }
}

/**
 * Submits a rating review for a specific deal transaction.
 * Also adjusts the reviewee's trust score based on the rating:
 * - 5 stars: +3 points
 * - 4 stars: +1 point
 * - 3 stars: 0 points
 * - 1-2 stars: -5 points
 */
export async function submitReview(input: {
  dealId: string
  rating: number
  comment: string
}) {
  try {
    const supabase = await createClient()

    // 1. Authenticate reviewer
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: "Unauthorized. Please log in first." }
    }

    // 2. Fetch the deal to verify details
    const { data: deal, error: dealError } = await supabase
      .from("deals")
      .select(`
        id,
        seller_id,
        buyer_id,
        listings (
          title
        )
      `)
      .eq("id", input.dealId)
      .single()

    if (dealError || !deal) {
      return { error: "Transaction deal not found." }
    }

    // 3. Determine roles
    const isSeller = deal.seller_id === user.id
    const isBuyer = deal.buyer_id === user.id

    if (!isSeller && !isBuyer) {
      return { error: "Permission denied. You are not a participant in this deal." }
    }

    const reviewerId = user.id
    const revieweeId = isSeller ? deal.buyer_id : deal.seller_id
    const role = isSeller ? "seller" : "buyer"

    if (!revieweeId) {
      return { error: "Cannot submit a review for an offline transaction without a registered buyer." }
    }

    // 4. Check if review already submitted
    const { data: existingReview } = await supabase
      .from("reviews")
      .select("id")
      .eq("deal_id", input.dealId)
      .eq("reviewer_id", reviewerId)
      .maybeSingle()

    if (existingReview) {
      return { error: "You have already submitted a review for this transaction." }
    }

    // 5. Insert review record
    const { error: insertError } = await supabase
      .from("reviews")
      .insert({
        deal_id: input.dealId,
        reviewer_id: reviewerId,
        reviewee_id: revieweeId,
        role: role,
        rating: input.rating,
        comment: input.comment.trim()
      })

    if (insertError) {
      console.error("Failed to insert review:", insertError)
      return { error: "Failed to submit review." }
    }

    // 6. Adjust reviewee's trust score
    const { data: revieweeProfile } = await supabase
      .from("profiles")
      .select("trust_score")
      .eq("id", revieweeId)
      .single()

    if (revieweeProfile) {
      const currentScore = revieweeProfile.trust_score || 50
      let adjustment = 0

      if (input.rating === 5) {
        adjustment = 3
      } else if (input.rating === 4) {
        adjustment = 1
      } else if (input.rating <= 2) {
        adjustment = -5
      }

      const newScore = Math.max(0, Math.min(currentScore + adjustment, 100))

      await supabase
        .from("profiles")
        .update({ trust_score: newScore })
        .eq("id", revieweeId)
    }

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/trust")

    return { success: true }
  } catch (err: any) {
    console.error("submitReview exception:", err)
    return { error: err.message || "An unexpected error occurred." }
  }
}

/**
 * Fetches completed deals that require a review from the current authenticated user.
 */
export async function getPendingReviews() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: "Unauthorized." }
    }

    // Fetch deals where user is buyer or seller
    const { data: deals, error: fetchError } = await supabase
      .from("deals")
      .select(`
        id,
        created_at,
        seller_id,
        buyer_id,
        price,
        seller:seller_id (id, full_name, avatar_url),
        buyer:buyer_id (id, full_name, avatar_url),
        listing:listing_id (id, title, status)
      `)
      .or(`seller_id.eq.${user.id},buyer_id.eq.${user.id}`)
      .not("buyer_id", "is", null) // Offline/anonymous sales don't need reviews

    if (fetchError) {
      console.error("Error fetching deals for pending reviews:", fetchError)
      return { error: "Failed to fetch transaction deals." }
    }

    // Fetch reviews submitted by this user
    const { data: reviews, error: reviewError } = await supabase
      .from("reviews")
      .select("deal_id")
      .eq("reviewer_id", user.id)

    if (reviewError) {
      console.error("Error fetching reviews:", reviewError)
      return { error: "Failed to fetch reviews." }
    }

    const reviewedDealIds = new Set(reviews?.map((r) => r.deal_id) || [])

    // Filter deals that DO NOT have a review from this user yet
    const pending = (deals || [])
      .filter((d: any) => !reviewedDealIds.has(d.id))
      .map((d: any) => {
        const isSeller = d.seller_id === user.id
        const otherParty = isSeller 
          ? (Array.isArray(d.buyer) ? d.buyer[0] : d.buyer)
          : (Array.isArray(d.seller) ? d.seller[0] : d.seller)
        
        const listing = Array.isArray(d.listing) ? d.listing[0] : d.listing

        return {
          dealId: d.id,
          createdAt: d.created_at,
          listingTitle: listing?.title || "Marketplace Gear",
          otherPartyName: otherParty?.full_name || "Campus Student",
          otherPartyAvatar: otherParty?.avatar_url,
          role: isSeller ? "seller" : "buyer"
        }
      })

    return { success: true, pending }
  } catch (err: any) {
    console.error("getPendingReviews exception:", err)
    return { error: err.message || "An unexpected error occurred." }
  }
}

/**
 * Fetches the specific transaction detail for rendering a Review form.
 * Ensures the requesting user is a legitimate participant (buyer/seller) in the deal.
 */
export async function getDealDetailsForReview(dealId: string) {
  try {
    const supabase = await createClient()

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: "Unauthorized. Please log in first." }
    }

    // 2. Fetch the deal record
    const { data: deal, error: dealError } = await supabase
      .from("deals")
      .select(`
        id,
        price,
        created_at,
        seller_id,
        buyer_id,
        seller:seller_id (id, full_name, avatar_url),
        buyer:buyer_id (id, full_name, avatar_url),
        listing:listing_id (id, title)
      `)
      .eq("id", dealId)
      .single()

    if (dealError || !deal) {
      return { error: "Transaction deal not found." }
    }

    // 3. Verify user is participant
    const isSeller = deal.seller_id === user.id
    const isBuyer = deal.buyer_id === user.id

    if (!isSeller && !isBuyer) {
      return { error: "Access denied. You are not a participant in this transaction." }
    }

    // 4. Check if this user already submitted a review
    const { data: existingReview } = await supabase
      .from("reviews")
      .select("id")
      .eq("deal_id", dealId)
      .eq("reviewer_id", user.id)
      .maybeSingle()

    const otherParty = isSeller 
      ? (Array.isArray(deal.buyer) ? deal.buyer[0] : deal.buyer)
      : (Array.isArray(deal.seller) ? deal.seller[0] : deal.seller)

    const listing = Array.isArray(deal.listing) ? deal.listing[0] : deal.listing

    return {
      success: true,
      deal: {
        id: deal.id,
        listingTitle: listing?.title || "Marketplace Gear",
        price: deal.price,
        createdAt: deal.created_at,
        role: isSeller ? "seller" : "buyer",
        otherPartyName: otherParty?.full_name || "Campus Student",
        otherPartyAvatar: otherParty?.avatar_url,
        alreadyReviewed: !!existingReview
      }
    }
  } catch (err: any) {
    console.error("getDealDetailsForReview exception:", err)
    return { error: err.message || "An unexpected error occurred." }
  }
}

