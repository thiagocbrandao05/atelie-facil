/**
 * WhatsApp Link Generation and Message Interpolation Utilities
 */

export interface WhatsAppTemplateVars {
  cliente: string
  numero: string
  status: string
  valor: string
  itens?: string
  link_publico?: string
}

export function interpolateMessage(template: string, vars: WhatsAppTemplateVars): string {
  let message = template
    .replace(/{cliente}/g, vars.cliente)
    .replace(/{numero}/g, vars.numero)
    .replace(/{status}/g, vars.status)
    .replace(/{valor}/g, vars.valor)

  if (vars.itens) {
    message = message.replace(/{itens}/g, vars.itens)
  }

  if (vars.link_publico) {
    message = message.replace(/{link_publico}/g, vars.link_publico)
  }

  return message
}

export function generateWhatsAppLink(phone: string, message: string): string {
  const cleanPhone = phone.replace(/\D/g, '')
  const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`
  const encodedMessage = encodeURIComponent(message)

  return `https://wa.me/${fullPhone}?text=${encodedMessage}`
}

export function isValidWhatsAppPhone(phone: string | null | undefined): boolean {
  if (!phone) return false

  const cleaned = phone.replace(/\D/g, '')
  return cleaned.length >= 10 && cleaned.length <= 13
}
