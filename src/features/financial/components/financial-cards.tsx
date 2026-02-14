'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { MonthlyFinancialSummary } from '../actions'

export function FinancialCards({ summary }: { summary: MonthlyFinancialSummary }) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  const formatPercent = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 1 }).format(
      value / 100
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
          <DollarSign className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.revenue)}</div>
          <p className="text-muted-foreground text-xs">Pedidos finalizados no mês</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Despesas Totais</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(summary.totalExpenses)}
          </div>
          <p className="text-muted-foreground text-xs">Fixas + Variáveis (Compras)</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
          <TrendingUp
            className={`h-4 w-4 ${summary.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}
          />
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${summary.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}
          >
            {formatCurrency(summary.profit)}
          </div>
          <p className="text-muted-foreground text-xs">Receita - Despesas</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Margem de Lucro</CardTitle>
          <TrendingUp className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatPercent(summary.margin)}</div>
          <p className="text-muted-foreground text-xs">Sobre a receita total</p>
        </CardContent>
      </Card>
    </div>
  )
}
