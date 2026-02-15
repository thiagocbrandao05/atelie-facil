import { describe, it, expect } from 'vitest'
import {
  analyzeProfitability,
  calculatePriceForTargetProfit,
  applyPsychologicalPricing,
} from '../intelligence'
import Decimal from 'decimal.js'

describe('Finance Intelligence', () => {
  describe('analyzeProfitability', () => {
    it('should calculate basic contribution margins correctly', () => {
      // Price: 100, Variable Cost: 60, Tax: 6%, Fee: 4%
      // VariableTotal = 60 + 6 + 4 = 70
      // Margin = 30
      const result = analyzeProfitability(100, 60, 6, 4)

      expect(result.contributionMargin.toNumber()).toBe(30)
      expect(result.contributionMarginPercentage.toNumber()).toBe(30)
      expect(result.variableCostsTotal.toNumber()).toBe(70)
    })

    it('should calculate break-even point in units', () => {
      // Price: 100, Variable: 50, Fixed: 1000
      // MC_Unit = 50
      // BEP = 1000 / 50 = 20 units
      const result = analyzeProfitability(100, 50, 0, 0, 1000)
      expect(result.breakEvenUnits.toNumber()).toBe(20)
    })

    it('should handle negative margins in break-even', () => {
      const result = analyzeProfitability(50, 60, 0, 0, 1000)
      expect(result.breakEvenUnits.toNumber()).toBe(Infinity)
    })

    it('should calculate break-even revenue', () => {
      // Price: 100, VC: 50, MC%: 50%, Fixed: 1000
      // BEP Revenue = 1000 / 0.5 = 2000
      const result = analyzeProfitability(100, 50, 0, 0, 1000)
      expect(result.breakEvenRevenue.toNumber()).toBe(2000)
    })
  })

  describe('calculatePriceForTargetProfit', () => {
    it('should calculate price to reach target profit', () => {
      // Fixed: 2000, Target: 3000, Volume: 100, UnitVC: 10
      // (2000 + 3000) / 100 + 10 = 50 + 10 = 60
      const price = calculatePriceForTargetProfit(2000, 3000, 100, 10)
      expect(price.toNumber()).toBe(60)
    })
  })

  describe('applyPsychologicalPricing', () => {
    it('should format to .90', () => {
      expect(applyPsychologicalPricing(10.55, '90').toNumber()).toBe(10.9)
      expect(applyPsychologicalPricing(10.0, '90').toNumber()).toBe(10.9)
    })

    it('should format to .99', () => {
      expect(applyPsychologicalPricing(10.25, '99').toNumber()).toBe(10.99)
    })

    it('should format to .97', () => {
      expect(applyPsychologicalPricing(7.4, '97').toNumber()).toBe(7.97)
    })
  })
})
