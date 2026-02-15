'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
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

  try {
    const supabase = await createClient()

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

    const { data: currentInv } = await supabase
      .from('ProductInventory')
      .select('quantity')
      .eq('productId', productId)
      .eq('tenantId', user.tenantId)
      .maybeSingle<InventoryQuantityRow>()

    const adjustment = type === 'SAIDA' ? -quantity : quantity
    const newTotal = Number(currentInv?.quantity || 0) + adjustment

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

  let itemsRaw: ProductStockEntryItem[] = []
  try {
    itemsRaw = JSON.parse((formData.get('items') as string) || '[]') as ProductStockEntryItem[]
  } catch {
    return actionError('Erro ao processar itens da entrada')
  }

  const rawData = {
    supplierName: formData.get('supplierName') as string,
    freightCost: parseFloat((formData.get('freightCost') as string) || '0'),
    items: itemsRaw,
    note: formData.get('note') as string,
    paymentMethod: formData.get('paymentMethod') as string,
    installments: parseInt((formData.get('installments') as string) || '1'),
  }

  if (!rawData.supplierName) return actionError('Nome do fornecedor é obrigatório')
  if (rawData.items.length === 0) return actionError('Adicione pelo menos um item')

  const totalCost =
    rawData.items.reduce((acc, item) => acc + item.quantity * item.unitCost, 0) +
    rawData.freightCost

  const supabase = await createClient()

  try {
    // @ts-expect-error legacy schema not fully represented in generated DB types
    const { error } = await supabase.rpc('create_product_stock_entry_transaction', {
      p_tenant_id: user.tenantId,
      p_supplier_name: rawData.supplierName,
      p_freight_cost: rawData.freightCost,
      p_total_cost: totalCost,
      p_items: rawData.items,
      p_note: rawData.note,
      p_payment_method: rawData.paymentMethod,
      p_installments: rawData.installments,
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
