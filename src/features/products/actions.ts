'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { ProductSchema } from '@/lib/schemas'
import type {
  ActionResponse,
  PaginatedResponse,
  ProductWithMaterials,
  ProductQueryResponse,
} from '@/lib/types'
import { getCurrentUser } from '@/lib/auth'
import { actionError, actionSuccess, unauthorizedAction } from '@/lib/action-response'
import { buildWorkspaceAppPaths } from '@/lib/workspace-path'

export async function getProductsPaginated(
  page: number = 1,
  pageSize: number = 20
): Promise<PaginatedResponse<ProductWithMaterials>> {
  const user = await getCurrentUser()
  if (!user) return { data: [], total: 0, page, pageSize, totalPages: 0 }

  const supabase = await createClient()
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, count, error } = await supabase
    .from('Product')
    .select(
      `
            *,
            materials:ProductMaterial(
                materialId,
                quantity,
                unit,
                color,
                material:Material(*)
            )
        `,
      { count: 'exact' }
    )
    .eq('tenantId', user.tenantId)
    .order('name', { ascending: true })
    .range(from, to)

  if (error) {
    console.error('Error fetching products:', error)
    return { data: [], total: 0, page, pageSize, totalPages: 0 }
  }

  const rawData = data as unknown as ProductQueryResponse[]
  const formattedData: ProductWithMaterials[] = rawData.map(product => ({
    ...product,
    cost: product.cost || 0,
    materials: product.materials.map(pm => ({
      ...pm,
      material: {
        ...pm.material,
        cost: pm.material.cost || 0,
      },
    })),
  }))

  return {
    data: formattedData,
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  }
}

export async function getProducts() {
  const user = await getCurrentUser()
  if (!user) return []

  const supabase = await createClient()
  const { data, error } = await (supabase as any)
    .from('Product')
    .select(
      `
            *,
            materials:ProductMaterial(
                materialId,
                quantity,
                unit,
                color,
                material:Material(*)
            )
        `
    )
    .eq('tenantId', user.tenantId)
    .order('name', { ascending: true })

  if (error) {
    console.error('SUPABASE ERROR IN getProducts:', error)
  }

  const formattedData = ((data || []) as any[]).map(product => ({
    ...product,
    cost: product.cost || 0,
    materials: product.materials.map((pm: any) => ({
      ...pm,
      material: {
        ...pm.material,
        cost: pm.material.cost || 0,
      },
    })),
  }))

  return formattedData || []
}

export async function createProduct(
  prevState: ActionResponse,
  formData: FormData
): Promise<ActionResponse> {
  const user = await getCurrentUser()
  if (!user) return unauthorizedAction()

  try {
    const materialsJson = formData.get('materials') as string
    const materials = JSON.parse(materialsJson || '[]')

    for (const material of materials) {
      if (!material.id || material.id.trim() === '') {
        return actionError('Erro: Material sem ID válido encontrado.')
      }
    }

    const priceRaw = formData.get('price') as string
    const price = priceRaw && priceRaw.trim() !== '' ? parseFloat(priceRaw) : null

    const data = {
      name: formData.get('name'),
      imageUrl: formData.get('imageUrl') || undefined,
      description: formData.get('description') || undefined,
      price,
      laborTime: formData.get('laborTime'),
      profitMargin: formData.get('profitMargin'),
      materials,
    }

    const validatedFields = ProductSchema.safeParse(data)
    if (!validatedFields.success) {
      return actionError(
        'Dados inválidos. Verifique os campos.',
        validatedFields.error.flatten().fieldErrors
      )
    }

    const supabase = await createClient()
    const workspaceSlug = user.tenant?.slug

    const { error } = await (supabase as any).rpc('create_product_with_materials', {
      p_tenant_id: user.tenantId,
      p_name: validatedFields.data.name,
      p_image_url: validatedFields.data.imageUrl || '',
      p_labor_time: validatedFields.data.laborTime,
      p_profit_margin: validatedFields.data.profitMargin,
      p_materials: (validatedFields.data.materials || []).map((m: any) => ({
        id: m.id,
        quantity: m.quantity,
        unit: m.unit,
        color: m.color,
      })),
      p_description: validatedFields.data.description || null,
      p_price: validatedFields.data.price || null,
    } as any)

    if (error) throw error

    if (workspaceSlug) {
      for (const path of buildWorkspaceAppPaths(workspaceSlug, ['/produtos'])) {
        revalidatePath(path)
      }
    }
    return actionSuccess('Produto cadastrado com sucesso!')
  } catch (error: any) {
    console.error('Failed to create product:', error)
    return actionError('Erro ao cadastrar produto: ' + (error.message || 'Erro desconhecido'))
  }
}

export async function updateProduct(
  id: string,
  prevState: ActionResponse,
  formData: FormData
): Promise<ActionResponse> {
  const user = await getCurrentUser()
  if (!user) return unauthorizedAction()

  const materialsJson = formData.get('materials') as string
  const materials = JSON.parse(materialsJson || '[]')

  const priceRaw = formData.get('price') as string
  const price = priceRaw && priceRaw.trim() !== '' ? parseFloat(priceRaw) : null

  const data = {
    name: formData.get('name'),
    imageUrl: formData.get('imageUrl') || undefined,
    description: formData.get('description') || undefined,
    price,
    laborTime: formData.get('laborTime'),
    profitMargin: formData.get('profitMargin'),
    materials,
  }

  const validatedFields = ProductSchema.safeParse(data)
  if (!validatedFields.success) {
    return actionError('Dados inválidos.', validatedFields.error.flatten().fieldErrors)
  }

  try {
    const supabase = await createClient()
    const workspaceSlug = user.tenant?.slug

    const { error } = await (supabase as any).rpc('update_product_with_materials', {
      p_product_id: id,
      p_tenant_id: user.tenantId,
      p_name: validatedFields.data.name,
      p_image_url: validatedFields.data.imageUrl || '',
      p_labor_time: validatedFields.data.laborTime,
      p_profit_margin: validatedFields.data.profitMargin,
      p_materials: (validatedFields.data.materials || []).map((m: any) => ({
        id: m.id,
        quantity: m.quantity,
        unit: m.unit,
        color: m.color,
      })),
      p_description: validatedFields.data.description || null,
      p_price: validatedFields.data.price || null,
    } as any)

    if (error) throw error

    if (workspaceSlug) {
      for (const path of buildWorkspaceAppPaths(workspaceSlug, ['/produtos'])) {
        revalidatePath(path)
      }
    }
    return actionSuccess('Produto atualizado!')
  } catch (error: any) {
    console.error('Failed to update product:', error)
    return actionError('Erro ao atualizar produto: ' + (error.message || 'Erro desconhecido'))
  }
}

export async function deleteProduct(id: string): Promise<ActionResponse> {
  const user = await getCurrentUser()
  if (!user) return unauthorizedAction()

  try {
    const supabase = await createClient()
    const workspaceSlug = user.tenant?.slug

    const { error } = await (supabase as any).rpc('delete_product', {
      p_product_id: id,
      p_tenant_id: user.tenantId,
    } as any)

    if (error) throw error

    if (workspaceSlug) {
      for (const path of buildWorkspaceAppPaths(workspaceSlug, ['/produtos'])) {
        revalidatePath(path)
      }
    }
    return actionSuccess('Produto removido!')
  } catch {
    return actionError('Erro ao remover produto. Verifique se ele está em pedidos.')
  }
}
