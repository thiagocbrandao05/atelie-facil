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

interface ProductInventoryMovement {
  id: string
  createdAt: Date | string
  product?: { name: string }
  type: 'ENTRADA' | 'SAIDA' | 'AJUSTE'
  quantity: number
  reason: string
}

interface ProductInventoryHistoryProps {
  movements: ProductInventoryMovement[]
}

export function ProductInventoryHistory({ movements }: ProductInventoryHistoryProps) {
  if (movements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-muted-foreground font-medium italic">Nenhuma movimentação registrada.</p>
      </div>
    )
  }

  return (
    <div className="border-border/50 bg-background/50 overflow-hidden rounded-xl border">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow className="border-none hover:bg-transparent">
            <TableHead className="text-[10px] font-black tracking-widest uppercase opacity-60">
              Data
            </TableHead>
            <TableHead className="text-[10px] font-black tracking-widest uppercase opacity-60">
              Produto
            </TableHead>
            <TableHead className="text-[10px] font-black tracking-widest uppercase opacity-60">
              Tipo
            </TableHead>
            <TableHead className="text-right text-[10px] font-black tracking-widest uppercase opacity-60">
              Qtd
            </TableHead>
            <TableHead className="text-[10px] font-black tracking-widest uppercase opacity-60">
              Motivo
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movements.map(m => (
            <TableRow key={m.id} className="hover:bg-primary/5 border-border/40 transition-colors">
              <TableCell className="text-xs font-bold">
                {format(new Date(m.createdAt), 'dd MMM, HH:mm', { locale: ptBR })}
              </TableCell>
              <TableCell className="text-xs font-black italic">
                {m.product?.name || 'Produto Removido'}
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    m.type === 'ENTRADA'
                      ? 'default'
                      : m.type === 'SAIDA'
                        ? 'destructive'
                        : 'outline'
                  }
                  className="h-5 px-1.5 text-[8px] font-black tracking-widest uppercase"
                >
                  {m.type}
                </Badge>
              </TableCell>
              <TableCell className="text-right text-sm font-black">
                {m.type === 'SAIDA' ? '-' : '+'}
                {m.quantity}
              </TableCell>
              <TableCell className="text-muted-foreground text-xs font-medium italic">
                {m.reason}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
