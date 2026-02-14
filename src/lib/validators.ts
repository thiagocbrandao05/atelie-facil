/**
 * Validation utilities and sanitization helpers
 */

import { z } from 'zod'

/**
 * Sanitizes a string by trimming whitespace and removing dangerous characters
 */
export function sanitizeString(str: string): string {
  // Remove HTML tags completely (including content for script/style tags)
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim()
}

/**
 * Validates and sanitizes an email address
 */
export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/**
 * Validates and sanitizes a phone number
 */
export function sanitizePhone(phone: string): string {
  // Remove all non-numeric characters
  return phone.replace(/\D/g, '')
}

/**
 * Validates that a number is positive
 */
export function isPositiveNumber(value: number): boolean {
  return value > 0 && !isNaN(value) && isFinite(value)
}

/**
 * Validates that a string is not empty after trimming
 */
export function isNonEmptyString(value: string): boolean {
  return value.trim().length > 0
}

/**
 * Validates a Brazilian phone number format
 */
export function isValidBrazilianPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '')
  return cleaned.length === 10 || cleaned.length === 11
}

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validates a date is in the future
 */
export function isFutureDate(date: Date): boolean {
  return date > new Date()
}

/**
 * Clamps a number between min and max values
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Validates file size
 */
export function isValidFileSize(size: number, maxSize: number): boolean {
  return size > 0 && size <= maxSize
}

/**
 * Validates file type
 */
export function isValidFileType(type: string, allowedTypes: readonly string[]): boolean {
  return allowedTypes.includes(type)
}

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json)
  } catch {
    return fallback
  }
}

/**
 * Validates UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

/**
 * Zod schema transformers
 */
export const zodTransformers = {
  trimmedString: z.string().transform(sanitizeString),
  email: z.string().trim().email().transform(sanitizeEmail),
  phone: z.string().transform(sanitizePhone),
  positiveNumber: z.number().refine(isPositiveNumber, 'Deve ser um número positivo'),
  futureDate: z.date().refine(isFutureDate, 'A data deve ser futura'),
}
