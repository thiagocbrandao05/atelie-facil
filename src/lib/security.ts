import { headers } from 'next/headers'

/**
 * Validates CSRF token by checking origin header
 * Should be called in critical Server Actions
 */
export async function validateCSRF(): Promise<{ valid: boolean; error?: string }> {
  try {
    const headersList = await headers()
    const origin = headersList.get('origin')
    const host = headersList.get('host')

    // Allow same-origin requests
    if (!origin) {
      // No origin header (might be same-origin or direct navigation)
      return { valid: true }
    }

    // Extract hostname from origin
    const originHost = new URL(origin).host

    if (originHost !== host) {
      return {
        valid: false,
        error: 'CSRF validation failed: origin mismatch',
      }
    }

    return { valid: true }
  } catch (error) {
    return {
      valid: false,
      error: 'CSRF validation error',
    }
  }
}

/**
 * Get client IP address for rate limiting
 */
export async function getClientIP(): Promise<string> {
  const headersList = await headers()

  // Try various headers in order of preference
  const ip =
    headersList.get('x-real-ip') ||
    headersList.get('x-forwarded-for')?.split(',')[0] ||
    headersList.get('cf-connecting-ip') || // Cloudflare
    headersList.get('x-client-ip') ||
    'unknown'

  return ip
}

/**
 * Get user agent for logging
 */
export async function getUserAgent(): Promise<string> {
  const headersList = await headers()
  return headersList.get('user-agent') || 'unknown'
}
