'use server'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getAdminClient } from '@agency/database/admin'
import { createUserForTenant, createSupabaseServerClient } from '@agency/database'

export interface SignupResult {
  error?: string
}

/**
 * Server-only signup: creates user via createUserForTenant, then signs in
 * with server Supabase client and redirects. Never returns auth_email to client.
 */
export async function signupAction(
  _prev: SignupResult | null,
  formData: FormData
): Promise<SignupResult> {
  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const slug = process.env.NEXT_PUBLIC_TENANT_SLUG
  if (!slug) {
    return { error: 'Tenant not configured' }
  }

  const admin = getAdminClient()
  const { data: tenant } = await admin
    .from('tenants')
    .select('id')
    .eq('slug', slug)
    .single()

  if (!tenant) {
    return { error: 'Tenant not found' }
  }

  let result: { authEmail: string }
  try {
    result = await createUserForTenant({
      email,
      password,
      tenantId: tenant.id,
      emailConfirm: true,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Signup failed'
    return { error: message }
  }

  const cookieStore = await cookies()
  const supabase = createSupabaseServerClient({
    getAll: () => cookieStore.getAll().map((c) => ({ name: c.name, value: c.value })),
    setAll: (cookiesToSet) => {
      cookiesToSet.forEach(({ name, value, options }) =>
        cookieStore.set(name, value, options)
      )
    },
  })

  const { error } = await supabase.auth.signInWithPassword({
    email: result.authEmail,
    password,
  })

  if (error) {
    return { error: 'Account created but sign-in failed. Please try logging in.' }
  }

  redirect('/dashboard')
}
