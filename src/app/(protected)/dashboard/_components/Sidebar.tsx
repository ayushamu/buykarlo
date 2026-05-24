"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  ShieldCheck, 
  User,
  LogOut,
  Plus
} from "lucide-react"

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  
  // React-based responsiveness to guarantee rendering on desktop
  const [isMobile, setIsMobile] = useState(true)

  useEffect(() => {
    // Check initial width
    setIsMobile(window.innerWidth < 768)
    
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      active: pathname === "/dashboard"
    },
    {
      name: "My Listings",
      href: "/dashboard/listings",
      icon: Package,
      active: pathname.startsWith("/dashboard/listings")
    },
    {
      name: "Orders",
      href: "/dashboard/orders",
      icon: ShoppingBag,
      active: pathname.startsWith("/dashboard/orders")
    },
    {
      name: "Trust Score",
      href: "/dashboard/trust",
      icon: ShieldCheck,
      active: pathname.startsWith("/dashboard/trust")
    },
    {
      name: "Edit Profile",
      href: "/profile",
      icon: User,
      active: pathname === "/profile"
    }
  ]

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push("/login")
      router.refresh()
    } catch (err) {
      console.error("Sign out error:", err)
    }
  }

  // Hide component on mobile viewports
  if (isMobile) {
    return null
  }

  return (
    <aside className="flex flex-col w-64 sticky top-24 h-[calc(100vh-112px)] pr-6 py-2 space-y-2 border-r border-outline-variant/20 bg-background z-20 shrink-0">
      {/* Navigation Links */}
      <div className="flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-body text-label-lg font-semibold transition-all duration-200 select-none ${
                item.active
                  ? "bg-primary/10 text-primary dark:bg-primary-container dark:text-primary-foreground shadow-[0px_4px_12px_rgba(28,22,207,0.03)] border-l-4 border-primary"
                  : "text-on-surface-variant/80 hover:bg-surface-container hover:text-primary"
              }`}
            >
              <Icon size={20} className={item.active ? "text-primary dark:text-primary-foreground" : "text-on-surface-variant/60 group-hover:text-primary"} />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </div>

      {/* Footer / Quick Actions */}
      <div className="pt-4 border-t border-outline-variant/10 space-y-2">
        <Link
          href="/sell"
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 action-gradient text-white rounded-full font-body text-label-lg font-bold shadow-md hover:scale-[1.02] active:scale-[0.98] transition-transform"
        >
          <Plus size={16} />
          Create Listing
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-body text-label-lg font-semibold text-error hover:bg-error/5 transition-all text-left cursor-pointer"
        >
          <LogOut size={20} className="text-error" />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  )
}
