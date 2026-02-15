'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { calculateSuggestedPrice } from '@/lib/logic'
import { ProductWithMaterials } from '@/lib/types'
import { TrendingUp, Target, Heart, AlertTriangle } from 'lucide-react'
import { useMemo } from 'react'

interface FinancialHealthDashboardProps {
  products: ProductWithMaterials[]
  settings: any
  plan: any
}

export function FinancialHealthDashboard({
  products,
  settings,
  plan,
}: FinancialHealthDashboardProps) {
  const stats = useMemo(() => {
    if (products.length === 0) return null

    const calculations = products.map(p =>
      calculateSuggestedPrice(
        p,
        Number(settings?.hourlyRate || 20),
        settings?.monthlyFixedCosts || [],
        Number(settings?.workingHoursPerMonth || 160),
        Number(settings?.taxRate || 0),
        Number(settings?.cardFeeRate || 0)
      )
    )

    const totalMC = calculations.reduce((acc, curr) => acc + curr.contributionMarginPercentage, 0)
    const avgMC = totalMC / products.length
    const avgTicket =
      calculations.reduce(
        (acc, curr) =>
          acc +
          (products.find(p => p.id === products[calculations.indexOf(curr)].id)?.price ||
            curr.suggestedPrice),
        0
      ) / products.length

    const healthyCount = calculations.filter(
      c => c.contributionMarginPercentage >= (settings.marginThresholdOptimal || 40)
    ).length
    const warningCount = calculations.filter(
      c =>
        c.contributionMarginPercentage >= (settings.marginThresholdWarning || 20) &&
        c.contributionMarginPercentage < (settings.marginThresholdOptimal || 40)
    ).length
    const criticalCount = calculations.filter(
      c => c.contributionMarginPercentage < (settings.marginThresholdWarning || 20)
    ).length

    return {
      avgMC,
      avgTicket,
      healthyCount,
      warningCount,
      criticalCount,
      count: products.length,
    }
  }, [products, settings])

  if (!stats) return null

  const isSimple = settings.financialDisplayMode !== 'advanced'

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
      {/* 1. Overall Health Status */}
      <Card className="border-primary/10 bg-white/50 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center space-y-2 text-center">
            <div
              className={`rounded-full p-3 ${stats.avgMC >= (settings.marginThresholdOptimal || 40) ? 'bg-green-100 text-green-600' : stats.avgMC >= (settings.marginThresholdWarning || 20) ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'}`}
            >
              <Heart size={24} fill="currentColor" />
            </div>
            <div>
              <p className="text-[10px] font-black tracking-widest uppercase opacity-60">
                Saúde do Ateliê
              </p>
              <h3 className="text-xl font-black italic">
                {stats.avgMC >= (settings.marginThresholdOptimal || 40)
                  ? 'Excelente'
                  : stats.avgMC >= (settings.marginThresholdWarning || 20)
                    ? 'Regular'
                    : 'Atenção'}
              </h3>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Avg Margin / Sobra */}
      <Card className="border-primary/10 bg-white/50 backdrop-blur-sm">
        <CardContent className="pt-6">
          <p className="mb-1 text-[10px] font-black tracking-widest uppercase opacity-60">
            {isSimple ? 'Sobra Média' : 'Margem de Contribuição Média'}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-primary text-2xl font-black italic">
              {stats.avgMC.toFixed(1)}%
            </span>
            <TrendingUp size={16} className="text-primary opacity-40" />
          </div>
          <p className="text-muted-foreground mt-1 text-[10px] font-medium">
            {isSimple ? 'O que sobra p/ pagar suas contas.' : 'Rentabilidade média do catálogo.'}
          </p>
        </CardContent>
      </Card>

      {/* 3. Ticket Médio */}
      <Card className="border-primary/10 bg-white/50 backdrop-blur-sm">
        <CardContent className="pt-6">
          <p className="mb-1 text-[10px] font-black tracking-widest uppercase opacity-60">
            Valor Médio (Ticket)
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black italic">R$ {stats.avgTicket.toFixed(2)}</span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs text-[10px] font-medium">
            Valor médio das suas peças.
          </p>
        </CardContent>
      </Card>

      {/* 4. Portfolio Mix */}
      <Card className="border-primary/10 bg-white/50 backdrop-blur-sm">
        <CardContent className="pt-6">
          <p className="mb-2 text-[10px] font-black tracking-widest uppercase opacity-60">
            Mix de Produtos
          </p>
          <div className="bg-muted flex h-2 gap-1 overflow-hidden rounded-full">
            <div
              className="h-full bg-green-500"
              style={{ width: `${(stats.healthyCount / stats.count) * 100}%` }}
            />
            <div
              className="h-full bg-yellow-500"
              style={{ width: `${(stats.warningCount / stats.count) * 100}%` }}
            />
            <div
              className="h-full bg-red-500"
              style={{ width: `${(stats.criticalCount / stats.count) * 100}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between">
            <div className="flex items-center gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
              <span className="text-[9px] font-bold">{stats.healthyCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
              <span className="text-[9px] font-bold">{stats.warningCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
              <span className="text-[9px] font-bold">{stats.criticalCount}</span>
            </div>
            <span className="text-[9px] font-black uppercase opacity-40">Total: {stats.count}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
