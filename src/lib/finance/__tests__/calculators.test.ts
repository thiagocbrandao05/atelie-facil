import { describe, it, expect } from 'vitest'
import {
  calculateApportionedFreight,
  calculateItemPurchaseCost,
  calculateMovingAverageCost,
  calculateHourlyRate,
  calculateFixedCostRate,
  calculateSuggestedPrice,
  formatInternal,
  formatDisplay,
} from '../calculators'
import Decimal from 'decimal.js'

describe('Financial Calculators', () => {
  describe('calculateApportionedFreight', () => {
    it('should apportion freight proportionally', () => {
      const itemValue = 25
      const totalItemsValue = 50 // Two items of 25 each
      const totalFreight = 15

      const result = calculateApportionedFreight(itemValue, totalItemsValue, totalFreight)
      expect(result.toNumber()).toBe(7.5) // 50% of 15
    })

    it('should return 0 if total items value is 0', () => {
      expect(calculateApportionedFreight(10, 0, 15).toNumber()).toBe(0)
    })
  })

  describe('calculateItemPurchaseCost', () => {
    it('should calculate unit cost including freight', () => {
      const itemValue = 25
      const quantity = 500
      const apportionedFreight = 7.5

      const result = calculateItemPurchaseCost(itemValue, quantity, apportionedFreight)
      expect(result.toNumber()).toBe(0.065) // (25 + 7.5) / 500
    })
  })

  describe('calculateMovingAverageCost', () => {
    it('should calculate moving average correctly', () => {
      // Current: 100 units at $2.00
      // New: 50 units at $3.00
      // Result: ((100 * 2) + (50 * 3)) / 150 = (200 + 150) / 150 = 350 / 150 = 2.3333...
      const result = calculateMovingAverageCost(100, 2.0, 50, 3.0)
      expect(result.toFixed(4)).toBe('2.3333')
    })

    it('should use new cost if current quantity is 0', () => {
      const result = calculateMovingAverageCost(0, 5.0, 10, 3.0)
      expect(result.toNumber()).toBe(3.0)
    })
  })

  describe('calculateHourlyRate', () => {
    it('should calculate hourly rate', () => {
      // $1600 salary / 160 hours = $10/hour
      expect(calculateHourlyRate(1600, 160).toNumber()).toBe(10)
    })
  })

  describe('calculateFixedCostRate', () => {
    it('should calculate fixed cost rate', () => {
      // $800 fixed costs / 160 hours = $5/hour
      expect(calculateFixedCostRate(800, 160).toNumber()).toBe(5)
    })
  })

  describe('calculateSuggestedPrice', () => {
    it('should calculate price using cost-plus method (markup on price)', () => {
      // Cost: 10, Margin: 50%
      // 10 / (1 - 0.5) = 10 / 0.5 = 20
      expect(calculateSuggestedPrice(10, 50).toNumber()).toBe(20)
    })

    it('should handle high margins with fallback logic', () => {
      // Margin 100% means divisor is (1-1)=0.
      // Our fallback is cost * (1+margin) = 10 * 2 = 20
      expect(calculateSuggestedPrice(10, 100).toNumber()).toBe(20)
    })
  })

  describe('Formatting', () => {
    it('should format internal to 4 decimal places', () => {
      expect(formatInternal(new Decimal(2.333333))).toBe(2.3333)
    })

    it('should format display to 2 decimal places', () => {
      expect(formatDisplay(new Decimal(10.5555))).toBe(10.56) // Round half up
    })
  })
})
