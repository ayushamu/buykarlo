"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Compass, Plus, MessageCircle, User } from "lucide-react"
import { cn } from "@/lib/utils"

export function BottomNav() {
  const pathname = usePathname()

  const tabs = [
    { icon: Home, label: "Home", href: "/" },
    { icon: Compass, label: "Browse", href: "/browse" },
    { icon: Plus, label: "Sell", href: "/sell", isPrimary: true },
    { icon: MessageCircle, label: "Chat", href: "/chat" },
    { icon: User, label: "Profile", href: "/profile" },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-border pb-safe">
      <div className="flex justify-around items-center h-16 px-2">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href
          if (tab.isPrimary) {
            return (
              <Link key={tab.href} href={tab.href} className="flex flex-col items-center justify-center -mt-6">
                <div className="bg-accent text-white p-3 rounded-full shadow-accent active:scale-95 transition-transform duration-180">
                  <tab.icon size={24} />
                </div>
                <span className="text-[10px] mt-1 font-medium text-text-primary">Sell</span>
              </Link>
            )
          }

          return (
            <Link key={tab.href} href={tab.href} className={cn(
              "flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors duration-[180ms]",
              isActive ? "text-primary" : "text-muted-foreground"
            )}>
              <tab.icon size={20} className={isActive ? "fill-primary/10" : ""} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
