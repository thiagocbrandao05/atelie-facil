import { Metadata } from 'next'
import { getDemandForecast } from '@/features/automations/actions/demand-forecast'
import { getSupplyRecommendations } from '@/features/automations/actions/supply-recommendations'
import { getProductionAlerts } from '@/features/automations/actions/production-alerts'
import { getCustomerSeasonality } from '@/features/automations/actions/customer-seasonality'
import { DemandForecastCard } from '@/features/automations/components/demand-forecast-card'
import { SupplyRecommendationsCard } from '@/features/automations/components/supply-recommendations-card'
import { ProductionAlertsCard } from '@/features/automations/components/production-alerts-card'
import { CustomerSeasonalityCard } from '@/features/automations/components/customer-seasonality-card'
import { Sparkles } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Automações Inteligentes | Ateliê Fácil',
  description: 'Insights e automações para o seu ateliê',
}

export default async function AutomationsPage() {
  const [demandForecast, supplyRecommendations, productionAlerts, customerSeasonality] =
    await Promise.all([
      getDemandForecast(),
      getSupplyRecommendations(),
      getProductionAlerts(),
      getCustomerSeasonality(),
    ])

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 rounded-lg p-2">
            <Sparkles className="text-primary h-6 w-6" />
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Automações Inteligentes</h2>
            <p className="text-muted-foreground">
              Insights e sugestões baseados nos dados do seu ateliê.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="col-span-1 lg:col-span-2">
          <DemandForecastCard data={demandForecast} />
        </div>
        <div className="col-span-1 lg:col-span-1">
          <ProductionAlertsCard data={productionAlerts} />
        </div>
        <div className="col-span-1 lg:col-span-1">
          <CustomerSeasonalityCard data={customerSeasonality} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-2 lg:col-span-7">
          <SupplyRecommendationsCard data={supplyRecommendations} />
        </div>
      </div>
    </div>
  )
}
