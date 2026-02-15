'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { calculateStockAlerts } from '@/lib/inventory'

type MovementRow = {
  id: string
  type: string
  quantity: number
  reason?: string | null
  reference?: string | null
  createdAt: string
  materialId: string
  color?: string | null
}

type MaterialRow = {
  id: string
  name: string
  unit: string
}

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
  const movementRows = movementsData as MovementRow[]
  const materialIds = Array.from(new Set(movementRows.map(m => m.materialId)))

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
  const materialMap = new Map<string, MaterialRow>()
  if (materialsData) {
    ;(materialsData as MaterialRow[]).forEach(m => {
      materialMap.set(m.id, m)
    })
  }

  return movementRows.map(m => {
    const mat = materialMap.get(m.materialId)
    return {
      id: m.id,
      createdAt: new Date(m.createdAt),
      materialName: mat?.name || 'Material Removido/Desconhecido',
      type: m.type,
      quantity: m.quantity,
      unit: mat?.unit || '',
      reason: m.reason || m.reference || '',
      color: m.color || undefined,
    }
  })
}

export async function getStockAlerts() {
  const user = await getCurrentUser()
  if (!user) return []

  return calculateStockAlerts(user.tenantId)
}
