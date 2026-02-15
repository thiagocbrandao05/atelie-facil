'use client'

import { FinancialProvider, useFinancials } from '@/features/financials/use-financials'
import { FinancialDashboardCard } from '@/components/financial/dashboard-card'
import { TransactionList } from '@/components/financial/transaction-list'
import { QuickAddTransactionModal } from '@/components/financial/quick-add-modal'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

function Header() {
  const { currentMonth, currentYear, changeMonth } = useFinancials()
  const date = new Date(currentYear, currentMonth - 1)

  return (
    <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-foreground text-2xl font-black tracking-tight sm:text-3xl">
          Financeiro
        </h1>
        <p className="text-muted-foreground text-sm font-medium">Fluxo de caixa</p>
      </div>
      <div className="bg-muted/50 flex w-full items-center justify-between gap-1 rounded-lg p-1 sm:w-auto sm:justify-start">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => changeMonth('prev')}
          className="hover:bg-background h-10 w-10 shadow-none"
          aria-label="Mês anterior"
        >
          <ChevronLeft size={16} />
        </Button>
        <div className="min-w-[108px] px-2 text-center">
          <span className="block text-xs font-black tracking-wider uppercase">
            {format(date, 'MMMM', { locale: ptBR })}
          </span>
          <span className="text-muted-foreground block text-[10px] leading-none font-bold">
            {currentYear}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => changeMonth('next')}
          className="hover:bg-background h-10 w-10 shadow-none"
          aria-label="Próximo mês"
        >
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  )
}

function FinanceContent() {
  const { error, refresh } = useFinancials()

  return (
    <div className="relative space-y-5 pb-24 md:space-y-6 md:pb-10">
      <Header />
      {error ? (
        <div
          role="alert"
          aria-live="assertive"
          className="border-destructive/30 bg-destructive/5 rounded-xl border p-3 text-sm"
        >
          <p className="text-destructive font-semibold">Não foi possível carregar o financeiro.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refresh()}
            className="mt-2 min-h-10"
          >
            Tentar novamente
          </Button>
        </div>
      ) : null}
      <FinancialDashboardCard />

      <div className="mt-7 mb-3 flex items-center justify-between sm:mt-8 sm:mb-4">
        <h3 className="text-lg font-bold tracking-tight">Extrato</h3>
      </div>

      <TransactionList />
      <QuickAddTransactionModal />
    </div>
  )
}

export function FinanceClient() {
  return (
    <FinancialProvider>
      <FinanceContent />
    </FinancialProvider>
  )
}
