'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createOrder } from '@/features/orders/actions'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { calculateOrderTotal, calculateSuggestedPrice, ProductWithMaterials } from '@/lib/logic'
import { ActionResponse } from '@/lib/types'

export function OrderForm({ products, customers, onSuccess }: { products: ProductWithMaterials[], customers: any[], onSuccess?: () => void }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [customerId, setCustomerId] = useState('')
    const [dueDate, setDueDate] = useState('')

    const [state, setState] = useState<ActionResponse>({ success: false, message: '' })

    // Item adding state
    const [selectedProductId, setSelectedProductId] = useState<string>('')
    const [quantity, setQuantity] = useState(1)
    const [itemDiscount, setItemDiscount] = useState(0)
    const [itemDiscountType, setItemDiscountType] = useState<'fixed' | 'percent'>('fixed')

    // Order discount
    const [orderDiscount, setOrderDiscount] = useState(0)
    const [orderDiscountType, setOrderDiscountType] = useState<'fixed' | 'percent'>('fixed')

    // Cart
    const [items, setItems] = useState<{
        productId: string
        productName: string
        quantity: number
        price: number
        discount?: number
    }[]>([])

    const selectedProduct = products.find(p => p.id === selectedProductId)
    const currentPrice = selectedProduct ? calculateSuggestedPrice(selectedProduct).suggestedPrice : 0

    const addItem = () => {
        if (!selectedProduct) return

        const calculatedDiscount = itemDiscountType === 'percent'
            ? (currentPrice * itemDiscount) / 100
            : itemDiscount

        setItems([...items, {
            productId: selectedProduct.id,
            productName: selectedProduct.name,
            quantity: quantity,
            price: currentPrice,
            discount: calculatedDiscount
        }])

        setSelectedProductId('')
        setQuantity(1)
        setItemDiscount(0)
        setItemDiscountType('fixed')
    }

    const removeItem = (index: number) => {
        const newItems = [...items]
        newItems.splice(index, 1)
        setItems(newItems)
    }

    async function handleSubmit(status: string) {
        setLoading(true)
        setState({ success: false, message: '' })

        try {
            const result = await createOrder({
                customerId,
                dueDate: new Date(dueDate),
                items: items as any,
                status: status,
                discount: finalOrderDiscount
            })

            setState(result)

            if (result.success) {
                // Reset form
                setCustomerId('')
                setDueDate('')
                setItems([])
                router.refresh()
                if (onSuccess) onSuccess()
            }
        } catch (error) {
            console.error(error)
            setState({ success: false, message: 'Erro ao criar pedido.' })
        } finally {
            setLoading(false)
        }
    }

    const itemsTotal = items.reduce((acc, item) => acc + ((item.price - (item.discount || 0)) * item.quantity), 0)
    const finalOrderDiscount = orderDiscountType === 'percent'
        ? (itemsTotal * orderDiscount) / 100
        : orderDiscount

    const totalOrderValue = Math.max(0, itemsTotal - finalOrderDiscount)

    return (
        <form className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="customer">Cliente</Label>
                    <Select value={customerId} onValueChange={setCustomerId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione um cliente..." />
                        </SelectTrigger>
                        <SelectContent>
                            {customers.map(c => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {state.errors?.customerId && <p className="text-xs text-red-500">{state.errors.customerId[0]}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="date">Data de Entrega</Label>
                    <Input
                        id="date"
                        type="date"
                        value={dueDate}
                        onChange={e => setDueDate(e.target.value)}
                        required
                    />
                    {state.errors?.dueDate && <p className="text-xs text-red-500">{state.errors.dueDate[0]}</p>}
                </div>
            </div>



            <div className="p-5 border rounded-xl bg-muted/40 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b pb-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Adicionar Itens ao Pedido</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                    <div className="md:col-span-12 lg:col-span-5 flex flex-col gap-1.5">
                        <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-1">Produto</Label>
                        <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                            <SelectTrigger className="bg-background h-10 ring-offset-0 focus:ring-1 focus:ring-primary/30">
                                <SelectValue placeholder="Selecione um produto..." />
                            </SelectTrigger>
                            <SelectContent>
                                {products.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="md:col-span-4 lg:col-span-2 flex flex-col gap-1.5">
                        <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-1">Qtd</Label>
                        <Input
                            type="number"
                            min="1"
                            className="bg-background h-10 ring-offset-0 focus-visible:ring-1 focus-visible:ring-primary/30"
                            value={quantity}
                            onChange={e => setQuantity(parseInt(e.target.value))}
                        />
                    </div>
                    <div className="md:col-span-5 lg:col-span-3 flex flex-col gap-1.5">
                        <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-1">Desc. (un)</Label>
                        <div className="flex bg-background border rounded-md focus-within:ring-1 focus-within:ring-primary/30 overflow-hidden h-10">
                            <Select
                                value={itemDiscountType}
                                onValueChange={(v: any) => setItemDiscountType(v)}
                            >
                                <SelectTrigger className="w-[70px] border-none shadow-none focus:ring-0 px-3 h-full text-xs font-bold bg-muted/50 rounded-r-none border-r">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="fixed">R$</SelectItem>
                                    <SelectItem value="percent">%</SelectItem>
                                </SelectContent>
                            </Select>
                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                className="border-none shadow-none focus-visible:ring-0 h-full text-sm font-semibold px-3"
                                value={itemDiscount}
                                onChange={e => setItemDiscount(parseFloat(e.target.value) || 0)}
                            />
                        </div>
                    </div>
                    <div className="md:col-span-3 lg:col-span-2">
                        <Button type="button" onClick={addItem} disabled={!selectedProduct} className="w-full h-10 font-bold shadow-sm transition-all active:scale-[0.98]">
                            Adicionar
                        </Button>
                    </div>
                </div>
                {selectedProduct && (
                    <div className="text-xs text-muted-foreground flex justify-between px-1">
                        <span>Preço Unitário Sugerido: <span className="font-semibold text-foreground">{currentPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></span>
                        {(itemDiscount > 0) && (
                            <span className="text-primary font-medium">
                                Preço Final: {(
                                    (currentPrice - (itemDiscountType === 'percent' ? (currentPrice * itemDiscount) / 100 : itemDiscount)) * quantity
                                ).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {items.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <Label className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Itens do Pedido</Label>
                    </div>
                    <div className="border rounded-xl bg-background shadow-sm overflow-hidden">
                        {items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center p-4 border-b last:border-0 hover:bg-muted/10 transition-colors">
                                <div className="space-y-1">
                                    <p className="font-bold text-sm text-foreground">{item.productName}</p>
                                    <p className="text-xs text-muted-foreground">
                                        <span className="bg-muted px-1.5 py-0.5 rounded font-bold mr-2">x{item.quantity}</span>
                                        {item.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} un.
                                    </p>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right space-y-0.5">
                                        <p className="font-bold text-base text-primary">
                                            {((item.price - (item.discount || 0)) * item.quantity).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </p>
                                        {item.discount ? (
                                            <div className="inline-flex items-center bg-danger/10 px-2 py-0.5 rounded border border-danger/20">
                                                <span className="text-[10px] text-danger font-extrabold uppercase tracking-tight">
                                                    - {item.discount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} desc.
                                                </span>
                                            </div>
                                        ) : null}
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeItem(idx)}
                                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8 rounded-full"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-t pt-5 mt-4 bg-muted/20 p-4 rounded-xl border-dashed">
                        <div className="flex items-center gap-4">
                            <Label className="text-muted-foreground text-xs font-bold uppercase tracking-widest px-1">Desconto no Pedido</Label>
                            <div className="flex items-center bg-background border rounded-lg focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary overflow-hidden shadow-sm h-10">
                                <Select
                                    value={orderDiscountType}
                                    onValueChange={(v: any) => setOrderDiscountType(v)}
                                >
                                    <SelectTrigger className="w-16 border-none shadow-none focus:ring-0 px-3 h-full text-xs font-bold bg-muted/40 rounded-r-none border-r">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="fixed">R$</SelectItem>
                                        <SelectItem value="percent">%</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="w-24 border-none shadow-none h-full text-right px-3 focus-visible:ring-0 text-sm font-extrabold"
                                    value={orderDiscount}
                                    onChange={e => setOrderDiscount(parseFloat(e.target.value) || 0)}
                                />
                            </div>
                        </div>
                        <div className="text-right min-w-[200px] space-y-1">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-[0.2em]">Total Final</p>
                            <div className="font-black text-3xl text-primary leading-none">
                                {totalOrderValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {state.errors?.items && <p className="text-xs text-red-500">{state.errors.items[0]}</p>}

            {state.message && (
                <p className={`text-sm ${state.success ? 'text-green-600' : 'text-red-500'}`}>
                    {state.message}
                </p>
            )}

            <div className="flex gap-4">
                <Button
                    type="button"
                    variant="secondary"
                    className="w-full"
                    disabled={loading || items.length === 0}
                    onClick={() => handleSubmit('QUOTATION')}
                >
                    {loading ? 'Salvando...' : 'Salvar como Orçamento'}
                </Button>
                <Button
                    type="button"
                    className="w-full"
                    disabled={loading || items.length === 0}
                    onClick={() => handleSubmit('PENDING')}
                >
                    {loading ? 'Criando...' : 'Finalizar Pedido'}
                </Button>
            </div>
        </form>
    )
}


