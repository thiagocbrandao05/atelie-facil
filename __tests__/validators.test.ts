/**
 * Unit tests for validation utilities
 */

import { describe, it, expect } from 'vitest'
import {
  sanitizeString,
  sanitizeEmail,
  sanitizePhone,
  isPositiveNumber,
  isValidEmail,
  isValidBrazilianPhone,
  isFutureDate,
  clamp,
  isValidFileSize,
  isValidFileType,
  safeJsonParse,
  isValidUUID,
  isNonEmptyString,
  zodTransformers,
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

  describe('isNonEmptyString', () => {
    it('should validate non-empty strings', () => {
      expect(isNonEmptyString('hello')).toBe(true)
      expect(isNonEmptyString(' a ')).toBe(true)
    })

    it('should reject empty or whitespace-only strings', () => {
      expect(isNonEmptyString('')).toBe(false)
      expect(isNonEmptyString('   ')).toBe(false)
    })
  })

  describe('clamp', () => {
    it('should clamp values within range', () => {
      expect(clamp(5, 1, 10)).toBe(5)
      expect(clamp(0, 1, 10)).toBe(1)
      expect(clamp(11, 1, 10)).toBe(10)
    })
  })

  describe('isValidFileSize', () => {
    it('should validate file sizes', () => {
      expect(isValidFileSize(500, 1000)).toBe(true)
      expect(isValidFileSize(1000, 1000)).toBe(true)
    })

    it('should reject oversized or zero/negative sizes', () => {
      expect(isValidFileSize(1001, 1000)).toBe(false)
      expect(isValidFileSize(0, 1000)).toBe(false)
      expect(isValidFileSize(-1, 1000)).toBe(false)
    })
  })

  describe('isValidFileType', () => {
    it('should validate allowed file types', () => {
      const allowed = ['image/png', 'image/jpeg']
      expect(isValidFileType('image/png', allowed)).toBe(true)
      expect(isValidFileType('application/pdf', allowed)).toBe(false)
    })
  })

  describe('safeJsonParse', () => {
    it('should parse valid JSON', () => {
      expect(safeJsonParse('{"a": 1}', {})).toEqual({ a: 1 })
    })

    it('should return fallback for invalid JSON', () => {
      expect(safeJsonParse('invalid', { error: true })).toEqual({ error: true })
    })
  })

  describe('isValidUUID', () => {
    it('should validate correct UUIDs', () => {
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
    })

    it('should reject invalid UUID formats', () => {
      expect(isValidUUID('not-a-uuid')).toBe(false)
      expect(isValidUUID('550e8400e29b41d4a716446655440000')).toBe(false)
    })
  })

  describe('zodTransformers', () => {
    it('should transform trimmedString', () => {
      expect(zodTransformers.trimmedString.parse('  hello  ')).toBe('hello')
    })

    it('should transform email', () => {
      expect(zodTransformers.email.parse(' TEST@EXAMPLE.COM ')).toBe('test@example.com')
    })

    it('should transform phone', () => {
      expect(zodTransformers.phone.parse('(11) 98765-4321')).toBe('11987654321')
    })

    it('should validate positiveNumber', () => {
      expect(zodTransformers.positiveNumber.parse(10)).toBe(10)
      expect(() => zodTransformers.positiveNumber.parse(-1)).toThrow()
    })

    it('should validate futureDate', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      expect(zodTransformers.futureDate.parse(tomorrow)).toEqual(tomorrow)

      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      expect(() => zodTransformers.futureDate.parse(yesterday)).toThrow()
    })
  })
})
