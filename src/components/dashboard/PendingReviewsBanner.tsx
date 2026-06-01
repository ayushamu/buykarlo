"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Star, ArrowRight, Sparkles, MessageSquare } from "lucide-react"
import { getPendingReviews } from "@/features/deals/actions"

export function PendingReviewsBanner() {
  const [pending, setPending] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadPending() {
      try {
        const res = await getPendingReviews()
        if (res.success && res.pending) {
          setPending(res.pending)
        }
      } catch (err) {
        console.error("Failed to load pending reviews banner:", err)
      } finally {
        setLoading(false)
      }
    }
    loadPending()
  }, [])

  if (loading || pending.length === 0) return null

  // Get the most recent pending review to show in the banner
  const activeReview = pending[0]
  const count = pending.length

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        className="relative overflow-hidden rounded-[2rem] border border-[#ffd580] bg-[#fffbf2] p-5 md:p-6 shadow-sm border-l-[6px] border-l-[#ffb020] select-none"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#ffb020]/15 text-[#b07000]">
              <Star size={24} fill="currentColor" />
            </div>
            <div>
              <h4 className="font-display text-base font-bold text-slate-800 flex items-center gap-2">
                <span>Pending Reviews</span>
                {count > 1 && (
                  <span className="rounded-full bg-[#ffb020]/25 text-[#b07000] px-2 py-0.5 text-[10px] font-black">
                    +{count - 1} more
                  </span>
                )}
              </h4>
              <p className="mt-1 text-xs md:text-sm text-[#7a5500] leading-relaxed max-w-xl">
                You completed a campus deal for <strong>"{activeReview.listingTitle}"</strong> with <strong>{activeReview.otherPartyName}</strong>. Take a moment to rate them—reviews boost university Trust Scores!
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center">
            <Link
              href={`/review/${activeReview.dealId}`}
              className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 rounded-full bg-[#ffb020] hover:bg-[#ffa000] active:scale-95 px-5 py-3 text-xs font-bold text-slate-900 transition-all shadow-md shadow-[#ffb020]/10"
            >
              <span>Leave Feedback</span>
              <ArrowRight size={14} strokeWidth={2.5} />
            </Link>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
