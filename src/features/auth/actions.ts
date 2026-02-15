'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { rateLimit, rateLimitPresets } from '@/lib/rate-limiter'
import { getClientIP } from '@/lib/security'
import { logError, logWarning, logInfo } from '@/lib/logger'

function isNextRedirectError(error: unknown): error is Error {
  return error instanceof Error && error.message === 'NEXT_REDIRECT'
}

export async function authenticate(prevState: string | undefined, formData: FormData) {
  try {
    const clientIP = await getClientIP()
    const email = formData.get('email') as string
    const password = formData.get('password') as string

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
    const name = formData.get('name') as string
    const storeName = formData.get('storeName') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!name || !storeName || !email || !password) {
      return 'Please fill in all fields.'
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
    const slug =
      storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-') +
      '-' +
      Math.random().toString(36).substring(2, 6)

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
