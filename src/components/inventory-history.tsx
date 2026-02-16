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
} from '@/components/ui/table'
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

const TYPE_MAP: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' }
> = {
  ENTRADA: { label: 'Entrada (Compra)', variant: 'success' },
  ENTRADA_AJUSTE: { label: 'Ajuste (+)', variant: 'secondary' },
  SAIDA: { label: 'Saída', variant: 'outline' },
  SAIDA_AJUSTE: { label: 'Ajuste (-)', variant: 'secondary' },
  PERDA: { label: 'Perda', variant: 'destructive' },
  RETIRADA: { label: 'Retirada', variant: 'destructive' },
}

export function InventoryHistory({ movements }: InventoryHistoryProps) {
  if (!movements || !Array.isArray(movements) || movements.length === 0) {
    return (
      <div className="bg-muted/10 flex flex-col items-center justify-center rounded-lg border p-8">
        <p className="text-muted-foreground">Nenhuma movimentação registrada.</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
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
            const badgeVariant = typeInfo.variant === 'success' ? 'default' : typeInfo.variant
            const isPositive = ['ENTRADA', 'ENTRADA_AJUSTE'].includes(type)
            // Fix timezone: Server returns UTC, we want to display in America/Sao_Paulo
            const dateObj = new Date(movement.createdAt)
            const dateStr = movement.createdAt
              ? new Intl.DateTimeFormat('pt-BR', {
                  timeZone: 'America/Sao_Paulo',
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                }).format(dateObj)
              : '-'

            return (
              <TableRow
                key={movement.id || index}
                className="hover:backdrop-blur-0 hover:bg-transparent"
              >
                <TableCell className="whitespace-nowrap">{dateStr}</TableCell>
                <TableCell className="font-medium">{movement.materialName || 'Sem nome'}</TableCell>
                <TableCell className="text-muted-foreground">{movement.color || '-'}</TableCell>
                <TableCell>
                  <Badge
                    variant={badgeVariant}
                    className={typeInfo.variant === 'success' ? 'bg-green-600' : ''}
                  >
                    {typeInfo.label}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[200px] truncate" title={movement.reason}>
                  {movement.reason || '-'}
                </TableCell>
                <TableCell
                  className={`text-right font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}
                >
                  {isPositive ? '+' : '-'}
                  {Number(movement.quantity || 0).toLocaleString('pt-BR')} {movement.unit}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
