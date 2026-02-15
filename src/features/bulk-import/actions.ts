'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { MaterialSchema, CustomerSchema, SupplierSchema } from '@/lib/schemas'
import { actionError, actionSuccess, unauthorizedAction } from '@/lib/action-response'
import { revalidateWorkspaceAppPaths } from '@/lib/revalidate-workspace-path'

const StockBalanceSchema = z.object({
  materialName: z.string().min(1, 'Nome do material e obrigatorio'),
  quantity: z.coerce.number().min(0, 'Quantidade deve ser positiva'),
  reason: z.string().optional().default('Carga inicial em lote'),
})

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Erro desconhecido'
}

export async function importMaterialsAction(data: unknown[]) {
  const user = await getCurrentUser()
  if (!user) return unauthorizedAction()

  try {
    const supabase = await createClient()
    const tenantId = user.tenantId

    const validatedData = data.map(item => MaterialSchema.parse(item))
    const materialsToInsert = validatedData.map(item => ({
      ...item,
      tenantId,
      updatedAt: new Date().toISOString(),
    }))

    // @ts-expect-error legacy schema not fully represented in generated DB types
    const { error } = await supabase.from('Material').insert(materialsToInsert)
    if (error) throw error

    // @ts-expect-error legacy schema not fully represented in generated DB types
    await supabase.from('AuditLog').insert({
      tenantId,
      userId: user.id,
      action: 'IMPORT',
      entity: 'Material',
      metadata: { count: data.length, status: 'SUCCESS' },
    })

    const slug = user.tenant?.slug
    if (slug) {
      revalidateWorkspaceAppPaths(slug, ['/estoque'])
    }
    return actionSuccess(`${data.length} materiais importados com sucesso!`)
  } catch (error: unknown) {
    console.error('Bulk Import Materials Error:', error)
    return actionError(`Erro na importacao: ${getErrorMessage(error)}`)
  }
}

export async function importStockAction(data: unknown[]) {
  const user = await getCurrentUser()
  if (!user) return unauthorizedAction()

  try {
    const supabase = await createClient()
    const tenantId = user.tenantId

    const validatedData = data.map(item => StockBalanceSchema.parse(item))
    let successCount = 0
    const errors: string[] = []

    for (const item of validatedData) {
      const { data: material, error: findError } = await supabase
        .from('Material')
        .select('id, quantity')
        .eq('tenantId', tenantId)
        .eq('name', item.materialName)
        .single()
      const materialRow = material as unknown as { id: string; quantity: number } | null

      if (findError || !materialRow) {
        errors.push(`Material "${item.materialName}" nao encontrado.`)
        continue
      }

      const { error: updateError } = await supabase
        .from('Material')
        // @ts-expect-error legacy schema not fully represented in generated DB types
        .update({ quantity: item.quantity })
        .eq('id', materialRow.id)

      if (updateError) {
        errors.push(`Erro ao atualizar "${item.materialName}": ${updateError.message}`)
        continue
      }

      // @ts-expect-error legacy schema not fully represented in generated DB types
      await supabase.from('InventoryMovement').insert({
        tenantId,
        materialId: materialRow.id,
        type: 'ADJUSTMENT',
        quantity: item.quantity,
        reason: item.reason,
        createdBy: user.name || user.email,
      })

      successCount++
    }

    // @ts-expect-error legacy schema not fully represented in generated DB types
    await supabase.from('AuditLog').insert({
      tenantId,
      userId: user.id,
      action: 'IMPORT',
      entity: 'StockBalance',
      metadata: { successCount, errorCount: errors.length },
    })

    const slug = user.tenant?.slug
    if (slug) {
      revalidateWorkspaceAppPaths(slug, ['/estoque'])
    }

    if (errors.length > 0) {
      return {
        success: successCount > 0,
        message: `Importacao parcial: ${successCount} atualizados. ${errors.length} erros.`,
        errors,
      }
    }

    return actionSuccess(`${successCount} saldos de estoque atualizados!`)
  } catch (error: unknown) {
    console.error('Bulk Import Stock Error:', error)
    return actionError(`Erro na importacao: ${getErrorMessage(error)}`)
  }
}

export async function importCustomersAction(data: unknown[]) {
  const user = await getCurrentUser()
  if (!user) return unauthorizedAction()

  try {
    const supabase = await createClient()
    const tenantId = user.tenantId

    const validatedData = data.map(item => CustomerSchema.parse(item))
    const toInsert = validatedData.map(item => ({
      ...item,
      tenantId,
      updatedAt: new Date().toISOString(),
    }))

    // @ts-expect-error legacy schema not fully represented in generated DB types
    const { error } = await supabase.from('Customer').insert(toInsert)
    if (error) throw error

    // @ts-expect-error legacy schema not fully represented in generated DB types
    await supabase.from('AuditLog').insert({
      tenantId,
      userId: user.id,
      action: 'IMPORT',
      entity: 'Customer',
      metadata: { count: data.length },
    })

    const slug = user.tenant?.slug
    if (slug) {
      revalidateWorkspaceAppPaths(slug, ['/clientes'])
    }
    return actionSuccess(`${data.length} clientes importados!`)
  } catch (error: unknown) {
    return actionError(`Erro: ${getErrorMessage(error)}`)
  }
}

export async function importSuppliersAction(data: unknown[]) {
  const user = await getCurrentUser()
  if (!user) return unauthorizedAction()

  try {
    const supabase = await createClient()
    const tenantId = user.tenantId

    const validatedData = data.map(item => SupplierSchema.parse(item))
    const toInsert = validatedData.map(item => ({
      ...item,
      tenantId,
      updatedAt: new Date().toISOString(),
    }))

    // @ts-expect-error legacy schema not fully represented in generated DB types
    const { error } = await supabase.from('Supplier').insert(toInsert)
    if (error) throw error

    // @ts-expect-error legacy schema not fully represented in generated DB types
    await supabase.from('AuditLog').insert({
      tenantId,
      userId: user.id,
      action: 'IMPORT',
      entity: 'Supplier',
      metadata: { count: data.length },
    })

    const slug = user.tenant?.slug
    if (slug) {
      revalidateWorkspaceAppPaths(slug, ['/fornecedores'])
    }
    return actionSuccess(`${data.length} fornecedores importados!`)
  } catch (error: unknown) {
    return actionError(`Erro: ${getErrorMessage(error)}`)
  }
}
