import { describe, it, expect } from 'vitest'
import {
  getOrdersByStatus,
  getTopProducts,
  filterOrdersByDateRange,
  getDateRangePreset,
  calculateDashboardMetrics,
} from '@/lib/analytics'
import { OrderWithDetails } from '@/lib/types'

const mockDate = new Date('2024-01-01T12:00:00Z')

const mockOrders: any[] = [
  {
    id: '1',
    status: 'PENDING',
    totalValue: 100,
    createdAt: mockDate.toISOString(),
    items: [{ product: { name: 'Product A', materials: [] }, quantity: 2, price: 50 }],
  },
  {
    id: '2',
    status: 'DELIVERED',
    totalValue: 200,
    createdAt: mockDate.toISOString(),
    items: [
      { product: { name: 'Product B', materials: [] }, quantity: 1, price: 200 },
      { product: { name: 'Product A', materials: [] }, quantity: 1, price: 50 },
    ],
  },
  {
    id: '3',
    status: 'PENDING',
    totalValue: 50,
    createdAt: new Date('2023-12-01T12:00:00Z').toISOString(),
    items: [{ product: { name: 'Product C', materials: [] }, quantity: 5, price: 10 }],
  },
]

describe('Analytics Utils', () => {
  describe('getOrdersByStatus', () => {
    it('should correctly group orders by status', () => {
      const result = getOrdersByStatus(mockOrders)
      expect(result).toHaveLength(2)

      const pending = result.find(r => r.status === 'PENDING')
      const delivered = result.find(r => r.status === 'DELIVERED')

      expect(pending?.count).toBe(2)
      expect(pending?.value).toBe(150)
      expect(delivered?.count).toBe(1)
      expect(delivered?.value).toBe(200)
    })

    it('should return empty array for no orders', () => {
      expect(getOrdersByStatus([])).toEqual([])
    })
  })

  describe('getTopProducts', () => {
    it('should return top products sorted by revenue', () => {
      const result = getTopProducts(mockOrders)
      expect(result).toHaveLength(3)

      // Product B: 1 * 200 = 200
      // Product A: (2 * 50) + (1 * 50) = 150
      // Product C: 5 * 10 = 50

      expect(result[0].name).toBe('Product B')
      expect(result[0].revenue).toBe(200)
      expect(result[1].name).toBe('Product A')
      expect(result[1].revenue).toBe(150)
      expect(result[2].name).toBe('Product C')
      expect(result[2].revenue).toBe(50)
    })

    it('should respect the limit parameter', () => {
      const result = getTopProducts(mockOrders, 1)
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Product B')
    })
  })

  describe('filterOrdersByDateRange', () => {
    it('should filter orders within date range', () => {
      const start = new Date('2024-01-01T00:00:00Z')
      const end = new Date('2024-01-01T23:59:59Z')
      const result = filterOrdersByDateRange(mockOrders, start, end)
      expect(result).toHaveLength(2)
      expect(result.every(o => o.id !== '3')).toBe(true)
    })
  })

  describe('getDateRangePreset', () => {
    it('should return correct ranges for all presets', () => {
      const presets = ['today', 'week', 'month', 'quarter', 'year'] as const
      presets.forEach(preset => {
        const range = getDateRangePreset(preset)
        expect(range.start).toBeInstanceOf(Date)
        expect(range.end).toBeInstanceOf(Date)
        expect(range.start.getTime()).toBeLessThanOrEqual(range.end.getTime())
      })
    })
  })

  describe('calculateDashboardMetrics', () => {
    it('should calculate all dashboard metrics correctly', () => {
      const mockMaterials = [
        { id: 'm1', quantity: 5, minQuantity: 10 }, // Low stock
        { id: 'm2', quantity: 20, minQuantity: 10 }, // OK
        { id: 'm3', quantity: 0, minQuantity: 5 }, // Low stock
      ]

      const metrics = calculateDashboardMetrics(mockOrders, mockMaterials)

      expect(metrics.activeOrders).toBe(2) // 2 Pending
      expect(metrics.completedOrders).toBe(1) // 1 Delivered
      expect(metrics.pendingOrders).toBe(2)
      expect(metrics.lowStockItems).toBe(2)
      expect(metrics.totalRevenue).toBe(350)
    })

    it('should handle zero revenue for profit margin', () => {
      const metrics = calculateDashboardMetrics([])
      expect(metrics.profitMargin).toBe(0)
    })

    it('should handle materials with missing quantity data', () => {
      const mockMaterials = [{ id: 'm1', minQuantity: 10 }]
      const metrics = calculateDashboardMetrics([], mockMaterials)
      expect(metrics.lowStockItems).toBe(1)
    })
  })
})
