import { cn } from '@/lib/utils'
import { vi } from 'vitest'
import {
  generateQuotationMessage,
  generateOrderConfirmationMessage,
  generateOrderReadyMessage,
  generateLowStockMessage,
  sendWhatsAppMessage,
  formatPhoneForWhatsApp,
  isValidBrazilianPhone,
} from '@/lib/whatsapp'
import {
  getCurrentTenant,
  isFeatureEnabled,
  getTenantSetting,
  getTenantContext,
  validateTenantAccess,
  DEFAULT_TENANT,
} from '@/lib/tenant'

describe('Lib Coverage', () => {
  describe('utils', () => {
    it('cn should merge classes correctly', () => {
      expect(cn('c1', 'c2')).toBe('c1 c2')
      expect(cn('c1', { c2: true, c3: false })).toBe('c1 c2')
      expect(cn('p-4 p-2')).toBe('p-2')
    })
  })

  describe('whatsapp', () => {
    const mockOrder: any = {
      id: '12345678-abcd-efgh',
      customer: { name: 'João' },
      items: [
        { product: { name: 'Prod A' }, quantity: 2, price: 10 },
        { product: { name: 'Prod B' }, quantity: 1, price: 20 },
      ],
      totalValue: 40,
      dueDate: new Date('2023-12-31T12:00:00'),
    }

    it('generateQuotationMessage should format correctly', () => {
      const msg = generateQuotationMessage(mockOrder).replace(/\u00A0/g, ' ')
      expect(msg).toContain('Olá João!')
      expect(msg).toContain('Prod A')
      expect(msg).toContain('R$ 40,00')
    })

    it('generateOrderConfirmationMessage should format correctly', () => {
      const msg = generateOrderConfirmationMessage(mockOrder).replace(/\u00A0/g, ' ')
      expect(msg).toContain('Confirmado')
      expect(msg).toContain('#12345678')
      expect(msg).toContain('R$ 40,00')
    })

    it('generateOrderReadyMessage should format correctly', () => {
      const msg = generateOrderReadyMessage(mockOrder).replace(/\u00A0/g, ' ')
      expect(msg).toContain('Pronto')
      expect(msg).toContain('Prod A, Prod B')
      expect(msg).toContain('R$ 40,00')
    })

    it('generateLowStockMessage should format correctly', () => {
      const msg = generateLowStockMessage('Tecido', 5, 'm')
      expect(msg).toContain('Tecido')
      expect(msg).toContain('5 m')
    })

    it('sendWhatsAppMessage should open window with correct URL', () => {
      const openMock = vi.spyOn(window, 'open').mockImplementation(() => null)
      sendWhatsAppMessage('11999998888', 'Hello World')
      expect(openMock).toHaveBeenCalledWith(
        expect.stringContaining('https://wa.me/5511999998888?text=Hello%20World'),
        '_blank'
      )
      openMock.mockRestore()
    })

    it('isValidBrazilianPhone should validate correctly', () => {
      expect(isValidBrazilianPhone('11999998888')).toBe(true)
      expect(isValidBrazilianPhone('1133334444')).toBe(true)
      expect(isValidBrazilianPhone('5511999998888')).toBe(true)
      expect(isValidBrazilianPhone('551133334444')).toBe(true)
      expect(isValidBrazilianPhone('123')).toBe(false)
      expect(isValidBrazilianPhone('abc')).toBe(false)
    })

    it('formatPhoneForWhatsApp should add 55 if missing', () => {
      expect(formatPhoneForWhatsApp('11999998888')).toBe('5511999998888')
      expect(formatPhoneForWhatsApp('5511999998888')).toBe('5511999998888')
      expect(formatPhoneForWhatsApp('(11) 99999-8888')).toBe('5511999998888')
    })
  })

  describe('tenant', () => {
    it('getCurrentTenant should return default tenant', () => {
      expect(getCurrentTenant()).toEqual(DEFAULT_TENANT)
    })

    it('isFeatureEnabled should return correct value', () => {
      expect(isFeatureEnabled('inventory')).toBe(true)
      expect(isFeatureEnabled('multiUser')).toBe(false)
    })

    it('getTenantSetting should return correct setting', () => {
      expect(getTenantSetting('currency')).toBe('BRL')
      expect(getTenantSetting('hourlyRate')).toBe(20)
    })

    it('getTenantContext should return tenantId', () => {
      expect(getTenantContext()).toEqual({ tenantId: 'default' })
    })

    it('validateTenantAccess should return true (mocked)', () => {
      expect(validateTenantAccess('user1', 'default')).toBe(true)
    })
  })
})
