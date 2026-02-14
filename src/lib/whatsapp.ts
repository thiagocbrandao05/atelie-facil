/**
 * WhatsApp integration utilities
 */

import { formatCurrency, formatDate } from './formatters'
import type { OrderWithDetails } from './types'

/**
 * Generate WhatsApp message for order quotation
 */
export function generateQuotationMessage(order: OrderWithDetails): string {
  const lines = [
    `*Orçamento #${order.id.substring(0, 8)}*`,
    '',
    `Olá ${order.customer.name}! 👋`,
    '',
    'Segue o orçamento solicitado:',
    '',
    '*Itens:*',
  ]

  order.items.forEach((item, index) => {
    lines.push(
      `${index + 1}. ${item.product.name}`,
      `   Quantidade: ${item.quantity}`,
      `   Valor unitário: ${formatCurrency(item.price)}`,
      `   Subtotal: ${formatCurrency(item.price * item.quantity)}`,
      ''
    )
  })

  lines.push(
    `*Valor Total: ${formatCurrency(order.totalValue)}*`,
    '',
    `📅 Prazo de entrega: ${formatDate(order.dueDate)}`,
    '',
    'Para confirmar o pedido, responda esta mensagem!',
    '',
    '✨ _Atelis_'
  )

  return lines.join('\n')
}

/**
 * Generate WhatsApp message for order confirmation
 */
export function generateOrderConfirmationMessage(order: OrderWithDetails): string {
  return [
    `*Pedido Confirmado! ✅*`,
    '',
    `Olá ${order.customer.name}!`,
    '',
    `Seu pedido #${order.id.substring(0, 8)} foi confirmado e já está em produção! 🎨`,
    '',
    `*Resumo:*`,
    `• Itens: ${order.items.length}`,
    `• Valor: ${formatCurrency(order.totalValue)}`,
    `• Entrega prevista: ${formatDate(order.dueDate)}`,
    '',
    'Você receberá atualizações sobre o andamento do seu pedido.',
    '',
    '✨ _Atelis_',
  ].join('\n')
}

/**
 * Generate WhatsApp message for order ready notification
 */
export function generateOrderReadyMessage(order: OrderWithDetails): string {
  return [
    `*Pedido Pronto! 🎉*`,
    '',
    `Olá ${order.customer.name}!`,
    '',
    `Seu pedido #${order.id.substring(0, 8)} está pronto para retirada! ✨`,
    '',
    `*Detalhes:*`,
    `• Valor: ${formatCurrency(order.totalValue)}`,
    `• Itens: ${order.items.map(i => i.product.name).join(', ')}`,
    '',
    'Aguardamos você para a retirada!',
    '',
    '✨ _Atelis_',
  ].join('\n')
}

/**
 * Generate WhatsApp message for low stock alert
 */
export function generateLowStockMessage(
  materialName: string,
  currentQty: number,
  unit: string
): string {
  return [
    `*Alerta de Estoque Baixo! ⚠️*`,
    '',
    `Material: *${materialName}*`,
    `Quantidade atual: ${currentQty} ${unit}`,
    '',
    'É recomendado fazer a reposição em breve.',
    '',
    '✨ _Atelis_',
  ].join('\n')
}

/**
 * Open WhatsApp with pre-filled message
 */
export function sendWhatsAppMessage(phone: string, message: string): void {
  // Remove non-numeric characters
  const cleanPhone = phone.replace(/\D/g, '')

  // Encode message for URL
  const encodedMessage = encodeURIComponent(message)

  // WhatsApp Web URL
  const url = `https://wa.me/55${cleanPhone}?text=${encodedMessage}`

  // Open in new window
  window.open(url, '_blank')
}

/**
 * Format phone number for WhatsApp (Brazil)
 */
export function formatPhoneForWhatsApp(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')

  // Add country code if not present
  if (!cleaned.startsWith('55')) {
    return `55${cleaned}`
  }

  return cleaned
}

/**
 * Validate Brazilian phone number
 */
export function isValidBrazilianPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '')

  // Should have 10 or 11 digits (with area code)
  // Or 12-13 digits (with country code)
  return (
    cleaned.length === 10 ||
    cleaned.length === 11 ||
    (cleaned.startsWith('55') && (cleaned.length === 12 || cleaned.length === 13))
  )
}
