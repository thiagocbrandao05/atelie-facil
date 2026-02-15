'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
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
import { useEntryItems } from '@/hooks/use-entry-items'

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

  const createEmptyItem = useCallback(
    (id: string): EntryItem => ({
      id,
      productId: '',
      quantity: 0,
      unitCost: 0,
    }),
    []
  )

  const { items, addItem, removeItem, updateItem, resetItems } =
    useEntryItems<EntryItem>(createEmptyItem)

  const totalProducts = items.reduce((acc, item) => acc + (item.quantity * item.unitCost || 0), 0)
  const [freight, setFreight] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('A_VISTA')

  useEffect(() => {
    setLocalState(state)
    if (state.success) {
      const timer = setTimeout(() => {
        resetItems()
        setFreight(0)
        formRef.current?.reset()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [state, resetItems])

  return (
    <div className="bg-card overflow-hidden rounded-2xl border border-white/40 shadow-sm">
      <div className="bg-muted/30 border-b p-6">
        <div className="flex items-center gap-2">
          <ShoppingBag className="text-primary h-5 w-5" />
          <h2 className="text-xl font-black italic">Nova Compra de Itens</h2>
        </div>
        <p className="text-muted-foreground mt-1 text-xs font-medium">
          Registre entradas de produtos acabados comprados para seu estoque.
        </p>
      </div>

      <div className="p-6">
        <form action={formAction} ref={formRef}>
          <div className="space-y-8">
            {/* Section 1: Dados Gerais */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label
                  htmlFor="supplierName"
                  className="text-[10px] font-black tracking-widest uppercase opacity-60"
                >
                  Fornecedor / Loja
                </Label>
                <Input
                  id="supplierName"
                  name="supplierName"
                  placeholder="Ex: Fabricante X, Distribuidora Y"
                  className="focus:ring-primary/20 h-11 rounded-xl"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="freightCost"
                  className="text-[10px] font-black tracking-widest uppercase opacity-60"
                >
                  Frete (R$)
                </Label>
                <Input
                  id="freightCost"
                  name="freightCost"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={freight || ''}
                  onChange={e => setFreight(parseFloat(e.target.value) || 0)}
                  className="focus:ring-primary/20 h-11 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="paymentMethod"
                  className="text-[10px] font-black tracking-widest uppercase opacity-60"
                >
                  Forma de Pagamento
                </Label>
                <Select name="paymentMethod" value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="focus:ring-primary/20 h-11 rounded-xl">
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
                  <Label
                    htmlFor="installments"
                    className="text-[10px] font-black tracking-widest uppercase opacity-60"
                  >
                    Parcelas
                  </Label>
                  <Input
                    id="installments"
                    name="installments"
                    type="number"
                    min="1"
                    max="12"
                    defaultValue="1"
                    className="focus:ring-primary/20 h-11 rounded-xl"
                    required
                  />
                </div>
              )}
            </div>

            <div className="border-border/40 my-6 border-t"></div>

            {/* Section 2: Itens */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-black tracking-widest uppercase opacity-60">
                  Produtos Comprados
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addItem}
                  className="h-8 gap-2 rounded-lg text-[10px] font-black tracking-widest uppercase"
                >
                  <Plus size={14} /> Adicionar Item
                </Button>
              </div>

              <div className="space-y-3">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className="border-border/40 bg-muted/10 group hover:bg-muted/20 relative rounded-xl border p-4 transition-all"
                  >
                    <div className="grid grid-cols-12 items-end gap-4">
                      <div className="col-span-12 md:col-span-5">
                        <Label className="mb-2 block text-[10px] font-black tracking-widest uppercase opacity-40">
                          Produto
                        </Label>
                        <Select
                          value={item.productId}
                          onValueChange={val => updateItem(item.id, 'productId', val)}
                        >
                          <SelectTrigger className="bg-background h-10 rounded-lg">
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
                        <Label className="mb-2 block text-[10px] font-black tracking-widest uppercase opacity-40">
                          Quantidade
                        </Label>
                        <Input
                          type="number"
                          step="1"
                          className="bg-background h-10 rounded-lg"
                          value={item.quantity || ''}
                          onChange={e =>
                            updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)
                          }
                          placeholder="0"
                        />
                      </div>

                      <div className="col-span-6 md:col-span-3">
                        <Label className="mb-2 block text-[10px] font-black tracking-widest uppercase opacity-40">
                          Custo Unitário (R$)
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          className="bg-background h-10 rounded-lg"
                          value={item.unitCost || ''}
                          onChange={e =>
                            updateItem(item.id, 'unitCost', parseFloat(e.target.value) || 0)
                          }
                          placeholder="0.00"
                        />
                      </div>

                      <div className="col-span-12 flex justify-end md:col-span-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground rounded-lg hover:bg-red-50 hover:text-red-500"
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

            <div className="border-border/40 my-6 border-t"></div>

            {/* Section 3: Summary and Submit */}
            <div className="grid items-start gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label
                  htmlFor="note"
                  className="text-[10px] font-black tracking-widest uppercase opacity-60"
                >
                  Observações
                </Label>
                <Input
                  id="note"
                  name="note"
                  placeholder="NF, Lote, etc."
                  className="focus:ring-primary/20 h-11 rounded-xl"
                />
              </div>

              <div className="bg-primary/5 border-primary/10 flex flex-col gap-3 rounded-2xl border p-5">
                <div className="flex justify-between text-xs font-bold tracking-widest uppercase opacity-60">
                  <span>Subtotal:</span>
                  <span>R$ {totalProducts.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold tracking-widest uppercase opacity-60">
                  <span>Frete:</span>
                  <span>R$ {freight.toFixed(2)}</span>
                </div>
                <div className="border-primary/10 my-1 border-t"></div>
                <div className="text-primary flex justify-between text-xl font-black italic">
                  <span>Total:</span>
                  <span>R$ {(totalProducts + freight).toFixed(2)}</span>
                </div>

                <Button
                  type="submit"
                  disabled={isPending}
                  className="shadow-primary/20 mt-2 h-12 w-full rounded-xl font-black tracking-widest uppercase shadow-lg"
                  size="lg"
                >
                  {isPending ? 'Verificando...' : 'Finalizar Compra'}
                </Button>
              </div>
            </div>

            {/* Hidden items input */}
            <input
              type="hidden"
              name="items"
              value={JSON.stringify(items.map(i => ({ ...i, unitCost: i.unitCost || 0 })))}
            />

            {localState.message && (
              <p
                className={`rounded-lg p-3 text-center text-xs font-bold ${localState.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-500'}`}
              >
                {localState.message}
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
