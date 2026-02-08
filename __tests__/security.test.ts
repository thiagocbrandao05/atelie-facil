import { describe, expect, it, vi, beforeEach } from "vitest"

let headerStore = new Map<string, string>()

vi.mock("next/headers", () => ({
  headers: async () => ({
    get: (key: string) => headerStore.get(key) ?? null,
  }),
}))

import { validateCSRF } from "@/src/lib/security"

describe("validateCSRF", () => {
  beforeEach(() => {
    headerStore = new Map()
  })

  it("allows same-origin requests", async () => {
    headerStore.set("origin", "https://ateliefacil.com.br")
    headerStore.set("host", "ateliefacil.com.br")

    const result = await validateCSRF()

    expect(result.valid).toBe(true)
  })

  it("blocks cross-origin requests", async () => {
    headerStore.set("origin", "https://evil.com")
    headerStore.set("host", "ateliefacil.com.br")

    const result = await validateCSRF()

    expect(result.valid).toBe(false)
    expect(result.error).toBe("CSRF validation failed: origin mismatch")
  })

  it("allows requests without origin header", async () => {
    headerStore.set("host", "ateliefacil.com.br")

    const result = await validateCSRF()

    expect(result.valid).toBe(true)
  })
})
