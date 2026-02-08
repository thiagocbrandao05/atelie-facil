'use client'

import React from 'react'
import { AlertTriangle, X } from 'lucide-react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'

export function StockAlertBanner({ lowStockItems }: { lowStockItems: any[] }) {
    const [isVisible, setIsVisible] = React.useState(true)

    if (!lowStockItems || lowStockItems.length === 0 || !isVisible) return null

    return (
        <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm animate-in slide-in-from-bottom-5">
            <Card className="bg-warning/10 border-warning/20 shadow-lg p-4">
                <div className="flex items-start gap-4">
                    <div className="p-2 bg-warning/20 rounded-full">
                        <AlertTriangle className="h-5 w-5 text-warning" />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-semibold text-warning mb-1">
                            Atenção ao Estoque!
                        </h4>
                        <p className="text-sm text-warning/80 mb-3">
                            {lowStockItems.length} materiais estão com estoque baixo.
                        </p>
                        <Link
                            href="/dashboard/relatorios"
                            className="text-sm font-medium text-warning hover:underline"
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

