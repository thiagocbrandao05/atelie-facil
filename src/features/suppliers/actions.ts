'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { SupplierSchema } from '@/lib/schemas'
import { getCurrentUser } from '@/lib/auth'

export type ActionResponse = {
  success: boolean
  message: string
  errors?: any
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

  return (data as any[]) || []
}

export async function createSupplier(data: any): Promise<ActionResponse> {
  const user = await getCurrentUser()
  if (!user) return { success: false, message: 'Não autorizado' }

  const validatedFields = SupplierSchema.safeParse(data)

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Erro de validação',
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase.from('Supplier').insert({
      ...validatedFields.data,
      tenantId: user.tenantId,
    } as any)

    if (error) throw error

    const slug = (user as any).tenant?.slug
    revalidatePath(`/${slug}/app/fornecedores`)
    revalidatePath(`/${slug}/app/estoque`)
    return { success: true, message: 'Fornecedor criado com sucesso!' }
  } catch (error) {
    console.error('Database Error:', error)
    return {
      success: false,
      message: 'Erro ao criar fornecedor.',
    }
  }
}

export async function updateSupplier(id: string, data: any): Promise<ActionResponse> {
  const user = await getCurrentUser()
  if (!user) return { success: false, message: 'Não autorizado' }

  const validatedFields = SupplierSchema.safeParse(data)

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Erro de validação',
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('Supplier')
      .update(validatedFields.data as any as never)
      .eq('id', id)

    if (error) throw error

    const slug = (user as any).tenant?.slug
    revalidatePath(`/${slug}/app/fornecedores`)
    revalidatePath(`/${slug}/app/estoque`)
    return { success: true, message: 'Fornecedor atualizado com sucesso!' }
  } catch (error) {
    console.error('Database Error:', error)
    return {
      success: false,
      message: 'Erro ao atualizar fornecedor.',
    }
  }
}

export async function deleteSupplier(id: string): Promise<ActionResponse> {
  const user = await getCurrentUser()
  if (!user) return { success: false, message: 'Não autorizado' }

  try {
    const supabase = await createClient()
    const { error } = await supabase.from('Supplier').delete().eq('id', id)

    if (error) throw error

    const slug = (user as any).tenant?.slug
    revalidatePath(`/${slug}/app/fornecedores`)
    revalidatePath(`/${slug}/app/estoque`)
    return { success: true, message: 'Fornecedor excluído com sucesso!' }
  } catch (error) {
    console.error('Database Error:', error)
    return {
      success: false,
      message: 'Erro ao excluir fornecedor. Verifique se existem materiais vinculados.',
    }
  }
}
