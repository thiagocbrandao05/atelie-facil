'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'

export type MonthlyFinancialSummary = {
  month: string // YYYY-MM
  revenue: number
  fixedExpenses: number
  variableExpenses: number
  totalExpenses: number
  profit: number
  margin: number
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

export async function getMonthlyFinancialSummary(
  month: number,
  year: number
): Promise<MonthlyFinancialSummary> {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  const supabase = await createClient()
  const tenantId = user.tenantId

  // 1. Calculate Date Range
  const startDate = new Date(year, month - 1, 1).toISOString()
  const endDate = new Date(year, month, 0).toISOString() // Last day of month

  // 2. Fetch Revenue (Orders)
  // Considering 'READY' and 'DELIVERED' as finalized/paid for revenue
  const { data: orders, error: ordersError } = await supabase
    .from('Order')
    .select('totalValue, status, createdAt')
    .eq('tenantId', tenantId)
    .in('status', ['READY', 'DELIVERED']) // TODO: Check if paid_at exists, fallback to status
    .gte('createdAt', startDate) // Using createdAt as proxy for paid_at if not available
    .lte('createdAt', endDate)

  if (ordersError) throw new Error(`Error fetching orders: ${ordersError.message}`)

  const revenue =
    (orders as any[])?.reduce((sum, order) => sum + (Number(order.totalValue) || 0), 0) || 0

  // 3. Fetch Variable Expenses (StockEntries / Material Purchases)
  const { data: purchases, error: purchasesError } = await supabase
    .from('StockEntry')
    .select('totalCost')
    .eq('tenantId', tenantId)
    .gte('createdAt', startDate)
    .lte('createdAt', endDate)

  if (purchasesError) throw new Error(`Error fetching purchases: ${purchasesError.message}`)

  const variableExpenses =
    (purchases as any[])?.reduce((sum, purchase) => sum + (Number(purchase.totalCost) || 0), 0) || 0

  // 4. Fetch Fixed Expenses (Settings)
  const { data: settings, error: settingsError } = await supabase
    .from('Settings')
    .select('monthlyFixedCosts, desirableSalary')
    .eq('tenantId', tenantId)
    .single()

  if (settingsError && settingsError.code !== 'PGRST116')
    throw new Error(`Error fetching settings: ${settingsError.message}`)

  let fixedExpenses = 0
  if (settings) {
    const s = settings as any
    const salary = Number(s.desirableSalary) || 0
    const costs = Array.isArray(s.monthlyFixedCosts)
      ? s.monthlyFixedCosts.reduce((sum: number, item: any) => sum + (Number(item.value) || 0), 0)
      : 0
    fixedExpenses = salary + costs
  }

  // 5. Calculate Totals
  const totalExpenses = fixedExpenses + variableExpenses
  const profit = revenue - totalExpenses
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0

  return {
    month: `${MONTH_NAMES[month - 1]} ${year}`,
    revenue,
    fixedExpenses,
    variableExpenses,
    totalExpenses,
    profit,
    margin,
  }
}

export async function getFinancialHistory(
  monthsToGoBack: number = 6
): Promise<MonthlyFinancialSummary[]> {
  const history: MonthlyFinancialSummary[] = []
  const today = new Date()

  for (let i = 0; i < monthsToGoBack; i++) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1)
    const summary = await getMonthlyFinancialSummary(date.getMonth() + 1, date.getFullYear())
    history.unshift(summary) // Add to beginning to have chronological order
  }

  return history
}
