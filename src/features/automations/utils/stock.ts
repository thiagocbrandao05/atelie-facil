import { createClient } from '@/lib/supabase/server'

export type MaterialStock = {
  id: string
  name: string
  unit: string
  quantity: number
  minQuantity: number | null
}

type MaterialStockRow = {
  id: string
  name: string
  unit: string
  quantity: number | string | null
  minQuantity: number | string | null
}

/**
 * Gets current stock for all materials.
 * Uses the 'Material' table which is updated via RPCs.
 */
export async function getAllMaterialsStock(tenantId: string): Promise<MaterialStock[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('Material')
    .select('id, name, unit, quantity, minQuantity')
    .eq('tenantId', tenantId)

  if (error) {
    console.error('Error fetching material stock:', error)
    return []
  }

  return ((data || []) as MaterialStockRow[]).map(item => ({
    id: item.id,
    name: item.name,
    unit: item.unit,
    quantity: Number(item.quantity || 0),
    minQuantity: item.minQuantity ? Number(item.minQuantity) : null,
  }))
}
