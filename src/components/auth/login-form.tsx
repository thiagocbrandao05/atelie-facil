'use client'

import { useActionState } from 'react'
import { authenticate } from '@/features/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

export function LoginForm() {
    const [errorMessage, dispatch, isPending] = useActionState(
        authenticate,
        undefined,
    )

    return (
        <form action={dispatch} className="space-y-6">
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
                <div className="flex justify-between items-center">
                    <Label htmlFor="password">Senha</Label>
                    <Link href="#" className="text-xs text-primary hover:underline">
                        Esqueceu a senha?
                    </Link>
                </div>
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
                {isPending ? 'Entrando...' : 'Entrar'}
            </Button>
        </form>
    )
}

