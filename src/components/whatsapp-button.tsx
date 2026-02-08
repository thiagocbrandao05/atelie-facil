'use client'

import { Button } from '@/components/ui/button'
import { MessageCircle } from 'lucide-react'

interface WhatsAppButtonProps {
    phone?: string | null
    customerName: string
    orderStatus: string
    orderId: string
    templates?: {
        msgQuotation?: string | null
        msgReady?: string | null
    }
}

export function WhatsAppButton({ phone, customerName, orderStatus, orderId, templates }: WhatsAppButtonProps) {
    if (!phone) return null

    const openWhatsApp = () => {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
        const budgetLink = `${baseUrl}/pedidos/${orderId}/pdf`
        let message = ''

        if (orderStatus === 'QUOTATION') {
            const template = templates?.msgQuotation || `Olá {cliente}, aqui está o orçamento dos seus produtos: {link}`
            message = template
                .replace(/\{cliente\}/g, customerName)
                .replace(/\{link\}/g, budgetLink)
                .replace(/\{valor\}/g, 'R$ ...')

            if (!message.includes(budgetLink)) {
                message += `\n\nLink do orçamento: ${budgetLink}`
            }
        } else if (orderStatus === 'READY') {
            const template = templates?.msgReady || `Olá {cliente}, seu pedido está pronto para retirada! Link do pedido: {link}`
            message = template
                .replace(/\{cliente\}/g, customerName)
                .replace(/\{link\}/g, budgetLink)
                .replace(/\{pedido\}/g, `#${orderId.slice(0, 5)}`)

            if (!message.includes(budgetLink)) {
                message += `\n\nLink do pedido: ${budgetLink}`
            }
        } else {
            const statusTexts: Record<string, string> = {
                'PENDING': 'foi confirmado e está na fila de produção!',
                'PRODUCING': 'acaba de entrar em produção!',
                'READY': 'ficou pronto! ✨ Já pode ser retirado ou entregue.',
                'DELIVERED': 'foi entregue! Esperamos que você ame. ❤️'
            }
            const statusMsg = statusTexts[orderStatus] || 'foi atualizado.'
            message = `Olá ${customerName}! Seu pedido #${orderId.slice(0, 5)} ${statusMsg}\n\nAcompanhe aqui: ${budgetLink}`
        }

        const cleanPhone = phone.replace(/\D/g, '')
        const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`
        const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`
        window.open(whatsappUrl, '_blank')
    }

    return (
        <Button
            variant="ghost"
            size="sm"
            className="text-success hover:text-success/80 hover:bg-success/10 h-8 gap-2"
            onClick={openWhatsApp}
        >
            <MessageCircle size={14} />
            <span className="text-[10px] uppercase font-bold">Notificar</span>
        </Button>
    )
}

