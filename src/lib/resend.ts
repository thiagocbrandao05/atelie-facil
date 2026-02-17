import 'server-only'

const RESEND_API_URL = 'https://api.resend.com/emails'
const DEFAULT_FROM_EMAIL = 'Atelie Facil <onboarding@resend.dev>'

export interface SendEmailInput {
  to: string
  subject: string
  html: string
  text: string
}

export type SendEmailResult = { success: true; id?: string } | { success: false; error: string }

export async function sendEmailWithResend(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return {
      success: false,
      error: 'Missing RESEND_API_KEY.',
    }
  }

  const from = process.env.RESEND_FROM_EMAIL || DEFAULT_FROM_EMAIL

  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
      cache: 'no-store',
    })

    if (!response.ok) {
      const errorBody = await response.text()
      return {
        success: false,
        error: `Resend request failed (${response.status}): ${errorBody.slice(0, 300)}`,
      }
    }

    const payload = (await response.json()) as { id?: string }
    return {
      success: true,
      id: payload.id,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown Resend error.',
    }
  }
}
