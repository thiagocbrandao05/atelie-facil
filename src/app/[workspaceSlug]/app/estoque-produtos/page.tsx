import {
  getProductsInventory,
  getAllProductInventoryMovements,
} from '@/features/inventory-finished/actions'
import { getProducts } from '@/features/products/actions'
import { getMaterials } from '@/features/materials/actions'
import { getSettings } from '@/features/settings/actions'
import { getCurrentTenantPlan } from '@/features/subscription/actions'

import { Inbox, Package, History, ArrowUpDown, ShoppingBag, Plus, Library } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { ProductInventoryList } from '@/components/product-inventory-list'
import { ProductAdjustmentForm } from '@/components/product-adjustment-form'
import { ProductStockAlerts } from '@/components/product-stock-alerts'
import { ProductInventoryHistory } from '@/components/product-inventory-history'
import { ProductListSimplified } from '@/components/product-list-simplified'
import { ProductStockEntryForm } from '@/components/product-stock-entry-form'
import { ProductForm } from '@/components/product-form'
import type { ProductWithMaterials } from '@/lib/types'

export default async function EstoqueProdutosPage() {
  const [inventory, products, materials, settings, tenantStats, movements] = await Promise.all([
    getProductsInventory(),
    getProducts(),
    getMaterials(),
    getSettings(),
    getCurrentTenantPlan(),
    getAllProductInventoryMovements(),
  ])

  const { plan } = tenantStats

  return (
    <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
      {/* Artisanal Header */}
      <div className="flex flex-col items-center justify-between gap-5 rounded-2xl border border-white/40 bg-white/90 p-5 shadow-md backdrop-blur-2xl md:flex-row md:p-6">
        <div className="space-y-1 text-center md:text-left">
          <h1 className="text-primary font-serif text-2xl font-black tracking-tight italic sm:text-3xl">
            Pronta-Entrega
          </h1>
          <p className="text-muted-foreground text-sm font-medium">
            Controle seus produtos acabados e agilize suas vendas.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-xl shadow-inner">
            <Inbox size={20} className="font-black" />
          </div>
          <p className="text-[10px] font-black tracking-widest uppercase opacity-40">
            Gestão de
            <br />
            Produtos Acabados
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6 sm:space-y-8">
        <TabsList className="bg-muted/10 h-auto w-full justify-start gap-1 overflow-x-auto rounded-2xl border-none p-1.5 backdrop-blur-md md:w-fit">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground min-h-10 shrink-0 rounded-xl px-4 py-2 text-xs font-black tracking-tight transition-all data-[state=active]:shadow-md"
          >
            Visão geral
          </TabsTrigger>
          <TabsTrigger
            value="register"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground min-h-10 shrink-0 rounded-xl px-4 py-2 text-xs font-black tracking-tight transition-all data-[state=active]:shadow-md"
          >
            Cadastro
          </TabsTrigger>
          <TabsTrigger
            value="purchases"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground min-h-10 shrink-0 rounded-xl px-4 py-2 text-xs font-black tracking-tight transition-all data-[state=active]:shadow-md"
          >
            Entradas
          </TabsTrigger>
          <TabsTrigger
            value="manual"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground min-h-10 shrink-0 rounded-xl px-4 py-2 text-xs font-black tracking-tight transition-all data-[state=active]:shadow-md"
          >
            Ajustes
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground min-h-10 shrink-0 rounded-xl px-4 py-2 text-xs font-black tracking-tight transition-all data-[state=active]:shadow-md"
          >
            Histórico
          </TabsTrigger>
        </TabsList>

        {/* 1. Visão Geral */}
        <TabsContent value="overview" className="mt-6 space-y-8">
          <div className="grid gap-6 md:grid-cols-12">
            {/* Alertas */}
            <div className="md:col-span-12 lg:col-span-5">
              <ProductStockAlerts />
            </div>

            {/* Saldo Atual */}
            <div className="md:col-span-12 lg:col-span-7">
              <div className="h-full overflow-hidden rounded-2xl border border-white/40 bg-white/90 p-6 shadow-md backdrop-blur-2xl">
                <div className="mb-6 space-y-1">
                  <h2 className="text-[10px] font-black tracking-[0.3em] uppercase opacity-40">
                    Estoque
                  </h2>
                  <p className="text-xl font-black">Saldo de Produtos</p>
                </div>
                <div className="scrollbar-hide max-h-[500px] overflow-auto pr-2">
                  <ProductInventoryList inventory={inventory} />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* 2. Cadastro de Produtos */}
        <TabsContent value="register" className="mt-6">
          <div className="rounded-2xl border border-white/40 bg-white/90 p-6 shadow-md backdrop-blur-2xl sm:p-8">
            <div className="mb-6 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
              <div className="space-y-1">
                <h2 className="text-[10px] font-black tracking-[0.3em] uppercase opacity-40">
                  Catálogo
                </h2>
                <p className="text-xl font-black">Gestão de Produtos</p>
              </div>
              <ProductForm availableMaterials={materials} settings={settings} tenantPlan={plan} />
            </div>
            <ProductListSimplified
              products={products as ProductWithMaterials[]}
              materials={materials}
              settings={settings}
              tenantPlan={plan}
            />
          </div>
        </TabsContent>

        {/* 3. Compras */}
        <TabsContent value="purchases" className="mt-6">
          <div className="rounded-2xl border border-white/40 bg-white/90 p-2 shadow-md backdrop-blur-2xl">
            <ProductStockEntryForm products={products} />
          </div>
        </TabsContent>

        {/* 4. Movimentação Manual */}
        <TabsContent value="manual" className="mt-6">
          <div className="rounded-2xl border border-white/40 bg-white/90 p-6 shadow-md backdrop-blur-2xl">
            <div className="mx-auto max-w-2xl space-y-6">
              <div className="space-y-2 text-center">
                <h2 className="text-xl font-black italic">Ajuste Manual de Estoque</h2>
                <p className="text-muted-foreground text-xs font-medium">
                  Use para correções, perdas ou retiradas manuais.
                </p>
              </div>
              <ProductAdjustmentForm products={products} />
            </div>
          </div>
        </TabsContent>

        {/* 5. Histórico */}
        <TabsContent value="history" className="mt-6">
          <div className="rounded-2xl border border-white/40 bg-white/90 p-6 shadow-md backdrop-blur-2xl">
            <div className="mb-6 space-y-1">
              <h2 className="text-[10px] font-black tracking-[0.3em] uppercase opacity-40">
                Audit
              </h2>
              <p className="text-xl font-black">Histórico de Movimentações</p>
            </div>
            <ProductInventoryHistory movements={movements} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
