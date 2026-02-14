import { getProducts, deleteProduct } from '@/features/products/actions'
import { getMaterials } from '@/features/materials/actions'
import { ProductForm } from '@/components/product-form'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { calculateSuggestedPrice } from '@/lib/logic'
import { DeleteButton } from '@/components/delete-button'
import { ShoppingBag } from 'lucide-react'

import { getSettings } from '@/features/settings/actions'

import { getCurrentTenantPlan } from '@/features/subscription/actions'
import { isReseller } from '@/features/subscription/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PricingSandbox } from '@/components/pricing-sandbox'
import { TrendingUp, Package, Heart, Target, Percent } from 'lucide-react'
import { FinancialHealthDashboard } from '@/components/financial-health-dashboard'

export default async function ProdutosPage() {
  const [products, materials, settings, tenantStats] = await Promise.all([
    getProducts(),
    getMaterials(),
    getSettings(),
    getCurrentTenantPlan(),
  ])
  const productsAsAny = products as any[]
  const { plan, profile } = tenantStats

  const hourlyRate = Number(settings?.hourlyRate || 20)

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-12">
      {/* Artisan Header - Scaled Down */}
      <div className="flex flex-col items-center justify-between gap-6 rounded-2xl border border-white/40 bg-white/90 p-6 shadow-md backdrop-blur-2xl md:flex-row">
        <div className="space-y-1 text-center md:text-left">
          <h1 className="text-primary font-serif text-2xl font-black tracking-tight italic sm:text-3xl">
            Seu catálogo
          </h1>
          <p className="text-muted-foreground text-sm font-medium">
            Gerencie cada criação e seu valor real.
          </p>
        </div>
        <ProductForm availableMaterials={materials} settings={settings} tenantPlan={plan} />
      </div>

      {/* Financial Health Overview (Invisible Finance) */}
      <FinancialHealthDashboard products={products as any} settings={settings} plan={plan} />

      <Tabs defaultValue="catalog" className="space-y-5 sm:space-y-6">
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
            <TrendingUp size={16} /> Simulador (Sandbox)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="space-y-6">
          {products.length === 0 && (
            <div className="text-muted-foreground bg-muted/5 border-border/60 flex h-48 flex-col items-center justify-center rounded-2xl border border-dashed">
              <ShoppingBag size={40} className="mb-3 opacity-20" />
              <p className="text-sm font-bold">Nenhum produto cadastrado ainda.</p>
            </div>
          )}

          {productsAsAny.map(product => {
            const {
              materialCost,
              laborCost,
              fixedCost,
              marginValue,
              suggestedPrice,
              contributionMargin,
              contributionMarginPercentage,
            } = calculateSuggestedPrice(
              product as any,
              Number(settings?.hourlyRate || 20),
              settings?.monthlyFixedCosts || [],
              Number(settings?.workingHoursPerMonth || 160),
              Number(settings?.taxRate || 0),
              Number(settings?.cardFeeRate || 0)
            )

            const finalPrice = product.price || suggestedPrice
            const isManual = !!product.price

            return (
              <div
                key={product.id}
                className="group relative overflow-hidden rounded-2xl border border-white/40 bg-white/90 p-6 shadow-sm backdrop-blur-md transition-all hover:bg-white hover:shadow-lg"
              >
                <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-1 items-start gap-4">
                    <div className="bg-primary/10 text-primary flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-black shadow-inner">
                      {product.name.charAt(0)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg leading-tight font-black">{product.name}</h3>
                        <div className="flex gap-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                          <ProductForm
                            availableMaterials={materials}
                            product={product as any}
                            settings={settings}
                            tenantPlan={plan}
                          />
                          <DeleteButton
                            id={product.id}
                            onDelete={deleteProduct}
                            className="h-7 w-7 rounded-full border-none transition-colors hover:bg-red-50 hover:text-red-500"
                          />
                        </div>
                      </div>
                      <div className="text-muted-foreground flex items-center gap-3 text-[10px] font-bold tracking-widest uppercase opacity-60">
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
                      {contributionMarginPercentage >= (settings.marginThresholdOptimal || 40) ? (
                        <Badge className="border-green-200 bg-green-100 px-2 text-[9px] font-black tracking-widest text-green-700 uppercase hover:bg-green-100">
                          Saudável
                        </Badge>
                      ) : contributionMarginPercentage >=
                        (settings.marginThresholdWarning || 20) ? (
                        <Badge className="border-yellow-200 bg-yellow-100 px-2 text-[9px] font-black tracking-widest text-yellow-700 uppercase hover:bg-yellow-100">
                          Alerta
                        </Badge>
                      ) : (
                        <Badge className="border-red-200 bg-red-100 px-2 text-[9px] font-black tracking-widest text-red-700 uppercase hover:bg-red-100">
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
                    <div className="text-muted-foreground text-[9px] font-black tracking-[0.2em] uppercase opacity-40">
                      {isManual ? 'Ajuste manual' : 'Preço sugerido'}
                    </div>
                    {isManual && (
                      <div className="text-primary text-[10px] font-bold italic opacity-60">
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
                  <div className="bg-primary/5 border-primary/5 hover:bg-primary/10 rounded-xl border p-3 transition-colors">
                    <p className="text-muted-foreground mb-1 text-[8px] font-black tracking-widest uppercase opacity-60">
                      {isReseller(plan) ? 'Custo de Compra' : 'Insumos'}
                    </p>
                    <p className="text-foreground text-sm font-black">
                      {materialCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  </div>
                  <div className="bg-primary/5 border-primary/5 hover:bg-primary/10 rounded-xl border p-3 transition-colors">
                    <p className="text-muted-foreground mb-1 text-[8px] font-black tracking-widest uppercase opacity-60">
                      Mão de obra
                    </p>
                    <p className="text-foreground text-sm font-black">
                      {laborCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  </div>
                  <div className="bg-primary/5 border-primary/5 hover:bg-primary/10 rounded-xl border p-3 transition-colors">
                    <p className="text-muted-foreground mb-1 text-[8px] font-black tracking-widest uppercase opacity-60">
                      Custos Fixos
                    </p>
                    <p className="text-foreground text-sm font-black">
                      {fixedCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  </div>
                  <div
                    className={`bg-primary/10 flex flex-col justify-center rounded-xl border p-3 shadow-inner ${
                      contributionMarginPercentage >= (settings.marginThresholdOptimal || 40)
                        ? 'border-green-500/20 bg-green-50/50'
                        : contributionMarginPercentage >= (settings.marginThresholdWarning || 20)
                          ? 'border-yellow-500/20 bg-yellow-50/50'
                          : 'border-red-500/20 bg-red-50/50'
                    }`}
                  >
                    <p
                      className={`mb-1 text-[8px] font-black tracking-widest uppercase ${
                        contributionMarginPercentage >= (settings.marginThresholdOptimal || 40)
                          ? 'text-green-700'
                          : contributionMarginPercentage >= (settings.marginThresholdWarning || 20)
                            ? 'text-yellow-700'
                            : 'text-red-700'
                      }`}
                    >
                      {settings.financialDisplayMode === 'advanced'
                        ? `Margem de contribuição bruta`
                        : `O que sobra`}
                    </p>
                    <p
                      className={`text-base font-black tracking-tighter ${
                        contributionMarginPercentage >= (settings.marginThresholdOptimal || 40)
                          ? 'text-green-700'
                          : contributionMarginPercentage >= (settings.marginThresholdWarning || 20)
                            ? 'text-yellow-700'
                            : 'text-red-700'
                      }`}
                    >
                      +{' '}
                      {contributionMargin.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}{' '}
                      {settings.financialDisplayMode === 'simple'
                        ? `(${contributionMarginPercentage.toFixed(1)}%)`
                        : `(${contributionMarginPercentage.toFixed(1)}% MC)`}
                    </p>
                  </div>
                </div>

                {product.materials.length > 0 && (
                  <div className="border-primary/5 mt-6 flex flex-wrap gap-2 border-t pt-4">
                    {(product.materials as any[]).map((pm: any) => (
                      <div
                        key={pm.materialId}
                        className="bg-background border-border/50 flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold shadow-sm"
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
          <PricingSandbox products={products as any} settings={settings} tenantPlan={plan} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
