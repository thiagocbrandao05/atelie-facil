'use client'

import { useState, useEffect } from 'react'
import { OrderWithDetails, OrderStatus } from '@/lib/types'
import { getOrders } from '@/features/orders/actions'

/**
 * Hook for managing order data with loading and error states
 */
export function useOrders() {
  const [orders, setOrders] = useState<OrderWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getOrders()
      setOrders(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar pedidos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const refresh = () => {
    fetchOrders()
  }

  const findById = (id: string) => {
    return orders.find(o => o.id === id)
  }

  const filterByStatus = (status: OrderStatus) => {
    return orders.filter(o => o.status === status)
  }

  const filterByCustomer = (customerId: string) => {
    return orders.filter(o => o.customerId === customerId)
  }

  const filterByDateRange = (startDate: Date, endDate: Date) => {
    return orders.filter(o => {
      const dueDate = new Date(o.dueDate)
      return dueDate >= startDate && dueDate <= endDate
    })
  }

  const getActiveOrders = () => {
    return orders.filter(o => o.status !== 'DELIVERED' && o.status !== 'QUOTATION')
  }

  const getOverdueOrders = () => {
    const now = new Date()
    return orders.filter(o => new Date(o.dueDate) < now && o.status !== 'DELIVERED')
  }

  const getTotalValue = () => {
    return orders.reduce((sum, o) => sum + o.totalValue, 0)
  }

  return {
    orders,
    loading,
    error,
    refresh,
    findById,
    filterByStatus,
    filterByCustomer,
    filterByDateRange,
    getActiveOrders,
    getOverdueOrders,
    getTotalValue,
  }
}
