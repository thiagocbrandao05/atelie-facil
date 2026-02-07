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

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { getStockReport } from '@/features/stock/actions'
import { Plus } from 'lucide-react'
import { StockOverviewList } from '@/components/stock-overview-list'

export default async function EstoquePage() {
    let materials: Material[] = []
    let suppliers: Supplier[] = []
    let movements: any[] = []
    let stockItems: any[] = []

    try {
        const [materialsResult, suppliersResult, movementsResult, stockReportResult] = await Promise.all([
            getMaterials(),
            getSuppliers(),
            getAllInventoryMovements(),
            getStockReport()
        ])
        materials = materialsResult
        suppliers = suppliersResult
        movements = movementsResult

        // Enrich stock report with material names
        stockItems = stockReportResult.map((item: any) => {
            const mat = materials.find(m => m.id === item.materialId)
            return {
                ...item,
                materialName: mat?.name || 'Desconhecido',
                unit: mat?.unit || ''
            }
        }).filter((item: any) => item.balance !== 0) // Optional: show only non-zero? User asked for "saldo atual".

    } catch (error) {
        console.error('Failed to fetch data:', error)
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-primary">Gestão de Estoque</h1>
                <p className="text-muted-foreground mt-1">Controle de materiais, compras e movimentações.</p>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 md:w-auto">
                    <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                    <TabsTrigger value="register">Cadastro</TabsTrigger>
                    <TabsTrigger value="purchases">Entradas / Compras</TabsTrigger>
                    <TabsTrigger value="manual">Movimentação</TabsTrigger>
                    <TabsTrigger value="history">Histórico</TabsTrigger>
                </TabsList>

                {/* 1. Visão Geral */}
                <TabsContent value="overview" className="space-y-6">
                    <div className="w-full">
                        <StockAlerts />
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-semibold tracking-tight">Status do Estoque</h2>
                                <p className="text-sm text-muted-foreground">Visão consolidada por material e cor.</p>
                            </div>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle>Saldo Atual</CardTitle>
                                <CardDescription>
                                    Abaixo estão os materiais que possuem movimentação registrada.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <StockOverviewList items={stockItems} />
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* 2. Cadastro de Materiais */}
                <TabsContent value="register" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Cadastro de Materiais</CardTitle>
                            <CardDescription>
                                Gerencie os materiais disponíveis para uso no sistema.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex justify-end">
                                <MaterialForm suppliers={suppliers} />
                            </div>
                            <MaterialList materials={materials} suppliers={suppliers} />
                        </CardContent>
                    </Card>
                </TabsContent>


                {/* 3. Aba Entradas de Estoque */}
                <TabsContent value="purchases">
                    <StockEntryForm materials={materials} suppliers={suppliers} />
                </TabsContent>

                {/* 4. Aba Movimentação Manual */}
                <TabsContent value="manual">
                    <ManualMovementForm materials={materials} />
                </TabsContent>

                {/* 5. Aba Histórico */}
                <TabsContent value="history">
                    <InventoryHistory movements={movements} />
                </TabsContent>
            </Tabs>
        </div >
    )
}


