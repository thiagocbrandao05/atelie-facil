/**
 * Application-wide constants
 */

/**
 * Hourly rate for labor cost calculations (in BRL)
 */
export const HOURLY_RATE = 20

/**
 * Order status enum
 */
export const ORDER_STATUS = {
    QUOTATION: 'QUOTATION',
    PENDING: 'PENDING',
    PRODUCING: 'PRODUCING',
    READY: 'READY',
    DELIVERED: 'DELIVERED'
} as const

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS]

/**
 * Order status labels in Portuguese
 */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
    QUOTATION: 'Orçamento',
    PENDING: 'Aguardando Início',
    PRODUCING: 'Em Produção',
    READY: 'Pronto p/ Entrega',
    DELIVERED: 'Entregue'
}

/**
 * Order status colors for UI
 */
export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
    QUOTATION: 'secondary',
    PENDING: 'outline',
    PRODUCING: 'default',
    READY: 'secondary',
    DELIVERED: 'outline'
}

/**
 * Supported measurement units
 */
export const UNITS = {
    // Length
    M: 'm',
    CM: 'cm',
    MM: 'mm',

    // Weight
    KG: 'kg',
    G: 'g',

    // Volume
    L: 'l',
    ML: 'ml',

    // Quantity
    UN: 'un',
    PC: 'pc',
    PAR: 'par'
} as const

export type Unit = typeof UNITS[keyof typeof UNITS]

/**
 * Unit labels in Portuguese
 */
export const UNIT_LABELS: Record<Unit, string> = {
    m: 'Metro',
    cm: 'Centímetro',
    mm: 'Milímetro',
    kg: 'Quilograma',
    g: 'Grama',
    l: 'Litro',
    ml: 'Mililitro',
    un: 'Unidade',
    pc: 'Peça',
    par: 'Par'
}

/**
 * Pagination defaults
 */
export const PAGINATION = {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100
} as const

/**
 * File upload limits
 */
export const UPLOAD_LIMITS = {
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'] as const
} as const

/**
 * Date format patterns
 */
export const DATE_FORMATS = {
    SHORT: 'dd/MM/yyyy',
    LONG: 'dd de MMMM de yyyy',
    WITH_TIME: 'dd/MM/yyyy HH:mm'
} as const


