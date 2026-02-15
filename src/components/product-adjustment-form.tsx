'use client'

import { useState } from 'react'
import { ActionResponse, Product } from '@/lib/types'
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
import { adjustProductStock } from '@/features/inventory-finished/actions'
import { useFormHandler } from '@/hooks/use-form-handler'
import { ArrowUpCircle, ArrowDownCircle, RefreshCw, AlertCircle } from 'lucide-react'

interface ProductAdjustmentFormProps {
  products: Product[]
}

export function ProductAdjustmentForm({ products }: ProductAdjustmentFormProps) {
  const [productId, setProductId] = useState('')
  const [type, setType] = useState<'ENTRADA' | 'SAIDA' | 'AJUSTE'>('ENTRADA')
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState('')

  const handleAction = async (_prevState: ActionResponse, _formData: FormData) => {
    const qty = parseFloat(quantity)
    if (isNaN(qty) || qty <= 0) {
      return { success: false, message: 'Quantidade inválida' }
    }
    if (!productId) {
      return { success: false, message: 'Selecione um produto' }
    }

    return await adjustProductStock(productId, qty, type, reason)
  }

  const { state, formAction, isPending } = useFormHandler(handleAction)

  return (
    <form action={formAction} className="mx-auto max-w-2xl space-y-6 py-4">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-[10px] font-black tracking-widest uppercase opacity-60">
            Produto
          </Label>
          <Select value={productId} onValueChange={setProductId}>
            <SelectTrigger className="focus:ring-primary/20 h-12 rounded-xl">
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

        <div className="space-y-2">
          <Label className="text-[10px] font-black tracking-widest uppercase opacity-60">
            Tipo de Movimento
          </Label>
          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant={type === 'ENTRADA' ? 'default' : 'outline'}
              className="flex h-12 flex-col gap-1 rounded-xl py-1"
              onClick={() => setType('ENTRADA')}
            >
              <ArrowUpCircle size={14} />
              <span className="text-[8px] font-black tracking-tighter uppercase">Entrada</span>
            </Button>
            <Button
              type="button"
              variant={type === 'SAIDA' ? 'default' : 'outline'}
              className="flex h-12 flex-col gap-1 rounded-xl py-1"
              onClick={() => setType('SAIDA')}
            >
              <ArrowDownCircle size={14} />
              <span className="text-[8px] font-black tracking-tighter uppercase">Saída</span>
            </Button>
            <Button
              type="button"
              variant={type === 'AJUSTE' ? 'default' : 'outline'}
              className="flex h-12 flex-col gap-1 rounded-xl py-1"
              onClick={() => setType('AJUSTE')}
            >
              <RefreshCw size={14} />
              <span className="text-[8px] font-black tracking-tighter uppercase">Ajuste</span>
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-black tracking-widest uppercase opacity-60">
            Quantidade
          </Label>
          <Input
            type="number"
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            placeholder="0.00"
            className="focus:ring-primary/20 h-12 rounded-xl"
            required
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-black tracking-widest uppercase opacity-60">
            Motivo / Referência
          </Label>
          <Input
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Ex: Produção concluída, Venda manual..."
            className="focus:ring-primary/20 h-12 rounded-xl"
            required
          />
        </div>
      </div>

      {state.message && (
        <div
          className={`flex items-center gap-2 rounded-xl border p-3 ${state.success ? 'border-green-100 bg-green-50 text-green-700' : 'border-red-100 bg-red-50 text-red-700'} animate-in fade-in slide-in-from-top-2 text-xs font-bold`}
        >
          <AlertCircle size={14} />
          {state.message}
        </div>
      )}

      <Button
        type="submit"
        disabled={isPending}
        className="shadow-primary/10 h-14 w-full rounded-2xl text-lg font-black tracking-widest uppercase shadow-lg transition-all active:scale-95"
      >
        {isPending ? 'Processando...' : 'Confirmar Movimentação'}
      </Button>
    </form>
  )
}
