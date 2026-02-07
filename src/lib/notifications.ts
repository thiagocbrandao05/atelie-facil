import { createClient } from '@/lib/supabase/server'
// import { NotificationType, NotificationPriority } from '@prisma/client' // These enums are replaced by string unions or types

export type NotificationType = 'STOCK_ALERT' | 'ORDER_DEADLINE' | 'ORDER_READY' | 'SYSTEM'
export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'

export interface CreateNotificationData {
    tenantId: string
    userId?: string
    title: string
    message: string
    type: NotificationType
    priority?: NotificationPriority
    entityType?: string
    entityId?: string
}

/**
 * Create a notification
 */
export async function createNotification(data: CreateNotificationData) {
    try {
        const supabase = await createClient()
        const { data: notification, error } = await supabase.from('Notification').insert({
            ...data,
            userId: data.userId || 'system', // or handle nullable userId if DB allows
            priority: data.priority || 'NORMAL',
            read: false,
            createdAt: new Date().toISOString()
        } as any).select().single()

        if (error) {
            console.error('Failed to create notification:', error)
            return null
        }
        return notification
    } catch (error) {
        console.error('Failed to create notification:', error)
        return null
    }
}

/**
 * Create stock alert notification
 */
export async function notifyStockAlert(
    tenantId: string,
    materialName: string,
    currentStock: number,
    threshold: number
) {
    return createNotification({
        tenantId,
        title: 'Estoque Baixo',
        message: `O material "${materialName}" está com estoque baixo (${currentStock} unidades). Limite: ${threshold}`,
        type: 'STOCK_ALERT',
        priority: currentStock < threshold / 2 ? 'URGENT' : 'HIGH'
    })
}

/**
 * Create order deadline notification
 */
export async function notifyOrderDeadline(
    tenantId: string,
    userId: string,
    orderNumber: string,
    daysRemaining: number
) {
    return createNotification({
        tenantId,
        userId,
        title: 'Prazo de Pedido',
        message: `O pedido #${orderNumber} vence em ${daysRemaining} dia(s)`,
        type: 'ORDER_DEADLINE',
        priority: daysRemaining <= 1 ? 'URGENT' : daysRemaining <= 3 ? 'HIGH' : 'NORMAL'
    })
}

/**
 * Create order ready notification
 */
export async function notifyOrderReady(
    tenantId: string,
    userId: string,
    orderNumber: string,
    customerName: string
) {
    return createNotification({
        tenantId,
        userId,
        title: 'Pedido Pronto',
        message: `O pedido #${orderNumber} de ${customerName} está pronto para entrega`,
        type: 'ORDER_READY',
        priority: 'NORMAL'
    })
}


