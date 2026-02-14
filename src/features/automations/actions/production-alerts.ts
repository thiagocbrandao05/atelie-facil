'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'

export type ProductionAlert = {
  orderId: string
  customerName: string
  productName: string
  status: string
  dueDate: Date
  estimatedCompletion: Date
  riskLevel: 'low' | 'medium' | 'high' | 'late'
  daysUntilDue: number
}

export async function getProductionAlerts(): Promise<ProductionAlert[]> {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  const supabase = await createClient()
  const tenantId = user.tenantId

  // 1. Fetch Orders in progress (PENDING, PRODUCING)
  const { data: orders, error } = await supabase
    .from('Order')
    .select(
      `
            id,
            status,
            dueDate,
            customer:Customer(name),
            items:OrderItem(
                quantity,
                product:Product(name, laborTime)
            )
        `
    )
    .eq('tenantId', tenantId)
    .in('status', ['PENDING', 'PRODUCING'])
    .order('dueDate', { ascending: true })

  if (error) {
    console.error('Error fetching production alerts:', error)
    return []
  }

  const alerts: ProductionAlert[] = []
  const today = new Date()

  orders?.forEach((order: any) => {
    // Calculate Total Labor Time needed for this order
    let totalLaborMinutes = 0
    let mainProductName = ''

    order.items?.forEach((item: any) => {
      const time = item.product?.laborTime || 0
      totalLaborMinutes += time * item.quantity
      if (!mainProductName) mainProductName = item.product?.name
    })

    if (order.items.length > 1) mainProductName += ` + ${order.items.length - 1} outros`

    // Estimate completion:
    // Simple heuristic: If started now, assuming 8h/day productivity (or just raw hours?), when would it finish?
    // Let's assume standard 6h effective daily work.
    const workHoursPerDay = 6
    const daysNeeded = Math.ceil(totalLaborMinutes / 60 / workHoursPerDay)

    const estimatedCompletion = new Date(today)
    estimatedCompletion.setDate(today.getDate() + daysNeeded)

    const dueDate = new Date(order.dueDate)
    const timeDiff = dueDate.getTime() - today.getTime()
    const daysUntilDue = Math.ceil(timeDiff / (1000 * 3600 * 24))

    // Risk Analysis
    let riskLevel: ProductionAlert['riskLevel'] = 'low'

    if (daysUntilDue < 0) {
      riskLevel = 'late'
    } else if (daysNeeded > daysUntilDue) {
      // Impossible to finish in time with standard capacity
      riskLevel = 'high'
    } else if (daysNeeded >= daysUntilDue * 0.7) {
      // Tight schedule (70% of available time is needed)
      riskLevel = 'medium'
    }

    alerts.push({
      orderId: order.id,
      customerName: order.customer?.name || 'Cliente',
      productName: mainProductName,
      status: order.status,
      dueDate,
      estimatedCompletion,
      riskLevel,
      daysUntilDue,
    })
  })

  // Return only those with some risk or late, plus a few upcoming 'low' risk ones for context?
  // User requested "risk of delay". Let's return all sorted by urgency/risk.
  return alerts.sort((a, b) => {
    const riskScore = { late: 4, high: 3, medium: 2, low: 1 }
    return riskScore[b.riskLevel] - riskScore[a.riskLevel]
  })
}
