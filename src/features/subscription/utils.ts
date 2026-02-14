import { PlanType, TenantProfile, FeatureId } from './types'

/**
 * Determina se o plano tem acesso à API WhatsApp automatizada (Premium)
 */
export function hasWhatsAppAPI(plan: PlanType): boolean {
    return plan === 'premium' || plan === 'premium_creative' || plan === 'premium_reseller'
}

/**
 * Determina se o plano tem acesso a notificações manuais via botão (Free e Paid)
 * No Premium, o botão manual é removido em favor da automação oficial.
 */
export function hasWhatsAppManualNotify(plan: PlanType): boolean {
    const manualPlans: PlanType[] = [
        'start',
        'pro',
        'free_creative',
        'free_reseller',
        'paid_creative',
        'paid_reseller',
    ]
    return manualPlans.includes(plan)
}

/**
 * Verifica o perfil do usuário
 */
export function isReseller(plan: PlanType): boolean {
    return plan.includes('reseller')
}

export function isCreative(plan: PlanType): boolean {
    return plan.includes('creative') || plan === 'start' || plan === 'pro' || plan === 'premium'
}

/**
 * Verifica se um plano possui uma feature específica (Módulos)
 */
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
        premium_reseller: ['FINANCIAL', 'REPORTS_ADVANCED', 'AI_INSIGHTS', 'WHATSAPP_AUTO', 'INVENTORY_FINISHED'],
    }

    return featureMap[plan]?.includes(feature) ?? false
}

/**
 * Retorna o plano mais alto entre dois planos
 */
export function getHigherPlan(plan1: PlanType, plan2: PlanType): PlanType {
    const planHierarchy: Record<PlanType, number> = {
        free_creative: 1,
        free_reseller: 1,
        start: 2,
        paid_creative: 3,
        paid_reseller: 3,
        pro: 4,
        premium_creative: 5,
        premium_reseller: 5,
        premium: 6,
    }

    return planHierarchy[plan1] > planHierarchy[plan2] ? plan1 : plan2
}
export function isFreePlan(plan: PlanType): boolean {
    return plan === 'free_creative' || plan === 'free_reseller'
}
