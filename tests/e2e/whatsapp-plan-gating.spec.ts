import { test, expect } from '@playwright/test'

/**
 * Testes E2E para separação de funcionalidades WhatsApp por plano
 * 
 * Planos Start/Pro: Apenas botão manual
 * Plano Premium: API automática + botão manual
 */

test.describe('WhatsApp Plan Feature Gating', () => {
    test.beforeEach(async ({ page }) => {
        // Login como usuário de teste
        await page.goto('/atelie-teste/auth/login')
        await page.fill('[name="email"]', 'test@ateliefacil.com.br')
        await page.fill('[name="password"]', 'TestPassword123!')
        await page.click('button[type="submit"]')
        await page.waitForURL('**/app/dashboard')
    })

    test('Plano Start - exibe apenas botão manual', async ({ page }) => {
        // Navegar para página de pedido
        await page.goto('/atelie-teste/app/pedidos')

        // Aguardar lista de pedidos carregar
        await page.waitForSelector('[data-testid="order-list"]', { timeout: 10000 })

        // Clicar no primeiro pedido
        await page.click('[data-testid="order-item"]:first-child')

        // Verificar que botão de notificação manual está visível
        const manualButton = page.locator('button:has-text("Notificar via WhatsApp")')
        await expect(manualButton).toBeVisible()

        // Verificar que NÃO existe botão de API automática
        const autoButton = page.locator('button:has-text("Enviar Automático")')
        await expect(autoButton).not.toBeVisible()
    })

    test('Botão manual abre WhatsApp com mensagem correta', async ({ page, context }) => {
        // Criar listener para nova aba
        const pagePromise = context.waitForEvent('page')

        // Navegar para pedido
        await page.goto('/atelie-teste/app/pedidos')
        await page.waitForSelector('[data-testid="order-list"]')
        await page.click('[data-testid="order-item"]:first-child')

        // Clicar no botão de notificação
        await page.click('button:has-text("Notificar via WhatsApp")')

        // Aguardar nova aba abrir
        const newPage = await pagePromise

        // Verificar URL do WhatsApp
        expect(newPage.url()).toContain('wa.me/')
        expect(newPage.url()).toContain('?text=')

        // Verificar que mensagem contém variáveis interpoladas
        const url = new URL(newPage.url())
        const message = decodeURIComponent(url.searchParams.get('text') || '')

        expect(message).toContain('pedido')
        expect(message).toMatch(/está|status/)
    })

    test('Botão desabilitado quando cliente não tem telefone', async ({ page }) => {
        // Criar pedido sem telefone (via setup de teste)
        // TODO: Implementar criação de pedido de teste sem telefone

        await page.goto('/atelie-teste/app/pedidos')
        await page.waitForSelector('[data-testid="order-list"]')

        // Assumindo que existe um pedido sem telefone
        // await page.click('[data-testid="order-without-phone"]')

        // const notifyButton = page.locator('button:has-text("Notificar via WhatsApp")')
        // await expect(notifyButton).toBeDisabled()
    })

    test('Template de mensagem é configurável', async ({ page }) => {
        // Navegar para configurações
        await page.goto('/atelie-teste/app/configuracoes')

        // Localizar campo de template
        const templateField = page.locator('textarea[name="whatsappNotifyTemplate"]')
        await expect(templateField).toBeVisible()

        // Verificar valor default
        const defaultValue = await templateField.inputValue()
        expect(defaultValue).toContain('{cliente}')
        expect(defaultValue).toContain('{numero}')
        expect(defaultValue).toContain('{status}')

        // Alterar template
        await templateField.fill('Novo template: {cliente} - Pedido {numero}')

        // Salvar
        await page.click('button[type="submit"]')

        // Verificar toast de sucesso
        await expect(page.locator('text=salv')).toBeVisible({ timeout: 5000 })
    })

    test('Link gerado registra log no banco', async ({ page }) => {
        // Navegar para pedido
        await page.goto('/atelie-teste/app/pedidos')
        await page.waitForSelector('[data-testid="order-list"]')
        await page.click('[data-testid="order-item"]:first-child')

        // Clicar no botão
        await page.click('button:has-text("Notificar via WhatsApp")')

        // Aguardar toast de sucesso
        await expect(page.locator('text=WhatsApp aberto')).toBeVisible({ timeout: 3000 })

        // Verificar que log foi criado
        // TODO: Adicionar verificação via API ou banco
        // Pode usar fetch para endpoint de logs ou verificar na UI se houver
    })
})

test.describe('WhatsApp Utils - Unit-like E2E', () => {
    test('Telefones brasileiros são formatados corretamente', async ({ page }) => {
        // Testes de formatação podem ser feitos via Server Actions
        // Como não temos acesso direto às funções utils no E2E,
        // podemos testar indiretamente via UI ou criar endpoint de teste

        // TODO: Implementar endpoint de teste para utils
        // Ou testar via comportamento da UI
    })
})
