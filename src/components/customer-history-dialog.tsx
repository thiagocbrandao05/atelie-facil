'use client'

import { useState, useEffect, useCallback } from 'react'
import { History, Package, Calendar } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { getCustomerOrders } from '@/features/customers/actions'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { getStatusBadgeClasses, getStatusLabel } from '@/lib/order-status'

export function CustomerHistoryDialog({ customer }: { customer: any }) {
    const [open, setOpen] = useState(false)
    const [orders, setOrders] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)

    const loadOrders = useCallback(async () => {
        setIsLoading(true)
        try {
            const data = await getCustomerOrders(customer.id)
            setOrders(data)
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

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-all">
                    <History className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0 border-none shadow-2xl rounded-2xl overflow-hidden bg-transparent">
                <div className="bg-background h-full flex flex-col">
                    <DialogHeader className="p-6 pb-4 border-b bg-muted/5">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <History className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-serif italic">Histórico de Pedidos</DialogTitle>
                                <DialogDescription className="text-xs">
                                    {customer.name} • {orders.length} pedido(s) encontrado(s)
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Carregando histórico...</p>
                            </div>
                        ) : orders.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center space-y-3 opacity-60">
                                <Package className="h-12 w-12 text-muted-foreground/30" />
                                <div className="space-y-1">
                                    <p className="font-bold text-sm">Nenhum pedido encontrado</p>
                                    <p className="text-xs">Este cliente ainda não realizou pedidos no sistema.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {orders.map((order) => (
                                    <div key={order.id} className="group relative bg-muted/20 border rounded-2xl p-4 transition-all hover:bg-muted/30 hover:border-primary/20">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${getStatusBadgeClasses(order.status)}`}>
                                                        {getStatusLabel(order.status)}
                                                    </Badge>
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {format(new Date(order.createdAt), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                                                    </span>
                                                </div>

                                                <div className="space-y-1">
                                                    {order.items?.map((item: any, idx: number) => (
                                                        <div key={idx} className="flex items-center gap-2 text-sm font-medium">
                                                            <Package className="h-3.5 w-3.5 text-primary/60" />
                                                            <span>{item.product?.name}</span>
                                                            <span className="text-xs text-muted-foreground font-normal">x{item.quantity}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between md:flex-col md:items-end gap-1 border-t md:border-t-0 pt-3 md:pt-0">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground md:hidden">Valor Total</span>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-xs text-muted-foreground font-bold leading-none mb-1 hidden md:block uppercase tracking-tighter">Total</span>
                                                    <span className="text-lg font-black text-primary tabular-nums">
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

                    <div className="p-4 border-t bg-muted/5 flex justify-end">
                        <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl font-bold uppercase text-[10px] tracking-widest h-10 px-6">
                            Fechar
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
