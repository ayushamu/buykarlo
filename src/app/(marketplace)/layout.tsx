import { AppHeader } from "@/components/layouts/AppHeader"
import { MobileNav } from "@/components/layouts/MobileNav"
import { Suspense } from "react"

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col pb-24 md:pb-0">
      <Suspense fallback={<div className="h-20 w-full border-b border-outline-variant/30 bg-surface" />}>
        <AppHeader />
      </Suspense>
      <main className="mx-auto flex-1 container px-4 py-8">
        {children}
      </main>
      <footer className="mt-auto hidden border-t bg-surface-container-low md:block">
        <div className="container px-4 py-8 mx-auto">
          <p className="text-center text-sm text-on-surface-variant">
            © {new Date().getFullYear()} BuyKarlo. Student marketplace.
          </p>
        </div>
      </footer>
      <Suspense fallback={<div className="h-16 w-full border-t border-outline-variant/30 bg-surface" />}>
        <MobileNav />
      </Suspense>
    </div>
  )
}
