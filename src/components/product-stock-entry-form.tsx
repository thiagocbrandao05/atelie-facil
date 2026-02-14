'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2, ShoppingBag } from 'lucide-react'
import { createProductStockEntry } from '@/features/inventory-finished/actions'
import { useFormHandler } from '@/hooks/use-form-handler'
import { Product, ActionResponse } from '@/lib/types'

interface ProductStockEntryFormProps {
    products: Product[]
}

interface EntryItem {
    id: string
    productId: string
    quantity: number
    unitCost: number
}

export function ProductStockEntryForm({ products = [] }: ProductStockEntryFormProps) {
    const { state, formAction, isPending } = useFormHandler(createProductStockEntry)
    const formRef = useRef<HTMLFormElement>(null)
    const [localState, setLocalState] = useState<ActionResponse>(state)

    const [items, setItems] = useState<EntryItem[]>([
        { id: '1', productId: '', quantity: 0, unitCost: 0 },
    ])

    const addItem = () => {
        setItems([
            ...items,
            { id: crypto.randomUUID(), productId: '', quantity: 0, unitCost: 0 },
        ])
    }

    const removeItem = (id: string) => {
        if (items.length > 1) {
            setItems(items.filter(i => i.id !== id))
        }
    }

    const updateItem = (id: string, field: keyof EntryItem, value: any) => {
        setItems(
            items.map(i => {
                if (i.id === id) {
                    return { ...i, [field]: value }
                }
                return i
            })
        )
    }

    const totalProducts = items.reduce((acc, item) => acc + (item.quantity * item.unitCost || 0), 0)
    const [freight, setFreight] = useState(0)
    const [paymentMethod, setPaymentMethod] = useState('A_VISTA')

    useEffect(() => {
        setLocalState(state)
        if (state.success) {
            const timer = setTimeout(() => {
                setItems([{ id: '1', productId: '', quantity: 0, unitCost: 0 }])
                setFreight(0)
                formRef.current?.reset()
            }, 1000)
            return () => clearTimeout(timer)
        }
    }, [state])

    return (
        <div className="bg-card rounded-2xl border border-white/40 shadow-sm overflow-hidden">
            <div className="border-b bg-muted/30 p-6">
                <div className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-black italic">Nova Compra de Itens</h2>
                </div>
                <p className="text-muted-foreground text-xs font-medium mt-1">
                    Registre entradas de produtos acabados comprados para seu estoque.
                </p>
            </div>

            <div className="p-6">
                <form action={formAction} ref={formRef}>
                    <div className="space-y-8">
                        {/* Section 1: Dados Gerais */}
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="supplierName" className="text-[10px] font-black uppercase tracking-widest opacity-60">Fornecedor / Loja</Label>
                                <Input
                                    id="supplierName"
                                    name="supplierName"
                                    placeholder="Ex: Fabricante X, Distribuidora Y"
                                    className="h-11 rounded-xl focus:ring-primary/20"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="freightCost" className="text-[10px] font-black uppercase tracking-widest opacity-60">Frete (R$)</Label>
                                <Input
                                    id="freightCost"
                                    name="freightCost"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    value={freight || ''}
                                    onChange={e => setFreight(parseFloat(e.target.value) || 0)}
                                    className="h-11 rounded-xl focus:ring-primary/20"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="paymentMethod" className="text-[10px] font-black uppercase tracking-widest opacity-60">Forma de Pagamento</Label>
                                <Select
                                    name="paymentMethod"
                                    value={paymentMethod}
                                    onValueChange={setPaymentMethod}
                                >
                                    <SelectTrigger className="h-11 rounded-xl focus:ring-primary/20">
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="A_VISTA">À Vista (Dinheiro/Pix)</SelectItem>
                                        <SelectItem value="CREDIT_CARD">Cartão de Crédito</SelectItem>
                                        <SelectItem value="DEBIT_CARD">Cartão de Débito</SelectItem>
                                        <SelectItem value="BOLETO">Boleto</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {paymentMethod === 'CREDIT_CARD' && (
                                <div className="space-y-2">
                                    <Label htmlFor="installments" className="text-[10px] font-black uppercase tracking-widest opacity-60">Parcelas</Label>
                                    <Input
                                        id="installments"
                                        name="installments"
                                        type="number"
                                        min="1"
                                        max="12"
                                        defaultValue="1"
                                        className="h-11 rounded-xl focus:ring-primary/20"
                                        required
                                    />
                                </div>
                            )}
                        </div>

                        <div className="border-t border-border/40 my-6"></div>

                        {/* Section 2: Itens */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-black uppercase tracking-widest opacity-60">Produtos Comprados</Label>
                                <Button type="button" variant="outline" size="sm" onClick={addItem} className="h-8 rounded-lg text-[10px] font-black uppercase tracking-widest gap-2">
                                    <Plus size={14} /> Adicionar Item
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {items.map((item, index) => (
                                    <div
                                        key={item.id}
                                        className="p-4 rounded-xl border border-border/40 bg-muted/10 relative group transition-all hover:bg-muted/20"
                                    >
                                        <div className="grid grid-cols-12 gap-4 items-end">
                                            <div className="col-span-12 md:col-span-5">
                                                <Label className="mb-2 block text-[10px] font-black uppercase tracking-widest opacity-40">Produto</Label>
                                                <Select
                                                    value={item.productId}
                                                    onValueChange={val => updateItem(item.id, 'productId', val)}
                                                >
                                                    <SelectTrigger className="h-10 rounded-lg bg-background">
                                                        <SelectValue placeholder="Selecione o produto..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {products.map(p => (
                                                            <SelectItem key={p.id} value={p.id}>
                                                                {p.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="col-span-6 md:col-span-3">
                                                <Label className="mb-2 block text-[10px] font-black uppercase tracking-widest opacity-40">Quantidade</Label>
                                                <Input
                                                    type="number"
                                                    step="1"
                                                    className="h-10 rounded-lg bg-background"
                                                    value={item.quantity || ''}
                                                    onChange={e =>
                                                        updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)
                                                    }
                                                    placeholder="0"
                                                />
                                            </div>

                                            <div className="col-span-6 md:col-span-3">
                                                <Label className="mb-2 block text-[10px] font-black uppercase tracking-widest opacity-40">Custo Unitário (R$)</Label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    className="h-10 rounded-lg bg-background"
                                                    value={item.unitCost || ''}
                                                    onChange={e =>
                                                        updateItem(item.id, 'unitCost', parseFloat(e.target.value) || 0)
                                                    }
                                                    placeholder="0.00"
                                                />
                                            </div>

                                            <div className="col-span-12 md:col-span-1 flex justify-end">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg"
                                                    onClick={() => removeItem(item.id)}
                                                    disabled={items.length === 1}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="border-t border-border/40 my-6"></div>

                        {/* Section 3: Summary and Submit */}
                        <div className="grid gap-6 md:grid-cols-2 items-start">
                            <div className="space-y-2">
                                <Label htmlFor="note" className="text-[10px] font-black uppercase tracking-widest opacity-60">Observações</Label>
                                <Input id="note" name="note" placeholder="NF, Lote, etc." className="h-11 rounded-xl focus:ring-primary/20" />
                            </div>

                            <div className="bg-primary/5 p-5 rounded-2xl flex flex-col gap-3 border border-primary/10">
                                <div className="flex justify-between text-xs font-bold uppercase tracking-widest opacity-60">
                                    <span>Subtotal:</span>
                                    <span>R$ {totalProducts.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-xs font-bold uppercase tracking-widest opacity-60">
                                    <span>Frete:</span>
                                    <span>R$ {freight.toFixed(2)}</span>
                                </div>
                                <div className="border-t border-primary/10 my-1"></div>
                                <div className="flex justify-between text-xl font-black italic text-primary">
                                    <span>Total:</span>
                                    <span>R$ {(totalProducts + freight).toFixed(2)}</span>
                                </div>

                                <Button type="submit" disabled={isPending} className="w-full mt-2 h-12 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-primary/20" size="lg">
                                    {isPending ? 'Verificando...' : 'Finalizar Compra'}
                                </Button>
                            </div>
                        </div>

                        {/* Hidden items input */}
                        <input type="hidden" name="items" value={JSON.stringify(items.map(i => ({ ...i, unitCost: i.unitCost || 0 })))} />

                        {localState.message && (
                            <p className={`text-xs font-bold text-center p-3 rounded-lg ${localState.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-500'}`}>
                                {localState.message}
                            </p>
                        )}
                    </div>
                </form>
            </div>
        </div>
    )
}
