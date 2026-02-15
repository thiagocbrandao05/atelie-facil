'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

export default function RecoverPasswordPage() {
  const [email, setEmail] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsPending(true)
    setMessage(null)
    setError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      })

      if (error) {
        setError(error.message || 'Não foi possível enviar o e-mail de recuperação.')
        return
      }

      setMessage('Enviamos um e-mail com instruções para redefinir sua senha.')
    } catch (err) {
      setError('Não foi possível enviar o e-mail de recuperação.')
    } finally {
      setIsPending(false)
    }
  }

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
            Informe seu e-mail para receber o link de recuperação.
          </p>
        </div>

        <div className="bg-card/90 border-border/60 rounded-2xl border p-8 shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={event => setEmail(event.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>

            {message ? <p className="text-sm text-emerald-600">{message}</p> : null}
            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <Button type="submit" disabled={isPending} className="h-11 w-full">
              {isPending ? 'Enviando...' : 'Enviar link de recuperação'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
