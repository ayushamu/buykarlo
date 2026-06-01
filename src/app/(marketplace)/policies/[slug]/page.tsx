import fs from "fs"
import path from "path"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ShieldCheck, BookOpen, User, Scale, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface PageProps {
  params: Promise<{ slug: string }>
}

export const dynamicParams = false

export async function generateStaticParams() {
  return POLICIES.map((p) => ({
    slug: p.slug,
  }))
}

const POLICIES = [
  { slug: "terms-of-use", title: "Terms of Use", icon: Scale },
  { slug: "privacy-policy", title: "Privacy Policy", icon: BookOpen },
  { slug: "safety-guidelines", title: "Safety Guidelines", icon: ShieldCheck },
  { slug: "seller-guidelines", title: "Seller Guidelines", icon: ShieldCheck },
  { slug: "prohibited-products-policy", title: "Prohibited Products", icon: ShieldCheck },
  { slug: "ai-listing-content-policy", title: "AI Listing & Content", icon: BookOpen },
  { slug: "community-guidelines", title: "Community Guidelines", icon: User },
  { slug: "ip-takedown-policy", title: "IP & Takedown Policy", icon: Scale },
  { slug: "grievance-redressal-policy", title: "Grievance Redressal", icon: Scale },
]

// Custom inline style markdown parser
function parseInlineMarkdown(text: string): React.ReactNode {
  const regex = /(\*\*.*?\*\*|\[.*?\]\(.*?\))/g
  const parts = text.split(regex)

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-extrabold text-on-surface">
          {part.slice(2, -2)}
        </strong>
      )
    }
    const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/)
    if (linkMatch) {
      return (
        <a
          key={index}
          href={linkMatch[2]}
          className="text-primary hover:underline font-bold"
          target={linkMatch[2].startsWith("http") ? "_blank" : undefined}
          rel={linkMatch[2].startsWith("http") ? "noopener noreferrer" : undefined}
        >
          {linkMatch[1]}
        </a>
      )
    }
    return part
  })
}

// Custom block style markdown parser to render raw md files as JSX elements
function parseMarkdownToJSX(markdown: string): React.ReactNode {
  const lines = markdown.split("\n")
  const elements: React.ReactNode[] = []
  let inList = false
  let listItems: React.ReactNode[] = []

  const flushList = (keyIndex: number) => {
    if (inList && listItems.length > 0) {
      elements.push(
        <ul key={`list-${keyIndex}`} className="list-disc pl-6 space-y-2 mb-6 text-on-surface-variant/90 font-medium">
          {listItems}
        </ul>
      )
      listItems = []
      inList = false
    }
  }

  lines.forEach((line, index) => {
    const trimmed = line.trim()

    // Check horizontal rules
    if (trimmed.startsWith("---")) {
      flushList(index)
      elements.push(<hr key={index} className="my-8 border-outline-variant/20" />)
      return
    }

    // Check headings
    if (trimmed.startsWith("# ")) {
      flushList(index)
      elements.push(
        <h1 key={index} className="font-display text-4xl font-extrabold tracking-tight text-on-surface mt-8 mb-5 first:mt-0">
          {parseInlineMarkdown(trimmed.slice(2))}
        </h1>
      )
      return
    }
    if (trimmed.startsWith("## ")) {
      flushList(index)
      elements.push(
        <h2 key={index} className="font-display text-2xl font-extrabold tracking-tight text-on-surface mt-8 mb-4">
          {parseInlineMarkdown(trimmed.slice(3))}
        </h2>
      )
      return
    }
    if (trimmed.startsWith("### ")) {
      flushList(index)
      elements.push(
        <h3 key={index} className="font-display text-lg font-bold text-on-surface mt-6 mb-2">
          {parseInlineMarkdown(trimmed.slice(4))}
        </h3>
      )
      return
    }

    // Check list items
    if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
      inList = true
      listItems.push(
        <li key={index} className="leading-relaxed">
          {parseInlineMarkdown(trimmed.slice(2))}
        </li>
      )
      return
    }

    // Check empty lines
    if (trimmed === "") {
      flushList(index)
      return
    }

    // Standard paragraph
    flushList(index)
    elements.push(
      <p key={index} className="text-base leading-7 text-on-surface-variant/95 font-medium mb-5 last:mb-0">
        {parseInlineMarkdown(trimmed)}
      </p>
    )
  })

  flushList(lines.length)

  return <div className="prose max-w-none dark:prose-invert">{elements}</div>
}

export default async function PolicyPage({ params }: PageProps) {
  const { slug } = await params

  // Verify slug exists
  const activePolicy = POLICIES.find((p) => p.slug === slug)
  if (!activePolicy) {
    notFound()
  }

  // Load and parse markdown policy file from filesystem
  let contentHtml: React.ReactNode = null
  try {
    const filePath = path.join(process.cwd(), "src", "content", "policy", `${slug}.md`)
    const rawContent = fs.readFileSync(filePath, "utf-8")
    contentHtml = parseMarkdownToJSX(rawContent)
  } catch (error) {
    console.error("Failed to load policy file:", error)
    notFound()
  }

  return (
    <div className="max-w-6xl mx-auto py-4 md:py-8 animate-in fade-in duration-300">
      {/* Title Header Banner */}
      <div className="relative isolate overflow-hidden bg-white/60 border border-outline-variant/10 rounded-[2rem] p-6 md:p-8 shadow-sm mb-8">
        <div className="absolute inset-y-0 right-0 w-[40%] rounded-bl-[4rem] bg-primary/5 -z-10 hidden md:block" />
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-bold text-primary mb-3">
          Campus Policy Center
        </span>
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-on-surface">
          BuyKarlo Trading Guidelines
        </h1>
        <p className="mt-2 text-sm md:text-base text-on-surface-variant font-medium max-w-2xl leading-relaxed">
          Read safety parameters, transaction policies, and terms of service that protect Aligarh Muslim University (AMU) students during campus trades.
        </p>
      </div>

      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        {/* Responsive Sticky Sidebar */}
        <aside className="w-full shrink-0 md:w-64 lg:w-72 md:sticky md:top-28 z-20">
          <div className="flex flex-row gap-2 overflow-x-auto pb-4 scrollbar-none md:flex-col md:overflow-x-visible md:pb-0 md:bg-white/60 md:border md:border-outline-variant/10 md:rounded-[2rem] md:p-4 md:shadow-sm">
            <p className="hidden md:block px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 mb-2">
              Available Policies
            </p>
            {POLICIES.map((p) => {
              const Icon = p.icon
              const isActive = p.slug === slug
              return (
                <Link
                  key={p.slug}
                  href={`/policies/${p.slug}`}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-full text-sm font-bold transition-all whitespace-nowrap cursor-pointer",
                    isActive
                      ? "bg-primary text-white shadow-[0_10px_20px_rgba(28,22,207,0.18)]"
                      : "bg-white border border-outline-variant/10 text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface md:bg-transparent md:border-none"
                  )}
                >
                  <Icon size={16} className={cn("shrink-0", isActive ? "text-white" : "text-primary")} />
                  <span>{p.title}</span>
                </Link>
              )
            })}
          </div>
        </aside>

        {/* Content Panel */}
        <article className="flex-1 min-w-0 bg-white/70 border border-outline-variant/10 rounded-[2rem] p-6 md:p-10 shadow-sm relative backdrop-blur-xl">
          {contentHtml}

          {/* Dynamic Footer Action inside policy */}
          <div className="mt-12 pt-8 border-t border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-on-surface">Have any questions about safety or terms?</p>
              <p className="text-xs text-on-surface-variant font-medium mt-0.5">Reach out to BuyKarlo moderating staff for guidance.</p>
            </div>
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary/10 hover:bg-primary/15 px-5 text-sm font-bold text-primary transition-colors whitespace-nowrap"
            >
              <span>Back to Marketplace</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </article>
      </div>
    </div>
  )
}
