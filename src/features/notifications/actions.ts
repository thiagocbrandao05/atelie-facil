'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import type { ActionResponse } from '@/lib/types'
import { revalidatePath } from 'next/cache'

/**
 * Get user notifications
 */
export async function getNotifications(unreadOnly: boolean = false) {
    const user = await getCurrentUser()
    if (!user) return []

    const supabase = await createClient()
    let query = supabase
        .from('Notification')
        .select('*')
        .eq('tenantId', user.tenantId)
        .order('createdAt', { ascending: false })
        .limit(50)

    if (unreadOnly) {
        query = query.eq('read', false)
    }

    const { data } = await query
    return (data as any[]) || []
}

/**
 * Mark notification as read
 */
export async function markAsRead(id: string): Promise<ActionResponse> {
    const user = await getCurrentUser()
    if (!user) return { success: false, message: 'Não autorizado' }

    try {
        const supabase = await createClient()
        const { error } = await supabase
            .from('Notification')
            .update({
                read: true,
                readAt: new Date().toISOString()
            } as any as never)
            .eq('id', id)
            .eq('tenantId', user.tenantId) // Ensure ownership

        if (error) throw error

        revalidatePath('/dashboard')
        return { success: true, message: 'Notificação marcada como lida' }
    } catch (error) {
        return { success: false, message: 'Erro ao marcar notificação' }
    }
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(): Promise<ActionResponse> {
    const user = await getCurrentUser()
    if (!user) return { success: false, message: 'Não autorizado' }

    try {
        const supabase = await createClient()
        const { error } = await supabase
            .from('Notification')
            .update({
                read: true,
                readAt: new Date().toISOString()
            } as any as never)
            .eq('tenantId', user.tenantId)
            .eq('read', false)

        if (error) throw error

        revalidatePath('/dashboard')
        return { success: true, message: 'Todas as notificações foram marcadas como lidas' }
    } catch (error) {
        return { success: false, message: 'Erro ao marcar notificações' }
    }
}

/**
 * Get unread count
 */
export async function getUnreadCount() {
    const user = await getCurrentUser()
    if (!user) return 0

    const supabase = await createClient()
    const { count } = await supabase
        .from('Notification')
        .select('*', { count: 'exact', head: true })
        .eq('tenantId', user.tenantId)
        .eq('read', false)

    return count || 0
}


