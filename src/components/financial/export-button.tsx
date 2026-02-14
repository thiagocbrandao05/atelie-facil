'use client'

import { Button } from '@/components/ui/button'
import { Download, Lock } from 'lucide-react'
import { getAllTransactionsForExport } from '@/features/financials/actions'
import { toast } from 'sonner'
import { useState } from 'react'
import Link from 'next/link'

export function ExportDataButton({ isPremium }: { isPremium: boolean }) {
    const [isExporting, setIsExporting] = useState(false)

    const handleExport = async () => {
        if (!isPremium) return

        setIsExporting(true)
        try {
            const transactions = await getAllTransactionsForExport()

            // Convert to CSV
            const headers = ['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor', 'Método', 'Status']
            const rows = transactions.map(t => [
                t.date,
                t.description || '',
                (t.category as any)?.name || 'Sem categoria',
                t.type === 'IN' ? 'Entrada' : 'Saída',
                t.amount.toString(),
                t.payment_method,
                t.status
            ])

            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
            ].join('\n')

            // Download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
            const link = document.createElement('a')
            const url = URL.createObjectURL(blob)
            link.setAttribute('href', url)
            link.setAttribute('download', `financeiro_${new Date().toISOString().split('T')[0]}.csv`)
            link.style.visibility = 'hidden'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            toast.success('Dados exportados com sucesso!')
        } catch (error) {
            console.error(error)
            toast.error('Erro ao exportar dados.')
        } finally {
            setIsExporting(false)
        }
    }

    if (!isPremium) {
        return (
            <Button variant="outline" size="sm" asChild>
                <Link href="/upgrade">
                    <Lock className="h-4 w-4 mr-2" />
                    Exportar CSV
                </Link>
            </Button>
        )
    }

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isExporting}
        >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Exportando...' : 'Exportar CSV'}
        </Button>
    )
}
