import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 3. Routing Logic
  const url = request.nextUrl.clone()
  const { pathname } = url
  const legacySluggedAppMatch = pathname.match(/^\/[^/]+\/app(?:\/(.*))?$/)
  const legacySluggedOnboardingMatch = pathname.match(/^\/[^/]+\/onboarding(?:\/(.*))?$/)
  const isLegacyDashboard = pathname === '/dashboard' || pathname.startsWith('/dashboard/')
  const isProtectedPath =
    pathname === '/app' ||
    pathname.startsWith('/app/') ||
    pathname.startsWith('/admin') ||
    Boolean(legacySluggedAppMatch) ||
    Boolean(legacySluggedOnboardingMatch) ||
    isLegacyDashboard

  // Public Routes (Marketing, Auth, Public shared links)
  const isPublicRoute =
    pathname === '/' ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/about') ||
    pathname.startsWith('/offline') ||
    pathname.startsWith('/planos') ||
    pathname.startsWith('/orcamento')

  // 3.1. Unauthenticated User
  if (!user) {
    if (!isPublicRoute && isProtectedPath) {
      // If trying to access a protected route, redirect to login
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    // Allow access to public routes
    return supabaseResponse
  }

  // 3.2. Authenticated User
  // Fetch user's tenant slug
  // Fetch user's tenant slug and role
  const { data: dbUser } = await supabase
    .from('User')
    .select('role, tenant:Tenant(slug)')
    .eq('id', user.id)
    .single()

  const userRecord = dbUser as {
    role?: string | null
    tenant?: { slug?: string | null } | null
  } | null
  const userSlug = userRecord?.tenant?.slug
  const userRole = userRecord?.role

  // 3.3. Admin Route Protection
  if (pathname.startsWith('/admin')) {
    if (userRole !== 'SUPER_ADMIN') {
      // Redirect unauthorized users to their dashboard or home
      url.pathname = '/app/dashboard'
      return NextResponse.redirect(url)
    }
    // Allow SUPER_ADMIN to access /admin
    return supabaseResponse
  }

  if (!userSlug) {
    // Edge case: User has no tenant? safely logout or error page
    return supabaseResponse
  }

  // Redirects for root/auth pages to Dashboard
  if (pathname === '/' || pathname.startsWith('/login') || pathname.startsWith('/register')) {
    url.pathname = '/app/dashboard'
    return NextResponse.redirect(url)
  }

  // Canonical dashboard path
  if (pathname === '/app') {
    url.pathname = '/app/dashboard'
    return NextResponse.redirect(url)
  }

  // Legacy redirects: /dashboard/*
  if (isLegacyDashboard) {
    if (pathname === '/dashboard') {
      url.pathname = '/app/dashboard'
    } else {
      const legacySuffix = pathname.replace('/dashboard/', '')
      url.pathname = `/app/${legacySuffix}`
    }
    return NextResponse.redirect(url)
  }

  // Legacy redirects: /:slug/app/*
  if (legacySluggedAppMatch) {
    const legacySuffix = legacySluggedAppMatch[1]
    url.pathname = legacySuffix ? `/app/${legacySuffix}` : '/app/dashboard'
    return NextResponse.redirect(url)
  }

  // Legacy redirects: /:slug/onboarding
  if (legacySluggedOnboardingMatch) {
    const legacySuffix = legacySluggedOnboardingMatch[1]
    url.pathname = legacySuffix ? `/app/onboarding/${legacySuffix}` : '/app/onboarding'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
