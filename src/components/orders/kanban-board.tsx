'use client'

import React, { useMemo, useState } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { updateOrderStatus } from '@/features/orders/actions'
import { toast } from 'sonner'
import { getStatusBadgeClasses, getStatusLabel } from '@/lib/order-status'

type KanbanBoardProps = {
    initialOrders: any[]
}

const STATUS_KEYS = ["QUOTATION", "PENDING", "PRODUCING", "READY", "DELIVERED"] as const

export function KanbanBoard({ initialOrders }: KanbanBoardProps) {
    const [orders, setOrders] = useState(initialOrders)

    const onDragEnd = async (result: DropResult) => {
        if (!result.destination) return

        const { source, destination, draggableId } = result
        const newStatus = destination.droppableId as any

        if (source.droppableId === destination.droppableId) return

        // Optimistic UI Update
        const updatedOrders = orders.map(order =>
            order.id === draggableId ? { ...order, status: newStatus } : order
        )
        setOrders(updatedOrders)

        // Server Action
        const response = await updateOrderStatus(draggableId, newStatus)
        if (!response.success) {
            toast.error(response.message)
            // Revert on failure
            setOrders(initialOrders)
        } else {
            toast.success('Status atualizado!')
        }
    }

    const ordersByStatus = useMemo(() => {
        return orders.reduce<Record<string, typeof orders>>((acc, order) => {
            const key = order.status
            if (!acc[key]) acc[key] = []
            acc[key].push(order)
            return acc
        }, {})
    }, [orders])

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-6 overflow-x-auto pb-6 min-h-[calc(100vh-300px)]">
                {STATUS_KEYS.map((statusKey) => (
                        <div key={statusKey} className="flex flex-col gap-4 min-w-[280px] w-full max-w-[320px]">
                            <div className={`p-3 rounded-xl border-l-4 shadow-sm flex items-center justify-between bg-card ${getStatusBadgeClasses(statusKey)}`}>
                            <h3 className="font-semibold text-sm tracking-wide uppercase">{getStatusLabel(statusKey)}</h3>
                            <Badge variant="outline" className="bg-white/50 border-none font-bold">
                                {(ordersByStatus[statusKey] ?? []).length}
                            </Badge>
                        </div>
                        <Droppable droppableId={statusKey}>
                            {(provided, snapshot) => (
                                <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className={`p-2 rounded-2xl flex-1 flex flex-col gap-3 transition-colors ${snapshot.isDraggingOver ? 'bg-secondary/40' : 'bg-muted/10'}`}
                                >
                                    {(ordersByStatus[statusKey] ?? []).map((order, index) => (
                                        <Draggable key={order.id} draggableId={order.id} index={index}>
                                            {(providedSnapshot, snapshot) => (
                                                <Card
                                                    ref={providedSnapshot.innerRef}
                                                    {...providedSnapshot.draggableProps}
                                                    {...providedSnapshot.dragHandleProps}
                                                    className={`group cursor-move transition-all border-none shadow-sm hover:shadow-md ${snapshot.isDragging ? 'shadow-xl ring-2 ring-primary scale-105' : 'bg-white'}`}
                                                >
                                                    <CardContent className="p-4 space-y-3">
                                                        <div className="flex justify-between items-start">
                                                            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-tighter">
                                                                ID: {order.id.slice(-6)}
                                                            </span>
                                                            <div className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary/50">
                                                                {new Date(order.dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                                            </div>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <div className="text-sm font-bold text-foreground leading-tight group-hover:text-primary transition-colors">
                                                                {order.customer?.name || 'Cliente'}
                                                            </div>
                                                            <div className="text-[11px] text-muted-foreground line-clamp-1">
                                                                {order.items?.map((i: any) => `${i.quantity}x ${i.product?.name}`).join(', ') || 'Sem itens'}
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-between items-center pt-1">
                                                            <div className="text-xs font-bold text-primary">
                                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(order.totalValue))}
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </div>
                ))}
            </div>
        </DragDropContext>
    )
}
