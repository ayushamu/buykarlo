import { getAdminOverviewStats } from "@/features/admin/actions"
import { ShieldCheck, Package, Users, AlertTriangle, Layers } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminOverviewPage() {
  const res = await getAdminOverviewStats()

  if (res.error) {
    return (
      <div className="p-6 bg-red-50 text-red-700 rounded-[1.5rem] border border-red-200 font-body text-sm font-semibold text-left">
        {res.error}
      </div>
    )
  }

  const stats = res.stats || { totalListings: 0, activeListings: 0, totalUsers: 0, pendingReports: 0 }
  const categories = res.categoryDistribution || []

  const statsCards = [
    { name: "Total Platform Users", value: stats.totalUsers, icon: Users, color: "text-blue-600 bg-blue-50 border-blue-100" },
    { name: "Total Listings Created", value: stats.totalListings, icon: Package, color: "text-indigo-600 bg-indigo-50 border-indigo-100" },
    { name: "Active Shop Items", value: stats.activeListings, icon: ShieldCheck, color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
    { name: "Pending User Reports", value: stats.pendingReports, icon: AlertTriangle, color: stats.pendingReports > 0 ? "text-rose-600 bg-rose-50 border-rose-100 animate-pulse" : "text-slate-500 bg-slate-50 border-slate-100" },
  ]

  return (
    <div className="flex flex-col gap-8 text-left">
      {/* Welcome banner */}
      <div className="bg-slate-900 text-white rounded-[2rem] p-8 md:p-10 relative overflow-hidden shadow-md">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl -mr-40 -mt-40"></div>
        <h2 className="font-display text-3xl font-extrabold mb-2 relative z-10">Campus Workspace Moderator</h2>
        <p className="font-body text-slate-300 text-sm max-w-lg relative z-10 leading-relaxed">
          Welcome to the BuyKarlo management panel. Review reports, manage student item flags, and monitor campus scoping distributions.
        </p>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.name} className="bg-white border border-outline-variant/20 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-body text-xs text-on-surface-variant/80 font-bold uppercase tracking-wider mb-2">
                  {card.name}
                </span>
                <span className="font-display text-4xl font-extrabold text-slate-800 tracking-tight">
                  {card.value}
                </span>
              </div>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shrink-0 ${card.color}`}>
                <Icon size={24} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Category distribution */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Layers size={18} className="text-primary" />
          <h3 className="font-display text-xl font-extrabold text-slate-800">
            Marketplace Category Distribution
          </h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {categories.map((cat) => (
            <div key={cat.slug} className="bg-white border border-outline-variant/15 rounded-3xl p-5 shadow-sm hover:-translate-y-0.5 transition-transform flex flex-col items-center text-center">
              <span className="font-body text-xs font-semibold text-on-surface-variant truncate max-w-full mb-1">
                {cat.name}
              </span>
              <span className="font-display text-xl font-extrabold text-primary">
                {cat.count}
              </span>
              <span className="text-[10px] text-on-surface-variant/60 font-body mt-0.5">
                items active
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
