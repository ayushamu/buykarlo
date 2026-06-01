"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import {
  Search,
  Laptop,
  BookOpen,
  Bike,
  Home as HomeIcon,
  Sparkles,
  ArrowLeft,
  X,
  ChevronDown,
} from "lucide-react"
import { ListingCard } from "@/components/listing/ListingCard"
import { getActiveListings } from "@/features/listings/actions"
import { cn } from "@/lib/utils"

// ─── Category config with icons ──────────────────────────────────────────────
const CATEGORIES = [
  { id: "all", name: "All", icon: Sparkles },
  {
    id: "electronics",
    name: "Electronics",
    icon: Laptop,
    description: "Laptops, iPads, Chargers",
  },
  {
    id: "books",
    name: "Books",
    icon: BookOpen,
    description: "Textbooks, Fiction, Notes",
  },
  {
    id: "cycles",
    name: "Cycles",
    icon: Bike,
    description: "MTBs, City Bikes, Gear",
  },
  {
    id: "dorm-decor",
    name: "Dorm Decor",
    icon: HomeIcon,
    description: "Lamps, Rugs, Mirrors",
  },
]

interface Listing {
  id: string
  slug?: string
  title: string
  description?: string
  price: number
  condition: "new" | "like_new" | "good" | "fair" | "poor"
  imageUrl?: string
  sellerDepartment?: string
  campus?: string
  categorySlug?: string
  keywords?: string[] | string | null
  sellerTrustScore?: number
}

interface Props {
  categorySlug: string
  categoryName: string
  categoryDescription: string
  categoryEmoji: string
  initialListings: Listing[]
}

export default function CategoryClientPage({
  categorySlug,
  categoryName,
  categoryDescription,
  categoryEmoji,
  initialListings,
}: Props) {
  const [listings, setListings] = useState<Listing[]>(initialListings)
  const [isLoading, setIsLoading] = useState(false)

  // Local filter state
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCondition, setSelectedCondition] = useState("all")
  const [selectedPriceRange, setSelectedPriceRange] = useState("all")
  const [sortBy, setSortBy] = useState("latest")
  const [showAllCategories, setShowAllCategories] = useState(false)

  // Campus awareness
  const [activeCampus, setActiveCampus] = useState(
    "Aligarh Muslim University (AMU)"
  )

  // Sync campus from localStorage + listen for campus change events
  useEffect(() => {
    const saved = localStorage.getItem("buykarlo_campus")
    if (saved) setActiveCampus(saved)

    const handleCampusChange = () => {
      const newCampus =
        localStorage.getItem("buykarlo_campus") ||
        "Aligarh Muslim University (AMU)"
      setActiveCampus(newCampus)
    }

    window.addEventListener("buykarlo_campus_changed", handleCampusChange)
    return () =>
      window.removeEventListener("buykarlo_campus_changed", handleCampusChange)
  }, [])

  // Re-fetch when campus changes (initial render uses SSR data)
  useEffect(() => {
    let cancelled = false
    async function refresh() {
      setIsLoading(true)
      try {
        const dbCampus = activeCampus.split(" (")[0]
        const res = await getActiveListings(categorySlug, dbCampus)
        if (!cancelled && res.listings) {
          setListings(res.listings)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    refresh()
    return () => {
      cancelled = true
    }
  }, [activeCampus, categorySlug])

  // Client-side filtering + sorting
  const processedListings = useMemo(() => {
    let list = [...listings]

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter((l) => {
        const titleMatch = l.title?.toLowerCase().includes(q) || false
        const descMatch = l.description?.toLowerCase().includes(q) || false
        const catMatch = l.categorySlug?.toLowerCase().includes(q) || false
        const deptMatch = l.sellerDepartment?.toLowerCase().includes(q) || false
        
        const keywordsArray = Array.isArray(l.keywords)
          ? l.keywords
          : typeof l.keywords === 'string'
          ? [l.keywords]
          : []
        const keywordMatch = keywordsArray.some((keyword: any) =>
          typeof keyword === 'string' && keyword.toLowerCase().includes(q)
        )

        return titleMatch || descMatch || catMatch || deptMatch || keywordMatch
      })
    }

    if (selectedCondition !== "all") {
      list = list.filter((l) => l.condition === selectedCondition)
    }

    if (selectedPriceRange === "under_1000") {
      list = list.filter((l) => l.price < 1000)
    } else if (selectedPriceRange === "1000_5000") {
      list = list.filter((l) => l.price >= 1000 && l.price <= 5000)
    } else if (selectedPriceRange === "over_5000") {
      list = list.filter((l) => l.price > 5000)
    }

    if (sortBy === "price_asc") list.sort((a, b) => a.price - b.price)
    else if (sortBy === "price_desc") list.sort((a, b) => b.price - a.price)

    return list
  }, [listings, searchQuery, selectedCondition, selectedPriceRange, sortBy])

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedCondition("all")
    setSelectedPriceRange("all")
    setSortBy("latest")
  }

  const hasActiveFilters =
    searchQuery.trim() ||
    selectedCondition !== "all" ||
    selectedPriceRange !== "all" ||
    sortBy !== "latest"

  return (
    <div className="mx-auto max-w-container-max px-margin-mobile py-8 md:px-margin-desktop md:py-12 animate-in fade-in duration-300">
      {/* Breadcrumb / Back nav */}
      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex items-center gap-2 text-sm text-on-surface-variant"
      >
        <Link
          href="/"
          className="flex items-center gap-1.5 hover:text-primary transition-colors font-medium"
        >
          <ArrowLeft size={14} />
          Marketplace
        </Link>
        <span>/</span>
        <span className="text-on-surface font-semibold">
          {categoryEmoji} {categoryName}
        </span>
      </nav>

      {/* Hero header for the category */}
      <header className="mb-8">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-on-surface tracking-tight">
          {categoryEmoji}{" "}
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {categoryName}
          </span>{" "}
          at AMU
        </h1>
        <p className="mt-2 max-w-xl text-on-surface-variant text-base">
          {categoryDescription}
        </p>
      </header>

      {/* Category layout: sidebar + grid */}
      <section className="flex flex-col md:flex-row gap-8 items-stretch text-left">
        {/* ── Desktop Sidebar ─────────────────────────────────── */}
        <aside className="hidden md:flex w-56 shrink-0 flex-col space-y-1 sticky top-24 self-start bg-white border border-outline-variant/30 rounded-3xl p-4 shadow-sm select-none">
          <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/75 mb-1">
            Categories
          </p>
          {(showAllCategories ? CATEGORIES : CATEGORIES.slice(0, 4)).map((cat) => {
            const Icon = cat.icon
            const isActive = cat.id === categorySlug || (cat.id === "all" && false)
            return (
              <Link
                key={cat.id}
                href={cat.id === "all" ? "/" : `/${cat.id}`}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-body text-xs font-semibold transition-all",
                  isActive
                    ? "bg-primary text-white shadow-md shadow-primary/10"
                    : "text-on-surface-variant hover:bg-surface-container hover:text-primary"
                )}
              >
                <Icon size={17} />
                <span>{cat.name}</span>
              </Link>
            )
          })}
          {CATEGORIES.length > 4 && (
            <button
              onClick={() => setShowAllCategories(!showAllCategories)}
              className="flex w-full items-center justify-center gap-1.5 rounded-full border border-outline-variant/15 bg-surface-container-low hover:bg-surface-container px-4 py-2.5 text-xs font-bold text-on-surface-variant transition-colors cursor-pointer mt-1"
            >
              <span>{showAllCategories ? "Show Less" : `Show More (+${CATEGORIES.length - 4})`}</span>
              <ChevronDown size={14} className={cn("transition-transform duration-200 text-outline-variant", showAllCategories && "rotate-180 text-primary")} />
            </button>
          )}
        </aside>

        {/* ── Mobile Categories (horizontal chips) ────────────── */}
        <div className="flex md:hidden gap-2 overflow-x-auto pb-2 scrollbar-none w-full shrink-0 select-none">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon
            const isActive = cat.id === categorySlug
            return (
              <Link
                key={cat.id}
                href={cat.id === "all" ? "/" : `/${cat.id}`}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-full font-body text-xs font-semibold whitespace-nowrap transition-all",
                  isActive
                    ? "bg-primary text-white shadow-sm"
                    : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                )}
              >
                <Icon size={14} />
                <span>{cat.name}</span>
              </Link>
            )
          })}
        </div>

        {/* ── Right content area ──────────────────────────────── */}
        <div className="flex-1 flex flex-col space-y-6 min-w-0">
          {/* Filter bar */}
          <div className="bg-white border border-outline-variant/30 rounded-3xl p-5 shadow-sm space-y-4">
            {/* Search */}
            <div className="relative w-full shadow-sm rounded-full bg-surface-container-low border border-outline-variant/30 px-4 py-1.5 focus-within:ring-2 focus-within:ring-primary/20 transition-all flex items-center gap-2">
              <Search size={16} className="text-outline shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${categoryName.toLowerCase()}...`}
                className="flex-1 bg-transparent border-none outline-none font-body text-sm text-on-surface py-1.5"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="p-1 hover:bg-surface-container rounded-full text-on-surface-variant cursor-pointer"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Filter pills */}
            <div className="flex flex-wrap items-center gap-y-3 gap-x-2">
              {/* Condition */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-on-surface-variant/75 uppercase tracking-wider pr-1">
                  Condition:
                </span>
                {["all", "new", "like_new", "good", "fair"].map((cond) => (
                  <button
                    key={cond}
                    onClick={() => setSelectedCondition(cond)}
                    className={cn(
                      "px-3 py-1 rounded-full font-body text-xs font-semibold cursor-pointer transition-all border border-outline-variant/15",
                      selectedCondition === cond
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                    )}
                  >
                    {cond === "all"
                      ? "All"
                      : cond === "like_new"
                      ? "Like New"
                      : cond.charAt(0).toUpperCase() + cond.slice(1)}
                  </button>
                ))}
              </div>

              <div className="h-4 w-[1px] bg-outline-variant/40 mx-1 hidden lg:block" />

              {/* Price */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-on-surface-variant/75 uppercase tracking-wider pr-1">
                  Price:
                </span>
                {[
                  { id: "all", label: "All" },
                  { id: "under_1000", label: "Under ₹1K" },
                  { id: "1000_5000", label: "₹1K–₹5K" },
                  { id: "over_5000", label: "Over ₹5K" },
                ].map((pr) => (
                  <button
                    key={pr.id}
                    onClick={() => setSelectedPriceRange(pr.id)}
                    className={cn(
                      "px-3 py-1 rounded-full font-body text-xs font-semibold cursor-pointer transition-all border border-outline-variant/15",
                      selectedPriceRange === pr.id
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                    )}
                  >
                    {pr.label}
                  </button>
                ))}
              </div>

              <div className="h-4 w-[1px] bg-outline-variant/40 mx-1 hidden lg:block" />

              {/* Sort */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-on-surface-variant/75 uppercase tracking-wider pr-1">
                  Sort:
                </span>
                {[
                  { id: "latest", label: "Latest" },
                  { id: "price_asc", label: "↑ Price" },
                  { id: "price_desc", label: "↓ Price" },
                ].map((sb) => (
                  <button
                    key={sb.id}
                    onClick={() => setSortBy(sb.id)}
                    className={cn(
                      "px-3 py-1 rounded-full font-body text-xs font-semibold cursor-pointer transition-all border border-outline-variant/15",
                      sortBy === sb.id
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                    )}
                  >
                    {sb.label}
                  </button>
                ))}
              </div>

              {/* Clear button */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="ml-auto flex items-center gap-1 px-3 py-1 rounded-full font-body text-xs font-semibold text-error border border-error/30 bg-error/5 hover:bg-error/10 transition-all cursor-pointer"
                >
                  <X size={11} />
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Results count */}
          {!isLoading && (
            <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant/70 px-1">
              {processedListings.length} listing
              {processedListings.length !== 1 ? "s" : ""} found
            </p>
          )}

          {/* Listings grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {isLoading ? (
              [...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse bg-surface-container-low rounded-2xl overflow-hidden border border-outline-variant/20 flex flex-col"
                >
                  <div className="w-full aspect-[4/3] bg-surface-container-high" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-surface-container-high rounded w-3/4" />
                    <div className="h-4 bg-surface-container-high rounded w-1/2" />
                  </div>
                </div>
              ))
            ) : processedListings.length > 0 ? (
              processedListings.map((listing, index) => (
                <ListingCard key={listing.id} {...listing} priority={index < 4} />
              ))
            ) : (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-4 bg-surface-container-low/40 rounded-3xl border border-outline-variant/10 px-8">
                <span className="text-5xl">{categoryEmoji}</span>
                <div>
                  <p className="font-display font-semibold text-on-surface text-lg">
                    No {categoryName} listed yet
                  </p>
                  <p className="text-on-surface-variant text-sm mt-1 max-w-sm">
                    {hasActiveFilters
                      ? "No items match your current filters. Try clearing them."
                      : `Be the first to sell ${categoryName.toLowerCase()} on your campus!`}
                  </p>
                </div>
                <div className="flex gap-3">
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="px-6 py-2.5 rounded-full font-body text-sm font-bold border border-primary text-primary hover:bg-primary/5 transition-all cursor-pointer"
                    >
                      Clear Filters
                    </button>
                  )}
                  <Link
                    href="/sell"
                    className="action-gradient text-white px-6 py-2.5 rounded-full font-body text-sm font-bold shadow-md hover:scale-105 active:scale-95 transition-all"
                  >
                    Sell Now
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
