import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

interface StockItem {
    materialId: string
    materialName?: string // We merge this in passing props
    color: string | null
    balance: number
    unit?: string
}

interface StockOverviewListProps {
    items: StockItem[]
}

export function StockOverviewList({ items }: StockOverviewListProps) {
    if (!items || items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/10 rounded-lg">
                <p className="text-muted-foreground">Nenhum material em estoque.</p>
            </div>
        )
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Material</TableHead>
                        <TableHead>Cor / Variante</TableHead>
                        <TableHead className="text-right">Saldo Atual</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.map((item, idx) => (
                        <TableRow key={`${item.materialId}-${item.color || 'default'}-${idx}`}>
                            <TableCell className="font-medium">{item.materialName}</TableCell>
                            <TableCell>
                                {item.color ? (
                                    <Badge variant="outline">{item.color}</Badge>
                                ) : (
                                    <span className="text-muted-foreground">-</span>
                                )}
                            </TableCell>
                            <TableCell className="text-right font-bold">
                                {Number(item.balance).toLocaleString('pt-BR')} {item.unit}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}


