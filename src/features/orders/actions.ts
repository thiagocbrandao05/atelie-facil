'use server'

import { createClient } from "@/lib/supabase/server"
import type { ActionResponse, PaginatedResponse, OrderWithDetails } from "@/lib/types"
import { revalidatePath } from "next/cache"
import { OrderSchema, type OrderInput } from "@/lib/schemas"
import { calculateOrderTotal } from "@/lib/logic"
import { checkStockAvailability, deductStockForOrder } from "../../lib/inventory"
import { rateLimit, rateLimitPresets } from "@/lib/rate-limiter"
import { logError } from "@/lib/logger"
import { getCurrentUser } from "@/lib/auth"

/**
 * Get orders with pagination support
 */
export async function getOrdersPaginated(
    page: number = 1,
    pageSize: number = 20,
    status?: string
): Promise<PaginatedResponse<OrderWithDetails>> {
    const user = await getCurrentUser()
    if (!user) return { data: [], total: 0, page, pageSize, totalPages: 0 }

    const supabase = await createClient()

    let query = supabase
        .from('Order')
        .select(`
            id, status, dueDate, totalValue, createdAt, discount,
            customer:Customer(id, name, phone),
            items:OrderItem(
                productId, quantity, price, discount,
                product:Product(name)
            )
        `, { count: 'exact' })
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

    return {
        data: data as any as OrderWithDetails[], // Type casting due to join structure differences
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize)
    }
}

/**
 * Get orders without pagination (for backward compatibility)
 */
export async function getOrders() {
    const user = await getCurrentUser()
    if (!user) return []

    const supabase = await createClient()

    const { data } = await supabase
        .from('Order')
        .select(`
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
        `)
        .eq('tenantId', user.tenantId)
        .order('createdAt', { ascending: false })

    return data || []
}

export async function createOrder(data: OrderInput): Promise<ActionResponse> {
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
        const { data: rpcData, error } = await supabase.rpc('create_order', {
            p_tenant_id: user.tenantId,
            p_customer_id: customerId,
            p_status: status || 'PENDING',
            p_due_date: new Date(dueDate).toISOString(),
            p_total_value: totalValue,
            p_items: items, // Array of { productId, quantity, price, discount }
            p_discount: discount || 0
        } as any)

        if (error) throw error

        revalidatePath('/pedidos')
        revalidatePath('/')
        // Assuming rpcData returns { success, id }
        return { success: true, message: 'Pedido criado com sucesso!', data: { id: (rpcData as any).id } }

    } catch (e: any) {
        console.error('Failed to create order:', e)
        return { success: false, message: e.message || 'Erro ao criar pedido.' }
    }
}

export async function updateOrderStatus(id: string, newStatus: string): Promise<ActionResponse> {
    const user = await getCurrentUser()
    if (!user) return { success: false, message: 'Não autorizado.' }
    const supabase = await createClient()

    try {
        // Get current order status
        const { data: order, error: fetchError } = await supabase
            .from('Order')
            .select('status')
            .eq('id', id)
            .single<any>()

        if (fetchError || !order) return { success: false, message: 'Pedido não encontrado.' }

        // If moving to PRODUCING and it was PENDING or QUOTATION, check and deduct stock
        if (newStatus === 'PRODUCING' && (order.status === 'PENDING' || order.status === 'QUOTATION')) {
            const stock = await checkStockAvailability(id)
            if (!stock.isAvailable) {
                const missing = stock.missingMaterials.map(m => m.name).join(', ')
                return {
                    success: false,
                    message: `Estoque insuficiente para os materiais: ${missing}`
                }
            }
            await deductStockForOrder(id)
        }

        const { error: updateError } = await supabase
            .from('Order')
            .update({ status: newStatus } as any as never)
            .eq('id', id)
        // RLS ensures tenant isolation, but eq id is enough

        if (updateError) throw updateError

        revalidatePath('/pedidos')
        revalidatePath('/')
        return { success: true, message: 'Status atualizado com sucesso!' }
    } catch (e) {
        console.error('Failed to update order status:', e)
        return { success: false, message: 'Erro ao atualizar status do pedido.' }
    }
}

export async function deleteOrder(id: string): Promise<ActionResponse> {
    const user = await getCurrentUser()
    if (!user) return { success: false, message: 'Não autorizado.' }
    const supabase = await createClient()

    try {
        // Use RPC for atomic delete (cascading items)
        const { error } = await supabase.rpc('delete_order', {
            p_order_id: id,
            p_tenant_id: user.tenantId
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
    const { count, error } = await supabase
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
