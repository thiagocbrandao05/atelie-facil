'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth'
import type { ActionResponse } from '@/lib/types'
import { createClient } from '@/lib/supabase/server'
import { actionError, actionSuccess, unauthorizedAction } from '@/lib/action-response'
import { buildWorkspaceAppPaths } from '@/lib/workspace-path'

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
  if (!user) return unauthorizedAction()

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

    const slug = user.tenant?.slug
    if (slug) {
      for (const path of buildWorkspaceAppPaths(slug, ['/dashboard'])) {
        revalidatePath(path)
      }
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
    const { error } = await supabase
      .from('Notification')
      .update({
        read: true,
        readAt: new Date().toISOString(),
      } as any as never)
      .eq('tenantId', user.tenantId)
      .eq('read', false)

    if (error) throw error

    const slug = user.tenant?.slug
    if (slug) {
      for (const path of buildWorkspaceAppPaths(slug, ['/dashboard'])) {
        revalidatePath(path)
      }
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
