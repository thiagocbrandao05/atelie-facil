'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { calculateStockAlerts } from '@/lib/inventory'

export async function getAllInventoryMovements() {
  const user = await getCurrentUser()
  if (!user) return []

  const supabase = await createClient()

  // Fetch movements first
  // Note: Using 'InventoryMovement' table as per schema
  const { data: movementsData, error: movementsError } = await supabase
    .from('InventoryMovement')
    .select(
      `
            id,
            type,
            quantity,
            reason,
            reference,
            createdAt,
            materialId,
            color
        `
    )
    .eq('tenantId', user.tenantId)
    .order('createdAt', { ascending: false })
    .limit(50)

  if (movementsError) {
    console.error('Error fetching stock movements:', movementsError.message, movementsError)
    return []
  }

  if (!movementsData || movementsData.length === 0) {
    return []
  }

  // Get unique material IDs
  const materialIds = Array.from(new Set(movementsData.map((m: any) => m.materialId)))

  // Fetch materials
  const { data: materialsData, error: materialsError } = await supabase
    .from('Material')
    .select('id, name, unit')
    .in('id', materialIds)
    .eq('tenantId', user.tenantId)

  if (materialsError) {
    console.error('Error fetching materials for movements:', materialsError.message, materialsError)
  }

  // Create map
  const materialMap = new Map()
  if (materialsData) {
    materialsData.forEach((m: any) => {
      materialMap.set(m.id, m)
    })
  }

  return movementsData.map((m: any) => {
    const mat = materialMap.get(m.materialId)
    return {
      id: m.id,
      createdAt: m.createdAt,
      materialName: mat?.name || 'Material Removido/Desconhecido',
      type: m.type,
      quantity: m.quantity,
      unit: mat?.unit || '',
      reason: m.reason || m.reference || '',
      color: m.color || null,
    }
  })
}

export async function getStockAlerts() {
  const user = await getCurrentUser()
  if (!user) return []

  return calculateStockAlerts(user.tenantId)
}
