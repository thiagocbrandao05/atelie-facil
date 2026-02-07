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
            <Card className="bg-yellow-50 dark:bg-yellow-900 border-yellow-200 dark:border-yellow-700 shadow-lg p-4">
                <div className="flex items-start gap-4">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-800 rounded-full">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                            Atenção ao Estoque!
                        </h4>
                        <p className="text-sm text-yellow-700 dark:text-yellow-200 mb-3">
                            {lowStockItems.length} materiais estão com estoque baixo.
                        </p>
                        <Link
                            href="/dashboard/relatorios"
                            className="text-sm font-medium text-yellow-800 dark:text-yellow-300 hover:underline"
                        >
                            Ver detalhes →
                        </Link>
                    </div>
                    <button
                        onClick={() => setIsVisible(false)}
                        className="text-yellow-500 hover:text-yellow-700 dark:hover:text-yellow-200"
                    >
                        <X size={18} />
                    </button>
                </div>
            </Card>
        </div>
    )
}


