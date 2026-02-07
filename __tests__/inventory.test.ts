import { describe, it, expect, vi, beforeEach } from 'vitest'
import { checkStockAvailability, deductStockForOrder } from '../lib/inventory'
import { prisma } from '../lib/prisma'

vi.mock('../lib/prisma', () => ({
    prisma: {
        orderItem: {
            findMany: vi.fn(),
        },
        material: {
            update: vi.fn(),
        },
        $transaction: vi.fn((callback) => callback(prisma)),
    },
}))

describe('Inventory Automation', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('checkStockAvailability', () => {
        it('should return isAvailable: true if stock is sufficient', async () => {
            const mockItems = [
                {
                    quantity: 2, // Order 2 products
                    product: {
                        materials: [
                            {
                                materialId: 'm1',
                                quantity: 5, // Each needs 5 units
                                material: { name: 'Mat1', quantity: 20 } // 20 units in stock
                            }
                        ]
                    }
                }
            ]
                ; (prisma.orderItem.findMany as any).mockResolvedValue(mockItems)

            const result = await checkStockAvailability('order1')
            // Need 2 * 5 = 10. Have 20. Should be OK.
            expect(result.isAvailable).toBe(true)
            expect(result.missingMaterials).toHaveLength(0)
        })

        it('should return missing materials if stock is insufficient', async () => {
            const mockItems = [
                {
                    quantity: 2,
                    product: {
                        materials: [
                            {
                                materialId: 'm1',
                                quantity: 15, // Need 15 each -> 30 total
                                material: { name: 'Mat1', quantity: 20 } // Have 20
                            }
                        ]
                    }
                }
            ]
                ; (prisma.orderItem.findMany as any).mockResolvedValue(mockItems)

            const result = await checkStockAvailability('order1')
            expect(result.isAvailable).toBe(false)
            expect(result.missingMaterials).toHaveLength(1)
            expect(result.missingMaterials[0].name).toBe('Mat1')
        })
    })

    describe('deductStockForOrder', () => {
        it('should call update for each material with correct decrement', async () => {
            const mockItems = [
                {
                    quantity: 2,
                    product: {
                        materials: [
                            { materialId: 'm1', quantity: 5 }
                        ]
                    }
                }
            ]
                ; (prisma.orderItem.findMany as any).mockResolvedValue(mockItems)

            await deductStockForOrder('order1')

            expect(prisma.material.update).toHaveBeenCalledWith({
                where: { id: 'm1' },
                data: {
                    quantity: {
                        decrement: 10
                    }
                }
            })
        })
    })
})
