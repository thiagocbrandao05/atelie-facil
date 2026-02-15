import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { convertQuantity } from './units'

type ProductMaterialRequirement = {
  quantity: number
  unit: string
  color?: string | null
  material: {
    id: string
    name: string
    quantity: number
    unit: string
  }
}

type OrderItemWithMaterials = {
  quantity: number
  product?: {
    name?: string
    materials?: ProductMaterialRequirement[]
  } | null
}

type FinishedStockRow = {
  quantity: number
  product?: {
    name?: string
    inventory?: { quantity?: number } | null
  } | null
}

type ProductOrderItem = {
  productId: string
  quantity: number
}

type InventoryMovementRow = {
  materialId: string
  type: string
  quantity: number | string
  color?: string | null
}

type MaterialAlertRow = {
  id: string
  name: string
  unit: string
  minQuantity: number | string | null
  colors?: string[] | string | null
}

/**
 * Checks if there is enough material in stock for a given order.
 * Returns an object with availability and details about missing items.
 */
export async function checkStockAvailability(orderId: string) {
  const db = await createClient()

  const { data: orderItems, error } = await db
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

  for (const item of orderItems as OrderItemWithMaterials[]) {
    if (!item.product?.materials) continue

    for (const pm of item.product.materials) {
      const convertedRequired = convertQuantity(pm.quantity, pm.unit, pm.material.unit)
      const totalRequired = convertedRequired * item.quantity

      const materialId = pm.material.id
      const color = pm.color || null
      const key = `${materialId}|${color || 'ALL'}`

      if (!materialRequirements[key]) {
        materialRequirements[key] = {
          name: pm.material.name,
          color,
          required: 0,
          available: 0,
        }
      }
      materialRequirements[key].required += totalRequired
    }
  }

  const currentUser = await getCurrentUser()
  for (const key of Object.keys(materialRequirements)) {
    const [materialId, colorKey] = key.split('|')
    const color = colorKey === 'ALL' ? null : colorKey

    // @ts-expect-error legacy rpc typing missing in generated Database type
    const { data: balance, error: balanceError } = await db.rpc('get_material_balance_v2', {
      p_tenant_id: currentUser?.tenantId,
      p_material_id: materialId,
      p_color: color,
    })

    if (!balanceError) {
      materialRequirements[key].available = Number(balance)
    }
  }

  const missingMaterials = Object.values(materialRequirements)
    .filter(material => material.required > material.available)
    .map(material => ({
      name: `${material.name}${material.color ? ` (Cor: ${material.color})` : ''}`,
      required: material.required,
      available: material.available,
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

  const db = await createClient()

  // @ts-expect-error legacy rpc typing missing in generated Database type
  const { error } = await db.rpc('deduct_stock_for_order', {
    p_order_id: orderId,
    p_tenant_id: user.tenantId,
  })

  if (error) {
    console.error('Error deducting stock:', error)
    throw new Error(error.message)
  }
}

/**
 * Checks if there is enough finished product stock for a given order.
 */
export async function checkFinishedStockAvailability(orderId: string) {
  const db = await createClient()

  const { data: orderItems, error } = await db
    .from('ProductInventory')
    .select(
      `
      productId,
      quantity,
      product:Product (
        name,
        inventory:ProductInventory (
          quantity
        )
      )
    `
    )
    .eq('orderId', orderId)

  if (error || !orderItems) {
    console.error('Error checking finished stock:', error)
    throw new Error('Failed to check finished stock availability')
  }

  const missingProducts = (orderItems as FinishedStockRow[])
    .filter(item => {
      const available = item.product?.inventory?.quantity || 0
      return item.quantity > available
    })
    .map(item => ({
      name: item.product?.name || 'Produto Desconhecido',
      required: item.quantity,
      available: item.product?.inventory?.quantity || 0,
    }))

  return {
    isAvailable: missingProducts.length === 0,
    missingProducts,
  }
}

/**
 * Deducts finished products from stock based on the order.
 */
export async function deductFinishedStockForOrder(orderId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  const db = await createClient()

  const { data: items, error: fetchError } = await db
    .from('OrderItem')
    .select('productId, quantity')
    .eq('orderId', orderId)

  if (fetchError || !items) throw new Error('Failed to fetch order items for deduction')

  for (const item of items as ProductOrderItem[]) {
    await db
      .from('ProductInventoryMovement')
      // @ts-expect-error legacy table typing missing in generated Database type
      .insert({
        tenantId: user.tenantId,
        productId: item.productId,
        type: 'SAIDA',
        quantity: item.quantity,
        reason: `Pedido #${orderId}`,
        reference: orderId,
        createdBy: user.id,
      })

    const { data: current } = await db
      .from('ProductInventory')
      .select('quantity')
      .eq('productId', item.productId)
      .eq('tenantId', user.tenantId)
      .single()
    const currentRow = current as { quantity?: number | string | null } | null

    const newBalance = (Number(currentRow?.quantity) || 0) - item.quantity

    await db
      .from('ProductInventory')
      // @ts-expect-error legacy table typing missing in generated Database type
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

  const { data: materials, error: matError } = await supabase
    .from('Material')
    .select('id, name, unit, minQuantity, colors')
    .eq('tenantId', tenantId)
    .not('minQuantity', 'is', null)

  if (matError || !materials) return []

  const { data: movements, error: movError } = await supabase
    .from('InventoryMovement')
    .select('materialId, type, quantity, color')
    .eq('tenantId', tenantId)

  if (movError || !movements) return []

  const balances: Record<string, Record<string, number>> = {}

  for (const movement of movements as InventoryMovementRow[]) {
    const materialId = movement.materialId
    const color = movement.color || 'DEFAULT'
    const quantity = Number(movement.quantity)
    const isIn = ['ENTRADA', 'ENTRADA_AJUSTE'].includes(movement.type)
    const isOut = ['SAIDA', 'SAIDA_AJUSTE', 'PERDA', 'RETIRADA'].includes(movement.type)

    if (!balances[materialId]) balances[materialId] = {}
    if (typeof balances[materialId][color] === 'undefined') balances[materialId][color] = 0

    if (isIn) balances[materialId][color] += quantity
    if (isOut) balances[materialId][color] -= quantity
  }

  const alerts: Array<{
    id: string
    materialId: string
    name: string
    currentQuantity: number
    minQuantity: number
    unit: string
    color: string | null
    severity: 'critical' | 'high' | 'medium'
  }> = []

  for (const material of materials as MaterialAlertRow[]) {
    const minQuantity = Number(material.minQuantity)
    const materialMovements = balances[material.id] || {}

    let definedColors: string[] = []
    try {
      let parsedColors = material.colors
      if (typeof parsedColors === 'string' && parsedColors.startsWith('[')) {
        parsedColors = JSON.parse(parsedColors)
      }

      if (Array.isArray(parsedColors)) {
        definedColors = parsedColors
          .flat()
          .map(color =>
            String(color)
              .replace(/['"\[\]]+/g, '')
              .trim()
          )
          .filter(Boolean)
      } else if (parsedColors) {
        definedColors = [
          String(parsedColors)
            .replace(/['"\[\]]+/g, '')
            .trim(),
        ].filter(Boolean)
      }
    } catch {
      definedColors = []
    }

    const colorsToCheck = new Set([...Object.keys(materialMovements), ...definedColors])

    if (colorsToCheck.size === 0) {
      colorsToCheck.add('DEFAULT')
    }

    for (const color of colorsToCheck) {
      const balance = materialMovements[color] || 0
      if (balance <= minQuantity) {
        const colorLabel = color === 'DEFAULT' ? '' : ` (${color})`
        alerts.push({
          id: `${material.id}|${color}`,
          materialId: material.id,
          name: `${material.name}${colorLabel}`,
          currentQuantity: balance,
          minQuantity,
          unit: material.unit,
          color: color === 'DEFAULT' ? null : color,
          severity: balance <= 0 ? 'critical' : balance <= minQuantity / 2 ? 'high' : 'medium',
        })
      }
    }
  }

  return alerts
}
