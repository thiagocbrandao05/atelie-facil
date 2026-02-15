'use client'

import { PlanType } from '@/features/subscription/types'
import { hasWhatsAppAPI } from '@/features/subscription/utils'
import { WhatsAppNotifyButton } from './WhatsAppNotifyButton'
import { Sparkles } from 'lucide-react'

interface WhatsAppNotifyWrapperProps {
  orderId: string
  customerPhone?: string | null
  customerName: string
  tenantPlan: PlanType
}

/**
 * Wrapper condicional para notificações WhatsApp baseado no plano
 *
 * - Planos Free/Paid: Botão manual (wa.me)
 * - Plano Premium: Automação API (Botão manual removido conforme requisito)
 */
export function WhatsAppNotifyWrapper({
  orderId,
  customerPhone,
  customerName,
  tenantPlan,
}: WhatsAppNotifyWrapperProps) {
  const hasAPI = hasWhatsAppAPI(tenantPlan)

  if (hasAPI) {
    return (
      <div className="text-primary bg-primary/5 border-primary/10 flex items-center gap-2 rounded-full border px-2 py-1 text-[10px] font-bold">
        <Sparkles size={10} className="fill-primary/20" />
        Automação Ativa
      </div>
    )
  }

  return (
    <WhatsAppNotifyButton
      orderId={orderId}
      customerPhone={customerPhone}
      customerName={customerName}
    />
  )
}
