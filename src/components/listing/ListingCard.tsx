import Image from "next/image"
import Link from "next/link"
import { ConditionBadge, type Condition } from "@/components/shared/ConditionBadge"

interface ListingCardProps {
  id: string
  title: string
  price: number
  condition: Condition
  imageUrl?: string
  sellerDepartment?: string
}

export function ListingCard({ id, title, price, condition, imageUrl, sellerDepartment }: ListingCardProps) {
  return (
    <Link 
      href={`/item/${id}`} 
      className="group flex flex-col bg-surface border border-border rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-[2px] transition-all duration-[220ms] ease-out overflow-hidden cursor-pointer h-full"
    >
      <div className="relative w-full aspect-[4/3] bg-background overflow-hidden">
        {imageUrl ? (
          <Image 
            src={imageUrl} 
            alt={title} 
            fill 
            className="object-cover transition-transform duration-[400ms] group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-text-muted bg-surface-raised text-sm font-medium">
            No image
          </div>
        )}
        <div className="absolute top-3 right-3 z-10">
          <ConditionBadge condition={condition} />
        </div>
      </div>
      
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-body font-medium text-base text-text-primary line-clamp-2 leading-snug">
          {title}
        </h3>
        
        <div className="mt-auto pt-4 flex items-end justify-between">
          <span className="font-display font-bold text-xl text-primary tracking-tight">
            ₹{price.toLocaleString('en-IN')}
          </span>
          {sellerDepartment && (
            <span className="text-[10px] text-text-muted uppercase tracking-wider font-bold">
              {sellerDepartment}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
