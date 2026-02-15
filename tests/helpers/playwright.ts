/**
 * Playwright Test Helpers for Atelis
 *
 * Authentication and common test utilities
 */

import { Page } from '@playwright/test'

const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'test@atelis.local',
  password: process.env.TEST_USER_PASSWORD || 'TestPassword123!',
}

const TEST_WORKSPACE_SLUG = process.env.TEST_WORKSPACE_SLUG || 'atelis'

function appPath(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `/${TEST_WORKSPACE_SLUG}/app${normalized === '/' ? '' : normalized}`
}

export async function loginViaUI(page: Page) {
  await page.goto('/login')

  await page.getByLabel(/email/i).fill(TEST_USER.email)
  await page.getByLabel(/senha|password/i).fill(TEST_USER.password)

  await page.getByRole('button', { name: /entrar|login/i }).click()

  await page.waitForURL(/\/app\//, { timeout: 10000 })
}

export async function loginViaAPI(page: Page) {
  console.warn('loginViaAPI not implemented, falling back to UI login')
  await loginViaUI(page)
}

export async function logout(page: Page) {
  await page.goto(appPath('/dashboard'))

  await page.getByRole('button', { name: /sair|logout/i }).click()

  await page.waitForURL(/\/(login)?$/, { timeout: 5000 })
}

export async function createTestCustomer(page: Page, name: string) {
  await page.goto(appPath('/clientes'))

  await page.getByRole('button', { name: /novo.*cliente/i }).click()

  await page.getByLabel(/nome/i).fill(name)
  await page.getByLabel(/telefone/i).fill('11999887766')
  await page.getByLabel(/email/i).fill(`${name.toLowerCase().replace(' ', '')}@test.com`)

  await page.getByRole('button', { name: /salvar|criar/i }).click()

  await page.waitForTimeout(1000)
}

export async function waitForToast(page: Page, message: string | RegExp) {
  await page.getByText(message).waitFor({ state: 'visible', timeout: 5000 })
}

export async function screenshotOnFailure(page: Page, testName: string) {
  await page.screenshot({
    path: `tests/screenshots/${testName}-failure.png`,
    fullPage: true,
  })
}
