'use server'

import { headers } from 'next/headers'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendWhatsAppTemplateMessage } from '@/lib/whatsapp-cloud'
import { formatCurrency } from '@/lib/formatters'
import { getCurrentUser } from '@/lib/auth'
import type { OrderStatus } from '@/lib/types'
import { validateCSRF } from '@/lib/security'
import { actionError, actionSuccess, unauthorizedAction } from '@/lib/action-response'
import { revalidateWorkspaceAppPaths } from '@/lib/revalidate-workspace-path'

// ==============================================================================
// CONFIGURATION ACTIONS
// ==============================================================================

const WhatsAppSettingsSchema = z.object({
  whatsappPhoneNumberId: z.string().min(1, 'Phone Number ID é obrigatório'),
  whatsappAccessToken: z.string().min(1, 'Access Token é obrigatório'),
})

export async function saveWhatsAppCredentials(_prevState: unknown, formData: FormData) {
  console.log('[WHATSAPP] Saving credentials')
  const csrf = await validateCSRF()
  if (!csrf.valid) {
    return actionError(csrf.error || 'CSRF inválido.')
  }

  const user = await getCurrentUser()
  const tenantId = user?.tenantId
  if (!tenantId) {
    return unauthorizedAction()
  }

  try {
    const data = WhatsAppSettingsSchema.parse({
      whatsappPhoneNumberId: formData.get('whatsappPhoneNumberId'),
      whatsappAccessToken: formData.get('whatsappAccessToken'),
    })

    const supabase = await createClient()
    const db = supabase as any

    const { error } = await db.from('Settings').upsert(
      {
        tenantId: tenantId,
        whatsappPhoneNumberId: data.whatsappPhoneNumberId,
        whatsappAccessToken: data.whatsappAccessToken,
        updatedAt: new Date().toISOString(),
      } as any,
      { onConflict: 'tenantId' }
    )

    if (error) {
      console.error('[WHATSAPP] Error saving credentials:', error)
      throw error
    }

    const slug = user?.tenant?.slug
    if (slug) {
      revalidateWorkspaceAppPaths(slug, ['/configuracoes'])
    }
    return actionSuccess('Credenciais do WhatsApp salvas com sucesso!')
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return actionError(error.issues[0]?.message || 'Dados inválidos')
    }
    console.error('[WHATSAPP] Unexpected error:', error)
    return actionError('Erro ao salvar credenciais. Tente novamente.')
  }
}

export async function validateWhatsAppCredentials() {
  console.log('[WHATSAPP] Validating credentials')
  const user = await getCurrentUser()
  const tenantId = user?.tenantId
  if (!tenantId) {
    return unauthorizedAction()
  }

  try {
    await import('./limits').then(m => m.ensureCanSendTestMessage(tenantId))
  } catch (error: unknown) {
    return actionError(error instanceof Error ? error.message : 'Falha ao validar limite de teste')
  }

  const supabase = await createClient()
  const db = supabase as any
  const { data: settings, error } = await db
    .from('Settings')
    .select('whatsappPhoneNumberId, whatsappAccessToken')
    .eq('tenantId', tenantId)
    .single()

  const parsedSettings = settings as {
    whatsappPhoneNumberId?: string | null
    whatsappAccessToken?: string | null
  } | null

  if (error || !parsedSettings?.whatsappPhoneNumberId || !parsedSettings?.whatsappAccessToken) {
    return actionError('Credenciais não encontradas. Salve antes de validar.')
  }

  try {
    // Facebook Graph API v21.0 - Get Phone Number Info
    // This validates both the ID (if incorrect returns 404) and Token (if invalid returns 401)
    const url = `https://graph.facebook.com/v21.0/${parsedSettings.whatsappPhoneNumberId}?access_token=${parsedSettings.whatsappAccessToken}`

    const response = await fetch(url, { method: 'GET' })
    const data = await response.json()

    if (!response.ok) {
      console.error('[WHATSAPP] API Validation Error:', data)
      const errorMsg = data.error?.message || 'Erro desconhecido na API do WhatsApp'
      return actionError(`Falha na validação: ${errorMsg}`)
    }

    if (data.id !== parsedSettings.whatsappPhoneNumberId) {
      return actionError('ID retornado pela API não corresponde ao ID salvo.')
    }

    // Successfully validated
    const verifiedName = data.verified_name || 'Conta WhatsApp Business'

    // Update verification status in DB
    await db
      .from('Settings')
      .update({ whatsappConfigVerified: true } as any)
      .eq('tenantId', tenantId)

    // Increment usage
    await import('./limits').then(m => m.incrementWhatsAppUsage(tenantId, 'test', 1))

    return actionSuccess(`Conexão validada com sucesso! Conta: ${verifiedName}`)
  } catch (error) {
    console.error('[WHATSAPP] Connection Error:', error)
    return actionError('Erro de conexão com a API do WhatsApp. Verifique sua internet.')
  }
}

// ==============================================================================
// NOTIFICATION LOGIC (Restored)
// ==============================================================================

const MAX_ATTEMPTS = 5
const BACKOFF_MINUTES = [0, 1, 5, 15, 60]

const STATUS_TEMPLATE_KEYS: Partial<Record<OrderStatus, keyof SettingsMessageTemplates>> = {
  QUOTATION: 'msgQuotation',
  PENDING: 'msgApproved',
  PRODUCING: 'msgApproved',
  READY: 'msgReady',
  DELIVERED: 'msgFinished',
}

const STATUS_FALLBACK_MESSAGES: Partial<Record<OrderStatus, string>> = {
  PENDING: 'Olá {cliente}, seu pedido #{pedido} foi aprovado e está na fila de produção!',
  PRODUCING: 'Olá {cliente}, seu pedido #{pedido} acaba de entrar em produção! ✨',
  READY: 'Olá {cliente}, boas notícias! Seu pedido #{pedido} está pronto para retirada! ?',
  DELIVERED: 'Olá {cliente}, seu pedido #{pedido} foi entregue. Muito obrigado pela confiança! ✨',
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

type OrderNotificationItem = {
  quantity: number
  price?: number
  discount?: number
  product?: { name?: string | null } | null
}

type OrderNotificationRecord = {
  id: string
  status: string
  totalValue: number
  orderNumber?: number | null
  publicId?: string | null
  customer?: { id?: string; name?: string | null; phone?: string | null } | null
  items?: OrderNotificationItem[] | null
}

type NotificationLogRecord = {
  id: string
  attempts?: number
  lastAttemptAt?: string | null
  customerPhone?: string | null
  messageBody?: string | null
}

async function getBaseUrl() {
  const envUrl =
    process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL

  if (envUrl) {
    if (envUrl.startsWith('http')) return envUrl
    return `https://${envUrl}`
  }

  const headerList = await headers()
  const host = headerList.get('host')
  if (host) {
    const protocol = host.includes('localhost') ? 'http' : 'https'
    return `${protocol}://${host}`
  }

  return ''
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
  const db = supabase as any

  const [{ data: order, error: orderError }, { data: settings }] = await Promise.all([
    db
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
      .single(),
    db
      .from('Settings')
      .select('msgQuotation, msgApproved, msgReady, msgFinished')
      .eq('tenantId', context.tenantId)
      .single(),
  ])

  if (orderError || !order) {
    return { error: 'Pedido não encontrado.' }
  }

  return { order: order as OrderNotificationRecord, settings: settings as SettingsMessageTemplates }
}

async function buildMessage({
  order,
  settings,
  statusTo,
}: {
  order: OrderNotificationRecord
  settings: SettingsMessageTemplates
  statusTo: OrderStatus
}) {
  const { template, templateKey } = resolveTemplate(settings || {}, statusTo)
  const baseUrl = await getBaseUrl()
  const pdfLink = baseUrl ? `${baseUrl}/pedidos/${order.id}/pdf` : `/pedidos/${order.id}/pdf`
  const itemsSummary =
    order.items
      ?.map((item: OrderNotificationItem) => `${item.quantity}x ${item.product?.name}`)
      .join(', ') || ''

  const messageData = {
    cliente: order.customer?.name || 'Cliente',
    valor: formatCurrency(order.totalValue),
    itens: itemsSummary,
    pedido: order.orderNumber?.toString() || order.id.slice(0, 5),
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
  const db = supabase as any
  const now = new Date().toISOString()

  const { data: logEntry, error: insertError } = await db
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
    })
    .select('*')
    .single()

  if (insertError || !logEntry) {
    return { success: false, error: 'Erro ao registrar log de WhatsApp.' }
  }

  return { success: true, logEntry }
}

export async function enqueueOrderStatusNotification(context: OrderNotificationContext) {
  const user = await getCurrentUser()
  if (!user) return unauthorizedAction()

  const { order, settings, error } = await buildOrderNotificationPayload(context)
  if (error || !order) {
    return actionError(error || 'Pedido não encontrado.')
  }

  const { messageBody, templateKey, pdfLink } = await buildMessage({
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
      items: order.items?.map(item => ({
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
  const db = supabase as any

  if (!options.useAdmin) {
    const user = await getCurrentUser()
    if (!user) return { processed: 0, sent: 0, failed: 0 }
  }

  let query = db
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

  const eligibleLogs = ((logs || []) as NotificationLogRecord[]).filter(log =>
    shouldAttempt(log.attempts || 0, log.lastAttemptAt)
  )

  let sent = 0
  let failed = 0

  for (const log of eligibleLogs) {
    if (!log.customerPhone || !log.messageBody) {
      await db
        .from('WhatsAppNotificationLog')
        .update({
          status: 'GAVE_UP',
          errorMessage: 'Dados insuficientes para reenvio.',
          updatedAt: new Date().toISOString(),
        })
        .eq('id', log.id)
      failed += 1
      continue
    }

    const formattedPhone = formatPhoneE164(log.customerPhone)
    if (!formattedPhone) {
      await db
        .from('WhatsAppNotificationLog')
        .update({
          status: 'GAVE_UP',
          errorMessage: 'Telefone inválido para reenvio.',
          updatedAt: new Date().toISOString(),
        })
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

    await db
      .from('WhatsAppNotificationLog')
      .update({
        attempts,
        lastAttemptAt: new Date().toISOString(),
        status,
        errorMessage: sendResult.success ? null : sendResult.errorMessage,
        providerMessageId: sendResult.providerMessageId ?? null,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', log.id)

    if (sendResult.success) {
      sent += 1
    } else {
      failed += 1
    }
  }

  return { processed: eligibleLogs.length, sent, failed }
}

export async function getWhatsAppUsage() {
  const user = await getCurrentUser()
  if (!user?.tenantId) return null

  try {
    const limits = await import('./limits')
    return limits.getWhatsAppUsageSummary(user.tenantId)
  } catch (error) {
    console.error('Error fetching WhatsApp usage:', error)
    return null
  }
}

export async function sendWhatsAppMessage({
  phone,
  message,
  imageUrl,
}: {
  phone: string
  message: string
  imageUrl?: string
}) {
  const user = await getCurrentUser()
  if (!user?.tenantId) return unauthorizedAction()

  // Validar se o plano do tenant tem acesso à API WhatsApp
  const { hasWhatsAppAPI } = await import('@/features/subscription/utils')
  const { getCurrentTenantPlan } = await import('@/features/subscription/actions')

  const tenantPlan = await getCurrentTenantPlan()

  if (!tenantPlan || !hasWhatsAppAPI(tenantPlan.plan)) {
    return actionError(
      'API WhatsApp disponível apenas no plano Premium. Use o botão de notificação manual.'
    )
  }

  // Check limits (Transactional? Or is this generic?)
  // If it's called from Campaign, limits are checked there.
  // If called from elsewhere, we might strictly need to check limits.
  // But this function is just a wrapper for sending.

  // Note: We are ignoring imageUrl for now as the underlying lib helper defaults to text.
  // In a future update we should support image messages in the lib.

  const result = await sendWhatsAppTemplateMessage({
    to: formatPhoneE164(phone),
    messageBody: message,
  })

  if (!result.success) {
    return {
      ...actionError(result.errorMessage || 'Falha'),
      providerMessageId: result.providerMessageId,
    }
  }

  return {
    ...actionSuccess('Enviado'),
    providerMessageId: result.providerMessageId,
  }
}

/**
 * Gera link WhatsApp para notificação manual (botão)
 * Disponível para todos os planos (Start, Pro, Premium)
 *
 * @param orderId - ID do pedido
 * @returns Link wa.me com mensagem interpolada
 */
export async function generateWhatsAppNotifyLink(orderId: string) {
  const user = await getCurrentUser()
  if (!user?.tenantId) {
    return { success: false, error: 'Não autorizado' }
  }

  const supabase = await createClient()
  const db = supabase as any

  // 1. Buscar pedido com customer e items
  const { data: order, error: orderError } = await db
    .from('Order')
    .select(
      `
      id,
      status,
      totalValue,
      orderNumber,
      publicId,
      customer:Customer(id, name, phone),
      items:OrderItem(
        quantity,
        product:Product(name)
      )
    `
    )
    .eq('id', orderId)
    .eq('tenantId', user.tenantId)
    .single()

  if (orderError || !order) {
    return { success: false, error: 'Pedido não encontrado' }
  }

  // 2. Validar telefone do cliente
  const { isValidWhatsAppPhone } = await import('./utils')

  if (!isValidWhatsAppPhone(order.customer?.phone)) {
    return { success: false, error: 'Cliente não possui telefone válido cadastrado' }
  }

  // 3. Buscar templates de mensagem
  const { data: settings } = await db
    .from('Settings')
    .select('msgQuotation, msgApproved, msgReady, msgFinished')
    .eq('tenantId', user.tenantId)
    .single()

  const s = settings as SettingsMessageTemplates | null
  const normalizedStatus = (order.status || '').toUpperCase()

  // Prioridade de templates:
  // 1. Template específico por status (Mensagens 1 a 4)
  // 2. Fallback fixo do sistema
  let template = null

  if (normalizedStatus === 'QUOTATION') {
    template = s?.msgQuotation
  } else if (
    normalizedStatus === 'APPROVED' ||
    normalizedStatus === 'PENDING' ||
    normalizedStatus === 'PRODUCING'
  ) {
    template = s?.msgApproved
  } else if (normalizedStatus === 'READY') {
    template = s?.msgReady
  } else if (normalizedStatus === 'DELIVERED') {
    template = s?.msgFinished
  }

  if (!template) {
    template = 'Olá {cliente}, seu pedido #{numero} está {status}!'
  }

  // 4. Interpolar variáveis
  const { interpolateMessage, generateWhatsAppLink } = await import('./utils')

  const statusLabels: Record<string, string> = {
    QUOTATION: 'em orçamento',
    PENDING: 'aguardando aprovação',
    APPROVED: 'aprovado',
    PRODUCING: 'em produção',
    READY: 'pronto para retirada',
    DELIVERED: 'entregue',
    CANCELLED: 'cancelado',
  }

  // 5. Buscar o slug do tenant para o link público
  const { data: tenant } = await db.from('Tenant').select('slug').eq('id', user.tenantId).single()

  const publicId = order.publicId || order.id
  const baseUrl = await getBaseUrl()

  // Link amigável: /orcamento/[slug]/[orderNumber]?p=[publicId]
  const friendlyPath = `/orcamento/${tenant?.slug || 'atelis'}/${order.orderNumber || order.id.slice(0, 8)}?p=${publicId}`

  const publicLink = baseUrl ? `${baseUrl}${friendlyPath}` : friendlyPath

  const itemsSummary =
    order.items
      ?.map((item: OrderNotificationItem) => `${item.quantity}x ${item.product?.name}`)
      .join(', ') || ''

  let message = interpolateMessage(template, {
    cliente: order.customer?.name || 'Cliente',
    numero: order.orderNumber?.toString() || order.publicId || order.id.slice(0, 5),
    status: statusLabels[normalizedStatus] || normalizedStatus.toLowerCase(),
    valor: formatCurrency(order.totalValue),
    itens: itemsSummary,
    link_publico: publicLink,
  })

  // Garantir que o link público está na mensagem se for orçamento e o template não o incluiu
  if (normalizedStatus === 'QUOTATION' && !message.includes(publicLink)) {
    message = `${message}\n\nLink do orçamento: ${publicLink}`
  }

  // 6. Gerar link wa.me
  const link = generateWhatsAppLink(order.customer.phone, message)

  // 7. Registrar log de notificação manual
  await db.from('WhatsAppNotificationLog').insert({
    tenantId: user.tenantId,
    orderId: order.id,
    customerPhone: order.customer.phone,
    statusFrom: null,
    statusTo: order.status,
    messageType: 'MANUAL_BUTTON',
    templateKey: 'whatsappNotifyTemplate',
    messageBody: message,
    payload: {
      customerName: order.customer.name,
      orderShortId: order.orderNumber?.toString() || order.publicId || order.id.slice(0, 5),
      totalValue: order.totalValue,
      generatedLink: link,
    },
    attempts: 0,
    status: 'SENT',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  return {
    success: true,
    link,
    message,
    customerName: order.customer.name,
  }
}
