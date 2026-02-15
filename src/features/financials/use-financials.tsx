'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { getTransactions, getFinancialSummary, getCategories, TransactionInput } from './actions'
import { createTransaction, updateTransaction, deleteTransaction } from './actions'
import { toast } from 'sonner'

export type { TransactionInput } from './actions'

export type Transaction = {
  id: string
  description: string
  amount: number
  type: 'IN' | 'OUT'
  date: string
  category_id: string | null
  payment_method: string
  status: 'paid' | 'pending' | 'cancelled'
  category?: {
    name: string
    icon: string | null
    color: string | null
  }
}

export type Category = {
  id: string
  name: string
  type: 'IN' | 'OUT'
  icon: string | null
  color: string | null
}

export type FinancialSummary = {
  income: number
  expenses: number
  balance: number
}

interface FinancialContextType {
  transactions: Transaction[]
  summary: FinancialSummary
  categories: Category[]
  isLoading: boolean
  error: string | null
  currentMonth: number
  currentYear: number
  changeMonth: (direction: 'next' | 'prev') => void
  addTransaction: (input: TransactionInput) => Promise<void>
  editTransaction: (id: string, input: Partial<TransactionInput>) => Promise<void>
  removeTransaction: (id: string) => Promise<void>
  refresh: () => Promise<void>
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined)

export function FinancialProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [summary, setSummary] = useState<FinancialSummary>({ income: 0, expenses: 0, balance: 0 })
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1)
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const requestIdRef = useRef(0)
  const categoriesLoadedRef = useRef(false)

  const fetchCategoriesOnce = useCallback(async () => {
    if (categoriesLoadedRef.current) return
    const cats = await getCategories()
    setCategories(cats as Category[])
    categoriesLoadedRef.current = true
  }, [])

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const requestId = ++requestIdRef.current

    try {
      const [txs, sum] = await Promise.all([
        getTransactions(currentMonth, currentYear),
        getFinancialSummary(currentMonth, currentYear),
      ])

      await fetchCategoriesOnce()

      // Prevent stale response overriding newer month/year request.
      if (requestId !== requestIdRef.current) return

      setTransactions(txs as Transaction[])
      setSummary(sum)
    } catch (err) {
      if (requestId !== requestIdRef.current) return
      console.error(err)
      setError('Não foi possível carregar o financeiro. Tente novamente.')
      toast.error('Erro ao carregar dados financeiros.')
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false)
      }
    }
  }, [currentMonth, currentYear, fetchCategoriesOnce])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const changeMonth = (direction: 'next' | 'prev') => {
    if (direction === 'next') {
      if (currentMonth === 12) {
        setCurrentMonth(1)
        setCurrentYear(prev => prev + 1)
      } else {
        setCurrentMonth(prev => prev + 1)
      }
      return
    }

    if (currentMonth === 1) {
      setCurrentMonth(12)
      setCurrentYear(prev => prev - 1)
    } else {
      setCurrentMonth(prev => prev - 1)
    }
  }

  const addTransactionHandler = async (input: TransactionInput) => {
    try {
      await createTransaction(input)
      toast.success(input.type === 'IN' ? 'Entrada registrada.' : 'Saída registrada.')
      await fetchData()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao salvar lançamento.')
    }
  }

  const editTransactionHandler = async (id: string, input: Partial<TransactionInput>) => {
    try {
      await updateTransaction(id, input)
      toast.success('Lançamento atualizado.')
      await fetchData()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao atualizar lançamento.')
    }
  }

  const removeTransactionHandler = async (id: string) => {
    try {
      await deleteTransaction(id)
      toast.success('Lançamento removido.')
      await fetchData()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao excluir lançamento.')
    }
  }

  return (
    <FinancialContext.Provider
      value={{
        transactions,
        summary,
        categories,
        isLoading,
        error,
        currentMonth,
        currentYear,
        changeMonth,
        addTransaction: addTransactionHandler,
        editTransaction: editTransactionHandler,
        removeTransaction: removeTransactionHandler,
        refresh: fetchData,
      }}
    >
      {children}
    </FinancialContext.Provider>
  )
}

export function useFinancials() {
  const context = useContext(FinancialContext)
  if (context === undefined) {
    throw new Error('useFinancials must be used within a FinancialProvider')
  }
  return context
}
