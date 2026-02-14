export type PlanType =
  | 'start'
  | 'pro'
  | 'premium'
  | 'free_creative'
  | 'free_reseller'
  | 'paid_creative'
  | 'paid_reseller'
  | 'premium_creative'
  | 'premium_reseller'

export type TenantProfile = 'CREATIVE' | 'RESELLER' | 'HYBRID'

export type FeatureId =
  | 'FINANCIAL'
  | 'AI_INSIGHTS'
  | 'WHATSAPP_AUTO'
  | 'REPORTS_ADVANCED'
  | 'INVENTORY_FINISHED'

export type SubscriptionStatus =
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'trialing'
  | 'incomplete'
  | 'incomplete_expired'
  | 'unpaid'
  | 'paused'

export interface WhatsAppLimits {
  plan: PlanType
  monthlyTransactional: number
  transactionalMinimum: number | null
  monthlyCampaign: number
  dailyCampaign: number
  maxRecipientsPerCampaign: number
  maxTestDaily: number
}

export interface WorkspacePlan {
  id: string
  workspaceId: string
  plan: PlanType
  profile: TenantProfile
  changedAt: Date
}

export interface UsageSummary {
  daily: {
    transactional: number
    campaign: number
    test: number
  }
  monthly: {
    transactional: number
    campaign: number
    test: number
  }
  limits: WhatsAppLimits
}
