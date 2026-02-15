'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth'
import type {
  ActionResponse,
  ProductInventory,
  ProductInventoryMovement,
  ProductInventoryMovementType,
} from '@/lib/types'

/**
 * Obtém o estoque de todos os produtos do tenant
 */
export async function getProductsInventory(): Promise<ProductInventory[]> {
  const user = await getCurrentUser()
  if (!user) return []

  const supabase = await createClient()
  const { data, error } = await (supabase as any)
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

  return data as any[]
}

/**
 * Ajusta o estoque de um produto (Entrada, Saída ou Ajuste)
 */
export async function adjustProductStock(
  productId: string,
  quantity: number,
  type: ProductInventoryMovementType,
  reason: string,
  reference?: string
): Promise<ActionResponse> {
  const user = await getCurrentUser()
  if (!user) return { success: false, message: 'Não autorizado' }

  try {
    const supabase = await createClient()

    // Usar uma transação ou RPC para garantir atomicidade
    // Por simplicidade aqui, usaremos o padrão de insert na tabela de movimentação
    // e o banco cuidará do saldo via trigger (se configurado) ou atualizaremos manualmente.
    // Como ainda não temos tigger de saldo automático para produto pronto, faremos manual.

    // 1. Registrar movimento
    const { error: moveError } = await (supabase as any).from('ProductInventoryMovement').insert({
      tenantId: user.tenantId,
      productId,
      type,
      quantity,
      reason,
      reference,
      createdBy: user.id,
    })

    if (moveError) throw moveError

    // 2. Atualizar saldo na tabela ProductInventory
    // Primeiro verifica se existe registro
    const { data: currentInv } = await (supabase as any)
      .from('ProductInventory')
      .select('quantity')
      .eq('productId', productId)
      .eq('tenantId', user.tenantId)
      .single()

    const adjustment = type === 'SAIDA' ? -quantity : quantity
    const newTotal = ((currentInv as any)?.quantity || 0) + adjustment

    if (currentInv) {
      const { error: updError } = await (supabase as any)
        .from('ProductInventory')
        .update({ quantity: newTotal, updatedAt: new Date().toISOString() })
        .eq('productId', productId)
        .eq('tenantId', user.tenantId)

      if (updError) throw updError
    } else {
      const { error: insError } = await (supabase as any).from('ProductInventory').insert({
        tenantId: user.tenantId,
        productId,
        quantity: newTotal,
        minQuantity: 0,
      })

      if (insError) throw insError
    }

    revalidatePath('/estoque-produtos')
    return { success: true, message: 'Estoque atualizado com sucesso!' }
  } catch (error: any) {
    console.error('Error adjusting product stock:', error)
    return { success: false, message: 'Erro ao atualizar estoque: ' + error.message }
  }
}

/**
 * Obtém alertas de estoque baixo de produtos acabados
 */
export async function getProductStockAlerts() {
  const user = await getCurrentUser()
  if (!user) return []

  const supabase = await createClient()
  const { data, error } = await (supabase as any)
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

  return (data as any[])
    .filter(item => item.quantity <= (item.minQuantity || 0))
    .map(item => ({
      id: item.id,
      name: item.product?.name || 'Produto Desconhecido',
      currentQuantity: item.quantity,
      minQuantity: item.minQuantity,
      unit: 'un', // Produtos acabados são geralmente em unidades
      severity:
        item.quantity <= 0
          ? 'critical'
          : item.quantity <= (item.minQuantity || 0) / 2
            ? 'high'
            : 'medium',
    }))
}

/**
 * Obtém todas as movimentações de estoque de produtos acabados
 */
export async function getAllProductInventoryMovements(): Promise<ProductInventoryMovement[]> {
  const user = await getCurrentUser()
  if (!user) return []

  const supabase = await createClient()
  const { data, error } = await (supabase as any)
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

  return data as any[]
}

/**
 * Registra uma entrada de estoque de produtos acabados (Compra)
 */
export async function createProductStockEntry(
  prevState: any,
  formData: FormData
): Promise<ActionResponse> {
  const user = await getCurrentUser()
  if (!user) return { success: false, message: 'Não autorizado' }

  let itemsRaw = []
  try {
    itemsRaw = JSON.parse((formData.get('items') as string) || '[]')
  } catch (e) {
    return { success: false, message: 'Erro ao processar itens da entrada' }
  }

  const rawData = {
    supplierName: formData.get('supplierName') as string,
    freightCost: parseFloat((formData.get('freightCost') as string) || '0'),
    items: itemsRaw,
    note: formData.get('note') as string,
    paymentMethod: formData.get('paymentMethod') as string,
    installments: parseInt((formData.get('installments') as string) || '1'),
  }

  if (!rawData.supplierName) return { success: false, message: 'Nome do fornecedor é obrigatório' }
  if (rawData.items.length === 0) return { success: false, message: 'Adicione pelo menos um item' }

  const totalCost =
    rawData.items.reduce((acc: number, item: any) => acc + item.quantity * item.unitCost, 0) +
    rawData.freightCost

  const supabase = await createClient()

  try {
    const { data, error } = await (supabase as any).rpc('create_product_stock_entry_transaction', {
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

    revalidatePath('/estoque-produtos')
    return { success: true, message: 'Entrada de estoque registrada com sucesso!' }
  } catch (error: any) {
    console.error('Create Product Stock Entry Error:', error)
    return { success: false, message: 'Erro ao registrar entrada: ' + error.message }
  }
}
