"use client"

import type { ComponentType } from "react"
import { cn } from "@/lib/utils"

export interface MobileCategoryItem {
  id: string
  name: string
  shortName?: string
  icon: ComponentType<{ size?: number; className?: string }>
  tone?: "indigo" | "sky" | "amber" | "emerald" | "rose"
}

interface MobileCategoryStripProps {
  categories: MobileCategoryItem[]
  selectedCategory: string
  onSelectCategory: (categoryId: string) => void
  className?: string
}

const toneStyles = {
  indigo: "bg-indigo-50 text-primary border-indigo-100",
  sky: "bg-sky-50 text-sky-700 border-sky-100",
  amber: "bg-amber-50 text-amber-700 border-amber-100",
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
  rose: "bg-rose-50 text-rose-700 border-rose-100",
}

export function MobileCategoryStrip({
  categories,
  selectedCategory,
  onSelectCategory,
  className,
}: MobileCategoryStripProps) {
  return (
    <div className={cn("w-full min-w-0 max-w-full overflow-hidden select-none", className)}>
      <p className="px-1 font-body text-[11px] font-bold uppercase text-on-surface-variant/80">
        Browse Categories
      </p>
      <div className="mt-3 flex w-full min-w-0 max-w-full gap-4 overflow-x-auto overscroll-x-contain pb-1 scrollbar-none">
        {categories.map((category) => {
          const Icon = category.icon
          const isActive = selectedCategory === category.id
          const tone = toneStyles[category.tone || "indigo"]

          return (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              className="flex w-[76px] shrink-0 flex-col items-center gap-2 text-center"
            >
              <span
                className={cn(
                  "flex size-16 items-center justify-center rounded-full border transition-all duration-150",
                  isActive
                    ? "border-primary bg-primary text-white shadow-md shadow-primary/20 ring-4 ring-primary/10"
                    : tone
                )}
              >
                <Icon size={26} />
              </span>
              <span className={cn("truncate text-[11px] font-bold leading-tight", isActive ? "text-primary" : "text-on-surface-variant")}>
                {category.shortName || category.name}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
