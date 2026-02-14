'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { MonthlyFinancialSummary } from '../actions'

export function ExpensesBreakdown({ summary }: { summary: MonthlyFinancialSummary }) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  return (
    <Card className="col-span-4 lg:col-span-2">
      <CardHeader>
        <CardTitle>Detalhamento de Despesas</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Despesas Fixas (Configuradas)</TableCell>
              <TableCell className="text-right">{formatCurrency(summary.fixedExpenses)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="text-muted-foreground pl-6 font-medium">
                - Salário Desejado
              </TableCell>
              <TableCell className="text-muted-foreground text-right">
                (Incluso nas fixas)
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Despesas Variáveis (Compras)</TableCell>
              <TableCell className="text-right">
                {formatCurrency(summary.variableExpenses)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-bold">Total</TableCell>
              <TableCell className="text-right font-bold">
                {formatCurrency(summary.totalExpenses)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
