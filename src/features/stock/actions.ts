'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import { ActionResponse } from '@/lib/types'
import { actionError, actionSuccess, unauthorizedAction } from '@/lib/action-response'
import { revalidateWorkspaceAppPaths } from '@/lib/revalidate-workspace-path'

const MAX_ENTRY_ITEMS = 200
const MAX_NOTE_LENGTH = 500
const MAX_MONEY_VALUE = 1_000_000
const PAYMENT_METHODS = ['A_VISTA', 'CREDIT_CARD', 'DEBIT_CARD', 'BOLETO'] as const

const stockEntryItemSchema = z.object({
  materialId: z.string().min(1, 'Material e obrigatorio'),
  quantity: z.coerce
    .number()
    .positive('Quantidade deve ser maior que zero')
    .max(MAX_MONEY_VALUE, 'Quantidade muito alta'),
  unitCost: z.coerce
    .number()
    .min(0, 'Custo unitario deve ser positivo')
    .max(MAX_MONEY_VALUE, 'Custo unitario muito alto'),
  color: z.string().optional().nullable(),
})

const createStockEntrySchema = z
  .object({
    supplierName: z.string().trim().min(1, 'Nome do fornecedor e obrigatorio').max(120),
    freightCost: z.coerce.number().min(0).max(MAX_MONEY_VALUE).default(0),
    items: z
      .array(stockEntryItemSchema)
      .min(1, 'Adicione pelo menos um item')
      .max(MAX_ENTRY_ITEMS, `Maximo de ${MAX_ENTRY_ITEMS} itens por entrada`),
    note: z.string().max(MAX_NOTE_LENGTH, 'Observacao muito longa').optional(),
    paymentMethod: z.enum(PAYMENT_METHODS).optional().default('A_VISTA'),
    installments: z.coerce.number().int().min(1).max(24).optional().default(1),
  })
  .superRefine((data, ctx) => {
    const seen = new Set<string>()

    data.items.forEach((item, index) => {
      const colorKey = (item.color || '').trim().toLowerCase()
      const key = `${item.materialId.trim()}::${colorKey}`
      if (seen.has(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['items', index, 'materialId'],
          message: 'Item duplicado (mesmo material e cor) na mesma entrada.',
        })
        return
      }
      seen.add(key)
    })

    if (data.paymentMethod !== 'CREDIT_CARD' && data.installments !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['installments'],
        message: 'Parcelas so podem ser usadas para cartao de credito.',
      })
    }
  })

const manualMovementSchema = z.object({
  materialId: z.string().min(1, 'Material e obrigatorio'),
  type: z.enum(['ENTRADA_AJUSTE', 'SAIDA_AJUSTE', 'PERDA', 'RETIRADA', 'ENTRADA']),
  quantity: z.coerce
    .number()
    .positive('Quantidade deve ser maior que zero')
    .max(MAX_MONEY_VALUE, 'Quantidade muito alta'),
  color: z.string().optional().nullable(),
  note: z.string().max(MAX_NOTE_LENGTH, 'Observacao muito longa').optional(),
})

type InventoryMovementRow = {
  materialId: string
  type: string
  quantity: number
  color: string | null
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Erro desconhecido'
}

export async function createStockEntry(
  _prevState: unknown,
  formData: FormData
): Promise<ActionResponse> {
  const user = await getCurrentUser()
  if (!user) return unauthorizedAction()

  let itemsRaw: z.infer<typeof stockEntryItemSchema>[] = []
  const itemsPayload = formData.get('items')
  if (typeof itemsPayload !== 'string') {
    return actionError('Erro ao processar itens da entrada')
  }

  try {
    const parsed = JSON.parse(itemsPayload || '[]') as unknown
    if (!Array.isArray(parsed)) {
      return actionError('Erro ao processar itens da entrada')
    }
    itemsRaw = parsed as z.infer<typeof stockEntryItemSchema>[]
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
    return actionError('Erro de validacao', validated.error.flatten().fieldErrors)
  }

  const { supplierName, freightCost, items, note, paymentMethod, installments } = validated.data
  const totalCost =
    items.reduce((acc, item) => acc + item.quantity * item.unitCost, 0) + freightCost

  const supabase = await createClient()

  try {
    // @ts-expect-error legacy schema not fully represented in generated DB types
    const { error } = await supabase.rpc('create_stock_entry_transaction', {
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
      revalidateWorkspaceAppPaths(slug, ['/estoque'])
    }
    return actionSuccess('Entrada de estoque registrada com sucesso!')
  } catch (error: unknown) {
    console.error('Create Stock Entry Error:', error)
    return actionError('Erro ao registrar entrada: ' + getErrorMessage(error))
  }
}

export async function addManualStockMovement(
  _prevState: unknown,
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
    return actionError('Erro de validacao', validated.error.flatten().fieldErrors)
  }

  const { materialId, type, quantity, color, note } = validated.data

  if ((type === 'PERDA' || type === 'RETIRADA') && !note?.trim()) {
    return actionError('Observacao e obrigatoria para Perda ou Retirada', {
      note: ['Campo obrigatorio'],
    })
  }

  const supabase = await createClient()

  // @ts-expect-error legacy schema not fully represented in generated DB types
  const { error } = await supabase.from('stock_movements').insert({
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
    return actionError('Erro ao registrar movimentacao')
  }

  const slug = user.tenant?.slug
  if (slug) {
    revalidateWorkspaceAppPaths(slug, ['/estoque'])
  }
  return actionSuccess('Movimentacao registrada com sucesso!')
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
  const movementsList = movements as InventoryMovementRow[]

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
