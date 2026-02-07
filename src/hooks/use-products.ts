'use client'

import { useState, useEffect } from 'react'
import { ProductWithMaterials } from '@/lib/types'
import { getProducts } from '@/features/products/actions'

/**
 * Hook for managing product data with loading and error states
 */
export function useProducts() {
    const [products, setProducts] = useState<ProductWithMaterials[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchProducts = async () => {
        try {
            setLoading(true)
            setError(null)
            const data = await getProducts()
            setProducts(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao carregar produtos')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchProducts()
    }, [])

    const refresh = () => {
        fetchProducts()
    }

    const findById = (id: string) => {
        return products.find(p => p.id === id)
    }

    const findByName = (name: string) => {
        return products.filter(p =>
            p.name.toLowerCase().includes(name.toLowerCase())
        )
    }

    const filterByMaterial = (materialId: string) => {
        return products.filter(p =>
            p.materials.some(pm => pm.materialId === materialId)
        )
    }

    return {
        products,
        loading,
        error,
        refresh,
        findById,
        findByName,
        filterByMaterial
    }
}


