import { PLANS } from '@/features/subscription/constants'
import { Check, ArrowLeft, Crown } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createStripeCheckoutSession } from '@/features/subscription/actions'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function UpgradePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!user.tenantId) redirect('/')

  const appBaseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

  const supabase = await createClient()

  const { data: planData } = await supabase
    .from('WorkspacePlans')
    .select('plan')
    .eq('workspaceId', user.tenantId)
    .single()

  const currentPlan = (planData as { plan?: string } | null)?.plan || 'start'

  return (
    <div className="container max-w-5xl py-10">
      <Link
        href="/app/configuracoes"
        className="text-muted-foreground hover:text-foreground mb-8 flex items-center text-sm transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para Configurações
      </Link>

      <div className="mb-16 space-y-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Escolha o próximo passo do seu ateliê</h1>
        <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
          Ganhe mais tempo com automações, aumente seus limites de mensagens e acompanhe melhor a
          saúde do negócio.
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-2">
        {/* PRO PLAN */}
        <Card
          className={`hover:border-primary/50 relative overflow-hidden border-2 transition-all ${currentPlan === 'pro' ? 'border-primary bg-primary/5' : 'border-border'}`}
        >
          {currentPlan === 'pro' && (
            <div className="bg-primary text-primary-foreground absolute top-0 right-0 rounded-bl-xl px-3 py-1 text-xs font-bold">
              SEU PLANO ATUAL
            </div>
          )}
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-primary text-2xl font-bold">{PLANS.pro.label}</CardTitle>
                <CardDescription className="mt-2">
                  {PLANS.pro.description}
                  <Link
                    href="/planos/pro"
                    className="text-primary mt-2 block text-xs font-bold hover:underline"
                  >
                    Saiba mais sobre este plano
                  </Link>
                </CardDescription>
              </div>
              <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                Mais popular
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold">R$ {PLANS.pro.price}</span>
              <span className="text-muted-foreground">/mês</span>
            </div>

            <div className="space-y-3 border-t pt-4">
              <h4 className="text-sm font-semibold">Tudo do Start, mais:</h4>
              <ul className="text-muted-foreground space-y-3 text-sm">
                <li className="flex gap-3">
                  <Check className="text-primary h-5 w-5 flex-none" /> <strong>1.500</strong>{' '}
                  mensagens transacionais
                </li>
                <li className="flex gap-3">
                  <Check className="text-primary h-5 w-5 flex-none" /> <strong>5.000</strong>{' '}
                  mensagens de campanha
                </li>
                <li className="flex gap-3">
                  <Check className="text-primary h-5 w-5 flex-none" /> IA: Previsão de demanda
                </li>
                <li className="flex gap-3">
                  <Check className="text-primary h-5 w-5 flex-none" /> IA: Sugestão de compras
                </li>
                <li className="flex gap-3">
                  <Check className="text-primary h-5 w-5 flex-none" /> Imagens em campanhas
                </li>
                <li className="flex gap-3">
                  <Check className="text-primary h-5 w-5 flex-none" /> Até 3 usuários
                </li>
              </ul>
            </div>
          </CardContent>
          <CardFooter>
            {currentPlan === 'pro' ? (
              <Button disabled className="w-full opacity-50">
                Plano atual
              </Button>
            ) : (
              <form
                action={async () => {
                  'use server'
                  await createStripeCheckoutSession({
                    workspaceId: user.tenantId,
                    plan: 'pro',
                    successUrl: `${appBaseUrl}/app/configuracoes?success=upgrade`,
                    cancelUrl: `${appBaseUrl}/app/upgrade`,
                  }).then(res => redirect(res.url))
                }}
                className="w-full"
              >
                <Button className="w-full font-bold" size="lg">
                  Quero o Pro
                </Button>
              </form>
            )}
          </CardFooter>
        </Card>

        {/* PREMIUM PLAN */}
        <Card
          className={`hover:border-warning/50 relative overflow-hidden border-2 transition-all ${currentPlan === 'premium' ? 'border-warning bg-warning/5' : 'border-border'}`}
        >
          {currentPlan === 'premium' && (
            <div className="bg-warning text-warning-foreground absolute top-0 right-0 rounded-bl-xl px-3 py-1 text-xs font-bold">
              SEU PLANO ATUAL
            </div>
          )}
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-2xl font-bold text-gray-900">
                  {PLANS.premium.label} <Crown className="text-warning fill-warning h-5 w-5" />
                </CardTitle>
                <CardDescription className="mt-2">
                  {PLANS.premium.description}
                  <Link
                    href="/planos/premium"
                    className="text-warning mt-2 block text-xs font-bold hover:underline"
                  >
                    Saiba mais sobre este plano
                  </Link>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold">R$ {PLANS.premium.price}</span>
              <span className="text-muted-foreground">/mês</span>
            </div>

            <div className="space-y-3 border-t pt-4">
              <h4 className="text-sm font-semibold">Tudo do Pro, mais:</h4>
              <ul className="text-muted-foreground space-y-3 text-sm">
                <li className="flex gap-3">
                  <Check className="text-primary h-5 w-5 flex-none" /> <strong>10.000</strong> msg
                  transacionais
                </li>
                <li className="flex gap-3">
                  <Check className="text-primary h-5 w-5 flex-none" /> <strong>20.000</strong> msg
                  campanha
                </li>
                <li className="flex gap-3">
                  <Check className="text-primary h-5 w-5 flex-none" /> IA avançada (sazonalidade)
                </li>
                <li className="flex gap-3">
                  <Check className="text-primary h-5 w-5 flex-none" /> Usuários ilimitados
                </li>
                <li className="flex gap-3">
                  <Check className="text-primary h-5 w-5 flex-none" /> Suporte prioritário
                </li>
              </ul>
            </div>
          </CardContent>
          <CardFooter>
            {currentPlan === 'premium' ? (
              <Button disabled className="w-full opacity-50">
                Plano atual
              </Button>
            ) : (
              <form
                action={async () => {
                  'use server'
                  await createStripeCheckoutSession({
                    workspaceId: user.tenantId,
                    plan: 'premium',
                    successUrl: `${appBaseUrl}/app/configuracoes?success=upgrade`,
                    cancelUrl: `${appBaseUrl}/app/upgrade`,
                  }).then(res => redirect(res.url))
                }}
                className="w-full"
              >
                <Button
                  variant="outline"
                  className="w-full border-gray-300 font-bold hover:bg-gray-50"
                  size="lg"
                >
                  Quero o Premium
                </Button>
              </form>
            )}
          </CardFooter>
        </Card>
      </div>

      <p className="text-muted-foreground mt-12 text-center text-sm">
        Dúvidas sobre os planos?{' '}
        <Link href="/app/configuracoes" className="hover:text-primary underline">
          Fale com o suporte no painel
        </Link>
        .
      </p>
    </div>
  )
}
