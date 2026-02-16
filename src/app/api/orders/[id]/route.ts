import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }
  if (!id || id.trim() === '') {
    return NextResponse.json({ error: 'ID invalido' }, { status: 400 })
  }

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
      .eq('tenantId', user.tenantId)
      .single()

    if (error || !order) {
      return NextResponse.json({ error: 'Pedido nao encontrado' }, { status: 404 })
    }

    return NextResponse.json(order)
  } catch (e) {
    console.error('API Error:', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
