'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import { ActionResponse, MaterialQueryResponse } from '@/lib/types'

const materialSchema = z.object({
  name: z.string().min(1, 'Nome do material é obrigatório'),
  unit: z.string().min(1, 'Unidade é obrigatória'),
  minQuantity: z.coerce.number().optional().nullable(),
  supplierId: z.string().optional().nullable(),
  colors: z.string().optional(), // Comma separated or single string
})

export async function createMaterial(prevState: any, formData: FormData): Promise<ActionResponse> {
  const user = await getCurrentUser()
  if (!user) return { success: false, message: 'Não autorizado' }

  const rawData = {
    name: formData.get('name'),
    unit: formData.get('unit'),
    minQuantity: formData.get('minQuantity'),
    supplierId: formData.get('supplierId'),
    colors: formData.get('colors'),
  }

  const validated = materialSchema.safeParse(rawData)

  if (!validated.success) {
    return {
      success: false,
      message: 'Erro de validação',
      errors: validated.error.flatten().fieldErrors,
    }
  }

  const { name, unit, minQuantity, supplierId, colors } = validated.data

  // Parse colors: split by comma if present
  const colorArray = colors
    ? colors
        .split(',')
        .map(c => c.trim())
        .filter(c => c.length > 0)
    : []

  const supabase = await createClient()

  try {
    const { error } = await (supabase as any).from('Material').insert({
      tenantId: user.tenantId,
      name,
      unit,
      quantity: 0, // Deprecated, always start with 0. Stock is managed via Movements.
      minQuantity: minQuantity || null,
      supplierId: supplierId || null,
      colors: colorArray,
    })

    if (error) {
      console.error('Database Error:', error)
      return { success: false, message: 'Erro ao criar material' }
    }

    const slug = (user as any).tenant?.slug
    revalidatePath(`/${slug}/app/estoque`)
    return { success: true, message: 'Material criado com sucesso!' }
  } catch (error) {
    return { success: false, message: 'Erro no servidor' }
  }
}

// ... existing imports
// Add updateMaterial logic

export async function updateMaterial(
  id: string,
  prevState: any,
  formData: FormData
): Promise<ActionResponse> {
  const user = await getCurrentUser()
  if (!user) return { success: false, message: 'Não autorizado' }

  const rawData = {
    name: formData.get('name'),
    unit: formData.get('unit'),
    minQuantity: formData.get('minQuantity'),
    supplierId: formData.get('supplierId'),
    colors: formData.get('colors'),
  }

  const validated = materialSchema.safeParse(rawData)
  if (!validated.success) {
    return {
      success: false,
      message: 'Erro de validação',
      errors: validated.error.flatten().fieldErrors,
    }
  }

  const { name, unit, minQuantity, supplierId, colors } = validated.data
  const colorArray = colors
    ? colors
        .split(',')
        .map(c => c.trim())
        .filter(c => c.length > 0)
    : []

  const supabase = await createClient()
  const { error } = await (supabase as any)
    .from('Material')
    .update({
      name,
      unit,
      minQuantity: minQuantity || null,
      supplierId: supplierId || null,
      colors: colorArray,
    })
    .eq('id', id)
    .eq('tenantId', user.tenantId)

  if (error) {
    console.error('Update Error:', error)
    return { success: false, message: 'Erro ao atualizar material' }
  }

  const slug = (user as any).tenant?.slug
  revalidatePath(`/${slug}/app/estoque`)
  return { success: true, message: 'Material atualizado com sucesso!' }
}

export async function deleteMaterial(id: string) {
  const user = await getCurrentUser()
  if (!user) return { success: false, message: 'Não autorizado' }

  const supabase = await createClient()
  const { error } = await (supabase as any)
    .from('Material')
    .delete()
    .eq('id', id)
    .eq('tenantId', user.tenantId)

  if (error) {
    return { success: false, message: 'Erro ao deletar material' }
  }

  const slug = (user as any).tenant?.slug
  revalidatePath(`/${slug}/app/estoque`)
  return { success: true, message: 'Material deletado' }
}

export async function getMaterials() {
  const user = await getCurrentUser()
  if (!user) return []

  const supabase = await createClient()

  // Fetch materials with Supplier
  const { data: materialsData, error: materialsError } = await supabase
    .from('Material')
    .select(
      `
            *,
            Supplier (name)
        `
    )
    .eq('tenantId', user.tenantId)
    .order('name')

  if (materialsError) {
    console.error('Error fetching materials:', materialsError.message, materialsError)
    return []
  }

  // Cast seguro para a estrutura do banco
  const rawData = materialsData as unknown as MaterialQueryResponse[]

  // Mapeamento para o tipo de domínio MaterialWithDetails
  return rawData.map(m => ({
    ...m,
    supplierName: m.Supplier?.name,
    // Use the database cost column (which now stores MPM)
    cost: m.cost || 0,
    // Ensure colors is an array
    colors: Array.isArray(m.colors) ? m.colors : [],
  }))
}
