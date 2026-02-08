'use client'

import React, { useState } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { updateOrderStatus } from '@/features/orders/actions'
import { toast } from 'sonner'
import { Order } from '@/lib/types'

type KanbanBoardProps = {
    initialOrders: any[]
}

const STATUS_CONFIG = {
    QUOTATION: { label: 'Orçamento', color: 'bg-warning/10 text-warning border-warning/30' },
    PENDING: { label: 'Aguardando', color: 'bg-info/10 text-info border-info/30' },
    PRODUCING: { label: 'Em Produção', color: 'bg-primary/10 text-primary border-primary/30' },
    READY: { label: 'Pronto', color: 'bg-success/10 text-success border-success/30' },
    DELIVERED: { label: 'Entregue', color: 'bg-muted/40 text-muted-foreground border-border/60' }
}

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

    const getOrdersByStatus = (status: string) =>
        orders.filter(order => order.status === status)

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-6 overflow-x-auto pb-6 min-h-[calc(100vh-300px)]">
                {Object.entries(STATUS_CONFIG).map(([statusKey, config]) => (
                        <div key={statusKey} className="flex flex-col gap-4 min-w-[280px] w-full max-w-[320px]">
                            <div className={`p-3 rounded-xl border-l-4 shadow-sm flex items-center justify-between bg-card ${config.color}`}>
                            <h3 className="font-semibold text-sm tracking-wide uppercase">{config.label}</h3>
                            <Badge variant="outline" className="bg-white/50 border-none font-bold">
                                {getOrdersByStatus(statusKey).length}
                            </Badge>
                        </div>
                        <Droppable droppableId={statusKey}>
                            {(provided, snapshot) => (
                                <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className={`p-2 rounded-2xl flex-1 flex flex-col gap-3 transition-colors ${snapshot.isDraggingOver ? 'bg-secondary/40' : 'bg-muted/10'}`}
                                >
                                    {getOrdersByStatus(statusKey).map((order, index) => (
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

