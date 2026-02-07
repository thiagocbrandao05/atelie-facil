'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import { ActionResponse } from '@/lib/types'

// Schema for Stock Entry (Purchase)
const stockEntryItemSchema = z.object({
    materialId: z.string().min(1, 'Material é obrigatório'),
    quantity: z.coerce.number().positive('Quantidade deve ser maior que zero'),
    unitCost: z.coerce.number().min(0, 'Custo unitário deve ser positivo'),
    color: z.string().optional().nullable()
})

const createStockEntrySchema = z.object({
    supplierName: z.string().min(1, 'Nome do fornecedor é obrigatório'),
    freightCost: z.coerce.number().min(0).default(0),
    items: z.array(stockEntryItemSchema).min(1, 'Adicione pelo menos um item'),
    note: z.string().optional()
})

// Schema for Manual Movement
const manualMovementSchema = z.object({
    materialId: z.string().min(1, 'Material é obrigatório'),
    type: z.enum(['ENTRADA_AJUSTE', 'SAIDA_AJUSTE', 'PERDA', 'RETIRADA', 'ENTRADA']),
    quantity: z.coerce.number().positive('Quantidade deve ser maior que zero'),
    color: z.string().optional().nullable(),
    note: z.string().optional() // required for PERDA/RETIRADA handled in logic
})

export async function createStockEntry(prevState: any, formData: FormData): Promise<ActionResponse> {
    const user = await getCurrentUser()
    if (!user) return { success: false, message: 'Não autorizado' }

    // Parse items from JSON string if coming from a complex form, or handle otherwise.
    // Ideally we want to pass a raw object, but if using standard Server Actions with FormData:
    // We might need to handle 'items' as a JSON string field.
    let itemsRaw = []
    try {
        itemsRaw = JSON.parse(formData.get('items') as string || '[]')
    } catch (e) {
        return { success: false, message: 'Erro ao processar itens da entrada' }
    }

    const rawData = {
        supplierName: formData.get('supplierName'),
        freightCost: formData.get('freightCost'),
        items: itemsRaw,
        note: formData.get('note')
    }

    const validated = createStockEntrySchema.safeParse(rawData)
    if (!validated.success) {
        return {
            success: false,
            message: 'Erro de validação',
            errors: validated.error.flatten().fieldErrors
        }
    }

    const { supplierName, freightCost, items, note } = validated.data
    const totalCost = items.reduce((acc, item) => acc + (item.quantity * item.unitCost), 0) + freightCost

    const supabase = await createClient()

    try {
        // We need a transaction. Supabase-js doesn't support convenient transactions for multiple inserts affecting different tables easily unless we use RPC or just multiple calls (which aren't atomic).
        // For strict atomicity as requested ("Transação atômica (BEGIN / COMMIT)"), we should simpler use an RPC if possible, OR chain queries carefully and handle rollback manually (hard).
        // OR rely on the fact that if this fails midway we have a partial state. 
        // User requested: "Transação atômica (BEGIN / COMMIT)".
        // BEST APPROACH: Write a PL/PGSQL function `create_stock_entry_transaction` and call it via RPC.

        const { data, error } = await (supabase as any).rpc('create_stock_entry_transaction', {
            p_tenant_id: user.tenantId,
            p_supplier_name: supplierName,
            p_freight_cost: freightCost,
            p_total_cost: totalCost,
            p_items: items, // JSONB array
            p_note: note
        })

        if (error) throw error

        revalidatePath('/dashboard/estoque')
        return { success: true, message: 'Entrada de estoque registrada com sucesso!' }
    } catch (error: any) {
        console.error('Create Stock Entry Error:', error)
        return { success: false, message: 'Erro ao registrar entrada: ' + error.message }
    }
}

export async function addManualStockMovement(prevState: any, formData: FormData): Promise<ActionResponse> {
    const user = await getCurrentUser()
    if (!user) return { success: false, message: 'Não autorizado' }

    const rawData = {
        materialId: formData.get('materialId'),
        type: formData.get('type'),
        quantity: formData.get('quantity'),
        color: formData.get('color'),
        note: formData.get('note')
    }

    const validated = manualMovementSchema.safeParse(rawData)
    if (!validated.success) {
        return {
            success: false,
            message: 'Erro de validação',
            errors: validated.error.flatten().fieldErrors
        }
    }

    const { materialId, type, quantity, color, note } = validated.data

    // Check strict requirement: note mandatory for PERDA/RETIRADA
    if ((type === 'PERDA' || type === 'RETIRADA') && !note?.trim()) {
        return {
            success: false,
            message: 'Observação é obrigatória para Perda ou Retirada',
            errors: { note: ['Campo obrigatório'] }
        }
    }

    const supabase = await createClient()

    const { error } = await (supabase as any).from('stock_movements').insert({
        tenant_id: user.tenantId, // Using snake_case as per new schema
        material_id: materialId,
        type,
        quantity,
        color: color || null,
        note: note || '',
        source: 'MANUAL'
    })

    if (error) {
        console.error('Manual Movement Error:', error)
        return { success: false, message: 'Erro ao registrar movimentação' }
    }

    revalidatePath('/dashboard/estoque')
    return { success: true, message: 'Movimentação registrada com sucesso!' }
}

export async function getStockBalance(materialId: string) {
    const user = await getCurrentUser()
    if (!user) return 0

    const supabase = await createClient()

    // Calculate simple balance: (ENTRADA + ENTRADA_AJUSTE) - (SAIDA + SAIDA_AJUSTE + PERDA + RETIRADA)
    // We can do this via RPC for performance or a raw query.
    // RPC `get_material_stock` would be ideal.

    const { data, error } = await (supabase as any).rpc('get_material_balance', {
        p_tenant_id: user.tenantId,
        p_material_id: materialId
    })

    if (error) return 0
    return data as number
}

export async function getStockReport() {
    const user = await getCurrentUser()
    if (!user) return []

    const supabase = await createClient()

    const { data: movements, error } = await supabase
        .from('stock_movements')
        .select('material_id, type, quantity, color')
        .eq('tenant_id', user.tenantId)

    if (error || !movements) return []

    // 3. Calculate balances with color breakdown
    const balances: Record<string, number> = {} // Key: "materialId:color" or just flat list

    // A better structure might be accurate map
    // Let's return a flat list of items that have stock
    const stockMap = new Map<string, number>() // Key: materialId|color
    const movementsList = movements as any[];

    movementsList.forEach(m => {
        const qty = Number(m.quantity)
        const color = m.color ? m.color.trim() : 'DEFAULT'
        const key = `${m.material_id}|${color}`

        const isIn = ['ENTRADA', 'ENTRADA_AJUSTE'].includes(m.type)
        const isOut = ['SAIDA_AJUSTE', 'SAIDA', 'PERDA', 'RETIRADA'].includes(m.type)

        const current = stockMap.get(key) || 0
        if (isIn) stockMap.set(key, current + qty)
        if (isOut) stockMap.set(key, current - qty)
    })

    return Array.from(stockMap.entries()).map(([key, balance]) => {
        const [materialId, color] = key.split('|')
        return {
            materialId,
            color: color === 'DEFAULT' ? null : color,
            balance
        }
    })
}


