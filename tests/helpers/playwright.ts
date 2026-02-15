/**
 * Playwright Test Helpers for Ateliê Fácil
 *
 * Authentication and common test utilities
 */

import { Page } from '@playwright/test'

/**
 * Test credentials (use a dedicated test user in your database)
 */
const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'test@ateliefacil.com.br',
  password: process.env.TEST_USER_PASSWORD || 'TestPassword123!',
}

/**
 * Helper to login via UI
 *
 * @param page - Playwright page instance
 */
export async function loginViaUI(page: Page) {
  await page.goto('/login')

  await page.getByLabel(/email/i).fill(TEST_USER.email)
  await page.getByLabel(/senha|password/i).fill(TEST_USER.password)

  await page.getByRole('button', { name: /entrar|login/i }).click()

  // Wait for redirect to dashboard or app
  await page.waitForURL(/\/app\//, { timeout: 10000 })
}

/**
 * Helper to login via API (faster for test setup)
 *
 * This bypasses the UI and sets cookies directly
 * Requires Supabase Auth API
 */
export async function loginViaAPI(page: Page) {
  // TODO: Implement API-based login
  // This is faster than UI login and recommended for test setup

  // Example:
  // const response = await page.request.post('/api/auth/login', {
  //   data: { email: TEST_USER.email, password: TEST_USER.password }
  // })
  // const cookies = await response.headers()['set-cookie']
  // await page.context().addCookies(cookies)

  console.warn('loginViaAPI not implemented, falling back to UI login')
  await loginViaUI(page)
}

/**
 * Helper to logout
 */
export async function logout(page: Page) {
  await page.goto('/app/dashboard')

  // Click user menu or logout button
  await page.getByRole('button', { name: /sair|logout/i }).click()

  // Wait for redirect to landing or login
  await page.waitForURL(/\/(login)?$/, { timeout: 5000 })
}

/**
 * Helper to create test data
 */
export async function createTestCustomer(page: Page, name: string) {
  await page.goto('/app/clientes')

  await page.getByRole('button', { name: /novo.*cliente/i }).click()

  await page.getByLabel(/nome/i).fill(name)
  await page.getByLabel(/telefone/i).fill('11999887766')
  await page.getByLabel(/email/i).fill(`${name.toLowerCase().replace(' ', '')}@test.com`)

  await page.getByRole('button', { name: /salvar|criar/i }).click()

  // Wait for success
  await page.waitForTimeout(1000)
}

/**
 * Helper to wait for toast/notification
 */
export async function waitForToast(page: Page, message: string | RegExp) {
  await page.getByText(message).waitFor({ state: 'visible', timeout: 5000 })
}

/**
 * Helper to take screenshot on failure
 */
export async function screenshotOnFailure(page: Page, testName: string) {
  await page.screenshot({
    path: `tests/screenshots/${testName}-failure.png`,
    fullPage: true,
  })
}
