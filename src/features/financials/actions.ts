'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

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

async function getTenantId() {
  const supabase = (await createClient()) as any
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  return tenant?.id
}

export async function getTransactions(month: number, year: number) {
  const supabase = (await createClient()) as any

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`

  const { data, error } = await supabase
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
  const supabase = (await createClient()) as any
  const tenantId = await getTenantId()

  if (!tenantId) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('financial_transactions')
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

  revalidatePath('/[workspaceSlug]/app/financeiro')
  return data
}

export async function updateTransaction(id: string, input: Partial<TransactionInput>) {
  const supabase = (await createClient()) as any

  const { data, error } = await supabase
    .from('financial_transactions')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating transaction:', error)
    throw new Error('Failed to update transaction')
  }

  revalidatePath('/[workspaceSlug]/app/financeiro')
  return data
}

export async function deleteTransaction(id: string) {
  const supabase = (await createClient()) as any

  const { error } = await supabase.from('financial_transactions').delete().eq('id', id)

  if (error) {
    console.error('Error deleting transaction:', error)
    throw new Error('Failed to delete transaction')
  }

  revalidatePath('/[workspaceSlug]/app/financeiro')
}

export async function getCategories() {
  const supabase = (await createClient()) as any

  const { data, error } = await supabase
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
  const supabase = (await createClient()) as any
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`

  const { data: transactions, error } = await supabase
    .from('financial_transactions')
    .select('amount, type, status')
    .gte('date', startDate)
    .lte('date', endDate)
    .eq('status', 'paid')

  if (error) throw new Error('Failed to fetch summary')

  const income = transactions
    .filter((t: any) => t.type === 'IN')
    .reduce((sum: number, t: any) => sum + Number(t.amount), 0)

  const expenses = transactions
    .filter((t: any) => t.type === 'OUT')
    .reduce((sum: number, t: any) => sum + Number(t.amount), 0)

  const balance = income - expenses

  return { income, expenses, balance }
}
