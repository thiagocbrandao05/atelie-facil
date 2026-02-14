import { LandingNavbar } from '@/components/landing/navbar'
import Link from 'next/link'
import { ArrowLeft, Check, Sparkles } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="bg-background min-h-screen selection:bg-primary/20 selection:text-primary flex flex-col">
      <LandingNavbar />

      <main className="flex-1 container mx-auto px-6 pt-32 pb-20 max-w-4xl">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground mb-8 inline-flex items-center gap-2 font-bold transition-all hover:-translate-x-1"
        >
          <ArrowLeft size={16} />
          <span>Voltar ao início</span>
        </Link>

        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-bold tracking-widest text-primary uppercase">
            <Sparkles className="h-3.5 w-3.5" />
            Nossa Missão
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-foreground sm:text-6xl">
            Feito por quem entende <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">o valor do feito à mão.</span>
          </h1>
        </div>

        <div className="mt-12 space-y-8 text-lg leading-relaxed font-medium text-muted-foreground">
          <p>
            O <strong className="font-black text-foreground">Atelis</strong> nasceu da necessidade de
            simplificar a gestão de pequenos ateliês e negócios criativos. Sabemos que quem trabalha
            com artesanato e produção manual muitas vezes perde horas preciosas tentando organizar
            pedidos, calcular custos e gerenciar o estoque.
          </p>

          <p>
            Nossa missão é devolver esse tempo para você, automatizando a parte burocrática para que
            você possa focar no que realmente importa:{' '}
            <strong className="text-accent font-black">criar</strong>.
          </p>

          <div className="glass-card mt-12 p-8 rounded-3xl border-primary/10">
            <h2 className="mb-6 text-2xl font-black tracking-tight text-foreground">O que oferecemos?</h2>
            <ul className="grid gap-4 sm:grid-cols-2">
              {[
                'Controle total de estoque de materiais',
                'Gestão de pedidos e prazos de entrega',
                'Precificação automática com margem real',
                'Cadastro de clientes e histórico',
                'Relatórios de saúde do negócio',
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-base">
                  <div className="bg-primary/10 p-1 rounded-full text-primary">
                    <Check size={14} strokeWidth={3} />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <p className="border-t border-border/60 pt-12 font-bold italic text-foreground/80">
            "Desenvolvido com carinho para artesãos que querem profissionalizar seu negócio sem
            perder a essência da arte."
          </p>
        </div>
      </main>

      <footer className="bg-card border-t border-border/60 py-12 mt-auto">
        <div className="container mx-auto px-6 text-center text-sm font-bold uppercase tracking-widest text-muted-foreground/60">
          © 2026 Atelis. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  )
}
