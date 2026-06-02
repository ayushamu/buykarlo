import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  AlertCircle,
  BadgeCheck,
  CheckCircle2,
  ChevronRight,
  MessageSquare,
  ShieldCheck,
  Star,
} from "lucide-react"
import { getActiveListings, getListingBySlug, getSavedListingStatus } from "@/features/listings/actions"
import { ProductInteraction } from "./_components/ProductInteraction"

interface PageProps {
  params: Promise<{ slug: string }>
}

function getChecklist(categorySlug: string, condition: string) {
  const shared = [
    "Inspect the actual item before making payment.",
    "Confirm included accessories and meetup details in chat.",
    "Meet only at a safe, public campus spot.",
  ]

  if (categorySlug === "electronics") {
    return [
      "Check battery, charging, ports, buttons, and visible wear.",
      "Ask about repairs, replacement parts, and included charger or box.",
      condition === "fair" ? "Look extra carefully for dents, heat issues, or cosmetic damage." : "Confirm how heavily it was used and why it is being sold.",
      ...shared,
    ]
  }

  if (categorySlug === "books") {
    return [
      "Check for missing pages, water damage, and heavy markings.",
      "Confirm edition, semester fit, and whether notes/highlights are inside.",
      "If bundled, verify which titles are included before meeting.",
      ...shared,
    ]
  }

  if (categorySlug === "cycles") {
    return [
      "Test brakes, tires, chain, and gear shifting in person.",
      "Ask about recent repairs, punctures, or replacements.",
      "Confirm whether extras like lock or bell are included.",
      ...shared,
    ]
  }

  return [
    "Check size, fit, sturdiness, and any visible marks or damage.",
    "Ask what exactly is included in the final price.",
    "Confirm whether pickup help or carrying is needed.",
    ...shared,
  ]
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const listing = await getListingBySlug(slug)

  if (!listing) {
    return {
      title: "Product Not Found | BuyKarlo",
      description: "The requested listing could not be found or has been removed.",
    }
  }

  const campusTag = listing.campus ? `at ${listing.campus}` : "on campus"
  const formattedPrice = `₹${listing.price.toLocaleString("en-IN")}`

  return {
    title: `${listing.title} for Sale ${campusTag} | BuyKarlo`,
    description: `Buy this ${listing.condition} condition ${listing.title} for ${formattedPrice} from a verified student ${campusTag}. Browse peer-to-peer campus deals on BuyKarlo.`,
    openGraph: {
      title: `${listing.title} - ${formattedPrice} | BuyKarlo AMU`,
      description: (listing.description || "").slice(0, 160),
      type: "website",
      images: listing.imageUrls && listing.imageUrls.length > 0 ? [listing.imageUrls[0]] : [],
    },
  }
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params
  const listing = await getListingBySlug(slug, true)

  if (!listing) {
    notFound()
  }

  const [savedState, relatedResult] = await Promise.all([
    getSavedListingStatus(listing.id),
    getActiveListings(listing.categorySlug, listing.campus),
  ])

  const relatedListings = "listings" in relatedResult ? relatedResult.listings || [] : []
  const moreFromCampus = relatedListings.filter((item) => item.id !== listing.id).slice(0, 4)
  const checklist = getChecklist(listing.categorySlug, listing.condition)
  const sellerJoinedYear = listing.seller?.createdAt ? new Date(listing.seller.createdAt).getFullYear() : 2026
  const trustScore = listing.seller?.trustScore || 0
  const trustRating = Math.max(3.5, Math.min(4.9, Number((trustScore / 20).toFixed(1))))

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    sku: listing.id,
    name: listing.title,
    image: listing.imageUrls && listing.imageUrls.length > 0 ? listing.imageUrls : [],
    description: listing.description,
    offers: {
      "@type": "Offer",
      price: listing.price,
      priceCurrency: "INR",
      availability: listing.status === "active" ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: 
        listing.condition === "new" 
          ? "https://schema.org/NewCondition" 
          : listing.condition === "like_new"
          ? "https://schema.org/RefurbishedCondition"
          : "https://schema.org/UsedCondition",
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      url: `https://buykarlo.in/item/${listing.slug}`,
      seller: listing.seller ? {
        "@type": "Person",
        name: listing.seller.fullName,
        homeLocation: {
          "@type": "Place",
          name: listing.seller.university || "Aligarh Muslim University (AMU)"
        }
      } : undefined
    },
    category: listing.categoryName,
    brand: {
      "@type": "Brand",
      name: "BuyKarlo",
    },
  }

  return (
    <div className="mx-auto max-w-[1360px] animate-in fade-in bg-[#f5f6ff] px-0 py-2 pb-28 md:px-8 md:py-8 md:pb-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="mb-4 flex items-center gap-1.5 px-4 text-xs text-on-surface-variant/80 md:mb-8 md:px-0">
        <Link href="/" className="transition-colors hover:text-primary">
          Home
        </Link>
        <ChevronRight size={12} className="text-outline-variant" />
        <Link href={`/${listing.categorySlug}`} className="transition-colors hover:text-primary">
          {listing.categoryName}
        </Link>
        <ChevronRight size={12} className="text-outline-variant" />
        <span className="max-w-[220px] truncate font-semibold text-on-surface">{listing.title}</span>
      </nav>

      <ProductInteraction
        listingId={listing.id}
        slug={listing.slug}
        imageUrls={listing.imageUrls}
        videoUrl={listing.videoUrl}
        title={listing.title}
        campus={listing.campus}
        categorySlug={listing.categorySlug}
        categoryName={listing.categoryName}
        condition={listing.condition}
        price={listing.price}
        pickupContext={listing.pickupContext}
        description={listing.description || ""}
        isInitiallySaved={"success" in savedState && savedState.success ? savedState.isSaved : false}
      />

      <div className="mt-5 grid gap-5 px-4 xl:grid-cols-[1fr_370px] md:px-0">
        <div className="rounded-[2rem] border border-outline-variant/20 bg-white p-5 shadow-[0_20px_40px_rgba(15,23,42,0.06)] md:p-6">
          <div className="flex items-center gap-2">
            <MessageSquare size={18} className="text-secondary" />
            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-primary">What to check before buying</h2>
          </div>
          <ul className="mt-5 space-y-3">
            {checklist.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-6 text-on-surface-variant">
                <CheckCircle2 size={16} className="mt-1 shrink-0 text-secondary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {listing.seller ? (
          <section className="rounded-[2rem] border border-outline-variant/20 bg-white p-5 shadow-[0_20px_40px_rgba(15,23,42,0.06)] md:p-6">
            <div className="flex items-center gap-4">
              {listing.seller.avatarUrl ? (
                <div className="relative h-16 w-16 overflow-hidden rounded-full border border-outline-variant/25 shadow-sm">
                  <img src={listing.seller.avatarUrl} alt={listing.seller.fullName} className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
                  {listing.seller.fullName.slice(0, 2).toUpperCase()}
                </div>
              )}

              <div className="min-w-0">
                <h3 className="truncate font-display text-xl font-bold text-on-surface md:text-2xl">{listing.seller.fullName}</h3>
                <p className="truncate text-sm font-medium text-on-surface-variant">
                  {listing.seller.department}, {listing.seller.university}
                </p>
              </div>
            </div>

            <div className="mt-5 border-t border-outline-variant/20 pt-5">
              <div className="flex items-center justify-between text-sm text-on-surface-variant">
                <span>Trust Score</span>
                <span className="inline-flex items-center gap-1 font-bold text-on-surface">
                  <Star size={16} className="fill-[#f4b400] text-[#f4b400]" />
                  {trustRating} <span className="font-medium text-on-surface-variant">({trustScore}/100)</span>
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm text-on-surface-variant">
                <span>Response Time</span>
                <span className="font-semibold text-on-surface">Usually quick in chat</span>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm text-on-surface-variant">
                <span>Active Listings</span>
                <span className="font-semibold text-on-surface">{listing.seller.activeListingsCount}</span>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm text-on-surface-variant">
                <span>Member Since</span>
                <span className="font-semibold text-on-surface">{sellerJoinedYear}</span>
              </div>
            </div>

            <div className="mt-5">
              {listing.seller.email === "buykarlo.official@gmail.com" ? (
                <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-secondary px-5 py-2.5 text-sm font-black uppercase tracking-wider text-white shadow-[0_12px_24px_rgba(28,22,207,0.22)]">
                  <BadgeCheck size={16} className="fill-white" />
                  BuyKarlo Trusted
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                  <BadgeCheck size={16} />
                  Verified Student
                </div>
              )}
            </div>
          </section>
        ) : null}
      </div>

      <div className="mt-8 flex justify-end px-4 md:px-0">
        <button className="inline-flex items-center gap-2 rounded-full px-2 py-1 text-base font-semibold text-error transition-colors hover:bg-error/5">
          <AlertCircle size={16} />
          Report Listing
        </button>
      </div>

      {moreFromCampus.length > 0 && (
        <section className="mt-14 border-t border-outline-variant/10 px-4 pt-8 md:px-0">
          <div className="mb-7 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-extrabold tracking-tight text-on-surface md:text-4xl">
                More from {listing.campus}
              </h2>
              <p className="mt-2 text-base text-on-surface-variant md:text-lg">
                Handpicked essentials from your campus community
              </p>
            </div>
            <Link href={`/${listing.categorySlug}`} className="text-base font-bold text-primary md:text-lg">
              View All →
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {moreFromCampus.map((related) => (
              <Link
                key={related.id}
                href={`/item/${related.slug || related.id}`}
                className="group overflow-hidden rounded-[2rem] border border-outline-variant/15 bg-white shadow-[0_20px_40px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_28px_48px_rgba(15,23,42,0.1)]"
              >
                <div className="relative aspect-[1.02/1] overflow-hidden bg-surface-container-low">
                  {related.imageUrl ? (
                    <Image
                      src={related.imageUrl}
                      alt={related.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-on-surface-variant">
                      No image
                    </div>
                  )}
                  <div className="absolute left-4 top-4 rounded-full bg-white px-3.5 py-1.5 shadow-sm">
                    <span className="font-display text-xl font-extrabold tracking-tight text-primary">
                      ₹{related.price.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 p-4">
                  <h3 className="line-clamp-2 text-lg font-bold leading-snug text-on-surface md:text-[1.25rem]">
                    {related.title}
                  </h3>
                  <p className="flex items-center gap-2 text-sm font-medium text-on-surface-variant">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/50" />
                    {related.sellerDepartment || related.campus}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
