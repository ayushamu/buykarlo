import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ListingCard } from "@/components/listing/ListingCard"

const CATEGORIES = ["All", "Books & Notes", "Cycles", "Electronics", "Hostel Items", "Drawing Instruments"]

const DUMMY_LISTINGS = [
  { id: "1", title: "Engineering Drawing Set + Drafter", price: 850, condition: "good" as const, sellerDepartment: "ZHCET" },
  { id: "2", title: "B.Tech 1st Year Physics & Chemistry Textbooks", price: 1200, condition: "like_new" as const, sellerDepartment: "Physics" },
  { id: "3", title: "Hero Sprint 21 Gear Cycle", price: 4500, condition: "fair" as const, sellerDepartment: "SS Hall" },
  { id: "4", title: "Casio fx-991EX Scientific Calculator", price: 950, condition: "new" as const, sellerDepartment: "Maths" },
  { id: "5", title: "Hostel Mattress (Single Bed)", price: 600, condition: "good" as const, sellerDepartment: "VM Hall" },
  { id: "6", title: "BSC Zoology Notes Semester 1-4", price: 300, condition: "fair" as const, sellerDepartment: "Zoology" },
]

export default function HomePage() {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Mobile Search - Sticky */}
      <div className="md:hidden sticky top-[63px] z-40 bg-background/95 backdrop-blur py-3 -mx-4 px-4 border-b border-border">
        <div className="relative w-full shadow-sm rounded-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
          <Input 
            type="text" 
            placeholder="Search for books, cycles..." 
            className="rounded-full pl-12 bg-surface h-12 border-border shadow-none"
          />
        </div>
      </div>

      {/* Category Horizontal Scroll */}
      <div className="flex overflow-x-auto gap-3 pb-2 -mx-4 px-4 md:mx-0 md:px-0" style={{ scrollbarWidth: 'none' }}>
        {CATEGORIES.map((cat, i) => (
          <button 
            key={cat}
            className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-semibold transition-colors shadow-sm ${
              i === 0 
                ? "bg-primary text-primary-foreground border border-transparent" 
                : "bg-surface border border-border text-text-secondary hover:bg-surface-raised"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Hero / Header */}
      <div className="py-2 md:py-6">
        <h2 className="text-3xl font-display font-bold text-primary tracking-tight">
          Fresh on Campus
        </h2>
        <p className="text-text-secondary mt-1 text-lg">What students are selling right now.</p>
      </div>

      {/* Listing Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {DUMMY_LISTINGS.map((listing, i) => (
          <div 
            key={listing.id} 
            className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <ListingCard {...listing} />
          </div>
        ))}
      </div>
      
    </div>
  )
}
