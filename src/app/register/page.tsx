import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { RegisterForm } from '@/components/auth/register-form'

export default function RegisterPage() {
    return (
        <div className="flex items-center justify-center min-h-screen relative overflow-hidden bg-[#FCFCFC]">
            {/* Animated Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-200/40 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-200/40 rounded-full blur-3xl animate-pulse delay-1000" />
            </div>

            <div className="w-full max-w-md relative z-10 px-4">
                <div className="mb-8 text-center animate-fade-in-up">
                    <Link href="/" className="inline-flex items-center gap-2 mb-6 text-gray-500 hover:text-purple-600 transition-colors">
                        <ArrowLeft size={16} />
                        <span>Voltar ao início</span>
                    </Link>

                    <div className="flex justify-center mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg">
                            <span className="text-xl">A</span>
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Crie sua conta</h1>
                    <p className="text-gray-500 mt-2">Comece a transformar seu ateliê hoje</p>
                </div>

                <div className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-2xl rounded-2xl p-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    <RegisterForm />

                    <div className="mt-6 text-center text-sm text-gray-500">
                        Já tem uma conta?{' '}
                        <Link href="/login" className="font-semibold text-purple-600 hover:text-purple-700 hover:underline">
                            Entrar
                        </Link>
                    </div>
                </div>

                <p className="text-center text-xs text-gray-400 mt-8">
                    &copy; 2024 AteliêFácil. Gestão inteligente.
                </p>
            </div>
        </div>
    )
}


