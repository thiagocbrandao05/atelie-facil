'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { z } from 'zod'
import type {
  ActionResponse,
  ProductInventory,
  ProductInventoryMovement,
  ProductInventoryMovementType,
} from '@/lib/types'
import { actionError, actionSuccess, unauthorizedAction } from '@/lib/action-response'
import { revalidateWorkspaceAppPaths } from '@/lib/revalidate-workspace-path'

type InventoryQuantityRow = { quantity: number | null }
type ProductInventoryWithProduct = ProductInventory & {
  product?: { id: string; name: string; imageUrl: string | null } | null
}
type ProductInventoryAlertRow = {
  id: string
  quantity: number
  minQuantity: number | null
  product?: { name: string; imageUrl: string | null } | null
}
type ProductMovementWithProduct = ProductInventoryMovement & {
  product?: { name: string } | null
}
type ProductStockEntryItem = {
  productId: string
  quantity: number
  unitCost: number
}

const MAX_ENTRY_ITEMS = 200
const MAX_NOTE_LENGTH = 500
const MAX_MONEY_VALUE = 1_000_000
const PAYMENT_METHODS = ['A_VISTA', 'CREDIT_CARD', 'DEBIT_CARD', 'BOLETO'] as const

const productStockEntryItemSchema = z.object({
  productId: z.string().min(1, 'Produto e obrigatorio'),
  quantity: z.coerce
    .number()
    .int('Quantidade deve ser inteira')
    .positive('Quantidade deve ser maior que zero')
    .max(MAX_MONEY_VALUE, 'Quantidade muito alta'),
  unitCost: z.coerce
    .number()
    .min(0, 'Custo unitario invalido')
    .max(MAX_MONEY_VALUE, 'Custo unitario muito alto'),
})

const createProductStockEntrySchema = z
  .object({
    supplierName: z.string().trim().min(1, 'Nome do fornecedor e obrigatorio').max(120),
    freightCost: z.coerce.number().min(0).max(MAX_MONEY_VALUE).default(0),
    items: z
      .array(productStockEntryItemSchema)
      .min(1, 'Adicione pelo menos um item')
      .max(MAX_ENTRY_ITEMS, `Maximo de ${MAX_ENTRY_ITEMS} itens por entrada`),
    note: z.string().max(MAX_NOTE_LENGTH, 'Observacao muito longa').optional(),
    paymentMethod: z.enum(PAYMENT_METHODS).optional().default('A_VISTA'),
    installments: z.coerce.number().int().min(1).max(24).optional().default(1),
  })
  .superRefine((data, ctx) => {
    const seen = new Set<string>()
    data.items.forEach((item, index) => {
      const key = item.productId.trim()
      if (seen.has(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['items', index, 'productId'],
          message: 'Produto duplicado na mesma entrada.',
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

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Erro desconhecido'
}

export async function getProductsInventory(): Promise<ProductInventory[]> {
  const user = await getCurrentUser()
  if (!user) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ProductInventory')
    .select(
      `
      *,
      product:Product(id, name, imageUrl)
    `
    )
    .eq('tenantId', user.tenantId)

  if (error) {
    console.error('Error fetching product inventory:', error)
    return []
  }

  return (data ?? []) as ProductInventoryWithProduct[]
}

export async function adjustProductStock(
  productId: string,
  quantity: number,
  type: ProductInventoryMovementType,
  reason: string,
  reference?: string
): Promise<ActionResponse> {
  const user = await getCurrentUser()
  if (!user) return unauthorizedAction()

  if (!productId?.trim()) {
    return actionError('Produto invalido.')
  }
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return actionError('Quantidade invalida.')
  }
  if (!reason?.trim()) {
    return actionError('Motivo obrigatorio.')
  }

  try {
    const supabase = await createClient()

    const { data: currentInv } = await supabase
      .from('ProductInventory')
      .select('quantity')
      .eq('productId', productId)
      .eq('tenantId', user.tenantId)
      .maybeSingle<InventoryQuantityRow>()

    const adjustment = type === 'SAIDA' ? -quantity : quantity
    const newTotal = Number(currentInv?.quantity || 0) + adjustment

    if (newTotal < 0) {
      return actionError('Estoque insuficiente para esta saida.')
    }

    if (currentInv) {
      const { error: updError } = await supabase
        .from('ProductInventory')
        // @ts-expect-error legacy schema not fully represented in generated DB types
        .update({ quantity: newTotal, updatedAt: new Date().toISOString() })
        .eq('productId', productId)
        .eq('tenantId', user.tenantId)
      if (updError) throw updError
    } else {
      // @ts-expect-error legacy schema not fully represented in generated DB types
      const { error: insError } = await supabase.from('ProductInventory').insert({
        tenantId: user.tenantId,
        productId,
        quantity: newTotal,
        minQuantity: 0,
      })
      if (insError) throw insError
    }

    // @ts-expect-error legacy schema not fully represented in generated DB types
    const { error: moveError } = await supabase.from('ProductInventoryMovement').insert({
      tenantId: user.tenantId,
      productId,
      type,
      quantity,
      reason,
      reference,
      createdBy: user.id,
    })
    if (moveError) throw moveError

    const slug = user.tenant?.slug
    if (slug) {
      revalidateWorkspaceAppPaths(slug, ['/estoque-produtos'])
    }
    return actionSuccess('Estoque atualizado com sucesso!')
  } catch (error: unknown) {
    console.error('Error adjusting product stock:', error)
    return actionError('Erro ao atualizar estoque: ' + getErrorMessage(error))
  }
}

export async function getProductStockAlerts() {
  const user = await getCurrentUser()
  if (!user) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ProductInventory')
    .select(
      `
          id,
          quantity,
          minQuantity,
          product:Product(name, imageUrl)
        `
    )
    .eq('tenantId', user.tenantId)
    .not('minQuantity', 'is', null)

  if (error) {
    console.error('Error fetching product stock alerts:', error)
    return []
  }

  return ((data ?? []) as ProductInventoryAlertRow[])
    .filter(item => item.quantity <= (item.minQuantity || 0))
    .map(item => ({
      id: item.id,
      name: item.product?.name || 'Produto Desconhecido',
      currentQuantity: item.quantity,
      minQuantity: item.minQuantity,
      unit: 'un',
      severity:
        item.quantity <= 0
          ? 'critical'
          : item.quantity <= (item.minQuantity || 0) / 2
            ? 'high'
            : 'medium',
    }))
}

export async function getAllProductInventoryMovements(): Promise<ProductInventoryMovement[]> {
  const user = await getCurrentUser()
  if (!user) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ProductInventoryMovement')
    .select(
      `
          *,
          product:Product(name)
        `
    )
    .eq('tenantId', user.tenantId)
    .order('createdAt', { ascending: false })
    .limit(100)

  if (error) {
    console.error('Error fetching all product movements:', error)
    return []
  }

  return (data ?? []) as ProductMovementWithProduct[]
}

export async function createProductStockEntry(
  _prevState: unknown,
  formData: FormData
): Promise<ActionResponse> {
  const user = await getCurrentUser()
  if (!user) return unauthorizedAction()

  let itemsRaw: unknown[] = []
  const itemsPayload = formData.get('items')
  if (typeof itemsPayload !== 'string') {
    return actionError('Erro ao processar itens da entrada')
  }

  try {
    const parsed = JSON.parse(itemsPayload || '[]') as unknown
    if (!Array.isArray(parsed)) {
      return actionError('Erro ao processar itens da entrada')
    }
    itemsRaw = parsed
  } catch {
    return actionError('Erro ao processar itens da entrada')
  }

  const validated = createProductStockEntrySchema.safeParse({
    supplierName: formData.get('supplierName'),
    freightCost: formData.get('freightCost'),
    items: itemsRaw,
    note: formData.get('note'),
    paymentMethod: formData.get('paymentMethod') || undefined,
    installments: formData.get('installments') || undefined,
  })

  if (!validated.success) {
    return actionError('Erro de validacao', validated.error.flatten().fieldErrors)
  }

  const { supplierName, freightCost, items, note, paymentMethod, installments } = validated.data
  const totalCost =
    items.reduce((acc, item) => acc + item.quantity * item.unitCost, 0) + freightCost

  const supabase = await createClient()

  try {
    // @ts-expect-error legacy schema not fully represented in generated DB types
    const { error } = await supabase.rpc('create_product_stock_entry_transaction', {
      p_tenant_id: user.tenantId,
      p_supplier_name: supplierName,
      p_freight_cost: freightCost,
      p_total_cost: totalCost,
      p_items: items as ProductStockEntryItem[],
      p_note: note,
      p_payment_method: paymentMethod,
      p_installments: installments,
    })

    if (error) throw error

    const slug = user.tenant?.slug
    if (slug) {
      revalidateWorkspaceAppPaths(slug, ['/estoque-produtos'])
    }
    return actionSuccess('Entrada de estoque registrada com sucesso!')
  } catch (error: unknown) {
    console.error('Create Product Stock Entry Error:', error)
    return actionError('Erro ao registrar entrada: ' + getErrorMessage(error))
  }
}
