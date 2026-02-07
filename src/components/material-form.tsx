'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { createMaterial, updateMaterial } from '@/features/materials/actions'
import { useFormHandler } from '@/hooks/use-form-handler'
import { UNITS } from '@/lib/units'
import { Supplier, Material } from '@/lib/types'
import { ActionResponse } from '@/lib/types'
import { Pencil } from 'lucide-react'

interface MaterialFormProps {
    suppliers?: Supplier[]
    initialData?: Material
    trigger?: React.ReactNode
}

export function MaterialForm({ suppliers = [], initialData, trigger }: MaterialFormProps) {
    // Determine which action to use
    const action = initialData
        ? updateMaterial.bind(null, initialData.id)
        : createMaterial

    const { open, setOpen, state, formAction, isPending } = useFormHandler(action)
    const formRef = useRef<HTMLFormElement>(null)

    // Local state to shadow server action state, allowing us to clear messages on close
    const [localState, setLocalState] = useState<ActionResponse>(state)

    const [colors, setColors] = useState(initialData?.colors?.join(', ') || '')

    // Sync local state with server state when server state changes
    useEffect(() => {
        setLocalState(state)
    }, [state])

    // Reset form and local state when dialog closes
    useEffect(() => {
        if (!open) {
            setLocalState({ success: false, message: '' })
            if (!initialData) { // Only reset form fields if in create mode
                setColors('')
                formRef.current?.reset()
            }
        } else { // When opening, reset to initial values if in edit mode
            if (initialData) {
                setColors(initialData.colors?.join(', ') || '')
            }
        }
    }, [open, initialData])

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button>Novo Material</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{initialData ? 'Editar Material' : 'Cadastrar Material'}</DialogTitle>
                    <DialogDescription>
                        {initialData ? 'Atualize as informações do material.' : 'Cadastre os materiais que você utiliza. O controle de estoque (entradas/saídas) é feito em abas específicas.'}
                    </DialogDescription>
                </DialogHeader>
                <form action={formAction} ref={formRef}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nome do Material</Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder="Ex: Tecido Algodão"
                                required
                                defaultValue={initialData?.name}
                            />
                            {localState.errors?.name && <p className="text-xs text-red-500">{localState.errors.name[0]}</p>}
                        </div>

                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="unit">Unidade de Medida</Label>
                                <Select name="unit" required defaultValue={initialData?.unit}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {UNITS.map(u => (
                                            <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {localState.errors?.unit && <p className="text-xs text-red-500">{localState.errors.unit[0]}</p>}
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="colors">Cores / Variantes</Label>
                            <Input
                                id="colors"
                                name="colors"
                                placeholder="Separe por vírgula: Azul, Vermelho, Branco"
                                value={colors}
                                onChange={e => setColors(e.target.value)}
                            />
                            <p className="text-[10px] text-muted-foreground">Opcional. Liste as cores disponíveis.</p>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="minQuantity">Alerta de Estoque Mínimo</Label>
                            <Input
                                id="minQuantity"
                                name="minQuantity"
                                type="number"
                                step="0.01"
                                placeholder="Opcional"
                                defaultValue={initialData?.minQuantity !== null ? initialData?.minQuantity : ''}
                            />
                            <p className="text-[10px] text-muted-foreground">Você será avisado quando o estoque estiver abaixo deste valor.</p>
                            {localState.errors?.minQuantity && <p className="text-xs text-red-500">{localState.errors.minQuantity[0]}</p>}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="supplierId">Fornecedor Padrão</Label>
                            <Select name="supplierId" defaultValue={initialData?.supplierId || undefined}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um fornecedor (opcional)" />
                                </SelectTrigger>
                                <SelectContent>
                                    {suppliers.map(s => (
                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {localState.message && (
                            <p className={`text-sm ${localState.success ? 'text-green-600' : 'text-red-500'}`}>
                                {localState.message}
                            </p>
                        )}
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit" disabled={isPending}>
                            {isPending ? 'Salvando...' : 'Salvar'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}


