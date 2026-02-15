'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { SupplierSchema } from '@/lib/schemas'
import { getCurrentUser } from '@/lib/auth'
import type { ActionResponse } from '@/lib/types'
import { actionError, actionSuccess, unauthorizedAction } from '@/lib/action-response'
import { buildWorkspaceAppPaths } from '@/lib/workspace-path'

export async function getSuppliers() {
  const user = await getCurrentUser()
  if (!user) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from('Supplier')
    .select('*')
    .eq('tenantId', user.tenantId)
    .order('name', { ascending: true })

  return (data as any[]) || []
}

export async function createSupplier(data: any): Promise<ActionResponse> {
  const user = await getCurrentUser()
  if (!user) return unauthorizedAction()

  const validatedFields = SupplierSchema.safeParse(data)
  if (!validatedFields.success) {
    return actionError('Erro de validação', validatedFields.error.flatten().fieldErrors)
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase.from('Supplier').insert({
      ...validatedFields.data,
      tenantId: user.tenantId,
    } as any)

    if (error) throw error

    const slug = user.tenant?.slug
    if (slug) {
      for (const path of buildWorkspaceAppPaths(slug, ['/fornecedores', '/estoque'])) {
        revalidatePath(path)
      }
    }
    return actionSuccess('Fornecedor criado com sucesso!')
  } catch (error) {
    console.error('Database Error:', error)
    return actionError('Erro ao criar fornecedor.')
  }
}

export async function updateSupplier(id: string, data: any): Promise<ActionResponse> {
  const user = await getCurrentUser()
  if (!user) return unauthorizedAction()

  const validatedFields = SupplierSchema.safeParse(data)
  if (!validatedFields.success) {
    return actionError('Erro de validação', validatedFields.error.flatten().fieldErrors)
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('Supplier')
      .update(validatedFields.data as any as never)
      .eq('id', id)

    if (error) throw error

    const slug = user.tenant?.slug
    if (slug) {
      for (const path of buildWorkspaceAppPaths(slug, ['/fornecedores', '/estoque'])) {
        revalidatePath(path)
      }
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
      for (const path of buildWorkspaceAppPaths(slug, ['/fornecedores', '/estoque'])) {
        revalidatePath(path)
      }
    }
    return actionSuccess('Fornecedor excluído com sucesso!')
  } catch (error) {
    console.error('Database Error:', error)
    return actionError('Erro ao excluir fornecedor. Verifique se existem materiais vinculados.')
  }
}
