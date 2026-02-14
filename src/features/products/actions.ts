'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { ProductSchema } from '@/lib/schemas'
import type { ActionResponse, PaginatedResponse, ProductWithMaterials, ProductQueryResponse } from '@/lib/types'
import { getCurrentUser } from '@/lib/auth'

/**
 * Get products with pagination support
 */
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

  // Cast seguro para a estrutura que vem do banco (com joins e views aninhadas)
  const rawData = data as unknown as ProductQueryResponse[]

  // Mapeamento para o tipo de domínio
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

/**
 * Get all products (for backward compatibility)
 */
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
  if (!user) return { success: false, message: 'Não autorizado' }

  try {
    const materialsJson = formData.get('materials') as string
    const materials = JSON.parse(materialsJson || '[]')

    // Validate material IDs
    for (const material of materials) {
      if (!material.id || material.id.trim() === '') {
        return {
          success: false,
          message: 'Erro: Material sem ID válido encontrado.',
        }
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
      return {
        success: false,
        message: 'Dados inválidos. Verifique os campos.',
        errors: validatedFields.error.flatten().fieldErrors,
      }
    }

    const supabase = await createClient()

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

    revalidatePath('/produtos')
    return { success: true, message: 'Produto cadastrado com sucesso!' }
  } catch (e: any) {
    console.error('Failed to create product:', e)
    return {
      success: false,
      message: 'Erro ao cadastrar produto: ' + (e.message || 'Erro desconhecido'),
    }
  }
}

export async function updateProduct(
  id: string,
  prevState: ActionResponse,
  formData: FormData
): Promise<ActionResponse> {
  const user = await getCurrentUser()
  if (!user) return { success: false, message: 'Não autorizado' }

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
    return {
      success: false,
      message: 'Dados inválidos.',
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  try {
    const supabase = await createClient()

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

    revalidatePath('/produtos')
    return { success: true, message: 'Produto atualizado!' }
  } catch (e: any) {
    console.error('Failed to update product:', e)
    return {
      success: false,
      message: 'Erro ao atualizar produto: ' + (e.message || 'Erro desconhecido'),
    }
  }
}

export async function deleteProduct(id: string): Promise<ActionResponse> {
  const user = await getCurrentUser()
  if (!user) return { success: false, message: 'Não autorizado' }

  try {
    const supabase = await createClient()

    const { error } = await (supabase as any).rpc('delete_product', {
      p_product_id: id,
      p_tenant_id: user.tenantId,
    } as any)

    if (error) throw error

    revalidatePath('/produtos')
    return { success: true, message: 'Produto removido!' }
  } catch (e) {
    return { success: false, message: 'Erro ao remover produto. Verifique se ele está em pedidos.' }
  }
}
