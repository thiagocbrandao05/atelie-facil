'use server'

import { getCurrentUser } from '@/lib/auth'
import { getStripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { PlanType } from './types'

type BillingSubscriptionRow = {
  stripeCustomerId?: string | null
}

type TenantPlanRow = {
  plan?: PlanType | null
  profile?: string | null
}

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

function assertWorkspaceAccess(params: {
  workspaceId: string
  userTenantId?: string | null
  role?: string | null
}) {
  const isOwner = params.userTenantId === params.workspaceId
  const isSuperAdmin = params.role === 'SUPER_ADMIN'

  if (!isOwner && !isSuperAdmin) {
    throw new Error('Unauthorized workspace access')
  }
}

export async function createStripeCheckoutSession(params: {
  workspaceId: string
  plan: PlanType
  successUrl: string
  cancelUrl: string
}) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  assertWorkspaceAccess({
    workspaceId: params.workspaceId,
    userTenantId: user.tenantId,
    role: user.role,
  })

  const priceId = process.env[`STRIPE_PRICE_${params.plan.toUpperCase()}`] || PRICE_IDS[params.plan]

  if (!priceId) {
    throw new Error(`Price ID not found for plan ${params.plan}`)
  }

  const supabase = await createClient()
  const { data: subscription } = await supabase
    .from('BillingSubscriptions')
    .select('stripeCustomerId')
    .eq('workspaceId', params.workspaceId)
    .single()

  const existingSubscription = subscription as BillingSubscriptionRow | null
  let customerId = existingSubscription?.stripeCustomerId

  if (!customerId) {
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

  const tenant = data as TenantPlanRow | null

  return {
    plan: tenant?.plan || 'free_creative',
    profile: tenant?.profile || 'CREATIVE',
  }
}
