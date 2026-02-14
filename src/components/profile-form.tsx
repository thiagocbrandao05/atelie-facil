'use client'

import { updateProfile, updatePassword } from '@/features/settings/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Mail, Lock, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react'
import { useFormHandler } from '@/hooks/use-form-handler'


interface ProfileFormProps {
  user: {
    name: string | null
    email: string
  }
}

export function ProfileForm({ user }: ProfileFormProps) {
  const { state: profileState, formAction: profileAction, isPending: isProfilePending } = useFormHandler(updateProfile)
  const { state: passwordState, formAction: passwordAction, isPending: isPasswordPending } = useFormHandler(updatePassword)

  return (
    <div className="space-y-12">
      {/* Basic Info Form */}
      <form action={profileAction} className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest opacity-80 text-primary/80">Nome Completo</Label>
            <div className="relative group">
              <User className="text-primary/40 absolute top-1/2 -translate-y-1/2 left-4 h-4 w-4 transition-colors group-focus-within:text-primary" />
              <Input
                id="name"
                name="name"
                defaultValue={user.name || ''}
                className="pl-11 h-12 rounded-xl border-muted/30 focus:border-primary/50 focus:ring-primary/10 transition-all bg-white shadow-sm"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest opacity-80 text-primary/80">E-mail</Label>
            <div className="relative group">
              <Mail className="text-primary/40 absolute top-1/2 -translate-y-1/2 left-4 h-4 w-4 transition-colors group-focus-within:text-primary" />
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={user.email || ''}
                className="pl-11 h-12 rounded-xl border-muted/30 focus:border-primary/50 focus:ring-primary/10 transition-all bg-white shadow-sm"
                required
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-muted/10 pt-6">
          <div className="flex-1">
            {profileState?.message && (
              <div className={`flex items-center gap-2 text-sm font-bold ${profileState.success ? 'text-green-600' : 'text-red-600'} animate-in slide-in-from-left-2`}>
                {profileState.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                {profileState.message}
              </div>
            )}
          </div>
          <Button
            type="submit"
            disabled={isProfilePending}
            className="h-10 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 transition-all hover:scale-105"
          >
            {isProfilePending ? 'Salvando...' : 'Atualizar Perfil'}
          </Button>
        </div>
      </form>

      {/* Password Change Section */}
      <div className="pt-8 border-t border-muted/20">
        <div className="mb-6">
          <h3 className="font-serif text-lg italic font-black text-primary">Segurança da Conta</h3>
          <p className="text-xs font-medium text-muted-foreground mt-1">Altere sua senha periodicamente para manter sua conta segura.</p>
        </div>

        <form action={passwordAction} className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest opacity-80 text-primary/80">Nova Senha</Label>
              <div className="relative group">
                <Lock className="text-primary/40 absolute top-1/2 -translate-y-1/2 left-4 h-4 w-4 transition-colors group-focus-within:text-primary" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  className="pl-11 h-12 rounded-xl border-muted/30 focus:border-primary/50 focus:ring-primary/10 transition-all bg-white shadow-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-[10px] font-black uppercase tracking-widest opacity-80 text-primary/80">Confirmar Nova Senha</Label>
              <div className="relative group">
                <KeyRound className="text-primary/40 absolute top-1/2 -translate-y-1/2 left-4 h-4 w-4 transition-colors group-focus-within:text-primary" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  className="pl-11 h-12 rounded-xl border-muted/30 focus:border-primary/50 focus:ring-primary/10 transition-all bg-white shadow-sm"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex-1">
              {passwordState?.message && (
                <div className={`flex items-center gap-2 text-sm font-bold ${passwordState.success ? 'text-green-600' : 'text-red-600'} animate-in slide-in-from-left-2`}>
                  {passwordState.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  {passwordState.message}
                </div>
              )}
            </div>
            <Button
              type="submit"
              disabled={isPasswordPending}
              className="h-10 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/10 transition-all hover:scale-105"
            >
              {isPasswordPending ? 'Alterando...' : 'Alterar Senha'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
