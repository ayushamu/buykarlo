"use client"

import { Suspense, use, useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { 
  Search, 
  Laptop, 
  BookOpen, 
  Bike, 
  Home as HomeIcon, 
  Sparkles, 
  X,
  ChevronDown,
  Filter
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { ListingCard } from "@/components/listing/ListingCard"
import { getActiveListings } from "@/features/listings/actions"
import { cn } from "@/lib/utils"
import { AnimatePresence, motion } from "framer-motion"
import { CAMPUSES } from "@/lib/constants"

const CATEGORIES = [
  { id: "all", name: "All", icon: Sparkles },
  { id: "electronics", name: "Electronics", icon: Laptop },
  { id: "books", name: "Books", icon: BookOpen },
  { id: "cycles", name: "Cycles", icon: Bike },
  { id: "dorm-decor", name: "Dorm Decor", icon: HomeIcon },
]

function ExploreContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const categoryParam = searchParams.get("category") || "all"

  // Location Selector states
  const [activeCampus, setActiveCampus] = useState("Aligarh Muslim University (AMU)")
  const [activeCampusShort, setActiveCampusShort] = useState("AMU")

  // Feed listings & filters states
  const [listingsList, setListingsList] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState(categoryParam)
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "")
  const [selectedCondition, setSelectedCondition] = useState("all")
  const [selectedPriceRange, setSelectedPriceRange] = useState("all")
  const [sortBy, setSortBy] = useState("latest")
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false)
  const [showAllCategories, setShowAllCategories] = useState(false)

  // Sync category state from URL query params
  useEffect(() => {
    if (categoryParam) {
      setSelectedCategory(categoryParam)
    }
  }, [categoryParam])

  // Sync search state from URL query params
  useEffect(() => {
    const searchVal = searchParams.get("search") || ""
    setSearchQuery(searchVal)
  }, [searchParams])

  // Sync campus state from localStorage & listen for changes
  useEffect(() => {
    const saved = localStorage.getItem("buykarlo_campus")
    if (saved) {
      setActiveCampus(saved)
      const matched = CAMPUSES.find(c => c.name === saved)
      setActiveCampusShort(matched?.short || "AMU")
    }

    const handleCampusChange = () => {
      const newCampus = localStorage.getItem("buykarlo_campus") || "Aligarh Muslim University (AMU)"
      setActiveCampus(newCampus)
      const matched = CAMPUSES.find(c => c.name === newCampus)
      setActiveCampusShort(matched?.short || "AMU")
    }

    window.addEventListener("buykarlo_campus_changed", handleCampusChange)
    return () => window.removeEventListener("buykarlo_campus_changed", handleCampusChange)
  }, [])

  // Load listings whenever category or campus changes
  useEffect(() => {
    async function fetchListings() {
      try {
        setIsLoading(true)
        const dbCampus = activeCampus.split(" (")[0]
        const res = await getActiveListings(selectedCategory, dbCampus)
        if (res.listings) {
          setListingsList(res.listings)
        }
      } catch (err) {
        console.error("Failed to load listings:", err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchListings()
  }, [selectedCategory, activeCampus])

  // Process filters in-memory on the client side
  const processedListings = useMemo(() => {
    let list = [...listingsList]

    // 1. Search Query Filter
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

    // 2. Condition Filter
    if (selectedCondition !== "all") {
      list = list.filter((l) => l.condition === selectedCondition)
    }

    // 3. Price Filter
    if (selectedPriceRange !== "all") {
      if (selectedPriceRange === "under_1000") {
        list = list.filter((l) => l.price < 1000)
      } else if (selectedPriceRange === "1000_5000") {
        list = list.filter((l) => l.price >= 1000 && l.price <= 5000)
      } else if (selectedPriceRange === "over_5000") {
        list = list.filter((l) => l.price > 5000)
      }
    }

    // 4. Sorting
    if (sortBy === "price_asc") {
      list.sort((a, b) => a.price - b.price)
    } else if (sortBy === "price_desc") {
      list.sort((a, b) => b.price - a.price)
    }

    return list
  }, [listingsList, searchQuery, selectedCondition, selectedPriceRange, sortBy])

  const selectCategoryAndRedirect = (catId: string) => {
    setSelectedCategory(catId)
    router.replace(`/explore?category=${catId}`, { scroll: false })
  }

  return (
    <div className="mx-auto max-w-container-max px-margin-mobile py-8 md:px-margin-desktop md:py-12 animate-in fade-in duration-300">
      {/* Category Layout Section */}
      <section className="flex flex-col md:flex-row gap-8 items-stretch pt-4 text-left">
        {/* Left Sticky Sidebar (Categories) - Desktop Only */}
        <aside className="hidden md:flex w-64 shrink-0 flex-col space-y-2 sticky top-24 self-start bg-white border border-outline-variant/30 rounded-3xl p-4 shadow-sm select-none">
          <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/75 mb-1">
            Categories
          </p>
          {(showAllCategories ? CATEGORIES : CATEGORIES.slice(0, 4)).map((cat) => {
            const Icon = cat.icon
            const isActive = selectedCategory === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => selectCategoryAndRedirect(cat.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-body text-xs font-semibold text-left transition-all cursor-pointer",
                  isActive
                    ? "bg-primary text-white shadow-md shadow-primary/10"
                    : "text-on-surface-variant hover:bg-surface-container hover:text-primary"
                )}
              >
                <Icon size={18} />
                <span>{cat.name}</span>
              </button>
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

        {/* Mobile Categories list (Horizontal scroll) - Mobile Only */}
        <div className="flex md:hidden flex-col gap-2 shrink-0 select-none w-full">
          <p className="font-body text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/80 px-1">
            Browse Categories
          </p>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none w-full">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon
              const isActive = selectedCategory === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => selectCategoryAndRedirect(cat.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-full font-body text-xs font-semibold whitespace-nowrap transition-all cursor-pointer",
                    isActive
                      ? "bg-primary text-white shadow-sm"
                      : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                  )}
                >
                  <Icon size={14} />
                  <span>{cat.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Right Content Area (Filters + Listings Grid) */}
        <div className="flex-1 flex flex-col space-y-6">
          {/* Search & Collapsible Filters Topbar */}
          <div className="bg-white border border-outline-variant/30 rounded-[2rem] p-4 shadow-sm md:p-6 space-y-4">
            {/* Search bar inside the filters container */}
            <div className="relative w-full shadow-sm rounded-full bg-surface-container-low border border-outline-variant/30 px-4 py-1.5 focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10 transition-all flex items-center">
              <Search size={18} className="text-outline shrink-0 ml-1" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search within ${selectedCategory === "all" ? "all listings" : selectedCategory}...`}
                className="flex-1 bg-transparent border-none outline-none font-body text-sm px-3 text-on-surface py-1.5"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="p-1 hover:bg-surface-container rounded-full text-on-surface-variant cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Quick Filter Info & Selectors Row */}
            <div className="flex flex-col gap-4 border-t border-outline-variant/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <p className="font-body text-sm font-semibold text-on-surface">
                  <span className="font-extrabold">{processedListings.length}</span> items found
                </p>
                {((selectedCondition !== "all" ? 1 : 0) + (selectedPriceRange !== "all" ? 1 : 0)) > 0 && (
                  <>
                    <div className="h-4 w-px bg-outline-variant/30" />
                    <button
                      onClick={() => {
                        setSelectedCondition("all")
                        setSelectedPriceRange("all")
                      }}
                      className="text-xs font-bold text-primary hover:text-secondary hover:underline transition-colors cursor-pointer"
                    >
                      Reset Filters
                    </button>
                  </>
                )}
              </div>

              {/* Sorting and Advanced Filter Button */}
              <div className="flex items-center gap-2 sm:self-auto self-end">
                {/* HTML Select for Sorting (Saves massive screen space) */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none rounded-full border border-outline-variant/30 bg-surface-container-low px-4 py-2 pr-9 text-xs font-bold text-on-surface-variant outline-none hover:bg-surface-container-high hover:border-outline-variant/50 transition-all cursor-pointer"
                  >
                    <option value="latest">Latest Deals</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
                </div>

                {/* Filters Toggle Button */}
                <button
                  onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer",
                    isFiltersExpanded || ((selectedCondition !== "all" ? 1 : 0) + (selectedPriceRange !== "all" ? 1 : 0)) > 0
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-outline-variant/30 bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
                  )}
                  title="Advanced Filters"
                >
                  <Filter size={14} />
                  <span>Filters</span>
                  {((selectedCondition !== "all" ? 1 : 0) + (selectedPriceRange !== "all" ? 1 : 0)) > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[9px] font-extrabold text-white">
                      {(selectedCondition !== "all" ? 1 : 0) + (selectedPriceRange !== "all" ? 1 : 0)}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Slide-down Advanced filters dropdown container */}
            <AnimatePresence>
              {isFiltersExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="overflow-hidden border-t border-outline-variant/10 mt-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-surface-container-low/40 rounded-2xl p-5 border border-outline-variant/20 mt-4">
                    {/* Condition Sub-group */}
                    <div className="space-y-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70">Item Condition</p>
                      <div className="flex flex-wrap gap-2">
                        {["all", "new", "like_new", "good", "fair"].map((cond) => (
                          <button
                            key={cond}
                            onClick={() => setSelectedCondition(cond)}
                            className={cn(
                              "rounded-full border px-4 py-2 text-xs font-semibold transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer",
                              selectedCondition === cond
                                ? "border-primary/40 bg-primary/10 text-primary font-bold shadow-sm"
                                : "border-outline-variant/15 bg-white text-on-surface-variant hover:bg-surface-container"
                            )}
                          >
                            {cond === "all" ? "All" : cond === "like_new" ? "Like New" : cond.charAt(0).toUpperCase() + cond.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Price Range Sub-group */}
                    <div className="space-y-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70">Price Limit</p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { id: "all", label: "All Prices" },
                          { id: "under_1000", label: "Under ₹1K" },
                          { id: "1000_5000", label: "₹1K - ₹5K" },
                          { id: "over_5000", label: "Over ₹5K" }
                        ].map((pr) => (
                          <button
                            key={pr.id}
                            onClick={() => setSelectedPriceRange(pr.id)}
                            className={cn(
                              "rounded-full border px-4 py-2 text-xs font-semibold transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer",
                              selectedPriceRange === pr.id
                                ? "border-primary/40 bg-primary/10 text-primary font-bold shadow-sm"
                                : "border-outline-variant/15 bg-white text-on-surface-variant hover:bg-surface-container"
                            )}
                          >
                            {pr.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Grid of Listings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {isLoading ? (
              [...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse bg-surface-container-low rounded-2xl aspect-[4/3] w-full border border-outline-variant/20 flex flex-col">
                  <div className="w-full h-2/3 bg-surface-container-high rounded-t-2xl"></div>
                  <div className="p-4 flex-1 space-y-2">
                    <div className="h-4 bg-surface-container-high rounded w-3/4"></div>
                    <div className="h-4 bg-surface-container-high rounded w-1/2"></div>
                  </div>
                </div>
              ))
            ) : processedListings.length > 0 ? (
              processedListings.map((listing, index) => (
                <ListingCard key={listing.id} {...listing} priority={index < 4} />
              ))
            ) : (
              <div className="col-span-full py-16 text-center flex flex-col items-center justify-center space-y-3 bg-surface-container-low/40 rounded-3xl border border-outline-variant/10 w-full px-6">
                <p className="max-w-sm text-on-surface-variant font-medium">
                  No items are currently listed in this category on your campus matching your filters.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("")
                    setSelectedCondition("all")
                    setSelectedPriceRange("all")
                    setSortBy("latest")
                  }}
                  className="action-gradient text-white px-6 py-2.5 rounded-full font-body text-label-lg font-bold shadow-md hover:scale-105 active:scale-95 transition-all w-fit cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

export default function ExplorePage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-container-max px-margin-mobile py-12 md:px-margin-desktop">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse bg-surface-container-low rounded-2xl aspect-[4/3] border border-outline-variant/20" />
          ))}
        </div>
      </div>
    }>
      <ExploreContent />
    </Suspense>
  )
}
