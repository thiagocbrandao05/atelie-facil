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
import { Plus, Trash2, PackagePlus } from 'lucide-react'
import { createStockEntry } from '@/features/stock/actions'
import { useFormHandler } from '@/hooks/use-form-handler'
import { Material, Supplier } from '@/lib/types'
import { ActionResponse } from '@/lib/types'
import { MaterialForm } from '@/components/material-form'
import { useEntryItems } from '@/hooks/use-entry-items'

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

  const createEmptyItem = useCallback(
    (id: string): EntryItem => ({
      id,
      materialId: '',
      color: '',
      quantity: 0,
      totalCost: 0,
    }),
    []
  )

  const { items, addItem, removeItem, updateItem, resetItems } =
    useEntryItems<EntryItem>(createEmptyItem)

  // Helper to get compatible colors for a selected material
  const getMaterialColors = (materialId: string) => {
    const mat = materials.find(m => m.id === materialId)
    if (!mat || !mat.colors) return []

    try {
      let parsed: unknown = mat.colors
      if (typeof parsed === 'string') {
        if (parsed.startsWith('[')) {
          parsed = JSON.parse(parsed)
        }
      }

      const colorsArray = Array.isArray(parsed) ? parsed.flat() : [String(parsed)]

      // Clean up strings and filter empty
      return colorsArray
        .map(c =>
          String(c)
            .replace(/['"\[\]]+/g, '')
            .trim()
        )
        .filter(c => c.length > 0)
    } catch (e) {
      return []
    }
  }

  const handleUpdateItem = (id: string, field: keyof EntryItem, value: string | number) => {
    if (field === 'materialId') {
      updateItem(id, 'materialId', String(value))
      updateItem(id, 'color', '')
      return
    }

    if (field === 'color') {
      updateItem(id, 'color', String(value))
      return
    }

    updateItem(id, field, Number(value))
  }

  const totalProducts = items.reduce((acc, item) => acc + (item.totalCost || 0), 0)

  // We need to manage freight separately to show total
  const [freight, setFreight] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('A_VISTA')

  useEffect(() => {
    setLocalState(state)
    if (state.success) {
      const timer = setTimeout(() => {
        resetItems()
        setFreight(0)
        formRef.current?.reset()
      }, 1000) // Give user time to see success message
      return () => clearTimeout(timer)
    }
  }, [state, resetItems])

  useEffect(() => {
    if (!open) {
      // This is for dialog cases, but we apply it here too if needed
      // However, in this tab view, it's safer to rely on state.success
    }
  }, [open])

  // Prepare items for server action with calculated unit cost
  const preparedItems = items.map(item => ({
    ...item,
    unitCost: item.quantity > 0 ? item.totalCost / item.quantity : 0,
  }))

  return (
    <div className="bg-card rounded-lg border shadow-sm">
      <div className="border-b p-6">
        <h2 className="text-xl font-semibold">Nova Entrada (Compra)</h2>
        <p className="text-muted-foreground text-sm">
          Registre compras de materiais para alimentar o estoque.
        </p>
      </div>

      <div className="p-6">
        <form action={formAction} ref={formRef}>
          <div className="space-y-8">
            {/* Section 1: Dados Gerais */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="supplierName">Fornecedor / Loja</Label>
                {suppliers && suppliers.length > 0 ? (
                  <Select name="supplierName" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um fornecedor..." />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map(s => (
                        <SelectItem key={s.id} value={s.name}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="space-y-1">
                    <Input
                      id="supplierName"
                      name="supplierName"
                      placeholder="Nome da loja ou fornecedor"
                      required
                    />
                    <p className="text-muted-foreground text-[10px]">
                      Nenhum fornecedor cadastrado. Digite o nome acima.
                    </p>
                  </div>
                )}
                {localState.errors?.supplierName && (
                  <p className="text-xs text-red-500">{localState.errors.supplierName[0]}</p>
                )}
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

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
                <Select name="paymentMethod" value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A_VISTA">À Vista (Dinheiro/Pix)</SelectItem>
                    <SelectItem value="CREDIT_CARD">Cartão de Crédito</SelectItem>
                    <SelectItem value="DEBIT_CARD">Cartão de Débito</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {paymentMethod === 'CREDIT_CARD' && (
                <div className="space-y-2">
                  <Label htmlFor="installments">Parcelas</Label>
                  <Input
                    id="installments"
                    name="installments"
                    type="number"
                    min="1"
                    max="12"
                    defaultValue="1"
                    required
                  />
                </div>
              )}
            </div>

            <div className="my-6 border-t"></div>

            {/* Section 2: Itens */}
            <div className="space-y-4">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <Label className="text-base font-semibold">Itens da Compra</Label>
                <div className="flex items-center gap-2">
                  <MaterialForm
                    suppliers={suppliers}
                    trigger={
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary"
                      >
                        <PackagePlus className="mr-1 h-4 w-4" /> Novo Material
                      </Button>
                    }
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    <Plus className="mr-1 h-4 w-4" /> Adicionar Item
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={item.id} className="bg-muted/10 group relative rounded-lg border p-4">
                    <div className="grid grid-cols-12 items-end gap-4">
                      <div className="col-span-12 md:col-span-4">
                        <Label className="mb-2 block text-xs font-medium">Material</Label>
                        <Select
                          value={item.materialId}
                          onValueChange={val => handleUpdateItem(item.id, 'materialId', val)}
                        >
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Selecione o material..." />
                          </SelectTrigger>
                          <SelectContent>
                            {materials.map(m => (
                              <SelectItem key={m.id} value={m.id}>
                                {m.name} ({m.unit})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="col-span-12 md:col-span-3">
                        <Label className="mb-2 block text-xs font-medium">Cor / Variante</Label>
                        <Select
                          value={item.color}
                          onValueChange={val => handleUpdateItem(item.id, 'color', val)}
                          disabled={
                            !item.materialId || getMaterialColors(item.materialId).length === 0
                          }
                        >
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Selecione a cor..." />
                          </SelectTrigger>
                          <SelectContent>
                            {getMaterialColors(item.materialId).map(c => (
                              <SelectItem key={c} value={c}>
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="col-span-6 md:col-span-2">
                        <Label className="mb-2 block text-xs font-medium">Quantidade</Label>
                        <Input
                          type="number"
                          step="0.001"
                          className="bg-background"
                          value={item.quantity || ''}
                          onChange={e =>
                            handleUpdateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)
                          }
                          placeholder="0"
                        />
                      </div>

                      <div className="col-span-6 md:col-span-2">
                        <Label className="mb-2 block text-xs font-medium">Custo Total (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          className="bg-background"
                          value={item.totalCost || ''}
                          onChange={e =>
                            handleUpdateItem(item.id, 'totalCost', parseFloat(e.target.value) || 0)
                          }
                          placeholder="0.00"
                        />
                      </div>

                      {/* Remove Button - Absolute on Desktop, Relative on Mobile */}
                      <div className="col-span-12 flex justify-end md:col-span-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:bg-red-50 hover:text-red-500"
                          onClick={() => removeItem(item.id)}
                          disabled={items.length === 1}
                          title="Remover item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="my-6 border-t"></div>

            {/* Section 3: Summary and Submit */}
            <div className="grid items-start gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="note">Observações</Label>
                <Input id="note" name="note" placeholder="Opcional. Ex: Número da Nota Fiscal" />
              </div>

              <div className="bg-muted/30 flex flex-col gap-2 rounded-lg p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal Itens:</span>
                  <span>R$ {totalProducts.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Frete:</span>
                  <span>R$ {freight.toFixed(2)}</span>
                </div>
                <div className="my-2 border-t"></div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>R$ {(totalProducts + freight).toFixed(2)}</span>
                </div>

                <Button type="submit" disabled={isPending} className="mt-4 w-full" size="lg">
                  {isPending ? 'Registrando Entrada...' : 'Confirmar e Registrar'}
                </Button>
              </div>
            </div>

            {/* Hidden items input */}
            <input type="hidden" name="items" value={JSON.stringify(preparedItems)} />

            {localState.message && (
              <p
                className={`text-center text-sm ${localState.success ? 'text-green-600' : 'text-red-500'}`}
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
