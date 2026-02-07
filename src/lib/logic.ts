import { Material, Product, ProductMaterial } from './types'
import { convertQuantity } from './units'
import { HOURLY_RATE } from './constants'
import type { ProductWithMaterials, PriceCalculation, FinancialSummary, OrderItemWithProduct } from './types'

export { HOURLY_RATE }
export type { ProductWithMaterials }

/**
 * Calculates the total material cost for a product based on its composition.
 * Accounts for unit conversion (e.g., cm used vs m in stock).
 */
export function calculateMaterialCost(materials: (ProductMaterial & { material: Material })[]): number {
    return materials.reduce((acc, pm) => {
        // Convert usage quantity to base unit quantity for cost calculation
        // e.g., if material is in 'm' and used in 'cm', converted quantity will be 'usage / 100'
        const baseQuantity = convertQuantity(pm.quantity, pm.unit, pm.material.unit)
        const materialCost = (pm.material as any).cost || 0
        return acc + (materialCost * baseQuantity)
    }, 0)
}

/**
 * Calculates the labor cost based on production time and hourly rate.
 */
export function calculateLaborCost(laborTimeMinutes: number, hourlyRate: number = HOURLY_RATE): number {
    return (laborTimeMinutes / 60) * hourlyRate
}

/**
 * Calculates the suggested price based on costs and profit margin.
 */
export function calculateSuggestedPrice(
    product: ProductWithMaterials | { laborTime: number, profitMargin: number, materials: (ProductMaterial & { material: Material })[] },
    hourlyRate: number = HOURLY_RATE,
    monthlyFixedCosts: any[] = [],
    workingHoursPerMonth: number = 160
): PriceCalculation {
    const materialCost = calculateMaterialCost(product.materials)
    const laborCost = calculateLaborCost(product.laborTime, hourlyRate)

    // Calculate fixed cost distribution
    const totalMonthlyFixed = Array.isArray(monthlyFixedCosts)
        ? monthlyFixedCosts.reduce((acc, item: any) => acc + (Number(item.value || item.amount || item.valor || item.custo) || 0), 0)
        : 0
    const fixedCostPerHour = workingHoursPerMonth > 0 ? totalMonthlyFixed / workingHoursPerMonth : 0
    const fixedCost = (product.laborTime / 60) * fixedCostPerHour

    const baseCost = materialCost + laborCost + fixedCost
    const marginValue = baseCost * (product.profitMargin / 100)
    const suggestedPrice = baseCost + marginValue

    return {
        materialCost,
        laborCost,
        fixedCost,
        baseCost,
        marginValue,
        suggestedPrice,
        materials: product.materials
    }
}

/**
 * Calculates the total value of an order.
 */
export function calculateOrderTotal(items: { price: number, quantity: number, discount?: number }[], orderDiscount: number = 0): number {
    const itemsTotal = items.reduce((acc, item) => {
        const itemPrice = item.price - (item.discount || 0)
        return acc + (itemPrice * item.quantity)
    }, 0)
    return Math.max(0, itemsTotal - orderDiscount)
}

/**
 * Summarizes financials for a list of orders.
 */
export function summarizeFinancials(
    orders: { totalValue: number, items: OrderItemWithProduct[] }[],
    hourlyRate: number = HOURLY_RATE,
    monthlyFixedCosts: any[] = [],
    workingHoursPerMonth: number = 160
): FinancialSummary {
    return orders.reduce((acc, order) => {
        const revenue = order.totalValue

        // Calculate costs for each item in the order
        const totalCosts = order.items.reduce((itemAcc: number, item) => {
            const product = item.product
            const matCost = calculateMaterialCost(product.materials)
            const labCost = calculateLaborCost(product.laborTime, hourlyRate)

            // Calculate fixed cost distribution
            const totalMonthlyFixed = Array.isArray(monthlyFixedCosts)
                ? monthlyFixedCosts.reduce((accFc, fc: any) => accFc + (Number(fc.value || fc.amount || fc.valor || fc.custo) || 0), 0)
                : 0
            const fixedCostPerHour = workingHoursPerMonth > 0 ? totalMonthlyFixed / workingHoursPerMonth : 0
            const fixCost = (product.laborTime / 60) * fixedCostPerHour

            return itemAcc + ((matCost + labCost + fixCost) * item.quantity)
        }, 0)

        return {
            totalRevenue: acc.totalRevenue + revenue,
            totalCosts: acc.totalCosts + totalCosts,
            totalProfit: acc.totalProfit + (revenue - totalCosts)
        }
    }, { totalRevenue: 0, totalCosts: 0, totalProfit: 0 })
}


