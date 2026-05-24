"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AlertCircle, Calendar, MapPin, MessageSquare, ShoppingBag } from "lucide-react"
import { getSellerOrdersData, updateListingStatus } from "@/features/listings/actions"
import { SellerFilterPills, SellerSectionHeader } from "@/components/seller/SellerPrimitives"

interface TransactionItem {
  id: string
  title: string
  price: number
  status: "completed" | "in_progress" | "cancelled"
  createdAt: string
  imageUrl: string | null
  buyerName?: string
  sellerName?: string
}

const tabs = [
  { label: "Sales", value: "sales" },
  { label: "Purchases", value: "purchases" },
]

export default function OrdersPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sales, setSales] = useState<TransactionItem[]>([])
  const [purchases, setPurchases] = useState<TransactionItem[]>([])
  const [activeTab, setActiveTab] = useState("sales")

  async function loadOrdersData() {
    try {
      setLoading(true)
      const res = await getSellerOrdersData()
      if (res.error) {
        setError(res.error)
        return
      }
      setError(null)
      setSales((res.sales as TransactionItem[]) ?? [])
      setPurchases((res.purchases as TransactionItem[]) ?? [])
    } catch (err) {
      console.error(err)
      setError("Failed to load order history.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrdersData()
  }, [])

  async function handleRelist(listingId: string) {
    try {
      const res = await updateListingStatus(listingId, "active")
      if (res.error) {
        alert(res.error)
      } else {
        await loadOrdersData()
      }
    } catch (err) {
      console.error(err)
      alert("Failed to relist listing.")
    }
  }

  const items = activeTab === "sales" ? sales : purchases

  if (loading) {
    return <div className="h-64 animate-pulse rounded-[2rem] bg-[var(--seller-surface)]" />
  }

  if (error) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 rounded-[2rem] seller-panel p-8 text-center">
        <AlertCircle size={42} className="text-red-500" />
        <div>
          <h2 className="font-display text-3xl font-bold text-on-surface">Orders unavailable</h2>
          <p className="mt-2 text-on-surface-variant">{error}</p>
        </div>
        <button onClick={loadOrdersData} className="rounded-full bg-[var(--seller-primary)] px-5 py-3 text-sm font-bold text-white">
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      <SellerSectionHeader
        eyebrow="Transactions"
        title="Orders"
        description="Track your completed campus sales and purchase conversations in one calmer seller workspace."
      />

      <section className="rounded-[2rem] seller-card p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="grid gap-3 sm:grid-cols-3 md:max-w-2xl md:flex-1">
            <div className="rounded-[1.5rem] border border-outline-variant/20 bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">Total Sales</p>
              <p className="mt-3 text-3xl font-extrabold tracking-tight text-on-surface">{sales.length}</p>
            </div>
            <div className="rounded-[1.5rem] border border-[var(--seller-border)] bg-[var(--seller-surface)] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--seller-primary)]">Purchases</p>
              <p className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--seller-primary-strong)]">{purchases.length}</p>
            </div>
            <div className="rounded-[1.5rem] border border-[#cdddff] bg-[#eff4ff] p-4 dark:bg-[#17233d]">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#234ec6]">Completed</p>
              <p className="mt-3 text-3xl font-extrabold tracking-tight text-[#234ec6]">{sales.length + purchases.filter((item) => item.status === "completed").length}</p>
            </div>
          </div>
          <SellerFilterPills items={tabs} value={activeTab} onChange={setActiveTab} />
        </div>
      </section>

      {items.length === 0 ? (
        <section className="rounded-[2rem] seller-card px-6 py-12 text-center">
          <h2 className="font-display text-3xl font-bold text-on-surface">No {activeTab} yet</h2>
          <p className="mt-2 text-on-surface-variant">
            {activeTab === "sales"
              ? "Completed campus deals will appear here once you mark listings as sold."
              : "Your purchase history will appear here after you start conversations with other sellers."}
          </p>
          <Link href={activeTab === "sales" ? "/dashboard/listings" : "/"} className="mt-5 inline-flex rounded-full bg-[var(--seller-primary)] px-5 py-3 text-sm font-bold text-white">
            {activeTab === "sales" ? "Go to listings" : "Browse marketplace"}
          </Link>
        </section>
      ) : (
        <section className="grid gap-4">
          {items.map((item) => (
            <article key={`${activeTab}-${item.id}`} className="overflow-hidden rounded-[2rem] border border-[var(--seller-border)] bg-white shadow-[0_20px_40px_rgba(31,157,119,0.08)] md:grid md:grid-cols-[220px_1fr]">
              <div
                className="min-h-[180px] bg-[var(--seller-surface)]"
                style={item.imageUrl ? { backgroundImage: `url(${item.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
              />
              <div className="space-y-5 p-5 md:p-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-display text-3xl font-bold tracking-tight text-on-surface">{item.title}</p>
                    <p className="mt-2 font-display text-4xl font-extrabold tracking-tight text-[var(--seller-primary)]">₹{item.price.toLocaleString("en-IN")}</p>
                  </div>
                  <div className="rounded-full bg-[var(--seller-surface)] px-4 py-2 text-sm font-semibold text-[var(--seller-primary-strong)]">
                    {item.status === "completed" ? "Completed" : item.status === "in_progress" ? "In Progress" : "Cancelled"}
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-sm font-medium text-on-surface-variant">
                  <span className="inline-flex items-center gap-2">
                    <Calendar size={15} />
                    {new Date(item.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <MapPin size={15} />
                    Campus meetup ready
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <MessageSquare size={15} />
                    {activeTab === "sales" ? item.buyerName || "Campus Buyer" : item.sellerName || "Campus Seller"}
                  </span>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link href="/messages" className="inline-flex items-center gap-2 rounded-full border border-[var(--seller-border)] px-4 py-2 text-sm font-semibold text-[var(--seller-primary-strong)]">
                    <MessageSquare size={15} />
                    Open chat
                  </Link>
                  {activeTab === "sales" ? (
                    <button onClick={() => handleRelist(item.id)} className="inline-flex items-center gap-2 rounded-full bg-[var(--seller-primary)] px-4 py-2 text-sm font-semibold text-white">
                      <ShoppingBag size={15} />
                      Relist item
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  )
}
