"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertCircle, BadgeCheck, Mail, MessageSquare, Phone, ShieldCheck, ShoppingBag, Timer } from "lucide-react"
import { getSellerDashboardData } from "@/features/listings/actions"
import { SellerSectionHeader, type SellerListingItem } from "@/components/seller/SellerPrimitives"

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

function getInitials(name?: string | null) {
  if (!name) return "BK"
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

export default function TrustScorePage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [stats, setStats] = useState<StatsData | null>(null)
  const [listings, setListings] = useState<SellerListingItem[]>([])

  async function loadTrustData() {
    try {
      setLoading(true)
      const res = await getSellerDashboardData()
      if (res.error) {
        setError(res.error)
        return
      }
      setError(null)
      setProfile((res.profile as ProfileData | null) ?? null)
      setStats((res.stats as StatsData) ?? null)
      setListings((res.listings as SellerListingItem[]) ?? [])
    } catch (err) {
      console.error(err)
      setError("Failed to load trust score insights.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTrustData()
  }, [])

  const trustScore = profile?.trust_score ?? 0
  const trustStatus = trustScore >= 80 ? "Excellent standing" : trustScore >= 50 ? "Solid standing" : "Building reputation"
  const trustProgress = Math.min(100, Math.max(12, trustScore))
  const reviewsUnlocked = (stats?.soldCount ?? 0) >= 3
  const featuredListings = useMemo(() => listings.filter((listing) => listing.status === "active").slice(0, 2), [listings])

  if (loading) {
    return <div className="h-64 animate-pulse rounded-[2rem] bg-[var(--seller-surface)]" />
  }

  if (error) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 rounded-[2rem] seller-panel p-8 text-center">
        <AlertCircle size={42} className="text-red-500" />
        <div>
          <h2 className="font-display text-3xl font-bold text-on-surface">Trust insights unavailable</h2>
          <p className="mt-2 text-on-surface-variant">{error}</p>
        </div>
        <button onClick={loadTrustData} className="rounded-full bg-[var(--seller-primary)] px-5 py-3 text-sm font-bold text-white">
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      <SellerSectionHeader
        eyebrow="Reputation"
        title="Trust & Profile"
        description="A calm reputation dashboard that helps buyers feel safe and helps you understand what strengthens campus trust."
      />

      <section className="overflow-hidden rounded-[2rem] border border-[var(--seller-border)] bg-white shadow-[0_20px_40px_rgba(31,157,119,0.08)]">
        <div className="seller-soft-gradient px-6 py-8 text-center">
          <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border-[6px] border-[var(--seller-border)] bg-[var(--seller-surface)] text-4xl font-extrabold text-[var(--seller-primary)]">
            {getInitials(profile?.full_name)}
          </div>
          <h2 className="mt-5 font-display text-4xl font-extrabold tracking-tight text-on-surface">{profile?.full_name || "Campus Seller"}</h2>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-sm font-semibold">
            <span className="rounded-full bg-[var(--seller-surface)] px-4 py-2 text-[var(--seller-primary-strong)]">{profile?.university || "BuyKarlo Campus"}</span>
            {profile?.department ? <span className="rounded-full bg-surface-container-low px-4 py-2 text-on-surface-variant">{profile.department}</span> : null}
            <span className="rounded-full bg-[#fff4dc] px-4 py-2 text-[#9b5b00]">Active Seller</span>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-sm font-semibold">
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--seller-border)] bg-[var(--seller-surface)] px-4 py-2 text-[var(--seller-primary-strong)]">
              <Phone size={16} />
              Phone Verified
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--seller-border)] bg-[var(--seller-surface)] px-4 py-2 text-[var(--seller-primary-strong)]">
              <Mail size={16} />
              Student Email
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#ffd676] bg-[#fff8e7] px-4 py-2 text-[#a15b00]">
              <BadgeCheck size={16} />
              Trusted Seller
            </span>
          </div>
        </div>

        <div className="grid gap-4 border-t border-outline-variant/20 px-6 py-6 text-center sm:grid-cols-3">
          <div>
            <p className="text-4xl font-extrabold tracking-tight text-on-surface">~2 hrs</p>
            <p className="mt-2 text-sm text-on-surface-variant">Response Time</p>
          </div>
          <div className="sm:border-x sm:border-outline-variant/20">
            <p className="text-4xl font-extrabold tracking-tight text-on-surface">{stats?.pendingChats ? "92%" : "100%"}</p>
            <p className="mt-2 text-sm text-on-surface-variant">Response Rate</p>
          </div>
          <div>
            <p className="text-4xl font-extrabold tracking-tight text-[var(--seller-primary)]">{stats?.soldCount ?? 0}</p>
            <p className="mt-2 text-sm text-on-surface-variant">Items Sold</p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-6">
          <div className="rounded-[2rem] seller-card p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--seller-surface)] text-[var(--seller-primary)]">
                <ShieldCheck size={22} />
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--seller-primary)]">Trust Score</p>
                <h3 className="font-display text-3xl font-bold tracking-tight text-on-surface">{trustStatus}</h3>
              </div>
            </div>

            <div className="mt-6 rounded-[1.75rem] border border-[var(--seller-border)] bg-[var(--seller-surface)] p-5">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-sm font-semibold text-[var(--seller-text-soft)]">Current reputation score</p>
                  <p className="mt-2 font-display text-5xl font-extrabold tracking-tight text-[var(--seller-primary-strong)]">{trustScore}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-[var(--seller-text-soft)]">Standing</p>
                  <p className="mt-2 text-lg font-bold text-on-surface">{trustStatus}</p>
                </div>
              </div>
              <div className="mt-5 h-3 rounded-full bg-white/80">
                <div
                  className="h-3 rounded-full bg-[var(--seller-primary)] shadow-[0_10px_20px_rgba(31,157,119,0.18)]"
                  style={{ width: `${trustProgress}%` }}
                />
              </div>
              <p className="mt-3 text-sm text-[var(--seller-text-soft)]">Replying quickly, selling honestly, and keeping listings current helps your score climb.</p>
            </div>
          </div>

          <div className="rounded-[2rem] seller-card p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--seller-surface)] text-[var(--seller-primary)]">
                <ShoppingBag size={22} />
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--seller-primary)]">Active Listings</p>
                <h3 className="font-display text-3xl font-bold tracking-tight text-on-surface">Current campus shelf</h3>
              </div>
            </div>

            {featuredListings.length === 0 ? (
              <div className="mt-5 rounded-[1.75rem] border border-dashed border-[var(--seller-border)] bg-[var(--seller-surface)] px-6 py-10 text-center">
                <p className="font-semibold text-on-surface">No active listings yet.</p>
              </div>
            ) : (
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {featuredListings.map((listing) => (
                  <div key={listing.id} className="overflow-hidden rounded-[1.75rem] border border-outline-variant/20 bg-white">
                    <div className="aspect-[4/3] bg-[var(--seller-surface)]" style={listing.imageUrl ? { backgroundImage: `url(${listing.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined} />
                    <div className="space-y-2 p-4">
                      <p className="line-clamp-1 font-display text-2xl font-bold tracking-tight text-on-surface">{listing.title}</p>
                      <p className="font-display text-4xl font-extrabold tracking-tight text-[var(--seller-primary)]">₹{listing.price.toLocaleString("en-IN")}</p>
                      <div className="flex flex-wrap gap-3 text-sm font-medium">
                        <span className="inline-flex items-center gap-1 text-on-surface-variant">
                          <Timer size={14} />
                          {listing.viewCount} views today
                        </span>
                        <span className="inline-flex items-center gap-1 text-[var(--seller-primary-strong)]">
                          <MessageSquare size={14} />
                          {listing.activeChats} unread chats
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-[2rem] border border-dashed border-outline-variant/30 bg-white p-8 text-center shadow-[0_20px_40px_rgba(15,23,42,0.04)]">
            {reviewsUnlocked ? (
              <>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--seller-primary)]">Buyer Reviews</p>
                <h3 className="mt-4 font-display text-3xl font-bold tracking-tight text-on-surface">Reviews are now live</h3>
                <p className="mt-3 text-on-surface-variant">You have enough completed deals to start showcasing buyer feedback on your profile.</p>
              </>
            ) : (
              <>
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-surface-container-low text-on-surface-variant">
                  <ShieldCheck size={34} />
                </div>
                <h3 className="mt-5 font-display text-3xl font-bold tracking-tight text-on-surface">Reviews Section Locked</h3>
                <p className="mt-3 text-on-surface-variant">
                  Reviews unlock automatically after 3 completed student transactions. You currently have {stats?.soldCount ?? 0}.
                </p>
              </>
            )}
          </div>

          <div className="rounded-[2rem] seller-card p-6">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--seller-primary)]">What builds trust</p>
            <div className="mt-5 space-y-3">
              <div className="rounded-[1.5rem] border border-[var(--seller-border)] bg-[var(--seller-surface)] px-4 py-4">
                <p className="font-semibold text-[var(--seller-primary-strong)]">Keep listings accurate and current.</p>
              </div>
              <div className="rounded-[1.5rem] border border-outline-variant/20 bg-white px-4 py-4">
                <p className="font-semibold text-on-surface">Reply quickly during active negotiation windows.</p>
              </div>
              <div className="rounded-[1.5rem] border border-outline-variant/20 bg-white px-4 py-4">
                <p className="font-semibold text-on-surface">Mark sold items promptly to avoid buyer frustration.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
