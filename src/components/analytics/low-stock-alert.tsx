import { AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function LowStockAlert({ data }: { data: any[] }) {
    if (data.length === 0) return null

    return (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-900">
            <CardHeader className="pb-2">
                <CardTitle className="text-yellow-800 dark:text-yellow-500 flex items-center gap-2 text-lg">
                    <AlertTriangle className="h-5 w-5" />
                    Estoque Baixo
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="space-y-2 mt-2">
                    {data.map((item) => (
                        <li key={item.id} className="text-sm text-yellow-700 dark:text-yellow-400 flex justify-between">
                            <span>{item.name}</span>
                            <span className="font-bold">Restam: {item.quantity} {item.unit}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    )
}


