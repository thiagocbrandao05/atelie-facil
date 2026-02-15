'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import { revalidateWorkspaceAppPaths } from '@/lib/revalidate-workspace-path'

export const TransactionSchema = z.object({
  description: z.string().min(1, 'Descricao e obrigatoria'),
  amount: z.number().positive('O valor deve ser positivo'),
  type: z.enum(['IN', 'OUT']),
  category_id: z.string().uuid().optional().nullable(),
  payment_method: z
    .enum(['pix', 'credit', 'debit', 'cash', 'transfer', 'boleto', 'other'])
    .default('other'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data invalida (YYYY-MM-DD)'),
  status: z.enum(['paid', 'pending', 'cancelled']).default('paid'),
  is_recurring: z.boolean().default(false),
})

export type TransactionInput = z.infer<typeof TransactionSchema>
type FinancialSummaryRow = { amount: number | string; type: 'IN' | 'OUT'; status: string }
type FinancialRecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly'

type FinancialRecurrenceTemplateRow = {
  id: string
  tenant_id: string
  description: string
  amount: number | string
  type: 'IN' | 'OUT'
  category_id: string | null
  frequency: FinancialRecurrenceFrequency
  interval: number | null
  next_due_date: string
  active: boolean
}

type RecurrenceRunResult = {
  templatesProcessed: number
  generated: number
  skippedExisting: number
  errors: Array<{ templateId: string; message: string }>
}

async function getDb() {
  return createClient()
}

async function getTenantId() {
  const user = await getCurrentUser()
  return user?.tenantId ?? null
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function parseDateKey(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00.000Z`)
}

function addRecurrenceDate(
  dateKey: string,
  frequency: FinancialRecurrenceFrequency,
  interval: number
): string {
  const next = parseDateKey(dateKey)
  const safeInterval = Number.isFinite(interval) && interval > 0 ? interval : 1

  if (frequency === 'daily') {
    next.setUTCDate(next.getUTCDate() + safeInterval)
  } else if (frequency === 'weekly') {
    next.setUTCDate(next.getUTCDate() + safeInterval * 7)
  } else if (frequency === 'monthly') {
    next.setUTCMonth(next.getUTCMonth() + safeInterval)
  } else {
    next.setUTCFullYear(next.getUTCFullYear() + safeInterval)
  }

  return toDateKey(next)
}

async function processTemplateUntilToday(
  db: any,
  template: FinancialRecurrenceTemplateRow,
  todayKey: string
) {
  let generated = 0
  let skippedExisting = 0
  let nextDueDate = template.next_due_date
  let guard = 0

  while (nextDueDate <= todayKey && guard < 400) {
    guard += 1

    const { data: existing, error: existingError } = await db
      .from('financial_transactions')
      .select('id')
      .eq('recurrence_id', template.id)
      .eq('date', nextDueDate)
      .maybeSingle()

    if (existingError) {
      throw existingError
    }

    if (existing?.id) {
      skippedExisting += 1
    } else {
      const { error: insertError } = await db.from('financial_transactions').insert({
        tenant_id: template.tenant_id,
        description: template.description,
        amount: Number(template.amount),
        type: template.type,
        category_id: template.category_id,
        payment_method: 'other',
        date: nextDueDate,
        status: 'pending',
        is_recurring: true,
        recurrence_id: template.id,
        metadata: {
          generated_by: 'financial_recurrence_cron',
        },
      })

      if (insertError) {
        throw insertError
      }

      generated += 1
    }

    nextDueDate = addRecurrenceDate(nextDueDate, template.frequency, template.interval ?? 1)
  }

  const { error: updateError } = await db
    .from('financial_recurrence_templates')
    .update({ next_due_date: nextDueDate, updated_at: new Date().toISOString() })
    .eq('id', template.id)

  if (updateError) {
    throw updateError
  }

  return { generated, skippedExisting }
}

export async function processRecurringFinancialTransactions(options?: {
  useAdmin?: boolean
  referenceDate?: string
}): Promise<RecurrenceRunResult> {
  const useAdmin = options?.useAdmin === true
  const db: any = useAdmin ? createAdminClient() : await getDb()
  const user = useAdmin ? null : await getCurrentUser()
  const tenantId = useAdmin ? null : await getTenantId()
  const workspaceSlug = user?.tenant?.slug

  if (!useAdmin && !tenantId) {
    throw new Error('Unauthorized')
  }

  const today = options?.referenceDate ? parseDateKey(options.referenceDate) : new Date()
  const todayKey = toDateKey(today)

  let query = db
    .from('financial_recurrence_templates')
    .select(
      'id, tenant_id, description, amount, type, category_id, frequency, interval, next_due_date, active'
    )
    .eq('active', true)
    .lte('next_due_date', todayKey)

  if (!useAdmin && tenantId) {
    query = query.eq('tenant_id', tenantId)
  }

  const { data, error } = await query
  if (error) {
    throw error
  }

  const templates = (data || []) as FinancialRecurrenceTemplateRow[]
  const result: RecurrenceRunResult = {
    templatesProcessed: templates.length,
    generated: 0,
    skippedExisting: 0,
    errors: [],
  }

  for (const template of templates) {
    try {
      const partial = await processTemplateUntilToday(db, template, todayKey)
      result.generated += partial.generated
      result.skippedExisting += partial.skippedExisting
    } catch (templateError) {
      const message = templateError instanceof Error ? templateError.message : 'Unknown error'
      result.errors.push({ templateId: template.id, message })
    }
  }

  if (workspaceSlug && !useAdmin) {
    revalidateWorkspaceAppPaths(workspaceSlug, ['/financeiro'])
  }

  return result
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
