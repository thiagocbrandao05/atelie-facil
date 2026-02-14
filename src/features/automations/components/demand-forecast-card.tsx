'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { ProductDemand } from '../actions/demand-forecast'
import { Badge } from '@/components/ui/badge'

export function DemandForecastCard({ data }: { data: ProductDemand[] }) {
  if (!data.length)
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg">Previsão de Demanda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground text-sm">
            Sem dados suficientes para gerar previsões.
          </div>
        </CardContent>
      </Card>
    )

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Previsão de Demanda (Próx. Mês)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.slice(0, 5).map(item => (
          <div
            key={item.productId}
            className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0"
          >
            <div className="flex flex-col">
              <span className="text-sm font-medium">{item.productName}</span>
              <span className="text-muted-foreground flex items-center gap-1 text-xs">
                Tendência:
                {item.trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                {item.trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
                {item.trend === 'stable' && <Minus className="h-3 w-3 text-gray-500" />}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-lg font-bold">{item.forecast} un</span>
              <Badge variant="outline" className="h-5 text-[10px]">
                {Math.round(item.confidence * 100)}% confiança
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
