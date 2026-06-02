import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { OneSignalProvider } from "@/components/providers/OneSignalProvider";

const siteUrl = "https://buykarlo.in";


const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "BuyKarlo | AMU Student Marketplace",
    template: "%s | BuyKarlo",
  },
  description:
    "Buy and sell books, electronics, cycles, and hostel essentials with verified students at Aligarh Muslim University. Campus-first deals, direct chat, and safer local meetups.",
  keywords: [
    "BuyKarlo",
    "AMU marketplace",
    "Aligarh Muslim University marketplace",
    "student marketplace",
    "campus deals",
    "used books AMU",
    "student electronics",
    "second hand cycles",
    "hostel essentials",
    "reselling",
    "reselling business",
    "reselling app",
    "online reselling",
    "best reselling app",
    "what is reselling",
    "reselling app in india",
    "reselling website",
    "AMU buy and sell",
    "second hand cycles in Aligarh",
    "Sir Syed Hall deals",
    "used textbooks Aligarh Muslim University",
    "AMU exam notes",
  ],
  applicationName: "BuyKarlo",
  creator: "BuyKarlo",
  publisher: "BuyKarlo",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-icon.png", type: "image/png", sizes: "180x180" }],
  },
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: "BuyKarlo | AMU Student Marketplace",
    description:
      "Discover student-listed books, electronics, cycles, and hostel essentials around AMU. Buy, sell, chat, and close campus deals with verified students.",
    url: siteUrl,
    siteName: "BuyKarlo",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/illustrations/buykarlo-campus-trust.png",
        width: 1024,
        height: 559,
        alt: "BuyKarlo trusted student marketplace for campus deals",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BuyKarlo | AMU Student Marketplace",
    description:
      "Buy and sell trusted campus deals with verified students at Aligarh Muslim University.",
    images: ["/illustrations/buykarlo-campus-trust.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <OneSignalProvider>
          {children}
        </OneSignalProvider>
      </body>
    </html>
  );
}
