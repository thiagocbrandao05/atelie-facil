'use client'

import { useCallback, useState } from 'react'

type ItemWithId = { id: string }

export function useEntryItems<T extends ItemWithId>(createEmptyItem: (id: string) => T) {
  const [items, setItems] = useState<T[]>([createEmptyItem('1')])

  const addItem = useCallback(() => {
    setItems(prev => [...prev, createEmptyItem(crypto.randomUUID())])
  }, [createEmptyItem])

  const removeItem = useCallback((id: string) => {
    setItems(prev => (prev.length > 1 ? prev.filter(item => item.id !== id) : prev))
  }, [])

  const updateItem = useCallback(<K extends keyof T>(id: string, field: K, value: T[K]) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id !== id) return item
        return { ...item, [field]: value }
      })
    )
  }, [])

  const resetItems = useCallback(() => {
    setItems([createEmptyItem('1')])
  }, [createEmptyItem])

  return {
    items,
    setItems,
    addItem,
    removeItem,
    updateItem,
    resetItems,
  }
}
