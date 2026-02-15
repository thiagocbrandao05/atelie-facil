import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type TopProductItem = {
  name?: string
  value?: number
  productName?: string
  quantity?: number
}

export function TopProducts({ data }: { data: TopProductItem[] }) {
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
                <span className="text-sm leading-none font-medium">
                  {item.name || item.productName || 'Produto'}
                </span>
                <span className="text-muted-foreground text-sm font-bold">
                  {item.value ?? item.quantity ?? 0} un.
                </span>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
