/**
 * Unit tests for business logic calculations
 */

import {
    calculateMaterialCost,
    calculateLaborCost,
    calculateSuggestedPrice,
    calculateOrderTotal,
    summarizeFinancials
} from '@/lib/logic'

describe('Business Logic', () => {
    describe('calculateMaterialCost', () => {
        it('should calculate total material cost', () => {
            const materials = [
                {
                    productId: '1',
                    materialId: '1',
                    quantity: 2,
                    unit: 'm',
                    material: { id: '1', name: 'Tecido', unit: 'm', cost: 50, quantity: 100, minQuantity: 10, supplierId: null }
                },
                {
                    productId: '1',
                    materialId: '2',
                    quantity: 1,
                    unit: 'un',
                    material: { id: '2', name: 'Botão', unit: 'un', cost: 5, quantity: 200, minQuantity: 20, supplierId: null }
                }
            ]

            const cost = calculateMaterialCost(materials)
            expect(cost).toBe(105) // (2 * 50) + (1 * 5)
        })

        it('should return 0 for empty materials', () => {
            expect(calculateMaterialCost([])).toBe(0)
        })
    })

    describe('calculateLaborCost', () => {
        it('should calculate labor cost based on hourly rate', () => {
            expect(calculateLaborCost(60)).toBe(20) // 1 hour at R$20/hour
            expect(calculateLaborCost(120)).toBe(40) // 2 hours
            expect(calculateLaborCost(30)).toBe(10) // 0.5 hours
        })

        it('should handle zero time', () => {
            expect(calculateLaborCost(0)).toBe(0)
        })
    })

    describe('calculateSuggestedPrice', () => {
        it('should calculate price with all components', () => {
            const product = {
                laborTime: 60,
                profitMargin: 50,
                materials: [
                    {
                        productId: '1',
                        materialId: '1',
                        quantity: 1,
                        unit: 'm',
                        material: { id: '1', name: 'Tecido', unit: 'm', cost: 100, quantity: 50, minQuantity: 5, supplierId: null }
                    }
                ]
            }

            const result = calculateSuggestedPrice(product)

            expect(result.materialCost).toBe(100)
            expect(result.laborCost).toBe(20)
            expect(result.baseCost).toBe(120)
            expect(result.marginValue).toBe(60) // 50% of 120
            expect(result.suggestedPrice).toBe(180)
        })

        it('should handle zero margin', () => {
            const product = {
                laborTime: 60,
                profitMargin: 0,
                materials: []
            }

            const result = calculateSuggestedPrice(product)
            expect(result.marginValue).toBe(0)
            expect(result.suggestedPrice).toBe(20) // Only labor cost
        })
    })

    describe('calculateOrderTotal', () => {
        it('should sum all order items', () => {
            const items = [
                { productId: '1', quantity: 2, price: 50 },
                { productId: '2', quantity: 1, price: 100 }
            ]

            expect(calculateOrderTotal(items)).toBe(200) // (2*50) + (1*100)
        })

        it('should return 0 for empty order', () => {
            expect(calculateOrderTotal([])).toBe(0)
        })
    })

    describe('summarizeFinancials', () => {
        it('should calculate financial summary', () => {
            const orders = [
                {
                    id: '1',
                    customerId: '1',
                    status: 'DELIVERED',
                    dueDate: new Date(),
                    totalValue: 200,
                    createdAt: new Date(),
                    customer: { id: '1', name: 'Cliente 1', phone: null, email: null, address: null, notes: null },
                    items: [
                        {
                            orderId: '1',
                            productId: '1',
                            quantity: 1,
                            price: 200,
                            product: {
                                id: '1',
                                name: 'Produto 1',
                                imageUrl: null,
                                laborTime: 60,
                                profitMargin: 50,
                                materials: [
                                    {
                                        productId: '1',
                                        materialId: '1',
                                        quantity: 1,
                                        unit: 'm',
                                        material: { id: '1', name: 'Tecido', unit: 'm', cost: 50, quantity: 100, minQuantity: 10, supplierId: null }
                                    }
                                ]
                            }
                        }
                    ]
                }
            ]

            const summary = summarizeFinancials(orders)

            expect(summary.totalRevenue).toBe(200)
            expect(summary.totalCosts).toBe(70) // 50 (material) + 20 (labor)
            expect(summary.totalProfit).toBe(130)
        })
    })
})
