"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Check, Loader2, AlertCircle, ShoppingBag, MessageSquare, ChevronRight } from "lucide-react"
import { getListingChatPartners, completeDeal } from "@/features/deals/actions"

interface MarkSoldModalProps {
  isOpen: boolean
  onClose: () => void
  listingId: string
  listingTitle: string
  onSuccess: () => void
}

export function MarkSoldModal({
  isOpen,
  onClose,
  listingId,
  listingTitle,
  onSuccess,
}: MarkSoldModalProps) {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState<string | null>(null) // buyerId or "offline"
  const [error, setError] = useState<string | null>(null)
  const [partners, setPartners] = useState<any[]>([])
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    if (isOpen && listingId) {
      loadPartners()
    } else {
      // Reset state on close
      setPartners([])
      setError(null)
      setSubmitting(null)
      setShowSuccess(false)
    }
  }, [isOpen, listingId])

  async function loadPartners() {
    try {
      setLoading(true)
      setError(null)
      const res = await getListingChatPartners(listingId)
      if (res.error) {
        setError(res.error)
      } else {
        setPartners(res.partners || [])
      }
    } catch (err) {
      console.error(err)
      setError("Failed to fetch potential buyers.")
    } finally {
      setLoading(false)
    }
  }

  async function handleComplete(buyerId: string | null) {
    const submitKey = buyerId || "offline"
    try {
      setSubmitting(submitKey)
      setError(null)
      const res = await completeDeal(listingId, buyerId)
      if (res.error) {
        setError(res.error)
      } else {
        setShowSuccess(true)
        setTimeout(() => {
          onSuccess()
          onClose()
        }, 1800)
      }
    } catch (err) {
      console.error(err)
      setError("Failed to complete deal.")
    } finally {
      setSubmitting(null)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={submitting ? undefined : onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-[2rem] border border-outline-variant/30 bg-surface text-on-surface shadow-2xl premium-shadow flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-outline-variant/15 p-5">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                  <ShoppingBag size={18} />
                </div>
                <h3 className="font-display text-lg font-black text-slate-800">Mark as Sold</h3>
              </div>
              {!submitting && !showSuccess && (
                <button
                  onClick={onClose}
                  className="rounded-full p-1.5 hover:bg-slate-100 transition-colors text-on-surface-variant cursor-pointer"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Inner Content */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-none">
              {showSuccess ? (
                /* Success Animation State */
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-8 text-center space-y-4"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                    <Check size={32} strokeWidth={3} />
                  </div>
                  <div>
                    <h4 className="font-display text-xl font-bold text-slate-800">Deal Completed! 🎉</h4>
                    <p className="mt-1 text-sm text-on-surface-variant max-w-[280px] mx-auto">
                      Listing status updated to Sold. Review reminder emails have been sent out.
                    </p>
                  </div>
                </motion.div>
              ) : loading ? (
                /* Loading State */
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin text-[var(--seller-primary)]" />
                  <p className="text-sm text-on-surface-variant font-semibold">Scanning campus negotiations...</p>
                </div>
              ) : error ? (
                /* Error State */
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-center">
                  <AlertCircle className="mx-auto h-8 w-8 text-red-500" />
                  <p className="mt-2 text-sm text-red-700 font-semibold">{error}</p>
                  <button
                    onClick={loadPartners}
                    className="mt-3 text-xs font-bold text-red-600 hover:underline"
                  >
                    Retry Loading
                  </button>
                </div>
              ) : (
                /* Standard Buyer Selection State */
                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--seller-primary)]">Item</p>
                    <p className="mt-1 font-body text-sm font-bold text-slate-800 line-clamp-1">{listingTitle}</p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">Who bought this item?</p>
                    <p className="mt-1 text-xs text-on-surface-variant leading-relaxed">
                      Select the student you traded with from your active chats. This updates their buyer reputation profile and lets you both leave feedback.
                    </p>
                  </div>

                  {/* List of Chat Buyers */}
                  <div className="space-y-2">
                    {partners.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-outline-variant/30 p-6 text-center">
                        <MessageSquare className="mx-auto h-8 w-8 text-outline/30 mb-2" />
                        <p className="text-xs font-bold text-on-surface-variant">No active student chat threads</p>
                        <p className="text-[10px] text-on-surface-variant/80 mt-1">
                          You haven't received messages on BuyKarlo for this listing yet.
                        </p>
                      </div>
                    ) : (
                      partners.map((buyer) => {
                        const isThisSubmitting = submitting === buyer.id
                        const isAnySubmitting = submitting !== null

                        return (
                          <button
                            key={buyer.id}
                            disabled={isAnySubmitting}
                            onClick={() => handleComplete(buyer.id)}
                            className="w-full flex items-center justify-between p-3 rounded-2xl border border-outline-variant/25 bg-white hover:border-primary/50 hover:bg-slate-50 transition-all text-left group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {buyer.avatar_url ? (
                                <img
                                  src={buyer.avatar_url}
                                  alt={buyer.full_name}
                                  className="w-10 h-10 rounded-full object-cover border border-outline-variant/10"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                                  {buyer.full_name?.substring(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-slate-800 truncate">{buyer.full_name}</p>
                                <p className="text-[10px] text-on-surface-variant truncate">{buyer.email}</p>
                              </div>
                            </div>
                            {isThisSubmitting ? (
                              <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                            ) : (
                              <ChevronRight size={16} className="text-outline/40 group-hover:text-primary transition-colors shrink-0" />
                            )}
                          </button>
                        )
                      })
                    )}
                  </div>

                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-outline-variant/15"></div>
                    <span className="flex-shrink mx-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Or</span>
                    <div className="flex-grow border-t border-outline-variant/15"></div>
                  </div>

                  {/* Offline fallback button */}
                  <button
                    disabled={submitting !== null}
                    onClick={() => handleComplete(null)}
                    className="w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl border border-dashed border-outline-variant/30 hover:border-slate-400 text-xs font-bold text-on-surface-variant hover:text-foreground hover:bg-slate-50/50 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {submitting === "offline" ? (
                      <Loader2 className="h-4 w-4 animate-spin text-on-surface-variant" />
                    ) : (
                      <>
                        <span>Sold outside BuyKarlo / Someone else</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
