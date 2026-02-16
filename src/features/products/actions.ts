'use server'

import { createClient } from '@/lib/supabase/server'
import { ProductSchema } from '@/lib/schemas'
import type {
  ActionResponse,
  PaginatedResponse,
  ProductWithMaterials,
  ProductQueryResponse,
} from '@/lib/types'
import { getCurrentUser } from '@/lib/auth'
import { actionError, actionSuccess, unauthorizedAction } from '@/lib/action-response'
import { revalidateWorkspaceAppPaths } from '@/lib/revalidate-workspace-path'

type ProductMaterialInput = {
  id: string
  quantity: number
  unit: string
  color?: string | null
}

function normalizeProducts(rawData: ProductQueryResponse[]): ProductWithMaterials[] {
  return rawData.map(product => ({
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
}

function parseMaterials(formData: FormData): ProductMaterialInput[] {
  const materialsRaw = formData.get('materials')
  if (typeof materialsRaw !== 'string') return []

  let parsedUnknown: unknown
  try {
    parsedUnknown = JSON.parse(materialsRaw || '[]')
  } catch {
    throw new Error('Composicao de materiais invalida.')
  }

  if (!Array.isArray(parsedUnknown)) {
    throw new Error('Composicao de materiais invalida.')
  }

  const parsed = parsedUnknown as ProductMaterialInput[]
  const seen = new Set<string>()

  for (const material of parsed) {
    if (!material.id || material.id.trim() === '') {
      throw new Error('Material sem identificador valido.')
    }

    const key = material.id.trim()
    if (seen.has(key)) {
      throw new Error('Material duplicado na composicao do produto.')
    }
    seen.add(key)
  }

  return parsed
}

function parsePrice(formData: FormData): number | null {
  const priceRaw = formData.get('price')
  if (typeof priceRaw !== 'string' || priceRaw.trim() === '') return null

  const parsed = parseFloat(priceRaw)
  if (!Number.isFinite(parsed)) {
    throw new Error('Preco invalido.')
  }

  return parsed
}

function mapMaterialsForRpc(materials: ProductMaterialInput[]) {
  return materials.map(material => ({
    id: material.id,
    quantity: material.quantity,
    unit: material.unit,
    color: material.color,
  }))
}

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
  const formattedData = normalizeProducts(rawData)

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
  const db = supabase

  const { data, error } = await db
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

  const rawData = (data || []) as ProductQueryResponse[]
  return normalizeProducts(rawData)
}

export async function createProduct(
  _prevState: ActionResponse,
  formData: FormData
): Promise<ActionResponse> {
  const user = await getCurrentUser()
  if (!user) return unauthorizedAction()

  try {
    const data = {
      name: formData.get('name'),
      imageUrl: formData.get('imageUrl') || undefined,
      description: formData.get('description') || undefined,
      price: parsePrice(formData),
      laborTime: formData.get('laborTime'),
      profitMargin: formData.get('profitMargin'),
      materials: parseMaterials(formData),
    }

    const validatedFields = ProductSchema.safeParse(data)
    if (!validatedFields.success) {
      return actionError(
        'Dados invalidos. Verifique os campos.',
        validatedFields.error.flatten().fieldErrors
      )
    }

    const supabase = await createClient()
    const db = supabase
    const workspaceSlug = user.tenant?.slug

    // @ts-expect-error legacy schema not fully represented in generated DB types
    const { error } = await db.rpc('create_product_with_materials', {
      p_tenant_id: user.tenantId,
      p_name: validatedFields.data.name,
      p_image_url: validatedFields.data.imageUrl || '',
      p_labor_time: validatedFields.data.laborTime,
      p_profit_margin: validatedFields.data.profitMargin,
      p_materials: mapMaterialsForRpc(validatedFields.data.materials || []),
      p_description: validatedFields.data.description || null,
      p_price: validatedFields.data.price || null,
    })

    if (error) throw error

    if (workspaceSlug) {
      revalidateWorkspaceAppPaths(workspaceSlug, ['/produtos'])
    }
    return actionSuccess('Produto cadastrado com sucesso!')
  } catch (error: unknown) {
    console.error('Failed to create product:', error)
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    return actionError(`Erro ao cadastrar produto: ${message}`)
  }
}

export async function updateProduct(
  id: string,
  _prevState: ActionResponse,
  formData: FormData
): Promise<ActionResponse> {
  const user = await getCurrentUser()
  if (!user) return unauthorizedAction()

  try {
    const data = {
      name: formData.get('name'),
      imageUrl: formData.get('imageUrl') || undefined,
      description: formData.get('description') || undefined,
      price: parsePrice(formData),
      laborTime: formData.get('laborTime'),
      profitMargin: formData.get('profitMargin'),
      materials: parseMaterials(formData),
    }

    const validatedFields = ProductSchema.safeParse(data)
    if (!validatedFields.success) {
      return actionError('Dados invalidos.', validatedFields.error.flatten().fieldErrors)
    }

    const supabase = await createClient()
    const db = supabase
    const workspaceSlug = user.tenant?.slug

    // @ts-expect-error legacy schema not fully represented in generated DB types
    const { error } = await db.rpc('update_product_with_materials', {
      p_product_id: id,
      p_tenant_id: user.tenantId,
      p_name: validatedFields.data.name,
      p_image_url: validatedFields.data.imageUrl || '',
      p_labor_time: validatedFields.data.laborTime,
      p_profit_margin: validatedFields.data.profitMargin,
      p_materials: mapMaterialsForRpc(validatedFields.data.materials || []),
      p_description: validatedFields.data.description || null,
      p_price: validatedFields.data.price || null,
    })

    if (error) throw error

    if (workspaceSlug) {
      revalidateWorkspaceAppPaths(workspaceSlug, ['/produtos'])
    }
    return actionSuccess('Produto atualizado!')
  } catch (error: unknown) {
    console.error('Failed to update product:', error)
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    return actionError(`Erro ao atualizar produto: ${message}`)
  }
}

export async function deleteProduct(id: string): Promise<ActionResponse> {
  const user = await getCurrentUser()
  if (!user) return unauthorizedAction()

  try {
    const supabase = await createClient()
    const db = supabase
    const workspaceSlug = user.tenant?.slug

    // @ts-expect-error legacy schema not fully represented in generated DB types
    const { error } = await db.rpc('delete_product', {
      p_product_id: id,
      p_tenant_id: user.tenantId,
    })

    if (error) throw error

    if (workspaceSlug) {
      revalidateWorkspaceAppPaths(workspaceSlug, ['/produtos'])
    }
    return actionSuccess('Produto removido!')
  } catch {
    return actionError('Erro ao remover produto. Verifique se ele esta em pedidos.')
  }
}
