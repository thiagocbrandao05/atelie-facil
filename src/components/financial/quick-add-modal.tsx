'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Minus, Calendar, AlignLeft, Loader2 } from 'lucide-react'
import { useMediaQuery } from '@/hooks/use-media-query'
import { useFinancials } from '@/features/financials/use-financials'
import { cn } from '@/lib/utils'
import * as Icons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const iconMap: Record<string, LucideIcon> = {
  'shopping-bag': Icons.ShoppingBag,
  scissors: Icons.Scissors,
  package: Icons.Package,
  gift: Icons.Gift,
  megaphone: Icons.Megaphone,
  monitor: Icons.Monitor,
  'file-text': Icons.FileText,
  user: Icons.User,
  'help-circle': Icons.HelpCircle,
}

export function QuickAddTransactionModal() {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const { addTransaction, categories } = useFinancials()

  const [type, setType] = useState<'IN' | 'OUT'>('OUT')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  const handleOpen = (value: boolean) => {
    setOpen(value)
    if (value) {
      setAmount('')
      setDescription('')
      setCategoryId(null)
      setDate(new Date().toISOString().split('T')[0])
      setType('OUT')
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0 || isSubmitting) return

    setIsSubmitting(true)
    try {
      await addTransaction({
        description: description || (type === 'IN' ? 'Entrada avulsa' : 'Saída avulsa'),
        amount: Number(amount),
        type,
        category_id: categoryId,
        date,
        status: 'paid',
        payment_method: 'other',
        is_recurring: false,
      })
      setOpen(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const FormContent = (
    <div className="space-y-6 px-4 pb-8">
      <div className="bg-muted flex rounded-xl p-1">
        <button
          type="button"
          onClick={() => setType('IN')}
          disabled={isSubmitting}
          className={cn(
            'flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg py-3 text-sm font-black tracking-wider uppercase transition-all',
            type === 'IN'
              ? 'bg-emerald-100 text-emerald-700 shadow-sm'
              : 'text-muted-foreground hover:bg-background/50'
          )}
        >
          <Plus size={16} /> Entrada
        </button>
        <button
          type="button"
          onClick={() => setType('OUT')}
          disabled={isSubmitting}
          className={cn(
            'flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg py-3 text-sm font-black tracking-wider uppercase transition-all',
            type === 'OUT'
              ? 'bg-red-100 text-red-700 shadow-sm'
              : 'text-muted-foreground hover:bg-background/50'
          )}
        >
          <Minus size={16} /> Saída
        </button>
      </div>

      <div className="relative">
        <span className="text-muted-foreground absolute top-1/2 left-4 -translate-y-1/2 text-2xl font-bold">
          R$
        </span>
        <Input
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="0,00"
          className="placeholder:text-muted-foreground/20 h-20 border-none bg-transparent pl-14 text-4xl font-black shadow-none focus-visible:ring-0"
          autoFocus
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <label className="text-muted-foreground ml-1 text-xs font-bold tracking-widest uppercase">
          Categoria
        </label>
        <div className="grid grid-cols-4 gap-2">
          {categories
            .filter(c => c.type === type)
            .map(cat => {
              const Icon = iconMap[cat.icon || 'help-circle'] || Icons.HelpCircle
              const isSelected = categoryId === cat.id
              return (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setCategoryId(cat.id)}
                  disabled={isSubmitting}
                  className={cn(
                    'flex min-h-24 flex-col items-center justify-center gap-1 rounded-xl border p-2 transition-all',
                    isSelected
                      ? type === 'IN'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-red-500 bg-red-50 text-red-700'
                      : 'border-border/40 bg-card text-muted-foreground hover:bg-accent/50'
                  )}
                >
                  <Icon size={20} />
                  <span className="line-clamp-2 text-center text-[10px] leading-tight font-bold">
                    {cat.name}
                  </span>
                </button>
              )
            })}
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <div className="relative">
          <AlignLeft className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
          <Input
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Descrição (opcional)"
            className="bg-muted/30 min-h-11 border-none pl-9"
            disabled={isSubmitting}
          />
        </div>
        <div className="relative">
          <Calendar className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
          <Input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="bg-muted/30 min-h-11 w-full border-none pl-9"
            disabled={isSubmitting}
          />
        </div>
      </div>

      <Button
        type="button"
        onClick={handleSubmit}
        className={cn(
          'h-12 w-full rounded-xl text-lg font-bold text-white shadow-lg transition-all active:scale-[0.98]',
          !amount || isSubmitting ? 'cursor-not-allowed opacity-50' : '',
          type === 'IN' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
        )}
        disabled={!amount || isSubmitting}
      >
        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {isSubmitting ? 'Salvando...' : `Confirmar ${type === 'IN' ? 'entrada' : 'saída'}`}
      </Button>
    </div>
  )

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={handleOpen}>
        <DialogTrigger asChild>
          <Button
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90 fixed right-6 bottom-24 z-50 h-14 w-14 rounded-full p-0 shadow-xl md:sticky md:right-0 md:bottom-6"
          >
            <Plus size={28} />
          </Button>
        </DialogTrigger>
        <DialogContent className="gap-0 overflow-hidden rounded-2xl border-none p-0 sm:max-w-[425px]">
          <DialogHeader className="from-muted/50 to-background bg-gradient-to-b p-6 pb-2">
            <DialogTitle>Novo lançamento</DialogTitle>
            <DialogDescription>Fluxo rápido de caixa</DialogDescription>
          </DialogHeader>
          {FormContent}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={handleOpen}>
      <DrawerTrigger asChild>
        <Button
          size="lg"
          className="animate-in bg-primary text-primary-foreground zoom-in hover:bg-primary/90 fixed right-6 bottom-24 z-50 h-14 w-14 rounded-full p-0 shadow-xl duration-300"
        >
          <Plus size={28} />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="h-[85vh] rounded-t-3xl p-0">
        <DrawerHeader className="px-6 pt-6 pb-2 text-left">
          <DrawerTitle className="text-xl font-black">Novo lançamento</DrawerTitle>
          <DrawerDescription>Fluxo rápido de caixa</DrawerDescription>
        </DrawerHeader>
        <div className="max-h-full overflow-y-auto">{FormContent}</div>
      </DrawerContent>
    </Drawer>
  )
}
