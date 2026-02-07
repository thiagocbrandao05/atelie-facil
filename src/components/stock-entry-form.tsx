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
import { Plus, Trash2 } from 'lucide-react'
import { createStockEntry } from '@/features/stock/actions'
import { useFormHandler } from '@/hooks/use-form-handler'
import { Material, Supplier } from '@/lib/types'
import { ActionResponse } from '@/lib/types'

interface StockEntryFormProps {
    materials: Material[]
    suppliers: Supplier[]
}

interface EntryItem {
    id: string
    materialId: string
    color: string
    quantity: number
    totalCost: number
}

export function StockEntryForm({ materials = [], suppliers = [] }: StockEntryFormProps) {
    const { open, setOpen, state, formAction, isPending } = useFormHandler(createStockEntry)
    const formRef = useRef<HTMLFormElement>(null)
    const [localState, setLocalState] = useState<ActionResponse>(state)

    const [items, setItems] = useState<EntryItem[]>([
        { id: '1', materialId: '', color: '', quantity: 0, totalCost: 0 }
    ])

    // Helper to get compatible colors for a selected material
    const getMaterialColors = (materialId: string) => {
        const mat = materials.find(m => m.id === materialId)
        return mat?.colors || []
    }

    const addItem = () => {
        setItems([...items, { id: crypto.randomUUID(), materialId: '', color: '', quantity: 0, totalCost: 0 }])
    }

    const removeItem = (id: string) => {
        if (items.length > 1) {
            setItems(items.filter(i => i.id !== id))
        }
    }

    const updateItem = (id: string, field: keyof EntryItem, value: any) => {
        setItems(items.map(i => {
            if (i.id === id) {
                if (field === 'materialId') {
                    return { ...i, [field]: value, color: '' }
                }
                return { ...i, [field]: value }
            }
            return i
        }))
    }

    const totalProducts = items.reduce((acc, item) => acc + (item.totalCost || 0), 0)

    // We need to manage freight separately to show total
    const [freight, setFreight] = useState(0)

    useEffect(() => {
        setLocalState(state)
        if (state.success) {
            const timer = setTimeout(() => {
                setItems([{ id: '1', materialId: '', color: '', quantity: 0, totalCost: 0 }])
                setFreight(0)
                formRef.current?.reset()
            }, 1000) // Give user time to see success message
            return () => clearTimeout(timer)
        }
    }, [state])

    useEffect(() => {
        if (!open) {
            // This is for dialog cases, but we apply it here too if needed
            // However, in this tab view, it's safer to rely on state.success
        }
    }, [open])

    // Prepare items for server action with calculated unit cost
    const preparedItems = items.map(item => ({
        ...item,
        unitCost: item.quantity > 0 ? item.totalCost / item.quantity : 0
    }))

    return (
        <div className="bg-card rounded-lg shadow-sm border p-6">
            <div className="mb-6">
                <h2 className="text-xl font-semibold">Nova Entrada (Compra)</h2>
                <p className="text-sm text-muted-foreground">Registre compras de materiais para alimentar o estoque.</p>
            </div>

            <form action={formAction} ref={formRef}>
                <div className="grid gap-6">
                    {/* Header: Supplier & Main Info */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="supplierName">Fornecedor / Loja</Label>
                            {suppliers && suppliers.length > 0 ? (
                                <Select name="supplierName" required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione um fornecedor..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {suppliers.map(s => (
                                            <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <div className="space-y-1">
                                    <Input id="supplierName" name="supplierName" placeholder="Nome da loja ou fornecedor" required />
                                    <p className="text-[10px] text-muted-foreground">Nenhum fornecedor cadastrado. Digite o nome acima.</p>
                                </div>
                            )}
                            {localState.errors?.supplierName && <p className="text-xs text-red-500">{localState.errors.supplierName[0]}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="freightCost">Frete (R$)</Label>
                            <Input
                                id="freightCost"
                                name="freightCost"
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                value={freight}
                                onChange={e => setFreight(parseFloat(e.target.value) || 0)}
                            />
                        </div>
                    </div>

                    {/* Items List */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <Label>Itens da Compra</Label>
                            <Button type="button" variant="outline" size="sm" onClick={addItem}>
                                <Plus className="w-4 h-4 mr-1" /> Adicionar Item
                            </Button>
                        </div>

                        <div className="space-y-2">
                            {items.map((item, index) => (
                                <div key={item.id} className="grid grid-cols-12 gap-2 items-center p-3 bg-muted/40 rounded-md">
                                    <div className="col-span-12 md:col-span-4">
                                        <Label className="text-xs mb-1 block">Material</Label>
                                        <Select
                                            value={item.materialId}
                                            onValueChange={val => updateItem(item.id, 'materialId', val)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {materials.map(m => (
                                                    <SelectItem key={m.id} value={m.id}>{m.name} ({m.unit})</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="col-span-6 md:col-span-3">
                                        <Label className="text-xs mb-1 block">Cor / Variante</Label>
                                        <Select
                                            value={item.color}
                                            onValueChange={val => updateItem(item.id, 'color', val)}
                                            disabled={!item.materialId || getMaterialColors(item.materialId).length === 0}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Cor..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {getMaterialColors(item.materialId).map(c => (
                                                    <SelectItem key={c} value={c}>{c}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="col-span-3 md:col-span-2">
                                        <Label className="text-xs mb-1 block">Qtd.</Label>
                                        <Input
                                            type="number"
                                            step="0.001"
                                            value={item.quantity || ''}
                                            onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value))}
                                            placeholder="0"
                                        />
                                    </div>

                                    <div className="col-span-3 md:col-span-2">
                                        <Label className="text-xs mb-1 block">Custo Total</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={item.totalCost || ''}
                                            onChange={e => updateItem(item.id, 'totalCost', parseFloat(e.target.value))}
                                            placeholder="0.00"
                                        />
                                    </div>

                                    <div className="col-span-12 md:col-span-1 flex justify-end mt-2 md:mt-6">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                            onClick={() => removeItem(item.id)}
                                            disabled={items.length === 1}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="note">Observações</Label>
                        <Input id="note" name="note" placeholder="Opcional. Ex: Número da Nota Fiscal" />
                    </div>

                    {/* Summary */}
                    <div className="flex flex-col items-end gap-1 p-4 bg-muted/20 rounded-lg border">
                        <div className="text-sm">Subtotal Itens: R$ {totalProducts.toFixed(2)}</div>
                        <div className="text-sm">Frete: R$ {freight.toFixed(2)}</div>
                        <div className="text-lg font-bold">Total: R$ {(totalProducts + freight).toFixed(2)}</div>
                    </div>

                    {/* Hidden input for passing items logic to Server Action */}
                    <input type="hidden" name="items" value={JSON.stringify(preparedItems)} />

                    {localState.message && (
                        <p className={`text-sm ${localState.success ? 'text-green-600' : 'text-red-500'}`}>
                            {localState.message}
                        </p>
                    )}

                    <div className="flex justify-end">
                        <Button type="submit" disabled={isPending}>
                            {isPending ? 'Registrando...' : 'Registrar Entrada'}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    )
}


