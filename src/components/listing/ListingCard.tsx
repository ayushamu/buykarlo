"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Heart, ShieldCheck } from "lucide-react"
import { ConditionBadge, type Condition } from "@/components/shared/ConditionBadge"

interface ListingCardProps {
  id: string
  slug?: string
  title: string
  price: number
  condition: Condition
  imageUrl?: string
  sellerDepartment?: string
  priority?: boolean
}

export function ListingCard({ id, slug, title, price, condition, imageUrl, sellerDepartment, priority = false }: ListingCardProps) {
  return (
    <div className="h-full transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.005] active:scale-[0.995]">
      <Link
        href={`/item/${slug || id}`}
        className="group flex h-full flex-col overflow-hidden rounded-3xl border border-outline-variant/15 bg-white dark:bg-surface-container-lowest shadow-[0_8px_30px_rgba(26,38,86,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)] transition-all duration-300 ease-out hover:border-primary/20 hover:shadow-[0_20px_40px_rgba(28,22,207,0.08)] dark:hover:shadow-[0_20px_40px_rgba(0,0,0,0.45)]"
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-container-low dark:bg-surface-container-high">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              priority={priority}
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-surface-container-low dark:bg-surface-container-high text-sm font-medium text-on-surface-variant">
              No image
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/8 via-transparent to-transparent opacity-80 pointer-events-none" />
          
          <div className="absolute left-3.5 top-3.5 z-10 hover:scale-105 transition-transform duration-200">
            <ConditionBadge condition={condition} />
          </div>
          
          <button
            type="button"
            className="absolute right-3.5 top-3.5 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 dark:border-white/10 bg-white/75 dark:bg-black/45 text-on-surface-variant dark:text-white/80 shadow-sm backdrop-blur-[6px] hover:text-red-500 hover:bg-white dark:hover:bg-black hover:scale-110 active:scale-90 transition-all duration-300 cursor-pointer"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
          >
            <Heart size={16} />
          </button>
        </div>

        <div className="flex flex-1 flex-col p-4">
          <div className="flex items-center justify-between gap-2">
            {sellerDepartment ? (
              <span className="truncate text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70 dark:text-on-surface-variant/90 max-w-[60%]">
                {sellerDepartment}
              </span>
            ) : <span />}
            <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full border border-verified/15 bg-verified/5 dark:bg-verified/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-verified">
              <ShieldCheck size={11} className="shrink-0" />
              Verified
            </span>
          </div>

          <h3 className="mt-2.5 line-clamp-2 text-sm font-semibold leading-tight text-on-surface dark:text-white transition-colors duration-200 group-hover:text-primary dark:group-hover:text-primary-container min-h-[2.5rem]">
            {title}
          </h3>

          <div className="mt-auto flex items-center justify-between border-t border-outline-variant/10 dark:border-border/10 pt-3.5">
            <span className="font-display text-[1.25rem] font-extrabold tracking-tight text-on-surface dark:text-white">
              ₹{price.toLocaleString("en-IN")}
            </span>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/5 dark:bg-primary/10 text-primary dark:text-primary-container transition-all duration-300 group-hover:bg-primary group-hover:text-white dark:group-hover:bg-primary dark:group-hover:text-black group-hover:scale-105 active:scale-95">
              <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-0.5" />
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}

