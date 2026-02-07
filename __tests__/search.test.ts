/**
 * Unit tests for search utilities
 */

import {
    searchOrders,
    searchProducts,
    searchMaterials,
    searchCustomers
} from '@/lib/search'

describe('Search Utilities', () => {
    const mockOrders = [
        {
            id: '1',
            customerId: 'c1',
            status: 'PENDING',
            dueDate: new Date('2026-02-01'),
            totalValue: 100,
            createdAt: new Date('2026-01-20'),
            customer: { id: 'c1', name: 'João Silva', phone: null, email: null, address: null, notes: null },
            items: [
                {
                    orderId: '1',
                    productId: 'p1',
                    quantity: 1,
                    price: 100,
                    product: { id: 'p1', name: 'Camisa', imageUrl: null, laborTime: 60, profitMargin: 50, materials: [] }
                }
            ]
        },
        {
            id: '2',
            customerId: 'c2',
            status: 'DELIVERED',
            dueDate: new Date('2026-01-25'),
            totalValue: 200,
            createdAt: new Date('2026-01-15'),
            customer: { id: 'c2', name: 'Maria Santos', phone: null, email: null, address: null, notes: null },
            items: [
                {
                    orderId: '2',
                    productId: 'p2',
                    quantity: 1,
                    price: 200,
                    product: { id: 'p2', name: 'Vestido', imageUrl: null, laborTime: 120, profitMargin: 60, materials: [] }
                }
            ]
        }
    ]

    describe('searchOrders', () => {
        it('should search by customer name', () => {
            const results = searchOrders(mockOrders, { query: 'João' })
            expect(results).toHaveLength(1)
            expect(results[0].customer.name).toBe('João Silva')
        })

        it('should search by product name', () => {
            const results = searchOrders(mockOrders, { query: 'Vestido' })
            expect(results).toHaveLength(1)
            expect(results[0].items[0].product.name).toBe('Vestido')
        })

        it('should filter by status', () => {
            const results = searchOrders(mockOrders, { status: 'PENDING' })
            expect(results).toHaveLength(1)
            expect(results[0].status).toBe('PENDING')
        })

        it('should filter by value range', () => {
            const results = searchOrders(mockOrders, { minValue: 150 })
            expect(results).toHaveLength(1)
            expect(results[0].totalValue).toBe(200)
        })

        it('should combine multiple filters', () => {
            const results = searchOrders(mockOrders, {
                status: 'DELIVERED',
                minValue: 100
            })
            expect(results).toHaveLength(1)
            expect(results[0].status).toBe('DELIVERED')
        })

        it('should return all orders when no filters', () => {
            const results = searchOrders(mockOrders, {})
            expect(results).toHaveLength(2)
        })
    })

    describe('searchProducts', () => {
        const mockProducts = [
            {
                id: 'p1',
                name: 'Camisa Polo',
                imageUrl: null,
                laborTime: 60,
                profitMargin: 50,
                materials: []
            },
            {
                id: 'p2',
                name: 'Vestido Longo',
                imageUrl: null,
                laborTime: 120,
                profitMargin: 60,
                materials: []
            }
        ]

        it('should find exact matches', () => {
            const results = searchProducts(mockProducts, 'Camisa')
            expect(results).toHaveLength(1)
            expect(results[0].name).toBe('Camisa Polo')
        })

        it('should find partial matches', () => {
            const results = searchProducts(mockProducts, 'vest')
            expect(results).toHaveLength(1)
            expect(results[0].name).toBe('Vestido Longo')
        })

        it('should return all when query is empty', () => {
            const results = searchProducts(mockProducts, '')
            expect(results).toHaveLength(2)
        })
    })

    describe('searchMaterials', () => {
        const mockMaterials = [
            { id: 'm1', name: 'Tecido Algodão', unit: 'm', cost: 50, quantity: 100, minQuantity: 10, supplierId: null },
            { id: 'm2', name: 'Linha Poliéster', unit: 'un', cost: 5, quantity: 200, minQuantity: 20, supplierId: null }
        ]

        it('should search materials by name', () => {
            const results = searchMaterials(mockMaterials, 'Tecido')
            expect(results).toHaveLength(1)
            expect(results[0].name).toBe('Tecido Algodão')
        })

        it('should be case insensitive', () => {
            const results = searchMaterials(mockMaterials, 'linha')
            expect(results).toHaveLength(1)
            expect(results[0].name).toBe('Linha Poliéster')
        })
    })

    describe('searchCustomers', () => {
        const mockCustomers = [
            { id: 'c1', name: 'João Silva', phone: '11987654321', email: 'joao@example.com', address: null, notes: null },
            { id: 'c2', name: 'Maria Santos', phone: '11976543210', email: 'maria@example.com', address: null, notes: null }
        ]

        it('should search by name', () => {
            const results = searchCustomers(mockCustomers, 'João')
            expect(results).toHaveLength(1)
            expect(results[0].name).toBe('João Silva')
        })

        it('should search by phone', () => {
            const results = searchCustomers(mockCustomers, '11987654321')
            expect(results).toHaveLength(1)
            expect(results[0].phone).toBe('11987654321')
        })

        it('should search by email', () => {
            const results = searchCustomers(mockCustomers, 'maria@')
            expect(results).toHaveLength(1)
            expect(results[0].email).toBe('maria@example.com')
        })
    })
})
