import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createOrder, updateOrderStatus } from '../app/actions/orders'
import { prisma } from '../lib/prisma'
import { revalidatePath } from 'next/cache'
import * as inventory from '../lib/inventory'

vi.mock('../lib/inventory', () => ({
    checkStockAvailability: vi.fn(),
    deductStockForOrder: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
    getCurrentUser: vi.fn().mockResolvedValue({ id: 'user1', email: 'test@example.com' })
}))

describe('Order Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('createOrder', () => {
        it('should create an order successfully', async () => {
            const data = {
                customerId: 'c1',
                dueDate: new Date(),
                items: [{ productId: 'p1', quantity: 1, price: 100 }]
            }

            const response = await createOrder(data)

            expect(response.success).toBe(true)
            expect(prisma.order.create).toHaveBeenCalled()
            expect(revalidatePath).toHaveBeenCalledWith('/pedidos')
        })
    })

    describe('updateOrderStatus', () => {
        it('should update order status and deduct stock if moving to PRODUCING', async () => {
            // Current status is PENDING
            ; (prisma.order.findUnique as any).mockResolvedValue({ status: 'PENDING' })
                // Stock is available
                ; (inventory.checkStockAvailability as any).mockResolvedValue({ isAvailable: true })

            const response = await updateOrderStatus('o1', 'PRODUCING')

            expect(response.success).toBe(true)
            expect(inventory.checkStockAvailability).toHaveBeenCalledWith('o1')
            expect(inventory.deductStockForOrder).toHaveBeenCalledWith('o1')
            expect(prisma.order.update).toHaveBeenCalledWith({
                where: { id: 'o1' },
                data: { status: 'PRODUCING' }
            })
        })

        it('should fail update if stock is insufficient', async () => {
            // Current status is PENDING
            ; (prisma.order.findUnique as any).mockResolvedValue({ status: 'PENDING' })
                // Stock is NOT available
                ; (inventory.checkStockAvailability as any).mockResolvedValue({
                    isAvailable: false,
                    missingMaterials: [{ name: 'Fita' }]
                })

            const response = await updateOrderStatus('o1', 'PRODUCING')

            expect(response.success).toBe(false)
            expect(response.message).toContain('Estoque insuficiente')
            expect(prisma.order.update).not.toHaveBeenCalled()
        })
    })
})
