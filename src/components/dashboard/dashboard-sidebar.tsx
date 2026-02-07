'use client'

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Users,
    ChevronRight,
    Truck,
    BarChart3,
    User,
    Settings,
    LogOut
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/estoque", label: "Estoque", icon: Package },
    { href: "/dashboard/produtos", label: "Produtos", icon: ShoppingCart },
    { href: "/dashboard/clientes", label: "Clientes", icon: Users },
    { href: "/dashboard/pedidos", label: "Pedidos", icon: ShoppingCart },
    { href: "/dashboard/fornecedores", label: "Fornecedores", icon: Truck },
    { href: "/dashboard/relatorios", label: "Relatórios", icon: BarChart3 },
];


export function DashboardSidebar({ user }: { user?: { name?: string | null, email?: string | null } | null }) {
    const pathname = usePathname();
    const userName = user?.name || "Usuário";
    const userInitials = userName.substring(0, 2).toUpperCase();

    return (
        <aside className="w-64 border-r bg-card flex flex-col hidden md:flex sticky top-0 h-screen transition-all duration-300 shadow-sm">
            <div className="p-6">
                <Link href="/dashboard" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-primary-foreground font-bold shadow-md group-hover:scale-105 transition-transform">
                        A
                    </div>
                    <span className="font-bold text-xl tracking-tight text-foreground group-hover:text-primary transition-colors">AteliêFácil</span>
                </Link>
            </div>

            <nav className="flex-1 px-4 space-y-2 mt-4">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            prefetch={true}
                            className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${isActive
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <item.icon size={18} className={`transition-transform ${isActive ? "scale-110" : "group-hover:scale-110"}`} />
                                {item.label}
                            </div>
                            {(isActive) && (
                                <ChevronRight size={14} className="animate-in fade-in slide-in-from-left-1" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <div className="bg-secondary/50 rounded-xl p-3 flex items-center gap-3 hover:bg-secondary transition-colors cursor-pointer w-full">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-accent to-pink-500 flex items-center justify-center text-white font-medium shadow-sm">
                                {userInitials}
                            </div>
                            <div className="flex flex-col text-left">
                                <span className="text-xs font-semibold">{userName}</span>
                                <span className="text-[10px] text-muted-foreground">{user?.email || "Plano Premium"}</span>
                            </div>
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" side="top">
                        <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href="/dashboard/perfil" className="cursor-pointer">
                                <User className="mr-2 h-4 w-4" />
                                <span>Perfil</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/dashboard/configuracoes" className="cursor-pointer">
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Configurações</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600 focus:text-red-600 cursor-pointer" onClick={() => window.location.href = '/'}>
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Sair</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </aside>
    )
}


