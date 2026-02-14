'use client'

import { useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { generateWhatsAppNotifyLink } from '../actions'

interface WhatsAppNotifyButtonProps {
    orderId: string
    customerPhone?: string | null
    customerName: string
    variant?: 'default' | 'outline' | 'ghost'
    size?: 'default' | 'sm' | 'lg'
}

/**
 * Botão para notificação manual via WhatsApp (wa.me)
 * Disponível para todos os planos (Start, Pro, Premium)
 * 
 * Abre WhatsApp Web/App com mensagem pré-configurada
 */
export function WhatsAppNotifyButton({
    orderId,
    customerPhone,
    customerName,
    variant = 'default',
    size = 'default',
}: WhatsAppNotifyButtonProps) {
    const [loading, setLoading] = useState(false)

    async function handleNotify() {
        // Validação rápida de telefone
        if (!customerPhone) {
            toast.error('Cliente não possui telefone cadastrado')
            return
        }

        setLoading(true)

        try {
            const result = await generateWhatsAppNotifyLink(orderId)

            if (!result.success || !result.link) {
                toast.error(result.error || 'Erro ao gerar link do WhatsApp')
                return
            }

            // Abrir WhatsApp em nova aba
            window.open(result.link, '_blank')

            toast.success(`WhatsApp aberto para ${customerName}`, {
                description: 'A mensagem foi pré-preenchida. Basta enviar!',
            })
        } catch (error) {
            console.error('Error generating WhatsApp link:', error)
            toast.error('Erro ao preparar notificação')
        } finally {
            setLoading(false)
        }
    }

    const isDisabled = loading || !customerPhone

    return (
        <Button
            onClick={handleNotify}
            disabled={isDisabled}
            variant={variant}
            size={size}
            className="gap-2"
        >
            <MessageCircle className="h-4 w-4" />
            {loading ? 'Preparando...' : 'Notificar via WhatsApp'}
        </Button>
    )
}
