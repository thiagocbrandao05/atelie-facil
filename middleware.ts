import { updateSession } from '@/lib/supabase/middleware'
import { type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = await updateSession(request)
  const isProd = process.env.NODE_ENV === 'production'
  const scriptSrc = isProd
    ? "script-src 'self' 'unsafe-inline' https://js.sentry-cdn.com https://cdn.jsdelivr.net;"
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.sentry-cdn.com https://cdn.jsdelivr.net;"

  // =====================================================
  // SECURITY HEADERS (Phase 6 - Security Hardening)
  // =====================================================

  // Content Security Policy (CSP) - Prevents XSS attacks
  const cspHeader = `
    default-src 'self';
    ${scriptSrc}
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https: blob:;
    font-src 'self' data:;
    connect-src 'self' https://*.supabase.co wss://*.supabase.co https://sentry.io https://api.stripe.com;
    media-src 'self' blob:;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `
    .replace(/\s{2,}/g, ' ')
    .trim()

  response.headers.set('Content-Security-Policy', cspHeader)

  // Prevent clickjacking attacks
  response.headers.set('X-Frame-Options', 'DENY')

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // Referrer policy for privacy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Permissions policy to restrict browser features
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')

  // XSS Protection (legacy but still useful)
  response.headers.set('X-XSS-Protection', '1; mode=block')

  // Strict Transport Security (HSTS) - Force HTTPS
  // Only enable in production with HTTPS
  if (isProd) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
