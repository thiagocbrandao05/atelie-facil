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
                    className="bg-white/50 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 transition-all"
                />
            </div>
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <Label htmlFor="password">Senha</Label>
                    <Link href="#" className="text-xs text-purple-600 hover:underline">
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
                {isPending ? 'Entrando...' : 'Entrar'}
            </Button>
        </form>
    )
}


