'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Edit2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { CustomerForm } from './customer-form'
import { DeleteButton } from './delete-button'
import { deleteCustomer } from '@/features/customers/actions'

export function CustomerDialog({ customer }: { customer: any }) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-secondary hover:text-primary h-8 w-8 transition-colors"
        >
          <Edit2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[95vh] overflow-y-auto border-none bg-transparent p-0 shadow-2xl sm:max-w-xl">
        <div className="bg-background flex flex-col overflow-hidden rounded-2xl border">
          <DialogHeader className="bg-muted/5 border-b p-6 pb-2">
            <DialogTitle className="text-primary font-serif text-2xl italic">
              {customer.name}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Gerencie os dados cadastrais e informações de contato.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 p-6">
            <CustomerForm customer={customer} />

            <div className="mt-4 border-t pt-6">
              <h4 className="text-destructive/70 mb-3 text-[10px] font-black tracking-[0.2em] uppercase">
                Zona de Perigo
              </h4>
              <div className="border-destructive/10 bg-destructive/5 hover:border-destructive/20 flex items-center justify-between rounded-2xl border p-4 text-sm transition-colors">
                <span className="text-muted-foreground font-medium">Excluir este cliente?</span>
                <DeleteButton
                  id={customer.id}
                  onDelete={deleteCustomer}
                  label="Remover"
                  variant="destructive"
                  className="shadow-destructive/10 h-9 rounded-full px-5 text-[10px] font-bold tracking-widest uppercase shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
