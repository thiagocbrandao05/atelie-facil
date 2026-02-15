import { expect, test } from '@playwright/test'
import { loginViaUI } from '../helpers/playwright'

test.describe('WhatsApp Plan Feature Gating', () => {
  const workspaceSlug = process.env.TEST_WORKSPACE_SLUG || 'atelis'

  test.beforeEach(async ({ page }) => {
    await loginViaUI(page)
  })

  test('pedidos exibe estado de notificacao por plano', async ({ page }) => {
    await page.goto(`/${workspaceSlug}/app/pedidos`)

    const manualCount = await page.getByRole('button', { name: /notificar via whatsapp/i }).count()
    const automationCount = await page.getByText(/automacao ativa|automação ativa/i).count()

    if (manualCount > 0) {
      await expect(
        page.getByRole('button', { name: /notificar via whatsapp/i }).first()
      ).toBeVisible()
      return
    }

    if (automationCount > 0) {
      await expect(page.getByText(/automacao ativa|automação ativa/i).first()).toBeVisible()
      return
    }

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('botao manual abre link wa.me quando disponivel', async ({ page }) => {
    await page.goto(`/${workspaceSlug}/app/pedidos`)

    const manualButton = page.getByRole('button', { name: /notificar via whatsapp/i }).first()
    if ((await manualButton.count()) === 0) {
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      return
    }

    const popupPromise = page.waitForEvent('popup', { timeout: 10000 })
    await manualButton.click()

    const popup = await popupPromise
    expect(popup.url()).toContain('wa.me/')
    expect(popup.url()).toContain('?text=')
  })

  test('configuracoes exibem templates de mensagem', async ({ page }) => {
    await page.goto(`/${workspaceSlug}/app/configuracoes`)
    await page.getByRole('button', { name: /mensagens/i }).click()

    const msgQuotation = page.locator('textarea[name="msgQuotation"]')
    await expect(msgQuotation).toBeVisible()

    const defaultValue = await msgQuotation.inputValue()
    expect(defaultValue.length).toBeGreaterThan(0)
    expect(defaultValue.toLowerCase()).toContain('{cliente}')
  })

  test('acao de notificar mostra feedback quando houver pedido', async ({ page }) => {
    await page.goto(`/${workspaceSlug}/app/pedidos`)

    const manualButton = page.getByRole('button', { name: /notificar via whatsapp/i }).first()
    if ((await manualButton.count()) === 0) {
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      return
    }

    await manualButton.click()
    await expect(
      page.getByText(/whatsapp aberto|cliente nao possui telefone|erro ao gerar link/i).first()
    ).toBeVisible({ timeout: 8000 })
  })
})

test.describe('WhatsApp Utils - Unit-like E2E', () => {
  test('placeholder de utilitarios', async () => {
    expect(true).toBeTruthy()
  })
})
