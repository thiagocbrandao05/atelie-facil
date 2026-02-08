import Link from "next/link";

import { getLowStockMaterials } from '@/features/analytics/actions';
import { getOrders, getOrdersStats } from '@/features/orders/actions';
import { getSettings } from '@/features/settings/actions';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OrderCalendar } from "@/components/order-calendar";
import {
  AlertCircle,
  ShoppingBag,
  TrendingUp,
  PlusCircle,
  ArrowRight,
  Package as PackageIcon,
  MessageCircle
} from "lucide-react";
import { summarizeFinancials } from "@/lib/logic";

interface Material {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  minQuantity: number | null;
}

interface Order {
  id: string;
  customer?: { name: string };
  status: string;
  dueDate: string | Date;
  totalValue: number;
}

export default async function DashboardPage() {
  const [lowStockMaterials, orders, orderStats, settings] = await Promise.all([
    getLowStockMaterials() as Promise<Material[]>,
    getOrders() as Promise<any[]>,
    getOrdersStats(),
    getSettings()
  ]);

  const financials = summarizeFinancials(
    orders,
    Number(settings?.hourlyRate || 20),
    settings?.monthlyFixedCosts || [],
    Number(settings?.workingHoursPerMonth || 160)
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-serif font-bold tracking-tight text-primary italic">Ateliê Fácil</h1>
          <p className="text-muted-foreground mt-2 text-lg">Bem-vindo ao seu espaço criativo hoje.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild className="rounded-full px-6 hover:bg-secondary transition-all">
            <Link href="/estoque" className="flex items-center gap-2">
              <PackageIcon size={18} />
              Estoque
            </Link>
          </Button>
          <Button asChild className="rounded-full px-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 active:scale-95 bg-primary text-primary-foreground">
            <Link href="/pedidos" className="flex items-center gap-2">
              <PlusCircle size={18} />
              Novo Pedido
            </Link>
          </Button>
        </div>
      </div>

      {/* Bento Grid Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6">

        {/* Main Stats Area - Large Card (Bento Slot) */}
        <Card className="md:col-span-4 lg:col-span-4 border-none shadow-sm bg-white overflow-hidden flex flex-col justify-between">
          <CardHeader className="pb-0">
            <CardTitle className="text-lg font-medium text-muted-foreground flex items-center gap-2">
              <ShoppingBag size={20} className="text-primary" />
              Visão Geral de Produção
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-8 items-end">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pedidos Ativos</p>
                <div className="text-5xl font-bold text-primary">{orderStats.activeOrders}</div>
              </div>
              <div className="h-12 w-px bg-border hidden sm:block" />
              <div>
                <p className="text-sm text-muted-foreground mb-1">Lucro Estimado</p>
                <div className="text-3xl font-semibold text-foreground">
                  {financials.totalProfit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
              </div>
              <div className="ml-auto flex items-center gap-2 text-success bg-success/10 px-3 py-1 rounded-full text-sm font-medium">
                <TrendingUp size={16} />
                Em crescimento
              </div>
            </div>
          </CardContent>
          <div className="bg-secondary/50 p-4 mt-4 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Último pedido registrado há 2 horas</p>
            <Button variant="link" size="sm" className="h-auto p-0 text-primary" asChild>
              <Link href="/pedidos">Ver Detalhes <ArrowRight size={14} className="ml-1" /></Link>
            </Button>
          </div>
        </Card>

        {/* Low Stock Alert - Medium Card (Bento Slot) */}
        <Card className={`md:col-span-2 lg:col-span-2 border-none shadow-sm overflow-hidden flex flex-col ${lowStockMaterials.length > 0 ? 'bg-warning/10 ring-1 ring-warning/20' : 'bg-white'}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <PackageIcon size={20} className={lowStockMaterials.length > 0 ? "text-warning" : "text-primary"} />
              Estoque
            </CardTitle>
            <CardDescription>Materiais monitorados</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center">
            {lowStockMaterials.length > 0 ? (
              <div className="space-y-4">
                <div className="text-4xl font-bold text-warning">{lowStockMaterials.length}</div>
                <p className="text-sm text-warning/80">Itens abaixo do nível mínimo de segurança.</p>
                <Button variant="outline" size="sm" className="w-full bg-white border-warning/30 text-warning hover:bg-warning/10" asChild>
                  <Link href="/estoque">Repor Materiais</Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-4 space-y-2">
                <div className="text-success font-medium">Estoque Ideal</div>
                <p className="text-xs text-muted-foreground">Todos os itens estão com níveis adequados.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Calendar - Full Width on Mobile, Large Bento Slot */}
        <Card className="md:col-span-4 lg:col-span-4 border-none shadow-sm bg-white overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                Agenda de Entregas
              </CardTitle>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-primary font-medium">
              <Link href="/pedidos">Calendário Completo <ArrowRight size={14} className="ml-1" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-border p-2 bg-secondary/10">
              <OrderCalendar initialOrders={orders} />
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions & Recent - Vertical Bento Column */}
        <div className="md:col-span-2 lg:col-span-2 space-y-6 flex flex-col">
          <Card className="border-none shadow-sm bg-primary text-primary-foreground flex-1 overflow-hidden relative group">
            <div className="absolute right-[-20px] bottom-[-20px] opacity-10 group-hover:scale-110 transition-transform">
              <MessageCircle size={120} />
            </div>
            <CardHeader>
              <CardTitle className="text-base font-medium">Suporte & Comunicação</CardTitle>
              <CardDescription className="text-primary-foreground/70">Mantenha seus clientes atualizados.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 relative">
              <Button variant="secondary" size="sm" className="w-full justify-start gap-2 shadow-sm" asChild>
                <Link href="/configuracoes">
                  <MessageCircle size={16} />
                  Configurar Mensagens WhatsApp
                </Link>
              </Button>
              <p className="text-[10px] text-primary-foreground/60 italic leading-relaxed">
                Dica: Personalize o nome da sua loja nas configurações para um toque profissional em seus orçamentos.
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Atalhos Rápidos
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Button variant="outline" size="sm" asChild className="justify-center flex-col h-20 gap-2 border-border/50 hover:bg-secondary/50 hover:border-primary/20 transition-all group">
                <Link href="/clientes">
                  <PlusCircle size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-xs">Novo Cliente</span>
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="justify-center flex-col h-20 gap-2 border-border/50 hover:bg-secondary/50 hover:border-primary/20 transition-all group">
                <Link href="/produtos">
                  <PlusCircle size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-xs">Novo Produto</span>
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

