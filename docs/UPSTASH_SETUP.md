# Upstash Redis Setup Guide

## 🚀 Quick Start

### 1. Create Upstash Account
1. Go to https://upstash.com
2. Sign up with GitHub/Google
3. Create a new Redis database

### 2. Get Credentials

After creating database, copy:
- **REST URL**: `https://your-db.upstash.io`
- **REST TOKEN**: Your authentication token

### 3. Add Environment Variables

Add to `.env.local`:
```bash
UPSTASH_REDIS_REST_URL=https://your-database.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here
```

### 4. Test Connection

Create a test file `test-upstash.ts`:
```typescript
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

async function test() {
  await redis.set('test', 'Hello Upstash!')
  const result = await redis.get('test')
  console.log('Result:', result)
}

test()
```

Run: `npx tsx test-upstash.ts`

---

## 📊 Rate Limiting Configuration

### Current Setup (`lib/ratelimit.ts`)

**Default Rate Limit**:
- 10 requests per 10 seconds
- Sliding window algorithm
- Analytics enabled

**API Rate Limit**:
- 5 requests per 10 seconds
- More restrictive for APIs

### Usage in Server Actions

```typescript
import { checkRateLimit, getIdentifier } from '@/lib/ratelimit'

export async function createCustomer(formData: FormData) {
  // Check rate limit
  const identifier = await getIdentifier()
  const { success, remaining } = await checkRateLimit(identifier)
  
  if (!success) {
    return { 
      success: false, 
      message: 'Too many requests. Please try again later.' 
    }
  }
  
  // Continue with action
  // ...
}
```

### Custom Rate Limits

```typescript
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Very restrictive (login attempts)
const loginRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '60 s'),
  prefix: 'ratelimit:login',
})

// Permissive (read operations)
const readRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '60 s'),
  prefix: 'ratelimit:read',
})
```

---

## 🔧 Advanced Features

### 1. Multiple Rate Limits

```typescript
// Per user
const userLimit = await ratelimit.limit(`user:${userId}`)

// Per IP
const ipLimit = await ratelimit.limit(`ip:${ipAddress}`)

// Per API key
const apiLimit = await ratelimit.limit(`api:${apiKey}`)
```

### 2. Analytics

```typescript
const { success, limit, remaining, reset, pending } = await ratelimit.limit(identifier)

console.log({
  success,      // true if request is allowed
  limit,        // total limit
  remaining,    // requests remaining
  reset,        // timestamp when limit resets
  pending,      // pending requests
})
```

### 3. Custom Identifiers

```typescript
import { headers } from 'next/headers'

export async function getIdentifier(): Promise<string> {
  const headersList = headers()
  const ip = headersList.get('x-forwarded-for') || 
             headersList.get('x-real-ip') || 
             'unknown'
  
  // Or use user ID if authenticated
  const user = await getCurrentUser()
  if (user) {
    return `user:${user.id}`
  }
  
  return `ip:${ip}`
}
```

---

## 📈 Monitoring

### Upstash Dashboard
- View request counts
- Monitor rate limit hits
- Check Redis usage
- Analytics graphs

### Custom Logging

```typescript
import { logAction } from '@/lib/audit'

const { success } = await checkRateLimit(identifier)

if (!success) {
  await logAction(
    tenantId,
    userId,
    'RATE_LIMIT_EXCEEDED',
    'RateLimit',
    identifier
  )
}
```

---

## 💰 Pricing

### Free Tier
- 10,000 commands/day
- 256 MB storage
- Perfect for development and small apps

### Pro Tier
- 1M commands/day
- 1 GB storage
- $0.2 per 100K additional commands

---

## 🔒 Security Best Practices

### 1. Environment Variables
```bash
# Never commit these!
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

### 2. Different Limits per Route
```typescript
// Public routes - restrictive
const publicLimit = Ratelimit.slidingWindow(5, '60 s')

// Authenticated routes - permissive
const authLimit = Ratelimit.slidingWindow(50, '60 s')

// Admin routes - very permissive
const adminLimit = Ratelimit.slidingWindow(200, '60 s')
```

### 3. Graceful Degradation
```typescript
if (!ratelimit) {
  // If Upstash is not configured, allow all requests
  // (useful for local development)
  return { success: true }
}
```

---

## 🧪 Testing

### Local Testing
```typescript
// Disable rate limiting in development
const ratelimit = process.env.NODE_ENV === 'production' 
  ? createRatelimit() 
  : null
```

### Load Testing
```bash
# Install autocannon
npm install -g autocannon

# Test endpoint
autocannon -c 100 -d 10 http://localhost:3000/api/test
```

---

## 📝 Checklist

- [ ] Create Upstash account
- [ ] Create Redis database
- [ ] Copy credentials to `.env.local`
- [ ] Test connection
- [ ] Update `getIdentifier()` to use real IP/user
- [ ] Add rate limiting to critical endpoints
- [ ] Test rate limiting
- [ ] Monitor Upstash dashboard
- [ ] Set up alerts (optional)

---

## 🔗 Resources

- [Upstash Docs](https://upstash.com/docs)
- [Rate Limiting Guide](https://upstash.com/docs/redis/features/ratelimiting)
- [Next.js Integration](https://upstash.com/docs/redis/tutorials/nextjs-edge-ratelimiting)

---

*Setup guide created: 31/01/2026*  
*Status: Ready for configuration*
