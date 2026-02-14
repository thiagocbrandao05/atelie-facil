/**
 * Advanced search and filtering utilities
 */

import type { OrderWithDetails, ProductWithMaterials, Material, Customer } from './types'

export interface SearchFilters {
  query?: string
  status?: string
  startDate?: Date
  endDate?: Date
  minValue?: number
  maxValue?: number
  customerId?: string
}

/**
 * Fuzzy search implementation
 */
function fuzzyMatch(text: string, query: string): boolean {
  const textLower = text.toLowerCase()
  const queryLower = query.toLowerCase()

  let queryIndex = 0
  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      queryIndex++
    }
  }

  return queryIndex === queryLower.length
}

/**
 * Calculate relevance score for search results
 */
function calculateRelevance(text: string, query: string): number {
  const textLower = text.toLowerCase()
  const queryLower = query.toLowerCase()

  // Exact match = highest score
  if (textLower === queryLower) return 100

  // Starts with query = high score
  if (textLower.startsWith(queryLower)) return 80

  // Contains query = medium score
  if (textLower.includes(queryLower)) return 60

  // Fuzzy match = low score
  if (fuzzyMatch(textLower, queryLower)) return 40

  return 0
}

/**
 * Search orders with advanced filtering
 */
export function searchOrders(
  orders: OrderWithDetails[],
  filters: SearchFilters
): OrderWithDetails[] {
  let results = [...orders]

  // Text search
  if (filters.query) {
    results = results
      .map(order => ({
        order,
        score: Math.max(
          calculateRelevance(order.customer.name, filters.query!),
          calculateRelevance(order.id, filters.query!),
          ...order.items.map(item => calculateRelevance(item.product.name, filters.query!))
        ),
      }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ order }) => order)
  }

  // Status filter
  if (filters.status) {
    results = results.filter(order => order.status === filters.status)
  }

  // Date range filter
  if (filters.startDate) {
    results = results.filter(order => new Date(order.createdAt) >= filters.startDate!)
  }
  if (filters.endDate) {
    results = results.filter(order => new Date(order.createdAt) <= filters.endDate!)
  }

  // Value range filter
  if (filters.minValue !== undefined) {
    results = results.filter(order => order.totalValue >= filters.minValue!)
  }
  if (filters.maxValue !== undefined) {
    results = results.filter(order => order.totalValue <= filters.maxValue!)
  }

  // Customer filter
  if (filters.customerId) {
    results = results.filter(order => order.customerId === filters.customerId)
  }

  return results
}

/**
 * Search products with fuzzy matching
 */
export function searchProducts(
  products: ProductWithMaterials[],
  query: string
): ProductWithMaterials[] {
  if (!query) return products

  return products
    .map(product => ({
      product,
      score: Math.max(
        calculateRelevance(product.name, query),
        ...product.materials.map(pm => calculateRelevance(pm.material.name, query))
      ),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ product }) => product)
}

/**
 * Search materials with fuzzy matching
 */
export function searchMaterials(materials: Material[], query: string): Material[] {
  if (!query) return materials

  return materials
    .map(material => ({
      material,
      score: calculateRelevance(material.name, query),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ material }) => material)
}

/**
 * Search customers with fuzzy matching
 */
export function searchCustomers(customers: Customer[], query: string): Customer[] {
  if (!query) return customers

  return customers
    .map(customer => ({
      customer,
      score: Math.max(
        calculateRelevance(customer.name, query),
        calculateRelevance(customer.phone || '', query),
        calculateRelevance(customer.email || '', query)
      ),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ customer }) => customer)
}

/**
 * Highlight matching text in search results
 */
export function highlightMatch(text: string, query: string): string {
  if (!query) return text

  const regex = new RegExp(`(${query})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

/**
 * Get search suggestions based on query
 */
export function getSearchSuggestions(query: string, allItems: string[]): string[] {
  if (!query || query.length < 2) return []

  return allItems
    .map(item => ({
      item,
      score: calculateRelevance(item, query),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(({ item }) => item)
}
