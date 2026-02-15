'use client'

import { ProductWithMaterials } from '@/lib/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ProductForm } from './product-form'
import { DeleteButton } from './delete-button'
import { deleteProduct } from '@/features/products/actions'
import { PlanType } from '@/features/subscription/types'
import { calculateSuggestedPrice } from '@/lib/logic'
import { isReseller, isFreePlan } from '@/features/subscription/utils'
import { UpgradeLock } from '@/components/upgrade-lock'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Info } from 'lucide-react'

interface ProductListSimplifiedProps {
  products: ProductWithMaterials[]
  materials: any[]
  settings: any
  tenantPlan?: PlanType
}

export function ProductListSimplified({
  products,
  materials,
  settings,
  tenantPlan = 'free_creative',
}: ProductListSimplifiedProps) {
  const hourlyRate = Number(settings?.hourlyRate || 20)
  const monthlyFixedCosts = settings?.monthlyFixedCosts || []
  const workingHoursPerMonth = Number(settings?.workingHoursPerMonth || 160)
  const taxRate = Number(settings?.taxRate || 0)
  const cardFeeRate = Number(settings?.cardFeeRate || 0)

  if (products.length === 0) {
    return (
      <div className="bg-muted/10 flex flex-col items-center justify-center rounded-lg p-8 text-center">
        <p className="text-muted-foreground font-medium italic">Nenhum produto cadastrado.</p>
      </div>
    )
  }

  return (
    <div className="border-border/50 bg-background/50 overflow-hidden rounded-xl border">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow className="border-none hover:bg-transparent">
            <TableHead className="text-[10px] font-black tracking-widest uppercase opacity-60">
              Nome
            </TableHead>
            <TableHead className="text-[10px] font-black tracking-widest uppercase opacity-60">
              {isReseller(tenantPlan) ? 'Custo de Compra' : 'Tempo / Custo Base'}
            </TableHead>
            <TableHead className="text-[10px] font-black tracking-widest uppercase opacity-60">
              Sugerido
            </TableHead>
            <TableHead className="text-[10px] font-black tracking-widest uppercase opacity-60">
              Margem (Desejada)
            </TableHead>
            {!isFreePlan(tenantPlan) && (
              <>
                <TableHead
                  className={`text-[10px] font-black tracking-widest uppercase opacity-60 ${settings.financialDisplayMode === 'advanced' ? 'text-primary' : ''}`}
                >
                  {settings.financialDisplayMode === 'advanced' ? 'MC (%)' : 'Saúde'}
                </TableHead>
                {settings.financialDisplayMode === 'advanced' && (
                  <TableHead className="text-primary text-[10px] font-black tracking-widest uppercase opacity-60">
                    BEP (Un)
                  </TableHead>
                )}
              </>
            )}
            {isFreePlan(tenantPlan) && (
              <TableHead className="text-center text-[10px] font-black tracking-widest uppercase opacity-60">
                <UpgradeLock size="sm" className="inline-flex border-none bg-transparent p-0" />
              </TableHead>
            )}
            <TableHead className="text-[10px] font-black tracking-widest uppercase opacity-60">
              Preço Final
            </TableHead>
            <TableHead className="text-right text-[10px] font-black tracking-widest uppercase opacity-60">
              Ações
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map(product => {
            const pricing = calculateSuggestedPrice(
              product,
              hourlyRate,
              monthlyFixedCosts,
              workingHoursPerMonth,
              taxRate,
              cardFeeRate
            )
            const finalPrice = product.price || pricing.suggestedPrice
            const isManual = !!product.price

            return (
              <TableRow
                key={product.id}
                className="hover:bg-primary/5 border-border/40 text-xs transition-colors"
              >
                <TableCell className="text-sm font-black">{product.name}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-bold">
                      {isReseller(tenantPlan)
                        ? (product.cost || product.lastCost || 0).toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })
                        : pricing.baseCost.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                    </span>
                    {!isReseller(tenantPlan) && (
                      <span className="text-[10px] italic opacity-60">{product.laborTime} min</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-primary font-bold italic">
                  {pricing.suggestedPrice.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </TableCell>
                <TableCell className="font-medium">{product.profitMargin}%</TableCell>
                {!isFreePlan(tenantPlan) ? (
                  <>
                    <TableCell>
                      {settings.financialDisplayMode === 'advanced' ? (
                        <span className="text-primary font-black italic">
                          {pricing.contributionMarginPercentage.toFixed(1)}%
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          {pricing.contributionMarginPercentage >=
                          (settings.marginThresholdOptimal || 40) ? (
                            <Badge className="border-green-200 bg-green-100 text-[9px] font-black text-green-700 uppercase hover:bg-green-100">
                              Saudável
                            </Badge>
                          ) : pricing.contributionMarginPercentage >=
                            (settings.marginThresholdWarning || 20) ? (
                            <Badge className="border-yellow-200 bg-yellow-100 text-[9px] font-black text-yellow-700 uppercase hover:bg-yellow-100">
                              Alerta
                            </Badge>
                          ) : (
                            <Badge className="border-red-200 bg-red-100 text-[9px] font-black text-red-700 uppercase hover:bg-red-100">
                              Crítico
                            </Badge>
                          )}
                        </div>
                      )}
                    </TableCell>
                    {settings.financialDisplayMode === 'advanced' && (
                      <TableCell className="text-primary font-bold">
                        {pricing.breakEvenUnits === Infinity ? '∞' : pricing.breakEvenUnits}
                      </TableCell>
                    )}
                  </>
                ) : (
                  <TableCell className="text-center opacity-50">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <UpgradeLock size="sm" className="border-none bg-transparent p-0" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Análise de saúde disponível no Premium</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                )}
                <TableCell>
                  <div className="flex flex-col">
                    <span
                      className={`font-black ${isManual ? 'text-foreground' : 'text-muted-foreground opacity-70'}`}
                    >
                      {finalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                    {isManual && (
                      <span className="text-[9px] font-bold tracking-tighter uppercase opacity-40">
                        Ajuste Manual
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <ProductForm
                      availableMaterials={materials}
                      product={product}
                      settings={settings}
                      tenantPlan={tenantPlan}
                    />
                    <DeleteButton
                      id={product.id}
                      onDelete={deleteProduct}
                      className="h-8 w-8 rounded-lg border-none transition-colors hover:bg-red-50 hover:text-red-500"
                    />
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
