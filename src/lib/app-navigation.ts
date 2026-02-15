import {
  BarChart3,
  Banknote,
  ClipboardList,
  Inbox,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingBag,
  Sparkles,
  Truck,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { hasFeature, isReseller } from '@/features/subscription/utils'
import type { FeatureId, PlanType, TenantProfile } from '@/features/subscription/types'

export type AppNavItem = {
  id: string
  label: string
  appPath: string
  icon: LucideIcon
  feature?: FeatureId
  profile?: TenantProfile
  shortcut?: string
  inCommandPalette?: boolean
}

export const APP_NAV_ITEMS: AppNavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    appPath: '/dashboard',
    icon: LayoutDashboard,
    inCommandPalette: true,
  },
  {
    id: 'pedidos',
    label: 'Pedidos',
    appPath: '/pedidos',
    icon: ClipboardList,
    shortcut: '⌘P',
    inCommandPalette: true,
  },
  {
    id: 'clientes',
    label: 'Clientes',
    appPath: '/clientes',
    icon: Users,
    shortcut: '⌘C',
    inCommandPalette: true,
  },
  {
    id: 'produtos',
    label: 'Produtos',
    appPath: '/produtos',
    icon: ShoppingBag,
    inCommandPalette: false,
  },
  {
    id: 'estoque',
    label: 'Estoque MP',
    appPath: '/estoque',
    icon: Package,
    profile: 'CREATIVE',
    shortcut: '⌘E',
    inCommandPalette: true,
  },
  {
    id: 'estoque-produtos',
    label: 'Pronta Entrega',
    appPath: '/estoque-produtos',
    icon: Inbox,
    feature: 'INVENTORY_FINISHED',
    inCommandPalette: false,
  },
  {
    id: 'fornecedores',
    label: 'Fornecedores',
    appPath: '/fornecedores',
    icon: Truck,
    inCommandPalette: true,
  },
  {
    id: 'financeiro',
    label: 'Financeiro',
    appPath: '/financeiro',
    icon: Banknote,
    feature: 'FINANCIAL',
    shortcut: '⌘F',
    inCommandPalette: true,
  },
  {
    id: 'relatorios',
    label: 'Relatórios',
    appPath: '/relatorios',
    icon: BarChart3,
    feature: 'REPORTS_ADVANCED',
    inCommandPalette: false,
  },
  {
    id: 'automacoes',
    label: 'Automações IA',
    appPath: '/automacoes',
    icon: Sparkles,
    feature: 'AI_INSIGHTS',
    inCommandPalette: false,
  },
]

export const SETTINGS_NAV_ITEMS = [
  { id: 'perfil', label: 'Perfil', appPath: '/perfil', icon: User, shortcut: '⌘U' },
  {
    id: 'configuracoes',
    label: 'Configurações',
    appPath: '/configuracoes',
    icon: Settings,
    shortcut: '⌘S',
  },
] as const

export function getVisibleAppNavItems(plan: PlanType): AppNavItem[] {
  return APP_NAV_ITEMS.filter(item => {
    if (item.profile === 'CREATIVE' && isReseller(plan)) return false
    if (item.feature && !hasFeature(plan, item.feature)) return false
    return true
  })
}
