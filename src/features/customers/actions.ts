'use server'

import { createClient } from '@/lib/supabase/server'
import { CustomerSchema } from '@/lib/schemas'
import type { ActionResponse } from '@/lib/types'
import { getCurrentUser } from '@/lib/auth'
import { logAction } from '@/lib/audit'
import { validateCSRF } from '@/lib/security'
import { actionError, actionSuccess, unauthorizedAction } from '@/lib/action-response'
import { revalidateWorkspaceAppPaths } from '@/lib/revalidate-workspace-path'

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
  const { data } = await (supabase as any)
    .from('Customer')
    .select('*')
    .eq('tenantId', user.tenantId)
    .order('name', { ascending: true })

  return (data as any[]) || []
}

export async function createCustomer(
  prevState: ActionResponse,
  formData: FormData
): Promise<ActionResponse> {
  const csrfError = await assertCSRFValid()
  if (csrfError) return csrfError

  const user = await getCurrentUser()
  if (!user) return unauthorizedAction()

  const data = {
    name: formData.get('name'),
    phone: formData.get('phone') || undefined,
    email: formData.get('email') || undefined,
    address: formData.get('address') || undefined,
    notes: formData.get('notes') || undefined,
    birthday: formData.get('birthday') || undefined,
  }
  const validatedFields = CustomerSchema.safeParse(data)

  if (!validatedFields.success) {
    return actionError('Dados inválidos.', validatedFields.error.flatten().fieldErrors)
  }

  try {
    const supabase = await createClient()
    const workspaceSlug = user.tenant?.slug
    const { data: customer, error } = await (supabase as any)
      .from('Customer')
      .insert({
        ...validatedFields.data,
        tenantId: user.tenantId,
      } as any)
      .select()
      .single()

    if (error) throw error

    await logAction(user.tenantId, user.id, 'CREATE', 'Customer', customer.id, {
      name: validatedFields.data.name,
      email: validatedFields.data.email,
    })

    if (workspaceSlug) {
      revalidateWorkspaceAppPaths(workspaceSlug, ['/clientes'])
    }
    return actionSuccess('Cliente cadastrado!', customer)
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
    const supabase = await createClient()
    const workspaceSlug = user.tenant?.slug
    const { error } = await (supabase as any).from('Customer').delete().eq('id', id)
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
  prevState: ActionResponse,
  formData: FormData
): Promise<ActionResponse> {
  const csrfError = await assertCSRFValid()
  if (csrfError) return csrfError

  const user = await getCurrentUser()
  if (!user) return unauthorizedAction()

  const data = {
    name: formData.get('name'),
    phone: formData.get('phone') || undefined,
    email: formData.get('email') || undefined,
    address: formData.get('address') || undefined,
    notes: formData.get('notes') || undefined,
    birthday: formData.get('birthday') || undefined,
  }
  const validatedFields = CustomerSchema.safeParse(data)

  if (!validatedFields.success) {
    return actionError('Dados inválidos.', validatedFields.error.flatten().fieldErrors)
  }

  try {
    const supabase = await createClient()
    const workspaceSlug = user.tenant?.slug
    const { error } = await (supabase as any)
      .from('Customer')
      .update(validatedFields.data as any as never)
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
  const { data, error } = await (supabase as any)
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

  return (data as any[]) || []
}
