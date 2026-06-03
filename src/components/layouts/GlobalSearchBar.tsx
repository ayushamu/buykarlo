"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, X } from "lucide-react"
import Fuse from "fuse.js"
import { getActiveListings } from "@/features/listings/actions"
import { SearchSuggestionsDropdown, type SearchSuggestion } from "@/components/marketplace/SearchSuggestionsDropdown"
import { cn } from "@/lib/utils"

const INTENT_MAP: { patterns: RegExp; categoryId: string }[] = [
  {
    patterns: /\b(laptop|computer|pc|notebook|phone|mobile|tablet|charger|earphone|headphone|speaker|camera|calculator|printer|keyboard|mouse|monitor|gadget|tech|device|electronic|ipad|macbook|lenovo|dell|asus)\b/i,
    categoryId: "electronics",
  },
  {
    patterns: /\b(book|textbook|notes|syllabus|novel|guide|reference|physics|chemistry|maths|math|calculus|biology|ncert|rd\s?sharma|hc\s?verma|irodov|rs\s?aggarwal|study|exam|pyq|material)\b/i,
    categoryId: "books",
  },
  {
    patterns: /\b(cycle|bicycle|bike|gear\s?cycle|mountain\s?bike|hero\s?ranger|atlas|btwin|scooter)\b/i,
    categoryId: "cycles",
  },
  {
    patterns: /\b(dorm|hostel|room|table|chair|lamp|light|mattress|pillow|blanket|curtain|decor|decoration|shelf|rack|fan|cooler|mirror|clock|poster|rug|carpet|bucket|mug|kettle|iron|organizer|storage)\b/i,
    categoryId: "dorm-decor",
  },
]

interface GlobalSearchBarProps {
  className?: string
}

export function GlobalSearchBar({ className }: GlobalSearchBarProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const [query, setQuery] = useState("")
  const [listings, setListings] = useState<any[]>([])
  const [hasFetched, setHasFetched] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])

  // Lazy-load listings the first time the user focuses the search bar
  const ensureListings = useCallback(async () => {
    if (hasFetched) return
    setHasFetched(true)
    try {
      const res = await getActiveListings("all")
      if (res.listings) setListings(res.listings)
    } catch {
      // Silently fail — search still works via Enter navigation
    }
  }, [hasFetched])

  // Compute Fuse instance only when listings change
  const fuse = listings.length
    ? new Fuse(listings, {
        keys: [
          { name: "title", weight: 0.5 },
          { name: "keywords", weight: 0.25 },
          { name: "description", weight: 0.15 },
          { name: "categorySlug", weight: 0.1 },
        ],
        threshold: 0.38,
        includeScore: true,
        ignoreLocation: true,
        minMatchCharLength: 2,
      })
    : null

  // Recompute suggestions whenever query or listings change
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2 || !fuse) {
      setSuggestions([])
      return
    }

    const fuseResults = fuse.search(q, { limit: 5 })
    const listingSuggestions: SearchSuggestion[] = fuseResults.map((r) => ({
      type: "listing" as const,
      id: r.item.id,
      slug: r.item.slug,
      title: r.item.title,
      price: r.item.price,
      imageUrl: r.item.imageUrl,
      categorySlug: r.item.categorySlug,
      condition: r.item.condition,
    }))

    const categorySuggestions: SearchSuggestion[] = []
    for (const { patterns, categoryId } of INTENT_MAP) {
      if (patterns.test(q)) {
        categorySuggestions.push({
          type: "category" as const,
          categoryId,
          categoryLabel:
            categoryId === "electronics"
              ? "Electronics"
              : categoryId === "books"
              ? "Books"
              : categoryId === "cycles"
              ? "Cycles"
              : "Dorm Decor",
        })
        break
      }
    }

    setSuggestions([...listingSuggestions, ...categorySuggestions])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, listings])

  // Navigate on Enter
  const handleSubmit = () => {
    if (!query.trim()) return
    router.push(`/?view=deals&mode=buy&search=${encodeURIComponent(query.trim())}`)
    setIsOpen(false)
  }

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      <div className="flex min-w-[260px] items-center gap-2 rounded-full border border-outline-variant/30 bg-surface-container-low px-4 py-2.5 focus-within:border-primary/50 focus-within:min-w-[320px] focus-within:ring-2 focus-within:ring-primary/10 transition-all duration-300 shadow-sm">
        <Search size={16} className="shrink-0 text-outline" />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls="global-search-listbox"
          aria-activedescendant={activeIdx >= 0 ? `global-suggestion-${activeIdx}` : undefined}
          placeholder="Search campus deals..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
            setActiveIdx(-1)
          }}
          onFocus={() => {
            ensureListings()
            if (query.trim().length >= 2) setIsOpen(true)
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault()
              setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1))
            } else if (e.key === "ArrowUp") {
              e.preventDefault()
              setActiveIdx((i) => Math.max(i - 1, -1))
            } else if (e.key === "Escape") {
              setIsOpen(false)
              setActiveIdx(-1)
            } else if (e.key === "Enter") {
              e.preventDefault()
              if (activeIdx >= 0 && suggestions[activeIdx]) {
                const s = suggestions[activeIdx]
                if (s.type === "listing" && s.slug) {
                  router.push(`/item/${s.slug}`)
                } else if (s.type === "category" && s.categoryId) {
                  router.push(`/?view=deals&mode=buy&category=${s.categoryId}`)
                }
                setIsOpen(false)
              } else {
                handleSubmit()
              }
            }
          }}
          className="w-full bg-transparent text-sm outline-none placeholder:text-on-surface-variant/60"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("")
              setIsOpen(false)
              setActiveIdx(-1)
              inputRef.current?.focus()
            }}
            className="shrink-0 rounded-full p-0.5 text-on-surface-variant hover:bg-surface-container"
          >
            <X size={13} />
          </button>
        )}
        <kbd className="pointer-events-none hidden shrink-0 items-center gap-1 rounded border border-outline-variant/30 bg-surface-container-high px-1.5 py-0.5 font-mono text-[10px] font-medium text-on-surface-variant/80 sm:flex">
          ⌘K
        </kbd>
      </div>

      <SearchSuggestionsDropdown
        id="global-search-listbox"
        suggestions={suggestions}
        query={query}
        activeIndex={activeIdx}
        isOpen={isOpen && suggestions.length > 0 && query.trim().length >= 2}
        onSelectListing={(slug) => {
          setIsOpen(false)
          router.push(`/item/${slug}`)
        }}
        onSelectCategory={(id) => {
          setIsOpen(false)
          router.push(`/?view=deals&mode=buy&category=${id}`)
        }}
        onClose={() => setIsOpen(false)}
      />
    </div>
  )
}
