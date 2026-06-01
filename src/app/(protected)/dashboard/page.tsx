"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { AlertCircle, ArrowRight, Lightbulb, MessageSquare, Sparkles, TrendingUp } from "lucide-react"
import { deleteListing, getSellerDashboardData, updateListingStatus } from "@/features/listings/actions"
import {
  SellerFilterPills,
  SellerListingCard,
  SellerSectionHeader,
  SellerStatCard,
  type SellerListingItem,
} from "@/components/seller/SellerPrimitives"
import { MarkSoldModal } from "@/components/seller/MarkSoldModal"
import { PendingReviewsBanner } from "@/components/dashboard/PendingReviewsBanner"

interface ProfileData {
  full_name: string | null
  avatar_url: string | null
  university: string | null
  department: string | null
  trust_score: number | null
  created_at: string | null
}

interface StatsData {
  activeCount: number
  soldCount: number
  deactivatedCount: number
  totalEarnings: number
  totalViews: number
  pendingChats: number
}

const filters = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Sold", value: "sold" },
  { label: "Paused", value: "hidden" },
]

export default function SellerDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [stats, setStats] = useState<StatsData>({
    activeCount: 0,
    soldCount: 0,
    deactivatedCount: 0,
    totalEarnings: 0,
    totalViews: 0,
    pendingChats: 0,
  })
  const [listings, setListings] = useState<SellerListingItem[]>([])
  const [activeFilter, setActiveFilter] = useState("all")
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  
  // Mark Sold Modal State
  const [markSoldOpen, setMarkSoldOpen] = useState(false)
  const [markSoldListing, setMarkSoldListing] = useState<{ id: string; title: string } | null>(null)

  async function loadDashboardData() {
    try {
      setLoading(true)
      const res = await getSellerDashboardData()
      if (res.error) {
        setError(res.error)
        return
      }
      setError(null)
      setProfile((res.profile as ProfileData | null) ?? null)
      setStats(res.stats as StatsData)
      setListings((res.listings as SellerListingItem[]) ?? [])
    } catch (err) {
      console.error(err)
      setError("Failed to load dashboard data.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
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
        await loadDashboardData()
      }
    } catch (err) {
      console.error(err)
      alert("Failed to update listing status.")
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
        await loadDashboardData()
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
    if (activeFilter === "all") return listings
    return listings.filter((listing) => listing.status === activeFilter)
  }, [activeFilter, listings])

  const trustScore = profile?.trust_score ?? 0
  const trustBand = trustScore >= 80 ? "High trust" : trustScore >= 50 ? "Growing trust" : "New seller"

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-28 animate-pulse rounded-[2rem] bg-[var(--seller-surface)]" />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-40 animate-pulse rounded-[2rem] bg-[var(--seller-surface)]" />
          <div className="h-40 animate-pulse rounded-[2rem] bg-[var(--seller-surface)]" />
          <div className="h-40 animate-pulse rounded-[2rem] bg-[var(--seller-surface)]" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 rounded-[2rem] seller-panel p-8 text-center">
        <AlertCircle size={42} className="text-red-500" />
        <div>
          <h2 className="font-display text-3xl font-bold text-on-surface">Dashboard unavailable</h2>
          <p className="mt-2 text-on-surface-variant">{error}</p>
        </div>
        <button
          onClick={loadDashboardData}
          className="rounded-full bg-[var(--seller-primary)] px-5 py-3 text-sm font-bold text-white"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8 md:space-y-8">
      <section className="seller-soft-gradient overflow-hidden rounded-[2rem] border border-[var(--seller-border)] p-5 md:p-8">
        <SellerSectionHeader
          eyebrow="Seller Overview"
          title={`Hi, ${profile?.full_name?.split(" ")[0] || "Seller"}`}
          description="Track live demand, respond quickly, and keep your active campus inventory moving."
          action={
            <Link
              href="/sell"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--seller-primary)] px-5 py-3 text-sm font-bold text-white shadow-[0_16px_32px_rgba(31,157,119,0.22)]"
            >
              Create Listing
              <ArrowRight size={16} />
            </Link>
          }
        />

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SellerStatCard label="Views Today" value={`${stats.totalViews}`} detail="Campus buyers are discovering your listings." tone="mint" />
          <SellerStatCard label="New Messages" value={`${stats.pendingChats}`} detail="Reply fast to increase closing odds." tone="mint" />
          <SellerStatCard label="Total Earnings" value={`₹${stats.totalEarnings.toLocaleString("en-IN")}`} detail="Completed sales across your seller profile." tone="blue" />
          <SellerStatCard label="Trust Score" value={`${trustScore}`} detail={trustBand} />
        </div>
      </section>

      {/* Pending Reviews Notification Banner */}
      <PendingReviewsBanner />

      <div className="grid gap-6 xl:grid-cols-[1.05fr_1.55fr]">
        <section className="space-y-5">
          <div className="rounded-[2rem] seller-card p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--seller-surface)] text-[var(--seller-primary)]">
                <TrendingUp size={22} />
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--seller-primary)]">My Performance</p>
                <h2 className="font-display text-3xl font-bold tracking-tight text-on-surface">Built for calm selling</h2>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <div className="rounded-[1.75rem] border border-outline-variant/20 bg-white p-5">
                <p className="text-4xl font-extrabold tracking-tight text-on-surface">{stats.totalViews}</p>
                <p className="mt-2 text-sm text-on-surface-variant">Total views on active and sold inventory.</p>
              </div>
              <div className="rounded-[1.75rem] border border-[var(--seller-border)] bg-[var(--seller-surface)] p-5">
                <p className="text-4xl font-extrabold tracking-tight text-[var(--seller-primary-strong)]">{stats.pendingChats}</p>
                <p className="mt-2 text-sm text-[var(--seller-text-soft)]">Buyer chats waiting for your attention.</p>
              </div>
              <div className="rounded-[1.75rem] border border-[#cdddff] bg-[#eff4ff] p-5 dark:bg-[#17233d]">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#234ec6]">Total Earnings</p>
                <p className="mt-3 text-4xl font-extrabold tracking-tight text-[#234ec6]">
                  ₹{stats.totalEarnings.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] seller-card p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--seller-surface)] text-[var(--seller-primary)]">
                <Sparkles size={22} />
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--seller-primary)]">Seller Guidance</p>
                <h3 className="font-display text-2xl font-bold tracking-tight text-on-surface">AI-oracle advice</h3>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="rounded-[1.75rem] border border-[var(--seller-border)] bg-[var(--seller-surface)] p-5 text-[var(--seller-primary-strong)]">
                <p className="text-lg font-semibold">
                  Fast selling season: calculators and textbooks usually spike before semester starts.
                </p>
              </div>
              <div className="rounded-[1.75rem] border border-outline-variant/20 bg-white p-5 text-on-surface-variant">
                <p className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface">
                  <Lightbulb size={16} className="text-[var(--seller-primary)]" />
                  Response habit
                </p>
                <p className="mt-2 text-base">Sellers who reply within 10 minutes usually close campus deals faster.</p>
              </div>
              <Link href="/dashboard/trust" className="inline-flex items-center gap-2 text-sm font-bold text-[var(--seller-primary-strong)]">
                Open trust insights
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </section>

        <section className="space-y-5">
          <div className="flex flex-col gap-4 rounded-[2rem] seller-card p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--seller-primary)]">Inventory</p>
                <h2 className="font-display text-4xl font-bold tracking-tight text-on-surface">Active listings</h2>
                <p className="mt-2 text-sm text-on-surface-variant">Manage live campus offers with quick actions built for phone-first workflows.</p>
              </div>
              <SellerFilterPills items={filters} value={activeFilter} onChange={setActiveFilter} />
            </div>

            {filteredListings.length === 0 ? (
              <div className="rounded-[2rem] border border-dashed border-[var(--seller-border)] bg-[var(--seller-surface)] px-6 py-12 text-center">
                <p className="font-display text-3xl font-bold text-on-surface">No listings in this view</p>
                <p className="mt-2 text-on-surface-variant">Create your next listing or switch filters to review sold and paused items.</p>
                <Link
                  href="/sell"
                  className="mt-5 inline-flex rounded-full bg-[var(--seller-primary)] px-5 py-3 text-sm font-bold text-white"
                >
                  Add listing
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {filteredListings.slice(0, 4).map((listing) => (
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
              </div>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[2rem] seller-card p-6">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--seller-primary)]">Response Rate</p>
              <p className="mt-4 font-display text-5xl font-extrabold tracking-tight text-on-surface">
                {stats.pendingChats > 0 ? "92%" : "100%"}
              </p>
              <p className="mt-2 text-sm text-on-surface-variant">Healthy response speed keeps your reputation strong during peak interest.</p>
            </div>
            <div className="rounded-[2rem] bg-[var(--seller-primary)] p-6 text-white shadow-[0_18px_38px_rgba(31,157,119,0.28)]">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/80">Buyer Inbox</p>
              <p className="mt-4 font-display text-5xl font-extrabold tracking-tight">{stats.pendingChats} open chats</p>
              <p className="mt-2 text-sm text-white/80">Move buyers from interest to meetup by replying while demand is warm.</p>
              <Link href="/messages" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-white">
                Open messages
                <MessageSquare size={15} />
              </Link>
            </div>
          </div>
        </section>
      </div>
      {markSoldListing && (
        <MarkSoldModal
          isOpen={markSoldOpen}
          onClose={() => {
            setMarkSoldOpen(false)
            setMarkSoldListing(null)
          }}
          listingId={markSoldListing.id}
          listingTitle={markSoldListing.title}
          onSuccess={loadDashboardData}
        />
      )}
    </div>
  )
}
