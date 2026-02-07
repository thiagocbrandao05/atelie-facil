'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { calculateStockAlerts } from '@/lib/inventory'
// Self-import removed

// Helper to get start/end of period
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

    const { data: orders, error } = await supabase
        .from('Order')
        .select('*')
        .eq('tenantId', user.tenantId)
        .gte('createdAt', start.toISOString())

    if (error) {
        console.error('Error fetching sales metrics:', error)
        return null
    }

    const totalOrders = orders.length
    const totalRevenue = (orders as any[]).reduce((sum, order) => sum + Number(order.totalValue), 0)

    // Group by status
    const ordersByStatus = Object.values((orders as any[]).reduce((acc: any, order) => {
        const status = order.status
        if (!acc[status]) acc[status] = { status, count: 0, value: 0 }
        acc[status].count++
        acc[status].value += Number(order.totalValue)
        return acc
    }, {}))

    return {
        totalOrders,
        totalRevenue,
        ordersByStatus
    }
}

export async function getInventoryMetrics() {
    const user = await getCurrentUser()
    if (!user) return null

    const supabase = await createClient()

    // We can use Promise.all for parallel fetching
    // Get total materials and value (approximate value based on current cost * quantity)
    const { data: materials, error } = await supabase
        .from('Material')
        .select('quantity, cost, minQuantity')
        .eq('tenantId', user.tenantId)

    if (error) {
        console.error('Error fetching inventory metrics:', error)
        return null
    }

    const totalMaterials = materials.length
    const totalValue = (materials as any[]).reduce((sum, m) => sum + (Number(m.cost || 0) * Number(m.quantity || 0)), 0)

    // Use shared utility for alerts count
    const alerts = await calculateStockAlerts(user.tenantId)
    const lowStockCount = alerts.length

    return {
        totalMaterials,
        totalValue,
        lowStockCount
    }
}

export async function getRecentActivity(limit: number = 10) {
    const user = await getCurrentUser()
    if (!user) return []

    const supabase = await createClient()

    // Fetch audit logs as activity
    const { data: logs, error } = await supabase
        .from('AuditLog')
        .select('*, user:User(name)')
        .eq('tenantId', user.tenantId)
        .order('createdAt', { ascending: false })
        .limit(limit)

    if (error) {
        console.error('Error fetching recent activity:', error)
        return []
    }

    return logs
}

export async function getMonthlyRevenue() {
    const user = await getCurrentUser()
    if (!user) return []

    // Get orders from the last 6 months
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const supabase = await createClient()

    const { data: orders, error } = await supabase
        .from('Order')
        .select('totalValue, createdAt')
        .eq('tenantId', user.tenantId)
        .in('status', ['COMPLETED', 'DELIVERED'])
        .gte('createdAt', sixMonthsAgo.toISOString())

    if (error) {
        console.error('Error fetching monthly revenue:', error)
        return []
    }

    // Aggregate by month in JS
    const monthlyData = (orders || []).reduce((acc: any, order: any) => {
        const date = new Date(order.createdAt)
        const month = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
        acc[month] = (acc[month] || 0) + Number(order.totalValue)
        return acc
    }, {} as Record<string, number>)

    return Object.entries(monthlyData).map(([name, value]) => ({ name, value }))
}

export async function getTopProducts(limit: number = 5) {
    const user = await getCurrentUser()
    if (!user) return []

    try {
        const supabase = await createClient()

        // Use RPC for aggregation
        const { data, error } = await supabase.rpc('get_top_products', {
            p_tenant_id: user.tenantId,
            p_limit: limit
        } as any)

        if (error) throw error

        return ((data as any[]) || []).map((item: any) => ({
            productId: item.productId,
            productName: item.productName || 'Desconhecido',
            quantity: Number(item.totalQuantity),
            revenue: 0
        }))
    } catch (e) {
        console.error('Error fetching top products:', e)
        return []
    }
}

export async function getLowStockMaterials() {
    const user = await getCurrentUser()
    if (!user) return []

    // Use shared utility for consistency
    const alerts = await calculateStockAlerts(user.tenantId)

    // Map to the format expected by the dashboard if different, 
    // but the alert format from lib/inventory.ts should be compatible or better.
    return alerts.map(a => ({
        id: a.id,
        name: a.name,
        unit: a.unit,
        quantity: a.currentQuantity,
        minQuantity: a.minQuantity
    }))
}


