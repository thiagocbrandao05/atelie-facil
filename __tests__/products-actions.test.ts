import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createProduct, updateProduct, deleteProduct } from '../app/actions/products'
import { prisma } from '../lib/prisma'
import { revalidatePath } from 'next/cache'

describe('Product Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('createProduct', () => {
        it('should create a product successfully', async () => {
            const formData = new FormData()
            formData.append('name', 'Bolsa')
            formData.append('imageUrl', '')
            formData.append('laborTime', '60')
            formData.append('profitMargin', '50')
            formData.append('materials', JSON.stringify([{ id: 'm1', quantity: 1, unit: 'm' }]))

            const response = await createProduct({ success: false, message: '' }, formData)

            expect(response.success).toBe(true)
            expect(prisma.product.create).toHaveBeenCalled()
            expect(revalidatePath).toHaveBeenCalledWith('/produtos')
        })
    })

    describe('updateProduct', () => {
        it('should update a product successfully', async () => {
            const formData = new FormData()
            formData.append('name', 'Bolsa Editada')
            formData.append('imageUrl', '')
            formData.append('laborTime', '120')
            formData.append('profitMargin', '40')
            formData.append('materials', JSON.stringify([{ id: 'm1', quantity: 2, unit: 'm' }]))

            const response = await updateProduct('p1', { success: false, message: '' }, formData)

            expect(response.success).toBe(true)
            expect(prisma.$transaction).toHaveBeenCalled()
            expect(revalidatePath).toHaveBeenCalledWith('/produtos')
        })
    })


    describe('deleteProduct', () => {
        it('should delete a product successfully', async () => {
            const response = await deleteProduct('p1')
            expect(response.success).toBe(true)
            expect(prisma.$transaction).toHaveBeenCalled()
            expect(revalidatePath).toHaveBeenCalledWith('/produtos')
        })
    })
})
