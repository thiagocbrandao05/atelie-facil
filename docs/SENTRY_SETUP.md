# Sentry Configuration Guide

## Setup Instructions

### 1. Create Sentry Account

1. Go to https://sentry.io
2. Create a new account or sign in
3. Create a new project (Next.js)
4. Copy your DSN

### 2. Add Environment Variables

Add to `.env.local`:

```bash
# Sentry
SENTRY_DSN=your_sentry_dsn_here
SENTRY_ORG=your_org_name
SENTRY_PROJECT=your_project_name
SENTRY_AUTH_TOKEN=your_auth_token
```

### 3. Initialize Sentry

Run the Sentry wizard:

```bash
npx @sentry/wizard@latest -i nextjs
```

This will create:

- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`
- Update `next.config.ts` with Sentry webpack plugin

### 4. Manual Configuration (Alternative)

If you prefer manual setup, create these files:

**sentry.client.config.ts**:

```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  debug: false,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
})
```

**sentry.server.config.ts**:

```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  debug: false,
})
```

### 5. Usage Examples

**In Server Actions**:

```typescript
import * as Sentry from '@sentry/nextjs'

export async function myAction() {
  try {
    // Your code
  } catch (error) {
    Sentry.captureException(error)
    return { success: false, message: 'Error occurred' }
  }
}
```

**Custom Events**:

```typescript
Sentry.captureMessage('Custom event', 'info')
```

**User Context**:

```typescript
Sentry.setUser({ id: user.id, email: user.email })
```

### 6. Test Sentry

Create a test error:

```typescript
throw new Error('Test Sentry error')
```

Check your Sentry dashboard for the error.

---

## Current Status

⚠️ **Sentry package installed but not configured**

To complete setup:

1. Run `npx @sentry/wizard@latest -i nextjs`
2. Add environment variables
3. Test error tracking

---

_Note: Sentry is optional but highly recommended for production monitoring_
