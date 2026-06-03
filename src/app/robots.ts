import type { MetadataRoute } from "next"

const siteUrl = "https://www.buykarlo.in"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/explore", "/electronics", "/books", "/cycles", "/dorm-decor", "/item/", "/policies/"],
      disallow: [
        "/admin",
        "/cart",
        "/dashboard",
        "/login",
        "/messages",
        "/onboarding",
        "/profile",
        "/register",
        "/sell",
        "/api",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}
