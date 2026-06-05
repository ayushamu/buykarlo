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
  Dumbbell,
  PenTool,
  Shirt,
  Armchair,
  Plug,
  Music,
  FlaskConical,
  Package,
} from "lucide-react"
import { ListingCard } from "@/components/listing/ListingCard"
import { getActiveListings, getCategories } from "@/features/listings/actions"
import { CAMPUSES, getNearbyCampuses } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { HelpCircle, Smartphone, FileText, Lightbulb, Image as ImageIcon, Boxes } from "lucide-react"

const ICON_MAP: Record<string, any> = {
  Laptop: Laptop,
  Smartphone: Smartphone,
  BookOpen: BookOpen,
  FileText: FileText,
  Bike: Bike,
  Lightbulb: Lightbulb,
  Image: ImageIcon,
  Boxes: Boxes,
  Home: HomeIcon,
  Sparkles: Sparkles,
  Dumbbell: Dumbbell,
  PenTool: PenTool,
  Shirt: Shirt,
  Armchair: Armchair,
  Plug: Plug,
  Music: Music,
  FlaskConical: FlaskConical,
  Package: Package,
}

function getCategoryIcon(name?: string, slug?: string) {
  if (name && ICON_MAP[name]) return ICON_MAP[name]
  
  // Slug-based fallbacks for legacy/null values
  if (slug === "all") return Sparkles
  if (slug === "electronics") return Laptop
  if (slug === "books") return BookOpen
  if (slug === "cycles") return Bike
  if (slug === "dorm-decor") return HomeIcon
  if (slug === "sports-equipment") return Dumbbell
  if (slug === "stationery") return PenTool
  if (slug === "fashion") return Shirt
  if (slug === "furniture") return Armchair
  if (slug === "appliances") return Plug
  if (slug === "instruments") return Music
  if (slug === "lab-equipment") return FlaskConical
  if (slug === "other") return Package
  
  return HelpCircle
}

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
  isTrustedSeller?: boolean
  metadata?: Record<string, any>
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
  const [nearbyListingsMap, setNearbyListingsMap] = useState<Record<string, Listing[]>>({})
  const [isNearbyLoading, setIsNearbyLoading] = useState(false)

  // Local filter state
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCondition, setSelectedCondition] = useState("all")
  const [selectedPriceRange, setSelectedPriceRange] = useState("all")
  const [sortBy, setSortBy] = useState("latest")
  const [showAllCategories, setShowAllCategories] = useState(false)
  const [dbCategories, setDbCategories] = useState<any[]>([])
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("all")
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string[]>>({})

  // Campus awareness
  const [activeCampus, setActiveCampus] = useState(
    "Aligarh Muslim University (AMU)"
  )

  const parentCategoryObj = useMemo(() => {
    return dbCategories.find(c => c.slug === categorySlug)
  }, [categorySlug, dbCategories])

  const CategoryIcon = useMemo(() => {
    return getCategoryIcon(parentCategoryObj?.icon_name, categorySlug)
  }, [parentCategoryObj, categorySlug])

  const subcategories = useMemo(() => {
    if (!parentCategoryObj) return []
    return dbCategories.filter(c => c.parent_id === parentCategoryObj.id)
  }, [parentCategoryObj, dbCategories])

  const activeCategoryObj = useMemo(() => {
    if (selectedSubcategory !== "all") {
      return dbCategories.find(c => c.slug === selectedSubcategory)
    }
    return parentCategoryObj
  }, [selectedSubcategory, parentCategoryObj, dbCategories])

  const activeAttributeSchema = useMemo(() => {
    if (!activeCategoryObj?.attribute_schema) return []
    const schema = activeCategoryObj.attribute_schema
    if (typeof schema === "string") {
      try {
        return JSON.parse(schema)
      } catch (e) {
        return []
      }
    }
    return Array.isArray(schema) ? schema : []
  }, [activeCategoryObj])

  const dynamicCategories = useMemo(() => {
    if (dbCategories.length === 0) return CATEGORIES
    return [
      { id: "all", name: "All Items", icon: Sparkles },
      ...dbCategories.filter(c => !c.parent_id).map((c) => ({
        id: c.slug,
        name: c.name,
        icon: getCategoryIcon(c.icon_name, c.slug),
      }))
    ]
  }, [dbCategories])

  useEffect(() => {
    setSelectedAttributes({})
  }, [selectedSubcategory])

  useEffect(() => {
    async function loadCategories() {
      const res = await getCategories()
      if (res.categories) {
        setDbCategories(res.categories)
      }
    }
    loadCategories()
  }, [])

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
      setIsNearbyLoading(true)
      try {
        const dbCampus = activeCampus.split(" (")[0]
        const res = await getActiveListings(categorySlug, dbCampus)
        if (!cancelled && res.listings) {
          setListings(res.listings)
        }

        // Fetch listings of nearby campuses
        const nearby = getNearbyCampuses(activeCampus)
        const nearbyResults: Record<string, Listing[]> = {}
        await Promise.all(
          nearby.map(async (nc) => {
            const dbNc = nc.name.split(" (")[0]
            const ncRes = await getActiveListings(categorySlug, dbNc)
            if (!cancelled && ncRes.listings) {
              nearbyResults[nc.name] = ncRes.listings
            }
          })
        )
        if (!cancelled) {
          setNearbyListingsMap(nearbyResults)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
          setIsNearbyLoading(false)
        }
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

    // Filter by subcategory if selected
    if (selectedSubcategory !== "all") {
      list = list.filter((l) => l.categorySlug === selectedSubcategory)
    }

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

    // Category dynamic attributes filters
    Object.entries(selectedAttributes).forEach(([key, values]) => {
      if (values && values.length > 0) {
        list = list.filter((l) => {
          const val = l.metadata?.[key]
          return val && values.includes(String(val))
        })
      }
    })

    if (sortBy === "price_asc") list.sort((a, b) => a.price - b.price)
    else if (sortBy === "price_desc") list.sort((a, b) => b.price - a.price)

    return list
  }, [listings, searchQuery, selectedCondition, selectedPriceRange, sortBy, selectedSubcategory, selectedAttributes])

  // Filtered nearby listing results
  const processedNearbyListingsMap = useMemo(() => {
    const results: Record<string, Listing[]> = {}
    const q = searchQuery.trim().toLowerCase()

    Object.entries(nearbyListingsMap).forEach(([campusName, listings]) => {
      let list = [...listings]

      // Filter by subcategory if selected
      if (selectedSubcategory !== "all") {
        list = list.filter((l) => l.categorySlug === selectedSubcategory)
      }

      if (q) {
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

      // Category dynamic attributes filters
      Object.entries(selectedAttributes).forEach(([key, values]) => {
        if (values && values.length > 0) {
          list = list.filter((l) => {
            const val = l.metadata?.[key]
            return val && values.includes(String(val))
          })
        }
      })

      if (sortBy === "price_asc") list.sort((a, b) => a.price - b.price)
      else if (sortBy === "price_desc") list.sort((a, b) => b.price - a.price)

      if (list.length > 0) {
        results[campusName] = list
      }
    })

    return results
  }, [nearbyListingsMap, searchQuery, selectedCondition, selectedPriceRange, sortBy, selectedSubcategory, selectedAttributes])

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedCondition("all")
    setSelectedPriceRange("all")
    setSortBy("latest")
    setSelectedSubcategory("all")
    setSelectedAttributes({})
  }

  const hasActiveFilters =
    searchQuery.trim() ||
    selectedCondition !== "all" ||
    selectedPriceRange !== "all" ||
    sortBy !== "latest" ||
    selectedSubcategory !== "all" ||
    Object.values(selectedAttributes).some((v) => v.length > 0)

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
        <span className="text-on-surface font-semibold flex items-center gap-1.5">
          <CategoryIcon size={16} className="text-primary shrink-0" />
          <span>{categoryName}</span>
        </span>
      </nav>

      {/* Hero header for the category */}
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="inline-flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm shadow-primary/5">
          <CategoryIcon size={30} className="stroke-[1.75]" />
        </div>
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-on-surface tracking-tight">
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {categoryName}
            </span>{" "}
            at AMU
          </h1>
          <p className="mt-1 max-w-xl text-on-surface-variant text-sm md:text-base">
            {categoryDescription}
          </p>
        </div>
      </header>

      {/* Subcategory Filter Strip */}
      {subcategories.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2.5 items-center bg-white border border-outline-variant/30 rounded-3xl p-4 shadow-sm select-none">
          <span className="text-xs font-bold text-on-surface-variant/75 uppercase tracking-wider pr-1.5 pl-1">Refine:</span>
          <button
            onClick={() => setSelectedSubcategory("all")}
            className={cn(
              "px-4 py-2.5 rounded-full font-body text-xs font-semibold cursor-pointer transition-all border",
              selectedSubcategory === "all"
                ? "bg-primary text-white border-primary shadow-sm font-bold"
                : "bg-surface-container text-on-surface-variant border-outline-variant/10 hover:bg-surface-container-high hover:text-on-surface"
            )}
          >
            All {categoryName}
          </button>
          {subcategories.map((subcat) => (
            <button
              key={subcat.slug}
              onClick={() => setSelectedSubcategory(subcat.slug)}
              className={cn(
                "px-4 py-2.5 rounded-full font-body text-xs font-semibold cursor-pointer transition-all border",
                selectedSubcategory === subcat.slug
                  ? "bg-primary text-white border-primary shadow-sm font-bold"
                  : "bg-surface-container text-on-surface-variant border-outline-variant/10 hover:bg-surface-container-high hover:text-on-surface"
              )}
            >
              {subcat.name}
            </button>
          ))}
        </div>
      )}

      {/* Category layout: sidebar + grid */}
      <section className="flex flex-col md:flex-row gap-8 items-stretch text-left">
        {/* ── Desktop Sidebar ─────────────────────────────────── */}
        <aside className="hidden md:flex w-56 shrink-0 flex-col space-y-1.5 sticky top-24 self-start bg-white border border-outline-variant/30 rounded-3xl p-4 shadow-sm select-none">
          <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/75 mb-1">
            Categories
          </p>
          {(showAllCategories ? dynamicCategories : dynamicCategories.slice(0, 4)).map((cat) => {
            const Icon = cat.icon
            const isActive = cat.id === categorySlug
            
            return (
              <div key={cat.id} className="space-y-1">
                <Link
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
                
                {/* Render L2 subcategories indented inside active category */}
                {isActive && subcategories.length > 0 && (
                  <div className="pl-6 pr-2 py-1 space-y-1 border-l border-slate-100 ml-5 animate-in fade-in slide-in-from-top-1 duration-150">
                    {subcategories.map((subcat) => {
                      const isSubcatActive = selectedSubcategory === subcat.slug
                      return (
                        <button
                          key={subcat.slug}
                          onClick={() => setSelectedSubcategory(isSubcatActive ? "all" : subcat.slug)}
                          className={cn(
                            "flex w-full items-center justify-between rounded-[0.8rem] px-3.5 py-2 text-left text-[11px] font-bold transition-all cursor-pointer",
                            isSubcatActive
                              ? "bg-primary/10 text-primary font-extrabold"
                              : "text-on-surface-variant/80 hover:bg-slate-50 hover:text-on-surface"
                          )}
                        >
                          <span>{subcat.name}</span>
                          {isSubcatActive && <div className="h-1.5 w-1.5 rounded-full bg-primary" />}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
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
          {dynamicCategories.map((cat) => {
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

            {/* Dynamic Parametric Filters */}
            {activeAttributeSchema.length > 0 && (
              <div className="border-t border-outline-variant/10 pt-4 mt-3 space-y-4 animate-in fade-in duration-200">
                <p className="text-[10px] font-bold text-on-surface-variant/75 uppercase tracking-wider pl-1">Dynamic Specifications:</p>
                <div className="flex flex-wrap gap-x-6 gap-y-3 pl-1">
                  {activeAttributeSchema.map((attr: any) => {
                    const selectedVals = selectedAttributes[attr.key] || []
                    return (
                      <div key={attr.key} className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500">{attr.label}:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {attr.options?.map((option: string) => {
                            const isChecked = selectedVals.includes(option)
                            return (
                              <button
                                key={option}
                                onClick={() => {
                                  setSelectedAttributes((prev) => {
                                    const current = prev[attr.key] || []
                                    const next = current.includes(option)
                                      ? current.filter((v) => v !== option)
                                      : [...current, option]
                                    return {
                                      ...prev,
                                      [attr.key]: next,
                                    }
                                  })
                                }}
                                className={cn(
                                  "px-2.5 py-1 rounded-full font-body text-[10px] font-semibold cursor-pointer transition-all border border-outline-variant/15",
                                  isChecked
                                    ? "bg-primary/10 border-primary text-primary font-bold shadow-sm"
                                    : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                                )}
                              >
                                {option}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Results count */}
          {!isLoading && (
            <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant/70 px-1">
              {processedListings.length} listing
              {processedListings.length !== 1 ? "s" : ""} found
            </p>
          )}

          {/* Listings grid */}
          <div className="grid min-w-0 grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
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
                <ListingCard key={listing.id} {...listing} priority={index < 4} compactOnMobile />
              ))
            ) : (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-4 bg-surface-container-low/40 rounded-3xl border border-outline-variant/10 px-8">
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary shadow-sm shadow-primary/5">
                  <CategoryIcon size={36} className="stroke-[1.5]" />
                </div>
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

          {/* Nearby Campus Recommendations */}
          {!isLoading && Object.keys(processedNearbyListingsMap).length > 0 && (
            <div className="space-y-10 mt-10 w-full">
              {Object.entries(processedNearbyListingsMap).map(([campusName, listings]) => {
                const shortName = CAMPUSES.find(c => c.name === campusName)?.short || campusName
                return (
                  <div key={campusName} className="space-y-4 border-t border-outline-variant/15 pt-8 text-left">
                    <div className="flex items-center justify-between px-1">
                      <div>
                        <span className="inline-flex rounded-full bg-secondary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-secondary">
                          Nearby Campus
                        </span>
                        <h3 className="font-display text-xl font-extrabold text-slate-800 mt-1">
                          {categoryName} in nearby {shortName}
                        </h3>
                      </div>
                      <span className="text-xs text-on-surface-variant font-semibold bg-slate-100 px-3 py-1.5 rounded-full shadow-sm">
                        {listings.length} {listings.length === 1 ? "item" : "items"}
                      </span>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x scrollbar-none scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0">
                      {listings.map((item) => (
                        <div key={item.id} className="w-[260px] shrink-0 snap-start">
                          <ListingCard {...item} compactOnMobile />
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
