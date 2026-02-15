import { expect, test } from '@playwright/test'
import { loginViaUI } from '../helpers/playwright'

test.describe('Fluxo de Pedidos', () => {
  const workspaceSlug = process.env.TEST_WORKSPACE_SLUG || 'atelis'

  test.beforeEach(async ({ page }) => {
    await loginViaUI(page)
  })

  test('abre o modal de novo pedido', async ({ page }) => {
    await page.goto(`/${workspaceSlug}/app/pedidos`)

    const novoPedidoButton = page.getByRole('button', { name: /novo pedido/i })
    await expect(novoPedidoButton).toBeVisible()
    await novoPedidoButton.click()

    await expect(page.getByRole('heading', { name: /novo pedido/i })).toBeVisible()
  })

  test('alterna entre lista e quadro', async ({ page }) => {
    await page.goto(`/${workspaceSlug}/app/pedidos`)

    const tabQuadro = page.getByRole('button', { name: /^quadro$/i })
    const tabLista = page.getByRole('button', { name: /^lista$/i })

    await expect(tabQuadro).toBeVisible()
    await tabQuadro.click()

    await expect(
      page.getByText(/orcamentos|aguardando|na bancada|pronto para entrega|finalizados/i).first()
    ).toBeVisible()

    await tabLista.click()
    await expect(
      page.getByText(/nenhum pedido encontrado|cliente desconhecido|itens:/i).first()
    ).toBeVisible()
  })
})
