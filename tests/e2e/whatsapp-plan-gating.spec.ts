import { test, expect } from '@playwright/test'
import { loginViaUI } from '../helpers/playwright'

/**
 * Testes E2E para separacao de funcionalidades WhatsApp por plano
 *
 * Planos Start/Pro: Apenas botao manual
 * Plano Premium: API automatica + botao manual
 */

test.describe('WhatsApp Plan Feature Gating', () => {
  const workspaceSlug = process.env.TEST_WORKSPACE_SLUG || 'atelis'

  test.beforeEach(async ({ page }) => {
    await loginViaUI(page)
  })

  test('Plano Start - exibe apenas botao manual', async ({ page }) => {
    await page.goto(`/${workspaceSlug}/app/pedidos`)
    await page.waitForSelector('[data-testid="order-list"]', { timeout: 10000 })
    await page.click('[data-testid="order-item"]:first-child')

    const manualButton = page.locator('button:has-text("Notificar via WhatsApp")')
    await expect(manualButton).toBeVisible()

    const autoButton = page.locator('button:has-text("Enviar Automatico")')
    await expect(autoButton).not.toBeVisible()
  })

  test('Botao manual abre WhatsApp com mensagem correta', async ({ page, context }) => {
    const pagePromise = context.waitForEvent('page')

    await page.goto(`/${workspaceSlug}/app/pedidos`)
    await page.waitForSelector('[data-testid="order-list"]')
    await page.click('[data-testid="order-item"]:first-child')
    await page.click('button:has-text("Notificar via WhatsApp")')

    const newPage = await pagePromise

    expect(newPage.url()).toContain('wa.me/')
    expect(newPage.url()).toContain('?text=')

    const url = new URL(newPage.url())
    const message = decodeURIComponent(url.searchParams.get('text') || '')

    expect(message).toContain('pedido')
    expect(message).toMatch(/esta|status/i)
  })

  test('Botao desabilitado quando cliente nao tem telefone', async ({ page }) => {
    await page.goto(`/${workspaceSlug}/app/pedidos`)
    await page.waitForSelector('[data-testid="order-list"]')

    // TODO: Implementar criacao de pedido de teste sem telefone
    // const notifyButton = page.locator('button:has-text("Notificar via WhatsApp")')
    // await expect(notifyButton).toBeDisabled()
  })

  test('Template de mensagem e configuravel', async ({ page }) => {
    await page.goto(`/${workspaceSlug}/app/configuracoes`)

    const templateField = page.locator('textarea[name="whatsappNotifyTemplate"]')
    await expect(templateField).toBeVisible()

    const defaultValue = await templateField.inputValue()
    expect(defaultValue).toContain('{cliente}')
    expect(defaultValue).toContain('{numero}')
    expect(defaultValue).toContain('{status}')

    await templateField.fill('Novo template: {cliente} - Pedido {numero}')
    await page.click('button[type="submit"]')

    await expect(page.locator('text=salv')).toBeVisible({ timeout: 5000 })
  })

  test('Link gerado registra log no banco', async ({ page }) => {
    await page.goto(`/${workspaceSlug}/app/pedidos`)
    await page.waitForSelector('[data-testid="order-list"]')
    await page.click('[data-testid="order-item"]:first-child')
    await page.click('button:has-text("Notificar via WhatsApp")')

    await expect(page.locator('text=WhatsApp aberto')).toBeVisible({ timeout: 3000 })

    // TODO: Adicionar verificacao via API ou banco
  })
})

test.describe('WhatsApp Utils - Unit-like E2E', () => {
  test('Telefones brasileiros sao formatados corretamente', async () => {
    // TODO: Implementar endpoint de teste para utils
  })
})
