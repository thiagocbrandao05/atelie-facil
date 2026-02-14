'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { SupplyRecommendation } from '../actions/supply-recommendations'
import { AlertCircle, CheckCircle } from 'lucide-react'

export function SupplyRecommendationsCard({ data }: { data: SupplyRecommendation[] }) {
  if (!data.length)
    return (
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle>Sugestão de Compras</CardTitle>
          <CardDescription>Materiais suficientes para a demanda prevista.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground bg-secondary/20 flex flex-col items-center justify-center rounded-lg p-6">
            <CheckCircle className="mb-2 h-8 w-8 text-green-500" />
            <p>Nenhum material em falta para o próximo mês.</p>
          </div>
        </CardContent>
      </Card>
    )

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Sugestão de Compras
          <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-900 dark:text-red-300">
            {data.length} itens críticos
          </span>
        </CardTitle>
        <CardDescription>
          Materiais que podem faltar baseados na previsão de demanda.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead className="text-right">Estoque</TableHead>
                <TableHead className="text-right">Uso Previsto</TableHead>
                <TableHead className="text-right">Falta</TableHead>
                <TableHead className="text-right">Sugestão de Compra</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map(item => (
                <TableRow key={item.materialId}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      {item.materialName}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-right">
                    {item.currentStock} {item.unit}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.projectedUsage.toFixed(1)} {item.unit}
                  </TableCell>
                  <TableCell className="text-right font-medium text-red-600">
                    -{item.missingQuantity.toFixed(1)} {item.unit}
                  </TableCell>
                  <TableCell className="text-primary text-right font-bold">
                    {item.suggestedPurchase} {item.unit}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
