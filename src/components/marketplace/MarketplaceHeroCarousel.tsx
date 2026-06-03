"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import {
  ArrowRight,
  BadgeCheck,
  Bike,
  BookOpen,
  CheckCircle2,
  Laptop,
  MapPin,
  ShieldCheck,
  Sparkles,
  Tag,
} from "lucide-react"
import { cn } from "@/lib/utils"

type BannerVisualType = "books" | "electronics" | "trust"

interface MarketplaceBanner {
  id: string
  eyebrow: string
  title: string
  subtitle: string
  ctaLabel: string
  href: string
  accent: "indigo" | "emerald" | "rose"
  visualType: BannerVisualType
}

interface MarketplaceHeroCarouselProps {
  campusName?: string
  className?: string
}

const BANNERS: MarketplaceBanner[] = [
  {
    id: "campus-books",
    eyebrow: "Campus Book Deals",
    title: "Semester books, notes, and guides before they sell out.",
    subtitle: "Find student-listed textbooks and prep material near campus without paying fresh-copy prices.",
    ctaLabel: "Browse Books",
    href: "/explore?category=books",
    accent: "indigo",
    visualType: "books",
  },
  {
    id: "budget-electronics",
    eyebrow: "Electronics Under Budget",
    title: "Laptops, chargers, headphones, and gadgets from nearby students.",
    subtitle: "Inspect before payment, chat directly, and close the deal at a familiar campus spot.",
    ctaLabel: "Explore Electronics",
    href: "/explore?category=electronics",
    accent: "emerald",
    visualType: "electronics",
  },
  {
    id: "verified-trades",
    eyebrow: "Verified Student Trades",
    title: "Buy and sell with profile trust, local meetups, and safer handoffs.",
    subtitle: "Student ID review, reports, and chat keep campus trading focused on real people.",
    ctaLabel: "See All Deals",
    href: "/explore?category=all",
    accent: "rose",
    visualType: "trust",
  },
]

const accentStyles = {
  indigo: {
    shell: "from-[#2015d4] via-[#4b2de0] to-[#7c3aed]",
    badge: "bg-white/15 text-white border-white/20",
    cta: "bg-white text-[#2015d4] hover:bg-white/90",
    panel: "bg-white/12 border-white/20",
  },
  emerald: {
    shell: "from-[#006b5d] via-[#059669] to-[#0f766e]",
    badge: "bg-white/15 text-white border-white/20",
    cta: "bg-white text-[#047857] hover:bg-white/90",
    panel: "bg-white/12 border-white/20",
  },
  rose: {
    shell: "from-[#7f1d1d] via-[#be123c] to-[#e11d48]",
    badge: "bg-white/15 text-white border-white/20",
    cta: "bg-white text-[#be123c] hover:bg-white/90",
    panel: "bg-white/12 border-white/20",
  },
}

function BannerVisual({ type, panelClass }: { type: BannerVisualType; panelClass: string }) {
  if (type === "books") {
    return (
      <div className="grid h-full min-h-40 grid-cols-[1fr_0.82fr] items-end gap-3">
        <div className={cn("rounded-2xl border p-4 shadow-sm", panelClass)}>
          <div className="flex items-center gap-2 text-white">
            <BookOpen size={20} />
            <span className="text-xs font-extrabold uppercase">Books</span>
          </div>
          <div className="mt-5 space-y-2">
            <div className="h-3 rounded-full bg-white/80" />
            <div className="h-3 w-4/5 rounded-full bg-white/55" />
            <div className="h-3 w-2/3 rounded-full bg-white/35" />
          </div>
          <div className="mt-5 rounded-xl bg-white px-3 py-2 text-sm font-black text-primary">₹149+</div>
        </div>
        <div className={cn("rounded-2xl border p-4 shadow-sm", panelClass)}>
          <div className="rounded-xl bg-white/90 px-3 py-2 text-center text-sm font-black text-slate-900">JEE Notes</div>
          <div className="mt-4 h-20 rounded-xl border border-white/30 bg-white/20" />
        </div>
      </div>
    )
  }

  if (type === "electronics") {
    return (
      <div className="flex h-full min-h-40 items-center justify-center">
        <div className={cn("relative w-full rounded-3xl border p-4 shadow-sm", panelClass)}>
          <div className="mx-auto aspect-[16/10] max-w-72 rounded-2xl border-4 border-white/70 bg-slate-950/80 p-3">
            <div className="flex h-full items-center justify-center rounded-xl bg-white/10">
              <Laptop size={58} className="text-white" />
            </div>
          </div>
          <div className="mx-auto h-4 w-24 rounded-b-xl bg-white/70" />
          <div className="absolute -right-2 top-6 rounded-full bg-white px-3 py-2 text-xs font-black text-emerald-700 shadow-lg">Like New</div>
          <div className="absolute -left-2 bottom-6 rounded-full bg-white px-3 py-2 text-xs font-black text-emerald-700 shadow-lg">Campus Pickup</div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid h-full min-h-40 grid-cols-2 gap-3">
      <div className={cn("flex flex-col justify-between rounded-2xl border p-4 shadow-sm", panelClass)}>
        <ShieldCheck className="text-white" size={32} />
        <div>
          <p className="text-lg font-black text-white">ID Reviewed</p>
          <p className="mt-1 text-xs font-semibold text-white/75">Student seller badge</p>
        </div>
      </div>
      <div className="grid gap-3">
        <div className={cn("rounded-2xl border p-4 shadow-sm", panelClass)}>
          <MapPin className="text-white" size={24} />
          <p className="mt-3 text-sm font-black text-white">Local meetup</p>
        </div>
        <div className={cn("rounded-2xl border p-4 shadow-sm", panelClass)}>
          <CheckCircle2 className="text-white" size={24} />
          <p className="mt-3 text-sm font-black text-white">Trust score</p>
        </div>
      </div>
    </div>
  )
}

export function MarketplaceHeroCarousel({ campusName = "AMU", className }: MarketplaceHeroCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (reduceMotion) return

    const tick = window.setInterval(() => {
      if (document.hidden) return
      setActiveIndex((index) => (index + 1) % BANNERS.length)
    }, 4000)

    return () => window.clearInterval(tick)
  }, [reduceMotion])

  const activeBanner = BANNERS[activeIndex]
  const accent = accentStyles[activeBanner.accent]
  const campusLabel = useMemo(() => campusName.replace("Aligarh Muslim University", "AMU"), [campusName])

  return (
    <section className={cn("overflow-hidden rounded-[2rem] border border-outline-variant/15 bg-white shadow-sm", className)}>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeBanner.id}
          initial={reduceMotion ? false : { opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, x: -28 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className={cn(
            "relative isolate min-h-[220px] overflow-hidden bg-gradient-to-br px-5 py-6 text-white md:min-h-[260px] md:px-10 md:py-9",
            accent.shell
          )}
        >
          <div className="absolute inset-x-0 top-0 h-px bg-white/30" />
          <div className="grid min-h-[180px] items-center gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
            <div className="min-w-0">
              <span className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black uppercase", accent.badge)}>
                <Sparkles size={14} />
                {activeBanner.eyebrow}
              </span>
              <h1 className="mt-4 max-w-4xl font-display text-3xl font-extrabold leading-tight tracking-normal text-white md:text-5xl">
                {activeBanner.title}
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-relaxed text-white/82 md:text-lg">
                {activeBanner.subtitle} <span className="font-extrabold text-white">{campusLabel}</span>
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Link
                  href={activeBanner.href}
                  className={cn("inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-black shadow-lg transition", accent.cta)}
                >
                  {activeBanner.ctaLabel}
                  <ArrowRight size={16} />
                </Link>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-3 text-xs font-bold text-white/90">
                  {activeBanner.visualType === "books" ? <BookOpen size={15} /> : activeBanner.visualType === "electronics" ? <Tag size={15} /> : <BadgeCheck size={15} />}
                  Student-first pricing
                </div>
              </div>
            </div>

            <div className="hidden min-w-0 lg:block">
              <BannerVisual type={activeBanner.visualType} panelClass={accent.panel} />
            </div>
          </div>

          <div className="mt-5 flex gap-2 lg:hidden">
            {[BookOpen, Laptop, Bike].map((Icon, index) => (
              <div key={index} className="flex size-10 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white">
                <Icon size={18} />
              </div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  )
}
