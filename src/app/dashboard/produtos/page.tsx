import { getProducts, deleteProduct } from '@/features/products/actions'
import { getMaterials } from '@/features/materials/actions'
import { ProductForm } from '@/components/product-form'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { calculateSuggestedPrice } from '@/lib/logic'
import { DeleteButton } from '@/components/delete-button'



import { getSettings } from '@/features/settings/actions'

export default async function ProdutosPage() {
    const [products, materials, settings] = await Promise.all([
        getProducts(),
        getMaterials(),
        getSettings()
    ])
    const productsAsAny = products as any[]

    const hourlyRate = Number(settings?.hourlyRate || 20)

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary">Catálogo de Produtos</h1>
                    <p className="text-muted-foreground mt-1">Gerencie seus produtos e preços sugeridos.</p>
                </div>
                <ProductForm availableMaterials={materials} settings={settings} />
            </div>

            <div className="grid gap-4">
                {products.length === 0 && (
                    <div className="text-center py-10 text-muted-foreground">
                        Nenhum produto cadastrado.
                    </div>
                )}

                {productsAsAny.map((product) => {
                    const { materialCost, laborCost, fixedCost, marginValue, suggestedPrice } = calculateSuggestedPrice(
                        product as any,
                        Number(settings?.hourlyRate || 20),
                        settings?.monthlyFixedCosts || [],
                        Number(settings?.workingHoursPerMonth || 160)
                    );

                    return (
                        <Card key={product.id}>
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-4">
                                        <div>
                                            <CardTitle>{product.name}</CardTitle>
                                            <CardDescription>{product.laborTime} min • Margem: {product.profitMargin}%</CardDescription>
                                        </div>
                                        <div className="flex gap-1">
                                            <ProductForm availableMaterials={materials} product={product as any} settings={settings} />
                                            <DeleteButton id={product.id} onDelete={deleteProduct} className="h-8 w-8" />
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xl font-bold text-primary">
                                            {suggestedPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </div>
                                        <div className="text-xs text-muted-foreground">Preço Sugerido</div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm bg-muted/30 p-3 rounded-xl border border-muted-foreground/10">
                                    <div>
                                        <span className="block text-xs text-muted-foreground uppercase tracking-wider font-bold">Materiais</span>
                                        <span className="font-semibold text-foreground">{materialCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                    </div>
                                    <div>
                                        <span className="block text-xs text-muted-foreground uppercase tracking-wider font-bold">Mão de Obra</span>
                                        <span className="font-semibold text-foreground">{laborCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                    </div>
                                    <div>
                                        <span className="block text-xs text-muted-foreground uppercase tracking-wider font-bold">Fixo Rateado</span>
                                        <span className="font-semibold text-foreground">{fixedCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                    </div>
                                    <div className="flex flex-col items-start md:items-end justify-center">
                                        <Badge variant="outline" className="text-success border-success/30 bg-success/10 font-bold px-3">
                                            Lucro: +{marginValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </Badge>
                                    </div>
                                </div>

                                {product.materials.length > 0 && (
                                    <div className="mt-3">
                                        <p className="text-xs font-semibold mb-1">Composição:</p>
                                        <div className="flex flex-wrap gap-1">
                                            {(product.materials as any[]).map((pm: any) => (
                                                <Badge key={pm.materialId} variant="secondary" className="text-xs font-normal">
                                                    {pm.quantity} {pm.unit} {pm.material.name}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}

