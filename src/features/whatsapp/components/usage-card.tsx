import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { BarChart3, AlertTriangle, CheckCircle, Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { UsageSummary } from '@/features/subscription/types'

const getPercentage = (used: number, limit: number) => {
  if (limit === 0) return 0 // Should not happen for limits, but for division safety
  return Math.min(100, Math.round((used / limit) * 100))
}

const UsageRow = ({
  label,
  used,
  limit,
  period,
  isUnlimited = false,
}: {
  label: string
  used: number
  limit: number | null
  period: string
  isUnlimited?: boolean
}) => {
  if (limit === null && !isUnlimited) return null // Should not happen based on types but for safety

  const effectiveLimit = limit ?? 0
  const percentage = isUnlimited ? 0 : getPercentage(used, effectiveLimit)
  const isCritical = !isUnlimited && percentage >= 90
  const isWarning = !isUnlimited && percentage >= 75

  return (
    <div className="mb-4 space-y-1 last:mb-0">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground font-medium">
          {label} ({period})
        </span>
        <span
          className={`font-bold ${isCritical ? 'text-destructive' : isWarning ? 'text-warning' : ''}`}
        >
          {used} / {isUnlimited ? 'Ilimitado' : effectiveLimit}
        </span>
      </div>
      {!isUnlimited && (
        <Progress
          value={percentage}
          className={`h-2 ${isCritical ? 'bg-destructive/20' : ''}`}
          indicatorClassName={isCritical ? 'bg-destructive' : isWarning ? 'bg-warning' : ''}
        />
      )}
    </div>
  )
}

export function WhatsAppUsageCard({
  summary,
  workspaceSlug,
}: {
  summary: UsageSummary | null
  workspaceSlug: string
}) {
  if (!summary) return null



  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="text-primary h-4 w-4" />
            Consumo - Plano {summary.limits.plan.toUpperCase()}
          </CardTitle>
          {summary.limits.plan === 'premium' && <Crown className="text-warning h-4 w-4" />}
        </div>
        <CardDescription>Acompanhe seus limites de envio.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-6">
        <div>
          <h4 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
            Mensal
          </h4>
          <UsageRow
            label="Notificações Transacionais"
            used={summary.monthly.transactional}
            limit={summary.limits.monthlyTransactional}
            period="Mês"
          />
          <UsageRow
            label="Campanhas de Marketing"
            used={summary.monthly.campaign}
            limit={summary.limits.monthlyCampaign}
            period="Mês"
          />
        </div>

        <div className="border-t pt-4">
          <h4 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
            Diário
          </h4>
          <UsageRow
            label="Campanhas (Hoje)"
            used={summary.daily.campaign}
            limit={summary.limits.dailyCampaign}
            period="Dia"
          />
          <UsageRow
            label="Testes / Validações"
            used={summary.daily.test}
            limit={summary.limits.maxTestDaily}
            period="Dia"
          />
        </div>

        <div className="text-muted-foreground flex flex-col gap-2 border-t pt-4 text-xs">
          <div className="flex justify-between">
            <span>Limite destin./campanha:</span>
            <strong>{summary.limits.maxRecipientsPerCampaign}</strong>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Button variant="outline" className="w-full text-xs" asChild>
          <Link href={`/${workspaceSlug}/app/upgrade`}>
            {summary.limits.plan === 'premium' ? 'Gerenciar Assinatura' : 'Fazer Upgrade de Plano'}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
