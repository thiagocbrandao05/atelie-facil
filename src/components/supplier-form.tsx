'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { SupplierSchema } from '@/lib/schemas'
import { createSupplier, updateSupplier } from '@/features/suppliers/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { Supplier } from '@/lib/types'

type SupplierFormValues = z.infer<typeof SupplierSchema>

interface SupplierFormProps {
  supplier?: Supplier
  trigger?: React.ReactNode
}

export function SupplierForm({ supplier, trigger }: SupplierFormProps) {
  const [open, setOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const isEditing = !!supplier

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(SupplierSchema),
    defaultValues: {
      name: supplier?.name || '',
      contact: supplier?.contact || '',
      phone: supplier?.phone || '',
      email: supplier?.email || '',
      address: supplier?.address || '',
      notes: supplier?.notes || '',
    },
  })

  async function onSubmit(data: SupplierFormValues) {
    setIsPending(true)
    try {
      const result = isEditing
        ? await updateSupplier(supplier.id, data)
        : await createSupplier(data)

      if (result.success) {
        toast.success(result.message)
        setOpen(false)
        if (!isEditing) form.reset()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error('Ocorreu um erro inesperado.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Novo Fornecedor
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Fornecedor' : 'Novo Fornecedor'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="name">Nome (Empresa)</Label>
              <Input id="name" {...form.register('name')} placeholder="Ex: Tecidos & Cia" />
              {form.formState.errors.name && (
                <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact">Contato (Pessoa)</Label>
              <Input id="contact" {...form.register('contact')} placeholder="Ex: Maria" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone/WhatsApp</Label>
              <Input id="phone" {...form.register('phone')} placeholder="(00) 00000-0000" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...form.register('email')}
              placeholder="contato@empresa.com"
            />
            {form.formState.errors.email && (
              <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Endereço</Label>
            <Input id="address" {...form.register('address')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              {...form.register('notes')}
              placeholder="Detalhes sobre prazos, pagamentos..."
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
