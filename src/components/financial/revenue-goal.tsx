'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useFinancialInsights } from '@/features/financials/use-financial-insights'
import { useFinancials } from '@/features/financials/use-financials'
import { Lock, Target, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

export function RevenueGoalWidget({ isPremium }: { isPremium: boolean }) {
    const { preferences, updateGoal, isLoading } = useFinancialInsights()
    const { summary } = useFinancials()
    const [isEditing, setIsEditing] = useState(false)
    const [goalInput, setGoalInput] = useState('')

    const currentGoal = preferences?.monthly_revenue_goal || 0
    const currentRevenue = summary.income
    const progress = currentGoal > 0 ? Math.min((currentRevenue / currentGoal) * 100, 100) : 0

    const handleSaveGoal = async () => {
        const value = parseFloat(goalInput)
        if (isNaN(value) || value <= 0) return
        await updateGoal(value)
        setIsEditing(false)
        setGoalInput('')
    }

    if (!isPremium) {
        return (
            <Card className="relative overflow-hidden">
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-4">
                    <Lock className="w-12 h-12 text-muted-foreground" />
                    <div className="text-center">
                        <p className="font-bold text-lg">Recurso Premium</p>
                        <p className="text-sm text-muted-foreground">Defina metas de faturamento</p>
                    </div>
                    <Button asChild>
                        <Link href="/upgrade">Fazer Upgrade</Link>
                    </Button>
                </div>
                <CardHeader>
                    <CardTitle>Meta de Faturamento</CardTitle>
                </CardHeader>
                <CardContent className="blur-sm">
                    <div className="h-[120px] w-full bg-muted/20 rounded-lg" />
                </CardContent>
            </Card>
        )
    }

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Meta de Faturamento</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[120px] flex items-center justify-center">
                        <p className="text-sm text-muted-foreground">Carregando...</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Meta Mensal</CardTitle>
                <Dialog open={isEditing} onOpenChange={setIsEditing}>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Target className="h-4 w-4" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Definir Meta de Faturamento</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                            <div>
                                <label className="text-sm font-medium">Meta Mensal (R$)</label>
                                <Input
                                    type="number"
                                    placeholder="Ex: 10000"
                                    value={goalInput}
                                    onChange={(e) => setGoalInput(e.target.value)}
                                    className="mt-2"
                                />
                            </div>
                            <Button onClick={handleSaveGoal} className="w-full">
                                Salvar Meta
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                {currentGoal > 0 ? (
                    <div className="space-y-3">
                        <div className="flex items-baseline justify-between">
                            <div>
                                <p className="text-2xl font-bold">
                                    {currentRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    de {currentGoal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </p>
                            </div>
                            <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                                <TrendingUp className="h-4 w-4" />
                                {progress.toFixed(0)}%
                            </div>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                            <div
                                className="bg-primary h-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-6">
                        <Target className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mb-3">Nenhuma meta definida</p>
                        <Button onClick={() => setIsEditing(true)} size="sm">
                            Definir Meta
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
