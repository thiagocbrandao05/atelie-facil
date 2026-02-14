'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  BarChart3,
  Check,
  Clock,
  CreditCard,
  MessageSquare,
  Package,
  Sparkles,
  Star,
  Zap,
  TrendingUp,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { LandingNavbar } from '@/components/landing/navbar'
import { PricingCard } from '@/components/landing/pricing-card'
import { AnimatedSection } from '@/components/ui/animated-section'

const highlights = [
  {
    title: 'Inteligência Artificial',
    description: 'Previsão de demanda e sugestão de compras baseada no seu histórico.',
    icon: Sparkles,
    className: 'md:col-span-2',
  },
  {
    title: 'WhatsApp Integrado',
    description: 'Notificações automáticas de status para seus clientes.',
    icon: MessageSquare,
    className: 'md:col-span-1',
  },
  {
    title: 'Controle Financeiro',
    description: 'Precificação correta, margem real e fluxo de caixa.',
    icon: CreditCard,
    className: 'md:col-span-1',
  },
  {
    title: 'Estoque Inteligente',
    description: 'Alertas de insumos baixos e gestão de produção.',
    icon: Package,
    className: 'md:col-span-2',
  },
]

const steps = [
  {
    title: '1. Organize',
    description: 'Cadastre materiais e produtos em minutos.',
    icon: Package,
  },
  {
    title: '2. Produza',
    description: 'Gerencie pedidos e etapas de produção.',
    icon: Zap,
  },
  {
    title: '3. Lucre',
    description: 'Tenha clareza total do seu financeiro.',
    icon: TrendingUp,
  },
]

export default function LandingPage() {
  const [isAnnual, setIsAnnual] = useState(true)

  return (
    <div className="theme-landing bg-background selection:bg-primary/20 selection:text-primary flex min-h-screen flex-col overflow-x-hidden font-sans">
      <LandingNavbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-32 pb-20 lg:pt-48 lg:pb-32">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="bg-primary/5 absolute top-0 left-1/2 h-[50rem] w-[50rem] -translate-x-1/2 rounded-full blur-[120px] opacity-70 mix-blend-multiply" />
            <div className="bg-accent/10 absolute top-40 right-0 h-[40rem] w-[40rem] rounded-full blur-[120px] opacity-60 mix-blend-multiply" />
            <div className="bg-blue-100/20 absolute -bottom-20 left-0 h-[30rem] w-[30rem] rounded-full blur-[100px] opacity-50 mix-blend-multiply dark:bg-blue-900/10" />
          </div>

          <div className="container relative mx-auto px-6 text-center">
            <AnimatedSection direction="up">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-primary/5 px-4 py-1.5 text-xs font-bold tracking-widest text-primary uppercase backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Gestão Profissional para Artesãos</span>
              </div>
            </AnimatedSection>

            <AnimatedSection direction="up" delay={0.1} className="mx-auto mt-8 max-w-4xl">
              <h1 className="text-5xl font-black tracking-tight text-foreground sm:text-6xl lg:text-7xl leading-[1.1]">
                Transforme sua arte em um{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-600 to-accent animate-gradient bg-300%">
                  negócio lucrativo.
                </span>
              </h1>
            </AnimatedSection>

            <AnimatedSection direction="up" delay={0.2} className="mx-auto mt-6 max-w-2xl">
              <p className="text-xl text-muted-foreground leading-relaxed">
                Deixe as planilhas de lado. Tenha controle total sobre estoque, precificação, pedidos e
                clientes em uma plataforma feita para quem cria.
              </p>
            </AnimatedSection>

            <AnimatedSection direction="up" delay={0.3} className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/register"
                className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-primary px-8 py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-105 hover:shadow-primary/30"
              >
                <span className="relative z-10">Começar Grátis</span>
                <ArrowRight className="relative z-10 h-5 w-5 transition-transform group-hover:translate-x-1" />
                <div className="absolute inset-0 -z-0 bg-gradient-to-r from-primary to-blue-600 opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
              <Link
                href="#funcionalidades"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background/50 px-8 py-4 text-base font-bold text-foreground backdrop-blur-sm transition-all hover:bg-muted/50 hover:border-primary/20"
              >
                Ver como funciona
              </Link>
            </AnimatedSection>

            <AnimatedSection direction="up" delay={0.4} className="mt-16 flex justify-center gap-8 text-muted-foreground opacity-60 grayscale transition-all hover:opacity-100 hover:grayscale-0">
              {/* Social Proof / Trusted By logos could go here */}
              <div className="flex items-center gap-2 text-sm font-semibold">
                <ShieldCheck className="h-5 w-5" />
                Dados Seguros
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Users className="h-5 w-5" />
                +1.000 Artesãos
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Star className="h-5 w-5" />
                4.9/5 Avaliação
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* Features Bento Grid */}
        <section id="funcionalidades" className="relative py-24 lg:py-32">
          <div className="container mx-auto px-6">
            <div className="mb-16 text-center">
              <AnimatedSection>
                <h2 className="text-3xl font-black text-foreground sm:text-4xl lg:text-5xl">
                  Tudo que você precisa.<br />
                  <span className="text-muted-foreground">Nada que atrapalhe.</span>
                </h2>
              </AnimatedSection>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {highlights.map((item, index) => {
                const Icon = item.icon
                return (
                  <AnimatedSection
                    key={item.title}
                    delay={index * 0.1}
                    className={cn(
                      "group relative overflow-hidden rounded-[2.5rem] border border-border/50 bg-white/60 p-8 shadow-sm backdrop-blur-md transition-all hover:shadow-xl hover:shadow-primary/5 dark:bg-white/5",
                      item.className
                    )}
                  >
                    <div className="absolute right-4 top-4 opacity-5 transition-transform group-hover:scale-110 group-hover:opacity-10">
                      <Icon className="h-32 w-32" />
                    </div>
                    <div className="relative z-10">
                      <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className="mb-3 text-2xl font-bold text-foreground">{item.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                    </div>
                  </AnimatedSection>
                )
              })}
            </div>
          </div>
        </section>

        {/* How it works steps */}
        <section className="bg-muted/30 py-24">
          <div className="container mx-auto px-6">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div>
                <AnimatedSection>
                  <span className="text-sm font-bold uppercase tracking-widest text-primary">Simples Assim</span>
                  <h2 className="mt-4 text-3xl font-black text-foreground sm:text-4xl">
                    Do pedido à entrega,<br />sem perder o controle.
                  </h2>
                  <p className="mt-6 text-lg text-muted-foreground">
                    O Atelis foi desenhado para ser intuitivo. Você não precisa de um curso para começar a usar.
                  </p>
                </AnimatedSection>

                <div className="mt-12 space-y-8">
                  {steps.map((step, index) => (
                    <AnimatedSection key={step.title} delay={index * 0.1} direction="right" className="flex gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-background shadow-sm text-primary">
                        <step.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground">{step.title}</h3>
                        <p className="text-muted-foreground">{step.description}</p>
                      </div>
                    </AnimatedSection>
                  ))}
                </div>
              </div>
              <AnimatedSection direction="left" className="relative lg:h-[600px]">
                {/* Abstract UI representation */}
                <div className="relative z-10 h-full w-full overflow-hidden rounded-[2.5rem] border border-border bg-background shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
                  <div className="p-8">
                    <div className="flex items-center gap-4 border-b border-border/50 pb-6">
                      <div className="h-3 w-3 rounded-full bg-red-400" />
                      <div className="h-3 w-3 rounded-full bg-amber-400" />
                      <div className="h-3 w-3 rounded-full bg-emerald-400" />
                      <div className="ml-4 h-2 w-32 rounded-full bg-slate-200" />
                    </div>
                    <div className="mt-8 space-y-6">
                      <div className="flex gap-4">
                        <div className="h-32 w-full rounded-2xl bg-primary/5 animate-pulse" />
                        <div className="h-32 w-full rounded-2xl bg-accent/5 animate-pulse delay-75" />
                      </div>
                      <div className="h-8 w-1/3 rounded-lg bg-slate-100" />
                      <div className="space-y-3">
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} className="flex items-center justify-between rounded-xl border border-border/30 p-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-slate-100" />
                              <div className="space-y-2">
                                <div className="h-3 w-24 rounded-full bg-slate-200" />
                                <div className="h-2 w-16 rounded-full bg-slate-100" />
                              </div>
                            </div>
                            <div className="h-6 w-16 rounded-full bg-green-100" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                {/* Decorative elements behind */}
                <div className="absolute -right-10 -top-10 -z-10 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
                <div className="absolute -bottom-10 -left-10 -z-10 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
              </AnimatedSection>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="planos" className="py-24 lg:py-32">
          <div className="container mx-auto px-6">
            <div className="mx-auto mb-16 max-w-3xl text-center">
              <AnimatedSection>
                <h2 className="text-3xl font-black text-foreground sm:text-4xl lg:text-5xl">
                  Investimento que se paga.
                </h2>
                <div className="mt-8 inline-flex items-center rounded-full bg-muted p-1">
                  <button
                    onClick={() => setIsAnnual(false)}
                    className={cn(
                      "rounded-full px-6 py-2 text-sm font-bold transition-all",
                      !isAnnual ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Mensal
                  </button>
                  <button
                    onClick={() => setIsAnnual(true)}
                    className={cn(
                      "rounded-full px-6 py-2 text-sm font-bold transition-all",
                      isAnnual ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Anual <span className="ml-1 text-xs text-emerald-600 font-extrabold">-20%</span>
                  </button>
                </div>
              </AnimatedSection>
            </div>

            <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-3 lg:gap-12">
              <AnimatedSection delay={0.1} className="h-full">
                <PricingCard
                  name="Start"
                  price={isAnnual ? "R$ 0" : "R$ 0"}
                  period="mês"
                  description="Para quem está começando."
                  features={[
                    "300 msg transacionais",
                    "300 msg campanha",
                    "Gestão de Pedidos Básica",
                    "Sem automações de IA",
                    "1 Usuário"
                  ]}
                  cta="Começar Grátis"
                  isAnnual={isAnnual}
                />
              </AnimatedSection>
              <AnimatedSection delay={0.2} className="h-full">
                <PricingCard
                  name="Pro"
                  price={isAnnual ? "R$ 39,90" : "R$ 49,90"}
                  period="mês"
                  description="Para ateliês em crescimento."
                  features={[
                    "1.500 msg transacionais",
                    "5.000 msg campanha",
                    "IA: Previsão de Demanda",
                    "IA: Sugestão de Compras",
                    "Até 3 usuários"
                  ]}
                  cta="Assinar Pro"
                  highlight={true}
                  isAnnual={isAnnual}
                />
              </AnimatedSection>
              <AnimatedSection delay={0.3} className="h-full">
                <PricingCard
                  name="Premium"
                  price={isAnnual ? "R$ 79,90" : "R$ 99,90"}
                  period="mês"
                  description="Gestão completa e ilimitada."
                  features={[
                    "10.000 msg transacionais",
                    "20.000 msg campanha",
                    "IA Avançada (Sazonalidade)",
                    "Usuários Ilimitados",
                    "Suporte Prioritário"
                  ]}
                  cta="Assinar Premium"
                  isAnnual={isAnnual}
                />
              </AnimatedSection>
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="pb-24 pt-10">
          <div className="container mx-auto px-6">
            <AnimatedSection className="relative overflow-hidden rounded-[3rem] bg-primary px-6 py-16 text-center text-primary-foreground shadow-2xl shadow-primary/20 md:px-12 md:py-24">
              <div className="relative z-10 mx-auto max-w-3xl space-y-8">
                <h2 className="text-3xl font-black sm:text-4xl lg:text-5xl">Pronta para profissionalizar seu ateliê?</h2>
                <p className="text-lg opacity-90 sm:text-xl">Junte-se a milhares de artesãos que já transformaram a gestão do seu negócio.</p>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-base font-bold text-primary shadow-lg transition-transform hover:scale-105"
                >
                  Criar conta gratuita
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
              {/* Decorative background shapes */}
              <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
            </AnimatedSection>
          </div>
        </section>

      </main>

      <footer className="border-t border-border/40 bg-background py-16">
        <div className="container mx-auto px-6">
          <div className="grid gap-12 md:grid-cols-4">
            <div className="col-span-2 space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20">
                  A
                </div>
                <span className="text-2xl font-black tracking-tighter text-foreground">
                  Atelis
                </span>
              </div>
              <p className="max-w-sm text-base font-medium leading-relaxed text-muted-foreground">
                Feito com carinho para quem faz com as mãos. O sistema de gestão que entende o seu ritmo.
              </p>
            </div>
            <div>
              <h4 className="mb-6 text-sm font-bold uppercase tracking-widest text-foreground">Produto</h4>
              <ul className="space-y-4 text-sm font-medium text-muted-foreground">
                <li><Link href="#funcionalidades" className="hover:text-primary transition-colors">Funcionalidades</Link></li>
                <li><Link href="#planos" className="hover:text-primary transition-colors">Planos</Link></li>
                <li><Link href="/login" className="hover:text-primary transition-colors">Entrar</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-6 text-sm font-bold uppercase tracking-widest text-foreground">Legal</h4>
              <ul className="space-y-4 text-sm font-medium text-muted-foreground">
                <li><Link href="#" className="hover:text-primary transition-colors">Termos de Uso</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Privacidade</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-16 border-t border-border/40 pt-8 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
            © 2026 Atelis. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  )
}
