'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResponse } from '@/lib/types'
import type { BackupData } from '@/lib/backup-types'
import { getCurrentUser } from '@/lib/auth'

/**
 * Generate complete database backup
 */
export async function generateBackup(): Promise<ActionResponse<{ data: string; timestamp: string }>> {
    try {
        const user = await getCurrentUser()
        if (!user) return { success: false, message: 'Unauthorized' }

        const timestamp = new Date().toISOString()
        const supabase = await createClient()

        // Fetch all data
        const [
            { data: customers },
            { data: materials },
            { data: products },
            { data: orders },
            { data: suppliers },
            { data: movements }
        ] = await Promise.all([
            supabase.from('Customer').select('*').eq('tenantId', user.tenantId),
            supabase.from('Material').select('*').eq('tenantId', user.tenantId),
            supabase.from('Product').select('*, materials:ProductMaterial(*)').eq('tenantId', user.tenantId),
            supabase.from('Order').select('*, items:OrderItem(*, product:Product(*))').eq('tenantId', user.tenantId),
            supabase.from('Supplier').select('*').eq('tenantId', user.tenantId),
            supabase.from('InventoryMovement').select('*').eq('tenantId', user.tenantId)
        ])

        const backup = {
            version: '1.0',
            timestamp,
            data: {
                customers: customers || [],
                materials: materials || [],
                products: products || [],
                orders: orders || [],
                suppliers: suppliers || [],
                movements: movements || []
            }
        }

        // Convert to JSON string
        const backupData = JSON.stringify(backup, null, 2)

        return {
            success: true,
            message: 'Backup gerado com sucesso!',
            data: {
                data: backupData,
                timestamp
            }
        }
    } catch (error) {
        console.error('Failed to generate backup:', error)
        return {
            success: false,
            message: 'Erro ao gerar backup'
        }
    }
}


/**
 * Validate backup file structure
 */
function validateBackup(backup: BackupData): boolean {
    if (!backup.version || !backup.timestamp || !backup.data) {
        return false
    }

    const requiredTables = ['customers', 'materials', 'products', 'orders']
    return requiredTables.every(table => Array.isArray(backup.data[table as keyof typeof backup.data]))
}

/**
 * Restore database from backup
 * WARNING: This will delete all existing data!
 */
export async function restoreBackup(backupData: string): Promise<ActionResponse> {
    return {
        success: false,
        message: 'A restauração de backup está temporariamente desativada durante a migração do sistema. Contate o suporte.'
    }
}

/**
 * Get backup statistics
 */
export async function getBackupStats() {
    const user = await getCurrentUser()
    if (!user) return { customers: 0, materials: 0, products: 0, orders: 0, total: 0 }

    const supabase = await createClient()

    const [
        { count: customersCount },
        { count: materialsCount },
        { count: productsCount },
        { count: ordersCount }
    ] = await Promise.all([
        supabase.from('Customer').select('*', { count: 'exact', head: true }).eq('tenantId', user.tenantId),
        supabase.from('Material').select('*', { count: 'exact', head: true }).eq('tenantId', user.tenantId),
        supabase.from('Product').select('*', { count: 'exact', head: true }).eq('tenantId', user.tenantId),
        supabase.from('Order').select('*', { count: 'exact', head: true }).eq('tenantId', user.tenantId)
    ])

    const c = customersCount || 0
    const m = materialsCount || 0
    const p = productsCount || 0
    const o = ordersCount || 0

    return {
        customers: c,
        materials: m,
        products: p,
        orders: o,
        total: c + m + p + o
    }
}


