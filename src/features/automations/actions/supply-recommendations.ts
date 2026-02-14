'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { getDemandForecast } from './demand-forecast'
import { getAllMaterialsStock } from '../utils/stock'

export type SupplyRecommendation = {
  materialId: string
  materialName: string
  unit: string
  currentStock: number
  projectedUsage: number
  missingQuantity: number
  suggestedPurchase: number
}

export async function getSupplyRecommendations(): Promise<SupplyRecommendation[]> {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  const supabase = await createClient()
  const tenantId = user.tenantId

  // 1. Get Demand Forecast
  const forecasts = await getDemandForecast(6)

  if (forecasts.length === 0) return []

  // 2. Get Product Recipes (ProductMaterial) for forecasted products
  const productIds = forecasts.map(f => f.productId)

  const { data: recipes, error } = await supabase
    .from('ProductMaterial')
    .select('productId, materialId, quantity')
    .in('productId', productIds)

  if (error) {
    console.error('Error fetching recipes:', error)
    return []
  }

  // 3. Calculate Projected Material Usage
  // Map<MaterialId, Usage>
  const materialUsage = new Map<string, number>()

  recipes?.forEach((recipe: any) => {
    const forecast = forecasts.find(f => f.productId === recipe.productId)
    if (!forecast) return

    const usage = forecast.forecast * recipe.quantity
    const current = materialUsage.get(recipe.materialId) || 0
    materialUsage.set(recipe.materialId, current + usage)
  })

  // 4. Get Current Stock
  const stocks = await getAllMaterialsStock(tenantId)

  // 5. Compare and Generate Recommendations
  const recommendations: SupplyRecommendation[] = []

  materialUsage.forEach((usage, materialId) => {
    const stock = stocks.find(s => s.id === materialId)
    if (!stock) return // Material might have been deleted? Or mismatch.

    const currentStock = stock.quantity
    const missing = currentStock - usage

    if (missing < 0) {
      // Needs purchase
      recommendations.push({
        materialId: stock.id,
        materialName: stock.name,
        unit: stock.unit,
        currentStock: currentStock,
        projectedUsage: usage,
        missingQuantity: Math.abs(missing),
        // Suggested purchase: missing + 10% safety margin?
        // Or simply missing + (minQuantity - (current - usage)) ?
        // Let's keep it simple: Just cover the missing amount + safety margin of 10% or minQuantity if set
        suggestedPurchase: Math.ceil(Math.abs(missing) * 1.1),
      })
    }
  })

  return recommendations.sort((a, b) => b.missingQuantity - a.missingQuantity)
}
