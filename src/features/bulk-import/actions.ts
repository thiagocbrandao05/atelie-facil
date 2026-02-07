'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { MaterialSchema, CustomerSchema, SupplierSchema } from '@/lib/schemas'

// Custom schema for Stock Balance import
const StockBalanceSchema = z.object({
    materialName: z.string().min(1, "Nome do material é obrigatório"),
    quantity: z.coerce.number().min(0, "Quantidade deve ser positiva"),
    reason: z.string().optional().default('Carga inicial em lote'),
})

export async function importMaterialsAction(data: any[]) {
    const user = await getCurrentUser()
    if (!user) return { success: false, message: 'Não autorizado' }

    try {
        const supabase = await createClient()
        const tenantId = user.tenantId

        // Validate all items first
        const validatedData = data.map(item => MaterialSchema.parse(item))

        const materialsToInsert = validatedData.map(item => ({
            ...item,
            tenantId,
            updatedAt: new Date().toISOString()
        }))

        const { error } = await supabase
            .from('Material')
            .insert(materialsToInsert as any)

        if (error) throw error

        // Audit Log
        await supabase.from('AuditLog').insert({
            tenantId,
            userId: user.id,
            action: 'IMPORT',
            entity: 'Material',
            metadata: { count: data.length, status: 'SUCCESS' }
        } as any)

        revalidatePath('/dashboard/estoque')
        return { success: true, message: `${data.length} materiais importados com sucesso!` }
    } catch (error: any) {
        console.error('Bulk Import Materials Error:', error)
        return { success: false, message: `Erro na importação: ${error.message || 'Erro desconhecido'}` }
    }
}

export async function importStockAction(data: any[]) {
    const user = await getCurrentUser()
    if (!user) return { success: false, message: 'Não autorizado' }

    try {
        const supabase = await createClient()
        const tenantId = user.tenantId

        // Validate data
        const validatedData = data.map(item => StockBalanceSchema.parse(item))

        let successCount = 0
        let errors = []

        for (const item of validatedData) {
            // Find material by name
            const { data: material, error: findError } = await supabase
                .from('Material')
                .select('id, quantity')
                .eq('tenantId', tenantId)
                .eq('name', item.materialName)
                .single()

            if (findError || !material) {
                errors.push(`Material "${item.materialName}" não encontrado.`)
                continue
            }

            // Update material quantity (Absolute set for Balance Import)
            const { error: updateError } = await (supabase as any)
                .from('Material')
                .update({ quantity: item.quantity } as any)
                .eq('id', (material as any).id)

            if (updateError) {
                errors.push(`Erro ao atualizar "${item.materialName}": ${updateError.message}`)
                continue
            }

            // Record movement
            await (supabase as any).from('InventoryMovement').insert({
                tenantId,
                materialId: (material as any).id,
                type: 'ADJUSTMENT',
                quantity: item.quantity,
                reason: item.reason,
                createdBy: user.name || user.email
            } as any)

            successCount++
        }

        // Audit Log
        await supabase.from('AuditLog').insert({
            tenantId,
            userId: user.id,
            action: 'IMPORT',
            entity: 'StockBalance',
            metadata: { successCount, errorCount: errors.length }
        } as any)

        revalidatePath('/dashboard/estoque')

        if (errors.length > 0) {
            return {
                success: successCount > 0,
                message: `Importação parcial: ${successCount} atualizados. ${errors.length} erros.`,
                errors
            }
        }

        return { success: true, message: `${successCount} saldos de estoque atualizados!` }
    } catch (error: any) {
        console.error('Bulk Import Stock Error:', error)
        return { success: false, message: `Erro na importação: ${error.message}` }
    }
}

export async function importCustomersAction(data: any[]) {
    const user = await getCurrentUser()
    if (!user) return { success: false, message: 'Não autorizado' }

    try {
        const supabase = await createClient()
        const tenantId = user.tenantId

        const validatedData = data.map(item => CustomerSchema.parse(item))

        const toInsert = validatedData.map(item => ({
            ...item,
            tenantId,
            updatedAt: new Date().toISOString()
        }))

        const { error } = await supabase
            .from('Customer')
            .insert(toInsert as any)

        if (error) throw error

        await supabase.from('AuditLog').insert({
            tenantId,
            userId: user.id,
            action: 'IMPORT',
            entity: 'Customer',
            metadata: { count: data.length }
        } as any)

        revalidatePath('/dashboard/clientes')
        return { success: true, message: `${data.length} clientes importados!` }
    } catch (error: any) {
        return { success: false, message: `Erro: ${error.message}` }
    }
}

export async function importSuppliersAction(data: any[]) {
    const user = await getCurrentUser()
    if (!user) return { success: false, message: 'Não autorizado' }

    try {
        const supabase = await createClient()
        const tenantId = user.tenantId

        const validatedData = data.map(item => SupplierSchema.parse(item))

        const toInsert = validatedData.map(item => ({
            ...item,
            tenantId,
            updatedAt: new Date().toISOString()
        }))

        const { error } = await supabase
            .from('Supplier')
            .insert(toInsert as any)

        if (error) throw error

        await supabase.from('AuditLog').insert({
            tenantId,
            userId: user.id,
            action: 'IMPORT',
            entity: 'Supplier',
            metadata: { count: data.length }
        } as any)

        revalidatePath('/dashboard/fornecedores')
        return { success: true, message: `${data.length} fornecedores importados!` }
    } catch (error: any) {
        return { success: false, message: `Erro: ${error.message}` }
    }
}
