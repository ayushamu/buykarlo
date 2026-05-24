import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || url === "your-supabase-project-url" || !url.startsWith("http") || !anonKey) {
    return supabaseResponse
  }

  const supabase = createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const protectedPaths = ['/sell', '/messages', '/profile', '/dashboard']
  const isProtected = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))

  const isOnboarding = request.nextUrl.pathname.startsWith('/onboarding')
  const isAuthPage = ['/login', '/register', '/forgot-password'].some(path => request.nextUrl.pathname.startsWith(path))
  const isApi = request.nextUrl.pathname.startsWith('/api')

  // Enforce login for protected paths
  if (!user && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
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
      url.pathname = '/onboarding'
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
