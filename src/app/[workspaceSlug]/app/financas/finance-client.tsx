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
        <div className="flex items-center justify-between mb-6">
            <div>
                <h1 className="text-2xl font-black tracking-tight text-foreground">Financeiro</h1>
                <p className="text-sm text-muted-foreground font-medium">Fluxo de Caixa</p>
            </div>
            <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg">
                <Button variant="ghost" size="icon" onClick={() => changeMonth('prev')} className="h-8 w-8 hover:bg-background shadow-none">
                    <ChevronLeft size={16} />
                </Button>
                <div className="px-2 min-w-[100px] text-center">
                    <span className="text-xs font-black uppercase tracking-wider block">
                        {format(date, 'MMMM', { locale: ptBR })}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-bold block leading-none">
                        {currentYear}
                    </span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => changeMonth('next')} className="h-8 w-8 hover:bg-background shadow-none">
                    <ChevronRight size={16} />
                </Button>
            </div>
        </div>
    )
}

function FinanceContent() {
    return (
        <div className="space-y-6 pb-24 md:pb-10 relative">
            <Header />
            <FinancialDashboardCard />

            <div className="flex items-center justify-between mt-8 mb-4">
                <h3 className="text-lg font-bold tracking-tight">Extrato</h3>
                {/* Future: Filter button here */}
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
