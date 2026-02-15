'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useFinancials } from '@/features/financials/use-financials'

export function FinancialDashboardCard() {
  const { summary, isLoading, currentMonth, currentYear } = useFinancials()

  const monthName = new Date(currentYear, currentMonth - 1).toLocaleString('pt-BR', {
    month: 'long',
  })

  if (isLoading) {
    return <DashboardSkeleton />
  }

  const isPositiveBalance = summary.balance >= 0

  return (
    <Card className="overflow-hidden border-none bg-gradient-to-br from-white to-gray-50 shadow-lg dark:from-gray-900 dark:to-gray-950">
      <CardHeader className="px-4 pb-2 sm:px-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-muted-foreground text-sm font-medium tracking-wider uppercase">
            Saldo em caixa
          </CardTitle>
          <Wallet className="text-muted-foreground h-4 w-4 opacity-50" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <h2
            className={`text-3xl font-extrabold tracking-tight sm:text-4xl ${
              isPositiveBalance
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {summary.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </h2>
        </div>
        <p className="text-muted-foreground mt-1 text-xs capitalize">
          Resumo de {monthName} de {currentYear}
        </p>
      </CardHeader>

      <CardContent className="grid grid-cols-1 gap-3 px-4 pt-4 sm:grid-cols-2 sm:gap-4 sm:px-6">
        <div className="flex flex-col gap-1 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 dark:border-emerald-900/50 dark:bg-emerald-950/20">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <div className="rounded-full bg-emerald-100 p-1.5 dark:bg-emerald-900/50">
              <TrendingUp size={14} />
            </div>
            <span className="text-xs font-bold uppercase">Entrou</span>
          </div>
          <p className="mt-1 text-lg font-bold text-emerald-700 dark:text-emerald-300">
            {summary.income.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>

        <div className="flex flex-col gap-1 rounded-xl border border-red-100 bg-red-50/50 p-3 dark:border-red-900/50 dark:bg-red-950/20">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <div className="rounded-full bg-red-100 p-1.5 dark:bg-red-900/50">
              <TrendingDown size={14} />
            </div>
            <span className="text-xs font-bold uppercase">Saiu</span>
          </div>
          <p className="mt-1 text-lg font-bold text-red-700 dark:text-red-300">
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
        <Skeleton className="mb-2 h-4 w-24" />
        <Skeleton className="h-10 w-48" />
        <Skeleton className="mt-1 h-3 w-32" />
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-3 pt-4 sm:grid-cols-2 sm:gap-4">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </CardContent>
    </Card>
  )
}
