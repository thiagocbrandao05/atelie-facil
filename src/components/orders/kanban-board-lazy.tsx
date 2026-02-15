'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getOrdersForKanban } from '@/features/orders/actions'
import { KanbanBoard } from '@/components/orders/kanban-board'

type KanbanOrder = {
  id: string
  status: 'QUOTATION' | 'PENDING' | 'PRODUCING' | 'READY' | 'DELIVERED'
  dueDate: string | Date | null
  totalValue: number
  customer?: { name: string | null } | null
  items?: Array<{ quantity: number; product?: { name: string } | null }>
}

export function KanbanBoardLazy() {
  const [orders, setOrders] = useState<KanbanOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadKanban = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = (await getOrdersForKanban()) as KanbanOrder[]
      setOrders(data ?? [])
    } catch {
      setError('Não foi possível carregar o quadro.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadKanban()
  }, [loadKanban])

  if (isLoading) {
    return (
      <div className="text-muted-foreground flex min-h-[280px] items-center justify-center gap-2 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando quadro...
      </div>
    )
  }

  if (error) {
    return (
      <div className="border-destructive/30 bg-destructive/5 rounded-xl border p-4 text-sm">
        <p className="text-destructive font-semibold">{error}</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-3 min-h-10"
          onClick={() => void loadKanban()}
        >
          Tentar novamente
        </Button>
      </div>
    )
  }

  return <KanbanBoard initialOrders={orders} />
}
