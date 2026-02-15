'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { OrderForm } from './order-form'
import type { Customer, ProductWithMaterials } from '@/lib/types'
import { getOrderDialogData } from '@/features/orders/actions'

type CustomerOption = Pick<Customer, 'id' | 'name'>

export function OrderDialog() {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [products, setProducts] = useState<ProductWithMaterials[]>([])
  const [customers, setCustomers] = useState<CustomerOption[]>([])

  useEffect(() => {
    let cancelled = false

    async function loadDialogData() {
      if (!open || isLoading || products.length > 0) return

      try {
        setIsLoading(true)
        setError(null)
        const data = await getOrderDialogData()
        if (cancelled) return

        setProducts(data.products as ProductWithMaterials[])
        setCustomers(data.customers as CustomerOption[])
      } catch {
        if (cancelled) return
        setError('Não foi possível carregar os dados do pedido.')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void loadDialogData()

    return () => {
      cancelled = true
    }
  }, [open, isLoading, products.length])

  const handleRetry = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getOrderDialogData()
      setProducts(data.products as ProductWithMaterials[])
      setCustomers(data.customers as CustomerOption[])
    } catch {
      setError('Não foi possível carregar os dados do pedido.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="min-h-11 w-full px-4 sm:w-auto">Novo pedido</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[95vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo pedido</DialogTitle>
          <DialogDescription>Preencha os dados do pedido abaixo.</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="text-muted-foreground flex min-h-[220px] items-center justify-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando dados...
          </div>
        ) : error ? (
          <div className="space-y-3">
            <p className="text-destructive text-sm">{error}</p>
            <Button type="button" variant="outline" onClick={() => void handleRetry()}>
              Tentar novamente
            </Button>
          </div>
        ) : (
          <OrderForm products={products} customers={customers} onSuccess={() => setOpen(false)} />
        )}
      </DialogContent>
    </Dialog>
  )
}
