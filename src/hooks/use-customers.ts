'use client'

import { useState, useEffect } from 'react'
import { Customer } from '@/lib/types'
import { getCustomers } from '@/features/customers/actions'

/**
 * Hook for managing customer data with loading and error states
 */
export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getCustomers()
      setCustomers(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar clientes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  const refresh = () => {
    fetchCustomers()
  }

  const findById = (id: string) => {
    return customers.find(c => c.id === id)
  }

  const findByName = (name: string) => {
    return customers.filter(c => c.name.toLowerCase().includes(name.toLowerCase()))
  }

  return {
    customers,
    loading,
    error,
    refresh,
    findById,
    findByName,
  }
}
