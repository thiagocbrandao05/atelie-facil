import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { convertQuantity } from './units'

/**
 * Checks if there is enough material in stock for a given order.
 * Returns an object with availability and details about missing items.
 */
export async function checkStockAvailability(orderId: string) {
  const supabase = await createClient()

  // Fetch order items with product materials
  const { data: orderItems, error } = await supabase
    .from('OrderItem')
    .select(
      `
            quantity,
            product:Product (
                name,
                materials:ProductMaterial (
                    quantity,
                    unit,
                    color,
                    material:Material (
                        id,
                        name,
                        quantity,
                        unit
                    )
                )
            )
        `
    )
    .eq('orderId', orderId)

  if (error || !orderItems) {
    console.error('Error checking stock:', error)
    throw new Error('Failed to check stock availability')
  }

  const materialRequirements: Record<
    string,
    { name: string; color: string | null; required: number; available: number }
  > = {}

  // Note: The type assertion here assumes the structure matches the query.
  for (const item of orderItems as any[]) {
    if (!item.product?.materials) continue

    for (const pm of item.product.materials) {
      // CRITICAL FIX: Convert requirement to the material's base unit
      // Example: If product uses 50cm and stock is in m, convertedRequired will be 0.5
      const convertedRequired = convertQuantity(pm.quantity, pm.unit, pm.material.unit)
      const totalRequired = convertedRequired * item.quantity

      const materialId = pm.material.id
      const color = pm.color || null
      const key = `${materialId}|${color || 'ALL'}`

      if (!materialRequirements[key]) {
        materialRequirements[key] = {
          name: pm.material.name,
          color: color,
          required: 0,
          available: 0, // Will fetch via balance RPC for precision
        }
      }
      materialRequirements[key].required += totalRequired
    }
  }

  // Secondary pass to fetch ACTUAL balance for each material|color
  for (const key of Object.keys(materialRequirements)) {
    const [materialId, colorKey] = key.split('|')
    const color = colorKey === 'ALL' ? null : colorKey

    const { data: balance, error: balanceError } = await (supabase as any).rpc(
      'get_material_balance_v2',
      {
        p_tenant_id: (await getCurrentUser())?.tenantId,
        p_material_id: materialId,
        p_color: color,
      }
    )

    if (!balanceError) {
      materialRequirements[key].available = Number(balance)
    }
  }

  const missingMaterials = Object.values(materialRequirements)
    .filter(m => m.required > m.available)
    .map(m => ({
      name: `${m.name}${m.color ? ` (Cor: ${m.color})` : ''}`,
      required: m.required,
      available: m.available,
    }))

  return {
    isAvailable: missingMaterials.length === 0,
    missingMaterials,
  }
}

/**
 * Deducts materials from stock based on the products in the order.
 * Uses a Postgres RPC function for atomicity.
 */
export async function deductStockForOrder(orderId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  const supabase = await createClient()

  const { error } = await supabase.rpc('deduct_stock_for_order', {
    p_order_id: orderId,
    p_tenant_id: user.tenantId,
  } as any)

  if (error) {
    console.error('Error deducting stock:', error)
    throw new Error(error.message)
  }
}

/**
 * Checks if there is enough finished product stock for a given order.
 */
export async function checkFinishedStockAvailability(orderId: string) {
  const supabase = await createClient()

  // Fetch order items with current inventory
  const { data: orderItems, error } = await (supabase as any)
    .from('ProductInventory')
    .select(`
      productId,
      quantity,
      product:Product (
        name,
        inventory:ProductInventory (
          quantity
        )
      )
    `)
    .eq('orderId', orderId)

  if (error || !orderItems) {
    console.error('Error checking finished stock:', error)
    throw new Error('Failed to check finished stock availability')
  }

  const missingProducts = (orderItems as any[])
    .filter(item => {
      const available = item.product?.inventory?.quantity || 0
      return item.quantity > available
    })
    .map(item => ({
      name: item.product?.name || 'Produto Desconhecido',
      required: item.quantity,
      available: item.product?.inventory?.quantity || 0
    }))

  return {
    isAvailable: missingProducts.length === 0,
    missingProducts
  }
}

/**
 * Deducts finished products from stock based on the order.
 */
export async function deductFinishedStockForOrder(orderId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  const supabase = await createClient()

  // 1. Get order items
  const { data: items, error: fetchError } = await supabase
    .from('OrderItem')
    .select('productId, quantity')
    .eq('orderId', orderId)

  if (fetchError || !items) throw new Error('Failed to fetch order items for deduction')

  // 2. Process each item (In production, use a single RPC for atomicity)
  for (const item of items as any[]) {
    // Insert movement
    await (supabase as any).from('ProductInventoryMovement').insert({
      tenantId: user.tenantId,
      productId: item.productId,
      type: 'SAIDA',
      quantity: item.quantity,
      reason: `Pedido #${orderId}`,
      reference: orderId,
      createdBy: user.id
    })

    // Update balance
    const { data: current } = await (supabase as any)
      .from('ProductInventory')
      .select('quantity')
      .eq('productId', item.productId)
      .eq('tenantId', user.tenantId)
      .single()

    const newBalance = ((current as any)?.quantity || 0) - item.quantity

    await (supabase as any)
      .from('ProductInventory')
      .update({ quantity: newBalance, updatedAt: new Date().toISOString() })
      .eq('productId', item.productId)
      .eq('tenantId', user.tenantId)
  }
}

/**
 * Shared utility to calculate stock alerts per color.
 * Each color variant is treated as a separate item for low stock checking.
 */
export async function calculateStockAlerts(tenantId: string) {
  const supabase = await createClient()

  // 1. Fetch materials with minQuantity set and their defined colors
  // Note: colors is a text[] column added in migration_stock.sql
  const { data: materials, error: matError } = await supabase
    .from('Material')
    .select('id, name, unit, minQuantity, colors')
    .eq('tenantId', tenantId)
    .not('minQuantity', 'is', null)

  if (matError || !materials) return []

  // 2. Fetch all movements to calculate balances in memory
  const { data: movements, error: movError } = await supabase
    .from('InventoryMovement')
    .select('materialId, type, quantity, color')
    .eq('tenantId', tenantId)

  if (movError || !movements) return []

  // 3. Calculate balances per material and color
  const balances: Record<string, Record<string, number>> = {} // materialId -> color -> balance

    ; (movements as any[]).forEach(m => {
      const materialId = m.materialId
      const color = m.color || 'DEFAULT'
      const qty = Number(m.quantity)
      const isIn = ['ENTRADA', 'ENTRADA_AJUSTE'].includes(m.type)
      const isOut = ['SAIDA', 'SAIDA_AJUSTE', 'PERDA', 'RETIRADA'].includes(m.type)

      if (!balances[materialId]) balances[materialId] = {}
      if (typeof balances[materialId][color] === 'undefined') balances[materialId][color] = 0

      if (isIn) balances[materialId][color] += qty
      if (isOut) balances[materialId][color] -= qty
    })

  // 4. Identify alerts per color
  const alerts: any[] = []

    ; (materials as any[]).forEach(m => {
      const minQty = Number(m.minQuantity)

      // We consider all colors recorded in movements plus any defined in the 'colors' array
      const materialMovements = balances[m.id] || {}

      let definedColors: string[] = []
      try {
        let parsed: any = m.colors
        if (typeof parsed === 'string') {
          if (parsed.startsWith('[')) {
            parsed = JSON.parse(parsed)
          }
        }

        if (Array.isArray(parsed)) {
          definedColors = parsed.flat().map(c => String(c).replace(/['"\[\]]+/g, '').trim()).filter(Boolean)
        } else if (parsed) {
          definedColors = [String(parsed).replace(/['"\[\]]+/g, '').trim()].filter(Boolean)
        }
      } catch (e) {
        definedColors = []
      }

      // Combine all color keys to check
      const colorsToCheck = new Set([...Object.keys(materialMovements), ...definedColors])

      // If there are no movements and no defined colors, check 'DEFAULT'
      if (colorsToCheck.size === 0) {
        colorsToCheck.add('DEFAULT')
      }

      colorsToCheck.forEach(color => {
        const balance = materialMovements[color] || 0
        if (balance <= minQty) {
          const colorLabel = color === 'DEFAULT' ? '' : ` (${color})`
          alerts.push({
            id: `${m.id}|${color}`,
            materialId: m.id,
            name: `${m.name}${colorLabel}`,
            currentQuantity: balance,
            minQuantity: minQty,
            unit: m.unit,
            color: color === 'DEFAULT' ? null : color,
            severity: balance <= 0 ? 'critical' : balance <= minQty / 2 ? 'high' : 'medium',
          })
        }
      })
    })

  return alerts
}
