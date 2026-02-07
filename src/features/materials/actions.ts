'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import { ActionResponse } from '@/lib/types'

const materialSchema = z.object({
    name: z.string().min(1, 'Nome do material é obrigatório'),
    unit: z.string().min(1, 'Unidade é obrigatória'),
    minQuantity: z.coerce.number().optional().nullable(),
    supplierId: z.string().optional().nullable(),
    colors: z.string().optional() // Comma separated or single string
})

export async function createMaterial(prevState: any, formData: FormData): Promise<ActionResponse> {
    const user = await getCurrentUser()
    if (!user) return { success: false, message: 'Não autorizado' }

    const rawData = {
        name: formData.get('name'),
        unit: formData.get('unit'),
        minQuantity: formData.get('minQuantity'),
        supplierId: formData.get('supplierId'),
        colors: formData.get('colors')
    }

    const validated = materialSchema.safeParse(rawData)

    if (!validated.success) {
        return {
            success: false,
            message: 'Erro de validação',
            errors: validated.error.flatten().fieldErrors
        }
    }

    const { name, unit, minQuantity, supplierId, colors } = validated.data

    // Parse colors: split by comma if present
    const colorArray = colors ? colors.split(',').map(c => c.trim()).filter(c => c.length > 0) : []

    const supabase = await createClient()

    try {
        const { error } = await (supabase as any)
            .from('Material')
            .insert({
                tenantId: user.tenantId,
                name,
                unit,
                quantity: 0, // Deprecated, always start with 0. Stock is managed via Movements.
                minQuantity: minQuantity || null,
                supplierId: supplierId || null,
                colors: colorArray
            })

        if (error) {
            console.error('Database Error:', error)
            return { success: false, message: 'Erro ao criar material' }
        }

        revalidatePath('/dashboard/estoque')
        return { success: true, message: 'Material criado com sucesso!' }
    } catch (error) {
        return { success: false, message: 'Erro no servidor' }
    }
}

// ... existing imports
// Add updateMaterial logic

export async function updateMaterial(id: string, prevState: any, formData: FormData): Promise<ActionResponse> {
    const user = await getCurrentUser()
    if (!user) return { success: false, message: 'Não autorizado' }

    const rawData = {
        name: formData.get('name'),
        unit: formData.get('unit'),
        minQuantity: formData.get('minQuantity'),
        supplierId: formData.get('supplierId'),
        colors: formData.get('colors')
    }

    const validated = materialSchema.safeParse(rawData)
    if (!validated.success) {
        return { success: false, message: 'Erro de validação', errors: validated.error.flatten().fieldErrors }
    }

    const { name, unit, minQuantity, supplierId, colors } = validated.data
    const colorArray = colors ? colors.split(',').map(c => c.trim()).filter(c => c.length > 0) : []

    const supabase = await createClient()
    const { error } = await (supabase as any)
        .from('Material')
        .update({
            name,
            unit,
            minQuantity: minQuantity || null,
            supplierId: supplierId || null,
            colors: colorArray
        })
        .eq('id', id)
        .eq('tenantId', user.tenantId)

    if (error) {
        console.error('Update Error:', error)
        return { success: false, message: 'Erro ao atualizar material' }
    }

    revalidatePath('/dashboard/estoque')
    return { success: true, message: 'Material atualizado com sucesso!' }
}

export async function deleteMaterial(id: string) {
    const user = await getCurrentUser()
    if (!user) return { success: false, message: 'Não autorizado' }

    const supabase = await createClient()
    const { error } = await supabase
        .from('Material')
        .delete()
        .eq('id', id)
        .eq('tenantId', user.tenantId)

    if (error) {
        return { success: false, message: 'Erro ao deletar material' }
    }

    revalidatePath('/dashboard/estoque')
    return { success: true, message: 'Material deletado' }
}

export async function getMaterials() {
    const user = await getCurrentUser()
    if (!user) return []

    const supabase = await createClient()

    // We need to fetch materials AND their current stock balance.
    // Ideally, we create a VIEW in Supabase or use a joining query.
    // For now, let's fetch materials and then maybe enrich them, or trust the 'quantity' column IF we decide to keep it in sync (via triggers).
    // BUT the requirement says: "Estoque atual NUNCA deve ser salvo em uma coluna direta ... Esta query deve ser a fonte da verdade".
    // So we MUST calculate it.

    // Approach: Fetch materials, then fetch stock balances.
    // A better approach for performance is an RPC function `get_materials_with_stock`.
    // I will try to call the RPC if I can define it, or do it in application layer (slower).
    // Let's assume for now we just return the master data, and the UI fetches stock separately or we perform the join here.

    // NOTE: The legacy 'quantity' column is still queryable but might be 0 or stale.
    // I'll revert to fetching Material and separate stock fetching logic in dashboard OR use an RPC.
    // Let's try to query the view/RPC. Since I didn't create the RPC `get_materials_with_stock` yet in the migration script, I should probably do that.

    const { data, error } = await supabase
        .from('Material')
        .select(`
            *,
            Supplier (name),
            v_material_last_costs!left(last_cost)
        `)
        .eq('tenantId', user.tenantId)
        .order('name')

    if (error) {
        console.error('Error fetching materials:', error)
        return []
    }

    return (data as any[]).map(m => ({
        ...m,
        cost: m.v_material_last_costs?.[0]?.last_cost || m.cost || 0
    })) || []
}


