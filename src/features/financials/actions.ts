'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import { revalidateWorkspaceAppPaths } from '@/lib/revalidate-workspace-path'

export const TransactionSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória'),
  amount: z.number().positive('O valor deve ser positivo'),
  type: z.enum(['IN', 'OUT']),
  category_id: z.string().uuid().optional().nullable(),
  payment_method: z
    .enum(['pix', 'credit', 'debit', 'cash', 'transfer', 'boleto', 'other'])
    .default('other'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (YYYY-MM-DD)'),
  status: z.enum(['paid', 'pending', 'cancelled']).default('paid'),
  is_recurring: z.boolean().default(false),
})

export type TransactionInput = z.infer<typeof TransactionSchema>
type FinancialSummaryRow = { amount: number | string; type: 'IN' | 'OUT'; status: string }

async function getDb() {
  return createClient()
}

async function getTenantId() {
  const db = await getDb()
  const {
    data: { user },
  } = await db.auth.getUser()
  if (!user) return null

  const { data: tenant } = await db.from('tenants').select('id').eq('owner_id', user.id).single()
  const tenantRow = tenant as { id?: string } | null
  return tenantRow?.id ?? null
}

export async function getTransactions(month: number, year: number) {
  const db = await getDb()

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`

  const { data, error } = await db
    .from('financial_transactions')
    .select(
      `
      *,
      category:transaction_categories(name, icon, color)
    `
    )
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching transactions:', error)
    throw new Error('Failed to fetch transactions')
  }

  return data
}

export async function createTransaction(input: TransactionInput) {
  const db = await getDb()
  const tenantId = await getTenantId()
  const user = await getCurrentUser()
  const workspaceSlug = user?.tenant?.slug

  if (!tenantId) throw new Error('Unauthorized')

  const { data, error } = await db
    .from('financial_transactions')
    // @ts-expect-error legacy table typing missing in generated Database type
    .insert({
      ...input,
      tenant_id: tenantId,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating transaction:', error)
    throw new Error('Failed to create transaction')
  }

  if (workspaceSlug) {
    revalidateWorkspaceAppPaths(workspaceSlug, ['/financeiro'])
  }
  return data
}

export async function updateTransaction(id: string, input: Partial<TransactionInput>) {
  const db = await getDb()
  const user = await getCurrentUser()
  const workspaceSlug = user?.tenant?.slug

  const { data, error } = await db
    .from('financial_transactions')
    // @ts-expect-error legacy table typing missing in generated Database type
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating transaction:', error)
    throw new Error('Failed to update transaction')
  }

  if (workspaceSlug) {
    revalidateWorkspaceAppPaths(workspaceSlug, ['/financeiro'])
  }
  return data
}

export async function deleteTransaction(id: string) {
  const db = await getDb()
  const user = await getCurrentUser()
  const workspaceSlug = user?.tenant?.slug

  const { error } = await db.from('financial_transactions').delete().eq('id', id)

  if (error) {
    console.error('Error deleting transaction:', error)
    throw new Error('Failed to delete transaction')
  }

  if (workspaceSlug) {
    revalidateWorkspaceAppPaths(workspaceSlug, ['/financeiro'])
  }
}

export async function getCategories() {
  const db = await getDb()

  const { data, error } = await db
    .from('transaction_categories')
    .select('*')
    .eq('active', true)
    .order('name')

  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }

  return data
}

export async function getFinancialSummary(month: number, year: number) {
  const db = await getDb()
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`

  const { data: transactions, error } = await db
    .from('financial_transactions')
    .select('amount, type, status')
    .gte('date', startDate)
    .lte('date', endDate)
    .eq('status', 'paid')

  if (error) throw new Error('Failed to fetch summary')

  const rows = (transactions || []) as FinancialSummaryRow[]

  const income = rows
    .filter(transaction => transaction.type === 'IN')
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0)

  const expenses = rows
    .filter(transaction => transaction.type === 'OUT')
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0)

  const balance = income - expenses

  return { income, expenses, balance }
}
