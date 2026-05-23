import Link from "next/link"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-surface/80 backdrop-blur-[12px]">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1">
          <span className="font-display font-extrabold text-2xl tracking-tight text-primary">
            Buy<span className="text-accent">Karlo</span>
          </span>
        </Link>

        {/* Search - Desktop only */}
        <div className="hidden md:flex flex-1 max-w-md mx-8 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            type="text"
            placeholder="Search campus marketplace..."
            className="rounded-full pl-10 bg-background border-transparent focus-visible:border-accent h-10"
          />
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/browse"
            className="text-base font-semibold text-accent transition-colors duration-[180ms] hover:underline"
          >
            Browse
          </Link>
          <Link
            href="/sell"
            className="inline-flex items-center justify-center rounded-full bg-accent text-white font-semibold px-6 py-2.5 text-base transition-all duration-[180ms] hover:brightness-110 hover:-translate-y-[1px] shadow-sm hover:shadow-accent active:scale-[0.97]"
          >
            Sell Item
          </Link>
        </div>
      </div>
    </header>
  )
}
