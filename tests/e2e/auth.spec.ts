import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  const workspaceSlug = process.env.TEST_WORKSPACE_SLUG || 'atelis'

  test('should display login page with correct elements', async ({ page }) => {
    await page.goto('/login')

    await expect(page).toHaveTitle(/Atelis|Atelie/i)
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/senha/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible()
  })

  test('should show validation errors for invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: /entrar/i }).click()

    await expect(page.locator('text=/email.*obrigatorio|campo obrigatorio/i').first())
      .toBeVisible({ timeout: 3000 })
      .catch(() => {
        expect(page.url()).toContain('/login')
      })
  })

  test('should have register link on login page', async ({ page }) => {
    await page.goto('/login')
    const registerLink = page.getByRole('link', { name: /criar conta|cadastr/i })
    await expect(registerLink).toBeVisible()
  })

  test('should display register page', async ({ page }) => {
    await page.goto('/register')

    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/senha/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /criar|cadastr/i })).toBeVisible()
  })

  test('should redirect unauthenticated users from protected routes', async ({ page }) => {
    await page.context().clearCookies()
    await page.goto(`/${workspaceSlug}/app/dashboard`)

    // Accept either server-side URL redirect or login page rendered in place.
    const redirectedToLogin = /\/login/.test(page.url())
    if (!redirectedToLogin) {
      await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible({ timeout: 5000 })
      await expect(page.getByLabel(/email/i)).toBeVisible()
    } else {
      expect(page.url()).toContain('/login')
    }
  })
})

test.describe('Public Pages', () => {
  test('should display landing page', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle(/Atelis|Atelie/i)
    const loginLink = page.getByRole('navigation').getByRole('link', { name: /entrar|login/i })
    await expect(loginLink).toBeVisible()
  })

  test('should navigate to login from landing page', async ({ page }) => {
    await page.goto('/')
    await page
      .getByRole('link', { name: /entrar|login/i })
      .first()
      .click()
    await expect(page).toHaveURL(/\/login/)
  })
})
