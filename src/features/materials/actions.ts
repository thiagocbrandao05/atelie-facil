'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import { ActionResponse, MaterialQueryResponse } from '@/lib/types'
import { actionError, actionSuccess, unauthorizedAction } from '@/lib/action-response'
import { revalidateWorkspaceAppPaths } from '@/lib/revalidate-workspace-path'

const materialSchema = z.object({
  name: z.string().min(1, 'Nome do material e obrigatorio'),
  unit: z.string().min(1, 'Unidade e obrigatoria'),
  minQuantity: z.coerce.number().optional().nullable(),
  supplierId: z.string().optional().nullable(),
  colors: z.string().optional(),
})

function parseColors(colors?: string | null) {
  if (!colors) return []
  return colors
    .split(',')
    .map(color => color.trim())
    .filter(color => color.length > 0)
}

export async function createMaterial(
  _prevState: unknown,
  formData: FormData
): Promise<ActionResponse> {
  const user = await getCurrentUser()
  if (!user) return unauthorizedAction()

  const rawData = {
    name: formData.get('name'),
    unit: formData.get('unit'),
    minQuantity: formData.get('minQuantity'),
    supplierId: formData.get('supplierId'),
    colors: formData.get('colors'),
  }

  const validated = materialSchema.safeParse(rawData)
  if (!validated.success) {
    return actionError('Erro de validacao', validated.error.flatten().fieldErrors)
  }

  const { name, unit, minQuantity, supplierId, colors } = validated.data
  const colorArray = parseColors(colors)
  const supabase = await createClient()

  try {
    // @ts-expect-error legacy schema not fully represented in generated DB types
    const { error } = await supabase.from('Material').insert({
      tenantId: user.tenantId,
      name,
      unit,
      quantity: 0,
      minQuantity: minQuantity || null,
      supplierId: supplierId || null,
      colors: colorArray,
    })

    if (error) {
      console.error('Database Error:', error)
      return actionError('Erro ao criar material')
    }

    const slug = user.tenant?.slug
    if (slug) {
      revalidateWorkspaceAppPaths(slug, ['/estoque'])
    }
    return actionSuccess('Material criado com sucesso!')
  } catch (error) {
    console.error('Server Error:', error)
    return actionError('Erro no servidor')
  }
}

export async function updateMaterial(
  id: string,
  _prevState: unknown,
  formData: FormData
): Promise<ActionResponse> {
  const user = await getCurrentUser()
  if (!user) return unauthorizedAction()

  const rawData = {
    name: formData.get('name'),
    unit: formData.get('unit'),
    minQuantity: formData.get('minQuantity'),
    supplierId: formData.get('supplierId'),
    colors: formData.get('colors'),
  }

  const validated = materialSchema.safeParse(rawData)
  if (!validated.success) {
    return actionError('Erro de validacao', validated.error.flatten().fieldErrors)
  }

  const { name, unit, minQuantity, supplierId, colors } = validated.data
  const colorArray = parseColors(colors)

  const supabase = await createClient()
  const { error } = await supabase
    .from('Material')
    // @ts-expect-error legacy schema not fully represented in generated DB types
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
    return actionError('Erro ao atualizar material')
  }

  const slug = user.tenant?.slug
  if (slug) {
    revalidateWorkspaceAppPaths(slug, ['/estoque'])
  }
  return actionSuccess('Material atualizado com sucesso!')
}

export async function deleteMaterial(id: string) {
  const user = await getCurrentUser()
  if (!user) return unauthorizedAction()

  const supabase = await createClient()
  const { error } = await supabase
    .from('Material')
    .delete()
    .eq('id', id)
    .eq('tenantId', user.tenantId)

  if (error) {
    return actionError('Erro ao deletar material')
  }

  const slug = user.tenant?.slug
  if (slug) {
    revalidateWorkspaceAppPaths(slug, ['/estoque'])
  }
  return actionSuccess('Material deletado')
}

export async function getMaterials() {
  const user = await getCurrentUser()
  if (!user) return []

  const supabase = await createClient()

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

  const rawData = materialsData as unknown as MaterialQueryResponse[]

  return rawData.map(material => ({
    ...material,
    supplierName: material.Supplier?.name,
    cost: material.cost || 0,
    colors: Array.isArray(material.colors) ? material.colors : [],
  }))
}
