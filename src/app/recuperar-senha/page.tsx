'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { ArrowLeft, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { requestPasswordReset } from '@/features/auth/actions'

const initialState = {
  success: false,
  message: '',
} as const

export default function RecoverPasswordPage() {
  const [state, formAction, isPending] = useActionState(requestPasswordReset, initialState)

  return (
    <div className="bg-background relative flex min-h-screen items-center justify-center overflow-hidden">
      <div className="relative z-10 w-full max-w-md px-4">
        <div className="mb-8 text-center">
          <Link
            href="/login"
            className="text-muted-foreground hover:text-primary mb-6 inline-flex items-center gap-2 transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Voltar para login</span>
          </Link>
          <div className="mb-4 flex justify-center">
            <div className="bg-primary text-primary-foreground flex h-12 w-12 items-center justify-center rounded-xl font-bold shadow-lg">
              <Mail className="h-5 w-5" />
            </div>
          </div>
          <h1 className="text-foreground text-2xl font-bold tracking-tight">Recuperar senha</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Informe seu e-mail para receber o link de recuperacao.
          </p>
        </div>

        <div className="bg-card/90 border-border/60 rounded-2xl border p-8 shadow-2xl backdrop-blur-xl">
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" name="email" placeholder="seu@email.com" required />
            </div>

            {state.message ? (
              <p className={`text-sm ${state.success ? 'text-emerald-600' : 'text-red-600'}`}>
                {state.message}
              </p>
            ) : null}

            <Button type="submit" disabled={isPending} className="h-11 w-full">
              {isPending ? 'Enviando...' : 'Enviar link de recuperacao'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
