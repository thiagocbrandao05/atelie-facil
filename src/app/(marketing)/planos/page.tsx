import { PLANS } from '@/features/subscription/constants'
import { Check, X } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function PricingPage() {
  return (
    <div className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-primary text-base leading-7 font-semibold">Preços</h2>
          <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Escolha o plano ideal para seu ateliê
          </p>
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-gray-600">
          Comece pequeno e cresça com a gente. Mude de plano a qualquer momento.
        </p>

        <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-y-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {/* START */}
          <div className="rounded-3xl bg-white p-8 ring-1 ring-gray-200 xl:p-10">
            <div className="flex items-center justify-between gap-x-4">
              <h3 className="text-lg leading-8 font-semibold text-gray-900">{PLANS.start.label}</h3>
            </div>
            <p className="mt-4 text-sm leading-6 text-gray-600">
              {PLANS.start.description}
              <Link
                href="/planos/start"
                className="text-primary mt-2 block text-xs font-bold hover:underline"
              >
                Saiba mais sobre este plano →
              </Link>
            </p>
            <p className="mt-6 flex items-baseline gap-x-1">
              <span className="text-4xl font-bold tracking-tight text-gray-900">
                R$ {PLANS.start.price}
              </span>
              <span className="text-sm leading-6 font-semibold text-gray-600">/mês</span>
            </p>
            <Link
              href="/auth/register"
              className="bg-primary/10 text-primary hover:bg-primary/20 focus-visible:outline-primary mt-6 block rounded-md px-3 py-2 text-center text-sm leading-6 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Começar Grátis
            </Link>
            <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-gray-600">
              <li className="flex gap-x-3">
                <Check className="text-primary h-6 w-5 flex-none" /> 300 mensagens transacionais
              </li>
              <li className="flex gap-x-3">
                <Check className="text-primary h-6 w-5 flex-none" /> 300 mensagens de campanha
              </li>
              <li className="flex gap-x-3">
                <Check className="text-primary h-6 w-5 flex-none" /> Gestão de Pedidos Básica
              </li>
              <li className="flex gap-x-3">
                <X className="h-6 w-5 flex-none text-gray-400" /> Automações de IA
              </li>
              <li className="flex gap-x-3">
                <X className="h-6 w-5 flex-none text-gray-400" /> Multiusuário
              </li>
            </ul>
          </div>

          {/* PRO */}
          <div className="ring-primary relative rounded-3xl bg-white p-8 ring-2 xl:p-10">
            <span className="bg-primary absolute -top-4 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-sm font-semibold text-white">
              Mais Popular
            </span>
            <div className="flex items-center justify-between gap-x-4">
              <h3 className="text-primary text-lg leading-8 font-semibold">{PLANS.pro.label}</h3>
            </div>
            <p className="mt-4 text-sm leading-6 text-gray-600">
              {PLANS.pro.description}
              <Link
                href="/planos/pro"
                className="text-primary mt-2 block text-xs font-bold hover:underline"
              >
                Saiba mais sobre este plano →
              </Link>
            </p>
            <p className="mt-6 flex items-baseline gap-x-1">
              <span className="text-4xl font-bold tracking-tight text-gray-900">
                R$ {PLANS.pro.price}
              </span>
              <span className="text-sm leading-6 font-semibold text-gray-600">/mês</span>
            </p>
            <Link
              href="/auth/register?plan=pro"
              className="bg-primary hover:bg-primary/90 focus-visible:outline-primary mt-6 block rounded-md px-3 py-2 text-center text-sm leading-6 font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Assinar Agora
            </Link>
            <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-gray-600">
              <li className="flex gap-x-3">
                <Check className="text-primary h-6 w-5 flex-none" /> 1.500 mensagens transacionais
              </li>
              <li className="flex gap-x-3">
                <Check className="text-primary h-6 w-5 flex-none" /> 5.000 mensagens de campanha
              </li>
              <li className="flex gap-x-3">
                <Check className="text-primary h-6 w-5 flex-none" /> IA: Previsão de Demanda
              </li>
              <li className="flex gap-x-3">
                <Check className="text-primary h-6 w-5 flex-none" /> IA: Sugestão de Compras
              </li>
              <li className="flex gap-x-3">
                <Check className="text-primary h-6 w-5 flex-none" /> Imagens em Campanhas
              </li>
              <li className="flex gap-x-3">
                <Check className="text-primary h-6 w-5 flex-none" /> Até 3 usuários
              </li>
            </ul>
          </div>

          {/* PREMIUM */}
          <div className="rounded-3xl bg-white p-8 ring-1 ring-gray-200 xl:p-10">
            <div className="flex items-center justify-between gap-x-4">
              <h3 className="text-lg leading-8 font-semibold text-gray-900">
                {PLANS.premium.label}
              </h3>
            </div>
            <p className="mt-4 text-sm leading-6 text-gray-600">
              {PLANS.premium.description}
              <Link
                href="/planos/premium"
                className="text-primary mt-2 block text-xs font-bold hover:underline"
              >
                Saiba mais sobre este plano →
              </Link>
            </p>
            <p className="mt-6 flex items-baseline gap-x-1">
              <span className="text-4xl font-bold tracking-tight text-gray-900">
                R$ {PLANS.premium.price}
              </span>
              <span className="text-sm leading-6 font-semibold text-gray-600">/mês</span>
            </p>
            <Link
              href="/auth/register?plan=premium"
              className="text-primary mt-6 block rounded-md bg-gray-50 px-3 py-2 text-center text-sm leading-6 font-semibold ring-1 ring-gray-200/50 ring-inset hover:bg-gray-100"
            >
              Fale com Consultor
            </Link>
            <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-gray-600">
              <li className="flex gap-x-3">
                <Check className="text-primary h-6 w-5 flex-none" /> 10.000 mensagens transacionais
              </li>
              <li className="flex gap-x-3">
                <Check className="text-primary h-6 w-5 flex-none" /> 20.000 mensagens de campanha
              </li>
              <li className="flex gap-x-3">
                <Check className="text-primary h-6 w-5 flex-none" /> IA Avançada (Sazonalidade)
              </li>
              <li className="flex gap-x-3">
                <Check className="text-primary h-6 w-5 flex-none" /> Usuários Ilimitados
              </li>
              <li className="flex gap-x-3">
                <Check className="text-primary h-6 w-5 flex-none" /> Suporte Prioritário
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
