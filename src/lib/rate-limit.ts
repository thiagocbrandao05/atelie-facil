/**
 * Rate limiting configuration using in-memory store
 * For production, use Redis with @upstash/ratelimit
 */

interface RateLimitEntry {
    count: number
    resetTime: number
}

class InMemoryRateLimiter {
    private store: Map<string, RateLimitEntry> = new Map()
    private readonly windowMs: number
    private readonly maxRequests: number

    constructor(windowMs: number = 10000, maxRequests: number = 10) {
        this.windowMs = windowMs
        this.maxRequests = maxRequests

        // Cleanup old entries every minute
        setInterval(() => this.cleanup(), 60000)
    }

    async check(identifier: string): Promise<{ success: boolean; remaining: number }> {
        const now = Date.now()
        const entry = this.store.get(identifier)

        if (!entry || now > entry.resetTime) {
            // New window
            this.store.set(identifier, {
                count: 1,
                resetTime: now + this.windowMs
            })
            return { success: true, remaining: this.maxRequests - 1 }
        }

        if (entry.count >= this.maxRequests) {
            return { success: false, remaining: 0 }
        }

        entry.count++
        return { success: true, remaining: this.maxRequests - entry.count }
    }

    private cleanup() {
        const now = Date.now()
        for (const [key, entry] of this.store.entries()) {
            if (now > entry.resetTime) {
                this.store.delete(key)
            }
        }
    }
}

// Export singleton instance
export const rateLimiter = new InMemoryRateLimiter(10000, 10) // 10 requests per 10 seconds

/**
 * Rate limit middleware for server actions
 */
export async function rateLimit(identifier: string): Promise<void> {
    const result = await rateLimiter.check(identifier)

    if (!result.success) {
        throw new Error('Too many requests. Please try again later.')
    }
}

/**
 * Get client identifier for rate limiting
 * In production, use IP address or user ID
 */
export function getClientIdentifier(headers?: Headers): string {
    // For now, use a simple identifier
    // In production, extract from headers: x-forwarded-for, x-real-ip, etc.
    return headers?.get('x-forwarded-for') || 'anonymous'
}


