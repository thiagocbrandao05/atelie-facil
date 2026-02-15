'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Package, TrendingDown } from 'lucide-react'
import { getProductStockAlerts } from '@/features/inventory-finished/actions'
import type { ComponentProps } from 'react'

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

type BadgeVariant = ComponentProps<typeof Badge>['variant']

export function ProductStockAlerts() {
  const [alerts, setAlerts] = useState<StockAlert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAlerts()
  }, [])

  const loadAlerts = async () => {
    try {
      const data = await getProductStockAlerts()
      setAlerts(data as StockAlert[])
    } catch (error) {
      console.error('Failed to load product alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="border-white/40 bg-white/90 backdrop-blur-2xl">
        <CardHeader>
          <CardTitle className="text-sm font-bold tracking-widest uppercase opacity-40">
            Monitoramento
          </CardTitle>
          <p className="text-xl font-black">Alertas de Pronta-Entrega</p>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm font-medium italic">Carregando...</p>
        </CardContent>
      </Card>
    )
  }

  if (alerts.length === 0) {
    return (
      <Card className="border-white/40 bg-white/90 backdrop-blur-2xl">
        <CardHeader>
          <CardTitle className="text-[10px] font-black tracking-[0.3em] uppercase opacity-40">
            Monitoramento
          </CardTitle>
          <p className="text-xl font-black">Alertas de Pronta-Entrega</p>
          <CardDescription className="font-medium italic">Nenhum alerta no momento</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm font-medium italic">
            Seu estoque de produtos acabados está em dia! ✅
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full border-white/40 bg-white/90 shadow-md backdrop-blur-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-bold tracking-widest uppercase opacity-40">
          <AlertTriangle className="text-destructive h-4 w-4" />
          Alertas Ativos ({alerts.length})
        </CardTitle>
        <p className="text-xl font-black">Produtos com Baixo Estoque</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.map(alert => {
            const config = SEVERITY_CONFIG[alert.severity]
            const Icon = config.icon

            return (
              <div
                key={alert.id}
                className="border-border/50 bg-background/50 hover:bg-background/80 flex items-center justify-between rounded-xl border p-3 shadow-sm transition-all"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`rounded-lg p-2 bg-${config.color === 'destructive' ? 'red-50' : 'slate-50'}`}
                  >
                    <Icon
                      className={`${config.color === 'destructive' ? 'text-red-500' : 'text-slate-500'} h-5 w-5`}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-black">{alert.name}</p>
                    <p className="text-muted-foreground text-[10px] font-bold tracking-tighter uppercase">
                      Atual: <span className="text-foreground">{alert.currentQuantity}</span> |
                      Mínimo: <span className="text-foreground">{alert.minQuantity}</span>
                    </p>
                  </div>
                </div>
                <div>
                  <Badge
                    variant={config.color as BadgeVariant}
                    className="h-5 px-1.5 text-[8px] font-black tracking-widest uppercase"
                  >
                    {config.label}
                  </Badge>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
