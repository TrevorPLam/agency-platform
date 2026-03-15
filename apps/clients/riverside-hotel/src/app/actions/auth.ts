'use server'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getAdminClient } from '@agency/database/admin'
import { createUserForTenant, createSupabaseServerClient } from '@agency/database'

/**
 * Resolves real email to auth email for this tenant (login-by-real-email).
 * Returns null if no mapping exists.
 */
export async function resolveAuthEmail(realEmail: string): Promise<string | null> {
  const slug = process.env.NEXT_PUBLIC_TENANT_SLUG
  if (!slug) return null
  const admin = getAdminClient()
  const { data: tenant } = await admin.from('tenants').select('id').eq('slug', slug).single()
  if (!tenant) return null
  const { data: row } = await admin
    .from('customer_auth_mappings')
    .select('auth_email')
    .eq('tenant_id', tenant.id)
    .eq('real_email', realEmail)
    .single()
  return row?.auth_email ?? null
}

export interface SignupResult {
  success: boolean
  authEmail?: string
  error?: string
}

/**
 * Create a user for the current tenant (from NEXT_PUBLIC_TENANT_SLUG).
 * Returns authEmail so the client can call signInWithPassword once.
 */
export async function signupAction(email: string, password: string): Promise<SignupResult> {
  const slug = process.env.NEXT_PUBLIC_TENANT_SLUG
  if (!slug) {
    return { success: false, error: 'Tenant not configured' }
  }
  const admin = getAdminClient()
  const { data: tenant } = await admin.from('tenants').select('id').eq('slug', slug).single()
  if (!tenant) {
    return { success: false, error: 'Tenant not found' }
  }
  try {
    const result = await createUserForTenant({
      email,
      password,
      tenantId: tenant.id,
      emailConfirm: true,
    })
    return { success: true, authEmail: result.authEmail }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Signup failed'
    return { success: false, error: message }
  }
}

export async function signOutAction() {
  const cookieStore = await cookies()
  const supabase = createSupabaseServerClient({
    getAll: () => cookieStore.getAll().map((c) => ({ name: c.name, value: c.value })),
    setAll: (cookiesToSet) => {
      cookiesToSet.forEach(({ name, value, options }) =>
        cookieStore.set(name, value, options)
      )
    },
  })
  await supabase.auth.signOut()
  redirect('/login')
}
