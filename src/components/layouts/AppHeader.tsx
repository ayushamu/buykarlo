"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import {
  Bell,
  ChevronDown,
  LayoutDashboard,
  MapPin,
  MessageSquare,
  Package,
  Search,
  ShieldCheck,
  ShoppingCart,
  ShoppingBag,
  User,
  Check
} from "lucide-react"
import { BuyKarloMark } from "@/components/brand/BuyKarloMark"
import { cn } from "@/lib/utils"

const CAMPUSES = [
  { name: "Aligarh Muslim University (AMU)", active: true, short: "AMU" },
  { name: "Delhi University (DU)", active: true, short: "DU" },
  { name: "Jamia Millia Islamia (JMI)", active: true, short: "JMI" },
  { name: "UPES Dehradun", active: false, short: "UPES" },
  { name: "Jawaharlal Nehru University (JNU)", active: false, short: "JNU" },
  { name: "Banaras Hindu University (BHU)", active: false, short: "BHU" },
  { name: "BITS Pilani", active: false, short: "BITS" },
  { name: "IIT Delhi (IITD)", active: false, short: "IITD" },
  { name: "IIT Bombay (IITB)", active: false, short: "IITB" }
]

interface HeaderProfile {
  full_name?: string | null
  avatar_url?: string | null
  university?: string | null
}

interface AppHeaderProps {
  profile?: HeaderProfile | null
}

const BUYER_CATEGORIES = [
  { name: "Electronics", href: "/electronics" },
  { name: "Books", href: "/books" },
  { name: "Cycles", href: "/cycles" },
  { name: "Dorm Decor", href: "/dorm-decor" },
]

const SELLER_NAV = [
  { name: "Overview", href: "/dashboard", match: (pathname: string) => pathname === "/dashboard", icon: LayoutDashboard },
  { name: "Listings", href: "/dashboard/listings", match: (pathname: string) => pathname.startsWith("/dashboard/listings"), icon: Package },
  { name: "Orders", href: "/dashboard/orders", match: (pathname: string) => pathname.startsWith("/dashboard/orders"), icon: ShoppingBag },
  { name: "Trust", href: "/dashboard/trust", match: (pathname: string) => pathname.startsWith("/dashboard/trust"), icon: ShieldCheck },
]

function getInitials(name?: string | null) {
  if (!name) return "BK"
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

export function AppHeader({ profile }: AppHeaderProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const marketplaceMode = searchParams.get("mode") === "sell" ? "sell" : "buy"

  const [selectedCampus, setSelectedCampus] = useState("Aligarh Muslim University (AMU)")
  const [dropdownOpen, setDropdownOpen] = useState(false)

  // Load saved campus on client mount
  useEffect(() => {
    const saved = localStorage.getItem("buykarlo_campus")
    if (saved) {
      setSelectedCampus(saved)
    } else if (profile?.university) {
      // If user is logged in and has profile university, use it
      const matched = CAMPUSES.find(c => c.name.startsWith(profile.university!) || profile.university!.startsWith(c.name))
      if (matched) {
        setSelectedCampus(matched.name)
        localStorage.setItem("buykarlo_campus", matched.name)
      }
    }
  }, [profile])

  const handleSelectCampus = (campusName: string) => {
    setSelectedCampus(campusName)
    localStorage.setItem("buykarlo_campus", campusName)
    document.cookie = `buykarlo_campus=${encodeURIComponent(campusName)}; path=/; max-age=31536000`
    window.dispatchEvent(new Event("buykarlo_campus_changed"))
    setDropdownOpen(false)
  }

  const activeCampusShort = CAMPUSES.find(c => c.name === selectedCampus)?.short || "AMU"

  const isSellerWorkspace =
    pathname.startsWith("/dashboard") || pathname.startsWith("/sell") || (pathname === "/" && marketplaceMode === "sell")
  const isProductDetail = pathname.startsWith("/item/")

  const sellerTitle =
    pathname === "/sell"
      ? "Create Listing"
      : SELLER_NAV.find((item) => item.match(pathname))?.name ?? "Seller Hub"

  if (isSellerWorkspace) {
    return (
      <header className="sticky top-0 z-50 border-b border-[var(--seller-border)] bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-container-max items-center gap-3 px-4 py-4 md:px-margin-desktop md:py-5">
          <Link href="/dashboard" className="hidden items-center gap-3 lg:flex">
            <div className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-white shadow-[0_16px_32px_rgba(31,157,119,0.18)]">
              <BuyKarloMark className="h-14 w-14" />
            </div>
            <div>
              <p className="font-display text-3xl font-extrabold tracking-tight text-on-surface">BuyKarlo</p>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-[var(--seller-primary)]">Seller Hub</p>
            </div>
          </Link>

          <div className="flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] bg-white shadow-sm">
              <BuyKarloMark className="h-11 w-11" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--seller-primary)]">Seller Mode</p>
              <p className="font-display text-2xl font-extrabold tracking-tight text-on-surface">{sellerTitle}</p>
            </div>
          </div>

          <div className="hidden flex-1 items-center gap-4 lg:flex">
            <label className="flex flex-1 items-center gap-3 rounded-full border border-[var(--seller-border)] bg-[var(--seller-surface)] px-5 py-3 text-sm text-[var(--seller-text-soft)] shadow-sm">
              <Search size={18} className="text-[var(--seller-primary-strong)]" />
              <input
                type="text"
                placeholder="Search items, buyers, and chat history..."
                className="w-full bg-transparent outline-none placeholder:text-[var(--seller-text-soft)]"
              />
            </label>

            <Link
              href="/"
              className="rounded-full border border-[var(--seller-border)] bg-white px-5 py-3 text-sm font-bold text-[var(--seller-primary-strong)] transition-colors hover:bg-[var(--seller-surface)]"
            >
              Switch to Buy
            </Link>

            <Link
              href="/sell"
              className="rounded-full bg-[var(--seller-primary)] px-6 py-3 text-sm font-bold text-white shadow-[0_16px_30px_rgba(31,157,119,0.22)] transition-transform hover:-translate-y-0.5"
            >
              Create New Listing
            </Link>

            <Link href="/messages" className="rounded-full border border-[var(--seller-border)] p-3 text-[var(--seller-primary-strong)] hover:bg-[var(--seller-surface)]">
              <MessageSquare size={18} />
            </Link>

            <div className="flex items-center gap-3 border-l border-outline-variant/40 pl-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--seller-surface)] text-lg font-extrabold text-[var(--seller-primary)]">
                {getInitials(profile?.full_name)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-lg font-bold text-on-surface">{profile?.full_name || "Campus Seller"}</p>
                <p className="truncate text-sm text-on-surface-variant">{profile?.university || "BuyKarlo Student Network"}</p>
              </div>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2 lg:hidden">
            <Link
              href="/"
              className="rounded-full border border-[var(--seller-border)] bg-white px-3 py-2 text-sm font-bold text-[var(--seller-primary-strong)]"
            >
              Buy
            </Link>
            <Link
              href="/sell"
              className="rounded-full bg-[var(--seller-primary)] px-4 py-2 text-sm font-bold text-white shadow-[0_10px_24px_rgba(31,157,119,0.2)]"
            >
              Sell
            </Link>
          </div>
        </div>

        <div className="mx-auto hidden max-w-container-max px-4 pb-4 lg:block md:px-margin-desktop">
          <div className="flex items-center gap-2 overflow-x-auto rounded-full border border-[var(--seller-border)] bg-[var(--seller-surface)] px-2 py-2 scrollbar-none">
            {SELLER_NAV.map((item) => {
              const isActive = item.match(pathname)
              const Icon = item.icon

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors",
                    isActive
                      ? "bg-[var(--seller-primary)] text-white shadow-[0_12px_24px_rgba(31,157,119,0.18)]"
                      : "text-[var(--seller-text-soft)] hover:bg-white hover:text-[var(--seller-primary-strong)]"
                  )}
                >
                  <Icon size={16} />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-outline-variant/30 bg-surface/90 backdrop-blur-xl shadow-sm">
      <div className="mx-auto flex max-w-container-max items-center justify-between gap-4 px-margin-mobile py-4 md:px-margin-desktop md:py-5">
        <div className="flex items-center gap-3 md:gap-6 lg:gap-10">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm md:h-11 md:w-11">
              <BuyKarloMark className="h-10 w-10 md:h-11 md:w-11" />
            </span>
            <span className="font-display text-2xl font-extrabold tracking-tighter text-primary md:text-3xl">BuyKarlo</span>
          </Link>

          <div className="relative hidden sm:block">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 rounded-full border border-outline-variant/30 bg-surface-container-low px-4 py-2 text-sm font-semibold text-on-surface shadow-sm cursor-pointer hover:bg-surface-container-high transition-colors"
            >
              <MapPin size={16} className="text-primary" />
              <span>{activeCampusShort}</span>
              <ChevronDown size={14} className={cn("text-outline transition-transform duration-200", dropdownOpen && "rotate-180")} />
            </button>

            {dropdownOpen && (
              <div className="absolute top-11 left-0 z-50 w-80 bg-white border border-outline-variant/30 rounded-2xl shadow-xl p-2 flex flex-col space-y-1 animate-in fade-in slide-in-from-top-2 duration-150 glass-panel">
                <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/75">
                  Select Campus Location
                </p>
                <div className="max-h-80 overflow-y-auto space-y-0.5 scrollbar-none">
                  {CAMPUSES.map((c) => (
                    <button
                      key={c.name}
                      disabled={!c.active}
                      onClick={() => handleSelectCampus(c.name)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-body text-xs font-semibold text-left transition-all",
                        !c.active && "opacity-50 cursor-not-allowed text-on-surface-variant/50",
                        c.active && "hover:bg-primary/5 hover:text-primary cursor-pointer text-on-surface",
                        selectedCampus === c.name && c.active && "bg-primary/10 text-primary dark:bg-primary-container/20"
                      )}
                    >
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="truncate">{c.name}</span>
                        {!c.active && <span className="text-[9px] font-bold text-outline-variant tracking-wider uppercase mt-0.5">Coming Soon</span>}
                      </div>
                      {selectedCampus === c.name && c.active && (
                        <Check size={14} className="text-primary shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <nav className="hidden items-center gap-6 lg:flex">
          {BUYER_CATEGORIES.map((cat) => (
            <Link
              key={cat.name}
              href={cat.href}
              className="text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary"
            >
              {cat.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 md:gap-3">
          <div className="hidden items-center rounded-full border border-outline-variant/30 bg-surface-container p-1 lg:flex">
            <Link
              href="/"
              className={cn(
                "rounded-full px-4 py-2 text-sm font-bold transition-colors",
                marketplaceMode === "buy" ? "action-gradient text-white" : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              Buy
            </Link>
            <Link
              href="/?mode=sell"
              className={cn(
                "rounded-full px-4 py-2 text-sm font-bold transition-colors",
                marketplaceMode === "sell" ? "bg-[var(--seller-primary)] text-white" : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              Sell
            </Link>
          </div>

          <label className="hidden min-w-[260px] items-center gap-2 rounded-full border border-outline-variant/30 bg-surface-container-low px-4 py-2.5 lg:flex">
            <Search size={16} className="text-outline" />
            <input
              type="text"
              placeholder="Search campus deals..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-on-surface-variant/70"
            />
          </label>

          <Link href="/messages" className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary">
            <MessageSquare size={20} />
          </Link>
          <Link
            href="/cart"
            className={cn(
              "rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary",
              !isProductDetail && "lg:hidden"
            )}
          >
            <ShoppingCart size={20} />
          </Link>
          <Link href="/profile" className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary">
            <User size={20} />
          </Link>
          <Link href="/dashboard" className="hidden rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary lg:inline-flex">
            <Bell size={20} />
          </Link>
        </div>
      </div>

      {!isProductDetail ? (
        <div className="mx-auto flex max-w-container-max items-center justify-between gap-3 px-margin-mobile pb-4 lg:hidden md:px-margin-desktop">
          <div className="flex items-center rounded-full border border-outline-variant/30 bg-surface-container p-1">
            <Link
              href="/"
              className={cn(
                "rounded-full px-4 py-2 text-sm font-bold transition-colors",
                marketplaceMode === "buy" ? "action-gradient text-white" : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              Buy
            </Link>
            <Link
              href="/?mode=sell"
              className={cn(
                "rounded-full px-4 py-2 text-sm font-bold transition-colors",
                marketplaceMode === "sell" ? "bg-[var(--seller-primary)] text-white" : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              Sell
            </Link>
          </div>

          <Link
            href={marketplaceMode === "sell" ? "/dashboard" : "/cart"}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold shadow-sm",
              marketplaceMode === "sell"
                ? "bg-[var(--seller-primary)] text-white"
                : "border border-outline-variant/30 bg-white text-primary"
            )}
          >
            <ShoppingBag size={16} />
            {marketplaceMode === "sell" ? "Seller Hub" : "Cart"}
          </Link>
        </div>
      ) : null}
    </header>
  )
}
