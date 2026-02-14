'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { createCustomer, updateCustomer } from '@/features/customers/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import type { ActionResponse, Customer } from '@/lib/types'

export function CustomerForm({ customer }: { customer?: Customer }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const initialState: ActionResponse = { success: false, message: '' }
  const actionWithId = customer ? updateCustomer.bind(null, customer.id) : createCustomer
  const [state, action, isPending] = useActionState(actionWithId, initialState)
  const errors = state?.errors

  useEffect(() => {
    if (state?.success) {
      setShowSuccess(true)
      if (!customer) {
        formRef.current?.reset()
      }
      const timer = setTimeout(() => {
        setShowSuccess(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [state?.success, customer])

  return (
    <form ref={formRef} action={action} className="space-y-4">
      <div className="space-y-1.5">
        <Label
          htmlFor="name"
          className="text-muted-foreground pl-1 text-[10px] font-black tracking-widest uppercase"
        >
          Nome Completo
        </Label>
        <Input
          id="name"
          name="name"
          defaultValue={customer?.name}
          placeholder="Ex: Maria Silva"
          required
          className="focus:ring-primary/20 h-10 rounded-xl shadow-sm"
        />
        {errors?.name && (
          <p className="text-destructive pl-1 text-[10px] font-bold">{errors.name[0]}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label
            htmlFor="phone"
            className="text-muted-foreground pl-1 text-[10px] font-black tracking-widest uppercase"
          >
            Telefone / WhatsApp
          </Label>
          <Input
            id="phone"
            name="phone"
            defaultValue={customer?.phone || ''}
            placeholder="(11) 99999-9999"
            className="focus:ring-primary/20 h-10 rounded-xl shadow-sm"
          />
          {errors?.phone && (
            <p className="text-destructive pl-1 text-[10px] font-bold">{errors.phone[0]}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label
            htmlFor="email"
            className="text-muted-foreground pl-1 text-[10px] font-black tracking-widest uppercase"
          >
            E-mail
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={customer?.email || ''}
            placeholder="maria@email.com"
            className="focus:ring-primary/20 h-10 rounded-xl shadow-sm"
          />
          {errors?.email && (
            <p className="text-destructive pl-1 text-[10px] font-bold">{errors.email[0]}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label
            htmlFor="birthday"
            className="text-muted-foreground pl-1 text-[10px] font-black tracking-widest uppercase"
          >
            Data de Aniversário
          </Label>
          <Input
            id="birthday"
            name="birthday"
            type="date"
            defaultValue={
              customer?.birthday ? new Date(customer.birthday).toISOString().split('T')[0] : ''
            }
            className="focus:ring-primary/20 h-10 rounded-xl shadow-sm"
          />
          {errors?.birthday && (
            <p className="text-destructive pl-1 text-[10px] font-bold">{errors.birthday[0]}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label
          htmlFor="address"
          className="text-muted-foreground pl-1 text-[10px] font-black tracking-widest uppercase"
        >
          Endereço
        </Label>
        <Input
          id="address"
          name="address"
          defaultValue={customer?.address || ''}
          placeholder="Rua, número, bairro..."
          className="focus:ring-primary/20 h-10 rounded-xl shadow-sm"
        />
        {errors?.address && (
          <p className="text-destructive pl-1 text-[10px] font-bold">{errors.address[0]}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label
          htmlFor="notes"
          className="text-muted-foreground pl-1 text-[10px] font-black tracking-widest uppercase"
        >
          Observações
        </Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={customer?.notes || ''}
          placeholder="Preferências, restrições, etc."
          className="focus:ring-primary/20 bg-muted/20 min-h-[80px] rounded-xl shadow-sm"
        />
        {errors?.notes && (
          <p className="text-destructive pl-1 text-[10px] font-bold">{errors.notes[0]}</p>
        )}
      </div>

      <Button
        type="submit"
        className="shadow-primary/20 h-11 w-full rounded-xl text-xs font-bold tracking-widest uppercase shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99]"
        disabled={isPending}
      >
        {isPending ? 'Salvando...' : customer ? 'Atualizar Cliente' : 'Salvar Cliente'}
      </Button>

      {showSuccess && state?.message && (
        <p className="text-success bg-success/10 animate-in fade-in slide-in-from-top-2 rounded-lg py-2 text-center text-xs font-bold duration-300">
          {state.message}
        </p>
      )}
    </form>
  )
}
