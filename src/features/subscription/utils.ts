import { PlanType, FeatureId } from './types'

export function hasWhatsAppAPI(plan: PlanType): boolean {
  return plan === 'premium' || plan === 'premium_creative' || plan === 'premium_reseller'
}

export function isReseller(plan: PlanType): boolean {
  return plan.includes('reseller')
}

export function hasFeature(plan: PlanType, feature: FeatureId): boolean {
  const featureMap: Record<PlanType, FeatureId[]> = {
    start: ['FINANCIAL'],
    pro: ['FINANCIAL', 'REPORTS_ADVANCED'],
    premium: ['FINANCIAL', 'REPORTS_ADVANCED', 'AI_INSIGHTS', 'WHATSAPP_AUTO'],
    free_creative: [],
    free_reseller: ['INVENTORY_FINISHED'],
    paid_creative: ['FINANCIAL', 'REPORTS_ADVANCED'],
    paid_reseller: ['FINANCIAL', 'REPORTS_ADVANCED', 'INVENTORY_FINISHED'],
    premium_creative: ['FINANCIAL', 'REPORTS_ADVANCED', 'AI_INSIGHTS', 'WHATSAPP_AUTO'],
    premium_reseller: [
      'FINANCIAL',
      'REPORTS_ADVANCED',
      'AI_INSIGHTS',
      'WHATSAPP_AUTO',
      'INVENTORY_FINISHED',
    ],
  }

  return featureMap[plan]?.includes(feature) ?? false
}

export function isFreePlan(plan: PlanType): boolean {
  return plan === 'free_creative' || plan === 'free_reseller'
}
