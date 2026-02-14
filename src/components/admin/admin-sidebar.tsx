'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Users, CreditCard, ShieldAlert, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/admin/dashboard', label: 'Visão geral', icon: LayoutDashboard },
  { href: '/admin/tenants', label: 'Ateliês', icon: Users },
  { href: '/admin/billing', label: 'Assinaturas', icon: CreditCard },
  { href: '/admin/logs', label: 'Logs e auditoria', icon: ShieldAlert },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="glass sticky top-0 z-50 hidden h-screen w-64 flex-col border-r-0 shadow-sm transition-all duration-300 md:flex">
      <div className="flex items-center gap-2 p-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 font-bold text-white shadow-md">
          A
        </div>
        <span className="text-foreground text-xl font-bold tracking-tight">
          Admin <span className="text-muted-foreground text-sm font-normal">Console</span>
        </span>
      </div>

      <nav className="mt-4 flex-1 space-y-2 px-4">
        <div className="text-muted-foreground mb-2 px-2 text-xs font-semibold tracking-wider uppercase">
          Gerenciamento
        </div>
        {navItems.map(item => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                isActive
                  ? 'bg-red-50 text-red-700 shadow-sm'
                  : 'text-muted-foreground hover:bg-red-50/50 hover:text-red-600'
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon
                  size={18}
                  className={cn(
                    'transition-transform',
                    isActive ? 'scale-105' : 'group-hover:scale-105'
                  )}
                />
                {item.label}
              </div>
            </Link>
          )
        })}
      </nav>

      <div className="border-t p-4">
        <div className="bg-muted/50 mb-4 rounded-xl border p-4">
          <p className="text-muted-foreground mb-1 text-xs">Status do sistema</p>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
            <span className="text-xs font-medium text-green-600">Operacional</span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="text-muted-foreground flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-red-50 hover:text-red-700"
        >
          <LogOut size={16} />
          <span>Sair do admin</span>
        </button>
      </div>
    </aside>
  )
}
