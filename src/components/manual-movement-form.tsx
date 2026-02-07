'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { addManualStockMovement } from '@/features/stock/actions'
import { useFormHandler } from '@/hooks/use-form-handler'
import { Material, ActionResponse } from '@/lib/types'

interface ManualMovementFormProps {
    materials: Material[]
}

const MOVEMENT_TYPES = [
    { value: 'ENTRADA_AJUSTE', label: 'Ajute de Entrada (+)', description: 'Correção de contagem ou bônus' },
    { value: 'SAIDA_AJUSTE', label: 'Ajuste de Saída (-)', description: 'Correção de contagem' },
    { value: 'PERDA', label: 'Perda / Quebra (-)', description: 'Material danificado ou perdido' },
    { value: 'RETIRADA', label: 'Retirada / Uso Interno (-)', description: 'Uso não vinculado a pedido' },
    { value: 'ENTRADA', label: 'Entrada Avulsa (+)', description: 'Reaproveitamento ou doação' },
]

export function ManualMovementForm({ materials = [] }: ManualMovementFormProps) {
    const { open, setOpen, state, formAction, isPending } = useFormHandler(addManualStockMovement)
    const formRef = useRef<HTMLFormElement>(null)
    const [localState, setLocalState] = useState<ActionResponse>(state)

    const [selectedMaterialId, setSelectedMaterialId] = useState<string>('')
    const [selectedType, setSelectedType] = useState<string>('SAIDA_AJUSTE')

    // Get colors for selected material
    const materialColors = materials.find(m => m.id === selectedMaterialId)?.colors || []

    useEffect(() => {
        setLocalState(state)
        if (state.success) {
            const timer = setTimeout(() => {
                setSelectedMaterialId('')
                setSelectedType('SAIDA_AJUSTE')
                formRef.current?.reset()
            }, 1000)
            return () => clearTimeout(timer)
        }
    }, [state])

    useEffect(() => {
        if (!open) {
            // Re-reset logic for dialog cases
        }
    }, [open])

    return (
        <div className="bg-card rounded-lg shadow-sm border p-6">
            <div className="mb-6">
                <h2 className="text-xl font-semibold">Movimentação Manual</h2>
                <p className="text-sm text-muted-foreground">Registrar ajustes, perdas ou retiradas avulsas.</p>
            </div>

            <form action={formAction} ref={formRef}>
                <div className="grid gap-6">
                    <div className="space-y-3">
                        <Label>Tipo de Movimentação</Label>
                        <RadioGroup
                            name="type"
                            value={selectedType}
                            onValueChange={setSelectedType}
                            className="grid grid-cols-1 md:grid-cols-2 gap-4"
                        >
                            {MOVEMENT_TYPES.map(type => (
                                <div key={type.value} className="flex items-center space-x-2 border p-3 rounded-md has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                                    <RadioGroupItem value={type.value} id={type.value} />
                                    <div>
                                        <Label htmlFor={type.value} className="font-medium cursor-pointer">{type.label}</Label>
                                        <p className="text-xs text-muted-foreground">{type.description}</p>
                                    </div>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="materialId">Material</Label>
                            <Select
                                value={selectedMaterialId}
                                onValueChange={setSelectedMaterialId}
                                name="materialId"
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o material..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {materials.map(m => (
                                        <SelectItem key={m.id} value={m.id}>{m.name} ({m.unit})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {localState.errors?.materialId && <p className="text-xs text-red-500">{localState.errors.materialId[0]}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="color">Cor / Variante</Label>
                            <Select name="color" disabled={materialColors.length === 0}>
                                <SelectTrigger>
                                    <SelectValue placeholder={materialColors.length === 0 ? "Nenhuma cor cadastrada" : "Selecione..."} />
                                </SelectTrigger>
                                <SelectContent>
                                    {materialColors.map(c => (
                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="quantity">Quantidade</Label>
                            <Input id="quantity" name="quantity" type="number" step="0.001" placeholder="0" required />
                            {localState.errors?.quantity && <p className="text-xs text-red-500">{localState.errors.quantity[0]}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="note">Observação / Motivo</Label>
                            <Input id="note" name="note" placeholder="Obrigatório para Perda/Retirada" />
                            {localState.errors?.note && <p className="text-xs text-red-500">{localState.errors.note[0]}</p>}
                        </div>
                    </div>

                    {localState.message && (
                        <p className={`text-sm ${localState.success ? 'text-green-600' : 'text-red-500'}`}>
                            {localState.message}
                        </p>
                    )}

                    <div className="flex justify-end">
                        <Button type="submit" disabled={isPending}>
                            {isPending ? 'Confirmar' : 'Confirmar Movimentação'}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    )
}


