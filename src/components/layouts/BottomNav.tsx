"use client"

import Link from "next/link"
import { useSearchParams, usePathname } from "next/navigation"
import { Home, Compass, Plus, MessageSquare, User } from "lucide-react"
import { cn } from "@/lib/utils"

export function BottomNav() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const mode = searchParams.get("mode") || "buy"

  const tabs = [
    { icon: Home, label: "Home", href: "/?mode=buy", checkActive: () => pathname === "/" && mode === "buy" },
    { icon: Compass, label: "Explore", href: "/explore", checkActive: () => pathname === "/explore" },
    { icon: Plus, label: "Sell", href: "/?mode=sell", isPrimary: true, checkActive: () => mode === "sell" },
    { icon: MessageSquare, label: "Messages", href: "/messages", checkActive: () => pathname === "/messages" },
    { icon: User, label: "Profile", href: "/profile", checkActive: () => pathname === "/profile" },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-xl border-t border-outline-variant/30 pb-safe">
      <div className="flex justify-around items-center h-16 px-2">
        {tabs.map((tab, idx) => {
          const isActive = tab.checkActive()
          
          if (tab.isPrimary) {
            return (
              <Link 
                key={idx} 
                href={tab.href} 
                className="flex flex-col items-center justify-center -mt-8 cursor-pointer select-none"
              >
                <div className={cn(
                  "p-3.5 rounded-full shadow-lg active:scale-95 transition-transform duration-150",
                  isActive ? "bg-primary text-white" : "action-gradient text-white"
                )}>
                  <tab.icon size={26} />
                </div>
                <span className="text-[10px] mt-1.5 font-semibold text-primary">Sell</span>
              </Link>
            )
          }

          return (
            <Link 
              key={idx} 
              href={tab.href} 
              className={cn(
                "flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors duration-[180ms] cursor-pointer",
                isActive ? "text-primary font-bold" : "text-on-surface-variant/70"
              )}
            >
              <tab.icon size={20} className={isActive ? "stroke-[2.5px]" : "stroke-[2px]"} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
