"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { AlertCircle, Plus, Search } from "lucide-react"
import { deleteListing, getSellerDashboardData, updateListingStatus } from "@/features/listings/actions"
import {
  SellerFilterPills,
  SellerListingCard,
  SellerSectionHeader,
  type SellerListingItem,
} from "@/components/seller/SellerPrimitives"
import { MarkSoldModal } from "@/components/seller/MarkSoldModal"

const tabs = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Sold", value: "sold" },
  { label: "Paused", value: "hidden" },
]

interface StatsData {
  activeCount: number
  soldCount: number
  deactivatedCount: number
  totalEarnings: number
  totalViews: number
  pendingChats: number
}

export default function MyListingsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<StatsData | null>(null)
  const [listings, setListings] = useState<SellerListingItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  
  // Mark Sold Modal State
  const [markSoldOpen, setMarkSoldOpen] = useState(false)
  const [markSoldListing, setMarkSoldListing] = useState<{ id: string; title: string } | null>(null)

  async function loadListingsData() {
    try {
      setLoading(true)
      const res = await getSellerDashboardData()
      if (res.error) {
        setError(res.error)
        return
      }
      setError(null)
      setStats(res.stats as StatsData)
      setListings((res.listings as SellerListingItem[]) ?? [])
    } catch (err) {
      console.error(err)
      setError("Failed to load listings.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadListingsData()
  }, [])

  async function updateStatus(id: string, status: "active" | "sold" | "hidden") {
    if (status === "sold") {
      const listing = listings.find((l) => l.id === id)
      if (listing) {
        setMarkSoldListing({ id: listing.id, title: listing.title })
        setMarkSoldOpen(true)
      }
      return
    }

    try {
      setActionLoading(id)
      const res = await updateListingStatus(id, status)
      if (res.error) {
        alert(res.error)
      } else {
        await loadListingsData()
      }
    } catch (err) {
      console.error(err)
      alert("Failed to update listing.")
    } finally {
      setActionLoading(null)
    }
  }

  async function handleDelete(id: string) {
    try {
      setActionLoading(id)
      const res = await deleteListing(id)
      if (res.error) {
        alert(res.error)
      } else {
        setConfirmDeleteId(null)
        await loadListingsData()
      }
    } catch (err) {
      console.error(err)
      alert("Failed to delete listing.")
    } finally {
      setActionLoading(null)
    }
  }

  function handleShare(id: string) {
    if (typeof window === "undefined") return
    navigator.clipboard.writeText(`${window.location.origin}/item/${id}`)
    setCopiedId(id)
    window.setTimeout(() => setCopiedId(null), 1600)
  }

  const filteredListings = useMemo(() => {
    return listings.filter((listing) => {
      const matchesTab = activeTab === "all" ? true : listing.status === activeTab
      const normalizedQuery = searchQuery.trim().toLowerCase()
      const matchesSearch =
        normalizedQuery.length === 0 ||
        listing.title.toLowerCase().includes(normalizedQuery) ||
        listing.categoryName.toLowerCase().includes(normalizedQuery)

      return matchesTab && matchesSearch
    })
  }, [activeTab, listings, searchQuery])

  if (loading) {
    return <div className="h-56 animate-pulse rounded-[2rem] bg-[var(--seller-surface)]" />
  }

  if (error) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 rounded-[2rem] seller-panel p-8 text-center">
        <AlertCircle size={42} className="text-red-500" />
        <div>
          <h2 className="font-display text-3xl font-bold text-on-surface">Listings unavailable</h2>
          <p className="mt-2 text-on-surface-variant">{error}</p>
        </div>
        <button onClick={loadListingsData} className="rounded-full bg-[var(--seller-primary)] px-5 py-3 text-sm font-bold text-white">
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      <SellerSectionHeader
        eyebrow="Seller Inventory"
        title="My Listings"
        description="Manage live, sold, and paused items without losing the calm mobile-first flow."
        action={
          <Link
            href="/sell"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--seller-primary)] px-5 py-3 text-sm font-bold text-white shadow-[0_16px_32px_rgba(31,157,119,0.22)]"
          >
            <Plus size={16} />
            Create Listing
          </Link>
        }
      />

      <section className="rounded-[2rem] seller-card p-5 md:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <label className="flex items-center gap-3 rounded-full border border-[var(--seller-border)] bg-[var(--seller-surface)] px-4 py-3 text-sm text-[var(--seller-text-soft)] xl:min-w-[320px]">
            <Search size={18} className="text-[var(--seller-primary-strong)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your items, categories, or status..."
              className="w-full bg-transparent outline-none placeholder:text-[var(--seller-text-soft)]"
            />
          </label>
          <SellerFilterPills items={tabs} value={activeTab} onChange={setActiveTab} />
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-[1.5rem] border border-outline-variant/20 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">Live Inventory</p>
            <p className="mt-3 text-3xl font-extrabold tracking-tight text-on-surface">{stats?.activeCount ?? 0}</p>
          </div>
          <div className="rounded-[1.5rem] border border-[var(--seller-border)] bg-[var(--seller-surface)] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--seller-primary)]">Paused Listings</p>
            <p className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--seller-primary-strong)]">{stats?.deactivatedCount ?? 0}</p>
          </div>
          <div className="rounded-[1.5rem] border border-[#cdddff] bg-[#eff4ff] p-4 dark:bg-[#17233d]">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#234ec6]">Sold Listings</p>
            <p className="mt-3 text-3xl font-extrabold tracking-tight text-[#234ec6]">{stats?.soldCount ?? 0}</p>
          </div>
        </div>
      </section>

      {filteredListings.length === 0 ? (
        <section className="rounded-[2rem] seller-card px-6 py-12 text-center">
          <h2 className="font-display text-3xl font-bold text-on-surface">No listings match this view</h2>
          <p className="mt-2 text-on-surface-variant">Try another filter or create a new listing to keep your shelf active.</p>
          <Link href="/sell" className="mt-5 inline-flex rounded-full bg-[var(--seller-primary)] px-5 py-3 text-sm font-bold text-white">
            Add listing
          </Link>
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredListings.map((listing) => (
            <SellerListingCard
              key={listing.id}
              listing={listing}
              actionLoading={actionLoading}
              confirmDeleteId={confirmDeleteId}
              copied={copiedId === listing.id}
              onPause={(id) => updateStatus(id, "hidden")}
              onResume={(id) => updateStatus(id, "active")}
              onSold={(id) => updateStatus(id, "sold")}
              onDelete={handleDelete}
              onShare={handleShare}
              onConfirmDelete={setConfirmDeleteId}
              onCancelDelete={() => setConfirmDeleteId(null)}
            />
          ))}
        </section>
      )}
      {markSoldListing && (
        <MarkSoldModal
          isOpen={markSoldOpen}
          onClose={() => {
            setMarkSoldOpen(false)
            setMarkSoldListing(null)
          }}
          listingId={markSoldListing.id}
          listingTitle={markSoldListing.title}
          onSuccess={loadListingsData}
        />
      )}
    </div>
  )
}
