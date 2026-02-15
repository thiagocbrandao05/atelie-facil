'use server'

import { createClient } from '@/lib/supabase/server'
import type {
  ActionResponse,
  PaginatedResponse,
  OrderWithDetails,
  OrderStatus,
  OrderSummary,
} from '@/lib/types'
import { revalidatePath } from 'next/cache'
import { OrderSchema, type OrderInput } from '@/lib/schemas'
import { calculateOrderTotal } from '@/lib/logic'
import { getCurrentUser } from '@/lib/auth'
import { validateCSRF } from '@/lib/security'
import { isReseller } from '@/features/subscription/utils'
import { getCurrentTenantPlan } from '@/features/subscription/actions'
import {
  checkStockAvailability,
  deductStockForOrder,
  checkFinishedStockAvailability,
  deductFinishedStockForOrder,
} from '@/lib/inventory'
import { rateLimit, rateLimitPresets } from '@/lib/rate-limiter'
import { logError } from '@/lib/logger'
import { enqueueOrderStatusNotification } from '@/features/whatsapp/actions'

async function assertCSRFValid() {
  const csrf = await validateCSRF()
  if (!csrf.valid) {
    return { success: false, message: csrf.error || 'CSRF inválido.' }
  }
  return null
}

/**
 * Get orders with pagination support
 */
export async function getOrdersPaginated(
  page: number = 1,
  pageSize: number = 20,
  status?: string
): Promise<PaginatedResponse<OrderSummary>> {
  const user = await getCurrentUser()
  if (!user) return { data: [], total: 0, page, pageSize, totalPages: 0 }

  const supabase = await createClient()

  let query = supabase
    .from('Order')
    .select(
      `
            id, orderNumber, status, dueDate, totalValue, createdAt, discount,
            customer:Customer(id, name, phone),
            items:OrderItem(
                productId, quantity, price, discount,
                product:Product(name)
            )
        `,
      { count: 'exact' }
    )
    .eq('tenantId', user.tenantId)
    .order('createdAt', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, count, error } = await query.range(from, to)

  if (error) {
    console.error('Error fetching orders:', error)
    return { data: [], total: 0, page, pageSize, totalPages: 0 }
  }

  // Cast seguro usando unknown primeiro, pois supabase types não estão gerados
  const orders = data as unknown as OrderSummary[]

  return {
    data: orders,
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  }
}

/**
 * Get orders without pagination (for backward compatibility)
 */
export async function getOrders() {
  const user = await getCurrentUser()
  if (!user) return []

  const supabase = await createClient()

  const { data } = await (supabase as any)
    .from('Order')
    .select(
      `
            id, status, totalValue, createdAt, discount,
            customer:Customer(id, name, phone),
            items:OrderItem(
                productId, quantity, price, discount,
                product:Product(
                    id, name, laborTime,
                    materials:ProductMaterial(
                        quantity,
                        material:Material(cost)
                    )
                )
            )
        `
    )
    .eq('tenantId', user.tenantId)
    .order('createdAt', { ascending: false })

  // Cast seguro usando unknown
  const orders = data as unknown as OrderWithDetails[]
  return orders || []
}

/**
 * Get lightweight order payload optimized for Kanban rendering.
 */
export async function getOrdersForKanban() {
  const user = await getCurrentUser()
  if (!user) return []

  const supabase = await createClient()

  const { data } = await (supabase as any)
    .from('Order')
    .select(
      `
            id, status, dueDate, totalValue,
            customer:Customer(id, name),
            items:OrderItem(
                quantity,
                product:Product(name)
            )
        `
    )
    .eq('tenantId', user.tenantId)
    .order('createdAt', { ascending: false })

  return (data as any[]) || []
}

export async function createOrder(data: OrderInput): Promise<ActionResponse> {
  const csrfError = await assertCSRFValid()
  if (csrfError) return csrfError

  const user = await getCurrentUser()
  if (!user) return { success: false, message: 'Não autorizado. Faça login novamente.' }

  const validatedFields = OrderSchema.safeParse(data)

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Dados inválidos. Verifique os campos.',
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { customerId, dueDate, items, status, discount } = validatedFields.data
  const totalValue = calculateOrderTotal(items as any, discount)
  const supabase = await createClient()

  try {
    // Use RPC to create order and items atomically
    const { data: rpcData, error } = await (supabase as any).rpc('create_order', {
      p_tenant_id: user.tenantId,
      p_customer_id: customerId,
      p_status: status || 'PENDING',
      p_due_date: new Date(dueDate).toISOString(),
      p_total_value: totalValue,
      p_items: items, // Array of { productId, quantity, price, discount }
      p_discount: discount || 0,
    } as any)

    const createdOrderId = (rpcData as any).id as string

    // If it's a reseller, deduct from finished product stock immediately if status is PENDING/PRODUCING
    const { plan } = await getCurrentTenantPlan()
    if (isReseller(plan as any) && (status === 'PENDING' || status === 'PRODUCING')) {
      const stock = await checkFinishedStockAvailability(createdOrderId)
      if (stock.isAvailable) {
        await deductFinishedStockForOrder(createdOrderId)
      }
    }

    revalidatePath('/pedidos')
    revalidatePath('/')

    // ... notification logic ...
    if (status === 'QUOTATION' && createdOrderId) {
      const notificationResult = await enqueueOrderStatusNotification({
        orderId: createdOrderId,
        tenantId: user.tenantId,
        statusFrom: null,
        statusTo: 'QUOTATION',
      })

      if (!(notificationResult as any).success) {
        await logError(
          new Error(
            (notificationResult as any).message ||
              (notificationResult as any).error ||
              'Falha ao enviar orçamento.'
          ),
          {
            action: 'send_order_quotation_notification',
            data: { orderId: createdOrderId },
          }
        )
      }
    }

    // Assuming rpcData returns { success, id }
    return { success: true, message: 'Pedido criado com sucesso!', data: { id: createdOrderId } }
  } catch (e: any) {
    console.error('Failed to create order:', e)
    return { success: false, message: e.message || 'Erro ao criar pedido.' }
  }
}

export async function updateOrderStatus(id: string, newStatus: string): Promise<ActionResponse> {
  const csrfError = await assertCSRFValid()
  if (csrfError) return csrfError

  const user = await getCurrentUser()
  if (!user) return { success: false, message: 'Não autorizado.' }
  const supabase = await createClient()

  try {
    // Get current order status
    const { data: order, error: fetchError } = await (supabase as any)
      .from('Order')
      .select('status')
      .eq('id', id)
      .single()

    if (fetchError || !order) return { success: false, message: 'Pedido não encontrado.' }

    if (order.status === newStatus) {
      return { success: true, message: 'Status já estava atualizado.' }
    }

    // If moving to PRODUCING and it was PENDING or QUOTATION, check and deduct stock
    if (newStatus === 'PRODUCING' && (order.status === 'PENDING' || order.status === 'QUOTATION')) {
      const { plan } = await getCurrentTenantPlan()

      if (isReseller(plan as any)) {
        const stock = await checkFinishedStockAvailability(id)
        if (!stock.isAvailable) {
          const missing = stock.missingProducts.map(p => p.name).join(', ')
          return {
            success: false,
            message: `Estoque insuficiente para os produtos: ${missing}`,
          }
        }
        await deductFinishedStockForOrder(id)
      } else {
        const stock = await checkStockAvailability(id)
        if (!stock.isAvailable) {
          const missing = stock.missingMaterials.map(m => m.name).join(', ')
          return {
            success: false,
            message: `Estoque insuficiente para os materiais: ${missing}`,
          }
        }
        await deductStockForOrder(id)
      }
    }

    const { error: updateError } = await (supabase as any)
      .from('Order')
      .update({ status: newStatus } as any as never)
      .eq('id', id)
    // RLS ensures tenant isolation, but eq id is enough

    if (updateError) throw updateError

    revalidatePath('/pedidos')
    revalidatePath('/')

    const notificationResult = await enqueueOrderStatusNotification({
      orderId: id,
      tenantId: user.tenantId,
      statusFrom: order.status,
      statusTo: newStatus as OrderStatus,
    })

    if (!(notificationResult as any).success) {
      await logError(
        new Error(
          (notificationResult as any).message ||
            (notificationResult as any).error ||
            'Falha ao enviar notificação de status.'
        ),
        {
          action: 'send_order_status_notification',
          data: { orderId: id, statusFrom: order.status, statusTo: newStatus },
        }
      )
    }

    return { success: true, message: 'Status atualizado com sucesso!' }
  } catch (e) {
    console.error('Failed to update order status:', e)
    return { success: false, message: 'Erro ao atualizar status do pedido.' }
  }
}

export async function deleteOrder(id: string): Promise<ActionResponse> {
  const csrfError = await assertCSRFValid()
  if (csrfError) return csrfError

  const user = await getCurrentUser()
  if (!user) return { success: false, message: 'Não autorizado.' }
  const supabase = await createClient()

  try {
    // Use RPC for atomic delete (cascading items)
    const { error } = await (supabase as any).rpc('delete_order', {
      p_order_id: id,
      p_tenant_id: user.tenantId,
    } as any)

    if (error) throw error

    revalidatePath('/pedidos')
    revalidatePath('/')
    return { success: true, message: 'Pedido excluído com sucesso!' }
  } catch (e: any) {
    console.error('Failed to delete order:', e)
    return { success: false, message: e.message || 'Erro ao excluir pedido.' }
  }
}

export async function getOrdersStats() {
  const user = await getCurrentUser()
  if (!user) return { activeOrders: 0 }

  const supabase = await createClient()

  // Active orders: Not COMPLETED and Not DELIVERED
  const { count, error } = await (supabase as any)
    .from('Order')
    .select('*', { count: 'exact', head: true })
    .eq('tenantId', user.tenantId)
    .not('status', 'in', '("COMPLETED","DELIVERED")')

  if (error) {
    console.error('Error fetching order stats:', error)
    return { activeOrders: 0 }
  }

  return { activeOrders: count || 0 }
}
