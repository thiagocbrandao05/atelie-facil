'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getTransactions, getFinancialSummary, getCategories, TransactionInput } from './actions'
import { createTransaction, updateTransaction, deleteTransaction } from './actions'
import { toast } from 'sonner'

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
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1)
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear())

    const fetchData = useCallback(async () => {
        setIsLoading(true)
        try {
            const [txs, sum, cats] = await Promise.all([
                getTransactions(currentMonth, currentYear),
                getFinancialSummary(currentMonth, currentYear),
                getCategories()
            ])
            setTransactions(txs as Transaction[])
            setSummary(sum)
            setCategories(cats as Category[])
        } catch (error) {
            console.error(error)
            toast.error('Erro ao carregar dados financeiros.')
        } finally {
            setIsLoading(false)
        }
    }, [currentMonth, currentYear])

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
        } else {
            if (currentMonth === 1) {
                setCurrentMonth(12)
                setCurrentYear(prev => prev - 1)
            } else {
                setCurrentMonth(prev => prev - 1)
            }
        }
    }

    const addTransactionHandler = async (input: TransactionInput) => {
        try {
            await createTransaction(input)
            toast.success(input.type === 'IN' ? 'Entrada registrada! ' : 'Saída registrada.')
            await fetchData()
        } catch (error) {
            console.error(error)
            toast.error('Erro ao salvar transação.')
        }
    }

    const editTransactionHandler = async (id: string, input: Partial<TransactionInput>) => {
        try {
            await updateTransaction(id, input)
            toast.success('Transação atualizada.')
            await fetchData()
        } catch (error) {
            console.error(error)
            toast.error('Erro ao atualizar.')
        }
    }

    const removeTransactionHandler = async (id: string) => {
        try {
            await deleteTransaction(id)
            toast.success('Transação removida.')
            await fetchData()
        } catch (error) {
            console.error(error)
            toast.error('Erro ao excluir.')
        }
    }

    return (
        <FinancialContext.Provider
            value={{
                transactions,
                summary,
                categories,
                isLoading,
                currentMonth,
                currentYear,
                changeMonth,
                addTransaction: addTransactionHandler,
                editTransaction: editTransactionHandler,
                removeTransaction: removeTransactionHandler,
                refresh: fetchData
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
