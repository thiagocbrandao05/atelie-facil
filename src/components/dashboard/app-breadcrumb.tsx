'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { APP_NAV_ITEMS, SETTINGS_NAV_ITEMS } from '@/lib/app-navigation'

const SEGMENT_LABELS: Record<string, string> = {
  app: 'Início',
  dashboard: 'Dashboard',
  configuracoes: 'Configurações',
  campanhas: 'Campanhas',
  onboarding: 'Onboarding',
  upgrade: 'Upgrade',
}

const NAV_LABELS = Object.fromEntries(
  [...APP_NAV_ITEMS, ...SETTINGS_NAV_ITEMS].map(item => [item.appPath.replace('/', ''), item.label])
)

function toLabel(segment: string): string {
  return NAV_LABELS[segment] || SEGMENT_LABELS[segment] || segment
}

export function AppBreadcrumb() {
  const pathname = usePathname()

  if (!pathname.startsWith('/app')) return null

  const segments = pathname.split('/').filter(Boolean)
  if (segments.length <= 1) return null

  return (
    <nav aria-label="Breadcrumb" className="text-muted-foreground mb-4 text-xs">
      <ol className="flex flex-wrap items-center gap-1">
        {segments.map((segment, index) => {
          const href = `/${segments.slice(0, index + 1).join('/')}`
          const isLast = index === segments.length - 1
          const label = toLabel(segment)

          return (
            <li key={href} className="flex items-center gap-1">
              {index > 0 && <span>/</span>}
              {isLast ? (
                <span className="text-foreground font-semibold">{label}</span>
              ) : (
                <Link href={href} className="hover:text-foreground transition-colors">
                  {label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
