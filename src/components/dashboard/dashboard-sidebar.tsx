'use client'

import { usePathname, useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { User, Settings, LogOut, Sparkles } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PlanType } from '@/features/subscription/types'
import { createClient } from '@/lib/supabase/client'
import { getVisibleAppNavItems } from '@/lib/app-navigation'
import { buildWorkspaceAppPath } from '@/lib/workspace-path'

export function DashboardSidebar({
  user,
}: {
  user?: {
    name?: string | null
    email?: string | null
    tenant?: { slug: string; plan: string; profile: string }
  } | null
}) {
  const pathname = usePathname()
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const userName = user?.name || 'Usuário'
  const userInitials = userName.substring(0, 2).toUpperCase()
  const slug = (params.workspaceSlug as string) || user?.tenant?.slug || 'atelis'
  const plan = (user?.tenant?.plan as PlanType) || 'free_creative'

  const links = getVisibleAppNavItems(plan).map(item => ({
    ...item,
    href: buildWorkspaceAppPath(slug, item.appPath),
  }))

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="group/sidebar shadow-primary/5 fixed top-5 bottom-5 left-5 z-50 hidden w-16 flex-col items-center justify-between rounded-2xl border border-white/20 bg-white/60 py-6 shadow-2xl backdrop-blur-xl transition-all duration-500 hover:w-64 md:flex">
      <div className="flex w-full flex-col items-center gap-8">
        <Link
          href={buildWorkspaceAppPath(slug, '/dashboard')}
          className="relative flex items-center justify-center"
        >
          <div className="bg-primary text-primary-foreground flex h-10 w-10 items-center justify-center rounded-xl font-black shadow-lg transition-transform hover:scale-105 hover:rotate-6">
            A
          </div>
          <span className="text-foreground absolute left-14 overflow-hidden text-lg font-black tracking-tighter whitespace-nowrap opacity-0 transition-all duration-500 group-hover/sidebar:opacity-100">
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
                className={`group/item relative flex h-10 w-full items-center gap-3 rounded-xl px-2.5 transition-all duration-300 ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-primary/10 shadow-lg'
                    : 'text-muted-foreground hover:bg-primary/5 hover:text-primary'
                }`}
              >
                <item.icon
                  size={20}
                  className={`shrink-0 transition-transform group-hover/item:scale-105 ${isActive ? 'scale-105' : ''}`}
                />
                <span
                  className={`overflow-hidden text-[13px] font-bold whitespace-nowrap opacity-0 transition-all duration-500 group-hover/sidebar:opacity-100 ${
                    isActive ? 'translate-x-0' : '-translate-x-1'
                  }`}
                >
                  {item.label}
                </span>

                {!isActive && (
                  <div className="bg-foreground text-background absolute left-full ml-4 scale-0 rounded-lg px-2 py-1 text-[10px] transition-all group-hover/item:scale-100 group-hover/item:group-hover/sidebar:hidden">
                    {item.label}
                  </div>
                )}

                {isActive && (
                  <div className="bg-primary-foreground shadow-glow absolute -right-0.5 h-1 w-1 rounded-full group-hover/sidebar:opacity-0" />
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="w-full px-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={`${pathname.includes('configuracoes') ? 'bg-primary text-primary-foreground' : 'bg-primary/5 text-primary'} flex h-12 w-full cursor-pointer items-center gap-3 overflow-hidden rounded-xl p-1.5 transition-all hover:scale-105 active:scale-95`}
            >
              <div className="bg-primary-foreground/20 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-bold backdrop-blur-md">
                {userInitials}
              </div>
              <div className="flex max-w-[140px] flex-col items-start overflow-hidden whitespace-nowrap opacity-0 transition-all duration-500 group-hover/sidebar:opacity-100">
                <span className="max-w-[120px] truncate text-[10px] font-black tracking-tight uppercase">
                  {userName}
                </span>
                <span className="text-[8px] opacity-70">
                  Tier: {plan.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56 rounded-2xl p-2 shadow-2xl backdrop-blur-xl"
            align="start"
            side="right"
            sideOffset={15}
          >
            <DropdownMenuItem asChild className="focus:bg-primary/10 rounded-lg p-2.5">
              <Link
                href={buildWorkspaceAppPath(slug, '/perfil')}
                className="flex w-full cursor-pointer items-center text-sm font-bold"
              >
                <User className="mr-3 h-3.5 w-3.5" />
                <span>Perfil</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="focus:bg-primary/10 rounded-lg p-2.5">
              <Link
                href={buildWorkspaceAppPath(slug, '/configuracoes')}
                className="flex w-full cursor-pointer items-center text-sm font-bold"
              >
                <Settings className="mr-3 h-3.5 w-3.5" />
                <span>Configurações</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1.5 opacity-50" />
            <DropdownMenuItem
              asChild
              className="bg-primary/10 text-primary focus:bg-primary/20 rounded-lg p-2.5"
            >
              <Link
                href={buildWorkspaceAppPath(slug, '/upgrade')}
                className="flex w-full cursor-pointer items-center text-sm font-black"
              >
                <Sparkles className="fill-primary/20 mr-3 h-3.5 w-3.5" />
                <span>Upgrade Pro</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1.5 opacity-50" />
            <DropdownMenuItem
              className="cursor-pointer rounded-lg p-2.5 text-sm font-bold text-red-500 focus:bg-red-50"
              onClick={handleLogout}
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
