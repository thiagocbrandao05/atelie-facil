import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatCurrency } from '@/lib/formatters'

type Props = {
  params: Promise<{
    workspaceSlug: string
    publicId: string
  }>
}

type PublicOrderItem = {
  productName: string
  quantity: number
}

type PublicOrderData = {
  id: string
  tenantSlug: string
  tenantName: string
  customerName: string
  status: string
  createdAt: string
  totalValue: number
  items: PublicOrderItem[]
}

export default async function PublicBudgetPage({ params }: Props) {
  const { workspaceSlug, publicId } = await params
  const supabase = await createClient()

  // Call the RPC to get public order details
  // @ts-expect-error legacy schema not fully represented in generated DB types
  const { data: order, error } = await supabase.rpc('get_public_order', {
    p_public_id: publicId,
  })

  const orderRows = (order as unknown as PublicOrderData[] | null) ?? []

  // Validate if order exists and belongs to the correct workspace
  // The RPC already joins Tenant, so we just check the slug
  if (error || orderRows.length === 0 || orderRows[0].tenantSlug !== workspaceSlug) {
    notFound()
  }

  const data = orderRows[0]
  const isBudget = data.status === 'DRAFT' || data.status === 'PENDING' // Assuming these are budget/quote statuses

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="border-t-primary w-full max-w-3xl border-t-4 shadow-lg">
        <CardHeader className="pb-2 text-center">
          <div className="text-muted-foreground mb-1 text-sm tracking-wider uppercase">
            {data.tenantName}
          </div>
          <CardTitle className="text-primary text-3xl font-bold">
            {isBudget ? 'Orçamento' : 'Pedido Confirmado'}
          </CardTitle>
          <div className="text-muted-foreground mt-2 text-sm">
            #{data.id.slice(0, 8)} • {new Date(data.createdAt).toLocaleDateString()}
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="bg-secondary/20 flex items-center justify-between rounded-lg p-4">
            <div>
              <p className="text-muted-foreground text-xs font-semibold uppercase">Cliente</p>
              <p className="text-lg font-medium">{data.customerName}</p>
            </div>
            <div className="text-right">
              <p className="text-muted-foreground text-xs font-semibold uppercase">Status</p>
              <Badge variant={isBudget ? 'secondary' : 'default'}>{data.status}</Badge>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-lg font-semibold">Itens</h3>
            <div className="overflow-hidden rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Produto</th>
                    <th className="px-4 py-2 text-right font-medium">Qtd</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(data.items || []).map((item, idx: number) => (
                    <tr key={idx} className="bg-card">
                      <td className="px-4 py-3">{item.productName}</td>
                      <td className="px-4 py-3 text-right">{item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Separator />

          <div className="flex flex-col items-end gap-1">
            <div className="text-muted-foreground text-sm">Valor Total</div>
            <div className="text-primary text-4xl font-bold">
              {formatCurrency(data.totalValue || 0)}
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/50 flex flex-col gap-4 p-6 text-center">
          <p className="text-muted-foreground text-sm">
            Este documento é válido por 15 dias. Entre em contato para confirmar o pedido.
          </p>
          {/* CTA Button could go here, e.g., "Approve on WhatsApp" */}
        </CardFooter>
      </Card>
    </div>
  )
}
