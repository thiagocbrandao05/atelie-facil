import 'server-only'

type SendResult = {
  success: boolean
  statusCode: number
  responseBody: unknown
  errorMessage?: string
  providerMessageId?: string | null
}

type SendTemplateMessageParams = {
  to: string
  messageBody: string
  templateName?: string
  languageCode?: string
  components?: unknown[]
}

function getWhatsAppConfig() {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
  const apiVersion = process.env.WHATSAPP_API_VERSION || 'v21.0'
  const baseUrl = process.env.WHATSAPP_BASE_URL || 'https://graph.facebook.com'

  return {
    phoneNumberId,
    accessToken,
    apiVersion,
    baseUrl,
  }
}

function extractProviderMessageId(responseBody: unknown) {
  if (!responseBody || typeof responseBody !== 'object') return null
  const maybeMessages = (responseBody as { messages?: unknown }).messages
  if (!Array.isArray(maybeMessages) || maybeMessages.length === 0) return null
  const firstMessage = maybeMessages[0]
  if (!firstMessage || typeof firstMessage !== 'object') return null
  return (firstMessage as { id?: string }).id || null
}

export async function sendWhatsAppTemplateMessage({
  to,
  messageBody,
  templateName,
  languageCode = 'pt_BR',
  components,
}: SendTemplateMessageParams): Promise<SendResult> {
  const { phoneNumberId, accessToken, apiVersion, baseUrl } = getWhatsAppConfig()

  if (!phoneNumberId || !accessToken) {
    return {
      success: false,
      statusCode: 500,
      responseBody: null,
      errorMessage: 'WhatsApp Cloud API não configurada.',
      providerMessageId: null,
    }
  }

  const endpoint = `${baseUrl}/${apiVersion}/${phoneNumberId}/messages`

  const payload: Record<string, unknown> = {
    messaging_product: 'whatsapp',
    to,
  }

  if (templateName) {
    payload.type = 'template'
    payload.template = {
      name: templateName,
      language: { code: languageCode },
      ...(components ? { components } : {}),
    }
  } else {
    payload.type = 'text'
    payload.text = { body: messageBody }
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const responseBody = await response.json().catch(() => null)

    if (!response.ok) {
      return {
        success: false,
        statusCode: response.status,
        responseBody,
        errorMessage: 'Falha ao enviar mensagem via WhatsApp Cloud API.',
        providerMessageId: extractProviderMessageId(responseBody),
      }
    }

    return {
      success: true,
      statusCode: response.status,
      responseBody,
      providerMessageId: extractProviderMessageId(responseBody),
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro inesperado ao enviar mensagem.'
    return {
      success: false,
      statusCode: 500,
      responseBody: null,
      errorMessage: message,
      providerMessageId: null,
    }
  }
}

export type { SendResult, SendTemplateMessageParams }
