import Stripe from 'stripe'

let stripeInstance: Stripe | null = null

export function getStripe() {
  if (!stripeInstance) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) {
      console.warn('STRIPE_SECRET_KEY is missing. Stripe operations will fail.')
      return null
    }
    stripeInstance = new Stripe(key, {
      apiVersion: '2025-01-27.acacia' as any,
      typescript: true,
    })
  }
  return stripeInstance
}

// Direct export removed to prevent build-time initialization errors. Use getStripe() instead.
