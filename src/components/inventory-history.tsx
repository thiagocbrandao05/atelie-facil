'use client'

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from '@/components/ui/badge'

interface Movement {
    id: string
    type: string
    quantity: number
    reason: string
    createdAt: Date
    materialName: string
    unit: string
    color?: string
}

interface InventoryHistoryProps {
    movements: Movement[]
}

const TYPE_MAP: Record<string, { label: string, variant: "default" | "secondary" | "destructive" | "outline" | "success" }> = {
    'ENTRADA': { label: 'Entrada (Compra)', variant: 'success' },
    'ENTRADA_AJUSTE': { label: 'Ajuste (+)', variant: 'secondary' },
    'SAIDA': { label: 'Saída', variant: 'outline' },
    'SAIDA_AJUSTE': { label: 'Ajuste (-)', variant: 'secondary' },
    'PERDA': { label: 'Perda', variant: 'destructive' },
    'RETIRADA': { label: 'Retirada', variant: 'destructive' },
}

export function InventoryHistory({ movements }: InventoryHistoryProps) {
    if (!movements || !Array.isArray(movements) || movements.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-muted/10">
                <p className="text-muted-foreground">Nenhuma movimentação registrada.</p>
            </div>
        )
    }

    return (
        <div className="border rounded-md">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Material</TableHead>
                        <TableHead>Cor</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Origem / Motivo</TableHead>
                        <TableHead className="text-right">Qtd.</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {movements.map((movement, index) => {
                        if (!movement) return null // Defensive check

                        const type = movement.type || 'UNKNOWN'
                        const typeInfo = TYPE_MAP[type] || { label: type, variant: 'outline' }
                        const isPositive = ['ENTRADA', 'ENTRADA_AJUSTE'].includes(type)
                        const dateStr = movement.createdAt ? format(new Date(movement.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR }) : '-'

                        return (
                            <TableRow key={movement.id || index}>
                                <TableCell className="whitespace-nowrap">
                                    {dateStr}
                                </TableCell>
                                <TableCell className="font-medium">{movement.materialName || 'Sem nome'}</TableCell>
                                <TableCell className="text-muted-foreground">{movement.color || '-'}</TableCell>
                                <TableCell>
                                    <Badge variant={(typeInfo.variant === 'success' ? 'default' : typeInfo.variant) as any} className={typeInfo.variant === 'success' ? 'bg-green-600 hover:bg-green-700' : ''}>
                                        {typeInfo.label}
                                    </Badge>
                                </TableCell>
                                <TableCell className="max-w-[200px] truncate" title={movement.reason}>
                                    {movement.reason || '-'}
                                </TableCell>
                                <TableCell className={`text-right font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                    {isPositive ? '+' : '-'}{Number(movement.quantity || 0).toLocaleString('pt-BR')} {movement.unit}
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
    )
}



