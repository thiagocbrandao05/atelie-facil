'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { generateForecast } from '../utils/forecast'

export type ProductDemand = {
  productId: string
  productName: string
  history: number[] // Last N months quantities
  forecast: number
  trend: 'up' | 'down' | 'stable'
  confidence: number
}

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

export async function getDemandForecast(monthsBack: number = 6): Promise<ProductDemand[]> {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  const supabase = await createClient()
  const tenantId = user.tenantId

  // 1. Calculate Date Range
  const today = new Date()
  const startDate = new Date(today.getFullYear(), today.getMonth() - monthsBack, 1).toISOString()
  const endDate = new Date(today.getFullYear(), today.getMonth(), 0).toISOString() // End of last month

  // 2. Fetch Orders Items within range
  const { data: orderItems, error } = await supabase
    .from('OrderItem')
    .select(
      `
            quantity,
            order:Order!inner(createdAt, status),
            product:Product(id, name)
        `
    )
    .eq('order.tenantId', tenantId) // This might fail if using !inner join sometimes needs explicit filter on child too? No, inner on Order filters OrderItem.
    // Actually, RLS on OrderItem checks Order tenantId, but for performance we rely on the join
    // Just explicit join filter:
    .gte('order.createdAt', startDate)
    .lte('order.createdAt', endDate)
    .in('order.status', ['PRODUCING', 'READY', 'DELIVERED']) // Only real demand

  if (error) {
    console.error('Error fetching demand:', error)
    return []
  }

  // 3. Group by Product and Month
  // Map<ProductId, Map<MonthKey, Quantity>>
  const productMap = new Map<string, { name: string; history: number[] }>()

  // Initialize history arrays
  // We want an array of 'monthsBack' size, where index 0 is oldest month

  orderItems?.forEach((item: any) => {
    const productId = item.product?.id
    const productName = item.product?.name
    if (!productId) return

    if (!productMap.has(productId)) {
      productMap.set(productId, {
        name: productName,
        history: new Array(monthsBack).fill(0),
      })
    }

    const date = new Date(item.order.createdAt)
    // Calculate index: 0 = oldest, length-1 = last month
    // logic: monthsDiff = (todayYear - dateYear)*12 + (todayMonth - dateMonth)
    // index = monthsBack - monthsDiff

    // Simpler: just use absolute month index from start date
    const startMonthIndex = new Date(startDate).getFullYear() * 12 + new Date(startDate).getMonth()
    const currentItemMonthIndex = date.getFullYear() * 12 + date.getMonth()

    const arrayIndex = currentItemMonthIndex - startMonthIndex

    if (arrayIndex >= 0 && arrayIndex < monthsBack) {
      const entry = productMap.get(productId)!
      entry.history[arrayIndex] += item.quantity
    }
  })

  // 4. Generate Forecasts
  const results: ProductDemand[] = []

  productMap.forEach((value, key) => {
    const { predicted, trend, confidence } = generateForecast(value.history)

    // Only include if there's some activity or prediction
    if (predicted > 0 || value.history.some(h => h > 0)) {
      results.push({
        productId: key,
        productName: value.name,
        history: value.history,
        forecast: predicted,
        trend,
        confidence,
      })
    }
  })

  return results.sort((a, b) => b.forecast - a.forecast)
}
