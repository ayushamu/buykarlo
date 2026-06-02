"use client"

import { use, useEffect, useMemo, useState, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
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
  X,
  ChevronDown
} from "lucide-react"
import { getActiveListings } from "@/features/listings/actions"
import { ListingCard } from "@/components/listing/ListingCard"
import { CountUpStat, Reveal, StaggerReveal, fadeUpVariants, staggerContainer } from "@/components/motion/PremiumMotion"
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

const HERO_NOTIFICATIONS = [
  "New listing posted near AMU",
  "3 students interested",
  "Verified seller",
  "Deal closed nearby",
  "Rohan listed Calculus Book for ₹350",
]

const HERO_ACTIVITY = [
  "A seller near Zakir Hostel just replied in 2 min",
  "Physics notes saved by 4 AMU students today",
  "Cycle listing moved to final meetup near Library Canteen",
  "New verified buyer joined from Engineering Faculty",
]

const HERO_STATS = [
  { icon: GraduationCap, end: 10, suffix: "K+", label: "AMU Students", tone: "bg-primary/10 text-primary" },
  { icon: ShieldCheck, end: 100, suffix: "%", label: "Verified Listings", tone: "bg-success/10 text-success" },
  { icon: Tag, end: 50, suffix: "K+", label: "Deals Closed", tone: "bg-pink-500/10 text-pink-500" },
  { icon: Users, end: 2, suffix: "K+", label: "Active Sellers", tone: "bg-secondary/10 text-secondary" },
]

const FAQ_ITEMS = [
  {
    question: "What is reselling and how does it work?",
    answer: "Reselling (re-selling) is a simple business model where pre-owned, refurbished, or surplus items are sold to secondary buyers. In Hindi, reselling represents simple campus trading—buying textbooks, cycles, or dorm furniture and selling them to other students to recover costs or make a profit. BuyKarlo provides a 100% free, commission-free local marketplace for this process.",
  },
  {
    question: "How can I start a reselling business as an AMU student?",
    answer: "Starting an online reselling business on campus is easy: collect your unused items (like exam textbooks, semester study notes, cycles, hostel furniture, or dorm electronics), check their condition, click high-quality photos, and list them on BuyKarlo. Because the platform is tailored for verified students, your listing reaches buyers instantly with zero commission or shipping fees.",
  },
  {
    question: "What makes BuyKarlo different from commercial reselling apps like Meesho or Amazon?",
    answer: "Unlike commercial reselling apps in India (like Meesho or Amazon Reselling) which focus on bulk drop-shipping or retail distribution, BuyKarlo is a hyper-local peer-to-peer student marketplace. You trade directly in person on campus with verified students. There are no shipping delays, no payment holding periods, and no transaction fees.",
  },
  {
    question: "Is listing items for reselling on BuyKarlo free?",
    answer: "Yes, BuyKarlo is 100% free with zero platform commission. You keep 100% of your sale value. You can coordinate meetups directly in chat, inspect the item in public campus spaces (like libraries, departments, or hostel canteens), and receive payments instantly via UPI or cash.",
  },
]

interface HomePageProps {
  searchParams: Promise<{ mode?: string; category?: string; view?: string }>
}

export default function HomePage({ searchParams }: HomePageProps) {
  const { mode = "buy", category = "all", view } = use(searchParams)
  const activeMode = mode === "sell" ? "sell" : "buy"
  const showLandingHero = activeMode === "buy" && view !== "deals" && category === "all"
  const reduceMotion = useReducedMotion()

  const [activeCampus, setActiveCampus] = useState("Aligarh Muslim University (AMU)")
  const [listingsList, setListingsList] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState(category)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCondition, setSelectedCondition] = useState("all")
  const [selectedPriceRange, setSelectedPriceRange] = useState("all")
  const [sortBy, setSortBy] = useState("latest")
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false)
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false)
  const [visibleNotificationCount, setVisibleNotificationCount] = useState(1)
  const [activityIndex, setActivityIndex] = useState(0)
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(null)
  const [showAllCategories, setShowAllCategories] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const listingsGridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setCurrentPage(1)
  }, [selectedCategory, searchQuery, selectedCondition, selectedPriceRange, sortBy, activeCampus])

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

  useEffect(() => {
    if (reduceMotion || !showLandingHero) return

    // Keep hero activity feeling live without tying the UI to real-time data.
    const notificationTimer = window.setInterval(() => {
      setVisibleNotificationCount((count) => (count >= HERO_NOTIFICATIONS.length ? 1 : count + 1))
    }, 2400)

    const activityTimer = window.setInterval(() => {
      setActivityIndex((index) => (index + 1) % HERO_ACTIVITY.length)
    }, 3600)

    return () => {
      window.clearInterval(notificationTimer)
      window.clearInterval(activityTimer)
    }
  }, [reduceMotion, showLandingHero])

  const processedListings = useMemo(() => {
    let list = [...listingsList]

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter((listing) => {
        const titleMatch = listing.title?.toLowerCase().includes(q) || false
        const descMatch = listing.description?.toLowerCase().includes(q) || false
        const catMatch = listing.categorySlug?.toLowerCase().includes(q) || false
        const deptMatch = listing.sellerDepartment?.toLowerCase().includes(q) || false
        
        const keywordsArray = Array.isArray(listing.keywords)
          ? listing.keywords
          : typeof listing.keywords === 'string'
          ? [listing.keywords]
          : []
        const keywordMatch = keywordsArray.some((keyword: any) =>
          typeof keyword === 'string' && keyword.toLowerCase().includes(q)
        )

        return titleMatch || descMatch || catMatch || deptMatch || keywordMatch
      })
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

  const ITEMS_PER_PAGE = 6
  const totalPages = Math.ceil(processedListings.length / ITEMS_PER_PAGE)

  const paginatedListings = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    const end = start + ITEMS_PER_PAGE
    return processedListings.slice(start, end)
  }, [processedListings, currentPage])

  const getPageNumbers = () => {
    const pages = []
    const range = 1
    
    pages.push(1)
    
    const start = Math.max(2, currentPage - range)
    const end = Math.min(totalPages - 1, currentPage + range)
    
    if (currentPage - range > 2) {
      pages.push("ellipsis-1")
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    
    if (currentPage + range < totalPages - 1) {
      pages.push("ellipsis-2")
    }
    
    if (totalPages > 1) {
      pages.push(totalPages)
    }
    
    return pages
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    listingsGridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

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
          {(showAllCategories ? CATEGORIES : CATEGORIES.slice(0, 4)).map((categoryItem) => {
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
          {CATEGORIES.length > 4 && (
            <button
              onClick={() => setShowAllCategories(!showAllCategories)}
              className="flex w-full items-center justify-center gap-1.5 rounded-full border border-outline-variant/15 bg-surface-container-low hover:bg-surface-container px-4 py-2.5 text-xs font-bold text-on-surface-variant transition-colors cursor-pointer mt-1"
            >
              <span>{showAllCategories ? "Show Less" : `Show More (+${CATEGORIES.length - 4})`}</span>
              <ChevronDown size={14} className={cn("transition-transform duration-200 text-outline-variant", showAllCategories && "rotate-180 text-primary")} />
            </button>
          )}
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
    const websiteJsonLd = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "BuyKarlo",
      "url": "https://buykarlo.in",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://buykarlo.in/?search={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    };

    const organizationJsonLd = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "BuyKarlo",
      "url": "https://buykarlo.in",
      "logo": "https://buykarlo.in/brand/buykarlo-mark.png",
      "areaServed": {
        "@type": "AdministrativeArea",
        "name": "Aligarh Muslim University (AMU)"
      }
    };

    const faqJsonLd = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": FAQ_ITEMS.map((faq) => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    };

    return (
      <div className="-mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500 md:-mx-margin-desktop">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
        <section className="relative isolate overflow-hidden bg-white">
          <div className="absolute inset-y-0 right-0 hidden w-[58%] rounded-bl-[4rem] bg-primary/10 lg:block" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_8%,rgba(107,56,212,0.12),transparent_30%),linear-gradient(90deg,#ffffff_0%,rgba(255,255,255,0.94)_43%,rgba(255,255,255,0.62)_70%,rgba(255,255,255,0.42)_100%)]" />
          <motion.div
            aria-hidden="true"
            className="absolute left-[8%] top-16 h-44 w-44 rounded-full bg-amber-300/20 blur-3xl"
            animate={reduceMotion ? undefined : { x: [0, 18, 0], y: [0, -10, 0], scale: [1, 1.08, 1] }}
            transition={{ duration: 12, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
          />
          <motion.div
            aria-hidden="true"
            className="absolute bottom-24 right-[18%] h-56 w-56 rounded-full bg-orange-400/15 blur-3xl"
            animate={reduceMotion ? undefined : { x: [0, -16, 0], y: [0, 14, 0], scale: [1, 1.12, 1] }}
            transition={{ duration: 14, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
          />
          <motion.div
            aria-hidden="true"
            className="absolute right-[4%] top-24 h-64 w-64 rounded-full bg-secondary/15 blur-3xl"
            animate={reduceMotion ? undefined : { x: [0, -14, 0], y: [0, -18, 0], scale: [1, 1.06, 1] }}
            transition={{ duration: 16, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
          />

          <div className="relative mx-auto grid max-w-container-max gap-8 px-4 pb-6 pt-8 md:gap-10 md:px-margin-desktop md:pt-10 lg:min-h-[720px] lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:pb-0">
            <motion.div className="z-10 max-w-3xl min-w-0" initial="hidden" animate="show" variants={staggerContainer}>
              <motion.span variants={fadeUpVariants} className="inline-flex max-w-full items-center gap-2 rounded-full bg-primary/10 px-3.5 py-2 text-xs font-bold text-primary sm:text-sm">
                <ShieldCheck size={18} />
                Trusted student marketplace for AMU
              </motion.span>

              <motion.h1 variants={fadeUpVariants} className="mt-6 max-w-full break-words font-display text-[2.6rem] font-extrabold leading-[1.08] tracking-tight text-on-surface sm:text-6xl md:mt-8 lg:text-7xl">
                Browse the best <span className="text-primary">campus deals</span> before someone else does.
              </motion.h1>

              <motion.p variants={fadeUpVariants} className="mt-5 max-w-2xl text-base leading-7 text-on-surface-variant md:mt-6 md:text-lg md:leading-8">
                Explore student-listed books, electronics, cycles, and room essentials around Aligarh Muslim University. Save money, chat directly, and close the deal on campus.
              </motion.p>

              <motion.div variants={fadeUpVariants} className="mt-7 flex flex-col gap-3 sm:flex-row md:mt-8">
                <motion.div whileHover={reduceMotion ? undefined : { y: -2, scale: 1.015 }} whileTap={reduceMotion ? undefined : { scale: 0.985 }}>
                  <Link
                    href="/?view=deals&mode=buy"
                    className="inline-flex h-14 w-full items-center justify-center gap-3 rounded-xl action-gradient px-7 text-base font-bold text-white shadow-[0_18px_34px_rgba(59,61,229,0.28)] sm:w-auto"
                  >
                    Explore Deals
                    <ArrowRight size={20} />
                  </Link>
                </motion.div>
                <motion.div whileHover={reduceMotion ? undefined : { y: -2, scale: 1.015 }} whileTap={reduceMotion ? undefined : { scale: 0.985 }}>
                  <Link
                    href="/?mode=sell"
                    className="inline-flex h-14 w-full items-center justify-center gap-3 rounded-xl border border-outline-variant/30 bg-white px-7 text-base font-bold text-on-surface shadow-sm transition-colors hover:text-primary sm:w-auto"
                  >
                    <Tag size={20} />
                    Sell Something
                  </Link>
                </motion.div>
              </motion.div>

              <motion.div variants={staggerContainer} className="mt-7 grid gap-3 text-sm font-medium text-on-surface-variant sm:grid-cols-3 md:mt-8">
                {[
                  [ShieldCheck, "Verified students only"],
                  [CheckCircle2, "No markup"],
                  [MapPin, "Local meetups"],
                ].map(([Icon, label]) => {
                  const FeatureIcon = Icon as typeof ShieldCheck
                  return (
                    <motion.div key={label as string} variants={fadeUpVariants} className="flex items-center gap-3">
                      <FeatureIcon size={22} className="text-primary" />
                      <span>{label as string}</span>
                    </motion.div>
                  )
                })}
              </motion.div>
            </motion.div>

            <motion.div
              className="relative min-h-[420px] overflow-hidden rounded-[2.5rem] bg-primary/10 shadow-[0_30px_70px_rgba(28,22,207,0.14)] lg:min-h-[640px]"
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            >
              <Image
                src="/illustrations/buykarlo-campus-trust.png"
                alt="AMU students using BuyKarlo for trusted campus exchange"
                fill
                priority
                sizes="(min-width: 1024px) 58vw, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-white/80 via-white/30 to-primary/10" />

              <motion.div
                className="absolute right-4 top-8 w-[min(78%,310px)] rounded-3xl border border-white/70 bg-white/90 p-4 shadow-[0_18px_38px_rgba(25,28,32,0.14)] backdrop-blur md:right-8"
                animate={reduceMotion ? undefined : { y: [0, -8, 0] }}
                transition={{ duration: 5.4, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                whileHover={reduceMotion ? undefined : { y: -10, scale: 1.015 }}
              >
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
              </motion.div>

              <motion.div
                className="absolute right-6 top-[12.5rem] w-[min(76%,300px)] rounded-3xl border border-white/70 bg-white/90 p-4 shadow-[0_18px_38px_rgba(25,28,32,0.13)] backdrop-blur md:right-20"
                animate={reduceMotion ? undefined : { y: [0, 7, 0] }}
                transition={{ duration: 6.1, delay: 0.4, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                whileHover={reduceMotion ? undefined : { y: -6, scale: 1.015 }}
              >
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
              </motion.div>

              <motion.div
                className="absolute bottom-40 right-4 flex w-[min(82%,330px)] items-center gap-4 rounded-3xl border border-white/70 bg-white/90 p-4 shadow-[0_18px_38px_rgba(25,28,32,0.13)] backdrop-blur md:right-10"
                animate={reduceMotion ? undefined : { y: [0, -6, 0] }}
                transition={{ duration: 5.8, delay: 0.8, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                  <MessageCircle size={22} />
                </div>
                <div>
                  <p className="font-bold text-on-surface">New message</p>
                  <p className="mt-1 text-sm text-on-surface-variant">Is this still available?</p>
                </div>
              </motion.div>

              <div className="absolute left-4 top-6 flex w-[min(72%,290px)] flex-col gap-2 md:left-8">
                <AnimatePresence initial={false}>
                  {HERO_NOTIFICATIONS.slice(0, reduceMotion ? 2 : visibleNotificationCount).map((notification, index) => (
                    <motion.div
                      key={notification}
                      layout
                      initial={{ opacity: 0, y: 12, scale: 0.94 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                      className="rounded-2xl border border-white/70 bg-white/90 px-3 py-2 text-xs font-bold text-on-surface shadow-[0_12px_26px_rgba(25,28,32,0.12)] backdrop-blur"
                      style={{ marginLeft: index * 8 }}
                    >
                      {notification}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <motion.div
                className="absolute bottom-10 left-4 right-4 rounded-3xl border border-white/70 bg-white/90 p-5 shadow-[0_18px_38px_rgba(25,28,32,0.14)] backdrop-blur md:left-auto md:w-[390px]"
                animate={reduceMotion ? undefined : { y: [0, 6, 0] }}
                transition={{ duration: 6.6, delay: 0.2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
              >
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
                    <div className="mt-1 h-5 overflow-hidden text-sm text-on-surface-variant">
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.p
                          key={reduceMotion ? HERO_ACTIVITY[0] : HERO_ACTIVITY[activityIndex]}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.28 }}
                        >
                          {reduceMotion ? "buying and selling daily" : HERO_ACTIVITY[activityIndex]}
                        </motion.p>
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>

          <div className="relative mx-auto max-w-container-max px-4 pb-10 md:px-margin-desktop">
            <StaggerReveal className="grid gap-4 rounded-[2rem] border border-outline-variant/20 bg-white/90 p-5 shadow-[0_20px_50px_rgba(28,22,207,0.08)] backdrop-blur md:grid-cols-4 md:p-7">
              {HERO_STATS.map(({ icon: StatIcon, end, suffix, label, tone }) => {
                return (
                  <motion.div key={label} variants={fadeUpVariants} className="flex items-center gap-4 border-outline-variant/20 md:border-r md:last:border-r-0">
                    <div className={cn("flex h-16 w-16 shrink-0 items-center justify-center rounded-full", tone)}>
                      <StatIcon size={30} />
                    </div>
                    <div>
                      <p className="text-3xl font-extrabold text-on-surface">
                        <CountUpStat end={end} suffix={suffix} />
                      </p>
                      <p className="text-base text-on-surface-variant">{label}</p>
                    </div>
                  </motion.div>
                )
              })}
            </StaggerReveal>
          </div>

          {/* FAQ Section */}
          <div className="relative mx-auto max-w-container-max px-4 pb-20 md:px-margin-desktop border-t border-outline-variant/10 pt-16 mt-8">
            <div className="grid gap-10 lg:grid-cols-[1fr_2fr]">
              {/* Left Panel */}
              <div className="space-y-4">
                <span className="inline-flex rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-primary">
                  FAQ & Reselling Guide
                </span>
                <h2 className="font-display text-4xl font-extrabold tracking-tight text-on-surface">
                  Frequently Asked Questions
                </h2>
                <p className="text-base leading-7 text-on-surface-variant font-medium">
                  Have questions about reselling on campus? Find answers on how BuyKarlo helps you buy, sell, and trade books, cycles, and electronics commission-free.
                </p>
              </div>

              {/* Right Panel (Accordion) */}
              <div className="space-y-4">
                {FAQ_ITEMS.map((faq, index) => {
                  const isExpanded = expandedFaqIndex === index
                  return (
                    <div
                      key={index}
                      className={cn(
                        "rounded-[1.5rem] border border-outline-variant/20 bg-white p-5 shadow-sm transition-all duration-200",
                        isExpanded ? "ring-2 ring-primary/10 border-primary/30" : "hover:bg-slate-50"
                      )}
                    >
                      <button
                        onClick={() => setExpandedFaqIndex(isExpanded ? null : index)}
                        className="flex w-full items-center justify-between gap-4 text-left font-bold text-on-surface text-lg cursor-pointer outline-none"
                      >
                        <span>{faq.question}</span>
                        <ChevronDown
                          size={18}
                          className={cn("text-outline-variant transition-transform duration-300 shrink-0", isExpanded && "rotate-180 text-primary")}
                        />
                      </button>
                      
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <p className="mt-4 text-sm leading-6 text-on-surface-variant/90 font-medium animate-in fade-in duration-200">
                              {faq.answer}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </div>
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
    <div className="mx-auto w-full max-w-container-max animate-in fade-in slide-in-from-bottom-4 px-margin-mobile py-8 pb-12 duration-500 md:px-margin-desktop">
      <Reveal>
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
      </Reveal>

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-28">
            <FilterSidebar />
          </div>
        </aside>

        <div className="space-y-6">
          <Reveal>
          <div className="rounded-[2rem] border border-outline-variant/20 bg-white p-4 shadow-sm md:p-6">
            <div className="relative flex items-center rounded-full border border-outline-variant/20 bg-surface-container-low px-5 py-3 shadow-sm focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10 transition-all duration-200">
              <Search size={20} className="text-on-surface-variant/60 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search within all listings..."
                className="w-full bg-transparent px-4 text-base text-on-surface outline-none placeholder:text-on-surface-variant/60"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="p-1 hover:bg-surface-container rounded-full text-on-surface-variant cursor-pointer shrink-0"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Mobile Horizontal scroll Categories */}
            <div className="mt-4 flex flex-wrap gap-2 lg:hidden">
              {CATEGORIES.map((categoryItem) => {
                const Icon = categoryItem.icon
                const isActive = selectedCategory === categoryItem.id
                return (
                  <button
                    key={categoryItem.id}
                    onClick={() => setSelectedCategory(categoryItem.id)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer",
                      isActive ? "bg-primary text-white shadow-sm" : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
                    )}
                  >
                    <Icon size={14} />
                    {categoryItem.name}
                  </button>
                )
              })}
            </div>

            {/* Unified Search & Filters Control Row */}
            <div className="mt-5 flex flex-col gap-4 border-t border-outline-variant/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <p className="text-base font-semibold text-on-surface">
                  <span className="font-extrabold">{processedListings.length}</span> listings found
                </p>
                {((selectedCondition !== "all" ? 1 : 0) + (selectedPriceRange !== "all" ? 1 : 0)) > 0 && (
                  <>
                    <div className="hidden h-4 w-px bg-outline-variant/30 sm:block" />
                    <button
                      onClick={resetFilters}
                      className="text-xs font-bold text-primary hover:text-secondary hover:underline transition-colors cursor-pointer"
                    >
                      Reset Filters
                    </button>
                  </>
                )}
              </div>

              {/* Clean Sorting and Filters Actions */}
              <div className="flex items-center gap-2 sm:self-auto self-end">
                {/* Clean HTML Select for Sorting (Responsive & accessible) */}
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
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      setIsMobileFiltersOpen(true)
                    } else {
                      setIsFiltersExpanded(!isFiltersExpanded)
                    }
                  }}
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

            {/* Desktop Slide-Down Collapsible Advanced Filters panel */}
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
                        {CONDITION_OPTIONS.map((option) => (
                          <button
                            key={option.id}
                            onClick={() => setSelectedCondition(option.id)}
                            className={cn(
                              "rounded-full border px-4 py-2 text-xs font-semibold transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer",
                              selectedCondition === option.id
                                ? "border-primary/40 bg-primary/10 text-primary font-bold shadow-sm"
                                : "border-outline-variant/15 bg-white text-on-surface-variant hover:bg-surface-container"
                            )}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Price Range Sub-group */}
                    <div className="space-y-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70">Price Limit</p>
                      <div className="flex flex-wrap gap-2">
                        {PRICE_OPTIONS.map((option) => (
                          <button
                            key={option.id}
                            onClick={() => setSelectedPriceRange(option.id)}
                            className={cn(
                              "rounded-full border px-4 py-2 text-xs font-semibold transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer",
                              selectedPriceRange === option.id
                                ? "border-primary/40 bg-primary/10 text-primary font-bold shadow-sm"
                                : "border-outline-variant/15 bg-white text-on-surface-variant hover:bg-surface-container"
                            )}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          </Reveal>

          <div ref={listingsGridRef} className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {isLoading
              ? [...Array(6)].map((_, index) => (
                  <div key={index} className="h-[420px] animate-pulse rounded-[2rem] border border-outline-variant/20 bg-white" />
                ))
              : paginatedListings.length > 0
                ? paginatedListings.map((listing, index) => (
                    <div key={listing.id}>
                      <ListingCard {...listing} priority={index < 3} />
                    </div>
                  ))
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

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-outline-variant/20 bg-white text-on-surface-variant shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <ArrowLeft size={18} />
              </button>
              {getPageNumbers().map((page, idx) => {
                if (typeof page === "string") {
                  return (
                    <span key={`ellipsis-${idx}`} className="px-1 text-on-surface-variant">
                      …
                    </span>
                  )
                }
                const isActive = currentPage === page
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-full text-lg font-semibold cursor-pointer",
                      isActive ? "bg-primary text-white shadow-[0_12px_24px_rgba(59,61,229,0.22)]" : "text-on-surface-variant"
                    )}
                  >
                    {page}
                  </button>
                )
              })}
              <button
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-outline-variant/20 bg-white text-on-surface-variant shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}

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
