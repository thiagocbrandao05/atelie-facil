import { AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function LowStockAlert({ data }: { data: any[] }) {
    if (data.length === 0) return null

    return (
        <Card className="border-warning/30 bg-warning/10">
            <CardHeader className="pb-2">
                <CardTitle className="text-warning flex items-center gap-2 text-lg">
                    <AlertTriangle className="h-5 w-5" />
                    Estoque Baixo
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="space-y-2 mt-2">
                    {data.map((item) => (
                        <li key={item.id} className="text-sm text-warning/80 flex justify-between">
                            <span>{item.name}</span>
                            <span className="font-bold">Restam: {item.quantity} {item.unit}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    )
}

