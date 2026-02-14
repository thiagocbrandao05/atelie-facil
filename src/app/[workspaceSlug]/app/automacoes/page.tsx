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
  title: 'Automações inteligentes | Atelis',
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
    <div className="flex-1 space-y-5 p-4 pt-4 sm:space-y-6 sm:p-6 sm:pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <div className="flex items-start gap-3">
          <div className="bg-primary/10 rounded-lg p-2">
            <Sparkles className="text-primary h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Automações inteligentes
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Insights e sugestões com base nos dados do seu ateliê.
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
