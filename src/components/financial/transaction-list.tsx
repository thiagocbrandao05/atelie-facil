'use client'

import { useFinancials, Transaction } from '@/features/financials/use-financials'
import { format, isToday, isYesterday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowDownLeft, ArrowUpRight, Calendar, ShoppingBag, Scissors, Package, Gift, Megaphone, Monitor, FileText, User, HelpCircle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

// Map icons string to components
const iconMap: Record<string, any> = {
    'shopping-bag': ShoppingBag,
    'scissors': Scissors,
    'package': Package,
    'gift': Gift,
    'megaphone': Megaphone,
    'monitor': Monitor,
    'file-text': FileText,
    'user': User,
    'help-circle': HelpCircle
}

export function TransactionList() {
    const { transactions, isLoading } = useFinancials()

    if (isLoading) {
        return <TransactionListSkeleton />
    }

    if (transactions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center opacity-60">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                <p className="font-medium text-lg">Nenhum lançamento</p>
                <p className="text-sm text-muted-foreground">Toque em + para adicionar.</p>
            </div>
        )
    }

    // Group transactions by date
    const groupedTransactions = transactions.reduce((groups, transaction) => {
        const date = transaction.date
        if (!groups[date]) {
            groups[date] = []
        }
        groups[date].push(transaction)
        return groups
    }, {} as Record<string, Transaction[]>)

    // Sort dates descending
    const sortedDates = Object.keys(groupedTransactions).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

    return (
        <div className="space-y-6 pb-20">
            {sortedDates.map(date => (
                <div key={date} className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1 sticky top-0 bg-background/95 backdrop-blur py-2 z-10">
                        {isToday(new Date(date)) ? 'Hoje' : isYesterday(new Date(date)) ? 'Ontem' : format(new Date(date), "dd 'de' MMMM", { locale: ptBR })}
                    </h3>
                    <div className="bg-white dark:bg-card/50 rounded-2xl border border-border/40 overflow-hidden shadow-sm">
                        {groupedTransactions[date].map((transaction, index) => (
                            <TransactionItem
                                key={transaction.id}
                                transaction={transaction}
                                isLast={index === groupedTransactions[date].length - 1}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}

function TransactionItem({ transaction, isLast }: { transaction: Transaction, isLast: boolean }) {
    const Icon = iconMap[transaction.category?.icon || 'help-circle'] || HelpCircle
    const isIncome = transaction.type === 'IN'

    return (
        <div className={`flex items-center justify-between p-4 hover:bg-muted/30 transition-colors ${!isLast ? 'border-b border-border/20' : ''}`}>
            <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-full ${isIncome ? 'bg-emerald-100/50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-red-100/50 text-red-600 dark:bg-red-900/40 dark:text-red-400'}`}>
                    <Icon size={18} strokeWidth={2.5} />
                </div>
                <div className="space-y-0.5">
                    <p className="text-sm font-bold leading-none text-foreground/90">
                        {transaction.description || transaction.category?.name || 'Sem descrição'}
                    </p>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/70">
                        {transaction.category?.name || 'Geral'}
                    </p>
                </div>
            </div>
            <div className="text-right">
                <p className={`text-sm font-black tracking-tight ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>
                    {isIncome ? '+' : '-'} {transaction.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
                <div className="flex items-center justify-end gap-1 mt-0.5 opacity-40">
                    {isIncome ? <ArrowUpRight size={10} /> : <ArrowDownLeft size={10} />}
                    <span className="text-[9px] font-bold uppercase">{transaction.payment_method === 'credit' ? 'Crédito' : transaction.payment_method}</span>
                </div>
            </div>
        </div>
    )
}

function TransactionListSkeleton() {
    return (
        <div className="space-y-6">
            {[1, 2].map(i => (
                <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <div className="space-y-1">
                        {[1, 2, 3].map(j => (
                            <Skeleton key={j} className="h-16 w-full rounded-2xl" />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}
