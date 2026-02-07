import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMaterial, deleteMaterial } from '../app/actions/materials'
import { prisma } from '../lib/prisma'
import { revalidatePath } from 'next/cache'

describe('Material Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('createMaterial', () => {
        it('should create a material successfully with valid data', async () => {
            const formData = new FormData()
            formData.append('name', 'Tecido')
            formData.append('unit', 'm')
            formData.append('cost', '25')
            formData.append('quantity', '10')

            const response = await createMaterial({ success: false, message: '' }, formData)

            expect(response.success).toBe(true)
            expect(response.message).toContain('sucesso')
            expect(prisma.material.create).toHaveBeenCalled()
            expect(revalidatePath).toHaveBeenCalledWith('/estoque')
        })

        it('should return errors for invalid data', async () => {
            const formData = new FormData() // Empty data

            const response = await createMaterial({ success: false, message: '' }, formData)

            expect(response.success).toBe(false)
            expect(response.errors).toBeDefined()
        })
    })

    describe('deleteMaterial', () => {
        it('should delete a material successfully', async () => {
            const response = await deleteMaterial('test-id')
            expect(response.success).toBe(true)
            expect(prisma.material.delete).toHaveBeenCalledWith({ where: { id: 'test-id' } })
            expect(revalidatePath).toHaveBeenCalledWith('/estoque')
        })
    })
})
