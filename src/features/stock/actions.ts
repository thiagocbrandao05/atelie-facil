'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import { ActionResponse } from '@/lib/types'
import { actionError, actionSuccess, unauthorizedAction } from '@/lib/action-response'
import { buildWorkspaceAppPaths } from '@/lib/workspace-path'

const stockEntryItemSchema = z.object({
  materialId: z.string().min(1, 'Material é obrigatório'),
  quantity: z.coerce.number().positive('Quantidade deve ser maior que zero'),
  unitCost: z.coerce.number().min(0, 'Custo unitário deve ser positivo'),
  color: z.string().optional().nullable(),
})

const createStockEntrySchema = z.object({
  supplierName: z.string().min(1, 'Nome do fornecedor é obrigatório'),
  freightCost: z.coerce.number().min(0).default(0),
  items: z.array(stockEntryItemSchema).min(1, 'Adicione pelo menos um item'),
  note: z.string().optional(),
  paymentMethod: z.string().optional(),
  installments: z.coerce.number().min(1).optional().default(1),
})

const manualMovementSchema = z.object({
  materialId: z.string().min(1, 'Material é obrigatório'),
  type: z.enum(['ENTRADA_AJUSTE', 'SAIDA_AJUSTE', 'PERDA', 'RETIRADA', 'ENTRADA']),
  quantity: z.coerce.number().positive('Quantidade deve ser maior que zero'),
  color: z.string().optional().nullable(),
  note: z.string().optional(),
})

export async function createStockEntry(
  prevState: any,
  formData: FormData
): Promise<ActionResponse> {
  const user = await getCurrentUser()
  if (!user) return unauthorizedAction()

  let itemsRaw = []
  try {
    itemsRaw = JSON.parse((formData.get('items') as string) || '[]')
  } catch {
    return actionError('Erro ao processar itens da entrada')
  }

  const rawData = {
    supplierName: formData.get('supplierName'),
    freightCost: formData.get('freightCost'),
    items: itemsRaw,
    note: formData.get('note'),
    paymentMethod: formData.get('paymentMethod') || undefined,
    installments: formData.get('installments') || undefined,
  }

  const validated = createStockEntrySchema.safeParse(rawData)
  if (!validated.success) {
    return actionError('Erro de validação', validated.error.flatten().fieldErrors)
  }

  const { supplierName, freightCost, items, note, paymentMethod, installments } = validated.data
  const totalCost =
    items.reduce((acc, item) => acc + item.quantity * item.unitCost, 0) + freightCost

  const supabase = await createClient()

  try {
    const { error } = await (supabase as any).rpc('create_stock_entry_transaction', {
      p_tenant_id: user.tenantId,
      p_supplier_name: supplierName,
      p_freight_cost: freightCost,
      p_total_cost: totalCost,
      p_items: items,
      p_note: note,
      p_payment_method: paymentMethod,
      p_installments: installments,
    })

    if (error) throw error

    const slug = user.tenant?.slug
    if (slug) {
      for (const path of buildWorkspaceAppPaths(slug, ['/estoque'])) {
        revalidatePath(path)
      }
    }
    return actionSuccess('Entrada de estoque registrada com sucesso!')
  } catch (error: any) {
    console.error('Create Stock Entry Error:', error)
    return actionError('Erro ao registrar entrada: ' + error.message)
  }
}

export async function addManualStockMovement(
  prevState: any,
  formData: FormData
): Promise<ActionResponse> {
  const user = await getCurrentUser()
  if (!user) return unauthorizedAction()

  const rawData = {
    materialId: formData.get('materialId'),
    type: formData.get('type'),
    quantity: formData.get('quantity'),
    color: formData.get('color'),
    note: formData.get('note'),
  }

  const validated = manualMovementSchema.safeParse(rawData)
  if (!validated.success) {
    return actionError('Erro de validação', validated.error.flatten().fieldErrors)
  }

  const { materialId, type, quantity, color, note } = validated.data

  if ((type === 'PERDA' || type === 'RETIRADA') && !note?.trim()) {
    return actionError('Observação é obrigatória para Perda ou Retirada', {
      note: ['Campo obrigatório'],
    })
  }

  const supabase = await createClient()

  const { error } = await (supabase as any).from('stock_movements').insert({
    tenant_id: user.tenantId,
    material_id: materialId,
    type,
    quantity,
    color: color || null,
    note: note || '',
    source: 'MANUAL',
  })

  if (error) {
    console.error('Manual Movement Error:', error)
    return actionError('Erro ao registrar movimentação')
  }

  const slug = user.tenant?.slug
  if (slug) {
    for (const path of buildWorkspaceAppPaths(slug, ['/estoque'])) {
      revalidatePath(path)
    }
  }
  return actionSuccess('Movimentação registrada com sucesso!')
}

export async function getStockReport() {
  const user = await getCurrentUser()
  if (!user) return []

  const supabase = await createClient()
  const { data: movements, error } = await supabase
    .from('InventoryMovement')
    .select('materialId, type, quantity, reason, reference, color')
    .eq('tenantId', user.tenantId)

  if (error || !movements) return []

  const stockMap = new Map<string, number>()
  const movementsList = movements as any[]

  movementsList.forEach(movement => {
    const qty = Number(movement.quantity)
    const color = movement.color ? movement.color.trim() : 'DEFAULT'
    const key = `${movement.materialId}|${color}`

    const isIn = ['ENTRADA', 'ENTRADA_AJUSTE'].includes(movement.type)
    const isOut = ['SAIDA', 'SAIDA_AJUSTE', 'PERDA', 'RETIRADA'].includes(movement.type)

    const current = stockMap.get(key) || 0
    if (isIn) stockMap.set(key, current + qty)
    if (isOut) stockMap.set(key, current - qty)
  })

  return Array.from(stockMap.entries()).map(([key, balance]) => {
    const [materialId, color] = key.split('|')
    return {
      materialId,
      color: color === 'DEFAULT' ? null : color,
      balance,
    }
  })
}
