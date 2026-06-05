"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  Package, 
  AlertTriangle, 
  Settings, 
  Shield, 
  ShieldCheck,
  ArrowLeft,
  Menu,
  X,
  FolderTree,
  Users
} from "lucide-react"
import { cn } from "@/lib/utils"

const ADMIN_NAV = [
  { name: "Overview", href: "/admin", match: (pathname: string) => pathname === "/admin", icon: LayoutDashboard },
  { name: "Moderation Queue", href: "/admin/listings", match: (pathname: string) => pathname === "/admin/listings", icon: Package },
  { name: "Manage Categories", href: "/admin/categories", match: (pathname: string) => pathname.startsWith("/admin/categories"), icon: FolderTree },
  { name: "Reports & Safety", href: "/admin/reports", match: (pathname: string) => pathname === "/admin/reports", icon: AlertTriangle },
  { name: "ID Verifications", href: "/admin/verifications", match: (pathname: string) => pathname === "/admin/verifications", icon: ShieldCheck },
  { name: "Referral Partners", href: "/admin/partners", match: (pathname: string) => pathname.startsWith("/admin/partners"), icon: Users },
  { name: "System Settings", href: "/admin/settings", match: (pathname: string) => pathname === "/admin/settings", icon: Settings },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const activeTitle = ADMIN_NAV.find((item) => item.match(pathname))?.name ?? "Admin Control Center"

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row md:h-screen md:overflow-hidden">
      {/* 1. SIDEBAR (Desktop - Persistent) */}
      <aside className="hidden md:flex md:h-screen w-64 bg-slate-900 text-white shrink-0 flex-col select-none border-r border-slate-800">
        {/* Header Branding */}
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-md">
            <Shield size={20} />
          </div>
          <div className="text-left">
            <h1 className="font-display font-extrabold text-lg leading-tight">BuyKarlo</h1>
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary font-body">Admin Hub</span>
          </div>
        </div>

        {/* Sidebar Links */}
        <nav className="flex-1 p-4 space-y-1.5 text-left">
          {ADMIN_NAV.map((item) => {
            const isActive = item.match(pathname)
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl font-body text-xs font-semibold transition-all duration-150 cursor-pointer",
                  isActive
                    ? "bg-primary text-white shadow-md"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                )}
              >
                <Icon size={16} />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-800 flex flex-col gap-2">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-body text-xs font-bold rounded-xl border border-slate-700 transition-all text-center cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Switch to Shop</span>
          </Link>
          <div className="text-[10px] text-slate-500 font-body text-center mt-2">
            BuyKarlo • Admin Mode
          </div>
        </div>
      </aside>

      {/* 2. MOBILE HEADER & NAVIGATION DRAWER */}
      <header className="md:hidden h-16 bg-slate-900 text-white flex justify-between items-center px-4 border-b border-slate-800 shrink-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
            <Shield size={16} />
          </div>
          <span className="font-display font-extrabold text-md tracking-tight">Admin Center</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 bg-slate-950/95 z-40 flex flex-col animate-in fade-in slide-in-from-top duration-200">
          <nav className="flex-1 p-6 space-y-2 text-left">
            {ADMIN_NAV.map((item) => {
              const isActive = item.match(pathname)
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-5 py-4 rounded-2xl font-body text-sm font-semibold transition-all cursor-pointer",
                    isActive
                      ? "bg-primary text-white shadow-md"
                      : "text-slate-400 hover:bg-slate-900 hover:text-white"
                  )}
                >
                  <Icon size={18} />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>
          <div className="p-6 border-t border-slate-900 flex flex-col gap-3">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-4 bg-slate-900 text-white font-body text-sm font-bold rounded-2xl border border-slate-800 text-center"
            >
              <ArrowLeft size={16} />
              <span>Switch to Shop</span>
            </Link>
          </div>
        </div>
      )}

      {/* 3. MAIN WORKSPACE */}
      <main className="flex-1 flex flex-col min-w-0 md:h-screen md:overflow-hidden">
        {/* Workspace Topbar (Breadcrumbs / Title) */}
        <header className="hidden md:flex h-16 bg-white border-b border-outline-variant/30 justify-between items-center px-8 shrink-0 z-10 select-none text-left">
          <div className="flex items-center gap-2">
            <span className="font-body text-xs text-on-surface-variant font-medium">Admin /</span>
            <span className="font-body text-xs text-primary font-bold">{activeTitle}</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-100 text-slate-800 px-3 py-1 rounded-full text-xs font-semibold font-body border border-slate-200">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            Superuser Mode
          </div>
        </header>

        {/* Content Pane */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
