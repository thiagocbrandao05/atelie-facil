import { Material, Product, ProductMaterial } from './types'
import { convertQuantity } from './units'
import { HOURLY_RATE } from './constants'
import type {
  ProductWithMaterials,
  PriceCalculation,
  FinancialSummary,
  OrderItemWithProduct,
} from './types'
import * as Finance from './finance/calculators'
import { analyzeProfitability } from './finance/intelligence'

export { HOURLY_RATE }
export type { ProductWithMaterials }

/**
 * Calculates the total material cost for a product based on its composition.
 */
export function calculateMaterialCost(
  materials: (ProductMaterial & { material: Material })[]
): number {
  return materials.reduce((acc, pm) => {
    const baseQuantity = convertQuantity(pm.quantity, pm.unit, pm.material.unit)
    const materialCost = pm.material.cost || 0
    return acc + materialCost * baseQuantity
  }, 0)
}

/**
 * Calculates the labor cost based on production time and hourly rate.
 */
export function calculateLaborCost(
  laborTimeMinutes: number,
  hourlyRate: number = HOURLY_RATE
): number {
  const rate = Finance.calculateHourlyRate(hourlyRate, 60) // hourly rate / 60 minutes
  return Finance.formatInternal(rate.times(laborTimeMinutes))
}

/**
 * Calculates the suggested price based on costs and profit margin.
 */
export function calculateSuggestedPrice(
  product:
    | ProductWithMaterials
    | {
      laborTime: number
      profitMargin: number
      materials: (ProductMaterial & { material: Material })[]
      price?: number | null
      cost?: number
      lastCost?: number
    },
  hourlyRate: number = HOURLY_RATE,
  monthlyFixedCosts: any[] = [],
  workingHoursPerMonth: number = 160,
  taxRate: number = 0,
  cardFeeRate: number = 0
): PriceCalculation {
  // Use Product.cost (MPM) preferably, fallback to lastCost (legacy/deprecated)
  const purchaseCost = product.cost ?? (product as any).lastCost ?? 0
  const materialCost = calculateMaterialCost(product.materials)

  const laborCostTotal = calculateLaborCost(product.laborTime, hourlyRate)

  // Calculate fixed cost distribution
  const totalMonthlyFixed = Array.isArray(monthlyFixedCosts)
    ? monthlyFixedCosts.reduce(
      (acc, item: any) =>
        acc + (Number(item.value || item.amount || item.valor || item.custo) || 0),
      0
    )
    : 0

  const fixedRate = Finance.calculateFixedCostRate(totalMonthlyFixed, workingHoursPerMonth)
  const fixedCost = Finance.formatInternal(fixedRate.times(product.laborTime / 60))

  const baseCostTotal = materialCost + purchaseCost + laborCostTotal + fixedCost

  const suggestedPriceDecimal = Finance.calculateSuggestedPrice(baseCostTotal, product.profitMargin)
  const suggestedPrice = Finance.formatDisplay(suggestedPriceDecimal)
  const marginValue = Finance.formatDisplay(suggestedPriceDecimal.minus(baseCostTotal))

  // Intelligence Enrichment
  const analysis = analyzeProfitability(
    product.price || suggestedPrice, // Use manual price if exists, otherwise suggested
    baseCostTotal,
    taxRate,
    cardFeeRate,
    totalMonthlyFixed
  )

  return {
    materialCost: materialCost + purchaseCost,
    laborCost: laborCostTotal,
    fixedCost,
    baseCost: baseCostTotal,
    marginValue,
    suggestedPrice,
    contributionMargin: Finance.formatDisplay(analysis.contributionMargin),
    contributionMarginPercentage: Finance.formatDisplay(analysis.contributionMarginPercentage),
    breakEvenUnits: analysis.breakEvenUnits.toNumber(),
    breakEvenRevenue: Finance.formatDisplay(analysis.breakEvenRevenue),
    variableCostsTotal: Finance.formatDisplay(analysis.variableCostsTotal),
    taxAmount: Finance.formatDisplay(analysis.taxAmount),
    cardFeeAmount: Finance.formatDisplay(analysis.commissionAmount),
    materials: product.materials,
  }
}

/**
 * Calculates the total value of an order.
 */
export function calculateOrderTotal(
  items: { price: number; quantity: number; discount?: number }[],
  orderDiscount: number = 0
): number {
  const itemsTotal = items.reduce((acc, item) => {
    const itemPrice = item.price - (item.discount || 0)
    return acc + itemPrice * item.quantity
  }, 0)
  return Math.max(0, itemsTotal - orderDiscount)
}

/**
 * Summarizes financials for a list of orders.
 */
export function summarizeFinancials(
  orders: { totalValue: number; items: OrderItemWithProduct[] }[],
  hourlyRate: number = HOURLY_RATE,
  monthlyFixedCosts: any[] = [],
  workingHoursPerMonth: number = 160
): FinancialSummary {
  return orders.reduce(
    (acc, order) => {
      const revenue = order.totalValue

      const totalCosts = order.items.reduce((itemAcc: number, item) => {
        const product = item.product
        const calc = calculateSuggestedPrice(
          product as any,
          hourlyRate,
          monthlyFixedCosts,
          workingHoursPerMonth
        )

        return itemAcc + calc.baseCost * item.quantity
      }, 0)

      return {
        totalRevenue: acc.totalRevenue + revenue,
        totalCosts: acc.totalCosts + totalCosts,
        totalProfit: acc.totalProfit + (revenue - totalCosts),
      }
    },
    { totalRevenue: 0, totalCosts: 0, totalProfit: 0 }
  )
}
