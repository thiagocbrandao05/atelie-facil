import { getOrdersPaginated, getOrders, updateOrderStatus, deleteOrder } from '@/features/orders/actions'
import { getProducts } from '@/features/products/actions'
import { OrderDialog } from '@/components/order-dialog'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getCustomers } from '@/features/customers/actions'
import { getSettings } from '@/features/settings/actions'
import { StatusUpdateButton } from '@/components/status-update-button'
import { WhatsAppButton } from '@/components/whatsapp-button'
import { DeleteButton } from '@/components/delete-button'
import { Pagination } from '@/components/pagination'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { KanbanBoard } from '@/components/orders/kanban-board'
import { LayoutGrid, List } from 'lucide-react'

export default async function PedidosPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const searchParams = await props.searchParams
    const page = Number(searchParams.page) || 1
    const [
        { data: orders, totalPages, page: currentPage },
        allOrders,
        products,
        customers,
        settings
    ] = await Promise.all([
        getOrdersPaginated(page),
        getOrders(),
        getProducts(),
        getCustomers(),
        getSettings()
    ])

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary">Gestão de Pedidos</h1>
                    <p className="text-muted-foreground mt-1">Acompanhe prazos e status de produção.</p>
                </div>
                <OrderDialog products={products} customers={customers} />
            </div>

            <Tabs defaultValue="list" className="w-full">
                <div className="flex justify-end mb-4">
                    <TabsList>
                        <TabsTrigger value="list" className="flex items-center gap-2">
                            <List size={16} /> Lista
                        </TabsTrigger>
                        <TabsTrigger value="kanban" className="flex items-center gap-2">
                            <LayoutGrid size={16} /> Quadro
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="list" className="space-y-4">
                    {orders.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-lg">
                            Nenhum pedido encontrado. Crie o primeiro!
                        </div>
                    ) : (
                        <>
                            {orders.map((order) => (
                                <Card key={order.id}>
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <CardTitle className="text-lg">{order.customer?.name || 'Cliente Desconhecido'}</CardTitle>
                                                <CardDescription>
                                                    Entrega: {new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long' }).format(new Date(order.dueDate))}
                                                </CardDescription>
                                            </div>
                                            <div className="text-right space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant={
                                                        order.status === 'QUOTATION' ? 'secondary' :
                                                            order.status === 'PENDING' ? 'outline' :
                                                                order.status === 'PRODUCING' ? 'default' :
                                                                    order.status === 'READY' ? 'secondary' :
                                                                        'outline'
                                                    }>
                                                        {order.status === 'QUOTATION' ? 'Orçamento' :
                                                            order.status === 'PENDING' ? 'Aguardando Início' :
                                                                order.status === 'PRODUCING' ? 'Em Produção' :
                                                                    order.status === 'READY' ? 'Pronto p/ Entrega' :
                                                                        order.status === 'DELIVERED' ? 'Entregue' :
                                                                            order.status}
                                                    </Badge>

                                                    {order.status === 'QUOTATION' && (
                                                        <StatusUpdateButton id={order.id} status="PENDING" label="Aprovar Orçamento" />
                                                    )}
                                                    {order.status === 'PENDING' && (
                                                        <StatusUpdateButton id={order.id} status="PRODUCING" label="Iniciar Produção" />
                                                    )}
                                                    {order.status === 'PRODUCING' && (
                                                        <StatusUpdateButton id={order.id} status="READY" label="Finalizar" />
                                                    )}
                                                    {order.status === 'READY' && (
                                                        <StatusUpdateButton id={order.id} status="DELIVERED" label="Entregar" />
                                                    )}

                                                    <WhatsAppButton
                                                        phone={order.customer?.phone}
                                                        customerName={order.customer?.name}
                                                        orderStatus={order.status}
                                                        orderId={order.id}
                                                        templates={{
                                                            msgQuotation: settings.msgQuotation,
                                                            msgReady: settings.msgReady
                                                        }}
                                                    />

                                                    <DeleteButton id={order.id} onDelete={deleteOrder} className="h-8 w-8" />
                                                </div>
                                                <div className="font-bold">
                                                    {order.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </div>
                                                {(order.discount ?? 0) > 0 && (
                                                    <div className="text-[10px] text-red-500 font-medium">
                                                        Desc. Total: {order.discount?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-sm text-muted-foreground mt-2">
                                            <p className="font-medium mb-1 text-foreground/80">Itens:</p>
                                            <ul className="list-disc list-inside">
                                                {order.items.map((item: any, idx) => (
                                                    <li key={idx}>
                                                        {item.quantity}x {item.product.name}
                                                        {(item.discount ?? 0) > 0 && (
                                                            <span className="text-[10px] text-red-500 font-medium ml-2">
                                                                (-{item.discount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/un)
                                                            </span>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                            <Pagination currentPage={currentPage} totalPages={totalPages} />
                        </>
                    )}
                </TabsContent>

                <TabsContent value="kanban">
                    <KanbanBoard initialOrders={allOrders} />
                </TabsContent>
            </Tabs>
        </div>
    )
}


