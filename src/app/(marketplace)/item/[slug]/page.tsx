import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  BadgeCheck,
  CheckCircle2,
  ChevronRight,
  MessageSquare,
  ShieldCheck,
  Star,
  User,
} from "lucide-react"
import { getActiveListings, getListingBySlug, getSavedListingStatus } from "@/features/listings/actions"
import { getSellerReviews } from "@/features/deals/actions"
import { ProductInteraction } from "./_components/ProductInteraction"
import { ReportListingButton } from "./_components/ReportListingButton"
import { cn } from "@/lib/utils"

interface PageProps {
  params: Promise<{ slug: string }>
}

const formatDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
  } catch {
    return "Recent Deal"
  }
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

  const [savedState, relatedResult, reviewsResult] = await Promise.all([
    getSavedListingStatus(listing.id),
    getActiveListings(listing.categorySlug, listing.campus),
    listing.seller?.id ? getSellerReviews(listing.seller.id) : Promise.resolve({ reviews: [] }),
  ])

  const relatedListings = "listings" in relatedResult ? relatedResult.listings || [] : []
  const moreFromCampus = relatedListings.filter((item) => item.id !== listing.id).slice(0, 4)
  const checklist = getChecklist(listing.categorySlug, listing.condition)
  const sellerJoinedYear = listing.seller?.createdAt ? new Date(listing.seller.createdAt).getFullYear() : 2026
  const trustScore = listing.seller?.trustScore || 0
  const trustRating = Math.max(3.5, Math.min(4.9, Number((trustScore / 20).toFixed(1))))
  const reviews = reviewsResult && "reviews" in reviewsResult ? reviewsResult.reviews || [] : []
  const avgRating = reviews.length > 0
    ? Number((reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length).toFixed(1))
    : null

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
      url: `https://www.buykarlo.in/item/${listing.slug}`,
      seller: listing.seller ? {
        "@type": "Person",
        name: listing.seller.fullName,
        homeLocation: {
          "@type": "Place",
          name: listing.seller.university || "Aligarh Muslim University (AMU)"
        }
      } : undefined,
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: "0.00",
          currency: "INR"
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "IN"
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: 0,
            maxValue: 1,
            unitCode: "DAY"
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 0,
            maxValue: 1,
            unitCode: "DAY"
          }
        }
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "IN",
        returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted"
      }
    },
    category: listing.categoryName,
    brand: {
      "@type": "Brand",
      name: "BuyKarlo",
    },
    review: reviews.length > 0 ? reviews.map((r: any) => ({
      "@type": "Review",
      reviewRating: {
        "@type": "Rating",
        ratingValue: r.rating,
        bestRating: "5"
      },
      author: {
        "@type": "Person",
        name: r.reviewerName
      },
      reviewBody: r.comment || "Good campus exchange",
      datePublished: new Date(r.createdAt).toISOString().split("T")[0]
    })) : undefined,
    aggregateRating: reviews.length > 0 && avgRating ? {
      "@type": "AggregateRating",
      ratingValue: avgRating,
      reviewCount: reviews.length,
      bestRating: "5"
    } : undefined,
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1360px] animate-in overflow-x-hidden bg-[#f5f6ff] px-0 py-2 pb-[calc(7rem+env(safe-area-inset-bottom))] fade-in md:px-8 md:py-8 md:pb-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="mb-4 flex min-w-0 items-center gap-1.5 px-4 text-xs text-on-surface-variant/80 md:mb-8 md:px-0">
        <Link href="/" className="transition-colors hover:text-primary">
          Home
        </Link>
        <ChevronRight size={12} className="text-outline-variant" />
        <Link href={`/${listing.categorySlug}`} className="transition-colors hover:text-primary">
          {listing.categoryName}
        </Link>
        <ChevronRight size={12} className="text-outline-variant" />
        <span className="min-w-0 max-w-[220px] truncate font-semibold text-on-surface">{listing.title}</span>
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

      <div className="mt-5 grid min-w-0 gap-4 px-4 md:px-0 xl:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-4">
          {/* What to check before buying checklist */}
          <div className="rounded-[1.5rem] border border-outline-variant/20 bg-white p-4 shadow-[0_18px_36px_rgba(15,23,42,0.05)] md:p-5">
            <div className="flex min-w-0 items-start gap-2">
              <MessageSquare size={17} className="mt-0.5 shrink-0 text-secondary" />
              <h2 className="min-w-0 break-words text-xs font-bold uppercase tracking-[0.14em] text-primary md:text-sm">What to check before buying</h2>
            </div>
            <ul className="mt-4 space-y-2.5">
              {checklist.map((item) => (
                <li key={item} className="flex min-w-0 gap-3 text-sm leading-6 text-on-surface-variant">
                  <CheckCircle2 size={15} className="mt-1 shrink-0 text-secondary" />
                  <span className="min-w-0 break-words">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Seller Reviews Section */}
          <div className="rounded-[1.5rem] border border-outline-variant/20 bg-white p-4 shadow-[0_18px_36px_rgba(15,23,42,0.05)] md:p-5">
            <div className="flex min-w-0 items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-2">
                <Star size={17} className="shrink-0 text-primary fill-primary/10" />
                <h2 className="min-w-0 break-words text-xs font-bold uppercase tracking-[0.14em] text-primary md:text-sm">
                  Seller Reviews {reviews.length > 0 ? `(${reviews.length})` : ""}
                </h2>
              </div>
              {avgRating && (
                <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
                  <Star size={14} className="fill-primary text-primary" />
                  <span>{avgRating} / 5</span>
                </div>
              )}
            </div>

            {reviews.length === 0 ? (
              <div className="mt-6 text-center py-8 px-4 rounded-2xl bg-[#f8f9ff] border border-dashed border-outline-variant/25">
                <Star size={24} className="mx-auto text-outline-variant/60 mb-2" />
                <p className="text-sm font-semibold text-on-surface">No reviews yet</p>
                <p className="mt-1 text-xs text-on-surface-variant max-w-xs mx-auto">
                  Deals completed through campus chat build verified student Trust Scores and unlock reviews.
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-4 divide-y divide-outline-variant/10">
                {reviews.map((r: any, idx: number) => (
                  <div key={r.id} className={cn("pt-4 first:pt-0")}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        {r.reviewerAvatar ? (
                          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-outline-variant/20">
                            <img src={r.reviewerAvatar} alt={r.reviewerName} className="h-full w-full object-cover" />
                          </div>
                        ) : (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            {r.reviewerName.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-bold text-on-surface leading-tight">{r.reviewerName}</p>
                          {r.listingTitle && (
                            <p className="text-[11px] text-on-surface-variant/80 mt-0.5 leading-none">
                              Bought: <span className="font-semibold text-on-surface-variant">{r.listingTitle}</span>
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              size={12}
                              className={cn(
                                i < r.rating
                                  ? "text-[#f4b400] fill-[#f4b400]"
                                  : "text-outline-variant/30"
                              )}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] text-on-surface-variant/75 font-medium">
                          {formatDate(r.createdAt)}
                        </span>
                      </div>
                    </div>
                    {r.comment && (
                      <p className="mt-2.5 pl-[2.6rem] text-sm leading-relaxed text-on-surface-variant font-medium">
                        "{r.comment}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {listing.seller ? (
          <section className="min-w-0 overflow-hidden rounded-[1.5rem] border border-outline-variant/20 bg-white p-4 shadow-[0_18px_36px_rgba(15,23,42,0.05)] md:p-5">
            <div className="flex min-w-0 items-center gap-3">
              {listing.seller.avatarUrl ? (
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-outline-variant/25 shadow-sm">
                  <img src={listing.seller.avatarUrl} alt={listing.seller.fullName} className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                  {listing.seller.fullName.slice(0, 2).toUpperCase()}
                </div>
              )}

              <div className="min-w-0">
                <h3 className="truncate font-display text-lg font-bold text-on-surface md:text-xl">{listing.seller.fullName}</h3>
                <p className="truncate text-sm font-medium text-on-surface-variant">
                  {listing.seller.department}, {listing.seller.university}
                </p>
              </div>
            </div>

            <div className="mt-4 border-t border-outline-variant/20 pt-4">
              <div className="flex min-w-0 items-center justify-between gap-3 text-sm text-on-surface-variant">
                <span className="shrink-0">Trust Score</span>
                <span className="inline-flex min-w-0 items-center justify-end gap-1 text-right font-bold text-on-surface">
                  <Star size={16} className="fill-[#f4b400] text-[#f4b400]" />
                  {trustRating} <span className="font-medium text-on-surface-variant">({trustScore}/100)</span>
                </span>
              </div>
              <div className="mt-3 flex min-w-0 items-center justify-between gap-3 text-sm text-on-surface-variant">
                <span className="shrink-0">Response Time</span>
                <span className="min-w-0 text-right font-semibold text-on-surface">Usually quick in chat</span>
              </div>
              <div className="mt-3 flex min-w-0 items-center justify-between gap-3 text-sm text-on-surface-variant">
                <span className="shrink-0">Active Listings</span>
                <span className="min-w-0 text-right font-semibold text-on-surface">{listing.seller.activeListingsCount}</span>
              </div>
              <div className="mt-3 flex min-w-0 items-center justify-between gap-3 text-sm text-on-surface-variant">
                <span className="shrink-0">Member Since</span>
                <span className="min-w-0 text-right font-semibold text-on-surface">{sellerJoinedYear}</span>
              </div>
            </div>

            <div className="mt-4">
              {listing.seller.email === "buykarlo.official@gmail.com" ? (
                <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-secondary px-4 py-2 text-xs font-black uppercase tracking-wider text-white shadow-[0_12px_24px_rgba(28,22,207,0.18)]">
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

      <div className="mt-6 flex justify-end px-4 md:px-0">
        <ReportListingButton listingId={listing.id} />
      </div>

      {moreFromCampus.length > 0 && (
        <section className="mt-10 min-w-0 border-t border-outline-variant/10 px-4 pt-7 md:px-0">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-extrabold tracking-tight text-on-surface md:text-3xl">
                More from {listing.campus}
              </h2>
              <p className="mt-2 text-sm text-on-surface-variant md:text-base">
                Handpicked essentials from your campus community
              </p>
            </div>
            <Link href={`/${listing.categorySlug}`} className="shrink-0 text-sm font-bold text-primary md:text-base">
              View All →
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {moreFromCampus.map((related) => (
              <Link
                key={related.id}
                href={`/item/${related.slug || related.id}`}
                className="group overflow-hidden rounded-[1.5rem] border border-outline-variant/15 bg-white shadow-[0_18px_36px_rgba(15,23,42,0.05)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_24px_42px_rgba(15,23,42,0.09)]"
              >
                <div className="relative aspect-[1.02/1] overflow-hidden bg-surface-container-low">
                  {related.imageUrl ? (
                    <Image
                      src={related.imageUrl}
                      alt={related.title}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
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
