import { AppHeader } from "@/components/layouts/AppHeader"
import { MobileNav } from "@/components/layouts/MobileNav"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Suspense } from "react"

export default async function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("full_name, avatar_url, university")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null }

  return (
    <div className="flex min-h-screen flex-col pb-24 md:pb-0">
      <Suspense fallback={<div className="h-[136px] lg:h-20 w-full border-b border-outline-variant/30 bg-surface" />}>
        <AppHeader profile={user ? profile ?? {} : null} />
      </Suspense>
      <main className="w-full min-w-0 flex-1 overflow-x-hidden">
        {children}
      </main>
      <footer className="mt-auto border-t border-outline-variant/20 bg-surface-container-low py-8">
        <div className="container px-4 mx-auto flex flex-col items-center md:flex-row md:justify-between gap-4">
          <p className="text-sm font-semibold text-on-surface-variant/80 text-center md:text-left">
            © {new Date().getFullYear()} BuyKarlo · Verified Student-only P2P Marketplace
          </p>
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-4 md:gap-6 text-sm font-bold text-on-surface-variant/80">
            <Link href="/policies/safety-guidelines" className="hover:text-primary transition-colors">
              Safety Guidelines
            </Link>
            <Link href="/policies/seller-guidelines" className="hover:text-primary transition-colors">
              Seller Guidelines
            </Link>
            <Link href="/policies/terms-of-use" className="hover:text-primary transition-colors">
              Terms of Use
            </Link>
            <Link href="/policies/privacy-policy" className="hover:text-primary transition-colors">
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
      <Suspense fallback={<div className="h-16 w-full border-t border-outline-variant/30 bg-surface" />}>
        <MobileNav />
      </Suspense>
    </div>
  )
}
