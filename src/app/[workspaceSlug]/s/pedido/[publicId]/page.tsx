import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Circle, Clock, Package } from 'lucide-react'

type Props = {
  params: Promise<{
    workspaceSlug: string
    publicId: string
  }>
}

type PublicOrderRow = {
  id: string
  tenantSlug: string
  tenantName: string
  customerName: string
  orderNumber?: number | null
  status: string
  dueDate?: string | null
}

export default async function PublicTrackingPage({ params }: Props) {
  const { workspaceSlug, publicId } = await params
  const supabase = await createClient()

  // @ts-expect-error legacy rpc typing missing in generated Database type
  const { data: order, error } = await supabase.rpc('get_public_order', {
    p_public_id: publicId,
  })
  const orderRows = (order || []) as PublicOrderRow[]

  if (error || orderRows.length === 0 || orderRows[0].tenantSlug !== workspaceSlug) {
    notFound()
  }

  const data = orderRows[0]

  // Simplified Status Timeline Logic
  // In a real app, you'd fetch a status history table.
  // Here we strictly infer progress from current status order.
  const STATUS_FLOW = ['PENDING', 'PRODUCING', 'READY', 'DELIVERED']
  const currentStatusIndex = STATUS_FLOW.indexOf(data.status)

  // Fallback if status is unknown or canceled
  const isCanceled = data.status === 'CANCELED'

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="bg-primary text-primary-foreground rounded-t-xl py-8 text-center">
          <div className="bg-primary-foreground/20 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <Package className="text-primary-foreground h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold">Rastreio de Pedido</CardTitle>
          <p className="mt-1 opacity-90">{data.tenantName}</p>
        </CardHeader>
        <CardContent className="pt-8 pb-8">
          <div className="mb-8 text-center">
            <h3 className="text-lg font-semibold">Olá, {data.customerName}</h3>
            <p className="text-muted-foreground text-sm">
              Pedido #{data.orderNumber || data.id.slice(0, 8)}
            </p>
          </div>

          <div className="relative space-y-8 pl-4">
            {/* Vertical Line */}
            <div className="absolute top-2 bottom-4 left-[27px] z-0 w-0.5 bg-gray-200" />

            {STATUS_FLOW.map((step, index) => {
              const isCompleted = currentStatusIndex >= index
              const isCurrent = currentStatusIndex === index

              let label = step
              if (step === 'PENDING') label = 'Pedido Confirmado'
              if (step === 'PRODUCING') label = 'Em Produção'
              if (step === 'READY') label = 'Pronto para Retirada/Entrega'
              if (step === 'DELIVERED') label = 'Entregue'

              return (
                <div key={step} className="relative z-10 flex items-center gap-4">
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${isCompleted ? 'bg-primary border-primary text-primary-foreground' : 'border-gray-300 bg-white text-gray-300'} `}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Circle className="h-4 w-4" />
                    )}
                  </div>
                  <div
                    className={`flex-1 ${isCurrent ? 'text-primary font-bold' : isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}
                  >
                    {label}
                  </div>
                  {isCurrent && (
                    <Badge variant="outline" className="animate-pulse">
                      Atual
                    </Badge>
                  )}
                </div>
              )
            })}
          </div>

          {isCanceled && (
            <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-4 text-center text-red-800">
              Pedido Cancelado
            </div>
          )}

          {data.dueDate && !isCanceled && data.status !== 'DELIVERED' && (
            <div className="text-muted-foreground bg-secondary/30 mt-8 flex items-center justify-center gap-2 rounded-md p-3 text-sm">
              <Clock className="h-4 w-4" />
              Previsão: {new Date(data.dueDate).toLocaleDateString()}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
