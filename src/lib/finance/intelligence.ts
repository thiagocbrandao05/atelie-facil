import Decimal from 'decimal.js'
import * as Finance from './calculators'

/**
 * Interface for the result of a profitability analysis
 */
export interface ProfitabilityMetrics {
  contributionMargin: Decimal
  contributionMarginPercentage: Decimal
  variableCostsTotal: Decimal
  taxAmount: Decimal
  commissionAmount: Decimal
  breakEvenUnits: Decimal
  breakEvenRevenue: Decimal
}

/**
 * Calculates complete profitability metrics for a product.
 *
 * @param price - Selling price
 * @param variableCosts - Sum of materials/purchase costs
 * @param taxRate - Percentage (e.g., 6 for 6%)
 * @param commissionRate - Percentage (e.g., 3.99 for card fees)
 * @param totalMonthlyFixedCosts - For break-even analysis
 */
export function analyzeProfitability(
  price: number | string | Decimal,
  variableCosts: number | string | Decimal,
  taxRate: number | string | Decimal = 0,
  commissionRate: number | string | Decimal = 0,
  totalMonthlyFixedCosts: number | string | Decimal = 0
): ProfitabilityMetrics {
  const p = new Decimal(price)
  const vCosts = new Decimal(variableCosts)
  const taxes = p.times(new Decimal(taxRate).dividedBy(100))
  const commission = p.times(new Decimal(commissionRate).dividedBy(100))

  const totalVariableCosts = vCosts.plus(taxes).plus(commission)
  const margin = p.minus(totalVariableCosts)
  const marginPercent = p.isZero() ? new Decimal(0) : margin.dividedBy(p)

  // Break-even
  const fixed = new Decimal(totalMonthlyFixedCosts)
  const breakEvenUnits = margin.isPositive() ? fixed.dividedBy(margin) : new Decimal(Infinity)
  const breakEvenRevenue = marginPercent.isPositive()
    ? fixed.dividedBy(marginPercent)
    : new Decimal(Infinity)

  return {
    contributionMargin: margin,
    contributionMarginPercentage: marginPercent.times(100),
    variableCostsTotal: totalVariableCosts,
    taxAmount: taxes,
    commissionAmount: commission,
    breakEvenUnits: breakEvenUnits.ceil(), // Minimum units as an integer
    breakEvenRevenue: breakEvenRevenue,
  }
}

/**
 * Pricing Strategy: Target Monthly Profit
 * Calculates the price needed to reach a specific monthly profit goal.
 *
 * Formula: Price = (FixedCosts + DesiredProfit) / ProjectedVolume + UnitVariableCosts
 */
export function calculatePriceForTargetProfit(
  fixedCosts: number | string | Decimal,
  desiredProfit: number | string | Decimal,
  projectedVolume: number | string | Decimal,
  unitVariableCosts: number | string | Decimal
): Decimal {
  const f = new Decimal(fixedCosts)
  const p = new Decimal(desiredProfit)
  const v = new Decimal(projectedVolume)
  const c = new Decimal(unitVariableCosts)

  if (v.isZero()) return new Decimal(0)

  // (f + p) / v + c
  return f.plus(p).dividedBy(v).plus(c)
}

/**
 * Psychological Pricing Strategy
 * Formats a raw price to common retail patterns.
 */
export type PsychologicalPattern = '90' | '99' | '97' | 'round'

export function applyPsychologicalPricing(
  price: number | string | Decimal,
  pattern: PsychologicalPattern = '90'
): Decimal {
  const p = new Decimal(price)
  const integerPart = p.floor()

  switch (pattern) {
    case '90':
      return integerPart.plus(0.9)
    case '99':
      return integerPart.plus(0.99)
    case '97':
      return integerPart.plus(0.97)
    case 'round':
      return p.round()
    default:
      return p
  }
}
