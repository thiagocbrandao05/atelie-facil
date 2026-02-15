import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PlanType } from '@/features/subscription/types'

interface OnboardingStep {
  id: string
  title: string
  description: string
  link: string
  completed?: boolean
}

const STEPS_BY_PLAN: Partial<Record<PlanType, OnboardingStep[]>> = {
  start: [
    {
      id: 'profile',
      title: 'Configurar ateliê',
      description: 'Preencha os dados do seu negócio',
      link: 'app/configuracoes',
    },
    {
      id: 'material',
      title: 'Cadastrar material',
      description: 'Registre seu primeiro insumo',
      link: 'app/estoque',
    },
    {
      id: 'product',
      title: 'Criar produto',
      description: 'Calcule o preço do seu primeiro produto',
      link: 'app/produtos',
    },
    {
      id: 'order',
      title: 'Registrar pedido',
      description: 'Faça seu primeiro pedido de venda',
      link: 'app/pedidos',
    },
    {
      id: 'whatsapp',
      title: 'Conectar WhatsApp',
      description: 'Ative notificações automáticas',
      link: 'app/configuracoes',
    },
  ],
  pro: [
    {
      id: 'whatsapp_cloud',
      title: 'Configurar WhatsApp Cloud',
      description: 'Integração oficial para campanhas',
      link: 'app/configuracoes',
    },
  ],
  premium: [
    {
      id: 'seasonality',
      title: 'Sazonalidade avançada',
      description: 'Descubra padrões de compra dos clientes',
      link: 'app/automacoes',
    },
  ],
}

export default async function OnboardingPage(props: {
  params: Promise<{ workspaceSlug: string }>
}) {
  const params = await props.params
  const supabase = await createClient()
  const { data: workspace } = await supabase
    .from('Tenant')
    .select('id, name')
    .eq('slug', params.workspaceSlug)
    .single()

  if (!workspace) redirect('/')

  const { data: planData } = await supabase
    .from('WorkspacePlans')
    .select('plan')
    .eq('workspaceId', (workspace as any).id)
    .single()

  const currentPlan: PlanType = (planData as any)?.plan || 'start'
  const steps = STEPS_BY_PLAN[currentPlan] ?? STEPS_BY_PLAN.start ?? []

  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-3xl font-bold">Bem-vindo(a) ao Atelis</h1>
        <p className="text-muted-foreground text-lg">
          Vamos configurar seu ateliê <strong>{(workspace as any).name}</strong>.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {steps.map(step => (
          <Card key={step.id}>
            <CardHeader>
              <CardTitle>{step.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{step.description}</p>
              <Link
                href={`/${params.workspaceSlug}/${step.link}`}
                className="text-primary mt-3 inline-flex items-center font-semibold hover:underline"
              >
                Abrir etapa
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
