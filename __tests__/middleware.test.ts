import { describe, expect, it, vi, beforeEach } from "vitest"

const mockState = vi.hoisted(() => ({
  user: null as { id: string } | null,
  nextResponseNext: vi.fn(({ request }: { request: any }) => ({
    request,
    cookies: {
      set: vi.fn(),
      getAll: vi.fn(() => []),
    },
  })),
  nextResponseRedirect: vi.fn((url: { pathname: string }) => ({
    redirect: true,
    url,
  })),
}))

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: {
      getUser: async () => ({ data: { user: mockState.user } }),
    },
  }),
}))

vi.mock("next/server", () => ({
  NextResponse: {
    next: mockState.nextResponseNext,
    redirect: mockState.nextResponseRedirect,
  },
}))

import { updateSession } from "@/src/lib/supabase/middleware"

const createRequest = (pathname: string) => ({
  cookies: {
    getAll: () => [],
    set: vi.fn(),
  },
  nextUrl: {
    pathname,
    clone: () => ({ pathname }),
  },
})

describe("updateSession", () => {
  beforeEach(() => {
    mockState.user = null
    mockState.nextResponseNext.mockClear()
    mockState.nextResponseRedirect.mockClear()
  })

  it("redirects unauthenticated users on private routes", async () => {
    const response = await updateSession(createRequest("/dashboard") as any)

    expect((response as any).redirect).toBe(true)
    expect((response as any).url.pathname).toBe("/login")
  })

  it("allows unauthenticated users on public routes", async () => {
    const response = await updateSession(createRequest("/login") as any)

    expect((response as any).redirect).not.toBe(true)
    expect(mockState.nextResponseNext).toHaveBeenCalled()
  })

  it("allows authenticated users everywhere", async () => {
    mockState.user = { id: "user-1" }

    const response = await updateSession(createRequest("/dashboard") as any)

    expect((response as any).redirect).not.toBe(true)
    expect(mockState.nextResponseNext).toHaveBeenCalled()
  })
})
