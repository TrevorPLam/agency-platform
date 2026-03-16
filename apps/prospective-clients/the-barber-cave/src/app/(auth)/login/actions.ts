'use server'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getAdminClient } from '@agency/database/admin'
import { createSupabaseServerClient } from '@agency/database'

const INVALID_CREDENTIALS = 'Invalid email or password.'

export interface LoginResult {
  error?: string
}

/**
 * Server-only login: resolves real_email → auth_email via customer_auth_mappings,
 * signs in with server Supabase client, sets session cookies, redirects.
 * Never exposes auth_email to the client.
 */
export async function loginAction(
  _prev: LoginResult | null,
  formData: FormData
): Promise<LoginResult> {
  const realEmail = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string
  const redirectTo = (formData.get('redirect') as string) || '/dashboard'

  if (!realEmail || !password) {
    return { error: INVALID_CREDENTIALS }
  }

  const slug = process.env.NEXT_PUBLIC_TENANT_SLUG
  if (!slug) {
    return { error: 'Tenant not configured' }
  }

  const admin = getAdminClient()
  const { data: tenant } = await admin.from('tenants').select('id').eq('slug', slug).single()

  if (!tenant) {
    return { error: INVALID_CREDENTIALS }
  }

  const { data: row } = await admin
    .from('customer_auth_mappings')
    .select('auth_email')
    .eq('tenant_id', tenant.id)
    .eq('real_email', realEmail)
    .single()

  const authEmail = row?.auth_email
  if (!authEmail) {
    return { error: INVALID_CREDENTIALS }
  }

  const cookieStore = await cookies()
  const supabase = createSupabaseServerClient({
    getAll: () => cookieStore.getAll().map((c) => ({ name: c.name, value: c.value })),
    setAll: (cookiesToSet) => {
      cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
    },
  })

  const { error } = await supabase.auth.signInWithPassword({
    email: authEmail,
    password,
  })

  if (error) {
    return { error: INVALID_CREDENTIALS }
  }

  redirect(redirectTo)
}
