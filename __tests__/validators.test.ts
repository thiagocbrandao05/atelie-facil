/**
 * Unit tests for validation utilities
 */

import {
    sanitizeString,
    sanitizeEmail,
    sanitizePhone,
    isPositiveNumber,
    isValidEmail,
    isValidBrazilianPhone,
    isFutureDate
} from '@/lib/validators'

describe('Validators', () => {
    describe('sanitizeString', () => {
        it('should trim whitespace', () => {
            expect(sanitizeString('  hello  ')).toBe('hello')
        })

        it('should remove dangerous characters', () => {
            expect(sanitizeString('hello<script>alert(1)</script>')).toBe('hello')
            expect(sanitizeString('test<>test')).toBe('testtest')
        })

        it('should handle empty strings', () => {
            expect(sanitizeString('')).toBe('')
            expect(sanitizeString('   ')).toBe('')
        })
    })

    describe('sanitizeEmail', () => {
        it('should convert to lowercase and trim', () => {
            expect(sanitizeEmail('  TEST@EXAMPLE.COM  ')).toBe('test@example.com')
        })

        it('should handle already clean emails', () => {
            expect(sanitizeEmail('user@example.com')).toBe('user@example.com')
        })
    })

    describe('sanitizePhone', () => {
        it('should remove non-numeric characters', () => {
            expect(sanitizePhone('(11) 98765-4321')).toBe('11987654321')
            expect(sanitizePhone('+55 11 98765-4321')).toBe('5511987654321')
        })

        it('should handle already clean numbers', () => {
            expect(sanitizePhone('11987654321')).toBe('11987654321')
        })
    })

    describe('isPositiveNumber', () => {
        it('should validate positive numbers', () => {
            expect(isPositiveNumber(1)).toBe(true)
            expect(isPositiveNumber(100.5)).toBe(true)
            expect(isPositiveNumber(0.01)).toBe(true)
        })

        it('should reject zero and negative numbers', () => {
            expect(isPositiveNumber(0)).toBe(false)
            expect(isPositiveNumber(-1)).toBe(false)
            expect(isPositiveNumber(-0.5)).toBe(false)
        })
    })

    describe('isValidEmail', () => {
        it('should validate correct emails', () => {
            expect(isValidEmail('user@example.com')).toBe(true)
            expect(isValidEmail('test.user@domain.co.uk')).toBe(true)
        })

        it('should reject invalid emails', () => {
            expect(isValidEmail('invalid')).toBe(false)
            expect(isValidEmail('@example.com')).toBe(false)
            expect(isValidEmail('user@')).toBe(false)
        })
    })

    describe('isValidBrazilianPhone', () => {
        it('should validate 11-digit numbers', () => {
            expect(isValidBrazilianPhone('11987654321')).toBe(true)
        })

        it('should validate 10-digit numbers', () => {
            expect(isValidBrazilianPhone('1133334444')).toBe(true)
        })

        it('should reject invalid lengths', () => {
            expect(isValidBrazilianPhone('123')).toBe(false)
            expect(isValidBrazilianPhone('123456789012')).toBe(false)
        })

        it('should handle formatted numbers', () => {
            expect(isValidBrazilianPhone('(11) 98765-4321')).toBe(true)
        })
    })

    describe('isFutureDate', () => {
        it('should validate future dates', () => {
            const tomorrow = new Date()
            tomorrow.setDate(tomorrow.getDate() + 1)
            expect(isFutureDate(tomorrow)).toBe(true)
        })

        it('should reject past dates', () => {
            const yesterday = new Date()
            yesterday.setDate(yesterday.getDate() - 1)
            expect(isFutureDate(yesterday)).toBe(false)
        })
    })
})
