import { getProducts, deleteProduct } from '@/features/products/actions'
import { getMaterials } from '@/features/materials/actions'
import { ProductForm } from '@/components/product-form'
import { Badge } from '@/components/ui/badge'
import { calculateSuggestedPrice } from '@/lib/logic'
import { DeleteButton } from '@/components/delete-button'
import { ShoppingBag, TrendingUp, Package } from 'lucide-react'

import { getSettings } from '@/features/settings/actions'

import { getCurrentTenantPlan } from '@/features/subscription/actions'
import { isReseller } from '@/features/subscription/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PricingSandbox } from '@/components/pricing-sandbox'
import { FinancialHealthDashboard } from '@/components/financial-health-dashboard'
import { AppSettings, ProductWithMaterials } from '@/lib/types'

export default async function ProdutosPage() {
  const [products, materials, settings, tenantStats] = await Promise.all([
    getProducts(),
    getMaterials(),
    getSettings(),
    getCurrentTenantPlan(),
  ])

  const productsList = products as ProductWithMaterials[]
  const appSettings = settings as AppSettings
  const { plan } = tenantStats

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-12">
      <div className="flex flex-col items-center justify-between gap-6 rounded-2xl border border-white/40 bg-white/90 p-6 shadow-md backdrop-blur-2xl md:flex-row">
        <div className="space-y-1 text-center md:text-left">
          <h1 className="text-primary font-serif text-2xl font-black tracking-tight italic sm:text-3xl">
            Seu catálogo
          </h1>
          <p className="text-muted-foreground text-sm font-medium">
            Gerencie cada criação e seu valor real.
          </p>
        </div>
        <ProductForm availableMaterials={materials} settings={appSettings} tenantPlan={plan} />
      </div>

      <FinancialHealthDashboard products={productsList} settings={appSettings} plan={plan} />

      <Tabs defaultValue="catalog" keepMounted={false} className="space-y-5 sm:space-y-6">
        <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl border border-white/40 bg-white/50 p-1 md:w-fit">
          <TabsTrigger
            value="catalog"
            className="min-h-10 gap-2 rounded-lg px-4 py-2 text-sm font-bold"
          >
            <Package size={16} /> Catálogo
          </TabsTrigger>
          <TabsTrigger
            value="sandbox"
            className="min-h-10 gap-2 rounded-lg px-4 py-2 text-sm font-bold"
          >
            <TrendingUp size={16} /> Simulador de preço
          </TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="space-y-6">
          {productsList.length === 0 && (
            <div className="text-muted-foreground bg-muted/5 border-border/60 flex h-48 flex-col items-center justify-center rounded-2xl border border-dashed">
              <ShoppingBag size={40} className="mb-3 opacity-20" />
              <p className="text-sm font-bold">Nenhum produto cadastrado ainda.</p>
            </div>
          )}

          {productsList.map(product => {
            const {
              materialCost,
              laborCost,
              fixedCost,
              suggestedPrice,
              contributionMargin,
              contributionMarginPercentage,
            } = calculateSuggestedPrice(
              product,
              Number(appSettings.hourlyRate || 20),
              appSettings.monthlyFixedCosts || [],
              Number(appSettings.workingHoursPerMonth || 160),
              Number(appSettings.taxRate || 0),
              Number(appSettings.cardFeeRate || 0)
            )

            const finalPrice = product.price || suggestedPrice
            const isManual = !!product.price

            return (
              <div
                key={product.id}
                className="relative overflow-hidden rounded-2xl border border-white/40 bg-white/90 p-6 shadow-sm backdrop-blur-md"
              >
                <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-1 items-start gap-4">
                    <div className="bg-primary/10 text-primary flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-black shadow-inner">
                      {product.name.charAt(0)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg leading-tight font-black">{product.name}</h3>
                        <div className="flex gap-1">
                          <ProductForm
                            availableMaterials={materials}
                            product={product}
                            settings={appSettings}
                            tenantPlan={plan}
                          />
                          <DeleteButton
                            id={product.id}
                            onDelete={deleteProduct}
                            className="hover:bg-danger/10 hover:text-danger h-7 w-7 rounded-full border-none transition-colors"
                          />
                        </div>
                      </div>
                      <div className="text-muted-foreground flex items-center gap-3 text-xs font-bold tracking-wide uppercase opacity-60">
                        {!isReseller(plan) ? (
                          <>
                            <span>{product.laborTime} min de carinho</span>
                            <div className="bg-border h-1.5 w-1.5 rounded-full" />
                            <span>Margem de {product.profitMargin}%</span>
                          </>
                        ) : (
                          <span>Venda Direta / Revenda</span>
                        )}
                      </div>
                      {product.description && (
                        <p className="text-muted-foreground mt-2 line-clamp-2 max-w-md text-xs font-medium italic">
                          {product.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-2 lg:items-end">
                    <div className="flex items-center gap-2">
                      {contributionMarginPercentage >=
                      (appSettings.marginThresholdOptimal || 40) ? (
                        <Badge className="border-success/30 bg-success/10 text-success px-2 text-xs font-black tracking-wide uppercase">
                          Saudável
                        </Badge>
                      ) : contributionMarginPercentage >=
                        (appSettings.marginThresholdWarning || 20) ? (
                        <Badge className="border-warning/40 bg-warning/15 text-foreground px-2 text-xs font-black tracking-wide uppercase">
                          Alerta
                        </Badge>
                      ) : (
                        <Badge className="border-danger/30 bg-danger/10 text-danger px-2 text-xs font-black tracking-wide uppercase">
                          Crítico
                        </Badge>
                      )}
                      <div
                        className={`text-3xl font-black tracking-tighter ${isManual ? 'text-foreground' : 'text-primary animate-pulse-subtle'}`}
                      >
                        {finalPrice.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </div>
                    </div>
                    <div className="text-muted-foreground text-xs font-black tracking-[0.18em] uppercase opacity-40">
                      {isManual ? 'Ajuste manual' : 'Preço sugerido'}
                    </div>
                    {isManual && (
                      <div className="text-primary text-xs font-bold italic opacity-60">
                        Sugestão:{' '}
                        {suggestedPrice.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
                  <div className="bg-primary/5 border-primary/5 rounded-xl border p-3">
                    <p className="text-muted-foreground mb-1 text-xs font-black tracking-wide uppercase opacity-60">
                      {isReseller(plan) ? 'Custo de Compra' : 'Insumos'}
                    </p>
                    <p className="text-foreground text-sm font-black">
                      {materialCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  </div>
                  <div className="bg-primary/5 border-primary/5 rounded-xl border p-3">
                    <p className="text-muted-foreground mb-1 text-xs font-black tracking-wide uppercase opacity-60">
                      Mão de obra
                    </p>
                    <p className="text-foreground text-sm font-black">
                      {laborCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  </div>
                  <div className="bg-primary/5 border-primary/5 rounded-xl border p-3">
                    <p className="text-muted-foreground mb-1 text-xs font-black tracking-wide uppercase opacity-60">
                      Custos Fixos
                    </p>
                    <p className="text-foreground text-sm font-black">
                      {fixedCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  </div>
                  <div
                    className={`bg-primary/10 flex flex-col justify-center rounded-xl border p-3 shadow-inner ${
                      contributionMarginPercentage >= (appSettings.marginThresholdOptimal || 40)
                        ? 'border-success/30 bg-success/10'
                        : contributionMarginPercentage >= (appSettings.marginThresholdWarning || 20)
                          ? 'border-warning/40 bg-warning/15'
                          : 'border-danger/30 bg-danger/10'
                    }`}
                  >
                    <p
                      className={`mb-1 text-xs font-black tracking-wide uppercase ${
                        contributionMarginPercentage >= (appSettings.marginThresholdOptimal || 40)
                          ? 'text-success'
                          : contributionMarginPercentage >=
                              (appSettings.marginThresholdWarning || 20)
                            ? 'text-foreground'
                            : 'text-danger'
                      }`}
                    >
                      {appSettings.financialDisplayMode === 'advanced'
                        ? 'Margem de contribuição bruta'
                        : 'O que sobra'}
                    </p>
                    <p
                      className={`text-base font-black tracking-tighter ${
                        contributionMarginPercentage >= (appSettings.marginThresholdOptimal || 40)
                          ? 'text-success'
                          : contributionMarginPercentage >=
                              (appSettings.marginThresholdWarning || 20)
                            ? 'text-foreground'
                            : 'text-danger'
                      }`}
                    >
                      +{' '}
                      {contributionMargin.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}{' '}
                      {appSettings.financialDisplayMode === 'simple'
                        ? `(${contributionMarginPercentage.toFixed(1)}%)`
                        : `(${contributionMarginPercentage.toFixed(1)}% MC)`}
                    </p>
                  </div>
                </div>

                {product.materials.length > 0 && (
                  <div className="border-primary/5 mt-6 flex flex-wrap gap-2 border-t pt-4">
                    {product.materials.map(pm => (
                      <div
                        key={pm.materialId}
                        className="bg-background border-border/50 flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold shadow-sm"
                      >
                        <div className="bg-primary/40 h-1.5 w-1.5 rounded-full" />
                        {pm.quantity} {pm.unit} {pm.material.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </TabsContent>

        <TabsContent value="sandbox">
          <PricingSandbox products={productsList} settings={appSettings} tenantPlan={plan} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
