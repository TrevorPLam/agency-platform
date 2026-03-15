/**
 * @agency/database - Type-safe Supabase client factories and utilities
 *
 * This package provides a secure, type-safe interface to Supabase for the
 * agency platform. It enforces best practices for multi-tenant architecture
 * and prevents accidental service role key exposure.
 *
 * @example
 * ```typescript
 * // Server-side usage (Next.js App Router)
 * import { createSupabaseServerClient } from '@agency/database'
 * import { cookies } from 'next/headers'
 *
 * async function getServerData() {
 *   const cookieStore = await cookies()
 *   const supabase = createSupabaseServerClient({
 *     getAll: () => cookieStore.getAll().map(c => ({ name: c.name, value: c.value })),
 *     setAll: (cookiesToSet) => {
 *       cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
 *     }
 *   })
 *   const { data } = await supabase.from('users').select()
 *   return data
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Client-side usage
 * 'use client'
 * import { createSupabaseBrowserClient } from '@agency/database'
 *
 * function UserProfile() {
 *   const supabase = createSupabaseBrowserClient()
 *   // ... use supabase client
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Multi-tenant middleware
 * import { resolveTenantFromRequest } from '@agency/database'
 *
 * export async function middleware(request: NextRequest) {
 *   const tenant = await resolveTenantFromRequest(request)
 *   // ... tenant resolution logic
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Admin operations (explicit import required)
 * import { getAdminClient } from '@agency/database/admin'
 *
 * async function adminOperation() {
 *   const admin = getAdminClient() // Throws if used in browser
 *   return await admin.from('users').select()
 * }
 * ```
 */

// Type definitions (Database from generated types; IDs from semantic aliases)
export type { Database } from './types'
export type { TenantId, UserId } from './ids'

// Client factories
export { createSupabaseServerClient, createSupabaseBrowserClient, type CookieStore } from './client'

// Middleware utilities
export {
  resolveTenantFromRequest,
  validateTenantContext,
  getTenantFromHeaders,
  type TenantResolution,
} from './middleware'

// Authentication utilities
export {
  assignUserToTenant,
  createUserForTenant,
  generateTenantSpecificEmail,
  extractOriginalEmail,
  getUserTenants,
  type CreateUserOptions,
  type CreateUserResult,
} from './auth'

// Note: admin.ts is intentionally NOT exported from the barrel
// It requires explicit import: import { getAdminClient } from '@agency/database/admin'
