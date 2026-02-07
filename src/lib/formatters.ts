/**
 * Formatting utilities for consistent data display across the application
 */

/**
 * Formats a number as Brazilian Real currency
 * @param value - The numeric value to format
 * @returns Formatted currency string (e.g., "R$ 1.234,56")
 */
export function formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    })
}

/**
 * Formats a Date object as Brazilian date format
 * @param date - The date to format
 * @returns Formatted date string (e.g., "27/01/2026")
 */
export function formatDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return new Intl.DateTimeFormat('pt-BR').format(dateObj)
}

/**
 * Formats a Date object as Brazilian date and time format
 * @param date - The date to format
 * @returns Formatted datetime string (e.g., "27/01/2026 10:30")
 */
export function formatDateTime(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(dateObj)
}

/**
 * Formats a phone number to Brazilian format
 * @param phone - The phone number string
 * @returns Formatted phone string (e.g., "(11) 99999-9999")
 */
export function formatPhone(phone: string): string {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '')

    // Format based on length
    if (cleaned.length === 11) {
        // Mobile: (XX) 9XXXX-XXXX
        return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
    } else if (cleaned.length === 10) {
        // Landline: (XX) XXXX-XXXX
        return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`
    }

    // Return as-is if format is unexpected
    return phone
}

/**
 * Formats a date for display in a long format
 * @param date - The date to format
 * @returns Formatted date string (e.g., "27 de janeiro de 2026")
 */
export function formatDateLong(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return new Intl.DateTimeFormat('pt-BR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(dateObj)
}

/**
 * Formats a number with Brazilian number format
 * @param value - The numeric value
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted number string (e.g., "1.234,56")
 */
export function formatNumber(value: number, decimals: number = 2): string {
    return value.toLocaleString('pt-BR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    })
}


