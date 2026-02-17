'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { rateLimit, rateLimitPresets } from '@/lib/rate-limiter'
import { getClientIP, validateCSRF } from '@/lib/security'
import { logError, logWarning, logInfo } from '@/lib/logger'
import { actionError, actionSuccess } from '@/lib/action-response'
import { sendEmailWithResend } from '@/lib/resend'
import { isValidEmail, sanitizeEmail } from '@/lib/validators'
import type { ActionResponse } from '@/lib/types'

const MIN_PASSWORD_LENGTH = 8
const PASSWORD_RESET_GENERIC_MESSAGE =
  'Se o e-mail estiver cadastrado, voce recebera um link para redefinir a senha.'
const PASSWORD_RESET_FAILURE_MESSAGE =
  'Nao foi possivel enviar o e-mail de recuperacao agora. Tente novamente em alguns minutos.'
const PASSWORD_RESET_RATE_LIMIT = { maxRequests: 3, windowMs: 15 * 60 * 1000 }

function isNextRedirectError(error: unknown): error is Error {
  return error instanceof Error && error.message === 'NEXT_REDIRECT'
}

function normalizeBaseUrl(rawUrl: string | null | undefined): string | null {
  if (!rawUrl) return null

  try {
    return new URL(rawUrl.trim()).origin
  } catch {
    return null
  }
}

async function getAppBaseUrl() {
  const envUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_APP_URL)
  if (envUrl) return envUrl

  const requestHeaders = await headers()
  const originFromHeader = normalizeBaseUrl(requestHeaders.get('origin'))
  if (originFromHeader) return originFromHeader

  const host = requestHeaders.get('host')
  if (host) {
    const protocol = /localhost|127\.0\.0\.1/.test(host) ? 'http' : 'https'
    const hostUrl = normalizeBaseUrl(`${protocol}://${host}`)
    if (hostUrl) return hostUrl
  }

  return 'http://localhost:3000'
}

function buildPasswordResetEmail(resetLink: string) {
  const safeResetLink = resetLink.replace(/"/g, '&quot;')
  const subject = 'Redefina sua senha no Atelie Facil'
  const text = [
    'Recebemos uma solicitacao para redefinir sua senha no Atelie Facil.',
    `Use este link para continuar: ${resetLink}`,
    'Se voce nao solicitou esta alteracao, pode ignorar este e-mail.',
  ].join('\n')
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #0f172a;">
      <h1 style="font-size: 20px; margin-bottom: 16px;">Redefinicao de senha</h1>
      <p style="margin-bottom: 16px;">Recebemos uma solicitacao para redefinir sua senha no Atelie Facil.</p>
      <p style="margin-bottom: 24px;">Clique no botao abaixo para continuar:</p>
      <a
        href="${safeResetLink}"
        style="display: inline-block; background: #0f172a; color: #ffffff; text-decoration: none; padding: 12px 18px; border-radius: 10px; font-weight: 600;"
      >
        Redefinir senha
      </a>
      <p style="margin-top: 24px; font-size: 14px; color: #475569;">
        Se voce nao solicitou esta alteracao, ignore este e-mail.
      </p>
    </div>
  `.trim()

  return { subject, text, html }
}

export async function requestPasswordReset(
  _prevState: ActionResponse,
  formData: FormData
): Promise<ActionResponse> {
  try {
    const csrf = await validateCSRF()
    if (!csrf.valid) {
      await logWarning('Password reset blocked by CSRF validation', {
        reason: csrf.error || 'unknown',
      })
      return actionError(PASSWORD_RESET_FAILURE_MESSAGE)
    }

    const emailValue = formData.get('email')
    const email = typeof emailValue === 'string' ? sanitizeEmail(emailValue) : ''

    if (!email || !isValidEmail(email)) {
      return actionError('Informe um e-mail valido.')
    }

    const clientIP = await getClientIP()
    const limiter = await rateLimit(
      `password-reset:${clientIP}:${email}`,
      PASSWORD_RESET_RATE_LIMIT
    )
    if (!limiter.success) {
      return actionError('Muitas tentativas. Tente novamente em alguns minutos.')
    }

    const supabaseAdmin = createAdminClient()
    const appBaseUrl = await getAppBaseUrl()
    const redirectTo = `${appBaseUrl}/login`

    const { data: recoveryData, error: recoveryError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: {
          redirectTo,
        },
      })

    if (recoveryError) {
      const errorMessage = recoveryError.message.toLowerCase()
      if (errorMessage.includes('user not found')) {
        return actionSuccess(PASSWORD_RESET_GENERIC_MESSAGE)
      }

      await logWarning('Password reset link generation failed', {
        email,
        error: recoveryError.message,
      })
      return actionError(PASSWORD_RESET_FAILURE_MESSAGE)
    }

    const resetLink = recoveryData.properties?.action_link
    if (!resetLink) {
      await logWarning('Password reset link was not returned by Supabase', { email })
      return actionError(PASSWORD_RESET_FAILURE_MESSAGE)
    }

    const emailContent = buildPasswordResetEmail(resetLink)
    const sendResult = await sendEmailWithResend({
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    })

    if (!sendResult.success) {
      await logError(new Error(sendResult.error), {
        action: 'requestPasswordReset.sendEmailWithResend',
        data: { email },
      })
      return actionError(PASSWORD_RESET_FAILURE_MESSAGE)
    }

    await logInfo('Password reset email sent', { email, ip: clientIP })
    return actionSuccess(PASSWORD_RESET_GENERIC_MESSAGE)
  } catch (error) {
    const parsedError = error instanceof Error ? error : new Error('Unknown password reset error')
    await logError(parsedError, { action: 'requestPasswordReset' })
    return actionError(PASSWORD_RESET_FAILURE_MESSAGE)
  }
}

export async function authenticate(prevState: string | undefined, formData: FormData) {
  try {
    const clientIP = await getClientIP()
    const emailRaw = formData.get('email')
    const passwordRaw = formData.get('password')
    const email = typeof emailRaw === 'string' ? emailRaw.trim().toLowerCase() : ''
    const password = typeof passwordRaw === 'string' ? passwordRaw : ''

    if (!email || !password) {
      return 'Invalid credentials.'
    }

    // Rate limit
    const rateLimitResult = await rateLimit(`login:${clientIP}`, rateLimitPresets.login)

    if (!rateLimitResult.success) {
      return 'Too many login attempts. Please try again later.'
    }

    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      logWarning('Login failed', { email, error: error.message })
      return 'Invalid credentials.'
    }

    const { data: userData } = await supabase
      .from('User')
      .select('tenant:Tenant(slug)')
      .eq('id', (await supabase.auth.getUser()).data.user?.id || '')
      .single()

    const userRecord = userData as { tenant?: { slug?: string | null } | null } | null
    const slug = userRecord?.tenant?.slug || 'atelis'

    logInfo('Successful login', { email, ip: clientIP, slug })
    redirect('/app/dashboard')
  } catch (error) {
    if (isNextRedirectError(error)) throw error
    logError(error as Error, { action: 'authenticate' })
    return 'Something went wrong.'
  }
}

export async function register(prevState: string | undefined, formData: FormData) {
  try {
    const nameRaw = formData.get('name')
    const storeNameRaw = formData.get('storeName')
    const emailRaw = formData.get('email')
    const passwordRaw = formData.get('password')
    const name = typeof nameRaw === 'string' ? nameRaw.trim() : ''
    const storeName = typeof storeNameRaw === 'string' ? storeNameRaw.trim() : ''
    const email = typeof emailRaw === 'string' ? emailRaw.trim().toLowerCase() : ''
    const password = typeof passwordRaw === 'string' ? passwordRaw : ''

    if (!name || !storeName || !email || !password) {
      return 'Please fill in all fields.'
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
    }

    const supabaseAdmin = createAdminClient()
    const supabase = await createClient()

    // 1. Create Auth User
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) {
      if (authError.message.includes('already registered')) {
        return 'Email already in use.'
      }
      return authError.message
    }

    if (!authData.user) {
      return 'Registration failed.'
    }

    // 2. Create Tenant & User Data (using Admin client to bypass RLS)
    const slugBase = storeName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
    const slug = `${slugBase || 'atelis'}-${Math.random().toString(36).substring(2, 6)}`

    // Create Tenant
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('Tenant')
      .insert({
        name: storeName,
        slug: slug,
        plan: 'free',
        status: 'active',
      })
      .select()
      .single()

    if (tenantError) {
      // Rollback auth user if possible (requires admin delete) or just fail
      // real production would need better rollback or sagas
      console.error('Tenant creation failed:', tenantError)
      return 'Failed to set up account.'
    }

    // Create User Profile
    const { error: userError } = await supabaseAdmin.from('User').insert({
      id: authData.user.id, // Link to Auth User
      tenantId: tenant.id,
      name: name,
      email: email,
      role: 'admin',
      // password hash is not stored in our table anymore, handled by Supabase Auth
    })

    if (userError) {
      console.error('User profile creation failed:', userError)
      return 'Failed to create user profile.'
    }

    // Create Settings
    await supabaseAdmin.from('Settings').insert({
      tenantId: tenant.id,
      storeName: storeName,
    })

    // 3. Auto-login after registration (if email confirmation is not required)
    // For now, we attempt login, if it fails (e.g. unconfirmed), we ask user to check email
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      // Maybe email confirmation is required
      return 'Account created! Please check your email to confirm.'
    }

    const redirectUrl = '/app/dashboard'
    redirect(redirectUrl)
  } catch (error) {
    if (isNextRedirectError(error)) throw error
    console.error('Registration error:', error)
    return 'Something went wrong.'
  }
}
