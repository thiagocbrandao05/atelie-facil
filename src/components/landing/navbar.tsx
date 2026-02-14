'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Sparkles, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  const isHome = pathname === '/'

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const getHref = (hash: string) => {
    return isHome ? hash : `/${hash}`
  }

  return (
    <nav
      className={cn(
        'fixed top-0 z-50 w-full px-4 pt-4 transition-all duration-300',
        scrolled ? 'pt-2' : 'pt-4'
      )}
    >
      <div
        className={cn(
          'container mx-auto flex h-14 max-w-7xl items-center justify-between rounded-2xl px-6 transition-all duration-300',
          scrolled
            ? 'bg-background/70 text-foreground border-border/40 border shadow-sm backdrop-blur-xl supports-[backdrop-filter]:bg-background/60'
            : 'bg-transparent text-foreground'
        )}
      >
        <div className="flex items-center gap-2">
          <div className="bg-accent text-accent-foreground flex h-8 w-8 items-center justify-center rounded-lg font-bold shadow-md">
            A
          </div>
          <Link
            href="/"
            className="text-lg font-bold tracking-tight text-foreground transition-colors hover:text-primary"
          >
            Atelis
          </Link>
        </div>

        {/* Desktop Menu */}
        <div className="hidden items-center gap-8 md:flex">
          <Link
            href={getHref('#funcionalidades')}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Funcionalidades
          </Link>
          <Link
            href={getHref('#planos')}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Planos
          </Link>
          <Link
            href="/about"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Sobre
          </Link>
        </div>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:text-primary"
          >
            Entrar
          </Link>
          <Link
            href="/register"
            className={cn(
              'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-xl px-5 py-2 text-sm font-bold transition-all hover:-translate-y-0.5 active:scale-95'
            )}
          >
            Começar Grátis
          </Link>
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn("p-2 rounded-lg transition-colors", scrolled ? "hover:bg-primary-foreground/20 text-primary-foreground" : "hover:bg-muted text-foreground")}>
                <Menu size={24} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px] glass-card border-white/20">
              <DropdownMenuItem asChild>
                <Link href={getHref('#funcionalidades')} className="w-full justify-start cursor-pointer font-medium p-3">Funcionalidades</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={getHref('#planos')} className="w-full justify-start cursor-pointer font-medium p-3">Planos</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/about" className="w-full justify-start cursor-pointer font-medium p-3">Sobre</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem asChild>
                <Link href="/login" className="w-full justify-start cursor-pointer font-bold p-3 text-primary">Entrar</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/register" className="w-full justify-center cursor-pointer font-black p-3 bg-primary text-primary-foreground rounded-lg mt-1 text-center hover:bg-primary/90 focus:bg-primary/90">
                  Criar Conta
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  )
}
