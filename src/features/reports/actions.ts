'use server'

import { createClient } from '@/lib/supabase/server'
import type { OrderWithDetails } from '@/lib/types'
import { getCurrentUser } from '@/lib/auth'
import { calculateSuggestedPrice } from '@/lib/logic'

/**
 * Generate financial report data
 */
export async function generateFinancialReport(
  startDate: Date,
  endDate: Date
): Promise<{
  orders: OrderWithDetails[]
  summary: {
    totalRevenue: number
    totalMaterialCosts: number
    totalLaborCosts: number
    totalCosts: number
    totalProfit: number
    averageMargin: number
  }
}> {
  const user = await getCurrentUser()
  if (!user) {
    return {
      orders: [],
      summary: {
        totalRevenue: 0,
        totalMaterialCosts: 0,
        totalLaborCosts: 0,
        totalCosts: 0,
        totalProfit: 0,
        averageMargin: 0,
      },
    }
  }

  const supabase = await createClient()

  // Deep nested select to reconstruct OrderWithDetails
  const { data: orders, error } = await supabase
    .from('Order')
    .select(
      `
            totalValue, createdAt,
            customer:Customer(name),
            items:OrderItem(
                quantity,
                product:Product(
                    laborTime,
                    materials:ProductMaterial(
                        quantity,
                        material:Material(cost)
                    )
                )
            )
        `
    )
    .eq('tenantId', user.tenantId)
    .gte('createdAt', startDate.toISOString())
    .lte('createdAt', endDate.toISOString())
    .order('createdAt', { ascending: false })

  if (error) {
    console.error('Error generating financial report:', error)
    return {
      orders: [],
      summary: {
        totalRevenue: 0,
        totalMaterialCosts: 0,
        totalLaborCosts: 0,
        totalCosts: 0,
        totalProfit: 0,
        averageMargin: 0,
      },
    }
  }

  // Process data (same logic as before, just adapted types if needed)
  // The structure returned by Supabase matches the nested structure we select.

  let totalRevenue = 0
  let totalMaterialCosts = 0
  let totalLaborCosts = 0

  const typedOrders = orders as any as OrderWithDetails[]

  // Note: ensure numeric values are treated as numbers (Supabase might return bigints as numbers if configured, or strings otherwise if huge. Usually standard numbers for float/int)

  typedOrders.forEach(order => {
    totalRevenue += Number(order.totalValue)

    order.items.forEach(item => {
      // Material costs
      const materialCost = item.product.materials.reduce((sum, pm) => {
        const cost = (pm.material as any).cost || 0
        return sum + Number(cost) * Number(pm.quantity)
      }, 0)
      totalMaterialCosts += materialCost * Number(item.quantity)

      // Labor costs
      const laborCost = (Number(item.product.laborTime) / 60) * 20 // Assuming standard rate if dynamic rate logic isn't here yet?
      // Previous code used hardcoded * 20. We should ideally get rate from settings but I'll keep parity.
      totalLaborCosts += laborCost * Number(item.quantity)
    })
  })

  const totalCosts = totalMaterialCosts + totalLaborCosts
  const totalProfit = totalRevenue - totalCosts
  const averageMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

  return {
    orders: typedOrders,
    summary: {
      totalRevenue,
      totalMaterialCosts,
      totalLaborCosts,
      totalCosts,
      totalProfit,
      averageMargin,
    },
  }
}

/**
 * Generate cost analysis by product
 */
export async function generateProductCostAnalysis() {
  const user = await getCurrentUser()
  if (!user) return []

  const supabase = await createClient()

  const { data: products, error } = await supabase
    .from('Product')
    .select(
      `
            id, name, laborTime, profitMargin,
            materials:ProductMaterial(
                quantity,
                material:Material(cost)
            ),
            items:OrderItem(
                quantity, price,
                order:Order(status)
            )
        `
    )
    .eq('tenantId', user.tenantId)

  if (error) {
    console.error('Error generating product cost analysis:', error)
    return []
  }

  return (products as any).map((product: any) => {
    // Use the centralized logic
    // We need to shape the product to match what calculateSuggestedPrice expects
    const calculation = calculateSuggestedPrice({
      laborTime: Number(product.laborTime),
      profitMargin: Number(product.profitMargin),
      materials: product.materials, // Assuming the structure matches, deeply nested material object might need check
    })

    // Re-calculate specific metrics effectively if needed or just use the result
    const materialCost = calculation.materialCost
    const laborCost = calculation.laborCost
    const baseCost = calculation.baseCost
    const suggestedPrice = calculation.suggestedPrice

    const validItems = product.items.filter(
      (item: any) => item.order && item.order.status !== 'CANCELLED'
    )
    const totalSold = validItems.reduce((sum: number, item: any) => sum + Number(item.quantity), 0)
    const totalRevenue = validItems.reduce(
      (sum: number, item: any) => sum + Number(item.price) * Number(item.quantity),
      0
    )

    return {
      id: product.id,
      name: product.name,
      materialCost,
      laborCost,
      baseCost,
      suggestedPrice,
      profitMargin: product.profitMargin,
      totalSold,
      totalRevenue,
      averageSellingPrice: totalSold > 0 ? totalRevenue / totalSold : 0,
    }
  })
}

/**
 * Generate material usage report
 */
export async function generateMaterialUsageReport(startDate: Date, endDate: Date) {
  const user = await getCurrentUser()
  if (!user) return []

  const supabase = await createClient()

  const { data: orders, error } = await supabase
    .from('Order')
    .select(
      `
            items:OrderItem(
                quantity,
                product:Product(
                    materials:ProductMaterial(
                        quantity,
                        materialId,
                        material:Material(
                            name,
                            unit,
                            cost
                        )
                    )
                )
            )
        `
    )
    .eq('tenantId', user.tenantId)
    .gte('createdAt', startDate.toISOString())
    .lte('createdAt', endDate.toISOString())

  if (error) {
    console.error('Error generating material usage report:', error)
    return []
  }

  const materialUsage = new Map<
    string,
    {
      name: string
      unit: string
      totalUsed: number
      totalCost: number
      timesUsed: number
    }
  >()

  ;(orders as any).forEach((order: any) => {
    ;(order.items || []).forEach((item: any) => {
      ;(item.product?.materials || []).forEach((pm: any) => {
        const key = pm.materialId
        const existing = materialUsage.get(key) || {
          name: pm.material.name,
          unit: pm.material.unit,
          totalUsed: 0,
          totalCost: 0,
          timesUsed: 0,
        }

        const quantityUsed = Number(pm.quantity) * Number(item.quantity)
        const cost = (pm.material as any).cost || 0
        materialUsage.set(key, {
          ...existing,
          totalUsed: existing.totalUsed + quantityUsed,
          totalCost: existing.totalCost + quantityUsed * Number(cost),
          timesUsed: existing.timesUsed + 1,
        })
      })
    })
  })

  return Array.from(materialUsage.values()).sort((a, b) => b.totalCost - a.totalCost)
}
