'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts'
import { MonthlyFinancialSummary } from '../actions'

export function FinancialHistoryChart({ history }: { history: MonthlyFinancialSummary[] }) {
  // Format data for Recharts
  const data = history.map(item => ({
    name: item.month.split(' ')[0].substring(0, 3), // Jan, Fev...
    Receitas: item.revenue,
    Despesas: item.totalExpenses,
    Lucro: item.profit,
  }))

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Histórico Financeiro</CardTitle>
        <CardDescription>Comparativo de receitas e despesas dos últimos 6 meses.</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={value => `R$${value}`}
              />
              <Tooltip
                formatter={(value: any) => [
                  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    Number(value || 0)
                  ),
                  '',
                ]}
                cursor={{ fill: 'transparent' }}
              />
              <Legend />
              <Bar dataKey="Receitas" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
