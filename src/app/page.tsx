"use client"

import { useState } from "react"
import Link from "next/link"
import {
    ArrowRight,
    Check,
    Package,
    BarChart3,
    ShieldCheck,
    MessageSquare,
    CreditCard,
    Clock,
    Sparkles,
    Zap
} from "lucide-react"
import { LandingNavbar } from "@/components/landing/navbar"
import { PricingCard } from "@/components/landing/pricing-card"
import { cn } from "@/lib/utils"

export default function LandingPage() {
    const [isAnnual, setIsAnnual] = useState(true)

    return (
        <div className="flex flex-col min-h-screen bg-[#F5F4F0] selection:bg-[#455448]/20 selection:text-[#455448]">
            <LandingNavbar />

            <main className="flex-1">
                {/* --- HERO SECTION --- */}
                <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                    {/* Subtle grainy gradients */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full opacity-30 pointer-events-none overflow-hidden">
                        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#455448]/10 blur-[120px]" />
                        <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] rounded-full bg-[#9C4A2F]/10 blur-[100px]" />
                    </div>

                    <div className="container relative z-10 mx-auto px-6 text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#455448]/5 border border-[#455448]/10 text-[#455448] text-xs font-black uppercase tracking-widest mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>A Revolução da Gestão Criativa</span>
                        </div>

                        <h1 className="text-6xl lg:text-8xl font-black text-[#455448] tracking-tighter mb-8 leading-[0.9] max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                            Transforme sua paixão <br />
                            <span className="text-[#9C4A2F]">em um negócio lucrativo.</span>
                        </h1>

                        <p className="text-xl lg:text-2xl text-[#455448]/70 mb-12 max-w-2xl mx-auto font-medium leading-relaxed animate-in fade-in slide-in-from-bottom-12 duration-700 delay-200">
                            O AteliêFácil simplifica seu estoque, precificação e pedidos para você focar no que realmente importa: **criar**.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-5 animate-in fade-in slide-in-from-bottom-16 duration-700 delay-300">
                            <Link
                                href="/register"
                                className="w-full sm:w-auto px-10 py-5 rounded-[2rem] bg-[#455448] text-white font-black text-xl shadow-2xl shadow-[#455448]/20 hover:scale-105 transition-all text-center flex items-center justify-center gap-2"
                            >
                                Experimentar Grátis
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link
                                href="#features"
                                className="w-full sm:w-auto px-10 py-5 rounded-[2rem] bg-white text-[#455448] font-black text-xl border border-[#455448]/10 hover:bg-[#F5F4F0] transition-all text-center"
                            >
                                Conhecer Recursos
                            </Link>
                        </div>

                        {/* Mockup Dashboard Preview */}
                        <div className="mt-24 relative max-w-6xl mx-auto group animate-in fade-in slide-in-from-bottom-24 duration-1000 delay-500">
                            <div className="absolute inset-0 bg-[#455448]/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
                            <div className="relative rounded-[3rem] bg-white p-3 shadow-2xl border border-[#455448]/5">
                                {/* Simplified Styled Mockup */}
                                <div className="bg-[#F5F4F0] rounded-[2.2rem] overflow-hidden aspect-[16/9] relative border border-[#455448]/10">
                                    <div className="absolute inset-0 grid grid-cols-[260px_1fr]">
                                        <div className="bg-white border-r border-[#455448]/5 p-8 flex flex-col gap-6">
                                            <div className="w-12 h-12 rounded-xl bg-[#455448]/10" />
                                            <div className="space-y-3">
                                                <div className="h-10 w-full bg-[#455448] rounded-xl" />
                                                <div className="h-10 w-full bg-[#455448]/5 rounded-xl" />
                                                <div className="h-10 w-full bg-[#455448]/5 rounded-xl" />
                                            </div>
                                        </div>
                                        <div className="p-12 space-y-10">
                                            <div className="flex justify-between items-center">
                                                <div className="h-10 w-64 bg-[#455448]/10 rounded-xl" />
                                                <div className="flex gap-3">
                                                    <div className="h-10 w-10 bg-white rounded-full border border-[#455448]/5 shadow-sm" />
                                                    <div className="h-10 w-32 bg-[#9C4A2F] rounded-xl shadow-lg" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-3 gap-6">
                                                <div className="h-44 bg-white rounded-3xl border border-[#455448]/5 shadow-xl shadow-black/5" />
                                                <div className="h-44 bg-[#455448] rounded-3xl" />
                                                <div className="h-44 bg-[#9C4A2F] rounded-3xl" />
                                            </div>
                                            <div className="h-64 bg-white rounded-3xl border border-[#455448]/5 shadow-xl shadow-black/5" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- FEATURES BENTO GRID --- */}
                <section id="funcionalidades" className="py-32 bg-white">
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-24">
                            <h2 className="text-4xl lg:text-6xl font-black text-[#455448] tracking-tight mb-6">
                                Tudo o que seu ateliê precisa.
                            </h2>
                            <p className="text-xl text-[#455448]/60 max-w-2xl mx-auto font-medium">
                                Desenvolvemos ferramentas específicas para o fluxo de trabalho de um artesão moderno.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[300px]">
                            {/* Feature 1: Stock */}
                            <div className="md:col-span-8 bg-[#F5F4F0] rounded-[2.5rem] p-10 flex flex-col justify-end group transition-transform hover:-translate-y-1 shadow-sm">
                                <div className="absolute top-10 right-10 w-20 h-20 bg-[#455448] rounded-3xl flex items-center justify-center text-white rotate-12 group-hover:rotate-0 transition-transform shadow-2xl">
                                    <Package className="w-10 h-10" />
                                </div>
                                <h3 className="text-3xl font-black text-[#455448] mb-4 tracking-tighter">Estoque Inteligente</h3>
                                <p className="text-lg text-[#455448]/70 font-medium max-w-md">
                                    Controle de materiais por unidade de medida, alertas de reposição e baixa automática ao concluir pedidos.
                                </p>
                            </div>

                            {/* Feature 2: Finance */}
                            <div className="md:col-span-4 bg-[#455448] rounded-[2.5rem] p-10 text-white flex flex-col justify-end overflow-hidden group transition-transform hover:-translate-y-1">
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000" />
                                <BarChart3 className="w-12 h-12 mb-6 text-[#9C4A2F]" />
                                <h3 className="text-3xl font-black mb-4 tracking-tighter">Precificação Ninja</h3>
                                <p className="text-lg opacity-80 font-medium leading-tight">
                                    Calcule seu lucro real baseando-se no custo de materiais e no valor do seu tempo.
                                </p>
                            </div>

                            {/* Feature 3: WhatsApp */}
                            <div className="md:col-span-4 bg-[#9C4A2F] rounded-[2.5rem] p-10 text-white flex flex-col justify-end group transition-transform hover:-translate-y-1">
                                <MessageSquare className="w-12 h-12 mb-6 text-white" />
                                <h3 className="text-3xl font-black mb-4 tracking-tighter">WhatsApp Pró</h3>
                                <p className="text-lg opacity-80 font-medium leading-tight">
                                    Envie notificações automáticas e orçamentos elegantes diretamente para o celular do cliente.
                                </p>
                            </div>

                            {/* Feature 4: Safety */}
                            <div className="md:col-span-8 bg-[#F5F4F0] border-2 border-[#455448]/5 rounded-[2.5rem] p-10 flex flex-col justify-center group transition-transform hover:-translate-y-1">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 bg-[#455448]/5 rounded-[2rem] flex items-center justify-center text-[#455448]">
                                        <ShieldCheck className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h3 className="text-3xl font-black text-[#455448] tracking-tighter">Segurança & Backup</h3>
                                        <p className="text-lg text-[#455448]/70 font-medium max-w-md">
                                            Seus dados residem em servidores ultra-seguros com backup diário automático. Nunca perca um contato.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- PRICING SECTION --- */}
                <section id="planos" className="py-32 bg-[#F5F4F0]">
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-20">
                            <h2 className="text-4xl lg:text-6xl font-black text-[#455448] tracking-tight mb-8">
                                Planos para artesãos de elite.
                            </h2>

                            {/* Billing Toggle */}
                            <div className="inline-flex items-center p-1.5 gap-1 bg-[#455448]/5 rounded-2xl border border-[#455448]/10">
                                <button
                                    onClick={() => setIsAnnual(false)}
                                    className={cn(
                                        "px-6 py-2.5 rounded-xl text-sm font-black transition-all",
                                        !isAnnual ? "bg-[#455448] text-white shadow-xl" : "text-[#455448]/60 hover:text-[#455448]"
                                    )}
                                >
                                    Mensal
                                </button>
                                <button
                                    onClick={() => setIsAnnual(true)}
                                    className={cn(
                                        "relative px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2",
                                        isAnnual ? "bg-[#455448] text-white shadow-xl" : "text-[#455448]/60 hover:text-[#455448]"
                                    )}
                                >
                                    Anual
                                    <span className="bg-[#9C4A2F] text-white text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse">
                                        -20% OFF
                                    </span>
                                </button>
                            </div>
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
                                period={isAnnual ? "mês" : "mês"}
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
                                period={isAnnual ? "mês" : "mês"}
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

                {/* --- CALL TO ACTION --- */}
                <section className="py-32 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[#455448] z-0" />
                    {/* Noise effect */}
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 z-0 bg-repeat pointer-events-none" />

                    <div className="container relative z-10 mx-auto px-6 text-center text-white">
                        <Zap className="w-16 h-16 mx-auto mb-10 text-[#9C4A2F] animate-bounce" />
                        <h2 className="text-4xl lg:text-7xl font-black tracking-tighter mb-10 max-w-4xl mx-auto leading-none">
                            Pronto para economizar horas de trabalho burocrático?
                        </h2>
                        <Link
                            href="/register"
                            className="inline-flex items-center gap-4 px-12 py-6 rounded-[2.5rem] bg-[#F5F4F0] text-[#455448] font-black text-2xl hover:scale-105 transition-all shadow-2xl shadow-black/40"
                        >
                            Começar minha jornada grátis
                            <ArrowRight className="w-8 h-8" />
                        </Link>
                        <p className="mt-10 text-white/50 font-bold uppercase tracking-[0.2em] text-sm">
                            Sem cartão de crédito necessário • Crie sua conta em 30 segundos
                        </p>
                    </div>
                </section>
            </main>

            <footer className="bg-white py-20 border-t border-[#455448]/5">
                <div className="container mx-auto px-6">
                    <div className="grid md:grid-cols-4 gap-16 mb-20">
                        <div className="col-span-2 space-y-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#455448] flex items-center justify-center text-white font-bold">A</div>
                                <span className="text-2xl font-black text-[#455448] tracking-tighter">AteliêFácil</span>
                            </div>
                            <p className="text-[#455448]/60 font-medium max-w-sm leading-relaxed text-lg">
                                Nascemos da mão de artesãos para artesãos. Nossa missão é democratizar a gestão profissional para quem cria com o coração.
                            </p>
                        </div>
                        <div>
                            <h4 className="text-lg font-black text-[#455448] mb-6 tracking-tight">Software</h4>
                            <ul className="space-y-4 text-[#455448]/60 font-medium">
                                <li><Link href="#funcionalidades" className="hover:text-[#455448]">Recursos</Link></li>
                                <li><Link href="#planos" className="hover:text-[#455448]">Preços</Link></li>
                                <li><Link href="/login" className="hover:text-[#455448]">Fazer Login</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-lg font-black text-[#455448] mb-6 tracking-tight">Comunidade</h4>
                            <ul className="space-y-4 text-[#455448]/60 font-medium">
                                <li><Link href="/about" className="hover:text-[#455448]">Sobre Nós</Link></li>
                                <li><Link href="#" className="hover:text-[#455448]">Dicas de Precificação</Link></li>
                                <li><Link href="#" className="hover:text-[#455448]">Manual do Artesão</Link></li>
                            </ul>
                        </div>
                    </div>
                    <div className="pt-10 border-t border-[#455448]/5 flex flex-col md:flex-row justify-between items-center gap-6">
                        <p className="text-[#455448]/40 font-bold text-sm uppercase tracking-widest leading-none">
                            © 2024 AteliêFácil. Desenvolvido com carinho.
                        </p>
                        <div className="flex gap-8 text-[#455448]/40 font-bold text-sm uppercase tracking-widest leading-none">
                            <Link href="#" className="hover:text-[#455448]">Privacidade</Link>
                            <Link href="#" className="hover:text-[#455448]">Termos</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
