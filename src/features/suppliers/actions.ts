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
type SupplierRow = Database['public']['Tables']['Supplier']['Row']
type ExistingSupplierRow = Pick<SupplierRow, 'id' | 'name'>

type PostgrestLikeError = {
  code?: string
  message?: string
  details?: string
}

function normalizeSupplierName(value?: string | null): string {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function parseUniqueViolation(error: unknown): { field: 'name'; message: string } | null {
  if (!error || typeof error !== 'object') return null
  const pgError = error as PostgrestLikeError
  if (pgError.code !== '23505') return null

  const fullMessage = `${pgError.message || ''} ${pgError.details || ''}`.toLowerCase()
  if (
    fullMessage.includes('supplier_tenant_name_norm_uidx') ||
    fullMessage.includes('normalize_supplier_name')
  ) {
    return { field: 'name', message: 'Ja existe fornecedor com este nome.' }
  }

  return null
}

async function findSupplierDuplicate(params: {
  db: Awaited<ReturnType<typeof createClient>>
  tenantId: string
  name: string
  excludeId?: string
}): Promise<ExistingSupplierRow | null> {
  const normalizedInputName = normalizeSupplierName(params.name)
  if (!normalizedInputName) return null

  let query = params.db.from('Supplier').select('id, name').eq('tenantId', params.tenantId)
  if (params.excludeId) {
    query = query.neq('id', params.excludeId)
  }

  const { data, error } = await query
  if (error) throw error

  const suppliers = (data ?? []) as ExistingSupplierRow[]
  return (
    suppliers.find(supplier => normalizeSupplierName(supplier.name) === normalizedInputName) ?? null
  )
}

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
    return actionError('Erro de validacao.', validatedFields.error.flatten().fieldErrors)
  }

  try {
    const db = await createClient()
    const duplicate = await findSupplierDuplicate({
      db,
      tenantId: user.tenantId,
      name: validatedFields.data.name,
    })
    if (duplicate) {
      return actionError('Ja existe fornecedor com este nome.', {
        name: ['Ja existe fornecedor com este nome.'],
      })
    }

    const supplierPayload: SupplierInsert = {
      ...validatedFields.data,
      tenantId: user.tenantId,
    }

    const { data: createdSupplier, error } = await db
      .from('Supplier')
      .insert(supplierPayload as never)
      .select('id, name')
      .single()

    if (error) throw error

    const slug = user.tenant?.slug
    if (slug) {
      revalidateWorkspaceAppPaths(slug, ['/fornecedores', '/estoque'])
    }
    return actionSuccess('Fornecedor criado com sucesso!', createdSupplier)
  } catch (error) {
    const uniqueViolation = parseUniqueViolation(error)
    if (uniqueViolation) {
      return actionError(uniqueViolation.message, {
        [uniqueViolation.field]: [uniqueViolation.message],
      })
    }

    console.error('Database Error:', error)
    return actionError('Erro ao criar fornecedor.')
  }
}

export async function updateSupplier(id: string, input: unknown): Promise<ActionResponse> {
  const user = await getCurrentUser()
  if (!user) return unauthorizedAction()

  const validatedFields = SupplierSchema.safeParse(input)
  if (!validatedFields.success) {
    return actionError('Erro de validacao.', validatedFields.error.flatten().fieldErrors)
  }

  try {
    const db = await createClient()
    const duplicate = await findSupplierDuplicate({
      db,
      tenantId: user.tenantId,
      name: validatedFields.data.name,
      excludeId: id,
    })
    if (duplicate) {
      return actionError('Ja existe fornecedor com este nome.', {
        name: ['Ja existe fornecedor com este nome.'],
      })
    }

    const supplierPayload: SupplierUpdate = validatedFields.data

    const { data: updatedSupplier, error } = await db
      .from('Supplier')
      .update(supplierPayload as never)
      .eq('id', id)
      .select('id, name')
      .single()

    if (error) throw error

    const slug = user.tenant?.slug
    if (slug) {
      revalidateWorkspaceAppPaths(slug, ['/fornecedores', '/estoque'])
    }
    return actionSuccess('Fornecedor atualizado com sucesso!', updatedSupplier)
  } catch (error) {
    const uniqueViolation = parseUniqueViolation(error)
    if (uniqueViolation) {
      return actionError(uniqueViolation.message, {
        [uniqueViolation.field]: [uniqueViolation.message],
      })
    }

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
    return actionSuccess('Fornecedor excluido com sucesso!')
  } catch (error) {
    console.error('Database Error:', error)
    return actionError('Erro ao excluir fornecedor. Verifique se existem materiais vinculados.')
  }
}
