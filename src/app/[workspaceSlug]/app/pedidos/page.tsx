import { getOrdersPaginated, getOrdersForKanban, deleteOrder } from '@/features/orders/actions'
import { getProducts } from '@/features/products/actions'
import { OrderDialog } from '@/components/order-dialog'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getCustomers } from '@/features/customers/actions'
import { StatusUpdateButton } from '@/components/status-update-button'
import { DeleteButton } from '@/components/delete-button'
import { Pagination } from '@/components/pagination'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { KanbanBoard } from '@/components/orders/kanban-board'
import { LayoutGrid, List } from 'lucide-react'
import { WhatsAppNotifyWrapper } from '@/features/whatsapp/components/WhatsAppNotifyWrapper'
import { getCurrentTenantPlan } from '@/features/subscription/actions'

const STATUS_LABELS: Record<string, string> = {
  QUOTATION: 'Orçamento',
  PENDING: 'Aguardando início',
  PRODUCING: 'Em produção',
  READY: 'Pronto para entrega',
  DELIVERED: 'Entregue',
}

function getSafePage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value
  const parsed = Number(raw)
  if (!Number.isFinite(parsed) || parsed < 1) return 1
  return Math.floor(parsed)
}

export default async function PedidosPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams
  const page = getSafePage(searchParams.page)

  const [
    { data: orders, totalPages, page: currentPage },
    kanbanOrders,
    products,
    customers,
    tenantPlan,
  ] = await Promise.all([
    getOrdersPaginated(page),
    getOrdersForKanban(),
    getProducts(),
    getCustomers(),
    getCurrentTenantPlan(),
  ])

  return (
    <div className="space-y-5 md:space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-primary text-2xl font-bold tracking-tight sm:text-3xl">
            Gestão de pedidos
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Acompanhe prazos e status de produção.
          </p>
        </div>
        <OrderDialog products={products} customers={customers} />
      </div>

      <Tabs defaultValue="list" className="w-full">
        <div className="mb-3 flex justify-end sm:mb-4">
          <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto p-1 md:w-auto">
            <TabsTrigger value="list" className="flex min-h-10 items-center gap-2 px-3 text-sm">
              <List size={16} /> Lista
            </TabsTrigger>
            <TabsTrigger value="kanban" className="flex min-h-10 items-center gap-2 px-3 text-sm">
              <LayoutGrid size={16} /> Quadro
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="list" className="space-y-4">
          {orders.length === 0 ? (
            <div
              className="text-muted-foreground bg-muted/30 rounded-lg px-4 py-12 text-center"
              role="status"
              aria-live="polite"
            >
              Nenhum pedido encontrado. Toque em &quot;Novo pedido&quot; para começar.
            </div>
          ) : (
            <>
              {orders.map(order => (
                <Card key={order.id} className="border-border/60 shadow-sm">
                  <CardHeader className="px-4 pb-3 sm:px-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center justify-between text-base sm:text-lg">
                          <span>{order.customer?.name || 'Cliente desconhecido'}</span>
                          <span className="text-primary/60 font-mono text-xs sm:text-sm">
                            #{order.orderNumber}
                          </span>
                        </CardTitle>
                        <CardDescription>
                          {order.dueDate
                            ? new Intl.DateTimeFormat('pt-BR', {
                                day: '2-digit',
                                month: 'long',
                              }).format(new Date(order.dueDate))
                            : 'Sem data'}
                        </CardDescription>
                      </div>
                      <div className="space-y-2 text-left sm:text-right">
                        <div className="flex flex-wrap items-center justify-start gap-2 sm:justify-end">
                          <Badge
                            variant={
                              order.status === 'QUOTATION'
                                ? 'secondary'
                                : order.status === 'PENDING'
                                  ? 'outline'
                                  : order.status === 'PRODUCING'
                                    ? 'default'
                                    : order.status === 'READY'
                                      ? 'secondary'
                                      : 'outline'
                            }
                          >
                            {STATUS_LABELS[order.status] || order.status}
                          </Badge>

                          {order.status === 'QUOTATION' && (
                            <StatusUpdateButton
                              id={order.id}
                              status="PENDING"
                              label="Aprovar orçamento"
                            />
                          )}
                          {order.status === 'PENDING' && (
                            <StatusUpdateButton
                              id={order.id}
                              status="PRODUCING"
                              label="Iniciar produção"
                            />
                          )}
                          {order.status === 'PRODUCING' && (
                            <StatusUpdateButton id={order.id} status="READY" label="Finalizar" />
                          )}
                          {order.status === 'READY' && (
                            <StatusUpdateButton id={order.id} status="DELIVERED" label="Entregar" />
                          )}

                          <DeleteButton
                            id={order.id}
                            onDelete={deleteOrder}
                            className="h-10 w-10 md:h-8 md:w-8"
                          />
                        </div>
                        <div className="font-bold">
                          {order.totalValue.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </div>
                        {(order.discount ?? 0) > 0 && (
                          <div className="text-[10px] font-medium text-red-500">
                            Desc. total:{' '}
                            {order.discount?.toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 sm:px-6">
                    <div className="text-muted-foreground mt-1 text-sm leading-relaxed">
                      <p className="text-foreground/80 mb-1 font-medium">Itens:</p>
                      <ul className="list-inside list-disc space-y-1">
                        {order.items.map((item: any, idx) => (
                          <li key={idx}>
                            {item.quantity}x {item.product.name}
                            {(item.discount ?? 0) > 0 && (
                              <span className="ml-2 text-[10px] font-medium text-red-500">
                                (-
                                {item.discount.toLocaleString('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL',
                                })}
                                /un)
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-4 border-t pt-4">
                      <WhatsAppNotifyWrapper
                        orderId={order.id}
                        customerPhone={order.customer?.phone}
                        customerName={order.customer?.name || 'Cliente'}
                        tenantPlan={tenantPlan.plan}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Pagination currentPage={currentPage} totalPages={totalPages} />
            </>
          )}
        </TabsContent>

        <TabsContent value="kanban">
          <KanbanBoard initialOrders={kanbanOrders} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
