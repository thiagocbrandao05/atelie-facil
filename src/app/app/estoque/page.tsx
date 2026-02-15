import { getMaterials } from '@/features/materials/actions'
import { getSuppliers } from '@/features/suppliers/actions'
import { Material, Supplier } from '@/lib/types'

// Components
import { MaterialForm } from '@/components/material-form'
import { MaterialList } from '@/components/material-list'
import { StockEntryForm } from '@/components/stock-entry-form'
import { ManualMovementForm } from '@/components/manual-movement-form'
import { StockAlerts } from '@/components/stock-alerts'
import { InventoryHistory } from '@/components/inventory-history'
import { getAllInventoryMovements } from '@/features/inventory/actions'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

import { getStockReport } from '@/features/stock/actions'
import { Plus } from 'lucide-react'
import { StockOverviewList } from '@/components/stock-overview-list'

type StockReportItem = {
  materialId: string
  color: string | null
  balance: number
}

type EnrichedStockItem = StockReportItem & {
  materialName: string
  unit: string
}

export default async function EstoquePage() {
  let materials: Material[] = []
  let suppliers: Supplier[] = []
  let movements: Awaited<ReturnType<typeof getAllInventoryMovements>> = []
  let stockItems: EnrichedStockItem[] = []

  try {
    const [materialsResult, suppliersResult, movementsResult, stockReportResult] =
      await Promise.all([
        getMaterials(),
        getSuppliers(),
        getAllInventoryMovements(),
        getStockReport(),
      ])
    materials = materialsResult
    suppliers = suppliersResult
    movements = movementsResult

    // Enrich stock report with material names
    stockItems = (stockReportResult as StockReportItem[])
      .map(item => {
        const mat = materials.find(m => m.id === item.materialId)
        return {
          ...item,
          materialName: mat?.name || 'Desconhecido',
          unit: mat?.unit || '',
        }
      })
      .filter(item => item.balance !== 0) // Optional: show only non-zero? User asked for "saldo atual".
  } catch (error) {
    console.error('Failed to fetch data:', error)
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
      <div className="flex flex-col items-center justify-between gap-5 rounded-2xl border border-white/40 bg-white/90 p-5 shadow-md backdrop-blur-2xl md:flex-row md:p-6">
        <div className="space-y-1 text-center md:text-left">
          <h1 className="text-primary font-serif text-2xl font-black tracking-tight italic sm:text-3xl">
            Seu estoque
          </h1>
          <p className="text-muted-foreground text-sm font-medium">
            Gerencie cada pequeno detalhe com carinho.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-xl shadow-inner">
            <Plus size={20} className="font-black" />
          </div>
          <p className="text-[10px] font-black tracking-widest uppercase opacity-40">
            Adicione novos
            <br />
            insumos
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
            {/* Esquerda: Alertas */}
            <div className="md:col-span-12 lg:col-span-5">
              <StockAlerts />
            </div>

            {/* Direita: Saldo Atual */}
            <div className="md:col-span-12 lg:col-span-7">
              <div className="h-full overflow-hidden rounded-2xl border border-white/40 bg-white/90 p-6 shadow-md backdrop-blur-2xl">
                <div className="mb-6 space-y-1">
                  <h2 className="text-[10px] font-black tracking-[0.3em] uppercase opacity-40">
                    Monitoramento
                  </h2>
                  <p className="text-xl font-black">Saldo atual de insumos</p>
                </div>
                <div className="scrollbar-hide max-h-[500px] overflow-auto pr-2">
                  <StockOverviewList items={stockItems} />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* 2. Cadastro de materiais */}
        <TabsContent value="register" className="mt-6">
          <div className="rounded-2xl border border-white/40 bg-white/90 p-8 shadow-md backdrop-blur-2xl">
            <div className="mb-6 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
              <div className="space-y-1">
                <h2 className="text-[10px] font-black tracking-[0.3em] uppercase opacity-40">
                  Biblioteca
                </h2>
                <p className="text-xl font-black">Gestão de materiais</p>
              </div>
              <MaterialForm suppliers={suppliers} />
            </div>
            <MaterialList materials={materials} suppliers={suppliers} />
          </div>
        </TabsContent>

        {/* 3. Aba Entradas de Estoque */}
        <TabsContent value="purchases" className="mt-6">
          <div className="rounded-2xl border border-white/40 bg-white/90 p-2 shadow-md backdrop-blur-2xl">
            <StockEntryForm materials={materials} suppliers={suppliers} />
          </div>
        </TabsContent>

        {/* 4. Aba ajustes manuais */}
        <TabsContent value="manual" className="mt-6">
          <div className="rounded-2xl border border-white/40 bg-white/90 p-2 shadow-md backdrop-blur-2xl">
            <ManualMovementForm materials={materials} />
          </div>
        </TabsContent>

        {/* 5. Aba histórico */}
        <TabsContent value="history" className="mt-6">
          <div className="rounded-2xl border border-white/40 bg-white/90 p-2 shadow-md backdrop-blur-2xl">
            <InventoryHistory movements={movements} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
