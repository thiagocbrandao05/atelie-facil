'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import type { PaginatedResponse, AuditLog, User, AuditAction } from '@/lib/types'

export type AuditLogWithUser = AuditLog & {
  user: Pick<User, 'name' | 'email'> | null
}

export interface AuditFilters {
  action?: AuditAction
  entity?: string
  userId?: string
  startDate?: Date
  endDate?: Date
  search?: string
}

/**
 * Get paginated audit logs with filters
 */
export async function getAuditLogs(
  page: number = 1,
  pageSize: number = 50,
  filters?: AuditFilters
): Promise<PaginatedResponse<AuditLogWithUser>> {
  const user = await getCurrentUser()
  if (!user) return { data: [], total: 0, page, pageSize, totalPages: 0 }

  const supabase = await createClient()
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('AuditLog')
    .select(
      `
            *,
            user:User(name, email)
        `,
      { count: 'exact' }
    )
    .eq('tenantId', user.tenantId)

  if (filters?.action) {
    query = query.eq('action', filters.action)
  }

  if (filters?.entity) {
    query = query.ilike('entity', `%${filters.entity}%`)
  }

  if (filters?.userId) {
    query = query.eq('userId', filters.userId)
  }

  if (filters?.startDate) {
    query = query.gte('createdAt', filters.startDate.toISOString())
  }

  if (filters?.endDate) {
    query = query.lte('createdAt', filters.endDate.toISOString())
  }

  if (filters?.search) {
    query = query.or(`entity.ilike.%${filters.search}%,entityId.ilike.%${filters.search}%`)
  }

  const { data, count, error } = await query
    .order('createdAt', { ascending: false })
    .range(from, to)

  if (error) {
    console.error('Error fetching audit logs:', error)
    return { data: [], total: 0, page, pageSize, totalPages: 0 }
  }

  return {
    data: data as any as AuditLogWithUser[],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  }
}

/**
 * Get audit statistics
 */
export async function getAuditStats() {
  const user = await getCurrentUser()
  if (!user) return null

  try {
    const supabase = await createClient()

    // Use RPC for stats aggregation
    const { data, error } = await supabase.rpc('get_audit_stats', {
      p_tenant_id: user.tenantId,
    } as any)

    if (error) throw error

    return data as {
      totalLogs: number
      recentActivity: number
      actionBreakdown: { action: string; count: number }[]
    }
  } catch (e) {
    console.error('Error fetching audit stats:', e)
    return null
  }
}
