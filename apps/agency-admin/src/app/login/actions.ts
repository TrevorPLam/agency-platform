'use server'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@agency/database'
import { validateRedirectUrl } from '@agency/security'

export interface LoginResult {
  error?: string
}

export async function loginAction(
  _prev: LoginResult | null,
  formData: FormData
): Promise<LoginResult> {
  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string
  const rawRedirectTo = (formData.get('redirect') as string) || '/'
  
  // Validate redirect URL to prevent open-redirect attacks
  const redirectTo = validateRedirectUrl(rawRedirectTo, '/')

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const cookieStore = await cookies()
  const supabase = createSupabaseServerClient({
    getAll: () => cookieStore.getAll().map((c) => ({ name: c.name, value: c.value })),
    setAll: (cookiesToSet) => {
      cookiesToSet.forEach(({ name, value, options }) => {
        if (options) {
          cookieStore.set(name, value, options)
          return
        }

        cookieStore.set(name, value)
      })
    },
  })

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: 'Invalid email or password' }
  }

  redirect(redirectTo)
}
