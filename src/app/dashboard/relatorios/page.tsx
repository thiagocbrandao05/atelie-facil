import { getMonthlyRevenue, getTopProducts, getLowStockMaterials } from '@/features/analytics/actions'
import { RevenueChart } from '@/components/analytics/revenue-chart'
import { TopProducts } from '@/components/analytics/top-products'
import { LowStockAlert } from '@/components/analytics/low-stock-alert'

export default async function ReportsPage() {
    const [revenueData, topProductsData, lowStockData] = await Promise.all([
        getMonthlyRevenue(),
        getTopProducts(),
        getLowStockMaterials()
    ])

    const totalRevenue = revenueData.reduce((acc, curr: any) => acc + curr.value, 0)

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Relatórios & Analytics</h1>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="p-6 bg-white rounded-xl border shadow-sm">
                    <h3 className="text-sm font-medium text-muted-foreground">Receita Total (6 meses)</h3>
                    <div className="text-2xl font-bold mt-2">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRevenue)}
                    </div>
                </div>
                {/* More KPI cards can be added here */}
            </div>

            <div className="grid gap-6 md:grid-cols-7">
                <div className="col-span-4">
                    <RevenueChart data={revenueData} />
                </div>
                <div className="col-span-3 space-y-6">
                    <LowStockAlert data={lowStockData} />
                    <TopProducts data={topProductsData} />
                </div>
            </div>
        </div>
    )
}


