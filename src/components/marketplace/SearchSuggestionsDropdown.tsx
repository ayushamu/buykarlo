"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { Search, Bike, BookOpen, Home as HomeIcon, Laptop, Sparkles, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  electronics: Laptop,
  books: BookOpen,
  cycles: Bike,
  "dorm-decor": HomeIcon,
  all: Sparkles,
}

const CATEGORY_LABELS: Record<string, string> = {
  electronics: "Electronics",
  books: "Books",
  cycles: "Cycles",
  "dorm-decor": "Dorm Decor",
}

export interface SearchSuggestion {
  type: "listing" | "category"
  // listing fields
  id?: string
  slug?: string
  title?: string
  price?: number
  imageUrl?: string | null
  categorySlug?: string
  condition?: string
  // category fields
  categoryId?: string
  categoryLabel?: string
}

interface SearchSuggestionsDropdownProps {
  suggestions: SearchSuggestion[]
  query: string
  activeIndex: number
  onSelectListing: (slug: string) => void
  onSelectCategory: (categoryId: string) => void
  onClose: () => void
  isOpen: boolean
  id?: string
}

export function SearchSuggestionsDropdown({
  suggestions,
  query,
  activeIndex,
  onSelectListing,
  onSelectCategory,
  onClose,
  isOpen,
  id,
}: SearchSuggestionsDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen, onClose])

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && dropdownRef.current) {
      const active = dropdownRef.current.querySelector(`[data-idx="${activeIndex}"]`)
      active?.scrollIntoView({ block: "nearest" })
    }
  }, [activeIndex])

  if (!isOpen || suggestions.length === 0) return null

  const listingSuggestions = suggestions.filter((s) => s.type === "listing")
  const categorySuggestions = suggestions.filter((s) => s.type === "category")

  return (
    <div
      ref={dropdownRef}
      id={id}
      role="listbox"
      aria-label="Search suggestions"
      className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-[1.5rem] border border-outline-variant/20 bg-white shadow-[0_20px_60px_rgba(25,28,32,0.14)] animate-in fade-in slide-in-from-top-2 duration-150"
    >
      {/* Listing suggestions */}
      {listingSuggestions.length > 0 && (
        <div>
          <p className="px-4 pt-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant/60">
            Matching Listings
          </p>
          {listingSuggestions.map((s, i) => {
            const Icon = CATEGORY_ICONS[s.categorySlug || "all"] || Sparkles
            const isActive = activeIndex === i
            return (
              <Link
                key={s.id}
                href={`/item/${s.slug}`}
                data-idx={i}
                role="option"
                aria-selected={isActive}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 transition-colors",
                  isActive ? "bg-surface-container-low" : "hover:bg-surface-container-low/60"
                )}
              >
                {/* Thumbnail */}
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-surface-container-low">
                  {s.imageUrl ? (
                    <Image
                      src={s.imageUrl}
                      alt={s.title || ""}
                      fill
                      sizes="44px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-on-surface-variant/40">
                      <Icon size={18} />
                    </div>
                  )}
                </div>

                {/* Text */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-on-surface">
                    <HighlightMatch text={s.title || ""} query={query} />
                  </p>
                  <p className="flex items-center gap-1.5 text-xs text-on-surface-variant/70 mt-0.5">
                    <Icon size={11} />
                    <span>{CATEGORY_LABELS[s.categorySlug || ""] || s.categorySlug}</span>
                    <span>·</span>
                    <span className="font-semibold text-on-surface">₹{s.price?.toLocaleString("en-IN")}</span>
                    <span>·</span>
                    <span className="capitalize">{s.condition?.replace("_", " ")}</span>
                  </p>
                </div>

                <Search size={13} className="shrink-0 text-on-surface-variant/40" />
              </Link>
            )
          })}
        </div>
      )}

      {/* Category shortcuts */}
      {categorySuggestions.length > 0 && (
        <div className={cn(listingSuggestions.length > 0 && "border-t border-outline-variant/10")}>
          <p className="px-4 pt-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant/60">
            Browse by Category
          </p>
          {categorySuggestions.map((s, i) => {
            const absIdx = listingSuggestions.length + i
            const Icon = CATEGORY_ICONS[s.categoryId || "all"] || Sparkles
            const isActive = activeIndex === absIdx
            return (
              <button
                key={s.categoryId}
                data-idx={absIdx}
                role="option"
                aria-selected={isActive}
                onClick={() => {
                  onSelectCategory(s.categoryId!)
                  onClose()
                }}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
                  isActive ? "bg-surface-container-low" : "hover:bg-surface-container-low/60"
                )}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-on-surface">
                    See all in <span className="text-primary">{s.categoryLabel}</span>
                  </p>
                </div>
                <ArrowRight size={14} className="shrink-0 text-on-surface-variant/40" />
              </button>
            )
          })}
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-outline-variant/10 px-4 py-2.5">
        <p className="text-[10px] text-on-surface-variant/50">
          Press <kbd className="rounded bg-surface-container px-1 py-0.5 font-mono text-[9px]">↑↓</kbd> to navigate,{" "}
          <kbd className="rounded bg-surface-container px-1 py-0.5 font-mono text-[9px]">Enter</kbd> to select,{" "}
          <kbd className="rounded bg-surface-container px-1 py-0.5 font-mono text-[9px]">Esc</kbd> to close
        </p>
      </div>
    </div>
  )
}

// Highlights the matched portion of text in bold
function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <span className="font-extrabold text-primary">{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  )
}
