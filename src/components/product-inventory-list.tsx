'use client'

import { ProductInventory } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Package } from 'lucide-react'

interface ProductInventoryListProps {
    inventory: ProductInventory[]
}

export function ProductInventoryList({ inventory }: ProductInventoryListProps) {
    if (inventory.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <Package className="h-12 w-12 text-muted-foreground opacity-20 mb-4" />
                <p className="text-muted-foreground font-medium italic">Seu estoque de produtos acabados está vazio.</p>
                <p className="text-xs text-muted-foreground opacity-60">Cadastre movimentos de entrada para começar.</p>
            </div>
        )
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {inventory.map((item) => {
                const product = item.product as any
                const isLowStock = item.minQuantity && item.quantity <= item.minQuantity

                return (
                    <div
                        key={item.id}
                        className="group relative bg-background/40 hover:bg-background/60 border rounded-2xl p-4 transition-all hover:shadow-md"
                    >
                        <div className="flex items-start gap-4">
                            <div className="bg-primary/5 flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-primary/10 overflow-hidden font-black text-primary/40 text-xl italic uppercase tracking-tighter">
                                {product?.imageUrl ? (
                                    <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                                ) : (
                                    product?.name?.charAt(0) || 'P'
                                )}
                            </div>
                            <div className="flex-1 min-w-0 pr-6">
                                <h3 className="font-bold truncate text-sm">{product?.name || 'Produto Removido'}</h3>
                                <div className="mt-1 flex items-center gap-2">
                                    <span className="text-2xl font-black tracking-tighter">
                                        {item.quantity}
                                    </span>
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Unidades</span>
                                </div>
                            </div>
                            <div className="absolute top-4 right-4">
                                {isLowStock ? (
                                    <Badge variant="destructive" className="h-5 px-1.5 text-[8px] font-black uppercase tracking-widest gap-1 animate-pulse">
                                        <AlertCircle size={10} /> Baixo
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="h-5 px-1.5 text-[8px] font-black uppercase tracking-widest border-primary/20 text-primary">
                                        Ok
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
