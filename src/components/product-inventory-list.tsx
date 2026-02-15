'use client'

import { ProductInventory } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Package } from 'lucide-react'
import Image from 'next/image'

interface ProductInventoryListProps {
  inventory: ProductInventory[]
}

export function ProductInventoryList({ inventory }: ProductInventoryListProps) {
  if (inventory.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Package className="text-muted-foreground mb-4 h-12 w-12 opacity-20" />
        <p className="text-muted-foreground font-medium italic">
          Seu estoque de produtos acabados está vazio.
        </p>
        <p className="text-muted-foreground text-xs opacity-60">
          Cadastre movimentos de entrada para começar.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {inventory.map(item => {
        const product = item.product as any
        const isLowStock = item.minQuantity && item.quantity <= item.minQuantity

        return (
          <div
            key={item.id}
            className="group bg-background/40 hover:bg-background/60 relative rounded-2xl border p-4 transition-all hover:shadow-md"
          >
            <div className="flex items-start gap-4">
              <div className="bg-primary/5 border-primary/10 text-primary/40 flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border text-xl font-black tracking-tighter uppercase italic">
                {product?.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.name || 'Produto'}
                    width={56}
                    height={56}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  product?.name?.charAt(0) || 'P'
                )}
              </div>
              <div className="min-w-0 flex-1 pr-6">
                <h3 className="truncate text-sm font-bold">
                  {product?.name || 'Produto Removido'}
                </h3>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-2xl font-black tracking-tighter">{item.quantity}</span>
                  <span className="text-[10px] font-black tracking-widest uppercase opacity-40">
                    Unidades
                  </span>
                </div>
              </div>
              <div className="absolute top-4 right-4">
                {isLowStock ? (
                  <Badge
                    variant="destructive"
                    className="h-5 animate-pulse gap-1 px-1.5 text-[8px] font-black tracking-widest uppercase"
                  >
                    <AlertCircle size={10} /> Baixo
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="border-primary/20 text-primary h-5 px-1.5 text-[8px] font-black tracking-widest uppercase"
                  >
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
