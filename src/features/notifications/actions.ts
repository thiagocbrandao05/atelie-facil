'use server'

import { getCurrentUser } from '@/lib/auth'
import type { ActionResponse } from '@/lib/types'
import { createClient } from '@/lib/supabase/server'
import { actionError, actionSuccess, unauthorizedAction } from '@/lib/action-response'
import { revalidateWorkspaceAppPaths } from '@/lib/revalidate-workspace-path'
import type { Database } from '@/lib/supabase/types'

type NotificationUpdate = Database['public']['Tables']['Notification']['Update']

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
  return data ?? []
}

export async function markAsRead(id: string): Promise<ActionResponse> {
  const user = await getCurrentUser()
  if (!user) return unauthorizedAction()

  try {
    const supabase = await createClient()
    const db = supabase as any
    const updatePayload: NotificationUpdate = {
      read: true,
      readAt: new Date().toISOString(),
    }

    const { error } = await db
      .from('Notification')
      .update(updatePayload)
      .eq('id', id)
      .eq('tenantId', user.tenantId)

    if (error) throw error

    const slug = user.tenant?.slug
    if (slug) {
      revalidateWorkspaceAppPaths(slug, ['/dashboard'])
    }
    return actionSuccess('Notificação marcada como lida')
  } catch {
    return actionError('Erro ao marcar notificação')
  }
}

export async function markAllAsRead(): Promise<ActionResponse> {
  const user = await getCurrentUser()
  if (!user) return unauthorizedAction()

  try {
    const supabase = await createClient()
    const db = supabase as any
    const updatePayload: NotificationUpdate = {
      read: true,
      readAt: new Date().toISOString(),
    }

    const { error } = await db
      .from('Notification')
      .update(updatePayload)
      .eq('tenantId', user.tenantId)
      .eq('read', false)

    if (error) throw error

    const slug = user.tenant?.slug
    if (slug) {
      revalidateWorkspaceAppPaths(slug, ['/dashboard'])
    }
    return actionSuccess('Todas as notificações foram marcadas como lidas')
  } catch {
    return actionError('Erro ao marcar notificações')
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
