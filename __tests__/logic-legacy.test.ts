import { describe, it, expect } from 'vitest'
import { calculateMaterialCost, calculateLaborCost, calculateSuggestedPrice, calculateOrderTotal, summarizeFinancials, HOURLY_RATE } from '../lib/logic'

describe('Logic Calculations', () => {
    describe('calculateMaterialCost', () => {
        it('should return 0 for empty materials list', () => {
            expect(calculateMaterialCost([])).toBe(0)
        })

        it('should calculate the total cost correctly', () => {
            const materials = [
                { material: { cost: 10, name: 'Mat1', id: '1', unit: 'm', quantity: 100, minQuantity: 0, supplierId: null }, quantity: 2, productId: 'p1', materialId: '1', unit: 'm' },
                { material: { cost: 5, name: 'Mat2', id: '2', unit: 'cm', quantity: 100, minQuantity: 0, supplierId: null }, quantity: 3, productId: 'p1', materialId: '2', unit: 'cm' },
            ]
            // (10 * 2) + (5 * 3) = 20 + 15 = 35
            expect(calculateMaterialCost(materials)).toBe(35)
        })
    })

    describe('calculateLaborCost', () => {
        it('should calculate labor cost based on hourly rate', () => {
            // (60 / 60) * 20 = 20
            expect(calculateLaborCost(60)).toBe(HOURLY_RATE)
            // (30 / 60) * 20 = 10
            expect(calculateLaborCost(30)).toBe(10)
        })
    })

    describe('calculateSuggestedPrice', () => {
        it('should calculate suggested price with profit margin', () => {
            const product = {
                laborTime: 60, // 20 cost
                profitMargin: 50, // 50%
                materials: [
                    { material: { cost: 10, name: 'Mat1', id: '1', unit: 'm', quantity: 100, minQuantity: 0, supplierId: null }, quantity: 1, productId: 'p1', materialId: '1', unit: 'm' } // 10 cost
                ]
            }
            // Base cost = 20 + 10 = 30
            // Margin = 30 * 0.5 = 15
            // Total = 30 + 15 = 45
            const result = calculateSuggestedPrice(product as any)
            expect(result.suggestedPrice).toBe(45)
        })
    })

    describe('summarizeFinancials', () => {
        it('should summarize revenue and profit correctly', () => {
            const orders = [
                {
                    totalValue: 100,
                    items: [
                        {
                            orderId: 'o1',
                            productId: 'p1',
                            quantity: 1,
                            price: 100,
                            product: {
                                id: 'p1',
                                name: 'Product 1',
                                imageUrl: null,
                                laborTime: 60, // 20 lab cost
                                profitMargin: 50,
                                materials: [
                                    { material: { cost: 30, name: 'Mat', id: '1', unit: 'm', quantity: 100, minQuantity: 0, supplierId: null }, quantity: 1, productId: 'p1', materialId: '1', unit: 'm' } // 30 mat cost
                                ]
                            }
                        }
                    ]
                }
            ]
            // Revenue: 100
            // Cost: 20 + 30 = 50
            // Profit: 50
            const summary = summarizeFinancials(orders)
            expect(summary.totalRevenue).toBe(100)
            expect(summary.totalCosts).toBe(50)
            expect(summary.totalProfit).toBe(50)
        })
    })
})
