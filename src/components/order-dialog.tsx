'use client'

import { useState } from 'react'
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

export function OrderDialog({ products, customers }: { products: any[]; customers: any[] }) {
  const [open, setOpen] = useState(false)

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
        <OrderForm products={products} customers={customers} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
