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
                <Label htmlFor="name" className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Nome Completo</Label>
                <Input id="name" name="name" defaultValue={customer?.name} placeholder="Ex: Maria Silva" required className="h-10 rounded-xl shadow-sm focus:ring-primary/20" />
                {errors?.name && <p className="text-[10px] text-destructive font-bold pl-1">{errors.name[0]}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Telefone / WhatsApp</Label>
                    <Input id="phone" name="phone" defaultValue={customer?.phone || ''} placeholder="(11) 99999-9999" className="h-10 rounded-xl shadow-sm focus:ring-primary/20" />
                    {errors?.phone && <p className="text-[10px] text-destructive font-bold pl-1">{errors.phone[0]}</p>}
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">E-mail</Label>
                    <Input id="email" name="email" type="email" defaultValue={customer?.email || ''} placeholder="maria@email.com" className="h-10 rounded-xl shadow-sm focus:ring-primary/20" />
                    {errors?.email && <p className="text-[10px] text-destructive font-bold pl-1">{errors.email[0]}</p>}
                </div>
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="address" className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Endereço</Label>
                <Input id="address" name="address" defaultValue={customer?.address || ''} placeholder="Rua, número, bairro..." className="h-10 rounded-xl shadow-sm focus:ring-primary/20" />
                {errors?.address && <p className="text-[10px] text-destructive font-bold pl-1">{errors.address[0]}</p>}
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="notes" className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Observações</Label>
                <Textarea id="notes" name="notes" defaultValue={customer?.notes || ''} placeholder="Preferências, restrições, etc." className="min-h-[80px] rounded-xl shadow-sm focus:ring-primary/20 bg-muted/20" />
                {errors?.notes && <p className="text-[10px] text-destructive font-bold pl-1">{errors.notes[0]}</p>}
            </div>

            <Button type="submit" className="w-full h-11 rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99]" disabled={isPending}>
                {isPending ? 'Salvando...' : customer ? 'Atualizar Cliente' : 'Salvar Cliente'}
            </Button>

            {showSuccess && state?.message && (
                <p className="text-xs text-center text-success font-bold bg-success/10 py-2 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
                    {state.message}
                </p>
            )}
        </form>
    )
}

