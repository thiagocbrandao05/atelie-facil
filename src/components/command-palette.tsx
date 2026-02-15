'use client'

import * as React from 'react'
import { User, Plus, LayoutDashboard, LogOut } from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { buildWorkspaceAppPath } from '@/lib/workspace-path'
import { getVisibleAppNavItems, SETTINGS_NAV_ITEMS } from '@/lib/app-navigation'
import { PlanType } from '@/features/subscription/types'

export function CommandPalette({
  user,
}: {
  user?: { tenant?: { plan?: string | null } | null } | null
}) {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()
  const params = useParams()
  const slug = (params.workspaceSlug as string) || 'atelis'
  const supabase = createClient()
  const plan = (user?.tenant?.plan as PlanType) || 'free_creative'
  const navigationItems = getVisibleAppNavItems(plan).filter(item => item.inCommandPalette)

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(prev => !prev)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false)
    command()
  }, [])

  const logout = React.useCallback(async () => {
    setOpen(false)
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }, [router, supabase])

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Digite um comando ou busque..." />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>

        <CommandGroup heading="Sugestões">
          <CommandItem
            onSelect={() => runCommand(() => router.push(buildWorkspaceAppPath(slug, '/pedidos')))}
          >
            <Plus className="mr-2 h-4 w-4" />
            <span>Novo pedido</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push(buildWorkspaceAppPath(slug, '/clientes')))}
          >
            <User className="mr-2 h-4 w-4" />
            <span>Novo cliente</span>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() => router.push(buildWorkspaceAppPath(slug, '/dashboard')))
            }
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navegação">
          {navigationItems.map(item => (
            <CommandItem
              key={item.id}
              onSelect={() =>
                runCommand(() => router.push(buildWorkspaceAppPath(slug, item.appPath)))
              }
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.label}</span>
              {item.shortcut && <CommandShortcut>{item.shortcut}</CommandShortcut>}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Configurações">
          {SETTINGS_NAV_ITEMS.map(item => (
            <CommandItem
              key={item.id}
              onSelect={() =>
                runCommand(() => router.push(buildWorkspaceAppPath(slug, item.appPath)))
              }
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.label}</span>
              {item.shortcut && <CommandShortcut>{item.shortcut}</CommandShortcut>}
            </CommandItem>
          ))}
          <CommandItem onSelect={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sair</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
