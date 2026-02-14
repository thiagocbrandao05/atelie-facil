'use client'

import { useState, useEffect } from 'react'
import { Material } from '@/lib/types'
import { getMaterials } from '@/features/materials/actions'

/**
 * Hook for managing material data with loading and error states
 */
export function useMaterials() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMaterials = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getMaterials()
      setMaterials(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar materiais')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMaterials()
  }, [])

  const refresh = () => {
    fetchMaterials()
  }

  const findById = (id: string) => {
    return materials.find(m => m.id === id)
  }

  const findByName = (name: string) => {
    return materials.filter(m => m.name.toLowerCase().includes(name.toLowerCase()))
  }

  const getLowStock = () => {
    return materials.filter(m => m.minQuantity !== null && m.quantity <= m.minQuantity)
  }

  const filterByUnit = (unit: string) => {
    return materials.filter(m => m.unit === unit)
  }

  return {
    materials,
    loading,
    error,
    refresh,
    findById,
    findByName,
    getLowStock,
    filterByUnit,
  }
}
