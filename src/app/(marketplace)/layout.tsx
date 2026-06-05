import { AppHeader } from "@/components/layouts/AppHeader"
import { MobileNav } from "@/components/layouts/MobileNav"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Suspense } from "react"

// Inline SVG social icons because lucide-react brand icons are not present in this version
const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
)

const LinkedinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
)

const YoutubeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17z" />
    <polygon points="10 15 15 12 10 9" />
  </svg>
)

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
      <footer className="mt-auto border-t border-outline-variant/20 bg-surface-container-low py-10">
        <div className="container px-4 mx-auto flex flex-col items-center gap-6 md:flex-row md:justify-between">
          <div className="flex flex-col items-center md:items-start gap-1">
            <p className="text-sm font-semibold text-on-surface-variant/80 text-center md:text-left">
              © {new Date().getFullYear()} BuyKarlo · Verified Student-only P2P Marketplace
            </p>
            <p className="text-xs text-on-surface-variant/60 text-center md:text-left">
              Developed by{" "}
              <a
                href="https://www.linkedin.com/in/ayush-gupta-amu/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-primary hover:underline transition-all"
              >
                Ayush Gupta
              </a>
            </p>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://www.instagram.com/buykarlo.official/"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-white border border-outline-variant/20 p-2 text-on-surface-variant hover:text-white hover:bg-gradient-to-tr hover:from-amber-500 hover:via-red-500 hover:to-purple-600 transition-all duration-300 hover:scale-110 active:scale-95 shadow-sm"
              title="Instagram"
            >
              <InstagramIcon width={18} height={18} />
            </a>
            <a
              href="https://www.linkedin.com/company/buykarlo-india/about/?viewAsMember=true"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-white border border-outline-variant/20 p-2 text-on-surface-variant hover:text-white hover:bg-[#0077b5] transition-all duration-300 hover:scale-110 active:scale-95 shadow-sm"
              title="LinkedIn"
            >
              <LinkedinIcon width={18} height={18} />
            </a>
            <a
              href="https://www.youtube.com/@official.buykarlo"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-white border border-outline-variant/20 p-2 text-on-surface-variant hover:text-white hover:bg-[#ff0000] transition-all duration-300 hover:scale-110 active:scale-95 shadow-sm"
              title="YouTube"
            >
              <YoutubeIcon width={18} height={18} />
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-end gap-x-6 gap-y-2 text-xs font-bold text-on-surface-variant/80">
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
