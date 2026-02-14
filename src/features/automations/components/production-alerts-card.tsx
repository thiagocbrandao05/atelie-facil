'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, AlertTriangle } from 'lucide-react'
import { ProductionAlert } from '../actions/production-alerts'

export function ProductionAlertsCard({ data }: { data: ProductionAlert[] }) {
  if (!data.length) return null

  const lateOrRisky = data.filter(d => ['late', 'high', 'medium'].includes(d.riskLevel))

  if (!lateOrRisky.length)
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg">Alertas de Produção</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground text-sm">
            Nenhum pedido com risco de atraso detectado.
          </div>
        </CardContent>
      </Card>
    )

  return (
    <Card className="h-full border-l-4 border-l-orange-500">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg">
          Alertas de Produção
          <Badge variant="destructive">{lateOrRisky.length} riscos</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-2">
        {lateOrRisky.slice(0, 5).map(alert => (
          <div
            key={alert.orderId}
            className="flex items-start justify-between border-b pb-3 last:border-0"
          >
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold">{alert.customerName}</span>
              <span className="text-muted-foreground text-xs">{alert.productName}</span>
              <div className="mt-1 flex items-center gap-2">
                <Badge
                  variant={alert.riskLevel === 'late' ? 'destructive' : 'outline'}
                  className="text-[10px]"
                >
                  {alert.riskLevel === 'late'
                    ? 'ATRASADO'
                    : alert.riskLevel === 'high'
                      ? 'RISCO ALTO'
                      : 'RISCO MÉDIO'}
                </Badge>
                <span
                  className={`text-xs ${alert.daysUntilDue < 3 ? 'font-bold text-red-600' : 'text-muted-foreground'}`}
                >
                  Prazo: {alert.dueDate.toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
            {alert.riskLevel === 'late' ? (
              <AlertTriangle className="h-5 w-5 text-red-500" />
            ) : (
              <Clock className="h-5 w-5 text-orange-500" />
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
