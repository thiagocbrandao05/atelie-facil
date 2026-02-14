import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { LoginForm } from '@/components/auth/login-form'

export default function LoginPage() {
  return (
    <div className="bg-background relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0">
        <div className="bg-primary/15 absolute top-[-10%] right-[-10%] h-[500px] w-[500px] animate-pulse rounded-full blur-3xl" />
        <div className="bg-accent/15 absolute bottom-[-10%] left-[-10%] h-[500px] w-[500px] animate-pulse rounded-full blur-3xl delay-1000" />
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        <div className="animate-fade-in-up mb-8 text-center">
          <Link
            href="/"
            className="text-muted-foreground hover:text-primary mb-6 inline-flex items-center gap-2 transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Voltar ao início</span>
          </Link>

          <div className="mb-4 flex justify-center">
            <div className="bg-primary text-primary-foreground flex h-12 w-12 items-center justify-center rounded-xl font-bold shadow-lg">
              <span className="text-xl">A</span>
            </div>
          </div>
          <h1 className="text-foreground text-3xl font-bold tracking-tight">Bem-vindo de volta</h1>
          <p className="text-muted-foreground mt-2">Acesse seu ateliê digital</p>
        </div>

        <div
          className="bg-card/90 border-border/60 animate-fade-in-up rounded-2xl border p-8 shadow-2xl backdrop-blur-xl"
          style={{ animationDelay: '0.1s' }}
        >
          <LoginForm />

          <div className="text-muted-foreground mt-6 text-center text-sm">
            Ainda não tem uma conta?{' '}
            <Link
              href="/?signup=true"
              className="text-primary hover:text-primary/80 font-semibold hover:underline"
            >
              Criar conta grátis
            </Link>
          </div>
        </div>

        <p className="text-muted-foreground/70 mt-8 text-center text-xs">
          &copy; 2026 Atelis. Gestão inteligente.
        </p>
      </div>
    </div>
  )
}
