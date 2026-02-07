// Simple in-memory rate limiter for development
// For production, use Redis-based solution like @upstash/ratelimit

interface RateLimitEntry {
    count: number
    resetAt: number
}

const store = new Map<string, RateLimitEntry>()

export interface RateLimitConfig {
    maxRequests: number
    windowMs: number
}

export async function rateLimit(
    identifier: string,
    config: RateLimitConfig = { maxRequests: 10, windowMs: 60000 }
): Promise<{ success: boolean; remaining: number; resetAt: number }> {
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
            resetAt
        }
    }

    if (current.count >= config.maxRequests) {
        // Rate limit exceeded
        return {
            success: false,
            remaining: 0,
            resetAt: current.resetAt
        }
    }

    // Increment counter
    current.count++
    store.set(identifier, current)

    return {
        success: true,
        remaining: config.maxRequests - current.count,
        resetAt: current.resetAt
    }
}

// Cleanup old entries every 5 minutes
if (typeof window === 'undefined') {
    setInterval(() => {
        const now = Date.now()
        for (const [key, entry] of store.entries()) {
            if (entry.resetAt < now) {
                store.delete(key)
            }
        }
    }, 5 * 60 * 1000)
}

// Preset configurations
export const rateLimitPresets = {
    login: { maxRequests: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
    createOrder: { maxRequests: 20, windowMs: 60 * 1000 }, // 20 orders per minute
    backup: { maxRequests: 5, windowMs: 60 * 60 * 1000 }, // 5 backups per hour
    export: { maxRequests: 10, windowMs: 60 * 60 * 1000 }, // 10 exports per hour
    api: { maxRequests: 100, windowMs: 60 * 1000 }, // 100 requests per minute
}


