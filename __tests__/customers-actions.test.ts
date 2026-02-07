import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createCustomer, deleteCustomer, getCustomers } from '../app/actions/customers'
import { prisma } from '../lib/prisma'

vi.mock('../lib/prisma', () => ({
    prisma: {
        customer: {
            create: vi.fn(),
            delete: vi.fn(),
            findMany: vi.fn(),
        },
    },
}))

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}))

describe('Customer Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('createCustomer', () => {
        it('should create a customer with valid data', async () => {
            const formData = new FormData()
            formData.append('name', 'Thiago')
            formData.append('phone', '123')
            formData.append('email', 'thiago@test.com')
            formData.append('address', 'Street 1')
            formData.append('notes', 'Some notes')

                ; (prisma.customer.create as any).mockResolvedValue({ id: 'c1', name: 'Thiago' })

            const result = await createCustomer({ success: false, message: '' }, formData)

            expect(result.success).toBe(true)
            expect(prisma.customer.create).toHaveBeenCalled()
        })

        it('should fail with invalid data', async () => {
            const formData = new FormData()
            formData.append('name', '') // Empty name

            const result = await createCustomer({ success: false, message: '' }, formData)

            expect(result.success).toBe(false)
            expect(prisma.customer.create).not.toHaveBeenCalled()
        })
    })

    describe('deleteCustomer', () => {
        it('should delete a customer', async () => {
            ; (prisma.customer.delete as any).mockResolvedValue({})

            const result = await deleteCustomer('c1')

            expect(result.success).toBe(true)
            expect(prisma.customer.delete).toHaveBeenCalledWith({
                where: { id: 'c1' }
            })
        })
    })
})
