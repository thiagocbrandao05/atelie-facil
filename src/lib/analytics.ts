/**
 * Analytics and metrics calculation library
 */

import type { OrderWithDetails, Material } from './types'
import { summarizeFinancials, calculateMaterialCost, calculateLaborCost } from './logic'

export interface DashboardMetrics {
  totalRevenue: number
  totalCosts: number
  totalProfit: number
  profitMargin: number
  activeOrders: number
  completedOrders: number
  pendingOrders: number
  lowStockItems: number
}

export interface RevenueByPeriod {
  period: string
  revenue: number
  costs: number
  profit: number
}

export interface OrdersByStatus {
  status: string
  count: number
  value: number
}

export interface TopProduct {
  name: string
  quantity: number
  revenue: number
}

/**
 * Get orders grouped by status
 */
export function getOrdersByStatus(orders: OrderWithDetails[]): OrdersByStatus[] {
  const statusMap = new Map<string, { count: number; value: number }>()

  orders.forEach(order => {
    const existing = statusMap.get(order.status) || { count: 0, value: 0 }
    statusMap.set(order.status, {
      count: existing.count + 1,
      value: existing.value + order.totalValue,
    })
  })

  return Array.from(statusMap.entries()).map(([status, data]) => ({
    status,
    count: data.count,
    value: data.value,
  }))
}

/**
 * Get top selling products
 */
export function getTopProducts(orders: OrderWithDetails[], limit: number = 5): TopProduct[] {
  const productMap = new Map<string, { quantity: number; revenue: number }>()

  orders.forEach(order => {
    order.items.forEach(item => {
      const existing = productMap.get(item.product.name) || { quantity: 0, revenue: 0 }
      productMap.set(item.product.name, {
        quantity: existing.quantity + item.quantity,
        revenue: existing.revenue + item.price * item.quantity,
      })
    })
  })

  return Array.from(productMap.entries())
    .map(([name, data]) => ({
      name,
      quantity: data.quantity,
      revenue: data.revenue,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit)
}

/**
 * Filter orders by date range
 */
export function filterOrdersByDateRange(
  orders: OrderWithDetails[],
  startDate: Date,
  endDate: Date
): OrderWithDetails[] {
  return orders.filter(order => {
    const orderDate = new Date(order.createdAt)
    return orderDate >= startDate && orderDate <= endDate
  })
}

/**
 * Get date range presets
 */
export function getDateRangePreset(preset: 'today' | 'week' | 'month' | 'quarter' | 'year'): {
  start: Date
  end: Date
} {
  const now = new Date()
  const start = new Date()

  switch (preset) {
    case 'today':
      start.setHours(0, 0, 0, 0)
      break
    case 'week':
      start.setDate(now.getDate() - 7)
      break
    case 'month':
      start.setMonth(now.getMonth() - 1)
      break
    case 'quarter':
      start.setMonth(now.getMonth() - 3)
      break
    case 'year':
      start.setFullYear(now.getFullYear() - 1)
      break
  }

  return { start, end: now }
}

/**
 * Calculate dashboard metrics
 */
export function calculateDashboardMetrics(
  orders: OrderWithDetails[],
  materials: any[] = []
): DashboardMetrics {
  const financials = summarizeFinancials(orders)

  const activeOrders = orders.filter(o => !['DELIVERED', 'CANCELLED'].includes(o.status)).length
  const completedOrders = orders.filter(o => o.status === 'DELIVERED').length
  const pendingOrders = orders.filter(o => o.status === 'PENDING').length

  const lowStockItems = materials.filter(
    m => (m.quantity || 0) < (m.minQuantity || 0)
  ).length

  const profitMargin =
    financials.totalRevenue > 0
      ? (financials.totalProfit / financials.totalRevenue) * 100
      : 0

  return {
    ...financials,
    profitMargin,
    activeOrders,
    completedOrders,
    pendingOrders,
    lowStockItems,
  }
}
