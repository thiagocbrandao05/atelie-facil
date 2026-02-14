// Hybrid rate limiter:
// - Distributed mode via Upstash REST when env vars are configured.
// - In-memory fallback for local/dev and as graceful degradation.

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN
const HAS_UPSTASH = Boolean(UPSTASH_URL && UPSTASH_TOKEN)
const CLEANUP_TIMER_KEY = '__atelisRateLimitCleanup'

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

function sanitizeIdentifier(identifier: string): string {
  const normalized = identifier.trim().toLowerCase()
  if (!normalized) return 'anonymous'
  return normalized.replace(/[^a-z0-9:_-]/g, '').slice(0, 120) || 'anonymous'
}

function normalizeConfig(config: RateLimitConfig): RateLimitConfig {
  const maxRequests = Math.min(10000, Math.max(1, Number(config.maxRequests) || 1))
  const windowMs = Math.min(24 * 60 * 60 * 1000, Math.max(1000, Number(config.windowMs) || 60000))
  return { maxRequests, windowMs }
}

export async function rateLimit(
  identifier: string,
  config: RateLimitConfig = { maxRequests: 10, windowMs: 60000 }
): Promise<{ success: boolean; remaining: number; resetAt: number }> {
  const safeIdentifier = sanitizeIdentifier(identifier)
  const safeConfig = normalizeConfig(config)

  if (HAS_UPSTASH) {
    const distributed = await rateLimitWithUpstash(safeIdentifier, safeConfig)
    if (distributed) {
      return distributed
    }
  }

  return rateLimitInMemory(safeIdentifier, safeConfig)
}

async function rateLimitWithUpstash(
  identifier: string,
  config: RateLimitConfig
): Promise<{ success: boolean; remaining: number; resetAt: number } | null> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return null

  try {
    const key = `rl:${identifier}`
    const windowSeconds = Math.max(1, Math.ceil(config.windowMs / 1000))

    const response = await fetch(`${UPSTASH_URL}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['INCR', key],
        ['EXPIRE', key, windowSeconds, 'NX'],
        ['PTTL', key],
      ]),
      cache: 'no-store',
    })

    if (!response.ok) return null

    const payload = (await response.json()) as Array<{ result: unknown }>
    const count = Number(payload?.[0]?.result ?? 0)
    const ttl = Number(payload?.[2]?.result ?? config.windowMs)
    const now = Date.now()
    const resetAt = now + Math.max(0, ttl)
    const remaining = Math.max(0, config.maxRequests - count)

    return {
      success: count <= config.maxRequests,
      remaining,
      resetAt,
    }
  } catch {
    return null
  }
}

function rateLimitInMemory(
  identifier: string,
  config: RateLimitConfig
): { success: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const entry = store.get(identifier)

  // Clean up expired entries
  if (entry && entry.resetAt < now) {
    store.delete(identifier)
  }

  const current = store.get(identifier)

  if (!current) {
    // First request in window
    const resetAt = now + config.windowMs
    store.set(identifier, { count: 1, resetAt })
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetAt,
    }
  }

  if (current.count >= config.maxRequests) {
    // Rate limit exceeded
    return {
      success: false,
      remaining: 0,
      resetAt: current.resetAt,
    }
  }

  // Increment counter
  current.count++
  store.set(identifier, current)

  return {
    success: true,
    remaining: config.maxRequests - current.count,
    resetAt: current.resetAt,
  }
}

// Cleanup old entries every 5 minutes
if (typeof window === 'undefined') {
  const globalScope = globalThis as typeof globalThis & {
    [CLEANUP_TIMER_KEY]?: ReturnType<typeof setInterval>
  }

  if (!globalScope[CLEANUP_TIMER_KEY]) {
    const cleanupTimer = setInterval(
      () => {
        const now = Date.now()
        for (const [key, entry] of store.entries()) {
          if (entry.resetAt < now) {
            store.delete(key)
          }
        }
      },
      5 * 60 * 1000
    )
    cleanupTimer.unref?.()
    globalScope[CLEANUP_TIMER_KEY] = cleanupTimer
  }
}

// Preset configurations
export const rateLimitPresets = {
  login: { maxRequests: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
  createOrder: { maxRequests: 20, windowMs: 60 * 1000 }, // 20 orders per minute
  backup: { maxRequests: 5, windowMs: 60 * 60 * 1000 }, // 5 backups per hour
  export: { maxRequests: 10, windowMs: 60 * 60 * 1000 }, // 10 exports per hour
  api: { maxRequests: 100, windowMs: 60 * 1000 }, // 100 requests per minute
}
