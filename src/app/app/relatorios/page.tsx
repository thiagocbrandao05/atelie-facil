import {
  getMonthlyRevenue,
  getTopProducts,
  getLowStockMaterials,
} from '@/features/analytics/actions'
import { RevenueChart } from '@/components/analytics/revenue-chart'
import { TopProducts } from '@/components/analytics/top-products'
import { LowStockAlert } from '@/components/analytics/low-stock-alert'

export default async function ReportsPage() {
  const [revenueData, topProductsData, lowStockData] = await Promise.all([
    getMonthlyRevenue(),
    getTopProducts(),
    getLowStockMaterials(),
  ])

  const totalRevenue = revenueData.reduce((acc, curr) => acc + curr.value, 0)

  return (
    <div className="space-y-5 md:space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Relatórios e analytics</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Acompanhe resultados do negócio e identifique oportunidades.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border bg-white p-5 shadow-sm md:p-6">
          <h3 className="text-muted-foreground text-sm font-medium">Receita total (6 meses)</h3>
          <div className="mt-2 text-2xl font-bold">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
              totalRevenue
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <div className="col-span-7 md:col-span-4">
          <RevenueChart data={revenueData} />
        </div>
        <div className="col-span-7 space-y-6 md:col-span-3">
          <LowStockAlert data={lowStockData} />
          <TopProducts data={topProductsData} />
        </div>
      </div>
    </div>
  )
}
