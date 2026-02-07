/**
 * Unit tests for analytics utilities
 */

import {
    calculateDashboardMetrics,
    getRevenueByMonth,
    getOrdersByStatus,
    getTopProducts
} from '@/lib/analytics'

describe('Analytics', () => {
    const mockOrders = [
        {
            id: '1',
            customerId: 'c1',
            status: 'DELIVERED',
            dueDate: new Date('2026-01-25'),
            totalValue: 200,
            createdAt: new Date('2026-01-20'),
            customer: { id: 'c1', name: 'João', phone: null, email: null, address: null, notes: null },
            items: [
                {
                    orderId: '1',
                    productId: 'p1',
                    quantity: 2,
                    price: 100,
                    product: {
                        id: 'p1',
                        name: 'Camisa',
                        imageUrl: null,
                        laborTime: 60,
                        profitMargin: 50,
                        materials: [
                            {
                                productId: 'p1',
                                materialId: 'm1',
                                quantity: 1,
                                unit: 'm',
                                material: { id: 'm1', name: 'Tecido', unit: 'm', cost: 30, quantity: 100, minQuantity: 10, supplierId: null }
                            }
                        ]
                    }
                }
            ]
        },
        {
            id: '2',
            customerId: 'c2',
            status: 'PENDING',
            dueDate: new Date('2026-02-01'),
            totalValue: 150,
            createdAt: new Date('2026-01-22'),
            customer: { id: 'c2', name: 'Maria', phone: null, email: null, address: null, notes: null },
            items: [
                {
                    orderId: '2',
                    productId: 'p2',
                    quantity: 1,
                    price: 150,
                    product: {
                        id: 'p2',
                        name: 'Vestido',
                        imageUrl: null,
                        laborTime: 120,
                        profitMargin: 60,
                        materials: []
                    }
                }
            ]
        }
    ]

    const mockMaterials = [
        { id: 'm1', name: 'Tecido', unit: 'm', cost: 30, quantity: 5, minQuantity: 10, supplierId: null },
        { id: 'm2', name: 'Linha', unit: 'un', cost: 5, quantity: 50, minQuantity: 20, supplierId: null }
    ]

    describe('calculateDashboardMetrics', () => {
        it('should calculate all metrics correctly', () => {
            const metrics = calculateDashboardMetrics(mockOrders, mockMaterials)

            expect(metrics.totalRevenue).toBe(350)
            expect(metrics.activeOrders).toBe(1) // PENDING
            expect(metrics.completedOrders).toBe(1) // DELIVERED
            expect(metrics.pendingOrders).toBe(1)
            expect(metrics.lowStockItems).toBe(1) // Tecido is below minQuantity
        })

        it('should calculate profit margin', () => {
            const metrics = calculateDashboardMetrics(mockOrders, mockMaterials)
            expect(metrics.profitMargin).toBeGreaterThan(0)
        })
    })

    describe('getRevenueByMonth', () => {
        it('should group revenue by month', () => {
            const revenue = getRevenueByMonth(mockOrders)

            expect(revenue).toHaveLength(1) // All orders in same month
            expect(revenue[0].period).toBe('2026-01')
            expect(revenue[0].revenue).toBe(350)
        })

        it('should calculate costs and profit', () => {
            const revenue = getRevenueByMonth(mockOrders)

            expect(revenue[0].costs).toBeGreaterThan(0)
            expect(revenue[0].profit).toBe(revenue[0].revenue - revenue[0].costs)
        })
    })

    describe('getOrdersByStatus', () => {
        it('should group orders by status', () => {
            const byStatus = getOrdersByStatus(mockOrders)

            expect(byStatus).toHaveLength(2)

            const delivered = byStatus.find(s => s.status === 'DELIVERED')
            expect(delivered?.count).toBe(1)
            expect(delivered?.value).toBe(200)

            const pending = byStatus.find(s => s.status === 'PENDING')
            expect(pending?.count).toBe(1)
            expect(pending?.value).toBe(150)
        })
    })

    describe('getTopProducts', () => {
        it('should return top products by revenue', () => {
            const top = getTopProducts(mockOrders, 5)

            expect(top).toHaveLength(2)
            expect(top[0].name).toBe('Camisa') // Higher revenue (2 * 100)
            expect(top[0].revenue).toBe(200)
            expect(top[0].quantity).toBe(2)
        })

        it('should limit results', () => {
            const top = getTopProducts(mockOrders, 1)
            expect(top).toHaveLength(1)
        })
    })
})
