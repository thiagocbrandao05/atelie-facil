import { PLANS, FALLBACK_LIMITS } from '@/features/subscription/constants'
import { PlanType } from '@/features/subscription/types'
import {
  Check,
  ArrowLeft,
  Lightbulb,
  MessageSquare,
  BrainCircuit,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface PlanDetailsPageProps {
  params: Promise<{
    planSlug: string
  }>
}

export default async function PlanDetailsPage({ params }: PlanDetailsPageProps) {
  const { planSlug } = await params
  const slug = planSlug.toLowerCase() as PlanType
  const plan = PLANS[slug]
  const limits = FALLBACK_LIMITS[slug]

  if (!plan || !limits) {
    notFound()
  }

  const educationalContent = {
    start: {
      why: 'Ideal para dar o primeiro passo profissional. Se você ainda controla tudo em cadernos ou planilhas soltas, o Start centraliza seu estoque e pedidos.',
      highlights: [
        {
          title: 'O que são Mensagens Transacionais?',
          description:
            "São mensagens enviadas automaticamente para seu cliente (ex: 'Pedido Recebido', 'Orçamento Enviado').",
          icon: MessageSquare,
        },
        {
          title: 'Estoque em Tempo Real',
          description:
            'Saiba exatamente quanto custa cada grama de material e seja avisado quando estiver acabando.',
          icon: Zap,
        },
      ],
    },
    pro: {
      why: 'Para quem já vive da arte e precisa de escala. A Inteligência Artificial começa a trabalhar para você aqui, prevendo quanto você vai vender.',
      highlights: [
        {
          title: 'Previsão de Demanda com IA',
          description:
            'Nossa IA analisa suas vendas passadas e te diz o quanto você deve produzir para o próximo mês.',
          icon: BrainCircuit,
        },
        {
          title: 'Campanhas com Imagens',
          description:
            'Envie fotos dos seus novos produtos direto no WhatsApp de todos os seus clientes de uma vez.',
          icon: MessageSquare,
        },
      ],
    },
    premium: {
      why: 'Para ateliês consolidados ou equipes. Foco total em análise avançada de dados e suporte humanizado para sua operação não parar.',
      highlights: [
        {
          title: 'Análise de Sazonalidade',
          description:
            'A IA identifica quais épocas do ano seu ateliê mais lucra e ajuda a preparar o estoque com antecedência.',
          icon: BrainCircuit,
        },
        {
          title: 'Gestão Coletiva',
          description:
            'Adicione quantos ajudantes precisar no sistema, com controle total de quem acessa o quê.',
          icon: ShieldCheck,
        },
      ],
    },
  }

  const content = educationalContent[slug]

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="container max-w-4xl px-6 py-12">
        <Link
          href="/planos"
          className="text-muted-foreground hover:text-primary mb-12 inline-flex items-center text-sm font-medium transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para todos os planos
        </Link>

        <div className="space-y-12">
          {/* Header */}
          <div className="space-y-4">
            <div className="bg-primary/10 text-primary inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold tracking-widest uppercase">
              Plano {plan.label}
            </div>
            <h1 className="text-4xl font-black tracking-tight text-gray-900 sm:text-5xl">
              {plan.label}: {plan.description}
            </h1>
            <p className="text-muted-foreground text-xl leading-relaxed">{content.why}</p>
          </div>

          {/* Price Tag */}
          <div className="inline-block rounded-3xl border bg-white p-8 shadow-sm">
            <p className="text-muted-foreground mb-2 text-sm font-semibold tracking-wider uppercase">
              Investimento
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-primary text-5xl font-black">R$ {plan.price}</span>
              <span className="text-muted-foreground text-xl font-medium">/mês</span>
            </div>
          </div>

          {/* Didactic Highlights */}
          <div className="grid gap-6 sm:grid-cols-2">
            {content.highlights.map((item, i) => {
              const Icon = item.icon
              return (
                <div key={i} className="space-y-4 rounded-3xl border bg-white p-8 shadow-sm">
                  <div className="text-primary flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              )
            })}
          </div>

          {/* Detailed Features List */}
          <div className="rounded-3xl border bg-white p-10 shadow-sm">
            <h2 className="mb-8 flex items-center gap-3 text-2xl font-bold">
              <Lightbulb className="h-6 w-6 text-yellow-500" />O que está incluso no {plan.label}
            </h2>
            <div className="grid gap-x-12 gap-y-6 sm:grid-cols-2">
              <div className="space-y-4">
                <h4 className="border-b pb-2 font-bold text-slate-900">WhatsApp</h4>
                <ul className="space-y-3">
                  <li className="flex gap-3 text-sm">
                    <Check className="h-5 w-5 flex-none text-green-500" />{' '}
                    {limits.monthlyTransactional} mensagens transacionais
                  </li>
                  <li className="flex gap-3 text-sm">
                    <Check className="h-5 w-5 flex-none text-green-500" /> {limits.monthlyCampaign}{' '}
                    mensagens de campanha
                  </li>
                  <li className="flex gap-3 text-sm">
                    <Check className="h-5 w-5 flex-none text-green-500" />{' '}
                    {limits.maxRecipientsPerCampaign} contatos por campanha
                  </li>
                </ul>
              </div>
              <div className="space-y-4">
                <h4 className="border-b pb-2 font-bold text-slate-900">Gestão</h4>
                <ul className="space-y-3">
                  <li className="flex gap-3 text-sm">
                    <Check className="h-5 w-5 flex-none text-green-500" /> Estoque de Materiais
                    Automatizado
                  </li>
                  <li className="flex gap-3 text-sm">
                    <Check className="h-5 w-5 flex-none text-green-500" /> Precificação Baseada em
                    Custos
                  </li>
                  <li className="flex gap-3 text-sm">
                    <Check className="h-5 w-5 flex-none text-green-500" /> Fluxo de Caixa e
                    Relatórios
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="pt-8 text-center">
            <Link href="/register">
              <Button
                size="lg"
                className="shadow-primary/20 rounded-full px-12 py-8 text-xl font-bold shadow-xl transition-transform hover:scale-105"
              >
                Assinar Plano {plan.label}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
