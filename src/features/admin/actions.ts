'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'

export type TenantWithUser = {
  id: string
  name: string
  slug: string
  plan: string
  createdAt: string
  owner: {
    name: string | null
    email: string | null
  } | null
}

export async function getTenants(limit = 50, search?: string) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'SUPER_ADMIN') {
    throw new Error('Unauthorized')
  }

  const supabase = await createClient()

  let query = supabase
    .from('Tenant')
    .select(
      `
      *,
      users:User(name, email, role)
    `
    )
    .order('createdAt', { ascending: false })
    .limit(limit)

  if (search) {
    query = query.ilike('name', `%${search}%`)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching tenants:', error)
    return []
  }

  // Transform data to easy usage
  // We assume the owner is the first user found or Filter by role if we had granular roles per tenant logic
  // For MVP, we take the first user as "contact"
  return data.map((tenant: any) => ({
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    plan: tenant.plan,
    createdAt: tenant.createdAt,
    owner: tenant.users && tenant.users.length > 0 ? tenant.users[0] : null,
  })) as TenantWithUser[]
}

export async function getSystemLogs(limit = 100) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'SUPER_ADMIN') {
    throw new Error('Unauthorized')
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('AuditLog')
    .select(
      `
      *,
      user:User(name, email),
      tenant:Tenant(name)
    `
    )
    .order('createdAt', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching logs:', error)
    return []
  }

  return data
}
