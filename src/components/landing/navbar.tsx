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
            ? 'bg-background/70 text-foreground border-border/40 supports-[backdrop-filter]:bg-background/60 border shadow-sm backdrop-blur-xl'
            : 'text-foreground bg-transparent'
        )}
      >
        <div className="flex items-center gap-2">
          <div className="bg-accent text-accent-foreground flex h-8 w-8 items-center justify-center rounded-lg font-bold shadow-md">
            A
          </div>
          <Link
            href="/"
            className="text-foreground hover:text-primary text-lg font-bold tracking-tight transition-colors"
          >
            Atelis
          </Link>
        </div>

        {/* Desktop Menu */}
        <div className="hidden items-center gap-8 md:flex">
          <Link
            href={getHref('#funcionalidades')}
            className="text-muted-foreground hover:text-primary text-sm font-medium transition-colors"
          >
            Funcionalidades
          </Link>
          <Link
            href={getHref('#planos')}
            className="text-muted-foreground hover:text-primary text-sm font-medium transition-colors"
          >
            Planos
          </Link>
          <Link
            href="/about"
            className="text-muted-foreground hover:text-primary text-sm font-medium transition-colors"
          >
            Sobre
          </Link>
        </div>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className="text-foreground hover:text-primary px-4 py-2 text-sm font-semibold transition-colors"
          >
            Entrar
          </Link>
          <Link
            href="/register"
            className={cn(
              'bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20 rounded-xl px-5 py-2 text-sm font-bold shadow-lg transition-all hover:-translate-y-0.5 active:scale-95'
            )}
          >
            Começar Grátis
          </Link>
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="Abrir menu"
                className={cn(
                  'rounded-lg p-2 transition-colors',
                  scrolled
                    ? 'hover:bg-primary-foreground/20 text-primary-foreground'
                    : 'hover:bg-muted text-foreground'
                )}
              >
                <Menu size={24} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-card w-[200px] border-white/20">
              <DropdownMenuItem asChild>
                <Link
                  href={getHref('#funcionalidades')}
                  className="w-full cursor-pointer justify-start p-3 font-medium"
                >
                  Funcionalidades
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href={getHref('#planos')}
                  className="w-full cursor-pointer justify-start p-3 font-medium"
                >
                  Planos
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/about" className="w-full cursor-pointer justify-start p-3 font-medium">
                  Sobre
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem asChild>
                <Link
                  href="/login"
                  className="text-primary w-full cursor-pointer justify-start p-3 font-bold"
                >
                  Entrar
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/register"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary/90 mt-1 w-full cursor-pointer justify-center rounded-lg p-3 text-center font-black"
                >
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
