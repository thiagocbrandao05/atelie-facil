'use client'

import React from 'react'
import { AlertTriangle, X } from 'lucide-react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'

type LowStockItem = {
  id: string
  name: string
  quantity: number
  unit: string
}

export function StockAlertBanner({ lowStockItems }: { lowStockItems: LowStockItem[] }) {
  const [isVisible, setIsVisible] = React.useState(true)

  if (!lowStockItems || lowStockItems.length === 0 || !isVisible) return null

  return (
    <div className="animate-in slide-in-from-bottom-5 fixed right-4 bottom-4 z-50 w-full max-w-sm">
      <Card className="bg-warning/10 border-warning/20 p-4 shadow-lg">
        <div className="flex items-start gap-4">
          <div className="bg-warning/20 rounded-full p-2">
            <AlertTriangle className="text-warning h-5 w-5" />
          </div>
          <div className="flex-1">
            <h4 className="text-warning mb-1 font-semibold">Atenção ao Estoque!</h4>
            <p className="text-warning/80 mb-3 text-sm">
              {lowStockItems.length} materiais estão com estoque baixo.
            </p>
            <Link
              href="/app/relatorios"
              className="text-warning text-sm font-medium hover:underline"
            >
              Ver detalhes →
            </Link>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="text-warning/70 hover:text-warning"
          >
            <X size={18} />
          </button>
        </div>
      </Card>
    </div>
  )
}
