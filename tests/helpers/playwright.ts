/**
 * Playwright Test Helpers for Atelis
 *
 * Authentication and common test utilities
 */

import { expect, Page } from '@playwright/test'

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

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    await page.getByLabel(/email/i).fill(TEST_USER.email)
    await page.getByLabel(/senha|password/i).fill(TEST_USER.password)
    await page.getByRole('button', { name: /entrar|login/i }).click()

    const reachedApp = await page
      .waitForURL(/\/app\//, { timeout: 15000 })
      .then(() => true)
      .catch(() => false)

    if (reachedApp) {
      return
    }

    const hasKnownError = await page
      .getByText(/too many login attempts|invalid credentials|credenciais invalidas/i)
      .first()
      .isVisible()
      .catch(() => false)

    if (!hasKnownError || attempt === 2) {
      break
    }

    await page.waitForTimeout(1200)
    await page.goto('/login')
  }

  await expect(page).toHaveURL(/\/app\//, { timeout: 1000 })
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
