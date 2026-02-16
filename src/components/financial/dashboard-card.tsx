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
    <Card className="border-border/70 bg-card/95 overflow-hidden shadow-sm">
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
              isPositiveBalance ? 'text-success' : 'text-danger'
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
        <div className="border-success/25 bg-success/10 flex flex-col gap-1 rounded-xl border p-3">
          <div className="text-success flex items-center gap-2">
            <div className="bg-success/20 rounded-full p-1.5">
              <TrendingUp size={14} />
            </div>
            <span className="text-xs font-bold uppercase">Entrou</span>
          </div>
          <p className="text-success mt-1 text-lg font-bold">
            {summary.income.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>

        <div className="border-danger/25 bg-danger/10 flex flex-col gap-1 rounded-xl border p-3">
          <div className="text-danger flex items-center gap-2">
            <div className="bg-danger/20 rounded-full p-1.5">
              <TrendingDown size={14} />
            </div>
            <span className="text-xs font-bold uppercase">Saiu</span>
          </div>
          <p className="text-danger mt-1 text-lg font-bold">
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
