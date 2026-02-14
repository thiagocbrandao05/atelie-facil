'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, CreditCard, Activity, ShieldAlert, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
    { href: '/admin/dashboard', label: 'Visão Geral', icon: LayoutDashboard },
    { href: '/admin/tenants', label: 'Tenants', icon: Users },
    { href: '/admin/billing', label: 'Assinaturas', icon: CreditCard },
    { href: '/admin/logs', label: 'Logs & Auditoria', icon: ShieldAlert },
]

export function AdminSidebar() {
    const pathname = usePathname()

    return (
        <aside className="glass sticky top-0 flex hidden h-screen w-64 flex-col border-r-0 shadow-sm transition-all duration-300 md:flex z-50">
            <div className="p-6 flex items-center gap-2">
                <div className="bg-red-600 text-white flex h-8 w-8 items-center justify-center rounded-lg font-bold shadow-md">
                    A
                </div>
                <span className="text-xl font-bold tracking-tight text-foreground">
                    Admin <span className="text-muted-foreground text-sm font-normal">Console</span>
                </span>
            </div>

            <nav className="mt-4 flex-1 space-y-2 px-4">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
                    Gerenciamento
                </div>
                {navItems.map(item => {
                    const isActive = pathname.startsWith(item.href)
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                                isActive
                                    ? "bg-red-50 text-red-700 shadow-sm"
                                    : "text-muted-foreground hover:text-red-600 hover:bg-red-50/50"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <item.icon
                                    size={18}
                                    className={cn("transition-transform", isActive ? "scale-105" : "group-hover:scale-105")}
                                />
                                {item.label}
                            </div>
                        </Link>
                    )
                })}
            </nav>

            <div className="border-t p-4">
                <div className="bg-muted/50 rounded-xl p-4 mb-4 border">
                    <p className="text-xs text-muted-foreground mb-1">Status do Sistema</p>
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-xs font-medium text-green-600">Operacional</span>
                    </div>
                </div>

                <button
                    onClick={() => window.location.href = '/'}
                    className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-red-50 hover:text-red-700 transition-colors"
                >
                    <LogOut size={16} />
                    <span>Sair do Admin</span>
                </button>
            </div>
        </aside>
    )
}
