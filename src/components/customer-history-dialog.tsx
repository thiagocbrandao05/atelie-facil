'use client'

import { useState, useEffect, useCallback } from 'react'
import { History, Package, Calendar, Tag, ChevronRight } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { getCustomerOrders } from '@/features/customers/actions'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Customer, OrderStatus } from '@/lib/types'

type CustomerOrderHistory = {
  id: string
  status: OrderStatus
  totalValue: number
  createdAt: string | Date
  items?: Array<{
    productId: string
    quantity: number
    product?: { name: string } | null
  }>
}

export function CustomerHistoryDialog({ customer }: { customer: Customer }) {
  const [open, setOpen] = useState(false)
  const [orders, setOrders] = useState<CustomerOrderHistory[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const loadOrders = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getCustomerOrders(customer.id)
      setOrders(data as CustomerOrderHistory[])
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }, [customer.id])

  useEffect(() => {
    if (open) {
      loadOrders()
    }
  }, [open, loadOrders])

  const getStatusLabel = (status: string) => {
    const statuses: Record<string, { label: string; color: string }> = {
      PENDING: { label: 'Pendente', color: 'bg-warning/10 text-warning border-warning/20' },
      PRODUCING: { label: 'Em Produção', color: 'bg-info/10 text-info border-info/20' },
      COMPLETED: { label: 'Concluído', color: 'bg-success/10 text-success border-success/20' },
      DELIVERED: { label: 'Entregue', color: 'bg-primary/10 text-primary border-primary/20' },
      CANCELLED: { label: 'Cancelado', color: 'bg-danger/10 text-danger border-danger/20' },
      QUOTATION: {
        label: 'Orçamento',
        color: 'bg-muted/40 text-muted-foreground border-border/40',
      },
    }
    return (
      statuses[status] || {
        label: status,
        color: 'bg-muted/40 text-muted-foreground border-border/40',
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-primary/10 hover:text-primary h-8 w-8 transition-all"
        >
          <History className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden rounded-2xl border-none bg-transparent p-0 shadow-2xl sm:max-w-2xl">
        <div className="bg-background flex h-full flex-col">
          <DialogHeader className="bg-muted/5 border-b p-6 pb-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-full">
                <History className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="font-serif text-xl italic">
                  Histórico de Pedidos
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {customer.name} • {orders.length} pedido(s) encontrado(s)
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="custom-scrollbar flex-1 overflow-y-auto p-4 md:p-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center space-y-4 py-12">
                <div className="border-primary/30 border-t-primary h-8 w-8 animate-spin rounded-full border-4" />
                <p className="text-muted-foreground animate-pulse text-xs font-bold tracking-widest uppercase">
                  Carregando histórico...
                </p>
              </div>
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center space-y-3 py-12 text-center opacity-60">
                <Package className="text-muted-foreground/30 h-12 w-12" />
                <div className="space-y-1">
                  <p className="text-sm font-bold">Nenhum pedido encontrado</p>
                  <p className="text-xs">Este cliente ainda não realizou pedidos no sistema.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map(order => (
                  <div
                    key={order.id}
                    className="group bg-muted/20 hover:bg-muted/30 hover:border-primary/20 relative rounded-2xl border p-4 transition-all"
                  >
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`rounded-full px-2 py-0.5 text-[10px] font-black tracking-widest uppercase ${getStatusLabel(order.status).color}`}
                          >
                            {getStatusLabel(order.status).label}
                          </Badge>
                          <span className="text-muted-foreground flex items-center gap-1 text-[10px] font-bold uppercase">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(order.createdAt), "dd 'de' MMMM, yyyy", {
                              locale: ptBR,
                            })}
                          </span>
                        </div>

                        <div className="space-y-1">
                          {order.items?.map((item, idx: number) => (
                            <div key={idx} className="flex items-center gap-2 text-sm font-medium">
                              <Package className="text-primary/60 h-3.5 w-3.5" />
                              <span>{item.product?.name}</span>
                              <span className="text-muted-foreground text-xs font-normal">
                                x{item.quantity}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-1 border-t pt-3 md:flex-col md:items-end md:border-t-0 md:pt-0">
                        <span className="text-muted-foreground text-[10px] font-black tracking-widest uppercase md:hidden">
                          Valor Total
                        </span>
                        <div className="flex flex-col items-end">
                          <span className="text-muted-foreground mb-1 hidden text-xs leading-none font-bold tracking-tighter uppercase md:block">
                            Total
                          </span>
                          <span className="text-primary text-lg font-black tabular-nums">
                            R$ {Number(order.totalValue).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-muted/5 flex justify-end border-t p-4">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="h-10 rounded-xl px-6 text-[10px] font-bold tracking-widest uppercase"
            >
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
