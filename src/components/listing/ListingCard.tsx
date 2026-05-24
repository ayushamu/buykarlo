import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Heart } from "lucide-react"
import { ConditionBadge, type Condition } from "@/components/shared/ConditionBadge"

interface ListingCardProps {
  id: string
  slug?: string
  title: string
  price: number
  condition: Condition
  imageUrl?: string
  sellerDepartment?: string
}

export function ListingCard({ id, slug, title, price, condition, imageUrl, sellerDepartment }: ListingCardProps) {
  return (
    <Link 
      href={`/item/${slug || id}`} 
      className="group flex h-full flex-col overflow-hidden rounded-[2rem] border border-outline-variant/20 bg-white shadow-[0_14px_32px_rgba(26,38,86,0.06)] transition-all duration-[220ms] ease-out hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(26,38,86,0.12)]"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-container-low">
        {imageUrl ? (
          <Image 
            src={imageUrl} 
            alt={title} 
            fill 
            className="object-cover transition-transform duration-[400ms] group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-container-low text-sm font-medium text-on-surface-variant">
            No image
          </div>
        )}
        <div className="absolute left-4 top-4 z-10">
          <ConditionBadge condition={condition} />
        </div>
        <div className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/80 bg-white/90 text-on-surface-variant shadow-sm backdrop-blur">
          <Heart size={18} />
        </div>
      </div>
      
      <div className="flex flex-1 flex-col p-5">
        {sellerDepartment ? (
          <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-primary/90">
            {sellerDepartment}
          </p>
        ) : null}

        <h3 className="mt-2 line-clamp-2 text-[1.4rem] font-semibold leading-[1.2] text-on-surface transition-colors group-hover:text-primary">
          {title}
        </h3>

        <div className="mt-auto flex items-end justify-between border-t border-outline-variant/12 pt-5">
          <span className="font-display text-[2rem] font-extrabold tracking-tight text-on-surface">
            ₹{price.toLocaleString("en-IN")}
          </span>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
            View Details
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  )
}
