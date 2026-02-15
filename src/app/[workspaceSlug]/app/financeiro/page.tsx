import { FinanceClient } from './finance-client'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Meu Financeiro',
  description: 'Gestão simples do fluxo de caixa.',
}

export default function FinanceiroPage() {
  return <FinanceClient />
}
