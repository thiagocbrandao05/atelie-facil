'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'

export type CustomerSeasonalPattern = {
  customerId: string
  customerName: string
  likelyMonths: number[] // 1-12
  totalOrders: number
  lastOrderDate: Date
  frequencyLabel: 'Mensal' | 'Bimestral' | 'Trimestral' | 'Esporádico'
}

type CustomerSeasonalityOrderRow = {
  customerId: string
  createdAt: string | Date
  customer?: { name?: string | null } | null
}

export async function getCustomerSeasonality(): Promise<CustomerSeasonalPattern[]> {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  const supabase = await createClient()
  const tenantId = user.tenantId

  // 1. Fetch all completed orders (Customer History)
  // Limit to last 12-24 months for relevance, or all time? Let's do all time but sort by relevance.
  const { data: orders, error } = await supabase
    .from('Order')
    .select('customerId, createdAt, customer:Customer(name)')
    .eq('tenantId', tenantId)
    .in('status', ['READY', 'DELIVERED']) // Completed orders
    .order('createdAt', { ascending: false })

  if (error) {
    console.error('Error fetching seasonality:', error)
    return []
  }

  // 2. Group by Customer
  const customerMap = new Map<
    string,
    {
      name: string
      dates: Date[]
      monthCounts: number[] // Index 0-11
    }
  >()

  ;(orders as CustomerSeasonalityOrderRow[] | null)?.forEach(order => {
    const id = order.customerId
    if (!customerMap.has(id)) {
      customerMap.set(id, {
        name: order.customer?.name || 'Cliente Desconhecido',
        dates: [],
        monthCounts: new Array(12).fill(0),
      })
    }

    const entry = customerMap.get(id)!
    const date = new Date(order.createdAt)
    entry.dates.push(date)
    entry.monthCounts[date.getMonth()]++
  })

  // 3. Analyze Patterns
  const patterns: CustomerSeasonalPattern[] = []

  customerMap.forEach((data, id) => {
    // Filter out customers with very few orders (e.g., < 2)
    if (data.dates.length < 2) return

    // Determine Likely Months (simple mode: months with > 1 order or > 20% of total)
    const total = data.dates.length
    const likelyMonths: number[] = []

    data.monthCounts.forEach((count, index) => {
      if (count >= 2 || count / total > 0.3) {
        likelyMonths.push(index + 1) // 1-based
      }
    })

    if (likelyMonths.length === 0) return

    // Calculate Frequency Label (rough heuristic)
    // Average days between orders
    const sortedDates = data.dates.sort((a, b) => b.getTime() - a.getTime()) // Newest first
    const diffs: number[] = []
    for (let i = 0; i < sortedDates.length - 1; i++) {
      const diffTime = Math.abs(sortedDates[i].getTime() - sortedDates[i + 1].getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      diffs.push(diffDays)
    }

    const avgDays = diffs.reduce((a, b) => a + b, 0) / diffs.length
    let label: CustomerSeasonalPattern['frequencyLabel'] = 'Esporádico'

    if (avgDays <= 45) label = 'Mensal'
    else if (avgDays <= 75) label = 'Bimestral'
    else if (avgDays <= 105) label = 'Trimestral'

    patterns.push({
      customerId: id,
      customerName: data.name,
      likelyMonths,
      totalOrders: total,
      lastOrderDate: sortedDates[0],
      frequencyLabel: label,
    })
  })

  // Sort by recent activity and total orders
  return patterns.sort((a, b) => b.lastOrderDate.getTime() - a.lastOrderDate.getTime()).slice(0, 10)
}
