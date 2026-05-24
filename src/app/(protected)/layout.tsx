import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppHeader } from "@/components/layouts/AppHeader"
import { MobileNav } from "@/components/layouts/MobileNav"
import { Suspense } from "react"

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, university")
    .eq("id", user.id)
    .maybeSingle()

  return (
    <div className="flex min-h-screen flex-col bg-surface pb-24 md:pb-0">
      <Suspense fallback={<div className="h-20 w-full border-b border-outline-variant/30 bg-surface" />}>
        <AppHeader profile={profile} />
      </Suspense>
      <main className="mx-auto flex-1 w-full max-w-container-max px-4 py-6 md:px-margin-desktop md:py-8">
        {children}
      </main>
      <Suspense fallback={<div className="h-16 w-full border-t border-outline-variant/30 bg-surface" />}>
        <MobileNav />
      </Suspense>
    </div>
  )
}
