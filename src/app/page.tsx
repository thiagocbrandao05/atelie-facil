"use client"

import { useState } from "react"
import Link from "next/link"
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
    Zap
} from "lucide-react"
import { LandingNavbar } from "@/components/landing/navbar"
import { PricingCard } from "@/components/landing/pricing-card"

const highlights = [
    {
        title: "Estoque sob controle",
        description: "Alertas inteligentes, materiais críticos e histórico de movimentações.",
        icon: Package,
    },
    {
        title: "Precificação sem achismos",
        description: "Calcule custo real, margem e metas mensais com clareza.",
        icon: CreditCard,
    },
    {
        title: "Pedidos no ritmo certo",
        description: "Acompanhe etapas, prazos e entregas com visão total.",
        icon: BarChart3,
    },
    {
        title: "Comunicação automatizada",
        description: "Mensagens prontas para orçamento, aprovação e entrega.",
        icon: MessageSquare,
    },
]

const steps = [
    {
        title: "Organize o ateliê",
        description: "Cadastre materiais, produtos e valores de produção em minutos.",
    },
    {
        title: "Acompanhe cada pedido",
        description: "Centralize etapas, prazos e histórico em um painel único.",
    },
    {
        title: "Escale com confiança",
        description: "Relatórios claros para decidir o próximo passo do negócio.",
    },
]

const benefits = [
    "Central de pedidos com visibilidade total",
    "Calculadora de preço com custos fixos e variáveis",
    "Alertas de estoque configuráveis",
    "Relatórios simples e acionáveis",
]

export default function LandingPage() {
    const [isAnnual, setIsAnnual] = useState(true)

    return (
        <div className="flex flex-col min-h-screen bg-background selection:bg-primary/20 selection:text-primary">
            <LandingNavbar />

            <main className="flex-1">
                <section className="relative overflow-hidden">
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute -top-32 right-0 h-72 w-72 rounded-full bg-primary/10 blur-[120px]" />
                        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-accent/10 blur-[120px]" />
                    </div>
                    <div className="container relative mx-auto px-6 pb-24 pt-32 lg:pb-32 lg:pt-40">
                        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                            <div className="space-y-8">
                                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
                                    <Sparkles className="h-3.5 w-3.5" />
                                    Feito para artesãos empreendedores
                                </div>
                                <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                                    O controle financeiro e produtivo do seu ateliê em um só lugar.
                                </h1>
                                <p className="text-lg text-muted-foreground sm:text-xl">
                                    Simplifique estoque, precificação e pedidos com um painel claro. Foque no que você faz de melhor:{" "}
                                    <strong className="text-foreground">criar com excelência</strong>.
                                </p>
                                <div className="flex flex-col gap-4 sm:flex-row">
                                    <Link
                                        href="/register"
                                        className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:-translate-y-0.5"
                                    >
                                        Começar grátis
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                    <Link
                                        href="#funcionalidades"
                                        className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-8 py-4 text-base font-semibold text-foreground transition hover:bg-muted"
                                    >
                                        Ver recursos
                                    </Link>
                                </div>
                                <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-primary" />
                                        Sem cartão de crédito
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-primary" />
                                        Configuração em 10 minutos
                                    </div>
                                </div>
                            </div>
                            <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-2xl">
                                <div className="rounded-2xl border border-border/60 bg-background p-6 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Resumo do mês</p>
                                            <p className="text-2xl font-bold text-foreground">R$ 12.480</p>
                                        </div>
                                        <div className="flex items-center gap-1 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
                                            <Star className="h-3 w-3" />
                                            +22% lucro
                                        </div>
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="rounded-2xl border border-border/60 bg-card p-4">
                                            <p className="text-xs text-muted-foreground">Pedidos ativos</p>
                                            <p className="text-2xl font-semibold text-foreground">18</p>
                                        </div>
                                        <div className="rounded-2xl border border-border/60 bg-card p-4">
                                            <p className="text-xs text-muted-foreground">Estoque crítico</p>
                                            <p className="text-2xl font-semibold text-warning">3 itens</p>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card px-4 py-3 text-sm">
                                            <span>Agenda do dia</span>
                                            <span className="text-muted-foreground">6 entregas</span>
                                        </div>
                                        <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card px-4 py-3 text-sm">
                                            <span>Caixa previsto</span>
                                            <span className="text-muted-foreground">R$ 4.200</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground">
                                        Ateliê organizado, decisões mais rápidas
                                        <Zap className="h-4 w-4" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="funcionalidades" className="bg-card py-20">
                    <div className="container mx-auto px-6">
                        <div className="mb-12 max-w-3xl">
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Funcionalidades</p>
                            <h2 className="mt-4 text-3xl font-black text-foreground sm:text-4xl">
                                Tudo que você precisa para ganhar tempo e margem.
                            </h2>
                            <p className="mt-4 text-lg text-muted-foreground">
                                Uma plataforma criada para artesãos que querem previsibilidade, clareza financeira e um fluxo de trabalho leve.
                            </p>
                        </div>
                        <div className="grid gap-6 md:grid-cols-2">
                            {highlights.map((item) => {
                                const Icon = item.icon
                                return (
                                    <div key={item.title} className="rounded-3xl border border-border/60 bg-background p-6 shadow-sm">
                                        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                            <Icon className="h-6 w-6" />
                                        </div>
                                        <h3 className="text-xl font-semibold text-foreground">{item.title}</h3>
                                        <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </section>

                <section className="py-20">
                    <div className="container mx-auto px-6">
                        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
                            <div className="space-y-6">
                                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Como funciona</p>
                                <h2 className="text-3xl font-black text-foreground sm:text-4xl">
                                    Comece hoje e veja resultados em poucas semanas.
                                </h2>
                                <p className="text-lg text-muted-foreground">
                                    Um caminho simples para organizar o ateliê, acompanhar pedidos e tomar decisões com base em dados.
                                </p>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {benefits.map((benefit) => (
                                        <div key={benefit} className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3 text-sm">
                                            <Check className="h-4 w-4 text-primary" />
                                            {benefit}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="rounded-3xl border border-border/60 bg-muted/40 p-6">
                                <div className="space-y-6 rounded-3xl bg-background p-6">
                                    {steps.map((step, index) => (
                                        <div key={step.title} className="flex gap-4">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-sm font-semibold text-primary">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
                                                <p className="text-sm text-muted-foreground">{step.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="planos" className="bg-background py-20">
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-black text-foreground sm:text-4xl">
                                Planos alinhados ao seu momento.
                            </h2>
                            <p className="mt-4 text-lg text-muted-foreground">
                                Comece sem risco e evolua conforme o seu ateliê cresce.
                            </p>
                        </div>

                        <div className="flex justify-center items-center gap-4 mb-10">
                            <span className={!isAnnual ? "text-muted-foreground font-medium" : "text-foreground font-bold"}>Mensal</span>
                            <button
                                className={`w-16 h-8 rounded-full p-1 ${isAnnual ? "bg-primary" : "bg-muted"}`}
                                onClick={() => setIsAnnual(!isAnnual)}
                            >
                                <div className={`w-6 h-6 rounded-full bg-white transition-transform ${isAnnual ? "translate-x-8" : ""}`} />
                            </button>
                            <span className={isAnnual ? "text-muted-foreground font-medium" : "text-foreground font-bold"}>
                                Anual <span className="text-primary font-bold">(economize 20%)</span>
                            </span>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                            <PricingCard
                                name="Iniciante"
                                description="Ideal para hobbistas e artesãos no início da jornada."
                                price="R$ 0"
                                period="para sempre"
                                features={[
                                    "Até 30 pedidos ativos",
                                    "Gestão básica de materiais",
                                    "Calculadora de valor fixo",
                                    "Orçamentos em PDF (com logo)"
                                ]}
                                cta="Começar Agora"
                                isAnnual={isAnnual}
                            />
                            <PricingCard
                                name="Artesã Pró"
                                description="O plano completo para quem vive da arte."
                                price={isAnnual ? "R$ 39,90" : "R$ 49,90"}
                                period="mês"
                                features={[
                                    "Pedidos ilimitados",
                                    "Gestão avançada de insumos",
                                    "Calculadora Financeira (Valor/Hora)",
                                    "Notificações WhatsApp automáticas",
                                    "Suporte prioritário"
                                ]}
                                cta="Assinar Agora"
                                highlight
                                isAnnual={isAnnual}
                            />
                            <PricingCard
                                name="Ateliê Coletivo"
                                description="Para operações maiores com equipe."
                                price={isAnnual ? "R$ 79,90" : "R$ 99,90"}
                                period="mês"
                                features={[
                                    "Todos os recursos Pró",
                                    "Até 5 usuários simultâneos",
                                    "Controle de comissão",
                                    "Consultoria de precificação",
                                    "Página de vitrine personalizada"
                                ]}
                                cta="Turbinar Meu Ateliê"
                                isAnnual={isAnnual}
                            />
                        </div>
                    </div>
                </section>

                <section className="py-20">
                    <div className="container mx-auto px-6">
                        <div className="grid gap-8 rounded-3xl bg-primary px-8 py-10 text-primary-foreground md:grid-cols-[1.2fr_0.8fr] md:items-center">
                            <div className="space-y-4">
                                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-foreground/70">Comece agora</p>
                                <h2 className="text-3xl font-black sm:text-4xl">
                                    Pronta para ganhar horas de produção toda semana?
                                </h2>
                                <p className="text-primary-foreground/80">
                                    Faça o cadastro e veja sua operação mais leve, previsível e lucrativa.
                                </p>
                            </div>
                            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                                <Link
                                    href="/register"
                                    className="inline-flex items-center justify-center gap-2 rounded-full bg-background px-6 py-3 text-base font-semibold text-foreground transition hover:-translate-y-0.5"
                                >
                                    Criar conta gratuita
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                                <div className="flex items-center gap-2 text-sm text-primary-foreground/80">
                                    <Clock className="h-4 w-4" />
                                    Leva menos de 2 minutos
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="bg-card py-16 border-t border-border/60">
                <div className="container mx-auto px-6">
                    <div className="grid md:grid-cols-4 gap-12 mb-12">
                        <div className="col-span-2 space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold">A</div>
                                <span className="text-2xl font-black text-foreground tracking-tighter">AteliêFácil</span>
                            </div>
                            <p className="text-muted-foreground font-medium max-w-sm leading-relaxed text-base">
                                Do controle financeiro à comunicação com clientes, criamos a plataforma para artesãos que querem crescer com calma e clareza.
                            </p>
                        </div>
                        <div>
                            <h4 className="text-lg font-black text-foreground mb-4 tracking-tight">Produto</h4>
                            <ul className="space-y-3 text-muted-foreground font-medium">
                                <li><Link href="#funcionalidades" className="hover:text-foreground">Funcionalidades</Link></li>
                                <li><Link href="#planos" className="hover:text-foreground">Planos</Link></li>
                                <li><Link href="/login" className="hover:text-foreground">Fazer Login</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-lg font-black text-foreground mb-4 tracking-tight">Conteúdo</h4>
                            <ul className="space-y-3 text-muted-foreground font-medium">
                                <li><Link href="/about" className="hover:text-foreground">Sobre nós</Link></li>
                                <li><Link href="#" className="hover:text-foreground">Guia de precificação</Link></li>
                                <li><Link href="#" className="hover:text-foreground">Academia do artesão</Link></li>
                            </ul>
                        </div>
                    </div>
                    <div className="pt-8 border-t border-border/60 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-muted-foreground/70 font-bold text-xs uppercase tracking-widest leading-none">
                            © 2024 AteliêFácil. Todos os direitos reservados.
                        </p>
                        <div className="flex gap-6 text-muted-foreground/70 font-bold text-xs uppercase tracking-widest leading-none">
                            <Link href="#" className="hover:text-foreground">Privacidade</Link>
                            <Link href="#" className="hover:text-foreground">Termos</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
