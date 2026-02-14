import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.unmock('@/lib/security')

let headerStore = new Map<string, string>()

vi.mock('next/headers', () => ({
  headers: async () => ({
    get: (key: string) => headerStore.get(key) ?? null,
  }),
}))

import { validateCSRF, getClientIP, getUserAgent } from '@/lib/security'

describe('validateCSRF', () => {
  beforeEach(() => {
    headerStore = new Map()
  })

  it('allows same-origin requests', async () => {
    headerStore.set('origin', 'https://ateliefacil.com.br')
    headerStore.set('host', 'ateliefacil.com.br')

    const result = await validateCSRF()

    expect(result.valid).toBe(true)
  })

  it('blocks cross-origin requests', async () => {
    headerStore.set('origin', 'https://evil.com')
    headerStore.set('host', 'ateliefacil.com.br')

    const result = await validateCSRF()

    expect(result.valid).toBe(false)
    expect(result.error).toBe('CSRF validation failed: origin mismatch')
  })

  it('allows requests without origin header', async () => {
    headerStore.set('host', 'ateliefacil.com.br')

    const result = await validateCSRF()

    expect(result.valid).toBe(true)
  })

  it('handles invalid origin URL', async () => {
    headerStore.set('origin', 'invalid-url')
    const result = await validateCSRF()
    expect(result.valid).toBe(false)
    expect(result.error).toBe('CSRF validation error')
  })
})

describe('getClientIP', () => {
  beforeEach(() => {
    headerStore = new Map()
  })

  it('gets IP from x-real-ip', async () => {
    headerStore.set('x-real-ip', '1.2.3.4')
    expect(await getClientIP()).toBe('1.2.3.4')
  })

  it('gets IP from x-forwarded-for first element', async () => {
    headerStore.set('x-forwarded-for', '5.6.7.8, 1.2.3.4')
    expect(await getClientIP()).toBe('5.6.7.8')
  })

  it('gets IP from cf-connecting-ip', async () => {
    headerStore.set('cf-connecting-ip', '9.10.11.12')
    expect(await getClientIP()).toBe('9.10.11.12')
  })

  it('returns unknown if no IP headers found', async () => {
    expect(await getClientIP()).toBe('unknown')
  })
})

describe('getUserAgent', () => {
  it('gets user agent from header', async () => {
    headerStore.set('user-agent', 'Mozilla/5.0')
    expect(await getUserAgent()).toBe('Mozilla/5.0')
  })

  it('returns unknown if user-agent header is missing', async () => {
    headerStore.delete('user-agent')
    expect(await getUserAgent()).toBe('unknown')
  })
})
