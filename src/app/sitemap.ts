import type { MetadataRoute } from "next"
import { createClient } from "@supabase/supabase-js"

const siteUrl = "https://www.buykarlo.in"

export const revalidate = 3600 // Cache and revalidate sitemap every hour

const staticRoutes = [
  "/",
  "/explore",
  "/electronics",
  "/books",
  "/cycles",
  "/dorm-decor",
  "/policies/terms-of-use",
  "/policies/privacy-policy",
  "/policies/safety-guidelines",
  "/policies/seller-guidelines",
  "/policies/prohibited-products-policy",
  "/policies/ai-listing-content-policy",
  "/policies/community-guidelines",
  "/policies/ip-takedown-policy",
  "/policies/grievance-redressal-policy",
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  const lastModified = new Date()

  // Initialize with static routes
  const sitemapEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified,
    changeFrequency: route === "/" ? "daily" : "weekly",
    priority: route === "/" ? 1.0 : (route.startsWith("/policies") ? 0.5 : 0.8),
  }))

  // Try to append active product listings dynamically
  if (url && anonKey && url !== "your-supabase-project-url" && url.startsWith("http")) {
    try {
      const supabase = createClient(url, anonKey)
      const { data: listings, error } = await supabase
        .from("listings")
        .select("slug, updated_at")
        .eq("status", "active")
        .order("created_at", { ascending: false })

      if (!error && listings) {
        listings.forEach((listing) => {
          if (listing.slug) {
            sitemapEntries.push({
              url: `${siteUrl}/item/${listing.slug}`,
              lastModified: listing.updated_at ? new Date(listing.updated_at) : lastModified,
              changeFrequency: "weekly",
              priority: 0.7,
            })
          }
        })
      } else {
        console.error("Sitemap dynamic listing fetch error:", error)
      }
    } catch (e) {
      console.error("Sitemap generation exception:", e)
    }
  }

  return sitemapEntries
}
