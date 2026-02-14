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
    tenantPlan = 'free_creative'
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
        <div className="rounded-xl border border-border/50 bg-background/50 overflow-hidden">
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent border-none">
                        <TableHead className="text-[10px] font-black uppercase tracking-widest opacity-60">Nome</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest opacity-60">
                            {isReseller(tenantPlan) ? 'Custo de Compra' : 'Tempo / Custo Base'}
                        </TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest opacity-60">Sugerido</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest opacity-60">Margem (Desejada)</TableHead>
                        {!isFreePlan(tenantPlan) && (
                            <>
                                <TableHead className={`text-[10px] font-black uppercase tracking-widest opacity-60 ${settings.financialDisplayMode === 'advanced' ? 'text-primary' : ''}`}>
                                    {settings.financialDisplayMode === 'advanced' ? 'MC (%)' : 'Saúde'}
                                </TableHead>
                                {settings.financialDisplayMode === 'advanced' && (
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest opacity-60 text-primary">BEP (Un)</TableHead>
                                )}
                            </>
                        )}
                        {isFreePlan(tenantPlan) && (
                            <TableHead className="text-[10px] font-black uppercase tracking-widest opacity-60 text-center">
                                <UpgradeLock size="sm" className="inline-flex border-none bg-transparent p-0" />
                            </TableHead>
                        )}
                        <TableHead className="text-[10px] font-black uppercase tracking-widest opacity-60">Preço Final</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest opacity-60 text-right">Ações</TableHead>
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
                            <TableRow key={product.id} className="hover:bg-primary/5 transition-colors border-border/40 text-xs">
                                <TableCell className="font-black text-sm">{product.name}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-bold">
                                            {isReseller(tenantPlan)
                                                ? ((product.cost || product.lastCost || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }))
                                                : pricing.baseCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                            }
                                        </span>
                                        {!isReseller(tenantPlan) && (
                                            <span className="text-[10px] opacity-60 italic">{product.laborTime} min</span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="font-bold text-primary italic">
                                    {pricing.suggestedPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </TableCell>
                                <TableCell className="font-medium">
                                    {product.profitMargin}%
                                </TableCell>
                                {!isFreePlan(tenantPlan) ? (
                                    <>
                                        <TableCell>
                                            {settings.financialDisplayMode === 'advanced' ? (
                                                <span className="font-black text-primary italic">
                                                    {pricing.contributionMarginPercentage.toFixed(1)}%
                                                </span>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    {pricing.contributionMarginPercentage >= (settings.marginThresholdOptimal || 40) ? (
                                                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 text-[9px] font-black uppercase">Saudável</Badge>
                                                    ) : pricing.contributionMarginPercentage >= (settings.marginThresholdWarning || 20) ? (
                                                        <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200 text-[9px] font-black uppercase">Alerta</Badge>
                                                    ) : (
                                                        <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200 text-[9px] font-black uppercase">Crítico</Badge>
                                                    )}
                                                </div>
                                            )}
                                        </TableCell>
                                        {settings.financialDisplayMode === 'advanced' && (
                                            <TableCell className="font-bold text-primary">
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
                                        <span className={`font-black ${isManual ? 'text-foreground' : 'text-muted-foreground opacity-70'}`}>
                                            {finalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </span>
                                        {isManual && (
                                            <span className="text-[9px] font-bold uppercase tracking-tighter opacity-40">Ajuste Manual</span>
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
                                            className="h-8 w-8 hover:bg-red-50 hover:text-red-500 rounded-lg border-none transition-colors"
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
