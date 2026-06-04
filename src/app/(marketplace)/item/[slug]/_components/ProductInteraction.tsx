"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import Image from "next/image"
import { CustomVideoPlayer } from "@/components/shared/CustomVideoPlayer"
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
import { AuthModal } from "@/components/auth/AuthModal"

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

function renderFormattedDescription(desc: string) {
  if (!desc) {
    return <p className="text-on-surface-variant/60 italic text-left">No additional description provided by the seller.</p>
  }

  // 1. Collapse multiple consecutive newlines (more than 2 newlines into 2 newlines)
  const normalized = desc.replace(/\n{3,}/g, "\n\n")

  // 2. Split by newlines to process paragraphs and lists
  const lines = normalized.split("\n")

  // Helper to parse URLs in a line of text and render them as JSX elements
  const linkify = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const parts = text.split(urlRegex)
    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-secondary hover:underline break-all font-semibold"
          >
            {part}
          </a>
        )
      }
      return part
    })
  }

  return (
    <div className="space-y-2 font-body text-sm leading-6 text-on-surface-variant md:text-[15px] md:leading-7 break-words [word-break:break-word] [overflow-wrap:break-word]">
      {lines.map((line, idx) => {
        const trimmed = line.trim()
        
        if (trimmed === "") {
          return <div key={idx} className="h-1.5" />
        }

        // Check if the line is a bullet point (starts with *, -, •)
        const bulletMatch = line.match(/^(\s*)([-*•])\s+(.*)$/)
        if (bulletMatch) {
          const content = bulletMatch[3]
          return (
            <div key={idx} className="flex items-start gap-2.5 pl-4">
              <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
              <span className="flex-1 text-left">{linkify(content)}</span>
            </div>
          )
        }

        // Check if the line is a numbered list (starts with 1., 2., etc.)
        const numberMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/)
        if (numberMatch) {
          const num = numberMatch[2]
          const content = numberMatch[3]
          return (
            <div key={idx} className="flex items-start gap-2.5 pl-4">
              <span className="font-mono text-xs font-bold text-primary/70 mt-[2px]">{num}.</span>
              <span className="flex-1 text-left">{linkify(content)}</span>
            </div>
          )
        }

        // Regular paragraph line
        return (
          <p key={idx} className="text-left">
            {linkify(line)}
          </p>
        )
      })}
    </div>
  )
}

interface ProductInteractionProps {
  listingId: string
  slug: string
  imageUrls: string[]
  videoUrl?: string | null
  videoFit?: "cover" | "contain" | null
  videoAspectRatio?: "4/3" | "16/9" | "1/1" | "9/16" | null
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
  videoUrl,
  videoFit,
  videoAspectRatio,
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
  
  const mediaItems = useMemo(() => {
    const items: Array<{ type: "image" | "video"; url: string }> = []
    if (videoUrl) {
      items.push({ type: "video", url: videoUrl })
    }
    imageUrls.forEach((url) => {
      items.push({ type: "image", url: url })
    })
    return items
  }, [videoUrl, imageUrls])

  const [activeMediaIndex, setActiveMediaIndex] = useState(0)
  const activeMedia = mediaItems[activeMediaIndex]
  const [isPending, startTransition] = useTransition()
  const [isSaving, startSaveTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [isSaved, setIsSaved] = useState(isInitiallySaved)
  const [compareItems, setCompareItems] = useState<CompareItem[]>([])
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<"chat" | "offer" | "save" | null>(null)

  // Image zoom-on-hover interaction states
  const [isHovered, setIsHovered] = useState(false)
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 })

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return
    const container = e.currentTarget
    const rect = container.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomPos({ x, y })
  }

  const handlePointerEnter = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return
    setIsHovered(true)
  }

  const handlePointerLeave = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return
    setIsHovered(false)
    setZoomPos({ x: 50, y: 50 })
  }

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

  const hasImages = mediaItems.length > 0
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
          if (res.error.toLowerCase().includes("unauthorized")) {
            setPendingAction(draft === "offer" ? "offer" : "chat")
            setIsAuthModalOpen(true)
          } else {
            setErrorMsg(res.error)
          }
        } else if (res.success && res.conversationId) {
          const suffix = draft === "offer" ? "&draft=offer" : ""
          router.push(`/messages?conversationId=${res.conversationId}${suffix}`)
        }
      } catch (error) {
        setErrorMsg("Failed to start conversation. Please try again.")
      }
    })
  }

  const handleAuthSuccess = () => {
    if (pendingAction === "offer") {
      openConversation("offer")
    } else if (pendingAction === "save") {
      handleToggleSave()
    } else {
      openConversation()
    }
    setPendingAction(null)
  }

  const handleToggleSave = () => {
    setErrorMsg(null)
    startSaveTransition(async () => {
      const res = await toggleSavedListing(listingId)
      if (res.error) {
        if (res.error.toLowerCase().includes("log in") || res.error.toLowerCase().includes("unauthorized")) {
          setPendingAction("save")
          setIsAuthModalOpen(true)
        } else {
          setErrorMsg(res.error)
        }
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
    <div className="w-full min-w-0 space-y-5 overflow-x-hidden px-4 md:px-0">
      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-start">
        <div className="min-w-0 space-y-3">
          <div className="relative min-w-0 overflow-hidden rounded-[1.35rem] border border-outline-variant/20 bg-white shadow-[0_20px_42px_rgba(15,23,42,0.07)] md:rounded-[1.75rem]">
            <div className="absolute left-4 top-4 z-10 inline-flex items-center gap-2 rounded-full bg-white/95 px-3.5 py-2 text-sm font-semibold text-on-surface shadow-sm">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-success" />
              Available
            </div>

            {activeMedia ? (
              activeMedia.type === "video" ? (
                <div className="relative aspect-[4/3] w-full min-w-0 overflow-hidden bg-black rounded-[1.35rem] md:rounded-[1.75rem]">
                  <CustomVideoPlayer
                    src={activeMedia.url}
                    fit={(videoFit as any) || "cover"}
                    aspectRatio={(videoAspectRatio as any) || "4/3"}
                    useAspectRatio={false}
                    autoPlay={true}
                    muted={true}
                    loop={true}
                    playsInline={true}
                    className="absolute inset-0 h-full w-full rounded-none border-0 shadow-none"
                  />
                </div>
              ) : (
                <div
                  onPointerMove={handlePointerMove}
                  onPointerEnter={handlePointerEnter}
                  onPointerLeave={handlePointerLeave}
                  className="relative aspect-[4/3] w-full min-w-0 cursor-zoom-in overflow-hidden bg-white"
                >
                  <Image
                    src={activeMedia.url}
                    alt={title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 64vw, 860px"
                    priority
                    style={{
                      transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                      transform: isHovered ? "scale(1.65)" : "scale(1)",
                    }}
                    className="object-contain p-3 transition-transform duration-[150ms] ease-out will-change-transform motion-reduce:transition-none motion-reduce:transform-none md:p-6"
                  />
                </div>
              )
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center bg-surface-container-low text-sm font-semibold text-on-surface-variant">
                No product images uploaded
              </div>
            )}
          </div>

          {mediaItems.length > 1 ? (
            <div className="flex w-full min-w-0 gap-2.5 overflow-x-auto overscroll-x-contain pb-2 scrollbar-none">
              {mediaItems.map((item, index) => {
                const isActive = activeMediaIndex === index
                return (
                  <button
                    key={`${item.url}-${index}`}
                    onClick={() => setActiveMediaIndex(index)}
                    className={cn(
                      "relative h-20 w-20 shrink-0 cursor-pointer overflow-hidden rounded-[1rem] border-2 bg-white shadow-sm transition-all md:h-[5.5rem] md:w-[5.5rem]",
                      isActive ? "border-primary scale-[1.02]" : "border-outline-variant/20 hover:border-primary/50"
                    )}
                  >
                    {item.type === "video" ? (
                      <div className="relative h-full w-full bg-black">
                        <video src={item.url} preload="none" muted className="h-full w-full object-cover opacity-70" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white">
                            <svg className="h-3 w-3 fill-current text-white ml-0.5" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <Image src={item.url} alt={`${title} thumbnail ${index + 1}`} fill sizes="96px" className="object-cover" />
                    )}
                  </button>
                )
              })}
            </div>
          ) : null}
        </div>

        <div className="min-w-0 space-y-4 xl:sticky xl:top-28">
          <div className="min-w-0 rounded-[1.35rem] border border-outline-variant/20 bg-white p-4 shadow-[0_20px_42px_rgba(15,23,42,0.07)] md:rounded-[1.75rem] md:p-6">
            <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
              <span className="inline-flex max-w-full rounded-full bg-primary/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-primary md:px-4 md:text-[11px]">
                {categoryName}
              </span>
              <div className="flex shrink-0 items-center gap-2">
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

            <h1 className="mt-4 max-w-full break-words font-display text-2xl font-extrabold leading-[1.12] text-on-surface md:text-3xl">
              {title}
            </h1>

            <div className="mt-4 flex min-w-0 flex-wrap items-end gap-x-3 gap-y-1">
              <span className="min-w-0 font-display text-4xl font-extrabold tracking-tight text-primary md:text-[2.65rem]">
                ₹{price.toLocaleString("en-IN")}
              </span>
              <span className="pb-1 text-base font-semibold text-on-surface-variant/60 line-through md:text-lg">
                ₹{originalPrice.toLocaleString("en-IN")}
              </span>
              <span className="pb-1 text-sm font-bold text-success md:text-base">{savingsPercent}% OFF</span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.25rem] border border-outline-variant/20 bg-surface-container-low/30 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">Condition</p>
                <p className="mt-2 text-lg font-bold capitalize leading-tight text-on-surface md:text-xl">{conditionLabel}</p>
              </div>
              <div className="rounded-[1.25rem] border border-outline-variant/20 bg-surface-container-low/30 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">Location</p>
                <p className="mt-2 text-lg font-bold leading-tight text-on-surface md:text-xl">{displayLocation}</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <button
                onClick={() => openConversation()}
                disabled={isPending}
                className="flex w-full items-center justify-center gap-2 rounded-full action-gradient px-5 py-3 text-base font-bold text-white shadow-md transition-all hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-75"
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
                className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-primary bg-white px-5 py-3 text-base font-bold text-primary transition-colors hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-70"
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
              <div className="rounded-[1.25rem] border border-outline-variant/15 bg-surface-container-low/30 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">About this item</p>
                <div className="mt-3">
                  {renderFormattedDescription(description)}
                </div>
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

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false)
          setPendingAction(null)
        }}
        onSuccess={handleAuthSuccess}
      />
    </div>
  )
}
