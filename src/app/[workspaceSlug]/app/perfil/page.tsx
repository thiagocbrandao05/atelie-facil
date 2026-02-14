import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { User, Mail, Shield, Crown, BadgeCheck, Lock } from 'lucide-react'
import { ProfileForm } from '@/components/profile-form'
import { getCurrentTenantPlan } from '@/features/subscription/actions'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export default async function ProfilePage() {
  const [user, tenantInfo] = await Promise.all([
    getCurrentUser(),
    getCurrentTenantPlan()
  ])

  if (!user) {
    redirect('/login')
  }

  const { plan, profile } = tenantInfo
  const planName = plan.split('_')[0].toUpperCase()
  const isPremium = plan.includes('premium')

  return (
    <div className="animate-in fade-in space-y-8 duration-500 max-w-5xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-primary font-serif text-3xl font-black tracking-tight italic">
          Meu Perfil
        </h1>
        <p className="text-muted-foreground text-sm font-medium">
          Gerencie suas informações pessoais e de acesso ao Atelis.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-[320px_1fr]">
        <div className="space-y-6">
          {/* User Card */}
          <Card className="overflow-hidden border-white/40 shadow-xl backdrop-blur-xl bg-white/80 rounded-2xl">
            <div className="bg-primary/5 h-24 w-full relative">
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                <div className="bg-white p-1.5 rounded-full shadow-lg">
                  <div className="bg-primary text-primary-foreground flex h-20 w-20 items-center justify-center rounded-full text-3xl font-black italic shadow-inner">
                    {user.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                </div>
              </div>
            </div>

            <CardHeader className="pt-12 pb-4 text-center">
              <CardTitle className="font-black tracking-tight text-xl">{user.name || 'Usuário'}</CardTitle>
              <CardDescription className="font-medium text-xs">{user.email}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 pb-6">
              <div className="bg-primary/10 border border-primary/20 flex items-center gap-3 rounded-2xl p-4 shadow-sm">
                <div className="bg-primary text-primary-foreground rounded-xl p-2 shadow-md">
                  {isPremium ? <Crown size={18} /> : <BadgeCheck size={18} />}
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Seu Plano</span>
                  <span className="text-sm font-black text-primary">Plano {planName}</span>
                </div>
              </div>

              <div className="bg-secondary/30 border border-secondary/50 flex items-center gap-3 rounded-2xl p-4">
                <div className="bg-secondary text-secondary-foreground rounded-xl p-2">
                  <User size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Perfil</span>
                  <span className="text-sm font-black">
                    {profile === 'RESELLER' ? '🛒 Revendedor' : '🎨 Artesão'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 space-y-3">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-primary/60">Segurança</h4>
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
              <Lock size={12} />
              Sua conta está protegida
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="space-y-6">
          <Card className="border-white/40 shadow-xl backdrop-blur-xl bg-white/80 rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-muted/20 bg-muted/5">
              <CardTitle className="font-serif text-lg italic font-black">Informações do Perfil</CardTitle>
              <CardDescription className="text-xs font-medium">Atualize seu nome e e-mail de acesso.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ProfileForm
                user={{
                  name: user.name || null,
                  email: user.email || '',
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
