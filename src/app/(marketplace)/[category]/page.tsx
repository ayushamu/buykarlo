export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getActiveListings } from "@/features/listings/actions"
import CategoryClientPage from "./_components/CategoryClientPage"

// ─── Whitelisted category slugs ──────────────────────────────────────────────
const CATEGORY_META: Record<
  string,
  { name: string; description: string; emoji: string }
> = {
  electronics: {
    name: "Electronics",
    description:
      "Buy and sell second-hand laptops, tablets, chargers, earphones and more from verified AMU students.",
    emoji: "💻",
  },
  books: {
    name: "Books & Notes",
    description:
      "Find affordable textbooks, fiction, notes and study material from fellow AMU students.",
    emoji: "📚",
  },
  cycles: {
    name: "Cycles & Bikes",
    description:
      "Browse campus-grade cycles, MTBs and city bikes listed by AMU students at fair prices.",
    emoji: "🚲",
  },
  "dorm-decor": {
    name: "Dorm Decor",
    description:
      "Discover lamps, rugs, curtains, mirrors and dorm essentials from AMU hostel students.",
    emoji: "🛏️",
  },
}

// ─── Dynamic metadata ─────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>
}): Promise<Metadata> {
  const { category } = await params
  const meta = CATEGORY_META[category]

  if (!meta) {
    return {
      title: "Category Not Found | BuyKarlo",
    }
  }

  const title = `${meta.emoji} ${meta.name} for Sale at AMU | BuyKarlo`
  const description = meta.description

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://www.buykarlo.in/${category}`,
      siteName: "BuyKarlo",
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    alternates: {
      canonical: `https://www.buykarlo.in/${category}`,
    },
  }
}

// ─── Page (Server Component) ──────────────────────────────────────────────────
export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>
}) {
  const { category } = await params
  const meta = CATEGORY_META[category]

  if (!meta) {
    notFound()
  }

  // Pre-fetch listings server-side for fast initial render + SEO crawlability
  const result = await getActiveListings(category)
  const initialListings = result.listings ?? []

  // JSON-LD BreadcrumbList for Google rich results
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "BuyKarlo Marketplace",
        item: "https://www.buykarlo.in",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: meta.name,
        item: `https://www.buykarlo.in/${category}`,
      },
    ],
  }

  return (
    <>
      {/* Inject JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Client component handles interactivity (search/filter/campus) */}
      <CategoryClientPage
        categorySlug={category}
        categoryName={meta.name}
        categoryDescription={meta.description}
        categoryEmoji={meta.emoji}
        initialListings={initialListings}
      />
    </>
  )
}
