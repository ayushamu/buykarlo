"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

interface CreateListingInput {
  title: string
  description: string
  price: number
  categorySlug: string
  condition: "new" | "like_new" | "good" | "fair" | "poor"
  campus?: string
  department?: string
  imageUrls: string[]
}

export async function createListing(input: CreateListingInput) {
  try {
    const supabase = await createClient()

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: "Unauthorized. Please log in first." }
    }

    // 2. Fetch category ID from slug
    const { data: categoryData, error: catError } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", input.categorySlug)
      .maybeSingle()

    if (catError) {
      console.error("Category Fetch Error:", catError)
      return { error: `Database error finding category: ${catError.message}` }
    }

    if (!categoryData) {
      return { error: `Selected category "${input.categorySlug}" does not exist in the database. Please verify your categories table.` }
    }

    // 3. Generate a unique web URL slug
    const baseSlug = input.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-") // replace non-alphanumeric characters with hyphens
      .replace(/(^-|-$)+/g, "") // remove leading/trailing hyphens
    
    const slug = `${baseSlug || "item"}-${crypto.randomUUID().slice(0, 8)}`

    // Fetch profile university to default
    const { data: profile } = await supabase
      .from("profiles")
      .select("university")
      .eq("id", user.id)
      .maybeSingle()

    const userCampus = input.campus || profile?.university || "Aligarh Muslim University"

    // 4. Write listing to Supabase Database
    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .insert({
        seller_id: user.id,
        category_id: categoryData.id,
        title: input.title.trim(),
        slug,
        description: input.description.trim(),
        price: input.price,
        condition: input.condition,
        status: "active",
        campus: userCampus,
        metadata: input.department ? { department: input.department.trim() } : {},
      })
      .select("id")
      .single()

    if (listingError || !listing) {
      console.error("Listing Creation Database Error:", listingError)
      return { error: "Failed to create listing record in the database." }
    }

    // 5. Write R2 Image CDN links to listing_images table
    if (input.imageUrls && input.imageUrls.length > 0) {
      const imagePayloads = input.imageUrls.map((url, index) => ({
        listing_id: listing.id,
        storage_path: url,
        display_order: index,
      }))

      const { error: imageInsertError } = await supabase
        .from("listing_images")
        .insert(imagePayloads)

      if (imageInsertError) {
        console.error("Failed to associate images to listing:", imageInsertError)
        // Note: The listing itself is created, so we return success but note the failure
      }
    }

    // 6. Revalidate homepage and explore cache
    revalidatePath("/")
    revalidatePath("/explore")

    return { success: true, listingId: listing.id }
  } catch (error) {
    console.error("createListing Server Action Exception:", error)
    return { error: "An unexpected error occurred while listing your product." }
  }
}

export async function getSellerDashboardData() {
  try {
    const supabase = await createClient()

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: "Unauthorized. Please log in first." }
    }

    // 2. Fetch profile details
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, avatar_url, university, department, trust_score, created_at")
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error("Error fetching profile:", profileError)
    }

    // 3. Fetch user's listings
    const { data: listings, error: listingsError } = await supabase
      .from("listings")
      .select(`
        id,
        title,
        price,
        status,
        view_count,
        created_at,
        category:categories(name, slug),
        images:listing_images(storage_path, display_order)
      `)
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false })

    if (listingsError) {
      console.error("Error fetching listings:", listingsError)
      return { error: `Database error: ${listingsError.message}` }
    }

    // 4. Fetch conversations for the seller's listings
    const { data: conversations, error: convError } = await supabase
      .from("conversations")
      .select("id, listing_id")
      .eq("seller_id", user.id)

    if (convError) {
      console.error("Error fetching conversations:", convError)
    }

    // Map conversation counts
    const conversationCounts: Record<string, number> = {}
    conversations?.forEach(c => {
      conversationCounts[c.listing_id] = (conversationCounts[c.listing_id] || 0) + 1
    })

    // Calculate statistics
    const activeListings = listings?.filter(l => l.status === "active") || []
    const soldListings = listings?.filter(l => l.status === "sold") || []
    const deactivatedListings = listings?.filter(l => l.status === "hidden") || []

    const totalViews = listings?.reduce((sum, l) => sum + (l.view_count || 0), 0) || 0
    const totalEarnings = soldListings.reduce((sum, l) => sum + (Number(l.price) || 0), 0)

    // Format listings with their image and category
    const formattedListings = listings?.map(l => {
      // Find main image (lowest display order)
      const sortedImages = l.images ? [...l.images].sort((a: any, b: any) => a.display_order - b.display_order) : []
      const imageUrl = sortedImages.length > 0 ? sortedImages[0].storage_path : null

      return {
        id: l.id,
        title: l.title,
        price: Number(l.price),
        status: l.status,
        viewCount: l.view_count || 0,
        createdAt: l.created_at,
        categoryName: (l.category as any)?.name || "Uncategorized",
        categorySlug: (l.category as any)?.slug || "",
        imageUrl,
        activeChats: conversationCounts[l.id] || 0
      }
    }) || []

    return {
      success: true,
      profile,
      stats: {
        activeCount: activeListings.length,
        soldCount: soldListings.length,
        deactivatedCount: deactivatedListings.length,
        totalEarnings,
        totalViews,
        pendingChats: conversations?.length || 0,
      },
      listings: formattedListings
    }
  } catch (error) {
    console.error("getSellerDashboardData Exception:", error)
    return { error: "An unexpected error occurred while fetching dashboard details." }
  }
}

export async function updateListingStatus(id: string, status: "active" | "sold" | "hidden") {
  try {
    const supabase = await createClient()

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: "Unauthorized. Please log in first." }
    }

    // 2. Verify ownership of the listing
    const { data: listing, error: fetchError } = await supabase
      .from("listings")
      .select("seller_id")
      .eq("id", id)
      .single()

    if (fetchError || !listing) {
      return { error: "Listing not found." }
    }

    if (listing.seller_id !== user.id) {
      return { error: "Permission denied. You do not own this listing." }
    }

    // 3. Update status
    const { error: updateError } = await supabase
      .from("listings")
      .update({ status })
      .eq("id", id)

    if (updateError) {
      console.error("Error updating listing status:", updateError)
      return { error: "Failed to update listing status." }
    }

    // Boost trust score on successful sale
    if (status === "sold") {
      const { data: profile } = await supabase
        .from("profiles")
        .select("trust_score")
        .eq("id", user.id)
        .single()
      
      if (profile) {
        const currentScore = profile.trust_score || 50
        const newScore = Math.min(currentScore + 5, 100)
        
        await supabase
          .from("profiles")
          .update({ trust_score: newScore })
          .eq("id", user.id)
      }
    }

    // 4. Revalidate paths
    revalidatePath("/")
    revalidatePath("/explore")
    revalidatePath("/dashboard")

    return { success: true }
  } catch (error) {
    console.error("updateListingStatus Exception:", error)
    return { error: "An unexpected error occurred while updating the listing." }
  }
}

export async function deleteListing(id: string) {
  try {
    const supabase = await createClient()

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: "Unauthorized. Please log in first." }
    }

    // 2. Verify ownership of the listing
    const { data: listing, error: fetchError } = await supabase
      .from("listings")
      .select("seller_id")
      .eq("id", id)
      .single()

    if (fetchError || !listing) {
      return { error: "Listing not found." }
    }

    if (listing.seller_id !== user.id) {
      return { error: "Permission denied. You do not own this listing." }
    }

    // 3. Delete listing (associated images are deleted via cascade reference in DB)
    const { error: deleteError } = await supabase
      .from("listings")
      .delete()
      .eq("id", id)

    if (deleteError) {
      console.error("Error deleting listing:", deleteError)
      return { error: "Failed to delete listing." }
    }

    // 4. Revalidate paths
    revalidatePath("/")
    revalidatePath("/explore")
    revalidatePath("/dashboard")

    return { success: true }
  } catch (error) {
    console.error("deleteListing Exception:", error)
    return { error: "An unexpected error occurred while deleting the listing." }
  }
}

export async function getActiveListings(categorySlug?: string, campus?: string) {
  const startTime = performance.now();
  console.log(`[getActiveListings] Start: categorySlug=${categorySlug}, campus=${campus}`);
  try {
    const clientStart = performance.now();
    const supabase = await createClient();
    const clientEnd = performance.now();
    console.log(`[getActiveListings] Supabase client created in ${(clientEnd - clientStart).toFixed(2)}ms`);

    let query = supabase
      .from("listings")
      .select(`
        id,
        slug,
        title,
        price,
        condition,
        campus,
        metadata,
        category:categories(slug),
        images:listing_images(storage_path, display_order),
        profiles:seller_id(department, trust_score)
      `)
      .eq("status", "active")

    if (campus && campus !== "all") {
      query = query.eq("campus", campus)
    }

    if (categorySlug && categorySlug !== "all") {
      const catStart = performance.now();
      // Fetch category ID from slug
      const { data: categoryData } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", categorySlug)
        .maybeSingle()
      console.log(`[getActiveListings] Category lookup for "${categorySlug}" took ${(performance.now() - catStart).toFixed(2)}ms`);
      
      if (categoryData) {
        query = query.eq("category_id", categoryData.id)
      } else {
        console.log(`[getActiveListings] Category "${categorySlug}" not found. Total time: ${(performance.now() - startTime).toFixed(2)}ms`);
        // Category doesn't exist, return empty listings list
        return { success: true, listings: [] }
      }
    }

    const queryStart = performance.now();
    const { data: listings, error } = await query.order("created_at", { ascending: false })
    const queryEnd = performance.now();
    console.log(`[getActiveListings] DB Query took ${(queryEnd - queryStart).toFixed(2)}ms, returned ${listings?.length || 0} listings`);

    if (error) {
      console.error("Error fetching active listings:", error)
      return { error: `Database error: ${error.message}` }
    }

    // Format listings for feed
    const formatStart = performance.now();
    const formatted = listings?.map(l => {
      const sortedImages = l.images ? [...l.images].sort((a: any, b: any) => a.display_order - b.display_order) : []
      const imageUrl = sortedImages.length > 0 ? sortedImages[0].storage_path : null
      const sellerDepartment = (l.profiles as any)?.department || (l.metadata as any)?.department || null

      return {
        id: l.id,
        slug: l.slug,
        title: l.title,
        price: Number(l.price),
        condition: l.condition,
        imageUrl,
        sellerDepartment,
        campus: l.campus,
        sellerTrustScore: (l.profiles as any)?.trust_score || 0
      }
    }) || []
    console.log(`[getActiveListings] Formatting took ${(performance.now() - formatStart).toFixed(2)}ms`);
    console.log(`[getActiveListings] Total execution time: ${(performance.now() - startTime).toFixed(2)}ms`);

    return { success: true, listings: formatted }
  } catch (error) {
    console.error("getActiveListings Exception:", error)
    return { error: "An unexpected error occurred while fetching listings." }
  }
}

export async function getSellerOrdersData() {
  try {
    const supabase = await createClient()

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: "Unauthorized. Please log in first." }
    }

    // 2. Fetch sales (listings owned by user with status = 'sold')
    const { data: sales, error: salesError } = await supabase
      .from("listings")
      .select(`
        id,
        title,
        price,
        status,
        created_at,
        category:categories(name, slug),
        images:listing_images(storage_path, display_order)
      `)
      .eq("seller_id", user.id)
      .eq("status", "sold")
      .order("created_at", { ascending: false })

    if (salesError) {
      console.error("Error fetching sales:", salesError)
      return { error: `Database error: ${salesError.message}` }
    }

    // Fetch conversations for these sales to identify buyers
    const saleIds = sales?.map(s => s.id) || []
    let conversations: any[] = []
    if (saleIds.length > 0) {
      const { data, error } = await supabase
        .from("conversations")
        .select(`
          id,
          listing_id,
          buyer:profiles!conversations_buyer_id_fkey(full_name, avatar_url)
        `)
        .in("listing_id", saleIds)
      
      if (!error && data) {
        conversations = data
      }
    }

    const buyerMap: Record<string, { full_name: string | null, avatar_url: string | null }> = {}
    conversations.forEach(c => {
      if (c.buyer) {
        buyerMap[c.listing_id] = c.buyer
      }
    })

    // Format sales
    const formattedSales = sales?.map(s => {
      const sortedImages = s.images ? [...s.images].sort((a: any, b: any) => a.display_order - b.display_order) : []
      const imageUrl = sortedImages.length > 0 ? sortedImages[0].storage_path : null
      
      const buyer = buyerMap[s.id] || { full_name: "Campus Buyer", avatar_url: null }

      return {
        id: s.id,
        title: s.title,
        price: Number(s.price),
        status: "completed" as const,
        createdAt: s.created_at,
        imageUrl,
        buyerName: buyer.full_name || "Campus Buyer",
        buyerAvatar: buyer.avatar_url
      }
    }) || []

    // 3. Fetch purchases (conversations where current user is the buyer)
    const { data: buyerConvs, error: buyerConvsError } = await supabase
      .from("conversations")
      .select(`
        id,
        listing:listings(
          id,
          title,
          price,
          status,
          created_at,
          category:categories(name, slug),
          images:listing_images(storage_path, display_order),
          seller:profiles!listings_seller_id_fkey(full_name, avatar_url)
        )
      `)
      .eq("buyer_id", user.id)

    if (buyerConvsError) {
      console.error("Error fetching purchases:", buyerConvsError)
    }

    // Format purchases
    const formattedPurchases = buyerConvs
      ?.filter(c => c.listing)
      ?.map(c => {
        const listing = c.listing as any
        const sortedImages = listing.images ? [...listing.images].sort((a: any, b: any) => a.display_order - b.display_order) : []
        const imageUrl = sortedImages.length > 0 ? sortedImages[0].storage_path : null

        return {
          id: listing.id,
          title: listing.title,
          price: Number(listing.price),
          status: (listing.status === "sold" ? "completed" : "in_progress") as "completed" | "in_progress" | "cancelled",
          createdAt: listing.created_at,
          imageUrl,
          sellerName: listing.seller?.full_name || "Campus Seller",
          sellerAvatar: listing.seller?.avatar_url
        }
      }) || []

    return {
      success: true,
      sales: formattedSales,
      purchases: formattedPurchases
    }
  } catch (error) {
    console.error("getSellerOrdersData Exception:", error)
    return { error: "An unexpected error occurred while fetching orders." }
  }
}

export async function getListingBySlug(slug: string) {
  try {
    const supabase = await createClient()

    // 1. Fetch by slug
    const { data: listing, error } = await supabase
      .from("listings")
      .select(`
        id,
        slug,
        title,
        description,
        price,
        condition,
        campus,
        metadata,
        status,
        view_count,
        created_at,
        category:categories(name, slug),
        images:listing_images(storage_path, display_order),
        seller:profiles!listings_seller_id_fkey(
          id,
          full_name,
          avatar_url,
          university,
          department,
          trust_score,
          created_at
        )
      `)
      .eq("slug", slug)
      .maybeSingle()

    if (error) {
      console.error("Error fetching listing by slug:", error)
      return null
    }

    if (!listing) {
      // 2. Fallback to UUID ID lookup (in case card links to legacy uuid)
      const { data: listingById, error: errorId } = await supabase
        .from("listings")
        .select(`
          id,
          slug,
          title,
          description,
          price,
          condition,
          campus,
          metadata,
          status,
          view_count,
          created_at,
          category:categories(name, slug),
          images:listing_images(storage_path, display_order),
          seller:profiles!listings_seller_id_fkey(
            id,
            full_name,
            avatar_url,
            university,
            department,
            trust_score,
            created_at
          )
        `)
        .eq("id", slug)
        .maybeSingle()
      
      if (errorId || !listingById) {
        return null
      }
      return await formatSingleListing(listingById, supabase)
    }

    return await formatSingleListing(listing, supabase)
  } catch (err) {
    console.error("getListingBySlug exception:", err)
    return null
  }
}

async function formatSingleListing(l: any, supabase: any) {
  const sortedImages = l.images ? [...l.images].sort((a: any, b: any) => a.display_order - b.display_order) : []
  const imageUrls = sortedImages.map((img: any) => img.storage_path)
  let sellerStats = {
    activeListingsCount: 0,
    soldListingsCount: 0,
  }

  if (l.seller?.id) {
    const { data: sellerListings } = await supabase
      .from("listings")
      .select("status")
      .eq("seller_id", l.seller.id)
      .in("status", ["active", "sold"])

    if (sellerListings) {
      sellerStats = {
        activeListingsCount: sellerListings.filter((item: any) => item.status === "active").length,
        soldListingsCount: sellerListings.filter((item: any) => item.status === "sold").length,
      }
    }
  }

  return {
    id: l.id,
    slug: l.slug || l.id, // Fallback slug if empty
    title: l.title,
    description: l.description,
    price: Number(l.price),
    condition: l.condition,
    campus: l.campus,
    pickupContext: l.metadata?.department || null,
    status: l.status,
    viewCount: l.view_count || 0,
    createdAt: l.created_at,
    categoryName: l.category?.name || "Uncategorized",
    categorySlug: l.category?.slug || "",
    imageUrls,
    seller: l.seller ? {
      id: l.seller.id,
      fullName: l.seller.full_name || "Campus Seller",
      avatarUrl: l.seller.avatar_url,
      university: l.seller.university || "AMU",
      department: l.seller.department || "Student",
      trustScore: l.seller.trust_score || 50,
      createdAt: l.seller.created_at,
      ...sellerStats
    } : null
  }
}

export async function getSavedListingStatus(listingId: string) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: true, isSaved: false, isAuthenticated: false }
    }

    const { data, error } = await supabase
      .from("saved_listings")
      .select("listing_id")
      .eq("user_id", user.id)
      .eq("listing_id", listingId)
      .maybeSingle()

    if (error) {
      console.error("Error fetching saved listing status:", error)
      return { error: "Unable to fetch saved state." }
    }

    return { success: true, isSaved: !!data, isAuthenticated: true }
  } catch (error) {
    console.error("getSavedListingStatus Exception:", error)
    return { error: "Unable to fetch saved state." }
  }
}

export async function toggleSavedListing(listingId: string) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: "Please log in to save listings." }
    }

    const { data: existing, error: selectError } = await supabase
      .from("saved_listings")
      .select("listing_id")
      .eq("user_id", user.id)
      .eq("listing_id", listingId)
      .maybeSingle()

    if (selectError) {
      console.error("Error checking saved listing:", selectError)
      return { error: "Unable to update saved state." }
    }

    if (existing) {
      const { error: deleteError } = await supabase
        .from("saved_listings")
        .delete()
        .eq("user_id", user.id)
        .eq("listing_id", listingId)

      if (deleteError) {
        console.error("Error removing saved listing:", deleteError)
        return { error: "Unable to remove saved listing." }
      }

      return { success: true, isSaved: false }
    }

    const { error: insertError } = await supabase
      .from("saved_listings")
      .insert({
        user_id: user.id,
        listing_id: listingId,
      })

    if (insertError) {
      console.error("Error saving listing:", insertError)
      return { error: "Unable to save listing." }
    }

    return { success: true, isSaved: true }
  } catch (error) {
    console.error("toggleSavedListing Exception:", error)
    return { error: "Unable to update saved state." }
  }
}

export interface UpdateListingInput {
  id: string
  title: string
  description: string
  price: number
  categorySlug: string
  condition: "new" | "like_new" | "good" | "fair" | "poor"
  campus?: string
  department?: string
  imageUrls: string[]
}

export async function getListingForEdit(id: string) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: "Unauthorized. Please log in first." }
    }

    const { data: listing, error } = await supabase
      .from("listings")
      .select(`
        id,
        seller_id,
        title,
        description,
        price,
        condition,
        campus,
        metadata,
        category:categories(slug),
        images:listing_images(storage_path, display_order)
      `)
      .eq("id", id)
      .single()

    if (error || !listing) {
      return { error: "Listing not found." }
    }

    if (listing.seller_id !== user.id) {
      return { error: "Permission denied. You do not own this listing." }
    }

    const sortedImages = listing.images ? [...listing.images].sort((a: any, b: any) => a.display_order - b.display_order) : []
    const imageUrls = sortedImages.map((img: any) => img.storage_path)

    const categoryObj = Array.isArray(listing.category) ? listing.category[0] : (listing.category || null)
    const categorySlug = (categoryObj as any)?.slug || ""

    return {
      success: true,
      listing: {
        id: listing.id,
        title: listing.title,
        description: listing.description || "",
        price: Number(listing.price),
        condition: listing.condition,
        campus: listing.campus,
        department: (listing.metadata as any)?.department || "",
        categorySlug,
        imageUrls,
      }
    }
  } catch (err) {
    console.error("getListingForEdit Exception:", err)
    return { error: "An unexpected error occurred while loading your listing." }
  }
}

export async function updateListing(input: UpdateListingInput) {
  try {
    const supabase = await createClient()

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: "Unauthorized. Please log in first." }
    }

    // 2. Fetch listing to verify ownership & get current slug
    const { data: listing, error: fetchError } = await supabase
      .from("listings")
      .select("seller_id, slug")
      .eq("id", input.id)
      .single()

    if (fetchError || !listing) {
      return { error: "Listing not found." }
    }

    if (listing.seller_id !== user.id) {
      return { error: "Permission denied. You do not own this listing." }
    }

    // 3. Fetch category ID from slug
    const { data: categoryData, error: catError } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", input.categorySlug)
      .maybeSingle()

    if (catError || !categoryData) {
      return { error: `Database error or category "${input.categorySlug}" not found.` }
    }

    // 4. Update listing row
    const { error: updateError } = await supabase
      .from("listings")
      .update({
        category_id: categoryData.id,
        title: input.title.trim(),
        description: input.description.trim(),
        price: input.price,
        condition: input.condition,
        campus: input.campus || "Aligarh Muslim University",
        metadata: input.department ? { department: input.department.trim() } : {},
      })
      .eq("id", input.id)

    if (updateError) {
      console.error("Listing Update Database Error:", updateError)
      return { error: "Failed to update listing in database." }
    }

    // 5. Update images (delete existing & re-insert)
    const { error: deleteImagesError } = await supabase
      .from("listing_images")
      .delete()
      .eq("listing_id", input.id)

    if (deleteImagesError) {
      console.error("Failed to clear old listing images:", deleteImagesError)
    }

    if (input.imageUrls && input.imageUrls.length > 0) {
      const imagePayloads = input.imageUrls.map((url, index) => ({
        listing_id: input.id,
        storage_path: url,
        display_order: index,
      }))

      const { error: imageInsertError } = await supabase
        .from("listing_images")
        .insert(imagePayloads)

      if (imageInsertError) {
        console.error("Failed to insert new listing images:", imageInsertError)
      }
    }

    // 6. Revalidate caches
    revalidatePath("/")
    revalidatePath("/explore")
    revalidatePath("/dashboard/listings")
    revalidatePath(`/item/${listing.slug}`)

    return { success: true }
  } catch (error) {
    console.error("updateListing Server Action Exception:", error)
    return { error: "An unexpected error occurred while saving your product." }
  }
}



