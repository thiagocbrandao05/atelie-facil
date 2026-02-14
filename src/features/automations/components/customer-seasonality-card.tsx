'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, UserCheck } from 'lucide-react'
import { CustomerSeasonalPattern } from '../actions/customer-seasonality'
import { Button } from '@/components/ui/button'

export function CustomerSeasonalityCard({ data }: { data: CustomerSeasonalPattern[] }) {
  if (!data.length)
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg">Sazonalidade de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground text-sm">
            Sem dados suficientes para identificar padrões.
          </div>
        </CardContent>
      </Card>
    )

  const MONTH_NAMES = [
    'Jan',
    'Fev',
    'Mar',
    'Abr',
    'Mai',
    'Jun',
    'Jul',
    'Ago',
    'Set',
    'Out',
    'Nov',
    'Dez',
  ]

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Clientes Sazonais</CardTitle>
        <CardDescription>Clientes com padrões de compra recorrentes.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.slice(0, 4).map(customer => (
          <div
            key={customer.customerId}
            className="bg-secondary/10 flex flex-col gap-2 rounded-lg border p-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-medium">
                <UserCheck className="text-primary h-4 w-4" />
                {customer.customerName}
              </div>
              <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs">
                {customer.frequencyLabel}
              </span>
            </div>
            <div className="text-muted-foreground flex items-center gap-2 text-xs">
              <Calendar className="h-3 w-3" />
              Meses prováveis:
              <span className="text-foreground font-semibold">
                {customer.likelyMonths.map(m => MONTH_NAMES[m - 1]).join(', ')}
              </span>
            </div>
            <Button variant="outline" size="sm" className="mt-1 h-7 w-full text-xs">
              Criar Campanha
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
