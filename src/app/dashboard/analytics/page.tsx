import { Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getSalesMetrics, getInventoryMetrics, getTopProducts, getRecentActivity } from '@/features/analytics/actions'
import { DollarSign, Package, TrendingUp, Activity } from 'lucide-react'

export const metadata = {
    title: 'Analytics | AteliêFácil',
    description: 'Métricas e análises do negócio'
}

export const revalidate = 300; // Revalidate every 5 minutes

export default async function AnalyticsPage() {
    const [salesMetrics, inventoryMetrics, topProducts, recentActivity] = await Promise.all([
        getSalesMetrics(30),
        getInventoryMetrics(),
        getTopProducts(5),
        getRecentActivity(10)
    ])

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Analytics</h1>
                <p className="text-muted-foreground mt-2">
                    Métricas e insights do seu negócio
                </p>
            </div>

            {/* Sales Metrics */}
            {salesMetrics && (
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                    <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Total de Pedidos (30d)</p>
                                    <p className="text-2xl font-bold">{salesMetrics.totalOrders}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                                    <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Receita (30d)</p>
                                    <p className="text-2xl font-bold">
                                        R$ {Number(salesMetrics.totalRevenue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                                    <Activity className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Status dos Pedidos</p>
                                    <p className="text-2xl font-bold">{salesMetrics.ordersByStatus.length}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Inventory Metrics */}
            {inventoryMetrics && (
                <Card>
                    <CardHeader>
                        <CardTitle>Inventário</CardTitle>
                        <CardDescription>Status do estoque</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-3">
                            <div>
                                <p className="text-sm text-muted-foreground">Total de Materiais</p>
                                <p className="text-3xl font-bold">{inventoryMetrics.totalMaterials}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Alertas de Estoque Baixo</p>
                                <p className="text-3xl font-bold text-orange-600">{inventoryMetrics.lowStockCount}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Valor Total do Estoque</p>
                                <p className="text-3xl font-bold">
                                    R$ {Number(inventoryMetrics.totalValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Top Products */}
            {topProducts && topProducts.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Produtos Mais Vendidos</CardTitle>
                        <CardDescription>Top 5 produtos por quantidade</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {topProducts.map((product: { productId: string; productName: string; quantity: number | null; revenue: number | null }, index: number) => (
                                <div key={product.productId} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="font-medium">{product.productName}</p>
                                            <p className="text-sm text-muted-foreground">{product.quantity} unidades</p>
                                        </div>
                                    </div>
                                    <p className="font-bold">
                                        R$ {Number(product.revenue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Recent Activity */}
            {recentActivity && recentActivity.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Atividade Recente</CardTitle>
                        <CardDescription>Últimas ações no sistema</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {recentActivity.map((activity: any) => (
                                <div key={activity.id} className="flex items-center justify-between text-sm">
                                    <div>
                                        <span className="font-medium">{activity.user?.name || 'Sistema'}</span>
                                        <span className="text-muted-foreground"> {activity.action.toLowerCase()} </span>
                                        <span className="font-medium">{activity.entity}</span>
                                    </div>
                                    <span className="text-muted-foreground">
                                        {new Date(activity.createdAt).toLocaleDateString('pt-BR')}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}


