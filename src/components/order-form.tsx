'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createOrder } from '@/features/orders/actions'
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
import { Card, CardContent } from '@/components/ui/card'
import { calculateSuggestedPrice, ProductWithMaterials } from '@/lib/logic'
import { ActionResponse, Customer, OrderStatus } from '@/lib/types'

type DiscountType = 'fixed' | 'percent'
type CustomerOption = Pick<Customer, 'id' | 'name'>
type OrderItemDraft = {
  productId: string
  productName: string
  quantity: number
  price: number
  discount: number
}

export function OrderForm({
  products,
  customers,
  onSuccess,
}: {
  products: ProductWithMaterials[]
  customers: CustomerOption[]
  onSuccess?: () => void
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [customerId, setCustomerId] = useState('')
  const [dueDate, setDueDate] = useState('')

  const [state, setState] = useState<ActionResponse>({ success: false, message: '' })

  // Item adding state
  const [selectedProductId, setSelectedProductId] = useState<string>('')
  const [quantity, setQuantity] = useState(1)
  const [itemDiscount, setItemDiscount] = useState(0)
  const [itemDiscountType, setItemDiscountType] = useState<DiscountType>('fixed')

  // Order discount
  const [orderDiscount, setOrderDiscount] = useState(0)
  const [orderDiscountType, setOrderDiscountType] = useState<DiscountType>('fixed')

  // Cart
  const [items, setItems] = useState<OrderItemDraft[]>([])

  const selectedProduct = products.find(p => p.id === selectedProductId)
  const currentPrice = selectedProduct ? calculateSuggestedPrice(selectedProduct).suggestedPrice : 0

  const addItem = () => {
    if (!selectedProduct) return

    const calculatedDiscount =
      itemDiscountType === 'percent' ? (currentPrice * itemDiscount) / 100 : itemDiscount

    setItems([
      ...items,
      {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        quantity: quantity,
        price: currentPrice,
        discount: calculatedDiscount,
      },
    ])

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

  async function handleSubmit(status: OrderStatus) {
    setLoading(true)
    setState({ success: false, message: '' })

    try {
      const result = await createOrder({
        customerId,
        dueDate: new Date(dueDate),
        items,
        status,
        discount: finalOrderDiscount,
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

  const itemsTotal = items.reduce(
    (acc, item) => acc + (item.price - (item.discount || 0)) * item.quantity,
    0
  )
  const finalOrderDiscount =
    orderDiscountType === 'percent' ? (itemsTotal * orderDiscount) / 100 : orderDiscount

  const totalOrderValue = Math.max(0, itemsTotal - finalOrderDiscount)
  const canSubmit = Boolean(customerId && dueDate && items.length > 0 && !loading)

  async function handleAction(status: OrderStatus) {
    if (!customerId || !dueDate || items.length === 0) {
      setState({
        success: false,
        message: 'Preencha cliente, data de entrega e pelo menos um item para continuar.',
      })
      return
    }
    await handleSubmit(status)
  }

  return (
    <form className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="customer">Cliente</Label>
          <Select value={customerId} onValueChange={setCustomerId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um cliente..." />
            </SelectTrigger>
            <SelectContent>
              {customers.map(c => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {state.errors?.customerId && (
            <p className="text-xs text-red-500">{state.errors.customerId[0]}</p>
          )}
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
          {state.errors?.dueDate && (
            <p className="text-xs text-red-500">{state.errors.dueDate[0]}</p>
          )}
        </div>
      </div>

      <div className="bg-muted/40 space-y-4 rounded-xl border p-5 shadow-sm">
        <div className="mb-2 flex items-center gap-2 border-b pb-2">
          <div className="bg-primary h-1.5 w-1.5 rounded-full" />
          <h3 className="text-muted-foreground text-sm font-bold tracking-wider uppercase">
            Adicionar Itens ao Pedido
          </h3>
        </div>
        <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-12">
          <div className="flex flex-col gap-1.5 md:col-span-12 lg:col-span-5">
            <Label className="text-muted-foreground px-1 text-[11px] font-bold tracking-wider uppercase">
              Produto
            </Label>
            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
              <SelectTrigger className="bg-background focus:ring-primary/30 h-10 ring-offset-0 focus:ring-1">
                <SelectValue placeholder="Selecione um produto..." />
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
          <div className="flex flex-col gap-1.5 md:col-span-4 lg:col-span-2">
            <Label className="text-muted-foreground px-1 text-[11px] font-bold tracking-wider uppercase">
              Qtd
            </Label>
            <Input
              type="number"
              min="1"
              className="bg-background focus-visible:ring-primary/30 h-10 ring-offset-0 focus-visible:ring-1"
              value={quantity}
              onChange={e => setQuantity(parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="flex flex-col gap-1.5 md:col-span-5 lg:col-span-3">
            <Label className="text-muted-foreground px-1 text-[11px] font-bold tracking-wider uppercase">
              Desc. (un)
            </Label>
            <div className="bg-background focus-within:ring-primary/30 flex h-10 overflow-hidden rounded-md border focus-within:ring-1">
              <Select
                value={itemDiscountType}
                onValueChange={value => setItemDiscountType(value as DiscountType)}
              >
                <SelectTrigger className="bg-muted/50 h-full w-[70px] rounded-r-none border-r border-none px-3 text-xs font-bold shadow-none focus:ring-0">
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
                className="h-full border-none px-3 text-sm font-semibold shadow-none focus-visible:ring-0"
                value={itemDiscount}
                onChange={e => setItemDiscount(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
          <div className="md:col-span-3 lg:col-span-2">
            <Button
              type="button"
              onClick={addItem}
              disabled={!selectedProduct}
              className="h-10 w-full font-bold shadow-sm transition-all active:scale-[0.98]"
            >
              Adicionar
            </Button>
          </div>
        </div>
        {selectedProduct && (
          <div className="text-muted-foreground flex justify-between px-1 text-xs">
            <span>
              Preço Unitário Sugerido:{' '}
              <span className="text-foreground font-semibold">
                {currentPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </span>
            {itemDiscount > 0 && (
              <span className="text-primary font-medium">
                Preço Final:{' '}
                {(
                  (currentPrice -
                    (itemDiscountType === 'percent'
                      ? (currentPrice * itemDiscount) / 100
                      : itemDiscount)) *
                  quantity
                ).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            )}
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <div className="bg-primary h-1.5 w-1.5 rounded-full" />
            <Label className="text-muted-foreground text-sm font-bold tracking-wider uppercase">
              Itens do Pedido
            </Label>
          </div>
          <div className="bg-background overflow-hidden rounded-xl border shadow-sm">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="hover:bg-muted/10 flex items-center justify-between border-b p-4 transition-colors last:border-0"
              >
                <div className="space-y-1">
                  <p className="text-foreground text-sm font-bold">{item.productName}</p>
                  <p className="text-muted-foreground text-xs">
                    <span className="bg-muted mr-2 rounded px-1.5 py-0.5 font-bold">
                      x{item.quantity}
                    </span>
                    {item.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} un.
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="space-y-0.5 text-right">
                    <p className="text-primary text-base font-bold">
                      {((item.price - (item.discount || 0)) * item.quantity).toLocaleString(
                        'pt-BR',
                        { style: 'currency', currency: 'BRL' }
                      )}
                    </p>
                    {item.discount ? (
                      <div className="bg-danger/10 border-danger/20 inline-flex items-center rounded border px-2 py-0.5">
                        <span className="text-danger text-[10px] font-extrabold tracking-tight uppercase">
                          -{' '}
                          {item.discount.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}{' '}
                          desc.
                        </span>
                      </div>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Remover item ${item.productName}`}
                    onClick={() => removeItem(idx)}
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8 rounded-full"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      <line x1="10" x2="10" y1="11" y2="17" />
                      <line x1="14" x2="14" y1="11" y2="17" />
                    </svg>
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-muted/20 mt-4 flex flex-col items-start justify-between gap-4 rounded-xl border-t border-dashed p-4 pt-5 md:flex-row md:items-center">
            <div className="flex items-center gap-4">
              <Label className="text-muted-foreground px-1 text-xs font-bold tracking-widest uppercase">
                Desconto no Pedido
              </Label>
              <div className="bg-background focus-within:ring-primary/20 focus-within:border-primary flex h-10 items-center overflow-hidden rounded-lg border shadow-sm focus-within:ring-2">
                <Select
                  value={orderDiscountType}
                  onValueChange={value => setOrderDiscountType(value as DiscountType)}
                >
                  <SelectTrigger className="bg-muted/40 h-full w-16 rounded-r-none border-r border-none px-3 text-xs font-bold shadow-none focus:ring-0">
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
                  className="h-full w-24 border-none px-3 text-right text-sm font-extrabold shadow-none focus-visible:ring-0"
                  value={orderDiscount}
                  onChange={e => setOrderDiscount(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="min-w-[200px] space-y-1 text-right">
              <p className="text-muted-foreground text-[10px] font-bold tracking-[0.2em] uppercase">
                Total Final
              </p>
              <div className="text-primary text-3xl leading-none font-black">
                {totalOrderValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
            </div>
          </div>
        </div>
      )}

      {state.errors?.items && <p className="text-xs text-red-500">{state.errors.items[0]}</p>}

      {state.message && (
        <p
          role={state.success ? 'status' : 'alert'}
          aria-live="polite"
          className={`text-sm ${state.success ? 'text-green-600' : 'text-red-500'}`}
        >
          {state.message}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
        <Button
          type="button"
          variant="secondary"
          className="min-h-11 w-full"
          disabled={!canSubmit}
          onClick={() => void handleAction('QUOTATION')}
        >
          {loading ? 'Salvando...' : 'Salvar como Orçamento'}
        </Button>
        <Button
          type="button"
          className="min-h-11 w-full"
          disabled={!canSubmit}
          onClick={() => void handleAction('PENDING')}
        >
          {loading ? 'Criando...' : 'Finalizar Pedido'}
        </Button>
      </div>
    </form>
  )
}
