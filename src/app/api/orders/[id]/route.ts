import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  try {
    const { data: order, error } = await supabase
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
      .single()

    if (error || !order) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
    }

    return NextResponse.json(order)
  } catch (e) {
    console.error('API Error:', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
