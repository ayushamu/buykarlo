"use client"

import { useState, useEffect, useTransition } from "react"
import Link from "next/link"
import { ShoppingBag, Loader2, Heart, HeartOff, ArrowRight } from "lucide-react"
import { getSavedListings, toggleSaveListing } from "@/features/saved/actions"
import { ListingCard } from "@/components/listing/ListingCard"
import { cn } from "@/lib/utils"

export default function CartWishlistPage() {
  const [savedItems, setSavedItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const loadSavedItems = async () => {
    setLoading(true)
    const res = await getSavedListings()
    if (res.success && res.listings) {
      setSavedItems(res.listings)
    } else {
      setErrorMsg(res.error || "Failed to load saved items.")
    }
    setLoading(false)
  }

  useEffect(() => {
    loadSavedItems()
  }, [])

  const handleRemove = (listingId: string) => {
    setErrorMsg(null)
    
    // Optimistic UI update
    const previousItems = [...savedItems]
    setSavedItems(prev => prev.filter(item => item.id !== listingId))

    startTransition(async () => {
      const res = await toggleSaveListing(listingId)
      if (res.error) {
        setErrorMsg(res.error)
        setSavedItems(previousItems) // Revert on database transaction error
      }
    })
  }

  return (
    <div className="mx-auto max-w-container-max px-margin-mobile py-8 md:px-margin-desktop md:py-12 flex flex-col gap-8 text-left">
      <div>
        <h2 className="font-display text-3xl font-extrabold text-slate-800">
          Saved Deals &amp; Wishlist
        </h2>
        <p className="font-body text-xs text-on-surface-variant mt-1 leading-normal">
          Watch listings, compare student offers, and keep track of items before negotiating meetups.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-error/5 border border-error/15 text-error font-body text-xs font-semibold rounded-2xl">
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2 text-on-surface-variant">
          <Loader2 className="animate-spin text-primary" size={24} />
          <span className="font-body text-xs font-semibold">Loading saved listings...</span>
        </div>
      ) : savedItems.length === 0 ? (
        <div className="bg-white border border-outline-variant/15 rounded-[2rem] p-12 md:p-16 flex flex-col items-center text-center gap-4 max-w-xl mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center text-primary">
            <Heart size={30} className="text-primary fill-primary/10" />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="font-display text-xl font-extrabold text-slate-800">Your wishlist is empty</h3>
            <p className="font-body text-xs text-on-surface-variant leading-relaxed max-w-xs mx-auto">
              Save textbook deals, cycles, or dorm decor from the feed to keep track of items you like.
            </p>
          </div>
          <Link
            href="/"
            className="action-gradient text-white px-6 py-3 rounded-full font-body text-label-md font-bold shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 mt-2 select-none"
          >
            <span>Explore Campus Deals</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {savedItems.map((item, index) => (
            <div key={item.id} className="relative group flex flex-col h-full">
              <div className="flex-1">
                <ListingCard {...item} priority={index < 4} />
              </div>
              <button
                onClick={() => handleRemove(item.id)}
                disabled={isPending}
                className="absolute top-3 left-3 z-20 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-rose-600 border border-outline-variant/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-sm disabled:opacity-55"
                title="Remove from saved"
              >
                <HeartOff size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
