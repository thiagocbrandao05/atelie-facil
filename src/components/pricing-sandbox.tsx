'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { TrendingUp, Calculator, AlertCircle, ArrowRight, Target, Percent } from 'lucide-react'
import { analyzeProfitability, applyPsychologicalPricing } from '@/lib/finance/intelligence'
import { calculateSuggestedPrice } from '@/lib/logic'
import { ProductWithMaterials } from '@/lib/types'

import { PlanType } from '@/features/subscription/types'
import { isFreePlan } from '@/features/subscription/utils'
import { UpgradeLock } from '@/components/upgrade-lock'

interface PricingSandboxProps {
    products: ProductWithMaterials[]
    settings: any
    tenantPlan?: PlanType
}

export function PricingSandbox({ products, settings, tenantPlan = 'free_creative' }: PricingSandboxProps) {
    const [selectedProductId, setSelectedProductId] = useState<string>('')
    const [costAdjustmentPercent, setCostAdjustmentPercent] = useState<number>(0)
    const [priceAdjustmentPercent, setPriceAdjustmentPercent] = useState<number>(0)
    const [targetProfitGoal, setTargetProfitGoal] = useState<number>(settings.targetMonthlyProfit || 0)

    const selectedProduct = useMemo(() =>
        products.find(p => p.id === selectedProductId),
        [products, selectedProductId])

    const simulation = useMemo(() => {
        if (!selectedProduct) return null

        // Get baseline from logic.ts
        const baseline = calculateSuggestedPrice(
            selectedProduct,
            settings.hourlyRate,
            settings.monthlyFixedCosts,
            settings.workingHoursPerMonth,
            settings.taxRate,
            settings.cardFeeRate
        )

        const currentPrice = selectedProduct.price || baseline.suggestedPrice
        const currentCost = baseline.baseCost

        // Apply adjustments
        const simulatedCost = currentCost * (1 + costAdjustmentPercent / 100)
        const simulatedPrice = currentPrice * (1 + priceAdjustmentPercent / 100)

        const analysis = analyzeProfitability(
            simulatedPrice,
            simulatedCost,
            settings.taxRate,
            settings.cardFeeRate,
            settings.monthlyFixedCosts.reduce((acc: number, item: any) => acc + (Number(item.value) || 0), 0)
        )

        return {
            baselinePrice: currentPrice,
            baselineCost: currentCost,
            simulatedPrice,
            simulatedCost,
            analysis,
            erosion: (currentPrice - currentCost) - (simulatedPrice - simulatedCost)
        }
    }, [selectedProduct, settings, costAdjustmentPercent, priceAdjustmentPercent])

    if (products.length === 0) {
        return (
            <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                    <AlertCircle size={40} className="mb-4 text-muted-foreground opacity-20" />
                    <p className="font-bold">Cadastre produtos primeiro para usar o simulador.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Constraints & Controls */}
            <Card className="lg:col-span-1 border-primary/20 bg-primary/5">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calculator size={18} className="text-primary" /> Parâmetros do Cenário
                    </CardTitle>
                    <CardDescription>Ajuste os valores para ver o impacto.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label>1. Selecione o Produto</Label>
                        <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                            <SelectTrigger className="bg-background">
                                <SelectValue placeholder="Escolha um produto..." />
                            </SelectTrigger>
                            <SelectContent>
                                {products.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="flex justify-between">
                                <span>Variação de Custo</span>
                                <span className={costAdjustmentPercent > 0 ? 'text-red-500 font-bold' : 'text-green-600 font-bold'}>
                                    {costAdjustmentPercent > 0 ? '+' : ''}{costAdjustmentPercent}%
                                </span>
                            </Label>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => setCostAdjustmentPercent(p => p - 5)}>-5%</Button>
                                <Input
                                    type="number"
                                    value={costAdjustmentPercent}
                                    onChange={e => setCostAdjustmentPercent(Number(e.target.value))}
                                    className="bg-background text-center font-bold"
                                />
                                <Button variant="outline" size="sm" onClick={() => setCostAdjustmentPercent(p => p + 5)}>+5%</Button>
                            </div>
                            <p className="text-[10px] text-muted-foreground italic">Ex: Aumento no preço da matéria-prima.</p>
                        </div>

                        <div className="space-y-2">
                            <Label className="flex justify-between">
                                <span>Ajuste de Preço de Venda</span>
                                <span className={priceAdjustmentPercent > 0 ? 'text-green-600 font-bold' : 'text-red-500 font-bold'}>
                                    {priceAdjustmentPercent > 0 ? '+' : ''}{priceAdjustmentPercent}%
                                </span>
                            </Label>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => setPriceAdjustmentPercent(p => p - 5)}>-5%</Button>
                                <Input
                                    type="number"
                                    value={priceAdjustmentPercent}
                                    onChange={e => setPriceAdjustmentPercent(Number(e.target.value))}
                                    className="bg-background text-center font-bold"
                                />
                                <Button variant="outline" size="sm" onClick={() => setPriceAdjustmentPercent(p => p + 5)}>+5%</Button>
                            </div>
                            <p className="text-[10px] text-muted-foreground italic">Ex: Reajuste anual ou promoção.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Results / Feedback */}
            <Card className="lg:col-span-2 overflow-hidden">
                {!simulation ? (
                    <CardContent className="flex h-full items-center justify-center p-12 text-center text-muted-foreground">
                        <div className="max-w-xs space-y-4">
                            <TrendingUp size={48} className="mx-auto opacity-10" />
                            <p className="text-sm font-medium italic">Selecione um produto ao lado para iniciar a simulação estratégica.</p>
                        </div>
                    </CardContent>
                ) : (
                    <>
                        <CardHeader className="bg-primary/5 border-b border-primary/10">
                            <div className="flex items-center justify-between">
                                <CardTitle>Resultados da Simulação: {selectedProduct?.name}</CardTitle>
                                {!isFreePlan(tenantPlan) && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-black uppercase opacity-60">Status:</span>
                                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${simulation.analysis.contributionMarginPercentage.toNumber() >= (settings.marginThresholdOptimal || 40)
                                            ? 'bg-green-100 text-green-700'
                                            : simulation.analysis.contributionMarginPercentage.toNumber() >= (settings.marginThresholdWarning || 20)
                                                ? 'bg-yellow-100 text-yellow-700'
                                                : 'bg-red-100 text-red-700'
                                            }`}>
                                            {simulation.analysis.contributionMarginPercentage.toNumber() >= (settings.marginThresholdOptimal || 40)
                                                ? 'Lucratividade Saudável'
                                                : simulation.analysis.contributionMarginPercentage.toNumber() >= (settings.marginThresholdWarning || 20)
                                                    ? 'Atenção à Margem'
                                                    : 'Prejuízo / Risco'}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-8 relative min-h-[400px]">
                            {isFreePlan(tenantPlan) && (
                                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-b-xl">
                                    <UpgradeLock message="Simulação avançada e análise de cenários disponível apenas no Premium." size="lg" />
                                </div>
                            )}

                            {/* Top Row: Price & Cost Comparison */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-muted/30 rounded-2xl p-4 flex flex-col justify-center">
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Novo Preço Simulado</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl font-black italic">R$ {simulation.simulatedPrice.toFixed(2)}</span>
                                        <span className="text-xs text-muted-foreground line-through">R$ {simulation.baselinePrice.toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="bg-muted/30 rounded-2xl p-4 flex flex-col justify-center">
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Novo Custo Base</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl font-black italic">R$ {simulation.simulatedCost.toFixed(2)}</span>
                                        <span className="text-xs text-muted-foreground line-through">R$ {simulation.baselineCost.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Profitability Radar */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="border border-primary/20 rounded-2xl p-5 shadow-sm space-y-1">
                                    <div className="flex items-center gap-2 text-primary">
                                        <Percent size={14} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">
                                            {settings.financialDisplayMode === 'advanced' ? 'Margem MC' : 'Sobra p/ seu bolso'}
                                        </span>
                                    </div>
                                    <p className="text-3xl font-black text-primary">{simulation.analysis.contributionMarginPercentage.toFixed(1)}%</p>
                                    <p className="text-[10px] text-muted-foreground">Sobra R$ {simulation.analysis.contributionMargin.toFixed(2)} por venda</p>
                                </div>

                                <div className="border border-primary/20 rounded-2xl p-5 shadow-sm space-y-1">
                                    <div className="flex items-center gap-2 text-primary">
                                        <Target size={14} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">
                                            {settings.financialDisplayMode === 'advanced' ? 'Equilíbrio (Mensal)' : 'Meta de Vendas'}
                                        </span>
                                    </div>
                                    <p className="text-3xl font-black text-primary">
                                        {simulation.analysis.breakEvenUnits.eq(Infinity) ? '∞' : simulation.analysis.breakEvenUnits.toString()}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">
                                        {settings.financialDisplayMode === 'advanced' ? 'Unidades para pagar as contas' : 'Vendas p/ cobrir custos fixos'}
                                    </p>
                                </div>

                                <div className="border border-primary/20 rounded-2xl p-5 shadow-sm space-y-1">
                                    <div className="flex items-center gap-2 text-primary">
                                        <TrendingUp size={14} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">
                                            {settings.financialDisplayMode === 'advanced' ? 'Faturamento Mínimo' : 'Vendas p/ Empatar'}
                                        </span>
                                    </div>
                                    <p className="text-xl font-black text-primary">R$ {simulation.analysis.breakEvenRevenue.toFixed(2)}</p>
                                    <p className="text-[10px] text-muted-foreground">Receita necessária para BEP</p>
                                </div>
                            </div>

                            {/* Strategic Advice */}
                            <div className="bg-primary/10 rounded-2xl p-6 border border-primary/20">
                                <div className="flex items-start gap-4">
                                    <div className="bg-primary text-primary-foreground p-3 rounded-xl">
                                        <TrendingUp size={24} />
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="font-black italic text-primary">Insight Estratégico</h4>
                                        <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                                            {simulation.analysis.contributionMarginPercentage.toNumber() < (settings.marginThresholdWarning || 20)
                                                ? "🚨 Sua margem de contribuição está crítica (abaixo do recomendado). Considere rever fornecedores ou aplicar o Arredondamento Psicológico para elevar o valor percebido sem choques."
                                                : simulation.analysis.contributionMarginPercentage.toNumber() < (settings.marginThresholdOptimal || 40)
                                                    ? "⚖️ Margem intermediária. Ótima para volume, mas pouco resistente a aumentos de insumos. Mantenha um olho no Ponto de Equilíbrio!"
                                                    : "💎 Margem excelente! Você tem gordura financeira para absorver variações de custo ou investir em tráfego pago para este produto específico."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </>
                )}
            </Card>
        </div>
    )
}
