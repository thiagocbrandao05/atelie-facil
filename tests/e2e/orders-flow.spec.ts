import { test, expect } from '@playwright/test'

test.describe('Fluxo Completo de Pedidos', () => {
    // Setup inicial: Login
    test.beforeEach(async ({ page }) => {
        await page.goto('/login')
        await page.getByLabel('Email').fill('admin@atelie.com') // Ajustar conforme seed
        await page.getByLabel('Senha').fill('123456')
        await page.getByRole('button', { name: 'Entrar' }).click()
        await page.waitForURL('/dashboard')
    })

    test('Deve criar um novo pedido com sucesso', async ({ page }) => {
        await page.goto('/app/pedidos')

        // Abrir Modal
        await page.getByRole('button', { name: 'Novo Pedido' }).click()

        // Preencher Formulário
        await page.getByLabel('Cliente').click()
        await page.getByRole('option').first().click() // Seleciona primeiro cliente

        await page.getByLabel('Data de Entrega').fill('2026-12-31')

        // Adicionar Item
        await page.getByRole('button', { name: 'Adicionar Item' }).click()
        await page.getByPlaceholder('Selecione um produto').click()
        await page.getByRole('option').first().click()
        await page.getByLabel('Quantidade').fill('2')

        // Salvar
        await page.getByRole('button', { name: 'Salvar Pedido' }).click()

        // Validação
        await expect(page.getByText('Pedido criado com sucesso')).toBeVisible()
        await expect(page.locator('.lucide-receipt').first()).toBeVisible() // Ícone do pedido na lista
    })

    test('Deve filtrar pedidos por status', async ({ page }) => {
        await page.goto('/app/pedidos')

        // Tabs de filtro (assumindo tabs ou dropdown)
        // Se for Tabs do Shadcn:
        await page.getByRole('tab', { name: 'Quadro' }).click()
        await expect(page.getByText('Aguardando Início')).toBeVisible()

        await page.getByRole('tab', { name: 'Lista' }).click()
        await expect(page.locator('table')).toBeVisible()
    })
})
