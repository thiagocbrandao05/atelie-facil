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
} from "@/components/ui/dialog"
import { CustomerForm } from './customer-form'
import { DeleteButton } from './delete-button'
import { deleteCustomer } from '@/features/customers/actions'

export function CustomerDialog({ customer }: { customer: any }) {
    const [open, setOpen] = useState(false)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-secondary hover:text-primary transition-colors">
                    <Edit2 className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl max-h-[95vh] overflow-y-auto p-0 border-none shadow-2xl bg-transparent">
                <div className="bg-background rounded-2xl border flex flex-col overflow-hidden">
                    <DialogHeader className="p-6 pb-2 border-b bg-muted/5">
                        <DialogTitle className="text-2xl font-serif italic text-primary">{customer.name}</DialogTitle>
                        <DialogDescription className="text-xs">
                            Gerencie os dados cadastrais e informações de contato.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-6 space-y-6">
                        <CustomerForm customer={customer} />

                        <div className="pt-6 border-t mt-4">
                            <h4 className="text-[10px] font-black text-destructive/70 mb-3 uppercase tracking-[0.2em]">Zona de Perigo</h4>
                            <div className="flex justify-between items-center p-4 border border-destructive/10 rounded-2xl bg-destructive/5 text-sm transition-colors hover:border-destructive/20">
                                <span className="text-muted-foreground font-medium">Excluir este cliente?</span>
                                <DeleteButton
                                    id={customer.id}
                                    onDelete={deleteCustomer}
                                    label="Remover"
                                    variant="destructive"
                                    className="h-9 px-5 rounded-full font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-destructive/10"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}


