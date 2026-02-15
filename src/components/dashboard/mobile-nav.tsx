'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, LogOut, User, Settings, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { getVisibleAppNavItems } from '@/lib/app-navigation'
import { buildWorkspaceAppPath } from '@/lib/workspace-path'
import { PlanType } from '@/features/subscription/types'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

type MobileNavUser = {
  name?: string | null
  tenant?: { plan?: string | null } | null
} | null

export function AppMobileNav({ user }: { user?: MobileNavUser }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const plan = (user?.tenant?.plan as PlanType) || 'free_creative'
  const links = getVisibleAppNavItems(plan).map(item => ({
    ...item,
    href: buildWorkspaceAppPath('', item.appPath),
  }))

  async function handleLogout() {
    await supabase.auth.signOut()
    setOpen(false)
    router.push('/login')
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="Abrir menu de navegação"
          className="hover:bg-secondary rounded-xl p-2 transition-colors"
        >
          <Menu size={24} />
        </button>
      </DialogTrigger>
      <DialogContent className="top-0 left-0 h-dvh w-[84vw] max-w-xs translate-x-0 translate-y-0 rounded-none border-y-0 border-l-0 p-0 sm:max-w-xs [&>button]:hidden">
        <DialogTitle className="sr-only">Menu principal</DialogTitle>
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b px-4 py-4">
            <div className="text-primary text-xl font-black tracking-tight">Atelis</div>
            <button
              type="button"
              aria-label="Fechar menu"
              onClick={() => setOpen(false)}
              className="hover:bg-secondary rounded-xl p-2 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto p-3">
            {links.map(item => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-primary/10'
                  }`}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          <div className="space-y-2 border-t p-3">
            <Link
              href={buildWorkspaceAppPath('', '/perfil')}
              onClick={() => setOpen(false)}
              className="hover:bg-secondary flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-colors"
            >
              <User size={18} />
              Perfil
            </Link>
            <Link
              href={buildWorkspaceAppPath('', '/configuracoes')}
              onClick={() => setOpen(false)}
              className="hover:bg-secondary flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-colors"
            >
              <Settings size={18} />
              Configurações
            </Link>
            <Button
              type="button"
              variant="ghost"
              onClick={handleLogout}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive min-h-11 w-full justify-start px-3"
            >
              <LogOut size={18} />
              Sair
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
