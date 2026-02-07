'use client'

import { useActionState } from 'react'
import { register } from '@/features/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

export function RegisterForm() {
    const [errorMessage, dispatch, isPending] = useActionState(
        register,
        undefined,
    )

    return (
        <form action={dispatch} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">Seu Nome</Label>
                <Input
                    id="name"
                    type="text"
                    name="name"
                    placeholder="Maria Silva"
                    required
                    className="bg-white/50 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 transition-all"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="storeName">Nome do Ateliê</Label>
                <Input
                    id="storeName"
                    type="text"
                    name="storeName"
                    placeholder="Ateliê Mágico"
                    required
                    className="bg-white/50 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 transition-all"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="seu@email.com"
                    required
                    className="bg-white/50 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 transition-all"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                    id="password"
                    type="password"
                    name="password"
                    placeholder="••••••"
                    required
                    minLength={6}
                    className="bg-white/50 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 transition-all"
                />
            </div>

            <div className="min-h-[20px] text-red-500 text-sm text-center">
                {errorMessage && <p>{errorMessage}</p>}
            </div>

            <Button
                className="w-full h-11 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-200 transition-all hover:scale-[1.02]"
                aria-disabled={isPending}
            >
                {isPending ? 'Criando conta...' : 'Criar conta grátis'}
            </Button>
        </form>
    )
}


