'use client'

import React, { useState } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { updateOrderStatus } from '@/features/orders/actions'
import { toast } from 'sonner'
import { Order } from '@/lib/types'
import { Package as PackageIcon } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type KanbanBoardProps = {
  initialOrders: any[]
}

const STATUS_CONFIG = {
  QUOTATION: { label: 'Orçamentos', color: 'border-orange-200 bg-orange-50/50 text-orange-700' },
  PENDING: { label: 'Aguardando', color: 'border-blue-200 bg-blue-50/50 text-blue-700' },
  PRODUCING: { label: 'Na Bancada', color: 'border-primary/30 bg-primary/5 text-primary' },
  READY: {
    label: 'Pronto para Entrega',
    color: 'border-emerald-200 bg-emerald-50/50 text-emerald-700',
  },
  DELIVERED: { label: 'Finalizados', color: 'border-slate-200 bg-slate-50/50 text-slate-500' },
}

export function KanbanBoard({ initialOrders }: KanbanBoardProps) {
  const [orders, setOrders] = React.useState(initialOrders)

  // Synchronize state when props change (from List view updates)
  React.useEffect(() => {
    setOrders(initialOrders)
  }, [initialOrders])

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

  const getOrdersByStatus = (status: string) => orders.filter(order => order.status === status)

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="scrollbar-hide flex h-full min-h-[700px] items-start gap-8 overflow-x-auto pt-4 pb-12">
        {Object.entries(STATUS_CONFIG).map(([statusKey, config]) => (
          <div key={statusKey} className="flex w-full min-w-[320px] flex-col gap-6">
            <div
              className={`flex items-center justify-between rounded-[2rem] border-b-2 bg-white/40 p-5 shadow-sm backdrop-blur-md ${config.color.split(' ')[0]}`}
            >
              <div className="flex flex-col gap-1">
                <h3 className="text-[10px] font-black tracking-[0.2em] uppercase opacity-40">
                  {statusKey}
                </h3>
                <p className="text-sm font-black">{config.label}</p>
              </div>
              <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-full text-xs font-black shadow-inner">
                {getOrdersByStatus(statusKey).length}
              </div>
            </div>

            <Droppable droppableId={statusKey}>
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={`flex flex-1 flex-col gap-4 rounded-[2.5rem] border border-dashed p-3 transition-all duration-300 ${snapshot.isDraggingOver ? 'bg-primary/5 border-primary/30' : 'bg-muted/5 border-border/40'}`}
                >
                  {getOrdersByStatus(statusKey).map((order, index) => (
                    <Draggable key={order.id} draggableId={order.id} index={index}>
                      {(providedSnapshot, snapshot) => (
                        <div
                          ref={providedSnapshot.innerRef}
                          {...providedSnapshot.draggableProps}
                          {...providedSnapshot.dragHandleProps}
                          className={`group hover:shadow-primary/5 relative overflow-hidden rounded-[2rem] border border-white/40 bg-white/80 p-6 shadow-sm backdrop-blur-md transition-all hover:bg-white hover:shadow-xl ${snapshot.isDragging ? 'ring-primary/40 scale-105 rotate-2 shadow-2xl ring-4' : ''}`}
                        >
                          <div className="absolute top-[-10px] right-[-10px] opacity-0 transition-opacity group-hover:opacity-5">
                            <PackageIcon size={64} className="text-primary" />
                          </div>

                          <div className="relative z-10 space-y-4">
                            <div className="flex items-start justify-between">
                              <span className="text-muted-foreground font-mono text-[9px] font-bold tracking-widest uppercase opacity-40">
                                #{order.id.slice(-4)}
                              </span>
                              <div className="bg-primary/5 text-primary rounded-full px-3 py-1 text-[9px] font-black tracking-tight uppercase">
                                {order.dueDate
                                  ? format(new Date(order.dueDate), 'dd MMM', { locale: ptBR })
                                  : 'Pendente'}
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="text-foreground group-hover:text-primary text-base leading-tight font-black transition-colors">
                                {order.customer?.name || 'Cliente'}
                              </div>
                              <div className="text-muted-foreground line-clamp-1 text-[11px] font-medium italic">
                                {order.items
                                  ?.map((i: any) => `${i.quantity} ${i.product?.name}`)
                                  .join(', ') || 'Sem itens cadastrados'}
                              </div>
                            </div>

                            <div className="border-primary/5 flex items-center justify-between border-t pt-3">
                              <div className="text-primary text-sm font-black tracking-tight">
                                {new Intl.NumberFormat('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL',
                                }).format(Number(order.totalValue))}
                              </div>
                              <div className="bg-success shadow-glow h-1.5 w-1.5 rounded-full" />
                            </div>
                          </div>
                        </div>
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
