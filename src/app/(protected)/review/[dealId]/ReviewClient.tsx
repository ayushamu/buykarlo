"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Star, CheckCircle, Loader2, AlertCircle, ShoppingBag, ArrowLeft } from "lucide-react"
import { getDealDetailsForReview, submitReview } from "@/features/deals/actions"

interface ReviewClientProps {
  dealId: string
}

export function ReviewClient({ dealId }: ReviewClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deal, setDeal] = useState<any>(null)
  
  // Review inputs
  const [rating, setRating] = useState<number>(0)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [comment, setComment] = useState<string>("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (dealId) {
      loadDealData()
    }
  }, [dealId])

  async function loadDealData() {
    try {
      setLoading(true)
      setError(null)
      const res = await getDealDetailsForReview(dealId)
      if (res.error) {
        setError(res.error)
      } else {
        setDeal(res.deal)
        // Pre-fill rating if already reviewed, though we block submission
        if (res.deal?.alreadyReviewed) {
          setSuccess(true)
        }
      }
    } catch (err) {
      console.error(err)
      setError("Failed to load transaction details.")
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) {
      setError("Please select a star rating.")
      return
    }

    try {
      setSubmitting(true)
      setError(null)
      const res = await submitReview({
        dealId,
        rating,
        comment,
      })

      if (res.error) {
        setError(res.error)
      } else {
        setSuccess(true)
        setTimeout(() => {
          router.push("/dashboard")
          router.refresh()
        }, 2000)
      }
    } catch (err) {
      console.error(err)
      setError("An error occurred while submitting your review.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-[var(--seller-primary)]" />
        <p className="text-sm font-semibold text-on-surface-variant">Loading deal details...</p>
      </div>
    )
  }

  if (error && !deal) {
    return (
      <div className="mx-auto max-w-md mt-12 p-6 text-center space-y-4 bg-white rounded-3xl border border-outline-variant/20 shadow-sm">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="text-lg font-bold text-slate-800">Review unavailable</h3>
        <p className="text-sm text-on-surface-variant">{error}</p>
        <button
          onClick={() => router.push("/dashboard")}
          className="inline-flex items-center gap-2 text-sm font-bold text-[var(--seller-primary-strong)] hover:underline"
        >
          <ArrowLeft size={16} /> Return to Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8 md:py-12">
      {/* Back button */}
      <button
        onClick={() => router.push("/dashboard")}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-on-surface-variant hover:text-foreground mb-6 transition-colors cursor-pointer"
      >
        <ArrowLeft size={14} /> Back to Dashboard
      </button>

      {/* Main Container */}
      <div className="overflow-hidden rounded-[2.5rem] border border-outline-variant/20 bg-white shadow-xl premium-shadow">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1C16CF] to-[#6B38D4] p-8 text-center text-white">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md">
            <ShoppingBag size={24} />
          </div>
          <h2 className="mt-4 font-display text-2xl font-black tracking-tight">
            {success ? "Feedback Submitted!" : "Rate Your Deal"}
          </h2>
          <p className="mt-1 text-xs text-white/80 font-medium">
            Campus deal for "{deal?.listingTitle}"
          </p>
        </div>

        {/* Content */}
        <div className="p-8">
          {success ? (
            /* Success Feedback screen */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-6 text-center space-y-4"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                <CheckCircle size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">Thank you for rating!</h3>
                <p className="mt-2 text-sm text-on-surface-variant max-w-[320px] mx-auto">
                  Your feedback helps maintain a highly trusted student community at AMU. Redirecting you to your dashboard...
                </p>
              </div>
            </motion.div>
          ) : (
            /* Form screen */
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-start gap-2">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Deal Summary Card */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-outline-variant/15">
                {deal.otherPartyAvatar ? (
                  <img
                    src={deal.otherPartyAvatar}
                    alt={deal.otherPartyName}
                    className="w-12 h-12 rounded-full object-cover border border-outline-variant/15"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-md">
                    {deal.otherPartyName?.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Reviewing {deal.role === "seller" ? "Buyer" : "Seller"}
                  </p>
                  <p className="text-sm font-bold text-slate-800">{deal.otherPartyName}</p>
                  <p className="text-[10px] text-on-surface-variant">
                    Deal price: ₹{deal.price}
                  </p>
                </div>
              </div>

              {/* Star selector */}
              <div className="text-center space-y-2">
                <label className="block text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                  How was your experience?
                </label>
                <div className="flex justify-center gap-2 py-3 select-none">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = hoverRating ? star <= hoverRating : star <= rating
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="text-amber-400 focus:outline-none transition-transform active:scale-90 hover:scale-110 cursor-pointer"
                      >
                        <Star
                          size={36}
                          fill={isFilled ? "currentColor" : "transparent"}
                          strokeWidth={2}
                          className="transition-colors"
                        />
                      </button>
                    )
                  })}
                </div>
                {rating > 0 && (
                  <p className="text-xs font-bold text-[var(--seller-primary-strong)]">
                    {rating === 5 ? "Excellent - Perfect Deal! ⭐⭐⭐⭐⭐" :
                     rating === 4 ? "Very Good - Smooth Meetup! ⭐⭐⭐⭐" :
                     rating === 3 ? "Good - Satisfactory trade. ⭐⭐⭐" :
                     rating === 2 ? "Below Average - Had some issues. ⭐⭐" :
                     "Poor - Very unsatisfying. ⭐"}
                  </p>
                )}
              </div>

              {/* Text comment */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant px-1">
                  Tell us more (Optional)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share details about meetup punctuality, item condition, or transaction flow..."
                  rows={4}
                  className="w-full rounded-2xl border border-outline-variant/30 bg-slate-50/50 p-4 font-body text-sm outline-none focus:border-primary focus:bg-white transition-all text-on-surface resize-none"
                />
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full h-12 rounded-2xl text-white bg-gradient-to-r from-[#1C16CF] to-[#6B38D4] hover:opacity-95 font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/10 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Submit Review"
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
