'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth'
import type { ActionResponse } from '@/lib/types'
import { createClient } from '@/lib/supabase/server'

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

export async function markAsRead(id: string): Promise<ActionResponse> {
  const user = await getCurrentUser()
  if (!user) return { success: false, message: 'Nao autorizado' }

  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('Notification')
      .update({
        read: true,
        readAt: new Date().toISOString(),
      } as any as never)
      .eq('id', id)
      .eq('tenantId', user.tenantId)

    if (error) throw error

    const slug = (user as any).tenant?.slug
    revalidatePath(slug ? `/${slug}/app/dashboard` : '/')
    return { success: true, message: 'Notificacao marcada como lida' }
  } catch {
    return { success: false, message: 'Erro ao marcar notificacao' }
  }
}

export async function markAllAsRead(): Promise<ActionResponse> {
  const user = await getCurrentUser()
  if (!user) return { success: false, message: 'Nao autorizado' }

  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('Notification')
      .update({
        read: true,
        readAt: new Date().toISOString(),
      } as any as never)
      .eq('tenantId', user.tenantId)
      .eq('read', false)

    if (error) throw error

    const slug = (user as any).tenant?.slug
    revalidatePath(slug ? `/${slug}/app/dashboard` : '/')
    return { success: true, message: 'Todas as notificacoes foram marcadas como lidas' }
  } catch {
    return { success: false, message: 'Erro ao marcar notificacoes' }
  }
}

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
