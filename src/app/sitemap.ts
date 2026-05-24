import type { MetadataRoute } from "next"

const siteUrl = "https://buykarlo.in"

const publicRoutes = ["", "/explore", "/electronics", "/books", "/cycles", "/dorm-decor"]

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  return publicRoutes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified,
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.8,
  }))
}
