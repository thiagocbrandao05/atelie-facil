'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// --- Schemas ---

export const TransactionSchema = z.object({
    description: z.string().min(1, 'Descrição é obrigatória'),
    amount: z.number().positive('O valor deve ser positivo'),
    type: z.enum(['IN', 'OUT']),
    category_id: z.string().uuid().optional().nullable(),
    payment_method: z.enum(['pix', 'credit', 'debit', 'cash', 'transfer', 'boleto', 'other']).default('other'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (YYYY-MM-DD)'),
    status: z.enum(['paid', 'pending', 'cancelled']).default('paid'),
    is_recurring: z.boolean().default(false),
})

export type TransactionInput = z.infer<typeof TransactionSchema>

// --- Helper ---

async function getTenantId() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('owner_id', user.id)
        .single()

    return tenant?.id
}

// --- Actions ---

export async function getTransactions(month: number, year: number) {
    const supabase = createClient()

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    // Get last day of month correctly
    const lastDay = new Date(year, month, 0).getDate()
    const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`

    const { data, error } = await supabase
        .from('financial_transactions')
        .select(`
      *,
      category:transaction_categories(name, icon, color)
    `)
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
    const supabase = createClient()
    const tenantId = await getTenantId()

    if (!tenantId) throw new Error('Unauthorized')

    const { data, error } = await supabase
        .from('financial_transactions')
        .insert({
            ...input,
            tenant_id: tenantId
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
    const supabase = createClient()

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
    const supabase = createClient()

    const { error } = await supabase
        .from('financial_transactions')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Error deleting transaction:', error)
        throw new Error('Failed to delete transaction')
    }

    revalidatePath('/[workspaceSlug]/app/financeiro')
}

export async function getCategories() {
    const supabase = createClient()

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
    const supabase = createClient()
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
        .filter(t => t.type === 'IN')
        .reduce((sum, t) => sum + Number(t.amount), 0)

    const expenses = transactions
        .filter(t => t.type === 'OUT')
        .reduce((sum, t) => sum + Number(t.amount), 0)

    const balance = income - expenses

    return { income, expenses, balance }
}

// --- Premium Features ---

export async function getFinancialHistory(months: number = 6) {
    const supabase = createClient()
    const today = new Date()

    // Calculate start date (first day of N months ago)
    const startDateObj = new Date(today.getFullYear(), today.getMonth() - months + 1, 1)
    const startDate = startDateObj.toISOString().split('T')[0]

    // Calculate end date (today or end of current month)
    const endDate = today.toISOString().split('T')[0]

    const { data: transactions, error } = await supabase
        .from('financial_transactions')
        .select('amount, type, date, status')
        .gte('date', startDate)
        .lte('date', endDate)
        .eq('status', 'paid')
        .order('date', { ascending: true })

    if (error) {
        console.error('Error fetching history:', error)
        return []
    }

    // Initialize map with all months in range to fill gaps
    const historyMap = new Map<string, { income: number; expenses: number }>()

    for (let i = 0; i < months; i++) {
        // Creates a date for the 1st of each month in the range
        // i=0 is current month (if we iterate backwards), but let's iterate forwards from start date
        const d = new Date(startDateObj.getFullYear(), startDateObj.getMonth() + i, 1)
        // Ensure we don't go beyond current month if "months" is large
        if (d > today) break;

        const key = d.toISOString().slice(0, 7) // YYYY-MM
        historyMap.set(key, { income: 0, expenses: 0 })
    }

    transactions.forEach(t => {
        const key = t.date.slice(0, 7)
        if (historyMap.has(key)) {
            const entry = historyMap.get(key)!
            if (t.type === 'IN') entry.income += Number(t.amount)
            else entry.expenses += Number(t.amount)
        }
    })

    const result = Array.from(historyMap.entries())
        .map(([key, value]) => {
            const [year, month] = key.split('-')
            // Create date object to format month name
            // Note: Date constructor uses 0-indexed month
            const date = new Date(Number(year), Number(month) - 1, 1)
            const monthName = date.toLocaleString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '')
            return {
                month: monthName,
                year,
                fullDate: key,
                income: value.income,
                expenses: value.expenses
            }
        })
        .sort((a, b) => a.fullDate.localeCompare(b.fullDate))

    return result
}

export async function getFinancialPreferences() {
    const supabase = createClient()
    const tenantId = await getTenantId()
    if (!tenantId) return null

    const { data, error } = await supabase
        .from('financial_preferences')
        .select('*')
        .eq('tenant_id', tenantId)
        .single()

    if (error && error.code !== 'PGRST116') { // Ignore not found error
        console.error('Error fetching preferences:', error)
    }

    return data
}

export async function updateFinancialPreferences(input: { monthly_revenue_goal?: number, min_daily_balance?: number }) {
    const supabase = createClient()
    const tenantId = await getTenantId()
    if (!tenantId) throw new Error('Unauthorized')

    // Check if exists
    const { data: existing } = await supabase
        .from('financial_preferences')
        .select('id')
        .eq('tenant_id', tenantId)
        .single()

    let error;

    if (existing) {
        const { error: updateError } = await supabase
            .from('financial_preferences')
            .update(input)
            .eq('tenant_id', tenantId)
        error = updateError
    } else {
        const { error: insertError } = await supabase
            .from('financial_preferences')
            .insert({
                tenant_id: tenantId,
                ...input
            })
        error = insertError
    }

    if (error) {
        console.error('Error updating preferences:', error)
        throw new Error('Failed to update preferences')
    }

    revalidatePath('/[workspaceSlug]/app/financeiro')
}

export async function getAllTransactionsForExport() {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('financial_transactions')
        .select(`
      *,
      category:transaction_categories(name)
    `)
        .order('date', { ascending: false })

    if (error) {
        console.error('Error fetching transactions for export:', error)
        throw new Error('Failed')
    }

    return data
}
