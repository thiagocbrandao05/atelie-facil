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

  // Public Routes (Marketing, Auth, Public shared links)
  const isPublicRoute =
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/about') ||
    pathname.startsWith('/offline') ||
    pathname.includes('/s/') // Shared public links: /[slug]/s/...

  // 3.1. Unauthenticated User
  if (!user) {
    if (!isPublicRoute) {
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

  const userSlug = (dbUser as any)?.tenant?.slug
  const userRole = (dbUser as any)?.role

  // 3.3. Admin Route Protection
  if (pathname.startsWith('/admin')) {
    if (userRole !== 'SUPER_ADMIN') {
      // Redirect unauthorized users to their dashboard or home
      url.pathname = userSlug ? `/${userSlug}/app/dashboard` : '/'
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
    url.pathname = `/${userSlug}/app/dashboard`
    return NextResponse.redirect(url)
  }

  // Handle legacy /dashboard redirects
  if (pathname === '/dashboard') {
    url.pathname = `/${userSlug}/app/dashboard`
    return NextResponse.redirect(url)
  }

  if (pathname.startsWith('/dashboard/')) {
    const newPath = pathname.replace('/dashboard/', `/${userSlug}/app/`)
    url.pathname = newPath
    return NextResponse.redirect(url)
  }

  // Validate Tenant Access
  // Regex to capture slug from path: /([^/]+)/app/.*
  const appMatch = pathname.match(/^\/([^/]+)\/app/)
  if (appMatch) {
    const pathSlug = appMatch[1]
    if (pathSlug !== userSlug && userRole !== 'SUPER_ADMIN') {
      // Redirect to correct tenant
      const correctPath = pathname.replace(`/${pathSlug}/`, `/${userSlug}/`)
      url.pathname = correctPath
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
