'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendWhatsAppTemplateMessage } from '@/lib/whatsapp-cloud'
import { formatCurrency } from '@/lib/formatters'
import { getCurrentUser } from '@/lib/auth'
import type { OrderStatus } from '@/lib/types'

const MAX_ATTEMPTS = 5
const BACKOFF_MINUTES = [0, 1, 5, 15, 60]

const STATUS_TEMPLATE_KEYS: Partial<Record<OrderStatus, keyof SettingsMessageTemplates>> = {
  QUOTATION: 'msgQuotation',
  PENDING: 'msgApproved',
  READY: 'msgReady',
  DELIVERED: 'msgFinished',
}

const STATUS_FALLBACK_MESSAGES: Partial<Record<OrderStatus, string>> = {
  PENDING: 'Olá {cliente}, seu pedido #{pedido} foi aprovado e está na fila de produção!',
  PRODUCING: 'Olá {cliente}, seu pedido #{pedido} acaba de entrar em produção! 🎨',
  READY: 'Olá {cliente}, boas notícias! Seu pedido #{pedido} está pronto para retirada! ✨',
  DELIVERED: 'Olá {cliente}, seu pedido #{pedido} foi entregue. Muito obrigado pela confiança! ❤️',
  QUOTATION: 'Olá {cliente}, aqui está o orçamento dos seus produtos.',
}

type SettingsMessageTemplates = {
  msgQuotation?: string | null
  msgApproved?: string | null
  msgReady?: string | null
  msgFinished?: string | null
}

type NotificationLogStatus = 'PENDING' | 'SENT' | 'FAILED' | 'GAVE_UP'

type OrderNotificationContext = {
  orderId: string
  tenantId: string
  statusFrom?: string | null
  statusTo: OrderStatus
}

type ProcessNotificationsOptions = {
  tenantId?: string
  limit?: number
  useAdmin?: boolean
}

function getBaseUrl() {
  const envUrl =
    process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL

  if (!envUrl) return ''
  if (envUrl.startsWith('http')) return envUrl
  return `https://${envUrl}`
}

function formatPhoneE164(phone: string) {
  const cleaned = phone.replace(/\D/g, '')
  if (!cleaned) return ''
  return cleaned.startsWith('55') ? cleaned : `55${cleaned}`
}

function resolveTemplate(settings: SettingsMessageTemplates, status: OrderStatus) {
  const templateKey = STATUS_TEMPLATE_KEYS[status]
  if (templateKey && settings[templateKey]) {
    return { template: settings[templateKey] as string, templateKey }
  }

  if (templateKey) {
    return { template: STATUS_FALLBACK_MESSAGES[status] || '', templateKey }
  }

  return { template: STATUS_FALLBACK_MESSAGES[status] || '', templateKey: undefined }
}

function applyTemplate(template: string, data: Record<string, string>) {
  return Object.entries(data).reduce((acc, [key, value]) => {
    const pattern = new RegExp(`\\{${key}\\}`, 'g')
    return acc.replace(pattern, value)
  }, template)
}

function getBackoffDelayMs(attempts: number) {
  const minutes = BACKOFF_MINUTES[Math.min(attempts, BACKOFF_MINUTES.length - 1)]
  return minutes * 60 * 1000
}

function shouldAttempt(attempts: number, lastAttemptAt?: string | null) {
  if (attempts === 0) return true
  if (!lastAttemptAt) return true
  const last = new Date(lastAttemptAt).getTime()
  const delay = getBackoffDelayMs(attempts)
  return Date.now() - last >= delay
}

async function buildOrderNotificationPayload(context: OrderNotificationContext) {
  const supabase = await createClient()

  const [{ data: order, error: orderError }, { data: settings }] = await Promise.all([
    supabase
      .from('Order')
      .select(
        `
                id, status, totalValue, dueDate, createdAt,
                customer:Customer(id, name, phone),
                items:OrderItem(
                    quantity,
                    price,
                    discount,
                    product:Product(name)
                )
            `
      )
      .eq('id', context.orderId)
      .single<any>(),
    supabase
      .from('Settings')
      .select('msgQuotation, msgApproved, msgReady, msgFinished')
      .eq('tenantId', context.tenantId)
      .single<any>(),
  ])

  if (orderError || !order) {
    return { error: 'Pedido não encontrado.' }
  }

  return { order, settings: settings as SettingsMessageTemplates }
}

function buildMessage({
  order,
  settings,
  statusTo,
}: {
  order: any
  settings: SettingsMessageTemplates
  statusTo: OrderStatus
}) {
  const { template, templateKey } = resolveTemplate(settings || {}, statusTo)
  const baseUrl = getBaseUrl()
  const pdfLink = baseUrl ? `${baseUrl}/pedidos/${order.id}/pdf` : `/pedidos/${order.id}/pdf`
  const itemsSummary =
    order.items?.map((item: any) => `${item.quantity}x ${item.product?.name}`).join(', ') || ''

  const messageData = {
    cliente: order.customer?.name || 'Cliente',
    valor: formatCurrency(order.totalValue),
    itens: itemsSummary,
    pedido: order.id.slice(0, 5),
    link: pdfLink,
  }

  let messageBody = applyTemplate(template || '', messageData)
  if (!messageBody) {
    messageBody = applyTemplate(STATUS_FALLBACK_MESSAGES[statusTo] || '', messageData)
  }

  const shouldAppendLink = statusTo === 'QUOTATION'
  const linkLabel = statusTo === 'QUOTATION' ? 'Link do orçamento' : 'Link do pedido'

  if (shouldAppendLink && !messageBody.includes(pdfLink)) {
    messageBody = `${messageBody}\n\n${linkLabel}: ${pdfLink}`
  }

  if (!shouldAppendLink && !messageBody.includes(pdfLink)) {
    messageBody = `${messageBody}\n\nAcompanhe aqui: ${pdfLink}`
  }

  return {
    messageBody,
    templateKey,
    pdfLink,
  }
}

async function insertNotificationLog(params: {
  tenantId: string
  orderId: string
  statusFrom?: string | null
  statusTo: OrderStatus
  messageType: string
  templateKey?: string
  customerPhone?: string | null
  messageBody: string
  payload: Record<string, unknown>
}) {
  const supabase = await createClient()
  const now = new Date().toISOString()

  const { data: logEntry, error: insertError } = await supabase
    .from('WhatsAppNotificationLog')
    .insert({
      tenantId: params.tenantId,
      orderId: params.orderId,
      customerPhone: params.customerPhone,
      statusFrom: params.statusFrom,
      statusTo: params.statusTo,
      messageType: params.messageType,
      templateKey: params.templateKey,
      messageBody: params.messageBody,
      payload: params.payload,
      attempts: 0,
      status: 'PENDING',
      createdAt: now,
      updatedAt: now,
    } as any)
    .select('*')
    .single<any>()

  if (insertError || !logEntry) {
    return { success: false, error: 'Erro ao registrar log de WhatsApp.' }
  }

  return { success: true, logEntry }
}

export async function enqueueOrderStatusNotification(context: OrderNotificationContext) {
  const user = await getCurrentUser()
  if (!user) return { success: false, message: 'Não autorizado.' }

  const { order, settings, error } = await buildOrderNotificationPayload(context)
  if (error || !order) {
    return { success: false, message: error || 'Pedido não encontrado.' }
  }

  const { messageBody, templateKey, pdfLink } = buildMessage({
    order,
    settings: settings || {},
    statusTo: context.statusTo,
  })

  const messageType = context.statusTo === 'QUOTATION' ? 'QUOTATION_CREATED' : 'STATUS_UPDATED'

  return insertNotificationLog({
    tenantId: context.tenantId,
    orderId: order.id,
    statusFrom: context.statusFrom,
    statusTo: context.statusTo,
    messageType,
    templateKey,
    customerPhone: order.customer?.phone,
    messageBody,
    payload: {
      customerName: order.customer?.name,
      orderShortId: order.id.slice(0, 5),
      statusFrom: context.statusFrom,
      statusTo: context.statusTo,
      totalValue: order.totalValue,
      items: order.items?.map((item: any) => ({
        name: item.product?.name,
        quantity: item.quantity,
        price: item.price,
        discount: item.discount,
      })),
      pdfLink,
    },
  })
}

export async function processPendingWhatsAppNotifications(
  options: ProcessNotificationsOptions = {}
) {
  const automationEnabled = process.env.WHATSAPP_AUTOMATION_ENABLED !== 'false'
  if (!automationEnabled) {
    return { processed: 0, sent: 0, failed: 0 }
  }

  const supabase = options.useAdmin ? createAdminClient() : await createClient()

  if (!options.useAdmin) {
    const user = await getCurrentUser()
    if (!user) return { processed: 0, sent: 0, failed: 0 }
  }

  let query = supabase
    .from('WhatsAppNotificationLog')
    .select('*')
    .in('status', ['PENDING', 'FAILED'])
    .lt('attempts', MAX_ATTEMPTS)
    .order('createdAt', { ascending: true })
    .limit(options.limit ?? 50)

  if (options.tenantId) {
    query = query.eq('tenantId', options.tenantId)
  }

  const { data: logs, error } = await query

  if (error) {
    return { processed: 0, sent: 0, failed: 0 }
  }

  const eligibleLogs = (logs || []).filter((log: any) =>
    shouldAttempt(log.attempts || 0, log.lastAttemptAt)
  )

  let sent = 0
  let failed = 0

  for (const log of eligibleLogs) {
    if (!log.customerPhone || !log.messageBody) {
      await supabase
        .from('WhatsAppNotificationLog')
        .update({
          status: 'GAVE_UP',
          errorMessage: 'Dados insuficientes para reenvio.',
          updatedAt: new Date().toISOString(),
        } as any)
        .eq('id', log.id)
      failed += 1
      continue
    }

    const formattedPhone = formatPhoneE164(log.customerPhone)
    if (!formattedPhone) {
      await supabase
        .from('WhatsAppNotificationLog')
        .update({
          status: 'GAVE_UP',
          errorMessage: 'Telefone inválido para reenvio.',
          updatedAt: new Date().toISOString(),
        } as any)
        .eq('id', log.id)
      failed += 1
      continue
    }

    const sendResult = await sendWhatsAppTemplateMessage({
      to: formattedPhone,
      messageBody: log.messageBody,
    })

    const attempts = (log.attempts ?? 0) + 1
    const status: NotificationLogStatus = sendResult.success
      ? 'SENT'
      : attempts >= MAX_ATTEMPTS
        ? 'GAVE_UP'
        : 'FAILED'

    await supabase
      .from('WhatsAppNotificationLog')
      .update({
        attempts,
        lastAttemptAt: new Date().toISOString(),
        status,
        errorMessage: sendResult.success ? null : sendResult.errorMessage,
        providerMessageId: sendResult.providerMessageId ?? null,
        updatedAt: new Date().toISOString(),
      } as any)
      .eq('id', log.id)

    if (sendResult.success) {
      sent += 1
    } else {
      failed += 1
    }
  }

  return { processed: eligibleLogs.length, sent, failed }
}
