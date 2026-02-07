/**
 * Centralized type definitions for the application
 * Replaces Prisma generated types with manual interface definitions
 */

// ============================================================================
// Database Models - Base Types
// ============================================================================

export type TenantId = string

export interface User {
    id: string
    name: string | null
    email: string | null
    emailVerified: Date | null
    image: string | null
    passwordHash: string | null
    tenantId: string
    role: string
    createdAt: Date
    updatedAt: Date
}

export interface Tenant {
    id: string
    name: string
    slug: string
    plan: string
    createdAt: Date
    updatedAt: Date
}

export interface Customer {
    id: string
    tenantId: string
    name: string
    phone: string | null
    email: string | null
    address: string | null
    notes: string | null
    createdAt: Date
    updatedAt: Date
}

export interface CustomerMeasurement {
    id: string
    tenantId: string
    customerId: string
    name: string
    value: string
    unit: string | null
    notes: string | null
    createdAt: Date
    updatedAt: Date
}

export interface Material {
    id: string
    tenantId: string
    name: string
    unit: string
    quantity: number // @deprecated - calculated from StockMovement
    minQuantity: number | null
    supplierId: string | null
    colors: string[] | null // New field
    cost?: number // Dynamically populated from last purchase
    createdAt: Date
    updatedAt: Date
}

export interface StockEntry {
    id: string
    tenantId: string
    supplierName: string
    freightCost: number
    totalCost: number
    createdAt: Date
    // Relations
    items?: StockEntryItem[]
}

export interface StockEntryItem {
    id: string
    tenantId: string
    stockEntryId: string
    materialId: string
    color: string | null
    quantity: number
    unitCost: number
    subtotal: number
    // Relations
    material?: Material
}

export interface StockMovement {
    id: string
    tenantId: string
    materialId: string
    color: string | null
    type: StockMovementType
    quantity: number
    note: string | null
    source: StockMovementSource
    createdAt: Date
    // Relations
    material?: Material
}

// ... existing types ...

export interface Product {
    id: string
    tenantId: string
    name: string
    imageUrl: string | null
    laborTime: number
    profitMargin: number
    createdAt: Date
    updatedAt: Date
}

export interface ProductMaterial {
    id: string
    productId: string
    materialId: string
    quantity: number
    unit: string
    color: string | null
}

export interface Order {
    id: string
    tenantId: string
    customerId: string
    totalValue: number
    status: OrderStatus
    dueDate: Date
    discount?: number
    createdAt: Date
    updatedAt: Date
}

export interface OrderItem {
    id: string
    orderId: string
    productId: string
    quantity: number
    price: number
    discount?: number
}

export interface Supplier {
    id: string
    tenantId: string
    name: string
    contact: string | null
    phone: string | null
    email: string | null
    address: string | null
    notes: string | null
    createdAt: Date
    updatedAt: Date
}

export interface InventoryMovement {
    id: string
    tenantId: string
    materialId: string
    type: MovementType
    quantity: number
    reason: string
    reference: string | null
    createdAt: Date
}

export interface AuditLog {
    id: string
    tenantId: string
    userId: string
    action: AuditAction
    entity: string
    entityId: string
    details: any
    createdAt: Date
}

export interface Notification {
    id: string
    tenantId: string
    userId: string
    title: string
    message: string
    type: string
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
    read: boolean
    readAt: Date | null
    createdAt: Date
}

// ============================================================================
// Enums / Unions
// ============================================================================

export type OrderStatus = 'QUOTATION' | 'PENDING' | 'PRODUCING' | 'READY' | 'DELIVERED' | 'CANCELLED'
export type Unit = 'm' | 'cm' | 'mm' | 'kg' | 'g' | 'l' | 'ml' | 'un' | 'pc' | 'par'
export type MovementType = 'IN' | 'OUT' | 'ADJUSTMENT' // Old, kept for compatibility if needed, but StockMovementType is preferred now
export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED' | 'Other'

export type StockMovementType = 'ENTRADA' | 'SAIDA' | 'ENTRADA_AJUSTE' | 'SAIDA_AJUSTE' | 'PERDA' | 'RETIRADA'
export type StockMovementSource = 'MANUAL' | 'COMPRA' | 'PRODUCAO'

// ============================================================================
// Extended Types with Relations
// ============================================================================

export interface ProductWithMaterials extends Product {
    materials: (ProductMaterial & {
        material: Material
    })[]
}

export interface OrderWithDetails extends Order {
    customer: Customer
    items: (OrderItem & {
        product: ProductWithMaterials
    })[]
}

export interface OrderItemWithProduct extends OrderItem {
    product: ProductWithMaterials
}

export interface MaterialWithProducts extends Material {
    products: {
        product: Product
    }[]
}

export interface CustomerWithOrders extends Customer {
    orders: Order[]
}

// ============================================================================
// Form Data Types
// ============================================================================

export interface CustomerFormData {
    name: string
    phone?: string | null
    email?: string | null
    address?: string | null
    notes?: string | null
}

export interface MaterialFormData {
    name: string
    unit: string
    cost: number
    quantity: number
    minQuantity?: number | null
}

export interface ProductMaterialInput {
    materialId: string
    quantity: number
    unit: string
}

export interface ProductFormData {
    name: string
    imageUrl?: string | null
    laborTime: number
    profitMargin: number
    materials: ProductMaterialInput[]
}

export interface OrderItemInput {
    productId: string
    quantity: number
    price: number
    discount?: number
}

export interface OrderFormData {
    customerId: string
    dueDate: Date | string
    status?: string
    items: OrderItemInput[]
    discount?: number
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ActionResponse<T = any> {
    success: boolean
    message: string
    errors?: Record<string, string[]>
    data?: T
}

export interface PaginatedResponse<T> {
    data: T[]
    total: number
    page: number
    pageSize: number
    totalPages: number
}

// ============================================================================
// Business Logic Types
// ============================================================================

export interface PriceCalculation {
    materialCost: number
    laborCost: number
    fixedCost: number
    baseCost: number
    marginValue: number
    suggestedPrice: number
    materials?: (ProductMaterial & { material: Material })[]
}

export interface StockAvailability {
    isAvailable: boolean
    missingMaterials: {
        name: string
        required: number
        available: number
    }[]
}

export interface FinancialSummary {
    totalRevenue: number
    totalCosts: number
    totalProfit: number
}

// ============================================================================
// UI Component Types
// ============================================================================

export interface DialogState {
    open: boolean
    setOpen: (open: boolean) => void
}

export interface FormState<T = any> extends ActionResponse<T> {
    isPending: boolean
}

// ============================================================================
// Type Guards
// ============================================================================

export function isProductWithMaterials(product: any): product is ProductWithMaterials {
    return product && Array.isArray(product.materials)
}

export function isOrderWithDetails(order: any): order is OrderWithDetails {
    return order && order.customer && Array.isArray(order.items)
}


