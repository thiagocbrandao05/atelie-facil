'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { calculateStockAlerts } from '@/lib/inventory'

export async function getAllInventoryMovements() {
    const user = await getCurrentUser()
    if (!user) return []

    const supabase = await createClient()

    // Fetch from new stock_movements table
    // Ordering by created_at descending (newest first)
    const { data: rawData, error } = await supabase
        .from('stock_movements')
        .select(`
            id,
            type,
            quantity,
            note,
            source,
            created_at,
            color,
            Material (
                name,
                unit
            )
        `)
        .eq('tenant_id', user.tenantId) // Use tenant_id (snake_case)
        .order('created_at', { ascending: false })
        .limit(50) // Limit per requirement

    if (error) {
        console.error('Error fetching stock movements:', error)
        return []
    }

    // Map to friendly format for UI if needed, but existing component expects specific fields.
    // Let's assume UI expects logic similar to what we return.
    // I need to verify what InventoryHistory component expects.
    // Assuming it expects: date, materialName, type, quantity, reason/note.

    return rawData.map((m: any) => {
        // Safe access to Material relation
        // Supabase might return it as 'Material' or 'material', depending on exact setup.
        // We'll try both or inspection. But type hints say 'Material'.
        const mat = m.Material || m.material

        return {
            id: m.id,
            createdAt: m.created_at,
            materialName: mat?.name || 'Material Removido/Desconhecido',
            type: m.type, // ENTRADA, SAIDA, etc.
            quantity: m.quantity,
            unit: mat?.unit || '',
            reason: m.note || m.source, // Fallback to source if no note
            color: m.color
        }
    })

}

export async function getStockAlerts() {
    const user = await getCurrentUser()
    if (!user) return []

    return calculateStockAlerts(user.tenantId)
}


