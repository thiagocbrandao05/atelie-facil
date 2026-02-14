export const dynamic = 'force-dynamic'

import { getStripe } from '@/lib/stripe'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const ALLOWED_BILLING_PLANS = new Set(['start', 'pro', 'premium'])

// Lazy initialized admin client
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    console.warn('Supabase Admin credentials missing. Webhook operations may fail.')
    // Return a mock or handle appropriately. During build, this allows the route to be "defined" without crashing.
    return null
  }

  return createClient(url, key)
}

async function reserveWebhookEvent(admin: any, event: Stripe.Event) {
  const now = new Date().toISOString()
  const { error } = await admin.from('StripeWebhookEvent').insert({
    eventId: event.id,
    eventType: event.type,
    status: 'PROCESSING',
    receivedAt: now,
    updatedAt: now,
  })

  if (!error) {
    return { reserved: true, trackingDisabled: false }
  }

  // Duplicate event already reserved/processed
  if (error.code === '23505') {
    return { reserved: false, trackingDisabled: false }
  }

  // Do not block billing if tracking table is unavailable
  console.error('Failed to reserve Stripe webhook event:', error)
  return { reserved: true, trackingDisabled: true }
}

async function markWebhookProcessed(admin: any, eventId: string) {
  await admin
    .from('StripeWebhookEvent')
    .update({
      status: 'PROCESSED',
      processedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .eq('eventId', eventId)
}

async function releaseWebhookReservation(admin: any, eventId: string) {
  await admin.from('StripeWebhookEvent').delete().eq('eventId', eventId)
}

function normalizeBillingPlan(plan: unknown): 'start' | 'pro' | 'premium' | null {
  if (typeof plan !== 'string') return null
  const normalizedPlan = plan.trim().toLowerCase()
  if (!ALLOWED_BILLING_PLANS.has(normalizedPlan)) return null
  return normalizedPlan as 'start' | 'pro' | 'premium'
}

export async function POST(req: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured')
    return new NextResponse('Webhook secret not configured', { status: 500 })
  }

  const body = await req.text()
  const signature = (await headers()).get('Stripe-Signature')
  if (!signature) {
    return new NextResponse('Missing Stripe signature', { status: 400 })
  }

  let event: Stripe.Event

  const stripe = getStripe()
  if (!stripe) {
    return new NextResponse('Stripe not configured', { status: 500 })
  }

  const admin = getSupabaseAdmin()
  if (!admin) {
    return new NextResponse('Supabase admin not configured', { status: 500 })
  }

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (error: any) {
    console.error('Webhook signature verification failed.', error.message)
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 })
  }

  const session = event.data.object as Stripe.Checkout.Session
  const subscription = event.data.object as Stripe.Subscription

  const reservation = await reserveWebhookEvent(admin, event)
  if (!reservation.reserved) {
    // Stripe retries are expected; acknowledge duplicates idempotently.
    return new NextResponse(null, { status: 200 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        if (!session?.metadata?.workspaceId) {
          console.error('Missing workspaceId in metadata')
          break
        }

        const subscriptionId = session.subscription as string

        // Retrieve subscription to get status and current_period_end
        const sub = (await stripe.subscriptions.retrieve(subscriptionId)) as any

        // Find plan based on product ID (You need to map this or store in metadata)
        // Ideally, we store plan in metadata during checkout creation
        const plan = normalizeBillingPlan(session?.metadata?.plan)
        if (!plan) {
          console.error('Invalid plan in checkout metadata', {
            eventId: event.id,
            workspaceId: session?.metadata?.workspaceId,
          })
          break
        }

        await (admin as any).from('BillingSubscriptions').upsert(
          {
            workspaceId: session.metadata.workspaceId,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: subscriptionId,
            plan: plan,
            status: sub.status,
            currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
            updatedAt: new Date().toISOString(),
          },
          { onConflict: 'workspaceId' }
        )

        await (admin as any).from('WorkspacePlans').upsert(
          {
            workspaceId: session.metadata.workspaceId,
            plan: plan,
            changedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          { onConflict: 'workspaceId' }
        )

        break
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const workspaceId = subscription.metadata?.workspaceId
        if (!workspaceId) {
          // Try to find by stripeSubscriptionId if metadata is missing on subscription object (sometimes happens)
          const { data: existing } = await admin
            .from('BillingSubscriptions')
            .select('workspaceId')
            .eq('stripeSubscriptionId', subscription.id)
            .single()

          if (!existing) {
            console.error('Could not find subscription in DB:', subscription.id)
            break
          }
        }

        // Determine plan from items (assuming 1 item)
        // In a real app, you map priceId to PlanType
        // For simplicity, we trust metadata or use fallback
        const plan = normalizeBillingPlan(subscription.metadata?.plan)

        // If deleted, revert to free/start?
        // Logic: Sync status. Application logic decides access based on status.
        // But for WorkspacePlans, we might want to downgrade if canceled/past_due

        const status = subscription.status
        const currentId =
          workspaceId ||
          (
            await admin
              .from('BillingSubscriptions')
              .select('workspaceId')
              .eq('stripeSubscriptionId', subscription.id)
              .single()
          ).data?.workspaceId

        if (currentId) {
          await (admin as any)
            .from('BillingSubscriptions')
            .update({
              status: status,
              currentPeriodEnd: new Date(
                (subscription as any).current_period_end * 1000
              ).toISOString(),
              updatedAt: new Date().toISOString(),
            })
            .eq('stripeSubscriptionId', subscription.id)

          // If canceled or unpaid, downgrade WorkspacePlans?
          // Usually we wait until period end. But for simplicity:
          if (status === 'canceled' || status === 'unpaid') {
            // Check if period ended?
            // For now, let's keep it simple: if not active/trialing, downgrade to start
            if (['active', 'trialing'].includes(status) === false) {
              await (admin as any)
                .from('WorkspacePlans')
                .update({
                  plan: 'start',
                  updatedAt: new Date().toISOString(),
                })
                .eq('workspaceId', currentId)
            }
          } else if (plan) {
            // Ensure plan matches (upgrades/downgrades via portal)
            await (admin as any)
              .from('WorkspacePlans')
              .update({
                plan: plan,
                updatedAt: new Date().toISOString(),
              })
              .eq('workspaceId', currentId)
          }
        }

        break
      }

      case 'invoice.payment_succeeded': {
        // Can be used to extend access
        break
      }

      default:
        console.log(`Unhandled event type ${event.type}`)
    }
    if (!reservation.trackingDisabled) {
      await markWebhookProcessed(admin, event.id)
    }
  } catch (error: any) {
    if (!reservation.trackingDisabled) {
      await releaseWebhookReservation(admin, event.id)
    }
    console.error('Error processing webhook:', error)
    return new NextResponse(`Error processing webhook: ${error.message}`, { status: 500 })
  }

  return new NextResponse(null, { status: 200 })
}
