import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// Mocking Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
}))

// Mocking Next.js cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// Mocking Supabase client to avoid DB connections during unit tests
const createMockSupabaseClient = () => ({
  from: vi.fn((table: string) => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    containedBy: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  })),
  rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  auth: {
    getUser: vi.fn().mockResolvedValue({
      data: { user: { id: 'test-user-id', email: 'test@example.com' } },
      error: null,
    }),
    signIn: vi.fn().mockResolvedValue({ data: {}, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    getSession: vi.fn().mockResolvedValue({
      data: { session: { user: { id: 'test-user-id' } } },
      error: null,
    }),
  },
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => createMockSupabaseClient()),
}))

vi.mock('@/lib/supabase/client', () => ({
  createBrowserClient: vi.fn(() => createMockSupabaseClient()),
}))

// Mock getCurrentUser helper
vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn().mockResolvedValue({
    id: 'test-user-id',
    email: 'test@example.com',
    tenantId: 'test-tenant-id',
  }),
}))

// Mock security utilities
vi.mock('@/lib/security', () => ({
  validateCSRF: vi.fn().mockResolvedValue({ valid: true }),
  checkRateLimit: vi.fn().mockReturnValue(true),
}))

// Mock audit wrapper
vi.mock('@/lib/audit', () => ({
  withAudit: vi.fn((_action: unknown, _entity: unknown, handler: (...args: unknown[]) => unknown) => handler),
}))
