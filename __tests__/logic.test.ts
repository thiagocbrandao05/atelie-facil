/**
 * Unit tests for business logic calculations
 */

import {
  calculateMaterialCost,
  calculateLaborCost,
  calculateSuggestedPrice,
  calculateOrderTotal,
  summarizeFinancials,
  HOURLY_RATE,
} from '@/lib/logic'
import { describe, it, expect } from 'vitest'

describe('Business Logic', () => {
  describe('calculateMaterialCost', () => {
    it('should calculate total material cost', () => {
      const materials = [
        {
          id: 'pm1',
          productId: '1',
          materialId: '1',
          quantity: 2,
          unit: 'm',
          color: null,
          material: {
            id: '1',
            name: 'Tecido',
            unit: 'm',
            cost: 50,
            quantity: 100,
            minQuantity: 10,
            supplierId: null,
          },
        },
        {
          id: 'pm2',
          productId: '1',
          materialId: '2',
          quantity: 1,
          unit: 'un',
          color: null,
          material: {
            id: '2',
            name: 'Botão',
            unit: 'un',
            cost: 5,
            quantity: 200,
            minQuantity: 20,
            supplierId: null,
          },
        },
      ]

      const cost = calculateMaterialCost(
        materials as unknown as Parameters<typeof calculateMaterialCost>[0]
      )
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
            material: {
              id: '1',
              name: 'Tecido',
              unit: 'm',
              cost: 100,
              quantity: 50,
              minQuantity: 5,
              supplierId: null,
            },
          },
        ],
      }

      const result = calculateSuggestedPrice(
        product as unknown as Parameters<typeof calculateSuggestedPrice>[0]
      )

      expect(result.materialCost).toBe(100)
      expect(result.laborCost).toBe(20)
      expect(result.baseCost).toBe(120)
      expect(result.marginValue).toBe(120) // margem de contribuicao de 50% no preco
      expect(result.suggestedPrice).toBe(240)
    })

    it('should handle zero margin', () => {
      const product = {
        laborTime: 60,
        profitMargin: 0,
        materials: [],
      }

      const result = calculateSuggestedPrice(product)
      expect(result.marginValue).toBe(0)
      expect(result.suggestedPrice).toBe(20) // Only labor cost
    })

    it('should use default hourly rate', () => {
      expect(calculateLaborCost(60)).toBe(HOURLY_RATE)
    })

    it('should fallback to 0 material cost if missing', () => {
      const materials = [{ quantity: 1, unit: 'm', material: { unit: 'm' } }]
      expect(
        calculateMaterialCost(materials as unknown as Parameters<typeof calculateMaterialCost>[0])
      ).toBe(0)
    })

    it('should handle zero working hours for fixed cost', () => {
      const product = { laborTime: 60, profitMargin: 0, materials: [] }
      const result = calculateSuggestedPrice(product, 20, [{ value: 100 }], 0)
      expect(result.fixedCost).toBe(0)
    })

    it('should handle all fixed cost aliases in calculateSuggestedPrice', () => {
      const product = { laborTime: 60, profitMargin: 0, materials: [] }

      expect(calculateSuggestedPrice(product, 20, [{ value: 160 }]).fixedCost).toBe(1)
      expect(calculateSuggestedPrice(product, 20, [{ amount: 160 }]).fixedCost).toBe(1)
      expect(calculateSuggestedPrice(product, 20, [{ valor: 160 }]).fixedCost).toBe(1)
      expect(calculateSuggestedPrice(product, 20, [{ custo: 160 }]).fixedCost).toBe(1)
      expect(calculateSuggestedPrice(product, 20, [{ other: 160 }]).fixedCost).toBe(0)
    })
  })

  describe('calculateOrderTotal', () => {
    it('should sum all order items', () => {
      const items = [
        { productId: '1', quantity: 2, price: 50 },
        { productId: '2', quantity: 1, price: 100 },
      ]

      expect(calculateOrderTotal(items)).toBe(200) // (2*50) + (1*100)
    })

    it('should apply item discounts', () => {
      const items = [{ price: 100, quantity: 1, discount: 20 }]
      expect(calculateOrderTotal(items)).toBe(80)
    })

    it('should apply order-level discount', () => {
      expect(calculateOrderTotal([{ price: 100, quantity: 1 }], 10)).toBe(90)
    })

    it('should not return negative total', () => {
      expect(calculateOrderTotal([{ price: 10, quantity: 1 }], 20)).toBe(0)
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
          customer: {
            id: '1',
            name: 'Cliente 1',
            phone: null,
            email: null,
            address: null,
            notes: null,
          },
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
                    material: {
                      id: '1',
                      name: 'Tecido',
                      unit: 'm',
                      cost: 50,
                      quantity: 100,
                      minQuantity: 10,
                      supplierId: null,
                    },
                  },
                ],
              },
            },
          ],
        },
      ]

      const summary = summarizeFinancials(
        orders as unknown as Parameters<typeof summarizeFinancials>[0]
      )

      expect(summary.totalRevenue).toBe(200)
      expect(summary.totalCosts).toBe(70) // 50 (material) + 20 (labor)
      expect(summary.totalProfit).toBe(130)
    })

    it('should calculate financial summary with fixed costs', () => {
      const orders = [
        {
          totalValue: 200,
          items: [
            {
              quantity: 1,
              product: {
                laborTime: 60,
                materials: [
                  {
                    quantity: 1,
                    unit: 'un',
                    material: { cost: 50, unit: 'un' } as unknown as Record<string, unknown>,
                  },
                ],
              } as unknown as Record<string, unknown>,
            },
          ],
        },
      ]
      const fixedCosts = [{ value: 160 }]
      const summary = summarizeFinancials(
        orders as unknown as Parameters<typeof summarizeFinancials>[0],
        20,
        fixedCosts,
        160
      )

      // Revenue = 200
      // Material = 50
      // Labor = 20
      // Fixed = (60/60) * (160/160) = 1
      // Total Cost = 71
      expect(summary.totalCosts).toBe(71)
      expect(summary.totalProfit).toBe(129)
    })

    it('should handle non-array fixed costs gracefully', () => {
      const orders = [
        {
          totalValue: 100,
          items: [
            {
              quantity: 1,
              product: { laborTime: 0, materials: [] } as unknown as Record<string, unknown>,
            },
          ],
        },
      ]
      const summary = summarizeFinancials(
        orders as unknown as Parameters<typeof summarizeFinancials>[0],
        20,
        null as unknown as Parameters<typeof summarizeFinancials>[2]
      )
      expect(summary.totalRevenue).toBe(100)
    })

    it('should handle all fixed cost aliases in summarizeFinancials', () => {
      const orders = [
        {
          totalValue: 100,
          items: [
            {
              quantity: 1,
              product: { laborTime: 60, materials: [] },
            },
          ],
        },
      ] as unknown as Parameters<typeof summarizeFinancials>[0]
      const fixedCosts = [{ value: 10 }, { amount: 10 }, { valor: 10 }, { custo: 10 }]
      const resultFixed = summarizeFinancials(orders, HOURLY_RATE, fixedCosts)
      // (60/60) * (40/160) = 0.25. Total cost = 0.25 (FC) + HOURLY_RATE (Labor)
      expect(resultFixed.totalCosts).toBe(0.25 + HOURLY_RATE)

      const resultNone = summarizeFinancials(
        orders,
        HOURLY_RATE,
        null as unknown as Parameters<typeof summarizeFinancials>[2]
      )
      expect(resultNone.totalCosts).toBe(HOURLY_RATE)
    })
  })
})
