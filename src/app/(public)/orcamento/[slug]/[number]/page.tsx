import { createClient } from '@/lib/supabase/server'
import { createClient as createSimpleClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { PrintButton } from '@/components/print-button'
import { Phone, Mail, MapPin, Globe } from 'lucide-react'
import Image from 'next/image'

export default async function FriendlyQuotationPage(props: {
    params: Promise<{ slug: string; number: string }>
    searchParams: Promise<{ p?: string }>
}) {
    const { slug, number } = await props.params
    const { p: publicId } = await props.searchParams

    // Create an admin client to fetch settings that are protected by RLS
    const supabaseAdmin = createSimpleClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )

    const supabase = await createClient()

    if (!publicId) {
        notFound()
    }

    // Fetch order data via existing RPC
    const { data, error: rpcError } = await (supabase as any).rpc('get_public_order', {
        p_public_id: publicId,
    })

    if (rpcError || !data?.[0]) {
        console.error('[FRIENDLY_QUOTATION] Error or Not Found:', rpcError)
        notFound()
    }

    const order = data[0]

    // IMPORTANT: Fetch Settings directly using the admin client to ensure we get "Mandacaru" 
    // and NOT the "Atelie de Teste" fallback from the Tenant table.
    const { data: settings } = await supabaseAdmin
        .from('Settings')
        .select('*')
        .eq('tenantId', order.id ? (await supabase.from('Order').select('tenantId').eq('publicId', publicId).single()).data?.tenantId : null)
        .single()

    // Fallback tenantId fetch if RPC one is ambiguous (RPC returns order.id as "id")
    // Actually, let's just use the order.id from the RPC which is o."id" (the order id). 
    // We need the tenantId. Let's fetch the order record one more time just for the tenantId to be safe.
    const { data: rawOrder } = await supabaseAdmin
        .from('Order')
        .select('tenantId')
        .eq('publicId', publicId)
        .single()

    const { data: realSettings } = await supabaseAdmin
        .from('Settings')
        .select('*')
        .eq('tenantId', rawOrder?.tenantId || '')
        .single()

    // Map all data to a clean object
    const store = {
        // Correctly prioritize Settings.storeName now that we have it
        name: realSettings?.storeName || order.tenantName || 'Ateliê',
        phone: realSettings?.phone || order.storePhone,
        email: realSettings?.email || order.storeEmail,
        instagram: realSettings?.instagram || order.instagram,
        facebook: realSettings?.facebook || order.facebook,
        logoUrl: realSettings?.logoUrl || order.logoUrl,
        primaryColor: realSettings?.primaryColor || '#7c3aed',
        addressLines: [
            realSettings?.addressStreet ? `${realSettings.addressStreet}, ${realSettings.addressNumber || 'S/N'}` : null,
            realSettings?.addressNeighborhood,
            realSettings?.addressCity ? `${realSettings.addressCity}${realSettings.addressState ? ` - ${realSettings.addressState}` : ''}` : null,
            realSettings?.addressZip ? `CEP: ${realSettings.addressZip}` : null
        ].filter(Boolean)
    }

    const customer = {
        name: order.customerName,
        phone: order.customerPhone,
        address: order.customerAddress
    }

    const validityDate = new Date(order.dueDate).toLocaleDateString('pt-BR')
    const emissionDate = new Date(order.createdAt).toLocaleDateString('pt-BR')

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 print:bg-white print:p-0">
            <div className="mx-auto w-full max-w-4xl border border-slate-200 bg-white shadow-xl rounded-xl overflow-hidden print:max-w-none print:shadow-none print:border-none print:rounded-none">

                {/* Simple Header */}
                <div className="p-8 md:p-12 border-b border-slate-100 italic">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                        <div className="flex items-center gap-6">
                            {store.logoUrl ? (
                                <div className="relative h-16 w-16 overflow-hidden rounded-lg">
                                    <Image
                                        src={store.logoUrl}
                                        alt={store.name}
                                        fill
                                        className="object-contain"
                                    />
                                </div>
                            ) : (
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-2xl font-bold text-slate-400">
                                    {store.name[0]}
                                </div>
                            )}
                            <div>
                                <h1 className="text-3xl font-black tracking-tight" style={{ color: store.primaryColor }}>
                                    {store.name} - Orçamento
                                </h1>
                                <p className="text-slate-500 font-bold mt-1">Pedido #{order.orderNumber}</p>
                            </div>
                        </div>

                        <Badge variant="outline" className="rounded-full px-4 py-1 font-bold text-xs uppercase bg-white border-slate-200 shadow-sm">
                            {order.status === 'QUOTATION' ? 'ORÇAMENTO' : 'PEDIDO'}
                        </Badge>
                    </div>
                </div>

                {/* Info Grid */}
                <div className="px-8 md:px-12 py-10 grid grid-cols-1 md:grid-cols-2 gap-12 border-b border-slate-50">

                    {/* Customer Info */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 pb-2 border-b border-slate-50">CLIENTE</h3>
                        <div className="space-y-1">
                            <p className="text-xl font-black text-slate-800 tracking-tight leading-none">{customer.name}</p>
                            {customer.phone && <p className="text-slate-500 font-bold">{customer.phone}</p>}
                            {customer.address && <p className="text-slate-400 text-sm font-medium leading-relaxed mt-2">{customer.address}</p>}
                        </div>
                    </div>

                    {/* Date Info */}
                    <div className="space-y-4 md:text-right">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 pb-2 border-b border-slate-50 md:border-none">DATAS</h3>
                        <div className="space-y-2">
                            <div className="flex flex-row md:justify-end gap-2 text-sm">
                                <span className="text-slate-400 font-bold">Emissão:</span>
                                <span className="text-slate-800 font-black">{emissionDate}</span>
                            </div>
                            <div className="flex flex-row md:justify-end gap-2 text-sm bg-slate-50 p-2 rounded-lg inline-block md:ml-auto">
                                <span className="text-slate-400 font-bold">Validade:</span>
                                <span className="text-slate-900 font-black">{validityDate}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="px-8 md:px-12 py-8">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-100 text-slate-400">
                                <th className="py-4 font-bold text-xs uppercase tracking-widest">Produto</th>
                                <th className="py-4 text-center font-bold text-xs uppercase tracking-widest">Qtd</th>
                                <th className="py-4 text-center font-bold text-xs uppercase tracking-widest">Preço Un.</th>
                                <th className="py-4 text-right font-bold text-xs uppercase tracking-widest">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {(order.items || []).map((item: any, idx: number) => {
                                const unitPrice = (item.price || 0) - (item.discount || 0)
                                const subtotal = unitPrice * item.quantity
                                return (
                                    <tr key={idx}>
                                        <td className="py-6">
                                            <p className="text-base font-black text-slate-800 leading-tight">{item.productName}</p>
                                            {item.discount > 0 && (
                                                <p className="text-[10px] font-bold text-rose-500 italic mt-1 uppercase tracking-tight">
                                                    Desconto: {item.discount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} por unid.
                                                </p>
                                            )}
                                        </td>
                                        <td className="py-6 text-center font-bold text-slate-600 tabular-nums">{item.quantity}</td>
                                        <td className="py-6 text-center text-slate-600 tabular-nums font-medium">
                                            {unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </td>
                                        <td className="py-6 text-right font-black text-slate-900 tabular-nums">
                                            {subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>

                    {/* Totals */}
                    <div className="mt-8 pt-8 border-t border-slate-100 flex justify-end">
                        <div className="flex items-center gap-12">
                            <span className="text-xl font-black text-slate-800 tracking-tight">Valor Total</span>
                            <span className="text-3xl font-black tabular-nums tracking-tighter" style={{ color: store.primaryColor }}>
                                {order.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Store Contacts & Observations (Footer Section) */}
                <div className="bg-slate-50/50 p-8 md:p-12 border-t border-slate-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">NOTAS DO ATELIÊ</h4>
                                <p className="text-slate-700 italic font-bold leading-relaxed">
                                    {order.defaultQuotationNotes ? `"${order.defaultQuotationNotes}"` : "Proposta sujeita a disponibilidade de agenda."}
                                </p>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-slate-100">
                                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                                    Este documento é um orçamento válido até {validityDate}.<br />
                                    <span className="font-bold text-slate-400">{store.name} - Gestão para Artesãos</span>
                                </p>
                            </div>
                        </div>

                        <div className="space-y-6 md:text-right">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">CONTATO</h4>
                            <div className="space-y-3 text-sm font-bold text-slate-600">
                                {store.phone && <p>{store.phone}</p>}
                                {store.email && <p className="break-all">{store.email}</p>}
                                {store.instagram && <p>@{store.instagram.replace('@', '')}</p>}
                                {store.addressLines.map((line, i) => (
                                    <p key={i} className="text-slate-400 text-xs font-medium">{line}</p>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 text-center flex flex-col items-center gap-6">
                        <div className="print:hidden">
                            <PrintButton />
                        </div>
                        <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.4em] text-slate-300">
                            <Globe size={10} /> Atelis Ecosystem • Profissionalismo Artesanal
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
