import { createClient } from '@/lib/supabase/server'
import { WhatsAppLimits, UsageSummary, PlanType } from '../subscription/types'
import { FALLBACK_LIMITS } from '../subscription/constants'

class WhatsAppLimitError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'WhatsAppLimitError'
  }
}

type WhatsAppLimitType = 'transactional' | 'campaign' | 'test'
type UsageRow = { type: string; count: number }

export async function getWhatsAppUsageSummary(tenantId: string): Promise<UsageSummary> {
  const supabase = await createClient()
  const db = supabase as any

  const { data: workspacePlan } = await db
    .from('WorkspacePlans')
    .select('plan')
    .eq('workspaceId', tenantId)
    .single()

  const currentPlan: PlanType = workspacePlan?.plan || 'start'

  const { data: dbLimits } = await db
    .from('WhatsAppLimits')
    .select('*')
    .eq('plan', currentPlan)
    .single()

  const limits: WhatsAppLimits = dbLimits || FALLBACK_LIMITS[currentPlan]

  const today = new Date().toISOString().split('T')[0]
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split('T')[0]

  const { data: dailyUsage } = await db
    .from('WhatsAppUsageDaily')
    .select('type, count')
    .eq('tenantId', tenantId)
    .eq('date', today)

  const { data: monthlyUsage } = await db
    .from('WhatsAppUsageDaily')
    .select('type, count')
    .eq('tenantId', tenantId)
    .gte('date', firstDayOfMonth)

  const summary: UsageSummary = {
    daily: { transactional: 0, campaign: 0, test: 0 },
    monthly: { transactional: 0, campaign: 0, test: 0 },
    limits,
  }

  ;(dailyUsage as UsageRow[] | null)?.forEach(row => {
    if (row.type in summary.daily) {
      summary.daily[row.type as WhatsAppLimitType] += row.count
    }
  })
  ;(monthlyUsage as UsageRow[] | null)?.forEach(row => {
    if (row.type in summary.monthly) {
      summary.monthly[row.type as WhatsAppLimitType] += row.count
    }
  })

  return summary
}

export async function ensureCanSendTestMessage(tenantId: string) {
  const summary = await getWhatsAppUsageSummary(tenantId)

  if (summary.daily.test >= summary.limits.maxTestDaily) {
    throw new WhatsAppLimitError(
      `Limite diário de testes atingido (${summary.daily.test}/${summary.limits.maxTestDaily}).`
    )
  }
}

export async function ensureCanSendCampaign(tenantId: string, recipientsCount: number) {
  const summary = await getWhatsAppUsageSummary(tenantId)

  if (recipientsCount > summary.limits.maxRecipientsPerCampaign) {
    throw new WhatsAppLimitError(
      `Esta campanha excede o limite de ${summary.limits.maxRecipientsPerCampaign} destinatários por envio do seu plano ${summary.limits.plan.toUpperCase()}.`
    )
  }

  if (summary.daily.campaign + recipientsCount > summary.limits.dailyCampaign) {
    throw new WhatsAppLimitError(
      `Envio excede o limite diário de campanhas. Restante hoje: ${summary.limits.dailyCampaign - summary.daily.campaign}.`
    )
  }

  if (summary.monthly.campaign + recipientsCount > summary.limits.monthlyCampaign) {
    throw new WhatsAppLimitError(
      `Envio excede o limite mensal de campanhas. Restante este mês: ${summary.limits.monthlyCampaign - summary.monthly.campaign}.`
    )
  }
}

export async function incrementWhatsAppUsage(
  tenantId: string,
  type: WhatsAppLimitType,
  count: number = 1
) {
  const supabase = await createClient()
  const db = supabase as any
  const today = new Date().toISOString().split('T')[0]

  const { error } = await db.rpc('increment_whatsapp_usage', {
    p_tenant_id: tenantId,
    p_date: today,
    p_type: type,
    p_count: count,
  })

  if (error) {
    console.error('Error incrementing usage:', error)
  }
}
