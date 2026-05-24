"use client"

import { use, useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowRight,
  Bike,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Filter,
  GraduationCap,
  Home as HomeIcon,
  Laptop,
  MapPin,
  MessageCircle,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Tag,
  Users,
} from "lucide-react"
import { getActiveListings } from "@/features/listings/actions"
import { ListingCard } from "@/components/listing/ListingCard"
import { cn } from "@/lib/utils"

const CATEGORIES = [
  { id: "all", name: "All Items", icon: Sparkles },
  { id: "electronics", name: "Electronics", icon: Laptop },
  { id: "books", name: "Books", icon: BookOpen },
  { id: "cycles", name: "Cycles", icon: Bike },
  { id: "dorm-decor", name: "Dorm Decor", icon: HomeIcon },
]

const CONDITION_OPTIONS = [
  { id: "all", label: "All" },
  { id: "new", label: "New" },
  { id: "like_new", label: "Like New" },
  { id: "good", label: "Good" },
  { id: "fair", label: "Fair" },
]

const PRICE_OPTIONS = [
  { id: "all", label: "All Prices" },
  { id: "under_1000", label: "Under ₹1K" },
  { id: "1000_5000", label: "₹1K - ₹5K" },
  { id: "over_5000", label: "Over ₹5K" },
]

const SORT_OPTIONS = [
  { id: "latest", label: "Latest" },
  { id: "price_asc", label: "Price: Low to High" },
  { id: "price_desc", label: "Price: High to Low" },
]

interface HomePageProps {
  searchParams: Promise<{ mode?: string; category?: string; view?: string }>
}

export default function HomePage({ searchParams }: HomePageProps) {
  const { mode = "buy", category = "all", view } = use(searchParams)
  const activeMode = mode === "sell" ? "sell" : "buy"
  const showLandingHero = activeMode === "buy" && view !== "deals" && category === "all"

  const [activeCampus, setActiveCampus] = useState("Aligarh Muslim University (AMU)")
  const [listingsList, setListingsList] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState(category)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCondition, setSelectedCondition] = useState("all")
  const [selectedPriceRange, setSelectedPriceRange] = useState("all")
  const [sortBy, setSortBy] = useState("latest")
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false)

  useEffect(() => {
    if (category) {
      setSelectedCategory(category)
    }
  }, [category])

  useEffect(() => {
    const saved = localStorage.getItem("buykarlo_campus")
    if (saved) {
      setActiveCampus(saved)
    }

    const handleCampusChange = () => {
      setActiveCampus(localStorage.getItem("buykarlo_campus") || "Aligarh Muslim University (AMU)")
    }

    window.addEventListener("buykarlo_campus_changed", handleCampusChange)
    return () => window.removeEventListener("buykarlo_campus_changed", handleCampusChange)
  }, [])

  useEffect(() => {
    async function fetchListings() {
      if (showLandingHero) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const dbCampus = activeCampus.split(" (")[0]
        const res = await getActiveListings(selectedCategory, dbCampus)
        if (res.listings) {
          setListingsList(res.listings)
        }
      } catch (error) {
        console.error("Failed to load listings:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchListings()
  }, [selectedCategory, activeCampus, showLandingHero])

  const processedListings = useMemo(() => {
    let list = [...listingsList]

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        (listing) =>
          listing.title.toLowerCase().includes(q) ||
          (listing.sellerDepartment && listing.sellerDepartment.toLowerCase().includes(q))
      )
    }

    if (selectedCondition !== "all") {
      list = list.filter((listing) => listing.condition === selectedCondition)
    }

    if (selectedPriceRange !== "all") {
      if (selectedPriceRange === "under_1000") {
        list = list.filter((listing) => listing.price < 1000)
      } else if (selectedPriceRange === "1000_5000") {
        list = list.filter((listing) => listing.price >= 1000 && listing.price <= 5000)
      } else if (selectedPriceRange === "over_5000") {
        list = list.filter((listing) => listing.price > 5000)
      }
    }

    if (sortBy === "price_asc") {
      list.sort((a, b) => a.price - b.price)
    } else if (sortBy === "price_desc") {
      list.sort((a, b) => b.price - a.price)
    }

    return list
  }, [listingsList, searchQuery, selectedCondition, selectedPriceRange, sortBy])

  const resetFilters = () => {
    setSearchQuery("")
    setSelectedCondition("all")
    setSelectedPriceRange("all")
    setSortBy("latest")
  }

  const FilterSidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={cn("space-y-8", mobile ? "p-5" : "rounded-[2rem] border border-outline-variant/20 bg-white p-6 shadow-sm")}>
      <section>
        <p className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant/70">Categories</p>
        <div className="space-y-2">
          {CATEGORIES.map((categoryItem) => {
            const Icon = categoryItem.icon
            const isActive = selectedCategory === categoryItem.id

            return (
              <button
                key={categoryItem.id}
                onClick={() => setSelectedCategory(categoryItem.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-[1.4rem] px-4 py-3.5 text-left text-base font-semibold transition-all",
                  isActive
                    ? "bg-primary text-white shadow-[0_12px_28px_rgba(59,61,229,0.18)]"
                    : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                )}
              >
                <Icon size={18} />
                <span>{categoryItem.name}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section>
        <p className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant/70">Condition</p>
        <div className="space-y-3">
          {CONDITION_OPTIONS.filter((option) => option.id !== "all").map((option) => (
            <label key={option.id} className="flex items-center gap-3 text-base text-on-surface-variant">
              <input
                type="checkbox"
                checked={selectedCondition === option.id}
                onChange={() => setSelectedCondition(selectedCondition === option.id ? "all" : option.id)}
                className="h-5 w-5 rounded-md border-outline-variant/30 text-primary focus:ring-primary/20"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant/70">Price Range</p>
          <span className="text-sm text-on-surface-variant">₹0 to ₹5000+</span>
        </div>
        <div className="h-2 rounded-full bg-surface-container-low">
          <div className="h-2 w-1/2 rounded-full bg-primary" />
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-outline-variant/20 bg-surface px-4 py-3 text-sm text-on-surface-variant">Min</div>
          <div className="rounded-2xl border border-outline-variant/20 bg-surface px-4 py-3 text-sm text-on-surface-variant">Max</div>
        </div>
      </section>

      <button
        onClick={resetFilters}
        className="w-full rounded-full border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm font-bold text-on-surface-variant transition-colors hover:text-primary"
      >
        Reset Filters
      </button>
    </div>
  )

  if (showLandingHero) {
    return (
      <div className="-mx-4 -mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500 md:-mx-margin-desktop">
        <section className="relative isolate overflow-hidden bg-white">
          <div className="absolute inset-y-0 right-0 hidden w-[58%] rounded-bl-[4rem] bg-primary/10 lg:block" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_8%,rgba(107,56,212,0.12),transparent_30%),linear-gradient(90deg,#ffffff_0%,rgba(255,255,255,0.94)_43%,rgba(255,255,255,0.62)_70%,rgba(255,255,255,0.42)_100%)]" />

          <div className="relative mx-auto grid max-w-container-max gap-10 px-4 pb-6 pt-10 md:px-margin-desktop lg:min-h-[720px] lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:pb-0">
            <div className="z-10 max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-bold text-primary">
                <ShieldCheck size={18} />
                Trusted student marketplace for AMU
              </span>

              <h1 className="mt-8 font-display text-5xl font-extrabold leading-[1.08] tracking-tight text-on-surface sm:text-6xl lg:text-7xl">
                Browse the best <span className="text-primary">campus deals</span> before someone else does.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-on-surface-variant">
                Explore student-listed books, electronics, cycles, and room essentials around Aligarh Muslim University. Save money, chat directly, and close the deal on campus.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/?view=deals&mode=buy"
                  className="inline-flex h-14 items-center justify-center gap-3 rounded-xl action-gradient px-7 text-base font-bold text-white shadow-[0_18px_34px_rgba(59,61,229,0.28)] transition-transform hover:-translate-y-0.5"
                >
                  Explore Deals
                  <ArrowRight size={20} />
                </Link>
                <Link
                  href="/?mode=sell"
                  className="inline-flex h-14 items-center justify-center gap-3 rounded-xl border border-outline-variant/30 bg-white px-7 text-base font-bold text-on-surface shadow-sm transition-colors hover:text-primary"
                >
                  <Tag size={20} />
                  Sell Something
                </Link>
              </div>

              <div className="mt-8 grid gap-3 text-sm font-medium text-on-surface-variant sm:grid-cols-3">
                {[
                  [ShieldCheck, "Verified students only"],
                  [CheckCircle2, "No markup"],
                  [MapPin, "Local meetups"],
                ].map(([Icon, label]) => {
                  const FeatureIcon = Icon as typeof ShieldCheck
                  return (
                    <div key={label as string} className="flex items-center gap-3">
                      <FeatureIcon size={22} className="text-primary" />
                      <span>{label as string}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="relative min-h-[420px] overflow-hidden rounded-[2.5rem] bg-primary/10 shadow-[0_30px_70px_rgba(28,22,207,0.14)] lg:min-h-[640px]">
              <Image
                src="/illustrations/buykarlo-campus-trust.png"
                alt="AMU students using BuyKarlo for trusted campus exchange"
                fill
                priority
                sizes="(min-width: 1024px) 58vw, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-white/80 via-white/30 to-primary/10" />

              <div className="absolute right-4 top-8 w-[min(78%,310px)] rounded-3xl border border-white/70 bg-white/90 p-4 shadow-[0_18px_38px_rgba(25,28,32,0.14)] backdrop-blur md:right-8">
                <div className="flex gap-3">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-surface-container-low text-primary">
                    <BookOpen size={30} />
                  </div>
                  <div>
                    <p className="font-bold text-on-surface">HC Verma Physics</p>
                    <p className="mt-1 text-sm text-on-surface-variant">₹280 · Like New</p>
                    <p className="mt-2 flex items-center gap-1 text-sm font-semibold text-success">
                      <CheckCircle2 size={15} />
                      Sold 2h ago
                    </p>
                  </div>
                </div>
              </div>

              <div className="absolute right-6 top-[12.5rem] w-[min(76%,300px)] rounded-3xl border border-white/70 bg-white/90 p-4 shadow-[0_18px_38px_rgba(25,28,32,0.13)] backdrop-blur md:right-20">
                <div className="flex gap-3">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-surface-container-low text-primary">
                    <Bike size={32} />
                  </div>
                  <div>
                    <p className="font-bold text-on-surface">Hero Ranger Cycle</p>
                    <p className="mt-1 text-sm text-on-surface-variant">₹3,500 · Good Condition</p>
                    <p className="mt-2 text-sm font-semibold text-on-surface-variant">
                      <span className="text-success">2</span> interested
                    </p>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-40 right-4 flex w-[min(82%,330px)] items-center gap-4 rounded-3xl border border-white/70 bg-white/90 p-4 shadow-[0_18px_38px_rgba(25,28,32,0.13)] backdrop-blur md:right-10">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                  <MessageCircle size={22} />
                </div>
                <div>
                  <p className="font-bold text-on-surface">New message</p>
                  <p className="mt-1 text-sm text-on-surface-variant">Is this still available?</p>
                </div>
              </div>

              <div className="absolute bottom-10 left-4 right-4 rounded-3xl border border-white/70 bg-white/90 p-5 shadow-[0_18px_38px_rgba(25,28,32,0.14)] backdrop-blur md:left-auto md:w-[390px]">
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-primary/10 text-primary">
                      <Users size={24} />
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-secondary text-white text-sm font-bold">
                      2k+
                    </div>
                  </div>
                  <div>
                    <p className="text-xl font-extrabold text-on-surface">2,000+ AMU students</p>
                    <p className="text-sm text-on-surface-variant">buying and selling daily</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative mx-auto max-w-container-max px-4 pb-10 md:px-margin-desktop">
            <div className="grid gap-4 rounded-[2rem] border border-outline-variant/20 bg-white/90 p-5 shadow-[0_20px_50px_rgba(28,22,207,0.08)] backdrop-blur md:grid-cols-4 md:p-7">
              {[
                [GraduationCap, "10K+", "AMU Students", "bg-primary/10 text-primary"],
                [ShieldCheck, "100%", "Verified Listings", "bg-success/10 text-success"],
                [Tag, "50K+", "Deals Closed", "bg-pink-500/10 text-pink-500"],
                [Users, "2K+", "Active Sellers", "bg-secondary/10 text-secondary"],
              ].map(([Icon, value, label, tone]) => {
                const StatIcon = Icon as typeof GraduationCap
                return (
                  <div key={label as string} className="flex items-center gap-4 border-outline-variant/20 md:border-r md:last:border-r-0">
                    <div className={cn("flex h-16 w-16 shrink-0 items-center justify-center rounded-full", tone as string)}>
                      <StatIcon size={30} />
                    </div>
                    <div>
                      <p className="text-3xl font-extrabold text-on-surface">{value as string}</p>
                      <p className="text-base text-on-surface-variant">{label as string}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      </div>
    )
  }

  if (activeMode === "sell") {
    return (
      <div className="flex flex-col gap-10 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <section className="seller-soft-gradient overflow-hidden rounded-[2rem] border border-[var(--seller-border)] px-6 py-8 md:px-10 md:py-12">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <span className="inline-flex rounded-full bg-[var(--seller-surface)] px-4 py-2 text-sm font-bold uppercase tracking-[0.18em] text-[var(--seller-primary)]">
                Zero platform commission
              </span>
              <h1 className="mt-5 font-display text-5xl font-extrabold tracking-tight text-on-surface md:text-7xl">
                Turn unused campus gear into calm, trusted cashflow.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-on-surface-variant md:text-lg">
                List your books, cycles, calculators, or room essentials with a seller workflow built to feel reliable on both desktop and mobile.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/sell"
                  className="rounded-full bg-[var(--seller-primary)] px-8 py-4 text-center text-base font-bold text-white shadow-[0_18px_36px_rgba(31,157,119,0.26)]"
                >
                  List Your Product
                </Link>
                <Link
                  href="/dashboard"
                  className="rounded-full border border-[var(--seller-border)] bg-white px-8 py-4 text-center text-base font-bold text-[var(--seller-primary-strong)]"
                >
                  Open Seller Hub
                </Link>
              </div>
            </div>

            <div className="rounded-[2rem] border border-[var(--seller-border)] bg-white p-6 shadow-[0_18px_36px_rgba(31,157,119,0.08)]">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--seller-primary)]">Why seller mode works</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <div className="rounded-[1.5rem] bg-[var(--seller-surface)] px-4 py-4">
                  <p className="font-semibold text-[var(--seller-primary-strong)]">Keep 100% of your earnings</p>
                </div>
                <div className="rounded-[1.5rem] bg-[var(--seller-surface)] px-4 py-4">
                  <p className="font-semibold text-[var(--seller-primary-strong)]">Sell only to verified student buyers</p>
                </div>
                <div className="rounded-[1.5rem] bg-[var(--seller-surface)] px-4 py-4">
                  <p className="font-semibold text-[var(--seller-primary-strong)]">Close deals with quick campus meetups</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <section className="mb-6 rounded-[2rem] border border-outline-variant/20 bg-white px-5 py-5 shadow-sm md:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-bold text-primary">
              <ShieldCheck size={16} />
              Verified student marketplace
            </span>
            <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-on-surface md:text-4xl">
              Browse the best campus deals before someone else does.
            </h1>
            <p className="mt-2 max-w-2xl text-base text-on-surface-variant">
              Explore student-listed books, electronics, cycles, and room essentials around {activeCampus.split(" (")[0]}. Chat directly, negotiate smartly, and close the deal on campus.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["Verified", "Student-only seller identity"],
              ["No markup", "Better value than retail"],
              ["Local meetups", "Faster campus handoffs"],
            ].map(([title, subtitle]) => (
              <div key={title} className="rounded-[1.5rem] bg-surface-container-low px-4 py-4">
                <p className="text-base font-bold text-on-surface">{title}</p>
                <p className="mt-1 text-sm text-on-surface-variant">{subtitle}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-28">
            <FilterSidebar />
          </div>
        </aside>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-outline-variant/20 bg-white p-4 shadow-sm md:p-6">
            <div className="relative flex items-center rounded-full border border-outline-variant/20 bg-surface-container-low px-5 py-3 shadow-sm">
              <Search size={20} className="text-on-surface-variant/60" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search within all listings..."
                className="w-full bg-transparent px-4 text-base text-on-surface outline-none placeholder:text-on-surface-variant/60"
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2 lg:hidden">
              {CATEGORIES.map((categoryItem) => {
                const Icon = categoryItem.icon
                const isActive = selectedCategory === categoryItem.id
                return (
                  <button
                    key={categoryItem.id}
                    onClick={() => setSelectedCategory(categoryItem.id)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                      isActive ? "bg-primary text-white" : "bg-surface-container-low text-on-surface-variant"
                    )}
                  >
                    <Icon size={14} />
                    {categoryItem.name}
                  </button>
                )
              })}
            </div>

            <div className="mt-5 flex flex-col gap-4 border-t border-outline-variant/10 pt-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-lg font-semibold text-on-surface">
                  <span className="font-extrabold">{processedListings.length}</span> listings found
                </p>
                <div className="hidden h-5 w-px bg-outline-variant/30 xl:block" />
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSortBy(option.id)}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                      sortBy === option.id
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-outline-variant/15 bg-surface-container-low text-on-surface-variant hover:text-on-surface"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMobileFiltersOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full border border-outline-variant/20 bg-surface-container-low px-4 py-2 text-sm font-semibold text-on-surface-variant lg:hidden"
                >
                  <Filter size={16} />
                  Filters
                </button>
                <div className="inline-flex items-center gap-2 rounded-full bg-surface-container-low p-1">
                  <button className="rounded-2xl bg-primary/10 p-3 text-primary">
                    <SlidersHorizontal size={18} />
                  </button>
                  <button className="rounded-2xl p-3 text-on-surface-variant/60">
                    <Filter size={18} />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant/70">Condition</span>
              {CONDITION_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setSelectedCondition(option.id)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                    selectedCondition === option.id
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-outline-variant/15 bg-surface-container-low text-on-surface-variant"
                  )}
                >
                  {option.label}
                </button>
              ))}
              <span className="ml-2 text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant/70">Price</span>
              {PRICE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setSelectedPriceRange(option.id)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                    selectedPriceRange === option.id
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-outline-variant/15 bg-surface-container-low text-on-surface-variant"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {isLoading
              ? [...Array(6)].map((_, index) => (
                  <div key={index} className="h-[420px] animate-pulse rounded-[2rem] border border-outline-variant/20 bg-white" />
                ))
              : processedListings.length > 0
                ? processedListings.map((listing) => <ListingCard key={listing.id} {...listing} />)
                : (
                  <div className="col-span-full rounded-[2rem] border border-outline-variant/15 bg-white px-6 py-16 text-center shadow-sm">
                    <p className="text-lg font-semibold text-on-surface">No listings match these filters yet.</p>
                    <p className="mt-2 text-on-surface-variant">Try a broader category, reset filters, or switch campus later.</p>
                    <button
                      onClick={resetFilters}
                      className="mt-6 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white shadow-[0_16px_30px_rgba(59,61,229,0.2)]"
                    >
                      Clear Filters
                    </button>
                  </div>
                )}
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button className="flex h-12 w-12 items-center justify-center rounded-full border border-outline-variant/20 bg-white text-on-surface-variant shadow-sm">
              <ArrowLeft size={18} />
            </button>
            {[1, 2, 3].map((page) => (
              <button
                key={page}
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-full text-lg font-semibold",
                  page === 1 ? "bg-primary text-white shadow-[0_12px_24px_rgba(59,61,229,0.22)]" : "text-on-surface-variant"
                )}
              >
                {page}
              </button>
            ))}
            <span className="px-1 text-on-surface-variant">…</span>
            <button className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-semibold text-on-surface-variant">
              12
            </button>
            <button className="flex h-12 w-12 items-center justify-center rounded-full border border-outline-variant/20 bg-white text-on-surface-variant shadow-sm">
              <ChevronRight size={18} />
            </button>
          </div>

          <section className="grid gap-6 pt-8 lg:grid-cols-3">
            <div className="rounded-[2rem] border border-outline-variant/20 bg-white p-6 shadow-sm lg:col-span-2">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Buyer trust</p>
                  <h2 className="text-2xl font-bold text-on-surface">Why campus buying works better here</h2>
                </div>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {[
                  ["Verified students", "Seller identity and campus context are easier to trust."],
                  ["Lower prices", "Students usually price for quick resale, not retail margins."],
                  ["Faster deals", "Chat, meet, inspect, and close without shipping friction."],
                ].map(([title, copy]) => (
                  <div key={title} className="rounded-[1.5rem] bg-surface-container-low px-4 py-4">
                    <p className="font-semibold text-on-surface">{title}</p>
                    <p className="mt-2 text-sm leading-6 text-on-surface-variant">{copy}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] bg-primary px-6 py-6 text-white shadow-[0_18px_36px_rgba(59,61,229,0.18)]">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/80">How buying works</p>
              <div className="mt-5 space-y-4">
                {[
                  "Browse what students near you are selling.",
                  "Open the listing and chat directly with the seller.",
                  "Negotiate, meet on campus, inspect, and buy.",
                ].map((step, index) => (
                  <div key={step} className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-sm font-bold">
                      {index + 1}
                    </div>
                    <p className="text-sm leading-6 text-white/90">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>

      {isMobileFiltersOpen ? (
        <div className="fixed inset-0 z-50 bg-slate-950/40 lg:hidden">
          <div className="absolute inset-y-0 left-0 w-[86%] max-w-sm overflow-y-auto bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-outline-variant/10 px-5 py-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant/70">Filters</p>
                <h2 className="text-xl font-bold text-on-surface">Refine listings</h2>
              </div>
              <button
                onClick={() => setIsMobileFiltersOpen(false)}
                className="rounded-full bg-surface-container-low p-2 text-on-surface-variant"
              >
                <ArrowLeft size={18} />
              </button>
            </div>
            <FilterSidebar mobile />
          </div>
        </div>
      ) : null}
    </div>
  )
}
