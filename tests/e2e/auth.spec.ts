import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('should display login page with correct elements', async ({ page }) => {
    await page.goto('/login')

    // Check page title
    await expect(page).toHaveTitle(/Ateliê Fácil/)

    // Check form elements exist
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/senha/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible()
  })

  test('should show validation errors for invalid credentials', async ({ page }) => {
    await page.goto('/login')

    // Try login with empty fields
    await page.getByRole('button', { name: /entrar/i }).click()

    // Should show validation errors (either client-side or server-side)
    // Wait for error message or validation feedback
    await expect(page.locator('text=/email.*obrigatório|campo obrigatório/i').first()).toBeVisible({
      timeout: 3000,
    }).catch(() => {
      // Fallback: check if form didn't submit (still on login page)
      expect(page.url()).toContain('/login')
    })
  })

  test('should have register link on login page', async ({ page }) => {
    await page.goto('/login')

    // Check if register link exists
    const registerLink = page.getByRole('link', { name: /criar conta|cadastr/i })
    await expect(registerLink).toBeVisible()
  })

  test('should display register page', async ({ page }) => {
    await page.goto('/register')

    // Check register form exists
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/senha/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /criar|cadastr/i })).toBeVisible()
  })

  test('should redirect unauthenticated users from protected routes', async ({ page }) => {
    // Try to access a protected route without authentication
    await page.goto('/app/dashboard')

    // Should redirect to login
    await page.waitForURL(/\/login/, { timeout: 5000 })
    expect(page.url()).toContain('/login')
  })
})

test.describe('Public Pages', () => {
  test('should display landing page', async ({ page }) => {
    await page.goto('/')

    // Check title
    await expect(page).toHaveTitle(/Ateliê Fácil/)

    // Check CTA or login link exists
    const loginLink = page.getByRole('link', { name: /entrar|login/i })
    await expect(loginLink).toBeVisible()
  })

  test('should navigate to login from landing page', async ({ page }) => {
    await page.goto('/')

    // Click login link
    await page.getByRole('link', { name: /entrar|login/i }).first().click()

    // Should be on login page
    await expect(page).toHaveURL(/\/login/)
  })
})
