'use server'

import { createClient } from '@/lib/supabase/server'
import { CustomerSchema } from '@/lib/schemas'
import type { ActionResponse } from '@/lib/types'
import { getCurrentUser } from '@/lib/auth'
import { logAction } from '@/lib/audit'
import { validateCSRF } from '@/lib/security'
import { actionError, actionSuccess, unauthorizedAction } from '@/lib/action-response'
import { revalidateWorkspaceAppPaths } from '@/lib/revalidate-workspace-path'
import type { Database } from '@/lib/supabase/types'

type CustomerInsert = Database['public']['Tables']['Customer']['Insert']
type CustomerUpdate = Database['public']['Tables']['Customer']['Update']

function toNullableIsoDate(value?: Date | null): string | null | undefined {
  if (value === undefined) return undefined
  if (value === null) return null
  return value.toISOString()
}

async function assertCSRFValid() {
  const csrf = await validateCSRF()
  if (!csrf.valid) {
    return actionError(csrf.error || 'CSRF inválido.')
  }
  return null
}

export async function getCustomers() {
  const user = await getCurrentUser()
  if (!user) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from('Customer')
    .select('*')
    .eq('tenantId', user.tenantId)
    .order('name', { ascending: true })

  return data ?? []
}

export async function createCustomer(
  _prevState: ActionResponse,
  formData: FormData
): Promise<ActionResponse> {
  const csrfError = await assertCSRFValid()
  if (csrfError) return csrfError

  const user = await getCurrentUser()
  if (!user) return unauthorizedAction()

  const rawData = {
    name: formData.get('name'),
    phone: formData.get('phone') || undefined,
    email: formData.get('email') || undefined,
    address: formData.get('address') || undefined,
    notes: formData.get('notes') || undefined,
    birthday: formData.get('birthday') || undefined,
  }
  const validatedFields = CustomerSchema.safeParse(rawData)

  if (!validatedFields.success) {
    return actionError('Dados inválidos.', validatedFields.error.flatten().fieldErrors)
  }

  try {
    const db = await createClient()
    const workspaceSlug = user.tenant?.slug
    const customerPayload: CustomerInsert = {
      ...validatedFields.data,
      birthday: toNullableIsoDate(validatedFields.data.birthday),
      tenantId: user.tenantId,
    }

    const { data: customer, error } = await db
      .from('Customer')
      // @ts-expect-error legacy table typing missing in generated Database type
      .insert(customerPayload)
      .select()
      .single()
    const createdCustomer = customer as { id: string } | null

    if (error) throw error
    if (!createdCustomer) throw new Error('Cliente não encontrado após criação')

    await logAction(user.tenantId, user.id, 'CREATE', 'Customer', createdCustomer.id, {
      name: validatedFields.data.name,
      email: validatedFields.data.email,
    })

    if (workspaceSlug) {
      revalidateWorkspaceAppPaths(workspaceSlug, ['/clientes'])
    }
    return actionSuccess('Cliente cadastrado!', createdCustomer)
  } catch (error) {
    console.error('Failed to create customer:', error)
    return actionError('Erro ao cadastrar cliente.')
  }
}

export async function deleteCustomer(id: string): Promise<ActionResponse> {
  const csrfError = await assertCSRFValid()
  if (csrfError) return csrfError

  const user = await getCurrentUser()
  if (!user) return unauthorizedAction()

  try {
    const db = await createClient()
    const workspaceSlug = user.tenant?.slug
    const { error } = await db.from('Customer').delete().eq('id', id)
    if (error) throw error

    await logAction(user.tenantId, user.id, 'DELETE', 'Customer', id)

    if (workspaceSlug) {
      revalidateWorkspaceAppPaths(workspaceSlug, ['/clientes'])
    }
    return actionSuccess('Cliente removido!')
  } catch {
    return actionError('Erro ao remover cliente. Verifique se ele possui pedidos.')
  }
}

export async function updateCustomer(
  id: string,
  _prevState: ActionResponse,
  formData: FormData
): Promise<ActionResponse> {
  const csrfError = await assertCSRFValid()
  if (csrfError) return csrfError

  const user = await getCurrentUser()
  if (!user) return unauthorizedAction()

  const rawData = {
    name: formData.get('name'),
    phone: formData.get('phone') || undefined,
    email: formData.get('email') || undefined,
    address: formData.get('address') || undefined,
    notes: formData.get('notes') || undefined,
    birthday: formData.get('birthday') || undefined,
  }
  const validatedFields = CustomerSchema.safeParse(rawData)

  if (!validatedFields.success) {
    return actionError('Dados inválidos.', validatedFields.error.flatten().fieldErrors)
  }

  try {
    const db = await createClient()
    const workspaceSlug = user.tenant?.slug
    const customerPayload: CustomerUpdate = {
      ...validatedFields.data,
      birthday: toNullableIsoDate(validatedFields.data.birthday),
    }

    const { error } = await db
      .from('Customer')
      // @ts-expect-error legacy table typing missing in generated Database type
      .update(customerPayload)
      .eq('id', id)

    if (error) throw error

    await logAction(user.tenantId, user.id, 'UPDATE', 'Customer', id, validatedFields.data)

    if (workspaceSlug) {
      revalidateWorkspaceAppPaths(workspaceSlug, ['/clientes'])
    }
    return actionSuccess('Cliente atualizado!')
  } catch (error) {
    console.error('Failed to update customer:', error)
    return actionError('Erro ao atualizar cliente.')
  }
}

export async function getCustomerOrders(customerId: string) {
  const user = await getCurrentUser()
  if (!user) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('Order')
    .select(
      `
            id,
            status,
            totalValue,
            createdAt,
            items:OrderItem(
                productId,
                quantity,
                product:Product(name)
            )
        `
    )
    .eq('tenantId', user.tenantId)
    .eq('customerId', customerId)
    .order('createdAt', { ascending: false })

  if (error) {
    console.error('Error fetching customer orders:', error)
    return []
  }

  return data ?? []
}

export async function getCustomerLtv(customerId: string) {
  const user = await getCurrentUser()
  if (!user) {
    return { deliveredOrders: 0, lifetimeValue: 0 }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('Order')
    .select('totalValue')
    .eq('tenantId', user.tenantId)
    .eq('customerId', customerId)
    .eq('status', 'DELIVERED')

  if (error || !data) {
    console.error('Error fetching customer LTV:', error)
    return { deliveredOrders: 0, lifetimeValue: 0 }
  }

  const deliveredOrders = data as Array<{ totalValue: number | string | null }>
  const lifetimeValue = deliveredOrders.reduce(
    (sum, order) => sum + Number(order.totalValue || 0),
    0
  )

  return {
    deliveredOrders: deliveredOrders.length,
    lifetimeValue,
  }
}
