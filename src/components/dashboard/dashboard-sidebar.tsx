'use client'

import { usePathname, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Truck,
  BarChart3,
  User,
  Settings,
  LogOut,
  Banknote,
  Sparkles,
  Inbox,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PlanType } from '@/features/subscription/types'
import { hasFeature, isReseller } from '@/features/subscription/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  {
    href: '/dashboard/estoque',
    label: 'Estoque MP',
    icon: Package,
    profile: 'CREATIVE' as const
  },
  {
    href: '/dashboard/estoque-produtos',
    label: 'Estoque Pronta-Entrega',
    icon: Inbox,
    feature: 'INVENTORY_FINISHED' as const
  },
  { href: '/dashboard/produtos', label: 'Produtos', icon: ShoppingCart },
  { href: '/dashboard/clientes', label: 'Clientes', icon: Users },
  { href: '/dashboard/pedidos', label: 'Pedidos', icon: ShoppingCart },
  {
    href: '/dashboard/financeiro',
    label: 'Financeiro',
    icon: Banknote,
    feature: 'FINANCIAL' as const
  },
  {
    href: '/dashboard/automacoes',
    label: 'Automações IA',
    icon: Sparkles,
    feature: 'AI_INSIGHTS' as const
  },
  { href: '/dashboard/fornecedores', label: 'Fornecedores', icon: Truck },
  {
    href: '/dashboard/relatorios',
    label: 'Relatórios',
    icon: BarChart3,
    feature: 'REPORTS_ADVANCED' as const
  },
]

export function DashboardSidebar({
  user,
}: {
  user?: {
    name?: string | null;
    email?: string | null;
    tenant?: { slug: string, plan: string, profile: string }
  } | null
}) {
  const pathname = usePathname()
  const params = useParams()
  const userName = user?.name || 'Usuário'
  const userInitials = userName.substring(0, 2).toUpperCase()
  const slug = (params.workspaceSlug as string) || user?.tenant?.slug || 'atelis'
  const plan = (user?.tenant?.plan as PlanType) || 'free_creative'

  const filteredItems = navItems.filter(item => {
    // Se o item exige um perfil específico (ex: Estoque MP só para Creative)
    if (item.profile === 'CREATIVE' && isReseller(plan)) return false

    // Se o item exige uma feature específica
    if (item.feature && !hasFeature(plan, item.feature as any)) return false

    return true
  })

  const links = filteredItems.map(item => ({
    ...item,
    href: item.href === '/dashboard'
      ? `/${slug}/app/dashboard`
      : `/${slug}/app${item.href.replace('/dashboard', '')}`,
  }))

  return (
    <aside className="fixed left-5 top-5 bottom-5 z-50 hidden w-16 flex-col items-center justify-between rounded-2xl border border-white/20 bg-white/60 py-6 backdrop-blur-xl transition-all duration-500 hover:w-64 group/sidebar md:flex shadow-2xl shadow-primary/5">
      <div className="flex w-full flex-col items-center gap-8">
        <Link href={`/${slug}/app/dashboard`} className="relative flex items-center justify-center">
          <div className="bg-primary text-primary-foreground flex h-10 w-10 items-center justify-center rounded-xl font-black shadow-lg transition-transform hover:rotate-6 hover:scale-105">
            A
          </div>
          <span className="text-foreground absolute left-14 overflow-hidden whitespace-nowrap text-lg font-black tracking-tighter opacity-0 transition-all duration-500 group-hover/sidebar:opacity-100">
            Atelis
          </span>
        </Link>

        <nav className="flex w-full flex-col items-center gap-1.5 px-2">
          {links.map(item => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                className={`group/item relative flex h-10 w-full items-center gap-3 rounded-xl px-2.5 transition-all duration-300 ${isActive
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/10'
                  : 'text-muted-foreground hover:bg-primary/5 hover:text-primary'
                  }`}
              >
                <item.icon
                  size={20}
                  className={`shrink-0 transition-transform group-hover/item:scale-105 ${isActive ? 'scale-105' : ''}`}
                />
                <span className={`overflow-hidden whitespace-nowrap text-[13px] font-bold opacity-0 transition-all duration-500 group-hover/sidebar:opacity-100 ${isActive ? 'translate-x-0' : '-translate-x-1'}`}>
                  {item.label}
                </span>

                {!isActive && (
                  <div className="absolute left-full ml-4 scale-0 rounded-lg bg-foreground px-2 py-1 text-[10px] text-background transition-all group-hover/item:group-hover/sidebar:hidden group-hover/item:scale-100">
                    {item.label}
                  </div>
                )}

                {isActive && (
                  <div className="bg-primary-foreground absolute -right-0.5 h-1 w-1 rounded-full shadow-glow group-hover/sidebar:opacity-0" />
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="w-full px-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={`${pathname.includes('configuracoes') ? 'bg-primary text-primary-foreground' : 'bg-primary/5 text-primary'} flex h-12 w-full cursor-pointer items-center gap-3 overflow-hidden rounded-xl p-1.5 transition-all hover:scale-105 active:scale-95`}>
              <div className="bg-primary-foreground/20 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-bold backdrop-blur-md">
                {userInitials}
              </div>
              <div className="flex flex-col items-start overflow-hidden whitespace-nowrap opacity-0 transition-all duration-500 group-hover/sidebar:opacity-100">
                <span className="text-[10px] font-black uppercase tracking-tight truncate max-w-[120px]">{userName}</span>
                <span className="text-[8px] opacity-70">
                  Tier: {plan.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 rounded-2xl p-2 shadow-2xl backdrop-blur-xl" align="start" side="right" sideOffset={15}>
            <div className="mb-1 px-2 pb-1">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Minha Conta</p>
            </div>
            <DropdownMenuItem asChild className="rounded-lg p-2.5 focus:bg-primary/10">
              <Link href={`/${slug}/app/perfil`} className="flex w-full cursor-pointer items-center text-sm font-bold">
                <User className="mr-3 h-3.5 w-3.5" />
                <span>Perfil</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="rounded-lg p-2.5 focus:bg-primary/10">
              <Link href={`/${slug}/app/configuracoes`} className="flex w-full cursor-pointer items-center text-sm font-bold">
                <Settings className="mr-3 h-3.5 w-3.5" />
                <span>Estilos e Ajustes</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1.5 opacity-50" />
            <DropdownMenuItem asChild className="rounded-lg bg-primary/10 p-2.5 text-primary focus:bg-primary/20">
              <Link href={`/${slug}/app/upgrade`} className="flex w-full cursor-pointer items-center text-sm font-black">
                <Sparkles className="mr-3 h-3.5 w-3.5 fill-primary/20" />
                <span>UPGRADE PRO</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1.5 opacity-50" />
            <DropdownMenuItem
              className="rounded-lg p-2.5 text-sm font-bold text-red-500 cursor-pointer focus:bg-red-50"
              onClick={() => (window.location.href = '/')}
            >
              <LogOut className="mr-3 h-3.5 w-3.5" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
}
