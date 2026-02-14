'use server'

import { getCurrentUser } from '@/lib/auth'
import { getStripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { PlanType } from './types'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

// Determine Price ID based on Plan (This would ideally be in DB or ENV)
// For now, mapping statically. YOU MUST REPLACE THESE WITH REAL STRIPE PRICE IDs
const PRICE_IDS: Record<PlanType, string> = {
  start: 'price_start_placeholder',
  pro: 'price_pro_placeholder',
  premium: 'price_premium_placeholder',
  free_creative: 'free',
  free_reseller: 'free',
  paid_creative: 'price_paid_placeholder',
  paid_reseller: 'price_paid_placeholder',
  premium_creative: 'price_premium_placeholder',
  premium_reseller: 'price_premium_placeholder',
}

// In production, fetch these from DB or ENV to avoid hardcoding
// For demo, we assume they are set.

export async function createStripeCheckoutSession(params: {
  workspaceId: string
  plan: PlanType
  successUrl: string
  cancelUrl: string
}) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  // Verify workspace access (owner/admin)
  // TODO: Add stricter role check

  const priceId = process.env[`STRIPE_PRICE_${params.plan.toUpperCase()}`] || PRICE_IDS[params.plan]

  if (!priceId) {
    throw new Error(`Price ID not found for plan ${params.plan}`)
  }

  // Get or Create Stripe Customer
  const supabase = await createClient()
  const { data: subscription } = await supabase
    .from('BillingSubscriptions')
    .select('stripeCustomerId')
    .eq('workspaceId', params.workspaceId)
    .single()

  let customerId = (subscription as any)?.stripeCustomerId

  if (!customerId) {
    // Create new customer
    const stripe = getStripe()
    if (!stripe) throw new Error('Stripe not configured')

    const customer = await stripe.customers.create({
      email: user.email || undefined,
      metadata: {
        workspaceId: params.workspaceId,
      },
    })
    customerId = customer.id
  }

  const stripe = getStripe()
  if (!stripe) throw new Error('Stripe not configured')

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      workspaceId: params.workspaceId,
      plan: params.plan,
    },
    client_reference_id: params.workspaceId,
  })

  if (!session.url) {
    throw new Error('Failed to create checkout session')
  }

  return { url: session.url }
}

export async function createStripePortalSession(workspaceId: string, returnUrl: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  const supabase = await createClient()
  const { data: subscription } = await supabase
    .from('BillingSubscriptions')
    .select('stripeCustomerId')
    .eq('workspaceId', workspaceId)
    .single()

  if (!(subscription as any)?.stripeCustomerId) {
    throw new Error('No billing account found')
  }

  const stripe = getStripe()
  if (!stripe) throw new Error('Stripe not configured')

  const session = await stripe.billingPortal.sessions.create({
    customer: (subscription as any).stripeCustomerId,
    return_url: returnUrl,
  })

  return { url: session.url }
}

export async function getSubscriptionDetails(workspaceId: string) {
  const supabase = await createClient()

  // Get Plan
  const { data: planData } = await supabase
    .from('WorkspacePlans')
    .select('plan')
    .eq('workspaceId', workspaceId)
    .single()

  const currentPlan: PlanType = (planData as any)?.plan || 'start'

  // Get Limit Usage (reuse logic from limits.ts or just get summary)
  // We'll let the UI call getWhatsAppUsageSummary separately

  return {
    plan: currentPlan,
  }
}

/**
 * Obtém o plano do tenant atual do usuário autenticado
 */
export async function getCurrentTenantPlan() {
  const user = await getCurrentUser()
  if (!user?.tenantId) {
    return { plan: 'free_creative' as PlanType, profile: 'CREATIVE' }
  }

  const supabase = await createClient()
  const { data } = await supabase
    .from('Tenant')
    .select('plan, profile')
    .eq('id', user.tenantId)
    .single()

  const tenant = data as any

  return {
    plan: (tenant?.plan as PlanType) || 'free_creative',
    profile: (tenant?.profile as string) || 'CREATIVE',
  }
}
