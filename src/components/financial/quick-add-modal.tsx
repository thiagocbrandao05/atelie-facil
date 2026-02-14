'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Drawer, DrawerContent, DrawerTrigger, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Minus, Check, Calendar, Tag, CreditCard, Banknote, HelpCircle, X, AlignLeft } from 'lucide-react'
import { useMediaQuery } from '@/hooks/use-media-query'
import { useFinancials, TransactionInput } from '@/features/financials/use-financials'
import { cn } from '@/lib/utils'
import * as Icons from 'lucide-react'

// Map string to component safely
const iconMap: Record<string, any> = {
    'shopping-bag': Icons.ShoppingBag,
    'scissors': Icons.Scissors,
    'package': Icons.Package,
    'gift': Icons.Gift,
    'megaphone': Icons.Megaphone,
    'monitor': Icons.Monitor,
    'file-text': Icons.FileText,
    'user': Icons.User,
    'help-circle': Icons.HelpCircle
}

export function QuickAddTransactionModal() {
    const [open, setOpen] = useState(false)
    const isDesktop = useMediaQuery("(min-width: 768px)")
    const { addTransaction, categories } = useFinancials()

    const [type, setType] = useState<'IN' | 'OUT'>('OUT')
    const [amount, setAmount] = useState('')
    const [description, setDescription] = useState('')
    const [categoryId, setCategoryId] = useState<string | null>(null)
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])

    // Reset form on open
    const handleOpen = (value: boolean) => {
        setOpen(value)
        if (value) {
            setAmount('')
            setDescription('')
            setCategoryId(null)
            setDate(new Date().toISOString().split('T')[0])
            setType('OUT')
        }
    }

    const handleSubmit = async () => {
        if (!amount || Number(amount) <= 0) return

        await addTransaction({
            description: description || (type === 'IN' ? 'Entrada Avulsa' : 'Saída Avulsa'),
            amount: Number(amount),
            type,
            category_id: categoryId,
            date,
            status: 'paid', // Default to paid for quick add
            payment_method: 'other',
            is_recurring: false
        })
        setOpen(false)
    }

    const FormContent = (
        <div className="space-y-6 px-4 pb-8">
            {/* 1. Type Toggle */}
            <div className="flex p-1 bg-muted rounded-xl">
                <button
                    onClick={() => setType('IN')}
                    className={cn(
                        "flex-1 py-3 text-sm font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2",
                        type === 'IN' ? "bg-emerald-100 text-emerald-700 shadow-sm" : "text-muted-foreground hover:bg-background/50"
                    )}
                >
                    <Plus size={16} /> Entrada
                </button>
                <button
                    onClick={() => setType('OUT')}
                    className={cn(
                        "flex-1 py-3 text-sm font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2",
                        type === 'OUT' ? "bg-red-100 text-red-700 shadow-sm" : "text-muted-foreground hover:bg-background/50"
                    )}
                >
                    <Minus size={16} /> Saída
                </button>
            </div>

            {/* 2. Amount Input (Main Focus) */}
            <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground">R$</span>
                <Input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0,00"
                    className="h-20 pl-14 text-4xl font-black bg-transparent border-none shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/20"
                    autoFocus
                />
            </div>

            {/* 3. Category Grid */}
            <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Categoria</label>
                <div className="grid grid-cols-4 gap-2">
                    {categories
                        .filter(c => c.type === type)
                        .map(cat => {
                            const Icon = iconMap[cat.icon || 'help-circle'] || Icons.HelpCircle
                            const isSelected = categoryId === cat.id
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setCategoryId(cat.id)}
                                    className={cn(
                                        "flex flex-col items-center justify-center gap-1 p-2 rounded-xl border transition-all h-20",
                                        isSelected
                                            ? (type === 'IN' ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-red-500 bg-red-50 text-red-700")
                                            : "border-border/40 bg-card hover:bg-accent/50 text-muted-foreground"
                                    )}
                                >
                                    <Icon size={20} />
                                    <span className="text-[9px] font-bold text-center leading-tight line-clamp-2">{cat.name}</span>
                                </button>
                            )
                        })}
                </div>
            </div>

            {/* 4. Optional Details */}
            <div className="space-y-3 pt-2">
                <div className="relative">
                    <AlignLeft className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Descrição (Opcional)"
                        className="pl-9 bg-muted/30 border-none h-10"
                    />
                </div>
                <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="pl-9 bg-muted/30 border-none h-10 w-full"
                    />
                </div>
            </div>

            {/* 5. Action Button */}
            <Button
                onClick={handleSubmit}
                className={cn(
                    "w-full h-12 text-lg font-bold rounded-xl shadow-lg transition-all active:scale-[0.98]",
                    !amount ? "opacity-50 cursor-not-allowed" : "",
                    type === 'IN' ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"
                )}
                disabled={!amount}
            >
                Confirmar {type === 'IN' ? 'Entrada' : 'Saída'}
            </Button>
        </div>
    )

    if (isDesktop) {
        return (
            <Dialog open={open} onOpenChange={handleOpen}>
                <DialogTrigger asChild>
                    <Button size="lg" className="rounded-full h-14 w-14 shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground p-0 fixed bottom-24 right-6 z-50 md:sticky md:bottom-6 md:right-0">
                        <Plus size={28} />
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] p-0 gap-0 overflow-hidden rounded-2xl border-none">
                    <DialogHeader className="p-6 pb-2 bg-gradient-to-b from-muted/50 to-background">
                        <DialogTitle>Novo Lançamento</DialogTitle>
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
                <Button size="lg" className="rounded-full h-14 w-14 shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground p-0 fixed bottom-24 right-6 z-50 animate-in zoom-in duration-300">
                    <Plus size={28} />
                </Button>
            </DrawerTrigger>
            <DrawerContent className="h-[85vh] rounded-t-3xl p-0">
                <DrawerHeader className="text-left px-6 pt-6 pb-2">
                    <DrawerTitle className="text-xl font-black">Novo Lançamento</DrawerTitle>
                    <DrawerDescription>Fluxo rápido de cx.</DrawerDescription>
                </DrawerHeader>
                <div className="overflow-y-auto max-h-full">
                    {FormContent}
                </div>
            </DrawerContent>
        </Drawer>
    )
}
