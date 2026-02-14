import { FinanceClient } from './finance-client'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Finanças Invisíveis',
    description: 'Gestão financeira simples para seu ateliê.',
}

export default function FinancasPage() {
    return <FinanceClient />
}
