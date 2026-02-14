'use client'

import { useState, useEffect, useCallback } from 'react'
import { getFinancialHistory, getFinancialPreferences, updateFinancialPreferences } from './actions'
import { toast } from 'sonner'

export type FinancialHistoryItem = {
    month: string
    year: string
    fullDate: string
    income: number
    expenses: number
}

export type FinancialPreferences = {
    id: string
    monthly_revenue_goal: number | null
    min_daily_balance: number | null
}

export function useFinancialInsights() {
    const [history, setHistory] = useState<FinancialHistoryItem[]>([])
    const [preferences, setPreferences] = useState<FinancialPreferences | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    const fetchData = useCallback(async () => {
        setIsLoading(true)
        try {
            const [hist, prefs] = await Promise.all([
                getFinancialHistory(6), // Last 6 months by default
                getFinancialPreferences()
            ])
            setHistory(hist)
            setPreferences(prefs as FinancialPreferences)
        } catch (error) {
            console.error(error)
            toast.error('Erro ao carregar insights financeiros.')
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const updateGoal = async (goal: number) => {
        try {
            await updateFinancialPreferences({ monthly_revenue_goal: goal })
            toast.success('Meta atualizada! 🚀')
            // Optimistic update
            setPreferences(prev => prev ? { ...prev, monthly_revenue_goal: goal } : null)
        } catch (error) {
            console.error(error)
            toast.error('Erro ao salvar meta.')
        }
    }

    return {
        history,
        preferences,
        isLoading,
        updateGoal,
        refresh: fetchData
    }
}
