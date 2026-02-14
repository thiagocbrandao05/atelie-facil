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

/**
 * Interpola variáveis em um template de mensagem
 * 
 * @param template - Template com variáveis no formato {variavel}
 * @param vars - Objeto com valores das variáveis
 * @returns Mensagem com variáveis substituídas
 */
export function interpolateMessage(
    template: string,
    vars: WhatsAppTemplateVars
): string {
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

/**
 * Gera link WhatsApp (wa.me) com telefone e mensagem pré-preenchida
 * 
 * @param phone - Telefone do destinatário (formato livre)
 * @param message - Mensagem a ser enviada
 * @returns URL completa do WhatsApp
 * 
 * @example
 * generateWhatsAppLink("11999887766", "Olá! Tudo bem?")
 * // => "https://wa.me/5511999887766?text=Ol%C3%A1%21%20Tudo%20bem%3F"
 */
export function generateWhatsAppLink(phone: string, message: string): string {
    // Remove todos os caracteres não numéricos
    const cleanPhone = phone.replace(/\D/g, '')

    // Garante código do país (Brasil = 55)
    const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`

    // Encode mensagem para URL
    const encodedMessage = encodeURIComponent(message)

    return `https://wa.me/${fullPhone}?text=${encodedMessage}`
}

/**
 * Valida se um telefone está em formato válido para WhatsApp
 * 
 * @param phone - Telefone a ser validado
 * @returns true se telefone é válido
 */
export function isValidWhatsAppPhone(phone: string | null | undefined): boolean {
    if (!phone) return false

    const cleaned = phone.replace(/\D/g, '')

    // Brasil: 10 ou 11 dígitos (com ou sem código do país)
    // Com código: 5511999887766 (13 dígitos)
    // Sem código: 11999887766 (10-11 dígitos)
    return cleaned.length >= 10 && cleaned.length <= 13
}

/**
 * Formata telefone para exibição amigável
 * 
 * @param phone - Telefone bruto
 * @returns Telefone formatado (55) 11 99988-7766
 */
export function formatWhatsAppPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '')

    if (cleaned.length === 13) {
        // +55 11 99988-7766
        return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`
    }

    if (cleaned.length === 11) {
        // (11) 99988-7766
        return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
    }

    return phone
}
