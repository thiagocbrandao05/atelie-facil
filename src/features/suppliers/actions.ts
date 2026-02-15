'use server'

import { createClient } from '@/lib/supabase/server'
import { SupplierSchema } from '@/lib/schemas'
import { getCurrentUser } from '@/lib/auth'
import type { ActionResponse } from '@/lib/types'
import { actionError, actionSuccess, unauthorizedAction } from '@/lib/action-response'
import { revalidateWorkspaceAppPaths } from '@/lib/revalidate-workspace-path'
import type { Database } from '@/lib/supabase/types'

type SupplierInsert = Database['public']['Tables']['Supplier']['Insert']
type SupplierUpdate = Database['public']['Tables']['Supplier']['Update']

export async function getSuppliers() {
  const user = await getCurrentUser()
  if (!user) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from('Supplier')
    .select('*')
    .eq('tenantId', user.tenantId)
    .order('name', { ascending: true })

  return data ?? []
}

export async function createSupplier(input: unknown): Promise<ActionResponse> {
  const user = await getCurrentUser()
  if (!user) return unauthorizedAction()

  const validatedFields = SupplierSchema.safeParse(input)
  if (!validatedFields.success) {
    return actionError('Erro de validação', validatedFields.error.flatten().fieldErrors)
  }

  try {
    const db = await createClient()
    const supplierPayload: SupplierInsert = {
      ...validatedFields.data,
      tenantId: user.tenantId,
    }

    const { error } = await db
      .from('Supplier')
      // @ts-expect-error legacy table typing missing in generated Database type
      .insert(supplierPayload)

    if (error) throw error

    const slug = user.tenant?.slug
    if (slug) {
      revalidateWorkspaceAppPaths(slug, ['/fornecedores', '/estoque'])
    }
    return actionSuccess('Fornecedor criado com sucesso!')
  } catch (error) {
    console.error('Database Error:', error)
    return actionError('Erro ao criar fornecedor.')
  }
}

export async function updateSupplier(id: string, input: unknown): Promise<ActionResponse> {
  const user = await getCurrentUser()
  if (!user) return unauthorizedAction()

  const validatedFields = SupplierSchema.safeParse(input)
  if (!validatedFields.success) {
    return actionError('Erro de validação', validatedFields.error.flatten().fieldErrors)
  }

  try {
    const db = await createClient()
    const supplierPayload: SupplierUpdate = validatedFields.data

    const { error } = await db
      .from('Supplier')
      // @ts-expect-error legacy table typing missing in generated Database type
      .update(supplierPayload)
      .eq('id', id)

    if (error) throw error

    const slug = user.tenant?.slug
    if (slug) {
      revalidateWorkspaceAppPaths(slug, ['/fornecedores', '/estoque'])
    }
    return actionSuccess('Fornecedor atualizado com sucesso!')
  } catch (error) {
    console.error('Database Error:', error)
    return actionError('Erro ao atualizar fornecedor.')
  }
}

export async function deleteSupplier(id: string): Promise<ActionResponse> {
  const user = await getCurrentUser()
  if (!user) return unauthorizedAction()

  try {
    const supabase = await createClient()
    const { error } = await supabase.from('Supplier').delete().eq('id', id)
    if (error) throw error

    const slug = user.tenant?.slug
    if (slug) {
      revalidateWorkspaceAppPaths(slug, ['/fornecedores', '/estoque'])
    }
    return actionSuccess('Fornecedor excluído com sucesso!')
  } catch (error) {
    console.error('Database Error:', error)
    return actionError('Erro ao excluir fornecedor. Verifique se existem materiais vinculados.')
  }
}
