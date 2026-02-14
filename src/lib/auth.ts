import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

import { User } from '@/lib/types'

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    console.log('getCurrentUser: No auth user found from supabase.auth.getUser()')
    return null
  }

  const { data: dbUser, error } = await supabase
    .from('User')
    .select('*, role, tenant:Tenant(*)')
    .eq('id', user.id)
    .single()

  if (error || !dbUser) {
    console.error('getCurrentUser: User found in Auth but not in DB', error)
    return null
  }

  return dbUser as unknown as User
}

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  const { data: userData } = await supabase
    .from('User')
    .select('tenant:Tenant(slug)')
    .eq('id', (await supabase.auth.getUser()).data.user?.id || '')
    .single()

  const slug = (userData as any)?.tenant?.slug || 'atelis'
  redirect(`/${slug}/app/dashboard`)
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
