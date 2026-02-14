import { describe, it, expect } from 'vitest'
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatPhone,
  formatDateLong,
  formatNumber,
  formatPercent,
} from '@/lib/formatters'

describe('Formatters Utilities', () => {
  describe('formatCurrency', () => {
    it('should format numbers as BRL currency', () => {
      const result = formatCurrency(1234.56)
      expect(result).toContain('1.234,56')
      expect(result).toContain('R$')
    })
  })

  describe('formatDate', () => {
    it('should format Date objects correctly', () => {
      const date = new Date(2026, 0, 27) // Jan 27, 2026
      expect(formatDate(date)).toBe('27/01/2026')
    })

    it('should format date strings correctly', () => {
      expect(formatDate('2026/01/27')).toBe('27/01/2026')
    })

    it('should fallback to original string on error', () => {
      expect(formatDate('invalid-date')).toBe('invalid-date')
    })
  })

  describe('formatDateTime', () => {
    it('should format datetime correctly', () => {
      const date = new Date(2026, 0, 27, 10, 30)
      const result = formatDateTime(date)
      expect(result).toContain('27/01/2026')
      expect(result).toContain('10:30')
    })

    it('should fallback on error', () => {
      expect(formatDateTime('invalid')).toBe('invalid')
    })
  })

  describe('formatPhone', () => {
    it('should format mobile phones (11 digits)', () => {
      expect(formatPhone('11999998888')).toBe('(11) 99999-8888')
    })

    it('should format landline phones (10 digits)', () => {
      expect(formatPhone('1133334444')).toBe('(11) 3333-4444')
    })

    it('should return original string if length is neither 10 nor 11', () => {
      expect(formatPhone('12345')).toBe('12345')
      expect(formatPhone('123456789012')).toBe('123456789012')
    })

    it('should strip non-numeric characters before formatting', () => {
      expect(formatPhone('(11) 9.9999-8888')).toBe('(11) 99999-8888')
    })
  })

  describe('formatDateLong', () => {
    it('should format date in long format', () => {
      const date = new Date(2026, 0, 27)
      expect(formatDateLong(date)).toContain('27 de janeiro de 2026')
    })

    it('should fallback on error', () => {
      expect(formatDateLong('invalid')).toBe('invalid')
    })
  })

  describe('formatNumber', () => {
    it('should format numbers with default 2 decimals', () => {
      expect(formatNumber(1234.5)).toBe('1.234,50')
    })

    it('should format numbers with custom decimals', () => {
      expect(formatNumber(1234.567, 3)).toBe('1.234,567')
    })

    it('should handle NaN and null', () => {
      expect(formatNumber(NaN)).toBe('0,00')
      expect(formatNumber(null as any)).toBe('0,00')
    })
  })

  describe('formatPercent', () => {
    it('should format numbers as percentage', () => {
      expect(formatPercent(50)).toBe('50,00%')
      expect(formatPercent(12.5)).toBe('12,50%')
    })
  })
})
