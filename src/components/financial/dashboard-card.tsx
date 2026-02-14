'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowUpCircle, ArrowDownCircle, Wallet, TrendingUp, TrendingDown } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useFinancials } from '@/features/financials/use-financials'

export function FinancialDashboardCard() {
    const { summary, isLoading, currentMonth, currentYear } = useFinancials()

    const monthName = new Date(currentYear, currentMonth - 1).toLocaleString('pt-BR', { month: 'long' })

    if (isLoading) {
        return <DashboardSkeleton />
    }

    const isPositiveBalance = summary.balance >= 0

    return (
        <Card className="overflow-hidden border-none shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Saldo em Caixa
                    </CardTitle>
                    <Wallet className="h-4 w-4 text-muted-foreground opacity-50" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                    <h2 className={`text-4xl font-extrabold tracking-tight ${isPositiveBalance ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {summary.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </h2>
                </div>
                <p className="text-xs text-muted-foreground mt-1 capitalize">
                    Resumo de {monthName} de {currentYear}
                </p>
            </CardHeader>

            <CardContent className="grid grid-cols-2 gap-4 pt-4">
                <div className="flex flex-col gap-1 rounded-xl bg-emerald-50/50 p-3 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                        <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/50 rounded-full">
                            <TrendingUp size={14} />
                        </div>
                        <span className="text-xs font-bold uppercase">Entrou</span>
                    </div>
                    <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300 mt-1">
                        {summary.income.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                </div>

                <div className="flex flex-col gap-1 rounded-xl bg-red-50/50 p-3 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50">
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                        <div className="p-1.5 bg-red-100 dark:bg-red-900/50 rounded-full">
                            <TrendingDown size={14} />
                        </div>
                        <span className="text-xs font-bold uppercase">Saiu</span>
                    </div>
                    <p className="text-lg font-bold text-red-700 dark:text-red-300 mt-1">
                        {summary.expenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}

function DashboardSkeleton() {
    return (
        <Card className="border-none shadow-md">
            <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-3 w-32 mt-1" />
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 pt-4">
                <Skeleton className="h-20 rounded-xl" />
                <Skeleton className="h-20 rounded-xl" />
            </CardContent>
        </Card>
    )
}
