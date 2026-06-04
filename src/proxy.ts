import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Check that Supabase env vars are real (not placeholders)
const isSupabaseConfigured =
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  SUPABASE_URL.startsWith('http') &&
  !SUPABASE_URL.includes('your-supabase')

export async function proxy(request: NextRequest) {
  // If Supabase is not configured yet, allow all requests through
  if (!isSupabaseConfigured) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()

  const protectedPaths = ['/dashboard', '/sell', '/chat', '/profile', '/settings', '/messages', '/admin']
  const isProtected = protectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  )

  const isOnboarding = request.nextUrl.pathname.startsWith('/onboarding')
  const isAuthPage = ['/login', '/register', '/forgot-password'].some(path => request.nextUrl.pathname.startsWith(path))
  const isApi = request.nextUrl.pathname.startsWith('/api')

  if (!user && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Guard admin paths by verifying profiles.is_admin is true
  const isAdminPath = request.nextUrl.pathname.startsWith('/admin')
  if (user && isAdminPath) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile || !profile.is_admin) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  // Enforce onboarding for logged-in users who haven't completed verification
  if (user && !isApi && !isAuthPage && !isOnboarding) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, phone_verified')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile || !profile.full_name || !profile.phone_verified) {
      const url = request.nextUrl.clone()
      const nextParam = request.nextUrl.pathname + request.nextUrl.search
      url.pathname = '/onboarding'
      url.searchParams.set('next', nextParam)
      return NextResponse.redirect(url)
    }
  }

  // If user is already onboarded and attempts to visit onboarding, redirect to home
  if (user && isOnboarding) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, phone_verified')
      .eq('id', user.id)
      .maybeSingle()

    if (profile && profile.full_name && profile.phone_verified) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
