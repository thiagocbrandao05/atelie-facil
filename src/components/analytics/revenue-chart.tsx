'use client'

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type RevenueDataPoint = {
  name: string
  value: number
}

export function RevenueChart({ data }: { data: RevenueDataPoint[] }) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Receita Mensal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground flex h-[200px] items-center justify-center">
            Sem dados suficientes
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Receita Mensal</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={value => `R$${value}`}
              />
              <Tooltip
                cursor={{ fill: 'transparent' }}
                contentStyle={{ borderRadius: '8px' }}
                formatter={value => [`R$ ${Number(value).toFixed(2)}`, 'Receita']}
              />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
