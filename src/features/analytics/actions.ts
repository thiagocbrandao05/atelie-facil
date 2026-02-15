'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { calculateStockAlerts } from '@/lib/inventory'

type OrderMetricRow = { status: string; totalValue: number | string; createdAt?: string }
type MaterialMetricRow = {
  quantity: number | string
  cost?: number | string | null
  minQuantity?: number
}
type ActivityLogRow = Record<string, unknown>
type TopProductsRpcRow = {
  productId: string
  productName?: string | null
  totalQuantity: number | string
}

function getPeriodDates(days: number) {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - days)
  return { start, end }
}

export async function getSalesMetrics(days: number = 30) {
  const user = await getCurrentUser()
  if (!user) return null

  const { start } = getPeriodDates(days)
  const supabase = await createClient()
  const db = supabase

  const { data: orders, error } = await db
    .from('Order')
    .select('*')
    .eq('tenantId', user.tenantId)
    .gte('createdAt', start.toISOString())

  if (error) {
    console.error('Error fetching sales metrics:', error)
    return null
  }

  const rows = (orders || []) as OrderMetricRow[]
  const totalOrders = rows.length
  const totalRevenue = rows.reduce((sum, order) => sum + Number(order.totalValue), 0)

  const groupedByStatus = rows.reduce<
    Record<string, { status: string; count: number; value: number }>
  >((acc, order) => {
    const status = order.status
    if (!acc[status]) acc[status] = { status, count: 0, value: 0 }
    acc[status].count += 1
    acc[status].value += Number(order.totalValue)
    return acc
  }, {})

  return {
    totalOrders,
    totalRevenue,
    ordersByStatus: Object.values(groupedByStatus),
  }
}

export async function getInventoryMetrics() {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = await createClient()
  const db = supabase

  const { data: materials, error } = await db
    .from('Material')
    .select('quantity, cost, minQuantity')
    .eq('tenantId', user.tenantId)

  if (error) {
    console.error('Error fetching inventory metrics:', error)
    return null
  }

  const rows = (materials || []) as MaterialMetricRow[]
  const totalMaterials = rows.length
  const totalValue = rows.reduce(
    (sum, material) => sum + Number(material.cost || 0) * Number(material.quantity || 0),
    0
  )

  const alerts = await calculateStockAlerts(user.tenantId)

  return {
    totalMaterials,
    totalValue,
    lowStockCount: alerts.length,
  }
}

export async function getRecentActivity(limit: number = 10) {
  const user = await getCurrentUser()
  if (!user) return []

  const supabase = await createClient()
  const db = supabase

  const { data: logs, error } = await db
    .from('AuditLog')
    .select('*, user:User(name)')
    .eq('tenantId', user.tenantId)
    .order('createdAt', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching recent activity:', error)
    return []
  }

  return (logs || []) as ActivityLogRow[]
}

export async function getMonthlyRevenue() {
  const user = await getCurrentUser()
  if (!user) return []

  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const supabase = await createClient()
  const db = supabase

  const { data: orders, error } = await db
    .from('Order')
    .select('totalValue, createdAt')
    .eq('tenantId', user.tenantId)
    .in('status', ['COMPLETED', 'DELIVERED'])
    .gte('createdAt', sixMonthsAgo.toISOString())

  if (error) {
    console.error('Error fetching monthly revenue:', error)
    return []
  }

  const rows = (orders || []) as Array<{ totalValue: number | string; createdAt: string }>
  const monthlyData = rows.reduce<Record<string, number>>((acc, order) => {
    const date = new Date(order.createdAt)
    const month = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
    acc[month] = (acc[month] || 0) + Number(order.totalValue)
    return acc
  }, {})

  return Object.entries(monthlyData).map(([name, value]) => ({ name, value }))
}

export async function getTopProducts(limit: number = 5) {
  const user = await getCurrentUser()
  if (!user) return []

  try {
    const supabase = await createClient()
    const db = supabase

    // @ts-expect-error legacy schema not fully represented in generated DB types
    const { data, error } = await db.rpc('get_top_products', {
      p_tenant_id: user.tenantId,
      p_limit: limit,
    })

    if (error) throw error

    const rows = (data || []) as TopProductsRpcRow[]

    return rows.map(item => ({
      productId: item.productId,
      productName: item.productName || 'Desconhecido',
      quantity: Number(item.totalQuantity),
      revenue: 0,
    }))
  } catch (error) {
    console.error('Error fetching top products:', error)
    return []
  }
}

export async function getLowStockMaterials() {
  const user = await getCurrentUser()
  if (!user) return []

  const alerts = await calculateStockAlerts(user.tenantId)
  return alerts.map(alert => ({
    id: alert.id,
    name: alert.name,
    unit: alert.unit,
    quantity: alert.currentQuantity,
    minQuantity: alert.minQuantity,
  }))
}
