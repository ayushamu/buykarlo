"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useState } from "react"
import { 
  ShoppingCart, 
  MessageSquare, 
  User, 
  ChevronDown, 
  MapPin 
} from "lucide-react"

export function Navbar() {
  const searchParams = useSearchParams()
  const mode = searchParams.get("mode") || "buy"
  
  const [campus, setCampus] = useState("Aligarh Muslim University")
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const campuses = [
    "Aligarh Muslim University",
    "IIT Delhi (Coming Soon)",
    "BITS Pilani (Coming Soon)"
  ]

  const categories = [
    { name: "Electronics", href: "/?category=electronics" },
    { name: "Books", href: "/?category=books" },
    { name: "Cycles", href: "/?category=cycles" },
    { name: "Dorm Decor", href: "/?category=dorm-decor" },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-outline-variant/30 bg-surface/80 backdrop-blur-xl shadow-sm dark:shadow-none h-20 transition-all duration-200">
      <div className="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto h-full">
        
        {/* Left Side: Logo & Campus Selector */}
        <div className="flex items-center gap-4 md:gap-6 lg:gap-10">
          <Link href="/" className="flex items-center">
            <span className="font-display text-display-md font-extrabold tracking-tighter text-primary">
              BuyKarlo
            </span>
          </Link>

          {/* Campus Selector */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-surface-container-low hover:bg-surface-container transition-colors rounded-full font-body text-label-sm text-on-surface border border-outline-variant/30 select-none cursor-pointer"
            >
              <MapPin size={16} className="text-primary" />
              <span className="max-w-[80px] sm:max-w-[120px] md:max-w-none truncate font-semibold">
                {campus === "Aligarh Muslim University" ? "AMU" : campus}
              </span>
              <ChevronDown size={14} className="text-outline" />
            </button>

            {dropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute left-0 mt-2 w-64 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-lg py-2 z-40 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2 text-[11px] font-bold text-outline-variant uppercase tracking-wider">
                    Select Campus
                  </div>
                  {campuses.map((name) => {
                    const isSelectable = !name.includes("Coming Soon")
                    return (
                      <button
                        key={name}
                        disabled={!isSelectable}
                        onClick={() => {
                          if (isSelectable) {
                            setCampus(name)
                            setDropdownOpen(false)
                          }
                        }}
                        className={`w-full text-left px-4 py-2.5 text-body-md transition-colors ${
                          !isSelectable 
                            ? "text-on-surface-variant/40 cursor-not-allowed" 
                            : name === campus
                              ? "bg-primary-fixed text-on-primary-fixed font-semibold"
                              : "text-on-surface hover:bg-surface-container-low cursor-pointer"
                        }`}
                      >
                        {name}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Middle: Category Links (Desktop only) */}
        <nav className="hidden lg:flex items-center gap-8">
          <Link
            href="/dashboard"
            className="font-body text-label-lg text-on-surface-variant font-medium hover:text-primary transition-colors duration-200"
          >
            Dashboard
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.name}
              href={cat.href}
              className="font-body text-label-lg text-on-surface-variant font-medium hover:text-primary transition-colors duration-200"
            >
              {cat.name}
            </Link>
          ))}
        </nav>

        {/* Right Side: Mode Toggle & Profile Actions */}
        <div className="flex items-center gap-3 md:gap-6">
          
          {/* Buy/Sell Pill Toggle Switch */}
          <div className="relative w-28 md:w-36 h-9 md:h-10 bg-surface-container border border-outline-variant/30 rounded-full p-1 flex items-center font-body text-label-sm font-bold select-none">
            {/* Sliding Thumb */}
            <div className={`absolute top-1 bottom-1 w-[50px] md:w-[66px] bg-primary rounded-full transition-all duration-200 ease-out shadow-sm ${
              mode === "sell" ? "left-[53px] md:left-[73px]" : "left-1"
            }`} />
            
            {/* Buy Option */}
            <Link 
              href="/?mode=buy" 
              className={`flex-1 text-center z-10 py-1 transition-colors duration-200 text-xs md:text-sm cursor-pointer ${
                mode !== "sell" ? "text-white" : "text-on-surface-variant/80 hover:text-on-surface"
              }`}
            >
              Buy
            </Link>
            
            {/* Sell Option */}
            <Link 
              href="/?mode=sell" 
              className={`flex-1 text-center z-10 py-1 transition-colors duration-200 text-xs md:text-sm cursor-pointer ${
                mode === "sell" ? "text-white" : "text-on-surface-variant/80 hover:text-on-surface"
              }`}
            >
              Sell
            </Link>
          </div>

          {/* Action icons */}
          <div className="flex items-center gap-1 md:gap-3 text-on-surface-variant">
            <Link
              href="/cart"
              className="p-2 hover:bg-surface-container rounded-full transition-colors relative"
            >
              <ShoppingCart size={20} />
            </Link>
            
            <Link
              href="/messages"
              className="p-2 hover:bg-surface-container rounded-full transition-colors relative"
            >
              <MessageSquare size={20} />
            </Link>

            <Link
              href="/profile"
              className="p-2 hover:bg-surface-container rounded-full transition-colors"
            >
              <User size={20} />
            </Link>
          </div>
        </div>

      </div>
    </header>
  )
}
