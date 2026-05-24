import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || url === "your-supabase-project-url" || !url.startsWith("http")) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is missing or invalid. Please configure your actual Supabase Project URL (e.g. https://xxxx.supabase.co) in your local .env file or Vercel settings."
    )
  }

  if (!anonKey || anonKey === "your-supabase-anon-key") {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or invalid. Please configure your actual Supabase Anon Key in your local .env file or Vercel settings."
    )
  }

  const cookieStore = await cookies()

  return createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
