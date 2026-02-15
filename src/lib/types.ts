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
  tenant?: Tenant
}

export interface Tenant {
  id: string
  name: string
  slug: string
  plan: string // PlanType from subscription
  profile: 'CREATIVE' | 'RESELLER' | 'HYBRID'
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
  birthday: Date | null
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

export interface ProductInventory {
  id: string
  tenantId: string
  productId: string
  quantity: number
  minQuantity: number | null
  updatedAt: Date
  // Relations
  product?: Product
}

export interface ProductInventoryMovement {
  id: string
  tenantId: string
  productId: string
  type: ProductInventoryMovementType
  quantity: number
  reason: string
  reference: string | null
  createdAt: Date
  createdBy: string | null
}

export type ProductInventoryMovementType = 'ENTRADA' | 'SAIDA' | 'AJUSTE'

export interface Product {
  id: string
  tenantId: string
  name: string
  imageUrl: string | null
  description: string | null
  price: number | null
  laborTime: number
  profitMargin: number
  cost?: number // Average cost (MPM) for resale items
  lastCost?: number // From v_product_last_costs view (deprecated in favor of cost)
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
  orderNumber: number
  totalValue: number
  status: OrderStatus
  dueDate: Date
  discount?: number
  createdAt: Date
  updatedAt: Date
  publicId: string
}

export interface Campaign {
  id: string
  tenantId: string
  name: string
  messageText: string
  imageUrl: string | null
  campaignToken: string
  status: 'DRAFT' | 'COMPLETED'
  createdAt: Date
  updatedAt: Date
}

export interface CampaignRecipient {
  id: string
  campaignId: string
  customerId: string
  status: 'PENDING' | 'SENT' | 'FAILED'
  sentAt: Date | null
  errorMessage: string | null
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

export type OrderStatus =
  | 'QUOTATION'
  | 'PENDING'
  | 'PRODUCING'
  | 'READY'
  | 'DELIVERED'
  | 'CANCELLED'
export type Unit = 'm' | 'cm' | 'mm' | 'kg' | 'g' | 'l' | 'ml' | 'un' | 'pc' | 'par'
export type MovementType = 'IN' | 'OUT' | 'ADJUSTMENT' // Old, kept for compatibility if needed, but StockMovementType is preferred now
export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'LOGIN_FAILED'
  | 'Other'

export type StockMovementType =
  | 'ENTRADA'
  | 'SAIDA'
  | 'ENTRADA_AJUSTE'
  | 'SAIDA_AJUSTE'
  | 'PERDA'
  | 'RETIRADA'
export type StockMovementSource = 'MANUAL' | 'COMPRA' | 'PRODUCAO'

// ============================================================================
// Extended Types with Relations
// ============================================================================

export interface ProductWithMaterials extends Product {
  materials: (ProductMaterial & {
    material: Material
  })[]
}

export interface ProductQueryResponse extends Product {
  materials: (ProductMaterial & {
    material: Material & {
      v_material_last_costs: { last_cost: number }[]
    }
  })[]
  v_product_last_costs?: {
    last_cost_with_freight: number
  }[]
}

export interface MaterialQueryResponse extends Material {
  Supplier?: {
    name: string
  } | null
  v_material_last_costs?: {
    last_cost: number
  }[]
}

export interface AppSettings {
  id?: string
  tenantId?: string
  storeName?: string
  hourlyRate?: number
  phone?: string | null
  email?: string | null
  instagram?: string | null
  facebook?: string | null
  logoUrl?: string | null
  primaryColor?: string
  msgQuotation?: string | null
  msgApproved?: string | null
  msgReady?: string | null
  msgFinished?: string | null
  workingHoursPerMonth?: number
  desirableSalary?: number
  quotationValidityDays?: number
  defaultQuotationNotes?: string | null
  addressStreet?: string | null
  addressNumber?: string | null
  addressComplement?: string | null
  addressNeighborhood?: string | null
  addressCity?: string | null
  addressState?: string | null
  addressZip?: string | null
  defaultProfitMargin?: number
  monthlyFixedCosts?: Array<{
    id?: string
    label?: string
    value?: number
    amount?: number
    valor?: number
    custo?: number
  }>
  taxRate?: number
  cardFeeRate?: number
  targetMonthlyProfit?: number
  psychologicalPricingPattern?: string
  financialDisplayMode?: 'simple' | 'advanced' | string
  marginThresholdWarning?: number
  marginThresholdOptimal?: number
  whatsappPhoneNumberId?: string
  whatsappAccessToken?: string
  whatsappConfigVerified?: boolean
  [key: string]: unknown
}

export interface OrderWithDetails extends Order {
  customer: Customer
  items: (OrderItem & {
    product: ProductWithMaterials
  })[]
}

export interface OrderSummary {
  id: string
  orderNumber: number
  status: OrderStatus
  dueDate: Date
  totalValue: number
  createdAt: Date
  discount?: number
  customer: {
    id: string
    name: string
    phone: string | null
  }
  items: {
    productId: string
    quantity: number
    price: number
    discount?: number
    product: {
      name: string
    }
  }[]
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
  birthday?: Date | null
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
  description?: string | null
  price?: number | null
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
  contributionMargin: number
  contributionMarginPercentage: number
  breakEvenUnits: number
  breakEvenRevenue: number
  variableCostsTotal: number
  taxAmount: number
  cardFeeAmount: number
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
