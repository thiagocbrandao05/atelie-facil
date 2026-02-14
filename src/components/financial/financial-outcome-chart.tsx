'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useFinancialInsights } from '@/features/financials/use-financial-insights'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'
import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function FinancialOutcomeChart({ isPremium }: { isPremium: boolean }) {
    const { history, isLoading } = useFinancialInsights()

    if (!isPremium) {
        return (
            <Card className="relative overflow-hidden">
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-4">
                    <Lock className="w-12 h-12 text-muted-foreground" />
                    <div className="text-center">
                        <p className="font-bold text-lg">Recurso Premium</p>
                        <p className="text-sm text-muted-foreground">Visualize tendências financeiras</p>
                    </div>
                    <Button asChild>
                        <Link href="/upgrade">Fazer Upgrade</Link>
                    </Button>
                </div>
                <CardHeader>
                    <CardTitle>Tendência Financeira</CardTitle>
                </CardHeader>
                <CardContent className="blur-sm">
                    <div className="h-[300px] w-full bg-muted/20 rounded-lg" />
                </CardContent>
            </Card>
        )
    }

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Tendência Financeira</CardTitle>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[300px] w-full" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Tendência Financeira (6 meses)</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={history}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                            dataKey="month"
                            className="text-xs"
                            tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <YAxis
                            className="text-xs"
                            tick={{ fill: 'hsl(var(--muted-foreground))' }}
                            tickFormatter={(value: number) => `R$ ${(value / 1000).toFixed(0)}k`}
                        />
                        <Tooltip
                            formatter={(value: number | string) => `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                            contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px'
                            }}
                        />
                        <Legend />
                        <Bar dataKey="income" fill="hsl(var(--chart-1))" name="Entradas" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="expenses" fill="hsl(var(--chart-2))" name="Saídas" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
