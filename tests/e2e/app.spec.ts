import { test, expect } from '@playwright/test'

test.describe('Customer Management', () => {
  const workspaceSlug = process.env.TEST_WORKSPACE_SLUG || 'atelis'

  test.skip('should create a new customer', async ({ page }) => {
    await page.goto(`/${workspaceSlug}/app/clientes`)
    await page.getByRole('button', { name: /novo.*cliente|adicionar/i }).click()

    await page.getByLabel(/nome/i).fill('Joao da Silva')
    await page.getByLabel(/telefone|phone/i).fill('11999887766')
    await page.getByLabel(/email/i).fill('joao@example.com')

    await page.getByRole('button', { name: /salvar|criar/i }).click()

    await expect(page.getByText(/cliente.*criado|sucesso/i)).toBeVisible({ timeout: 5000 })
  })

  test.skip('should list customers', async ({ page }) => {
    await page.goto(`/${workspaceSlug}/app/clientes`)
    await expect(page.getByRole('table')).toBeVisible()
  })

  test.skip('should search customers', async ({ page }) => {
    await page.goto(`/${workspaceSlug}/app/clientes`)

    const searchInput = page.getByPlaceholder(/buscar|pesquisar/i)
    await expect(searchInput).toBeVisible()
    await searchInput.fill('Joao')
    await page.waitForTimeout(500)
  })
})

test.describe('Order Management', () => {
  const workspaceSlug = process.env.TEST_WORKSPACE_SLUG || 'atelis'

  test.skip('should display orders page when authenticated', async ({ page }) => {
    await page.goto(`/${workspaceSlug}/app/pedidos`)
    await expect(page.locator('text=/pedidos|orders/i').first()).toBeVisible()
  })

  test.skip('should create a new order', async ({ page }) => {
    await page.goto(`/${workspaceSlug}/app/pedidos`)
    await page.getByRole('button', { name: /novo.*pedido|criar/i }).click()

    await page.getByLabel(/cliente/i).click()
    await page.getByRole('option', { name: /joao/i }).click()
    await page.getByRole('button', { name: /criar|salvar/i }).click()

    await expect(page.getByText(/pedido.*criado|sucesso/i)).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Inventory Management', () => {
  const workspaceSlug = process.env.TEST_WORKSPACE_SLUG || 'atelis'

  test.skip('should display inventory page', async ({ page }) => {
    await page.goto(`/${workspaceSlug}/app/estoque`)
    await expect(page.getByRole('table')).toBeVisible()
  })

  test.skip('should show low stock alerts', async ({ page }) => {
    await page.goto(`/${workspaceSlug}/app/dashboard`)
  })
})
