'use server'

import { createClient } from '@/lib/supabase/server'
import type {
  ActionResponse,
  PaginatedResponse,
  OrderWithDetails,
  OrderStatus,
  OrderSummary,
} from '@/lib/types'
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
import { logError } from '@/lib/logger'
import { enqueueOrderStatusNotification } from '@/features/whatsapp/actions'
import { actionError, actionSuccess, unauthorizedAction } from '@/lib/action-response'
import { revalidateWorkspaceAppPaths } from '@/lib/revalidate-workspace-path'

type CreateOrderRpcResult = { id: string }
type NotificationResult = { success?: boolean; message?: string; error?: string }

function notificationErrorMessage(result: unknown, fallback: string): string {
  const parsed = result as NotificationResult
  return parsed?.message || parsed?.error || fallback
}

async function assertCSRFValid() {
  const csrf = await validateCSRF()
  if (!csrf.valid) {
    return actionError(csrf.error || 'CSRF inválido.')
  }
  return null
}

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

  const orders = data as unknown as OrderSummary[]

  return {
    data: orders,
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  }
}

export async function getOrders() {
  const user = await getCurrentUser()
  if (!user) return []

  const supabase = await createClient()
  const db = supabase

  const { data } = await db
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

  const orders = data as unknown as OrderWithDetails[]
  return orders || []
}

export async function getOrdersForKanban() {
  const user = await getCurrentUser()
  if (!user) return []

  const supabase = await createClient()
  const db = supabase

  const { data } = await db
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

  return data ?? []
}

export async function createOrder(data: OrderInput): Promise<ActionResponse> {
  const csrfError = await assertCSRFValid()
  if (csrfError) return csrfError

  const user = await getCurrentUser()
  if (!user) return unauthorizedAction()

  const validatedFields = OrderSchema.safeParse(data)
  if (!validatedFields.success) {
    return actionError(
      'Dados inválidos. Verifique os campos.',
      validatedFields.error.flatten().fieldErrors
    )
  }

  const { customerId, dueDate, items, status, discount } = validatedFields.data
  const totalValue = calculateOrderTotal(items, discount)
  const supabase = await createClient()
  const db = supabase
  const workspaceSlug = user.tenant?.slug

  try {
    // @ts-expect-error legacy schema not fully represented in generated DB types
    const { data: rpcData, error } = await db.rpc('create_order', {
      p_tenant_id: user.tenantId,
      p_customer_id: customerId,
      p_status: status || 'PENDING',
      p_due_date: new Date(dueDate).toISOString(),
      p_total_value: totalValue,
      p_items: items,
      p_discount: discount || 0,
    })

    if (error) throw error
    const createdOrderId = (rpcData as CreateOrderRpcResult).id

    const { plan } = await getCurrentTenantPlan()
    if (isReseller(plan) && (status === 'PENDING' || status === 'PRODUCING')) {
      const stock = await checkFinishedStockAvailability(createdOrderId)
      if (stock.isAvailable) {
        await deductFinishedStockForOrder(createdOrderId)
      }
    }

    if (workspaceSlug) {
      revalidateWorkspaceAppPaths(workspaceSlug, ['/pedidos', '/dashboard'])
    }

    if (status === 'QUOTATION' && createdOrderId) {
      const notificationResult = await enqueueOrderStatusNotification({
        orderId: createdOrderId,
        tenantId: user.tenantId,
        statusFrom: null,
        statusTo: 'QUOTATION',
      })

      if (!notificationResult.success) {
        await logError(
          new Error(notificationErrorMessage(notificationResult, 'Falha ao enviar orçamento.')),
          {
            action: 'send_order_quotation_notification',
            data: { orderId: createdOrderId },
          }
        )
      }
    }

    return actionSuccess('Pedido criado com sucesso!', { id: createdOrderId })
  } catch (error: unknown) {
    console.error('Failed to create order:', error)
    const message = error instanceof Error ? error.message : 'Erro ao criar pedido.'
    return actionError(message)
  }
}

export async function updateOrderStatus(id: string, newStatus: string): Promise<ActionResponse> {
  const csrfError = await assertCSRFValid()
  if (csrfError) return csrfError

  const user = await getCurrentUser()
  if (!user) return unauthorizedAction()
  const supabase = await createClient()
  const db = supabase
  const workspaceSlug = user.tenant?.slug

  try {
    const { data: order, error: fetchError } = await db
      .from('Order')
      .select('status')
      .eq('id', id)
      .single()

    const currentOrder = order as { status: string } | null
    if (fetchError || !currentOrder) return actionError('Pedido não encontrado.')
    if (currentOrder.status === newStatus) return actionSuccess('Status já estava atualizado.')

    if (
      newStatus === 'PRODUCING' &&
      (currentOrder.status === 'PENDING' || currentOrder.status === 'QUOTATION')
    ) {
      const { plan } = await getCurrentTenantPlan()

      if (isReseller(plan)) {
        const stock = await checkFinishedStockAvailability(id)
        if (!stock.isAvailable) {
          const missing = stock.missingProducts.map(product => product.name).join(', ')
          return actionError(`Estoque insuficiente para os produtos: ${missing}`)
        }
        await deductFinishedStockForOrder(id)
      } else {
        const stock = await checkStockAvailability(id)
        if (!stock.isAvailable) {
          const missing = stock.missingMaterials.map(material => material.name).join(', ')
          return actionError(`Estoque insuficiente para os materiais: ${missing}`)
        }
        await deductStockForOrder(id)
      }
    }

    // @ts-expect-error legacy schema not fully represented in generated DB types
    const { error: updateError } = await db.from('Order').update({ status: newStatus }).eq('id', id)
    if (updateError) throw updateError

    if (workspaceSlug) {
      revalidateWorkspaceAppPaths(workspaceSlug, ['/pedidos', '/dashboard'])
    }

    const notificationResult = await enqueueOrderStatusNotification({
      orderId: id,
      tenantId: user.tenantId,
      statusFrom: currentOrder.status,
      statusTo: newStatus as OrderStatus,
    })

    if (!notificationResult.success) {
      await logError(
        new Error(
          notificationErrorMessage(notificationResult, 'Falha ao enviar notificação de status.')
        ),
        {
          action: 'send_order_status_notification',
          data: { orderId: id, statusFrom: currentOrder.status, statusTo: newStatus },
        }
      )
    }

    return actionSuccess('Status atualizado com sucesso!')
  } catch (error) {
    console.error('Failed to update order status:', error)
    return actionError('Erro ao atualizar status do pedido.')
  }
}

export async function deleteOrder(id: string): Promise<ActionResponse> {
  const csrfError = await assertCSRFValid()
  if (csrfError) return csrfError

  const user = await getCurrentUser()
  if (!user) return unauthorizedAction()
  const supabase = await createClient()
  const db = supabase
  const workspaceSlug = user.tenant?.slug

  try {
    // @ts-expect-error legacy schema not fully represented in generated DB types
    const { error } = await db.rpc('delete_order', {
      p_order_id: id,
      p_tenant_id: user.tenantId,
    })

    if (error) throw error

    if (workspaceSlug) {
      revalidateWorkspaceAppPaths(workspaceSlug, ['/pedidos', '/dashboard'])
    }
    return actionSuccess('Pedido excluído com sucesso!')
  } catch (error: unknown) {
    console.error('Failed to delete order:', error)
    const message = error instanceof Error ? error.message : 'Erro ao excluir pedido.'
    return actionError(message)
  }
}

export async function getOrdersStats() {
  const user = await getCurrentUser()
  if (!user) return { activeOrders: 0 }

  const supabase = await createClient()
  const db = supabase

  const { count, error } = await db
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
