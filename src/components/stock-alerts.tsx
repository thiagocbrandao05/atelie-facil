'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Package, TrendingDown } from 'lucide-react'
import { getStockAlerts } from '@/features/inventory/actions'

interface StockAlert {
  id: string
  name: string
  currentQuantity: number
  minQuantity: number
  unit: string
  severity: 'critical' | 'high' | 'medium'
}

const SEVERITY_CONFIG = {
  critical: {
    color: 'destructive',
    icon: AlertTriangle,
    label: 'Crítico',
  },
  high: {
    color: 'destructive',
    icon: TrendingDown,
    label: 'Alto',
  },
  medium: {
    color: 'secondary',
    icon: Package,
    label: 'Médio',
  },
} as const

export function StockAlerts() {
  const [alerts, setAlerts] = useState<StockAlert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAlerts()
  }, [])

  const loadAlerts = async () => {
    try {
      const data = await getStockAlerts()
      setAlerts(data as StockAlert[])
    } catch (error) {
      console.error('Failed to load alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Alertas de Estoque</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Carregando...</p>
        </CardContent>
      </Card>
    )
  }

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Alertas de Estoque</CardTitle>
          <CardDescription>Nenhum alerta no momento</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Todos os materiais estão com estoque adequado! ✅
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="text-destructive h-5 w-5" />
          Alertas de Estoque ({alerts.length})
        </CardTitle>
        <CardDescription>Materiais com estoque baixo ou zerado</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.map(alert => {
            const config = SEVERITY_CONFIG[alert.severity]
            const Icon = config.icon

            return (
              <div
                key={alert.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <Icon className="text-destructive h-5 w-5" />
                  <div>
                    <p className="font-medium">{alert.name}</p>
                    <p className="text-muted-foreground text-sm">
                      Atual: {alert.currentQuantity} {alert.unit} | Mínimo: {alert.minQuantity}{' '}
                      {alert.unit}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={config.color as any}>{config.label}</Badge>
                  <Button size="sm" variant="outline">
                    Repor
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
