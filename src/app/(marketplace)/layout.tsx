import { Navbar } from "@/components/layouts/Navbar"
import { BottomNav } from "@/components/layouts/BottomNav"

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col pb-16 md:pb-0">
      <Navbar />
      <main className="flex-1 container px-4 py-8 mx-auto">
        {children}
      </main>
      <footer className="border-t bg-surface-raised hidden md:block mt-auto">
        <div className="container px-4 py-8 mx-auto">
          <p className="text-center text-sm text-text-muted">
            © {new Date().getFullYear()} BuyKarlo. Student marketplace.
          </p>
        </div>
      </footer>
      <BottomNav />
    </div>
  )
}
