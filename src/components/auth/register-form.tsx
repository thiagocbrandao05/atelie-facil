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
                    className="bg-card/80 border-border focus:border-primary focus:ring-primary/20 transition-all"
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
                    className="bg-card/80 border-border focus:border-primary focus:ring-primary/20 transition-all"
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
                    className="bg-card/80 border-border focus:border-primary focus:ring-primary/20 transition-all"
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
                    className="bg-card/80 border-border focus:border-primary focus:ring-primary/20 transition-all"
                />
            </div>

            <div className="min-h-[20px] text-red-500 text-sm text-center">
                {errorMessage && <p>{errorMessage}</p>}
            </div>

            <Button
                className="w-full h-11 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
                aria-disabled={isPending}
            >
                {isPending ? 'Criando conta...' : 'Criar conta grátis'}
            </Button>
        </form>
    )
}

