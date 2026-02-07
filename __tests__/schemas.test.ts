import { describe, it, expect } from 'vitest'
import { MaterialSchema, ProductSchema, OrderSchema, CustomerSchema } from '../lib/schemas'

describe('Validation Schemas', () => {
    describe('MaterialSchema', () => {
        it('should validate valid material data', () => {
            const data = { name: 'Linha', unit: 'un', cost: 5.5, quantity: 10 }
            const result = MaterialSchema.safeParse(data)
            expect(result.success).toBe(true)
        })

        it('should fail on invalid material data', () => {
            const data = { name: '', unit: '', cost: -1, quantity: -5 }
            const result = MaterialSchema.safeParse(data)
            expect(result.success).toBe(false)
            if (!result.success) {
                expect(result.error.issues).toHaveLength(4)
            }
        })
    })

    describe('ProductSchema', () => {
        it('should validate valid product data', () => {
            const data = {
                name: 'Bolsa',
                laborTime: 120,
                profitMargin: 100,
                materials: [{ id: 'm1', quantity: 1, unit: 'm' }]
            }
            const result = ProductSchema.safeParse(data)
            expect(result.success).toBe(true)
        })

        it('should fail if no materials added', () => {
            const data = { name: 'Bolsa', laborTime: 120, profitMargin: 100, materials: [] }
            const result = ProductSchema.safeParse(data)
            expect(result.success).toBe(false)
        })
    })

    describe('CustomerSchema', () => {
        it('should validate valid customer data', () => {
            const data = { name: 'Thiago', phone: '123456789', email: 'thiago@email.com' }
            const result = CustomerSchema.safeParse(data)
            expect(result.success).toBe(true)
        })

        it('should fail if name is empty', () => {
            const data = { name: '' }
            const result = CustomerSchema.safeParse(data)
            expect(result.success).toBe(false)
        })
    })

    describe('OrderSchema', () => {
        it('should validate valid order data', () => {
            const data = {
                customerId: 'c1',
                dueDate: new Date().toISOString(),
                items: [{ productId: 'p1', quantity: 2, price: 50 }]
            }
            const result = OrderSchema.safeParse(data)
            expect(result.success).toBe(true)
        })

        it('should fail if customerId is missing', () => {
            const data = {
                dueDate: new Date().toISOString(),
                items: [{ productId: 'p1', quantity: 2, price: 50 }]
            }
            const result = OrderSchema.safeParse(data)
            expect(result.success).toBe(false)
        })
    })
})
