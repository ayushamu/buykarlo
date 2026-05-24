"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { Compass, Home, MessageSquare, Package, Plus, ShieldCheck, User } from "lucide-react"
import { cn } from "@/lib/utils"

const sellerTabs = [
  { label: "Listings", href: "/dashboard/listings", icon: Package, match: (pathname: string) => pathname === "/dashboard" || pathname.startsWith("/dashboard/listings") },
  { label: "Messages", href: "/messages", icon: MessageSquare, match: (pathname: string) => pathname.startsWith("/messages") },
  { label: "Profile", href: "/dashboard/trust", icon: User, match: (pathname: string) => pathname.startsWith("/dashboard/trust") || pathname.startsWith("/profile") },
]

const buyerTabs = [
  { label: "Home", href: "/?mode=buy", icon: Home, match: (pathname: string, mode: string) => pathname === "/" && mode === "buy" },
  { label: "Explore", href: "/explore", icon: Compass, match: (pathname: string) => pathname.startsWith("/explore") },
  { label: "Inbox", href: "/messages", icon: MessageSquare, match: (pathname: string) => pathname.startsWith("/messages") },
  { label: "Profile", href: "/profile", icon: User, match: (pathname: string) => pathname.startsWith("/profile") },
]

export function MobileNav() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const mode = searchParams.get("mode") === "sell" ? "sell" : "buy"
  const isSellerWorkspace =
    pathname.startsWith("/dashboard") || pathname.startsWith("/sell") || (pathname === "/" && mode === "sell")

  if (isSellerWorkspace) {
    return (
      <>
        <Link
          href="/sell"
          className="fixed bottom-24 right-4 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--seller-primary)] text-white shadow-[0_18px_36px_rgba(31,157,119,0.35)] lg:hidden"
          aria-label="Create listing"
        >
          <Plus size={28} />
        </Link>

        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--seller-border)] bg-white/95 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 backdrop-blur-xl lg:hidden">
          <div className="grid grid-cols-3 gap-2">
            {sellerTabs.map((tab) => {
              const Icon = tab.icon
              const isActive = tab.match(pathname)

              return (
                <Link
                  key={tab.label}
                  href={tab.href}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2.5 text-xs font-semibold transition-colors",
                    isActive ? "bg-[var(--seller-surface)] text-[var(--seller-primary-strong)]" : "text-[var(--seller-text-soft)]"
                  )}
                >
                  <Icon size={20} />
                  <span>{tab.label}</span>
                </Link>
              )
            })}
          </div>
        </nav>
      </>
    )
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-outline-variant/30 bg-surface/95 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 backdrop-blur-xl lg:hidden">
      <div className="grid grid-cols-4 gap-2">
        {buyerTabs.map((tab) => {
          const Icon = tab.icon
          const isActive = tab.match(pathname, mode)

          return (
            <Link
              key={tab.label}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2.5 text-xs font-semibold transition-colors",
                isActive ? "bg-primary/10 text-primary" : "text-on-surface-variant/80"
              )}
            >
              <Icon size={20} />
              <span>{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
