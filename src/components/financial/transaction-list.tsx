'use client'

import { useFinancials, Transaction } from '@/features/financials/use-financials'
import { format, isToday, isYesterday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  ShoppingBag,
  Scissors,
  Package,
  Gift,
  Megaphone,
  Monitor,
  FileText,
  User,
  HelpCircle,
  type LucideIcon,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

const iconMap: Record<string, LucideIcon> = {
  'shopping-bag': ShoppingBag,
  scissors: Scissors,
  package: Package,
  gift: Gift,
  megaphone: Megaphone,
  monitor: Monitor,
  'file-text': FileText,
  user: User,
  'help-circle': HelpCircle,
}

export function TransactionList() {
  const { transactions, isLoading } = useFinancials()

  if (isLoading) {
    return <TransactionListSkeleton />
  }

  if (transactions.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center px-4 py-12 text-center opacity-70"
        role="status"
        aria-live="polite"
      >
        <Calendar className="text-muted-foreground mb-4 h-12 w-12 opacity-50" />
        <p className="text-lg font-medium">Nenhum lançamento neste mês</p>
        <p className="text-muted-foreground text-sm">
          Toque no botão + para adicionar seu primeiro lançamento.
        </p>
      </div>
    )
  }

  const groupedTransactions = transactions.reduce(
    (groups, transaction) => {
      const date = transaction.date
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(transaction)
      return groups
    },
    {} as Record<string, Transaction[]>
  )

  const sortedDates = Object.keys(groupedTransactions).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  )

  return (
    <div className="space-y-5 pb-20 sm:space-y-6">
      {sortedDates.map(date => (
        <div key={date} className="space-y-2">
          <h3 className="bg-background/95 text-muted-foreground sticky top-0 z-10 ml-1 py-2 text-xs font-bold tracking-wider uppercase backdrop-blur">
            {isToday(new Date(date))
              ? 'Hoje'
              : isYesterday(new Date(date))
                ? 'Ontem'
                : format(new Date(date), "dd 'de' MMMM", { locale: ptBR })}
          </h3>
          <div className="border-border/40 dark:bg-card/50 overflow-hidden rounded-2xl border bg-white shadow-sm">
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

function TransactionItem({ transaction, isLast }: { transaction: Transaction; isLast: boolean }) {
  const Icon = iconMap[transaction.category?.icon || 'help-circle'] || HelpCircle
  const isIncome = transaction.type === 'IN'

  return (
    <div
      className={`hover:bg-muted/30 flex min-h-[68px] items-center justify-between p-3.5 transition-colors sm:p-4 ${
        !isLast ? 'border-border/20 border-b' : ''
      }`}
    >
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        <div
          className={`rounded-full p-2.5 ${
            isIncome
              ? 'bg-emerald-100/50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'
              : 'bg-red-100/50 text-red-600 dark:bg-red-900/40 dark:text-red-400'
          }`}
        >
          <Icon size={18} strokeWidth={2.5} />
        </div>
        <div className="min-w-0 space-y-0.5">
          <p className="text-foreground/90 truncate text-sm leading-none font-bold">
            {transaction.description || transaction.category?.name || 'Sem descrição'}
          </p>
          <p className="text-muted-foreground/70 text-[10px] font-bold tracking-wider uppercase">
            {transaction.category?.name || 'Geral'}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p
          className={`text-sm font-black tracking-tight sm:text-base ${
            isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'
          }`}
        >
          {isIncome ? '+' : '-'}{' '}
          {transaction.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </p>
        <div className="mt-0.5 flex items-center justify-end gap-1 opacity-40">
          {isIncome ? <ArrowUpRight size={10} /> : <ArrowDownLeft size={10} />}
          <span className="text-[9px] font-bold uppercase">
            {transaction.payment_method === 'credit' ? 'Crédito' : transaction.payment_method}
          </span>
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
