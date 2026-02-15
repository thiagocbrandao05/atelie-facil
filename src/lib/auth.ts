import { createClient } from '@/lib/supabase/server'

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
