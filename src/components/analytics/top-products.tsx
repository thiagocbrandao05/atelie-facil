import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function TopProducts({ data }: { data: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Produtos Mais Vendidos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhuma venda registrada.</p>
          ) : (
            data.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm leading-none font-medium">{item.name}</span>
                <span className="text-muted-foreground text-sm font-bold">{item.value} un.</span>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
