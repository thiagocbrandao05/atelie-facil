'use client'

import * as React from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type Order = {
    id: string
    deliveryDate: Date | string
    customerName?: string
    customer?: { name: string }
    items?: string[]
    status: string
}

export function OrderCalendar({ orders = [] }: { orders: Order[] }) {
    const [date, setDate] = React.useState<Date | undefined>(new Date())

    // Group orders by date
    const ordersByDate = React.useMemo(() => {
        const grouped: Record<string, Order[]> = {}
        orders.forEach(order => {
            if (!order.deliveryDate) return
            const dateKey = format(new Date(order.deliveryDate), 'yyyy-MM-dd')
            if (!grouped[dateKey]) {
                grouped[dateKey] = []
            }
            grouped[dateKey].push(order)
        })
        return grouped
    }, [orders])

    const selectedDateKey = date ? format(date, 'yyyy-MM-dd') : null
    const selectedOrders = selectedDateKey ? (ordersByDate[selectedDateKey] || []) : []

    // Create modifiers for days with orders
    const hasOrderModifier = (day: Date) => {
        const dateKey = format(day, 'yyyy-MM-dd')
        return !!ordersByDate[dateKey]
    }

    return (
        <div className="grid gap-4 md:grid-cols-[auto_1fr]">
            <Card className="glass-card w-fit h-fit">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">Calendário</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        className="rounded-md"
                        locale={ptBR}
                        modifiers={{
                            hasOrder: hasOrderModifier
                        }}
                        modifiersClassNames={{
                            hasOrder: 'font-bold text-primary underline decoration-primary/50 underline-offset-4'
                        }}
                    />
                </CardContent>
            </Card>

            <Card className="glass-card h-full min-h-[350px]">
                <CardHeader>
                    <CardTitle>Entregas em {date ? format(date, "d 'de' MMMM", { locale: ptBR }) : '...'}</CardTitle>
                    <CardDescription>
                        {selectedOrders.length} entrega(s) agendada(s)
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {selectedOrders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                            <p>Nenhuma entrega para este dia.</p>
                        </div>
                    ) : (
                        selectedOrders.map((order, i) => (
                            <div
                                key={order.id || i}
                                className="flex flex-col gap-2 p-3 rounded-lg bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-colors"
                            >
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold">
                                        {order.customerName || order.customer?.name || 'Cliente sem nome'}
                                    </span>
                                    <Badge variant="outline" className="text-[10px] bg-background/50 backdrop-blur-sm">
                                        {order.status}
                                    </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground truncate">
                                    {order.items?.join(', ') || 'Ver detalhes do pedido'}
                                </p>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
