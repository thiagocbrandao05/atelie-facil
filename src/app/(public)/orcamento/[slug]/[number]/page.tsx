import { createClient } from '@/lib/supabase/server'
import { createClient as createSimpleClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { PrintButton } from '@/components/print-button'
import { Phone, Mail, MapPin, Globe } from 'lucide-react'
import Image from 'next/image'

type PublicOrderRpcItem = {
  productName: string
  quantity: number
  price?: number
  discount?: number
}

type PublicOrderRpc = {
  tenantName: string
  storePhone?: string | null
  storeEmail?: string | null
  instagram?: string | null
  facebook?: string | null
  logoUrl?: string | null
  customerName: string
  customerPhone?: string | null
  customerAddress?: string | null
  dueDate: string
  createdAt: string
  orderNumber: number
  status: string
  items: PublicOrderRpcItem[]
  totalValue: number
  defaultQuotationNotes?: string | null
}

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
        persistSession: false,
      },
    }
  )

  const supabase = await createClient()

  if (!publicId) {
    notFound()
  }

  // Fetch order data via existing RPC
  // @ts-expect-error legacy schema not fully represented in generated DB types
  const { data, error: rpcError } = await supabase.rpc('get_public_order', {
    p_public_id: publicId,
  })

  if (rpcError || !data?.[0]) {
    console.error('[FRIENDLY_QUOTATION] Error or Not Found:', rpcError)
    notFound()
  }

  const order = data[0] as unknown as PublicOrderRpc

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
      realSettings?.addressStreet
        ? `${realSettings.addressStreet}, ${realSettings.addressNumber || 'S/N'}`
        : null,
      realSettings?.addressNeighborhood,
      realSettings?.addressCity
        ? `${realSettings.addressCity}${realSettings.addressState ? ` - ${realSettings.addressState}` : ''}`
        : null,
      realSettings?.addressZip ? `CEP: ${realSettings.addressZip}` : null,
    ].filter(Boolean),
  }

  const customer = {
    name: order.customerName,
    phone: order.customerPhone,
    address: order.customerAddress,
  }

  const validityDate = new Date(order.dueDate).toLocaleDateString('pt-BR')
  const emissionDate = new Date(order.createdAt).toLocaleDateString('pt-BR')

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8 print:bg-white print:p-0">
      <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl print:max-w-none print:rounded-none print:border-none print:shadow-none">
        {/* Simple Header */}
        <div className="border-b border-slate-100 p-8 italic md:p-12">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-6">
              {store.logoUrl ? (
                <div className="relative h-16 w-16 overflow-hidden rounded-lg">
                  <Image src={store.logoUrl} alt={store.name} fill className="object-contain" />
                </div>
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-2xl font-bold text-slate-400">
                  {store.name[0]}
                </div>
              )}
              <div>
                <h1
                  className="text-3xl font-black tracking-tight"
                  style={{ color: store.primaryColor }}
                >
                  {store.name} - Orçamento
                </h1>
                <p className="mt-1 font-bold text-slate-500">Pedido #{order.orderNumber}</p>
              </div>
            </div>

            <Badge
              variant="outline"
              className="rounded-full border-slate-200 bg-white px-4 py-1 text-xs font-bold uppercase shadow-sm"
            >
              {order.status === 'QUOTATION' ? 'ORÇAMENTO' : 'PEDIDO'}
            </Badge>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 gap-12 border-b border-slate-50 px-8 py-10 md:grid-cols-2 md:px-12">
          {/* Customer Info */}
          <div className="space-y-4">
            <h3 className="border-b border-slate-50 pb-2 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
              CLIENTE
            </h3>
            <div className="space-y-1">
              <p className="text-xl leading-none font-black tracking-tight text-slate-800">
                {customer.name}
              </p>
              {customer.phone && <p className="font-bold text-slate-500">{customer.phone}</p>}
              {customer.address && (
                <p className="mt-2 text-sm leading-relaxed font-medium text-slate-400">
                  {customer.address}
                </p>
              )}
            </div>
          </div>

          {/* Date Info */}
          <div className="space-y-4 md:text-right">
            <h3 className="border-b border-slate-50 pb-2 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase md:border-none">
              DATAS
            </h3>
            <div className="space-y-2">
              <div className="flex flex-row gap-2 text-sm md:justify-end">
                <span className="font-bold text-slate-400">Emissão:</span>
                <span className="font-black text-slate-800">{emissionDate}</span>
              </div>
              <div className="flex inline-block flex-row gap-2 rounded-lg bg-slate-50 p-2 text-sm md:ml-auto md:justify-end">
                <span className="font-bold text-slate-400">Validade:</span>
                <span className="font-black text-slate-900">{validityDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="px-8 py-8 md:px-12">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400">
                <th className="py-4 text-xs font-bold tracking-widest uppercase">Produto</th>
                <th className="py-4 text-center text-xs font-bold tracking-widest uppercase">
                  Qtd
                </th>
                <th className="py-4 text-center text-xs font-bold tracking-widest uppercase">
                  Preço Un.
                </th>
                <th className="py-4 text-right text-xs font-bold tracking-widest uppercase">
                  Subtotal
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(order.items || []).map((item, idx: number) => {
                const unitPrice = (item.price || 0) - (item.discount || 0)
                const subtotal = unitPrice * item.quantity
                return (
                  <tr key={idx}>
                    <td className="py-6">
                      <p className="text-base leading-tight font-black text-slate-800">
                        {item.productName}
                      </p>
                      {(item.discount || 0) > 0 && (
                        <p className="mt-1 text-[10px] font-bold tracking-tight text-rose-500 uppercase italic">
                          Desconto:{' '}
                          {(item.discount || 0).toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}{' '}
                          por unid.
                        </p>
                      )}
                    </td>
                    <td className="py-6 text-center font-bold text-slate-600 tabular-nums">
                      {item.quantity}
                    </td>
                    <td className="py-6 text-center font-medium text-slate-600 tabular-nums">
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
          <div className="mt-8 flex justify-end border-t border-slate-100 pt-8">
            <div className="flex items-center gap-12">
              <span className="text-xl font-black tracking-tight text-slate-800">Valor Total</span>
              <span
                className="text-3xl font-black tracking-tighter tabular-nums"
                style={{ color: store.primaryColor }}
              >
                {order.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
          </div>
        </div>

        {/* Store Contacts & Observations (Footer Section) */}
        <div className="border-t border-slate-100 bg-slate-50/50 p-8 md:p-12">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
            <div className="space-y-6">
              <div className="space-y-2">
                <h4 className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                  NOTAS DO ATELIÊ
                </h4>
                <p className="leading-relaxed font-bold text-slate-700 italic">
                  {order.defaultQuotationNotes
                    ? `"${order.defaultQuotationNotes}"`
                    : 'Proposta sujeita a disponibilidade de agenda.'}
                </p>
              </div>

              <div className="space-y-4 border-t border-slate-100 pt-4">
                <p className="text-[11px] leading-relaxed font-medium text-slate-500">
                  Este documento é um orçamento válido até {validityDate}.<br />
                  <span className="font-bold text-slate-400">
                    {store.name} - Gestão para Artesãos
                  </span>
                </p>
              </div>
            </div>

            <div className="space-y-6 md:text-right">
              <h4 className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                CONTATO
              </h4>
              <div className="space-y-3 text-sm font-bold text-slate-600">
                {store.phone && <p>{store.phone}</p>}
                {store.email && <p className="break-all">{store.email}</p>}
                {store.instagram && <p>@{store.instagram.replace('@', '')}</p>}
                {store.addressLines.map((line, i) => (
                  <p key={i} className="text-xs font-medium text-slate-400">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center gap-6 text-center">
            <div className="print:hidden">
              <PrintButton />
            </div>
            <div className="flex items-center gap-2 text-[9px] font-black tracking-[0.4em] text-slate-300 uppercase">
              <Globe size={10} /> Atelis Ecosystem • Profissionalismo Artesanal
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
