import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { RegisterForm } from '@/components/auth/register-form'

export default function RegisterPage() {
    return (
        <div className="flex items-center justify-center min-h-screen relative overflow-hidden bg-background">
            {/* Animated Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/15 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-accent/15 rounded-full blur-3xl animate-pulse delay-1000" />
            </div>

            <div className="w-full max-w-md relative z-10 px-4">
                <div className="mb-8 text-center animate-fade-in-up">
                    <Link href="/" className="inline-flex items-center gap-2 mb-6 text-muted-foreground hover:text-primary transition-colors">
                        <ArrowLeft size={16} />
                        <span>Voltar ao início</span>
                    </Link>

                    <div className="flex justify-center mb-4">
                        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-lg">
                            <span className="text-xl">A</span>
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">Crie sua conta</h1>
                    <p className="text-muted-foreground mt-2">Comece a transformar seu ateliê hoje</p>
                </div>

                <div className="bg-card/90 backdrop-blur-xl border border-border/60 shadow-2xl rounded-2xl p-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    <RegisterForm />

                    <div className="mt-6 text-center text-sm text-muted-foreground">
                        Já tem uma conta?{' '}
                        <Link href="/login" className="font-semibold text-primary hover:text-primary/80 hover:underline">
                            Entrar
                        </Link>
                    </div>
                </div>

                <p className="text-center text-xs text-muted-foreground/70 mt-8">
                    &copy; 2024 AteliêFácil. Gestão inteligente.
                </p>
            </div>
        </div>
    )
}

