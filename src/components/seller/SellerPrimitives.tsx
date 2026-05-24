"use client"

import Image from "next/image"
import Link from "next/link"
import {
  CheckCircle2,
  Eye,
  Loader2,
  MessageSquare,
  MoreHorizontal,
  Pause,
  Play,
  Share2,
  Trash2,
  Pencil,
} from "lucide-react"
import { cn } from "@/lib/utils"

export interface SellerListingItem {
  id: string
  title: string
  price: number
  status: "active" | "sold" | "hidden" | "deleted" | "pending_review"
  viewCount: number
  createdAt: string
  categoryName: string
  categorySlug: string
  imageUrl: string | null
  activeChats: number
}

export function SellerSectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div className="space-y-1">
        {eyebrow ? <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--seller-primary)]">{eyebrow}</p> : null}
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-on-surface md:text-5xl">{title}</h1>
        {description ? <p className="max-w-2xl text-sm text-on-surface-variant md:text-base">{description}</p> : null}
      </div>
      {action}
    </div>
  )
}

export function SellerStatCard({
  label,
  value,
  tone = "neutral",
  detail,
}: {
  label: string
  value: string
  tone?: "neutral" | "mint" | "blue"
  detail?: string
}) {
  const toneClass =
    tone === "mint"
      ? "bg-[var(--seller-surface)] border-[var(--seller-border)]"
      : tone === "blue"
        ? "bg-[#eff4ff] border-[#cdddff] dark:bg-[#17233d] dark:border-[#263c6f]"
        : "bg-white border-outline-variant/20"

  return (
    <div className={cn("rounded-[2rem] border p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)]", toneClass)}>
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-on-surface-variant">{label}</p>
      <p className="mt-4 font-display text-5xl font-extrabold tracking-tight text-on-surface">{value}</p>
      {detail ? <p className="mt-3 text-sm font-medium text-on-surface-variant">{detail}</p> : null}
    </div>
  )
}

export function SellerFilterPills({
  items,
  value,
  onChange,
}: {
  items: { label: string; value: string }[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto rounded-full border border-[var(--seller-border)] bg-white p-1.5 shadow-sm scrollbar-none">
      {items.map((item) => (
        <button
          key={item.value}
          onClick={() => onChange(item.value)}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-semibold transition-colors whitespace-nowrap",
            value === item.value
              ? "bg-[var(--seller-primary)] text-white shadow-[0_12px_24px_rgba(31,157,119,0.18)]"
              : "text-[var(--seller-text-soft)] hover:bg-[var(--seller-surface)] hover:text-[var(--seller-primary-strong)]"
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

export function SellerListingCard({
  listing,
  actionLoading,
  confirmDeleteId,
  copied,
  onPause,
  onResume,
  onSold,
  onDelete,
  onShare,
  onConfirmDelete,
  onCancelDelete,
}: {
  listing: SellerListingItem
  actionLoading: string | null
  confirmDeleteId: string | null
  copied?: boolean
  onPause: (id: string) => void
  onResume: (id: string) => void
  onSold: (id: string) => void
  onDelete: (id: string) => void
  onShare: (id: string) => void
  onConfirmDelete: (id: string) => void
  onCancelDelete: () => void
}) {
  const isDeleting = confirmDeleteId === listing.id
  const isLoading = actionLoading === listing.id

  return (
    <article className="overflow-hidden rounded-[2rem] border border-[var(--seller-border)] bg-white shadow-[0_20px_40px_rgba(31,157,119,0.08)] transition-transform hover:-translate-y-1">
      <div className="relative aspect-[5/4] overflow-hidden bg-[var(--seller-surface)]">
        {listing.imageUrl ? (
          <Image src={listing.imageUrl} alt={listing.title} fill className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-[var(--seller-primary-strong)]">
            <MoreHorizontal size={28} />
          </div>
        )}

        <div className="absolute left-4 top-4 rounded-full bg-white/92 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[var(--seller-primary-strong)]">
          {listing.categoryName}
        </div>

        {listing.status === "sold" ? (
          <div className="absolute inset-x-4 bottom-4 rounded-full bg-[#f07b85] px-4 py-2 text-center text-sm font-extrabold uppercase tracking-[0.2em] text-white shadow-lg">
            Sold
          </div>
        ) : null}
      </div>

      <div className="space-y-4 p-5">
        <div className="space-y-2">
          <h3 className="line-clamp-2 font-display text-2xl font-bold tracking-tight text-on-surface">{listing.title}</h3>
          <p className="font-display text-4xl font-extrabold tracking-tight text-[var(--seller-primary)]">
            ₹{listing.price.toLocaleString("en-IN")}
          </p>
          <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-on-surface-variant">
            <span className="inline-flex items-center gap-1.5">
              <Eye size={15} />
              {listing.viewCount} views
            </span>
            <span className="inline-flex items-center gap-1.5 text-[var(--seller-primary-strong)]">
              <MessageSquare size={15} />
              {listing.activeChats} chats
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/sell?edit=${listing.id}`}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--seller-border)] px-3 py-2 text-sm font-semibold text-[var(--seller-primary-strong)] transition-colors hover:bg-[var(--seller-surface)]"
          >
            <Pencil size={15} />
            Edit
          </Link>

          {listing.status === "active" ? (
            <button
              onClick={() => onPause(listing.id)}
              disabled={!!actionLoading}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--seller-border)] px-3 py-2 text-sm font-semibold text-[var(--seller-primary-strong)] transition-colors hover:bg-[var(--seller-surface)]"
            >
              {isLoading ? <Loader2 size={15} className="animate-spin" /> : <Pause size={15} />}
              Pause
            </button>
          ) : null}

          {listing.status === "hidden" ? (
            <button
              onClick={() => onResume(listing.id)}
              disabled={!!actionLoading}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--seller-border)] px-3 py-2 text-sm font-semibold text-[var(--seller-primary-strong)] transition-colors hover:bg-[var(--seller-surface)]"
            >
              {isLoading ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
              Resume
            </button>
          ) : null}

          {listing.status !== "sold" ? (
            <button
              onClick={() => onSold(listing.id)}
              disabled={!!actionLoading}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--seller-primary)] px-3 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(31,157,119,0.18)]"
            >
              <CheckCircle2 size={15} />
              Mark Sold
            </button>
          ) : null}

          <button
            onClick={() => onShare(listing.id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition-colors",
              copied
                ? "border-[var(--seller-border)] bg-[var(--seller-surface)] text-[var(--seller-primary-strong)]"
                : "border-outline-variant/25 text-on-surface-variant hover:bg-surface-container-low"
            )}
          >
            <Share2 size={15} />
            {copied ? "Copied" : "Share"}
          </button>
        </div>

        {isDeleting ? (
          <div className="flex items-center justify-between rounded-[1.5rem] border border-red-200 bg-red-50 px-4 py-3 text-sm">
            <span className="font-semibold text-red-700">Delete this listing?</span>
            <div className="flex gap-2">
              <button onClick={() => onDelete(listing.id)} className="rounded-full bg-red-600 px-3 py-1.5 font-semibold text-white">
                Confirm
              </button>
              <button onClick={onCancelDelete} className="rounded-full border border-red-200 px-3 py-1.5 font-semibold text-red-700">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => onConfirmDelete(listing.id)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-red-600 transition-colors hover:text-red-700"
          >
            <Trash2 size={15} />
            Delete Listing
          </button>
        )}
      </div>
    </article>
  )
}
