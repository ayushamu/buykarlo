"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  GitCompareArrows,
  Heart,
  Loader2,
  MapPin,
  MessageSquare,
  Share2,
  X,
} from "lucide-react"
import { getOrCreateConversation } from "@/features/chat/actions"
import { toggleSavedListing } from "@/features/listings/actions"
import { cn } from "@/lib/utils"
import type { Condition } from "@/components/shared/ConditionBadge"

interface CompareItem {
  id: string
  slug: string
  title: string
  price: number
  condition: Condition
  campus: string
  categorySlug: string
  imageUrl?: string | null
}

interface ProductInteractionProps {
  listingId: string
  slug: string
  imageUrls: string[]
  title: string
  campus: string
  categorySlug: string
  categoryName: string
  condition: Condition
  price: number
  pickupContext?: string | null
  description: string
  isInitiallySaved: boolean
}

const COMPARE_STORAGE_KEY = "buykarlo_compare_items"

export function ProductInteraction({
  listingId,
  slug,
  imageUrls,
  title,
  campus,
  categorySlug,
  categoryName,
  condition,
  price,
  pickupContext,
  description,
  isInitiallySaved,
}: ProductInteractionProps) {
  const router = useRouter()
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [isPending, startTransition] = useTransition()
  const [isSaving, startSaveTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [isSaved, setIsSaved] = useState(isInitiallySaved)
  const [compareItems, setCompareItems] = useState<CompareItem[]>([])

  const compareItem = useMemo<CompareItem>(
    () => ({
      id: listingId,
      slug,
      title,
      price,
      condition,
      campus,
      categorySlug,
      imageUrl: imageUrls[0] || null,
    }),
    [campus, categorySlug, condition, imageUrls, listingId, price, slug, title]
  )

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const raw = window.localStorage.getItem(COMPARE_STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as CompareItem[]
      if (Array.isArray(parsed)) {
        setCompareItems(parsed)
      }
    } catch (error) {
      console.error("Failed to read compare items:", error)
    }
  }, [])

  useEffect(() => {
    if (!saveMessage) return
    const timer = window.setTimeout(() => setSaveMessage(null), 2400)
    return () => window.clearTimeout(timer)
  }, [saveMessage])

  const hasImages = imageUrls.length > 0
  const isCompared = compareItems.some((item) => item.id === listingId)
  const compareCount = compareItems.length
  const displayLocation = pickupContext || campus
  const originalPrice = Math.round(price * 1.08)
  const savings = Math.max(0, originalPrice - price)
  const savingsPercent = originalPrice > 0 ? Math.round((savings / originalPrice) * 100) : 0
  const conditionLabel = condition.replace("_", " ")

  const persistCompareItems = (nextItems: CompareItem[]) => {
    setCompareItems(nextItems)
    if (typeof window !== "undefined") {
      window.localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(nextItems))
    }
  }

  const openConversation = (draft?: "offer") => {
    setErrorMsg(null)
    startTransition(async () => {
      try {
        const res = await getOrCreateConversation(listingId)
        if (res.error) {
          setErrorMsg(res.error)
        } else if (res.success && res.conversationId) {
          const suffix = draft === "offer" ? "&draft=offer" : ""
          router.push(`/messages?conversationId=${res.conversationId}${suffix}`)
        }
      } catch (error) {
        setErrorMsg("Failed to start conversation. Please try again.")
      }
    })
  }

  const handleToggleSave = () => {
    setErrorMsg(null)
    startSaveTransition(async () => {
      const res = await toggleSavedListing(listingId)
      if (res.error) {
        setErrorMsg(res.error)
        return
      }
      if (res.success) {
        setIsSaved(res.isSaved)
        setSaveMessage(res.isSaved ? "Saved to wishlist." : "Removed from wishlist.")
      }
    })
  }

  const handleToggleCompare = () => {
    setErrorMsg(null)

    if (isCompared) {
      persistCompareItems(compareItems.filter((item) => item.id !== listingId))
      setSaveMessage("Removed from compare shortlist.")
      return
    }

    const mixedCategory = compareItems.some((item) => item.categorySlug !== categorySlug)
    if (mixedCategory) {
      setErrorMsg("Compare works best within the same category. Remove the other compare item first.")
      return
    }

    if (compareItems.length >= 4) {
      setErrorMsg("You can compare up to 4 listings at a time.")
      return
    }

    persistCompareItems([...compareItems, compareItem])
    setSaveMessage("Added to compare shortlist.")
  }

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : ""
    try {
      if (navigator.share) {
        await navigator.share({
          title,
          text: `Check out this listing on BuyKarlo: ${title}`,
          url,
        })
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url)
        setSaveMessage("Listing link copied.")
      }
    } catch (error) {
      console.error("Share failed:", error)
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[1fr_370px] xl:items-start">
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-[2rem] border border-outline-variant/20 bg-white shadow-[0_24px_48px_rgba(15,23,42,0.08)]">
            <div className="absolute left-4 top-4 z-10 inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-on-surface shadow-sm">
              <span className="h-2.5 w-2.5 rounded-full bg-success" />
              Available
            </div>

            {hasImages ? (
              <div className="relative aspect-[4/3] w-full bg-surface-container-low">
                <Image
                  src={imageUrls[activeImageIndex]}
                  alt={title}
                  fill
                  priority
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center bg-surface-container-low text-sm font-semibold text-on-surface-variant">
                No product images uploaded
              </div>
            )}
          </div>

          {hasImages && imageUrls.length > 1 ? (
            <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
              {imageUrls.map((url, index) => {
                const isActive = activeImageIndex === index
                return (
                  <button
                    key={`${url}-${index}`}
                    onClick={() => setActiveImageIndex(index)}
                    className={cn(
                      "relative h-20 w-20 shrink-0 overflow-hidden rounded-[1.1rem] border-2 bg-white shadow-sm transition-all md:h-24 md:w-24",
                      isActive ? "border-primary scale-[1.02]" : "border-outline-variant/20 hover:border-primary/50"
                    )}
                  >
                    <Image src={url} alt={`${title} thumbnail ${index + 1}`} fill className="object-cover" />
                  </button>
                )
              })}
            </div>
          ) : null}
        </div>

        <div className="space-y-4 xl:sticky xl:top-28">
          <div className="rounded-[2rem] border border-outline-variant/20 bg-white p-5 shadow-[0_24px_48px_rgba(15,23,42,0.08)] md:p-6">
            <div className="flex items-start justify-between gap-4">
              <span className="inline-flex rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-primary">
                {categoryName}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleShare}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant/20 text-on-surface-variant transition-colors hover:bg-surface-container-low"
                  aria-label="Share listing"
                >
                  <Share2 size={18} />
                </button>
                <button
                  onClick={handleToggleSave}
                  disabled={isSaving}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border transition-colors",
                    isSaved
                      ? "border-primary/20 bg-primary/10 text-primary"
                      : "border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-low"
                  )}
                  aria-label={isSaved ? "Remove from wishlist" : "Save listing"}
                >
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Heart size={18} className={isSaved ? "fill-current" : ""} />}
                </button>
              </div>
            </div>

            <h1 className="mt-4 font-display text-[2rem] font-extrabold leading-tight text-on-surface md:text-[2.4rem]">
              {title}
            </h1>

            <div className="mt-4 flex flex-wrap items-end gap-3">
              <span className="font-display text-[2.6rem] font-extrabold tracking-tight text-primary md:text-[3.2rem]">
                ₹{price.toLocaleString("en-IN")}
              </span>
              <span className="text-xl font-semibold text-on-surface-variant/60 line-through md:text-2xl">
                ₹{originalPrice.toLocaleString("en-IN")}
              </span>
              <span className="text-base font-bold text-success md:text-lg">{savingsPercent}% OFF</span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.5rem] border border-outline-variant/20 bg-surface-container-low/30 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">Condition</p>
                <p className="mt-2 text-xl font-bold capitalize text-on-surface md:text-2xl">{conditionLabel}</p>
              </div>
              <div className="rounded-[1.5rem] border border-outline-variant/20 bg-surface-container-low/30 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">Location</p>
                <p className="mt-2 text-xl font-bold text-on-surface md:text-2xl">{displayLocation}</p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button
                onClick={() => openConversation()}
                disabled={isPending}
                className="flex w-full items-center justify-center gap-2 rounded-full action-gradient px-5 py-3.5 text-base font-bold text-white shadow-md transition-all hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-75 md:text-lg"
              >
                {isPending ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <MessageSquare size={20} />
                    Chat with Seller
                  </>
                )}
              </button>

              <button
                onClick={() => openConversation("offer")}
                disabled={isPending}
                className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-primary bg-white px-5 py-3.5 text-base font-bold text-primary transition-colors hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-70 md:text-lg"
              >
                <ArrowRight size={18} />
                Make an Offer
              </button>
            </div>

            {(errorMsg || saveMessage) ? (
              <div
                className={cn(
                  "mt-5 rounded-2xl border px-4 py-3 text-sm font-medium",
                  errorMsg
                    ? "border-error/20 bg-error/5 text-error"
                    : "border-success/20 bg-success/10 text-success"
                )}
              >
                {errorMsg || saveMessage}
              </div>
            ) : null}

            <div className="mt-5 border-t border-outline-variant/15 pt-5">
              <div className="rounded-[1.5rem] border border-outline-variant/15 bg-surface-container-low/30 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">About this item</p>
                <p className="mt-3 text-[15px] leading-7 text-on-surface-variant md:text-base md:leading-8">
                  {description || "No additional description provided by the seller."}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  onClick={handleToggleCompare}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                    isCompared
                      ? "border-secondary/25 bg-secondary/10 text-secondary"
                      : "border-outline-variant/25 bg-white text-on-surface-variant hover:bg-surface-container-low"
                  )}
                >
                  <GitCompareArrows size={15} />
                  {isCompared ? "Compared" : "Compare"}
                </button>
                {compareCount > 0 ? (
                  <span className="rounded-full bg-surface-container-low px-3 py-2 text-sm font-medium text-on-surface-variant">
                    {compareCount} in compare
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      {compareItems.length > 0 ? (
        <div className="rounded-[1.75rem] border border-outline-variant/20 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Compare shortlist</p>
              <p className="mt-1 text-sm text-on-surface-variant">
                {compareItems.length} item{compareItems.length > 1 ? "s" : ""} selected for quick price and condition review.
              </p>
            </div>
            <button
              onClick={() => persistCompareItems([])}
              className="inline-flex items-center gap-1 rounded-full border border-outline-variant/25 px-3 py-1.5 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low"
            >
              <X size={14} />
              Clear
            </button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {compareItems.map((item) => (
              <div key={item.id} className="rounded-[1.5rem] border border-outline-variant/20 bg-surface-container-low/30 p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="line-clamp-2 text-sm font-semibold text-on-surface">{item.title}</p>
                  {item.id === listingId ? (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                      Current
                    </span>
                  ) : null}
                </div>
                <p className="mt-3 font-display text-2xl font-extrabold tracking-tight text-primary">₹{item.price.toLocaleString("en-IN")}</p>
                <p className="mt-2 text-xs font-medium uppercase tracking-wide text-on-surface-variant">
                  {item.condition.replace("_", " ")} • {item.campus}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
