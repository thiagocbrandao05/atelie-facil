'use client'

import React from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { updateOrderStatus } from '@/features/orders/actions'
import { toast } from 'sonner'
import type { OrderStatus } from '@/lib/types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type KanbanOrder = {
  id: string
  status: OrderStatus
  dueDate: string | Date | null
  totalValue: number
  customer?: { name: string | null } | null
  items?: Array<{ quantity: number; product?: { name: string } | null }>
}

type KanbanBoardProps = {
  initialOrders: KanbanOrder[]
}

const STATUS_CONFIG = {
  QUOTATION: { label: 'Orçamentos', color: 'border-accent/40' },
  PENDING: { label: 'Aguardando', color: 'border-info/35' },
  PRODUCING: { label: 'Em produção', color: 'border-primary/30' },
  READY: {
    label: 'Pronto para entrega',
    color: 'border-success/40',
  },
  DELIVERED: { label: 'Finalizado', color: 'border-border' },
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
    const newStatus = destination.droppableId as OrderStatus

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
      <div className="grid h-full min-h-[700px] grid-cols-1 gap-4 pt-4 pb-12 md:grid-cols-2 xl:grid-cols-5">
        {Object.entries(STATUS_CONFIG).map(([statusKey, config]) => (
          <div key={statusKey} className="flex w-full min-w-0 flex-col gap-4">
            <div
              className={`flex items-center justify-between rounded-[2rem] border-b-2 bg-white/40 p-5 shadow-sm backdrop-blur-md ${config.color}`}
            >
              <p className="text-sm font-black">{config.label}</p>
              <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-full text-xs font-black shadow-inner">
                {getOrdersByStatus(statusKey).length}
              </div>
            </div>

            <Droppable droppableId={statusKey}>
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={`flex min-h-[280px] flex-1 flex-col gap-4 rounded-[2.5rem] border border-dashed p-3 transition-all duration-300 md:min-h-[420px] ${snapshot.isDraggingOver ? 'bg-primary/5 border-primary/30' : 'bg-muted/5 border-border/40'}`}
                >
                  {getOrdersByStatus(statusKey).map((order, index) => (
                    <Draggable key={order.id} draggableId={order.id} index={index}>
                      {(providedSnapshot, snapshot) => (
                        <div
                          ref={providedSnapshot.innerRef}
                          {...providedSnapshot.draggableProps}
                          {...providedSnapshot.dragHandleProps}
                          className={`relative overflow-hidden rounded-[2rem] border border-white/40 bg-white/80 p-6 shadow-sm backdrop-blur-md transition-all ${snapshot.isDragging ? 'ring-primary/40 scale-105 rotate-2 shadow-2xl ring-4' : ''}`}
                        >
                          <div className="relative z-10 space-y-4">
                            <div className="flex items-start justify-between">
                              <span className="text-muted-foreground font-mono text-xs font-bold tracking-wide uppercase opacity-40">
                                #{order.id.slice(-4)}
                              </span>
                              <div className="bg-primary/5 text-primary rounded-full px-3 py-1 text-xs font-black tracking-tight uppercase">
                                {order.dueDate
                                  ? format(new Date(order.dueDate), 'dd MMM', { locale: ptBR })
                                  : 'Pendente'}
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="text-foreground text-base leading-tight font-black">
                                {order.customer?.name || 'Cliente'}
                              </div>
                              <div className="text-muted-foreground line-clamp-1 text-[11px] font-medium italic">
                                {order.items
                                  ?.map(i => `${i.quantity} ${i.product?.name}`)
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
