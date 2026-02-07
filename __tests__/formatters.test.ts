/**
 * Unit tests for formatting utilities
 */

import {
    formatCurrency,
    formatDate,
    formatDateTime,
    formatPhone,
    formatNumber
} from '@/lib/formatters'

describe('Formatters', () => {
    describe('formatCurrency', () => {
        it('should format positive numbers correctly', () => {
            expect(formatCurrency(1234.56).replace(/\u00A0/g, ' ')).toBe('R$ 1.234,56')
            expect(formatCurrency(100).replace(/\u00A0/g, ' ')).toBe('R$ 100,00')
            expect(formatCurrency(0.99).replace(/\u00A0/g, ' ')).toBe('R$ 0,99')
        })

        it('should handle zero', () => {
            expect(formatCurrency(0).replace(/\u00A0/g, ' ')).toBe('R$ 0,00')
        })

        it('should format large numbers', () => {
            expect(formatCurrency(1234567.89).replace(/\u00A0/g, ' ')).toBe('R$ 1.234.567,89')
        })
    })

    describe('formatDate', () => {
        it('should format dates correctly', () => {
            const date = new Date('2026-01-27T10:00:00')
            expect(formatDate(date)).toBe('27/01/2026')
        })

        it('should handle different months', () => {
            const date = new Date('2026-12-31T10:00:00')
            expect(formatDate(date)).toBe('31/12/2026')
        })
    })

    describe('formatDateTime', () => {
        it('should format date and time correctly', () => {
            const date = new Date('2026-01-27T14:30:00')
            const result = formatDateTime(date)
            expect(result).toContain('27/01/2026')
            expect(result).toContain('14:30')
        })
    })

    describe('formatPhone', () => {
        it('should format 11-digit phone numbers', () => {
            expect(formatPhone('11987654321')).toBe('(11) 98765-4321')
        })

        it('should format 10-digit phone numbers', () => {
            expect(formatPhone('1133334444')).toBe('(11) 3333-4444')
        })

        it('should handle already formatted numbers', () => {
            expect(formatPhone('(11) 98765-4321')).toBe('(11) 98765-4321')
        })

        it('should return original if invalid', () => {
            expect(formatPhone('123')).toBe('123')
        })
    })

    describe('formatNumber', () => {
        it('should format numbers with default decimals', () => {
            expect(formatNumber(1234.567)).toBe('1.234,57')
        })

        it('should format with custom decimals', () => {
            expect(formatNumber(1234.567, 1)).toBe('1.234,6')
            expect(formatNumber(1234.567, 3)).toBe('1.234,567')
        })

        it('should handle zero decimals', () => {
            expect(formatNumber(1234.567, 0)).toBe('1.235')
        })
    })
})
