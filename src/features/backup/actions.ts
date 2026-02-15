'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResponse } from '@/lib/types'
import { getCurrentUser } from '@/lib/auth'
import { actionError, actionSuccess, unauthorizedAction } from '@/lib/action-response'

/**
 * Generate complete database backup
 */
export async function generateBackup(): Promise<
  ActionResponse<{ data: string; timestamp: string }>
> {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorizedAction()

    const timestamp = new Date().toISOString()
    const supabase = await createClient()

    // Fetch all data
    const [
      { data: customers, error: customersError },
      { data: materials, error: materialsError },
      { data: products, error: productsError },
      { data: orders, error: ordersError },
      { data: suppliers, error: suppliersError },
      { data: movements, error: movementsError },
    ] = await Promise.all([
      supabase.from('Customer').select('*').eq('tenantId', user.tenantId),
      supabase.from('Material').select('*').eq('tenantId', user.tenantId),
      supabase
        .from('Product')
        .select('*, materials:ProductMaterial(*)')
        .eq('tenantId', user.tenantId),
      supabase
        .from('Order')
        .select('*, items:OrderItem(*, product:Product(*))')
        .eq('tenantId', user.tenantId),
      supabase.from('Supplier').select('*').eq('tenantId', user.tenantId),
      supabase.from('InventoryMovement').select('*').eq('tenantId', user.tenantId),
    ])

    if (
      customersError ||
      materialsError ||
      productsError ||
      ordersError ||
      suppliersError ||
      movementsError
    ) {
      console.error('Failed to collect backup data', {
        customersError,
        materialsError,
        productsError,
        ordersError,
        suppliersError,
        movementsError,
      })
      return actionError('Erro ao coletar dados para backup')
    }

    const backup = {
      version: '1.0',
      timestamp,
      data: {
        customers: customers || [],
        materials: materials || [],
        products: products || [],
        orders: orders || [],
        suppliers: suppliers || [],
        movements: movements || [],
      },
    }

    // Convert to JSON string
    const backupData = JSON.stringify(backup, null, 2)

    return actionSuccess('Backup gerado com sucesso!', {
      data: backupData,
      timestamp,
    })
  } catch (error) {
    console.error('Failed to generate backup:', error)
    return actionError('Erro ao gerar backup')
  }
}

/**
 * Restore database from backup
 * WARNING: This will delete all existing data!
 */
export async function restoreBackup(_backupData: string): Promise<ActionResponse> {
  return actionError(
    'A restauração de backup está temporariamente desativada durante a migração do sistema. Contate o suporte.'
  )
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
    { count: ordersCount },
  ] = await Promise.all([
    supabase
      .from('Customer')
      .select('*', { count: 'exact', head: true })
      .eq('tenantId', user.tenantId),
    supabase
      .from('Material')
      .select('*', { count: 'exact', head: true })
      .eq('tenantId', user.tenantId),
    supabase
      .from('Product')
      .select('*', { count: 'exact', head: true })
      .eq('tenantId', user.tenantId),
    supabase
      .from('Order')
      .select('*', { count: 'exact', head: true })
      .eq('tenantId', user.tenantId),
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
    total: c + m + p + o,
  }
}
