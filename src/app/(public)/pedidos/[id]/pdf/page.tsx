import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { PrintButton } from "@/components/print-button"

export default async function QuotationPage(props: { params: Promise<{ id: string }> }) {
    const { id } = await props.params
    const supabase = await createClient()

    const { data: order, error } = await supabase
        .from('Order')
        .select(`
            *,
            customer:Customer(*),
            items:OrderItem(
                *,
                product:Product(*)
            )
        `)
        .eq('id', id)
        .single<any>()

    if (error || !order) notFound()

    if (!order) notFound()

    return (
        <div className="max-w-3xl mx-auto p-8 bg-white shadow-sm border rounded-lg my-8 print:shadow-none print:border-none print:my-0 w-full">
            <div className="flex justify-between items-start border-b pb-6 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-primary">AteliêFácil - Orçamento</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Pedido #{order.id.slice(0, 8)}</p>
                </div>
                <Badge variant="outline" className="uppercase">{order.status === 'QUOTATION' ? 'Orçamento' : 'Pedido de Venda'}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase mb-2">Cliente</h3>
                    <p className="font-medium">{order.customer?.name || 'Cliente'}</p>
                    <p className="text-sm text-muted-foreground">{order.customer?.phone || 'S/ Telefone'}</p>
                    <p className="text-sm text-muted-foreground">{order.customer?.address || ''}</p>
                </div>
                <div className="text-right">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase mb-2">Datas</h3>
                    <p className="text-sm"><span className="text-muted-foreground">Emissão:</span> {new Intl.DateTimeFormat('pt-BR').format(new Date(order.createdAt))}</p>
                    <p className="text-sm font-bold"><span className="text-muted-foreground font-normal">Validade:</span> {new Intl.DateTimeFormat('pt-BR').format(new Date(order.dueDate))}</p>
                </div>
            </div>

            <table className="w-full mb-8">
                <thead>
                    <tr className="border-b text-left text-sm text-muted-foreground">
                        <th className="py-2">Produto</th>
                        <th className="py-2 text-center">Qtd</th>
                        <th className="py-2 text-right">Preço Un.</th>
                        <th className="py-2 text-right">Subtotal</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {order.items.map((item: any, idx: number) => {
                        const unitPrice = item.price - (item.discount || 0);
                        const subtotal = unitPrice * item.quantity;
                        return (
                            <tr key={idx} className="text-sm">
                                <td className="py-4">
                                    <div className="font-medium">{item.product.name}</div>
                                    {item.discount > 0 && (
                                        <div className="text-[10px] text-red-500">
                                            Desconto: {item.discount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} por unid.
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
                        );
                    })}
                </tbody>
                <tfoot>
                    {order.discount > 0 && (
                        <tr className="border-t">
                            <td colSpan={3} className="pt-4 pb-1 text-right text-xs text-muted-foreground uppercase font-semibold">Desconto Adicional</td>
                            <td className="pt-4 pb-1 text-right text-sm text-red-500 font-medium">
                                - {order.discount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </td>
                        </tr>
                    )}
                    <tr className={order.discount > 0 ? '' : 'border-t'}>
                        <td colSpan={3} className="pt-2 pb-2 text-right font-semibold">Valor Total</td>
                        <td className="pt-2 pb-2 text-right font-bold text-lg text-primary">
                            {order.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                    </tr>
                </tfoot>
            </table>

            <div className="mt-12 pt-6 border-t text-center text-xs text-muted-foreground">
                <p>Este documento é um orçamento válido até {new Intl.DateTimeFormat('pt-BR').format(new Date(order.dueDate))}.</p>
                <p className="mt-1">AteliêFácil - Gestão para Artesãos</p>
            </div>

            <div className="mt-8 flex justify-center print:hidden">
                <PrintButton />
            </div>
        </div>
    )
}

