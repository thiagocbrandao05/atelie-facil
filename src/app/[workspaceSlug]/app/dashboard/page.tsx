import Link from 'next/link'

import { getLowStockMaterials } from '@/features/analytics/actions'
import { getOrders, getOrdersStats } from '@/features/orders/actions'
import { getSettings } from '@/features/settings/actions'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { OrderCalendar } from '@/components/dashboard/order-calendar'
import {
  AlertCircle,
  ShoppingBag,
  TrendingUp,
  PlusCircle,
  ArrowRight,
  Package as PackageIcon,
  MessageCircle,
} from 'lucide-react'
import { summarizeFinancials } from '@/lib/logic'

interface Material {
  id: string
  name: string
  unit: string
  quantity: number
  minQuantity: number | null
}

interface Order {
  id: string
  customer?: { name: string }
  status: string
  dueDate: string | Date
  totalValue: number
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>
}) {
  const { workspaceSlug } = await params
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const userWorkspaceSlug = (user as any)?.tenant?.slug
  if (userWorkspaceSlug && userWorkspaceSlug !== workspaceSlug) {
    redirect(`/${userWorkspaceSlug}/app/dashboard`)
  }

  const [lowStockMaterials, orders, orderStats, settings] = await Promise.all([
    getLowStockMaterials() as Promise<Material[]>,
    getOrders() as Promise<any[]>,
    getOrdersStats(),
    getSettings(),
  ])

  const financials = summarizeFinancials(
    orders,
    Number(settings?.hourlyRate || 20),
    settings?.monthlyFixedCosts || [],
    Number(settings?.workingHoursPerMonth || 160)
  )

  return (
    <div className="relative mx-auto max-w-7xl space-y-8 pb-12">
      {/* Dynamic Background Elements - Subtler */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="bg-primary/5 absolute top-0 right-0 h-[20rem] w-[20rem] -translate-y-1/2 rounded-full blur-[80px]" />
        <div className="bg-accent/5 absolute bottom-0 left-0 h-[15rem] w-[15rem] translate-y-1/2 rounded-full blur-[60px]" />
      </div>

      {/* Hero / Header Section - Scaled Down */}
      <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
        <div className="space-y-1 text-center md:text-left">
          <h1 className="text-primary font-serif text-3xl font-black tracking-tight italic">
            Olá, sua criatividade
            <br />
            <span className="text-foreground not-italic">está em foco hoje.</span>
          </h1>
          <p className="text-muted-foreground text-base font-medium">
            Confira como está o ritmo do seu ateliê.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href={`/${workspaceSlug}/app/pedidos`}
            className="bg-primary text-primary-foreground shadow-primary/10 flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-black shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl active:scale-95"
          >
            <PlusCircle size={18} />
            Novo pedido
          </Link>
          <Link
            href={`/${workspaceSlug}/app/estoque`}
            className="hover:bg-primary/5 group border-primary/20 hover:border-primary/40 flex items-center gap-2 rounded-xl border bg-white/80 px-6 py-3 text-sm font-black backdrop-blur-md transition-all"
          >
            <PackageIcon
              size={18}
              className="text-primary transition-transform group-hover:rotate-12"
            />
            Estoque
          </Link>
        </div>
      </div>

      {/* Mood Board Layout - More balanced */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Main Inspiration / Performance Board */}
        <div className="lg:col-span-8">
          <div className="group relative flex h-full min-h-[350px] flex-col overflow-hidden rounded-2xl border border-white/40 bg-white/90 p-8 shadow-md backdrop-blur-2xl transition-all hover:shadow-lg">
            <div className="bg-primary/5 absolute top-[-5%] right-[-5%] h-48 w-48 rounded-full blur-3xl transition-transform group-hover:scale-125" />

            <div className="relative z-10 flex flex-1 flex-col justify-between">
              <div className="space-y-1">
                <h2 className="text-muted-foreground flex items-center gap-2 text-[10px] font-black tracking-widest uppercase">
                  <TrendingUp size={14} className="text-primary" />
                  Performance do mês
                </h2>
                <p className="text-2xl font-black">Seu ateliê está vibrante!</p>
              </div>

              <div className="mt-8 flex flex-wrap items-end gap-10">
                <div>
                  <p className="text-muted-foreground mb-1 text-[10px] font-bold tracking-tighter uppercase">
                    Pedidos ativos
                  </p>
                  <div className="text-primary flex items-baseline gap-2">
                    <span className="text-5xl leading-none font-black tracking-tighter">
                      {orderStats.activeOrders}
                    </span>
                    <span className="text-xs font-bold uppercase opacity-60">em produção</span>
                  </div>
                </div>

                <div className="bg-primary/10 h-12 w-px" />

                <div>
                  <p className="text-muted-foreground mb-1 text-[10px] font-bold tracking-tighter uppercase">
                    Faturamento estimado
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black tracking-tighter">
                      {financials.totalProfit.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-8">
                <Link
                  href={`/${workspaceSlug}/app/pedidos`}
                  className="text-primary decoration-primary/30 hover:decoration-primary inline-flex items-center gap-2 text-xs font-black underline underline-offset-4 transition-all"
                >
                  Ver todos os pedidos ativos <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Vertical Alert Column */}
        <div className="space-y-6 lg:col-span-4">
          {/* Stock Alert Bubble */}
          <div
            className={`relative overflow-hidden rounded-2xl p-6 shadow-md transition-all hover:-translate-y-1 ${lowStockMaterials.length > 0 ? 'bg-orange-500 text-white shadow-orange-500/10' : 'bg-primary shadow-primary/10 text-white'}`}
          >
            <div className="absolute top-[-10px] right-[-10px] opacity-10">
              <PackageIcon size={80} />
            </div>
            <div className="relative z-10 space-y-4">
              <h3 className="text-[10px] font-black tracking-[0.2em] uppercase opacity-70">
                Status de insumos
              </h3>
              {lowStockMaterials.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-3xl font-black">{lowStockMaterials.length} itens baixos</p>
                  <p className="text-xs font-medium opacity-90">
                    Reponha para não parar a produção.
                  </p>
                  <Link
                    href={`/${workspaceSlug}/app/estoque`}
                    className="inline-flex w-full items-center justify-center rounded-xl bg-white px-4 py-2.5 text-xs font-black text-orange-600 shadow-sm transition-transform hover:scale-105 active:scale-95"
                  >
                    Repor agora
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-3xl font-black">Estoque em dia</p>
                  <p className="text-xs font-medium opacity-90">Tudo pronto para as criações.</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Support Card */}
          <div className="group border-border/40 relative rounded-2xl border bg-white/90 p-6 shadow-sm transition-all hover:bg-white">
            <div className="space-y-3">
              <h3 className="text-[10px] font-black tracking-widest uppercase opacity-30">
                Relacionamento
              </h3>
              <p className="text-xs font-bold">Mantenha seus clientes por perto.</p>
              <div className="space-y-2">
                <Link
                  href={`/${workspaceSlug}/app/configuracoes`}
                  className="bg-background hover:bg-muted border-border/30 flex items-center justify-between rounded-xl border p-3 text-[11px] font-bold transition-all"
                >
                  Mensagens WhatsApp
                  <MessageCircle size={14} className="text-primary" />
                </Link>
                <Link
                  href={`/${workspaceSlug}/app/clientes`}
                  className="bg-background hover:bg-muted border-border/30 flex items-center justify-between rounded-xl border p-3 text-[11px] font-bold transition-all"
                >
                  Novo cliente
                  <PlusCircle size={14} className="text-primary" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Wide Schedule Board */}
        <div className="lg:col-span-12">
          <div className="overflow-hidden rounded-2xl border border-white/40 bg-white/90 p-8 shadow-md backdrop-blur-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-[10px] font-black tracking-[0.2em] uppercase opacity-40">
                  Linha do tempo
                </h2>
                <p className="text-xl font-black">Agenda de entregas</p>
              </div>
              <div className="flex gap-1.5">
                <div className="bg-primary h-1.5 w-1.5 rounded-full" />
                <div className="bg-accent h-1.5 w-1.5 rounded-full" />
                <div className="h-1.5 w-1.5 rounded-full bg-slate-200" />
              </div>
            </div>

            <div className="border-primary/5 bg-primary/[0.01] rounded-xl border p-4">
              <OrderCalendar orders={orders} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
