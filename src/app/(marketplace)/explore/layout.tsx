import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Explore Deals & Gear | BuyKarlo AMU",
  description: "Browse the latest student deals at Aligarh Muslim University (AMU). Search second-hand books, laptops, cycles, dorm room decor, and more.",
  alternates: {
    canonical: "https://www.buykarlo.in/explore",
  },
}

export default function ExploreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
