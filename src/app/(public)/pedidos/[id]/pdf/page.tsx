import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { PrintButton } from '@/components/print-button'

export default async function QuotationPage(props: {
  params: Promise<{ id: string }>,
  searchParams: Promise<{ p?: string }>
}) {
  const { id } = await props.params
  const { p: publicId } = await props.searchParams
  const supabase = await createClient()

  // Se tivermos um publicId nos searchParams, usamos o RPC público
  // Caso contrário, tentamos buscar pelo ID (requer autenticação via RLS)
  let order: any = null
  let error: any = null

  if (publicId) {
    console.log('[QUOTATION_PAGE] Fetching by publicId:', publicId)
    const { data, error: rpcError } = await (supabase as any).rpc('get_public_order', {
      p_public_id: publicId,
    })

    if (rpcError) {
      console.error('[QUOTATION_PAGE] RPC Error:', rpcError)
    }

    order = data?.[0]
    console.log('[QUOTATION_PAGE] RPC Data:', order ? 'Found' : 'Not Found')
    error = rpcError

    // Mapear campos do RPC para o formato do template
    if (order) {
      order = {
        ...order,
        customer: {
          name: order.customerName,
          phone: order.customerPhone,
          address: order.customerAddress
        },
        items: (order.items || []).map((item: any) => ({
          quantity: item.quantity,
          product: { name: item.productName },
          price: item.price || 0,
          discount: item.discount || 0
        }))
      }
    }
  } else {
    const { data, error: fetchError } = await supabase
      .from('Order')
      .select(
        `
              *,
              customer:Customer(*),
              items:OrderItem(
                  *,
                  product:Product(*)
              )
          `
      )
      .eq('id', id)
      .single<any>()
    order = data
    error = fetchError
  }

  if (error || !order) notFound()

  return (
    <div className="mx-auto my-8 w-full max-w-3xl rounded-lg border bg-white p-8 shadow-sm print:my-0 print:border-none print:shadow-none">
      <div className="mb-6 flex items-start justify-between border-b pb-6">
        <div>
          <h1 className="text-primary text-2xl font-bold">Atelis - Orçamento</h1>
          <p className="text-muted-foreground mt-1 text-sm">Pedido #{order.orderNumber || order.id.slice(0, 8)}</p>
        </div>
        <Badge variant="outline" className="uppercase">
          {order.status === 'QUOTATION' ? 'Orçamento' : 'Pedido de Venda'}
        </Badge>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-8">
        <div>
          <h3 className="text-muted-foreground mb-2 text-sm font-semibold uppercase">Cliente</h3>
          <p className="font-medium">{order.customer?.name || 'Cliente'}</p>
          <p className="text-muted-foreground text-sm">{order.customer?.phone || 'S/ Telefone'}</p>
          <p className="text-muted-foreground text-sm">{order.customer?.address || ''}</p>
        </div>
        <div className="text-right">
          <h3 className="text-muted-foreground mb-2 text-sm font-semibold uppercase">Datas</h3>
          <p className="text-sm">
            <span className="text-muted-foreground">Emissão:</span>{' '}
            {new Intl.DateTimeFormat('pt-BR').format(new Date(order.createdAt))}
          </p>
          <p className="text-sm font-bold">
            <span className="text-muted-foreground font-normal">Validade:</span>{' '}
            {new Intl.DateTimeFormat('pt-BR').format(new Date(order.dueDate))}
          </p>
        </div>
      </div>

      <table className="mb-8 w-full">
        <thead>
          <tr className="text-muted-foreground border-b text-left text-sm">
            <th className="py-2">Produto</th>
            <th className="py-2 text-center">Qtd</th>
            <th className="py-2 text-right">Preço Un.</th>
            <th className="py-2 text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {(order.items || []).map((item: any, idx: number) => {
            const unitPrice = (item.price || 0) - (item.discount || 0)
            const subtotal = unitPrice * item.quantity
            return (
              <tr key={idx} className="text-sm">
                <td className="py-4">
                  <div className="font-medium">{item.product?.name || 'Produto'}</div>
                  {item.discount > 0 && (
                    <div className="text-[10px] text-red-500">
                      Desconto:{' '}
                      {item.discount.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}{' '}
                      por unid.
                    </div>
                  )}
                </td>
                <td className="py-4 text-center">{item.quantity}</td>
                <td className="py-4 text-right">
                  {unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </td>
                <td className="py-4 text-right font-medium">
                  {subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          {(order.discount || 0) > 0 && (
            <tr className="border-t">
              <td
                colSpan={3}
                className="text-muted-foreground pt-4 pb-1 text-right text-xs font-semibold uppercase"
              >
                Desconto Adicional
              </td>
              <td className="pt-4 pb-1 text-right text-sm font-medium text-red-500">
                - {order.discount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </td>
            </tr>
          )}
          <tr className={(order.discount || 0) > 0 ? '' : 'border-t'}>
            <td colSpan={3} className="pt-2 pb-2 text-right font-semibold">
              Valor Total
            </td>
            <td className="text-primary pt-2 pb-2 text-right text-lg font-bold">
              {(order.totalValue || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </td>
          </tr>
        </tfoot>
      </table>

      <div className="text-muted-foreground mt-12 border-t pt-6 text-center text-xs">
        <p>
          Este documento é um orçamento válido até{' '}
          {new Intl.DateTimeFormat('pt-BR').format(new Date(order.dueDate))}.
        </p>
        <p className="mt-1">Atelis - Gestão para Artesãos</p>
      </div>

      <div className="mt-8 flex justify-center print:hidden">
        <PrintButton />
      </div>
    </div>
  )
}
