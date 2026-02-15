'use client'

import * as React from 'react'
import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  Smile,
  User,
  Search,
  Plus,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  LogOut,
} from 'lucide-react'
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

export function CommandPalette() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()
  const params = useParams()
  const slug = (params.workspaceSlug as string) || 'atelis'
  const supabase = createClient()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(open => !open)
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
          <CommandItem onSelect={() => runCommand(() => router.push(`/${slug}/app/pedidos/novo`))}>
            <Plus className="mr-2 h-4 w-4" />
            <span>Novo Pedido</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push(`/${slug}/app/clientes/novo`))}>
            <User className="mr-2 h-4 w-4" />
            <span>Novo Cliente</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push(`/${slug}/app/dashboard`))}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Navegação">
          <CommandItem onSelect={() => runCommand(() => router.push(`/${slug}/app/pedidos`))}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            <span>Pedidos</span>
            <CommandShortcut>⌘P</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push(`/${slug}/app/estoque`))}>
            <Package className="mr-2 h-4 w-4" />
            <span>Estoque</span>
            <CommandShortcut>⌘E</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push(`/${slug}/app/clientes`))}>
            <User className="mr-2 h-4 w-4" />
            <span>Clientes</span>
            <CommandShortcut>⌘C</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push(`/${slug}/app/financeiro`))}>
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Financeiro</span>
            <CommandShortcut>⌘F</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push(`/${slug}/app/fornecedores`))}>
            <Truck className="mr-2 h-4 w-4" />
            <span>Fornecedores</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Configurações">
          <CommandItem onSelect={() => runCommand(() => router.push(`/${slug}/app/perfil`))}>
            <User className="mr-2 h-4 w-4" />
            <span>Perfil</span>
            <CommandShortcut>⌘U</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push(`/${slug}/app/configuracoes`))}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Configurações</span>
            <CommandShortcut>⌘S</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sair</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
