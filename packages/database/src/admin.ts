import 'server-only'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Database } from './types'

/**
 * ⚠️ CRITICAL SECURITY WARNING ⚠️
 *
 * This module provides elevated database access using the service role key.
 * It MUST NEVER be imported from client-side code, browser environments,
 * or any code that could be exposed to end users.
 *
 * The service role key bypasses Row-Level Security (RLS) and grants
 * full database access. Compromise of this key would allow complete
 * data exfiltration and manipulation.
 *
 * ONLY use this module in:
 * - Secure server-side environments (API routes, server components)
 * - Admin tools with proper authentication
 * - Background jobs and data processing pipelines
 * - Database migration scripts
 *
 * NEVER use this in:
 * - Client components ('use client')
 * - Browser JavaScript
 * - Mobile applications
 * - Public-facing APIs
 *
 * Before using this module, ask yourself:
 * 1. Can this task be accomplished with regular user authentication?
 * 2. Is this code running in a secure server environment?
 * 3. Could this key be exposed in logs, error messages, or client bundles?
 */

/**
 * Creates a Supabase client with service role privileges.
 *
 * This client bypasses all Row-Level Security policies and has
 * unrestricted access to all data in the database.
 *
 * @throws {Error} If SUPABASE_SERVICE_ROLE_KEY is not set
 * @returns Supabase client with elevated privileges
 *
 * @example
 * ```typescript
 * // ✅ Correct: Server-side admin operation
 * import { getAdminClient } from '@agency/database/admin'
 *
 * async function createTenant(tenantData: TenantData) {
 *   const admin = getAdminClient()
 *   return await admin.from('tenants').insert(tenantData)
 * }
 * ```
 *
 * @example
 * ```typescript
 * // ❌ WRONG: Never import in client code
 * 'use client'
 * import { getAdminClient } from '@agency/database/admin' // DANGER!
 * ```
 */
export function getAdminClient() {
  const serviceRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY']

  if (!serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is required for admin operations. ' +
        'This key must be set in your environment variables.'
    )
  }

  if (typeof globalThis !== 'undefined' && 'window' in globalThis) {
    throw new Error(
      'CRITICAL SECURITY ERROR: getAdminClient() was called in browser environment. ' +
        'Service role access is restricted to server-side code only.'
    )
  }

  return createSupabaseClient<Database>(process.env['NEXT_PUBLIC_SUPABASE_URL']!, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export function createClient() {
  return getAdminClient()
}

/**
 * Type guard to verify admin client usage context.
 *
 * This function helps prevent accidental service role usage
 * in inappropriate contexts by performing runtime checks.
 *
 * @param context - Description of where the admin client is being used
 * @throws {Error} If called in browser or unsafe context
 *
 * @example
 * ```typescript
 * function deleteUserData(userId: string) {
 *   assertAdminContext('User data deletion in API route')
 *   const admin = getAdminClient()
 *   return admin.from('users').delete().eq('id', userId)
 * }
 * ```
 */
export function assertAdminContext(context: string): void {
  if (typeof globalThis !== 'undefined' && 'window' in globalThis) {
    throw new Error(
      `Admin context violation: ${context}. ` +
        'Service role operations cannot be performed in browser environment.'
    )
  }

  // Additional context-specific checks can be added here
  // For example, checking for specific environment variables
  // or request headers that indicate a secure admin context
}

/**
 * Audit log helper for admin operations.
 *
 * Use this function to log sensitive admin operations for
 * security monitoring and compliance purposes.
 *
 * @param operation - Description of the admin operation
 * @param userId - User ID being affected (if applicable)
 * @param metadata - Additional context for the operation
 *
 * @example
 * ```typescript
 * async function resetUserPassword(userId: string) {
 *   assertAdminContext('Password reset')
 *   logAdminOperation('PASSWORD_RESET', userId, { timestamp: new Date().toISOString() })
 *
 *   const admin = getAdminClient()
 *   // ... perform password reset
 * }
 * ```
 */
export function logAdminOperation(
  operation: string,
  userId?: string,
  metadata?: Record<string, any>
): void {
  // In production, this should integrate with your audit logging system
  // For now, we'll log to console with a distinctive prefix
  const logEntry = {
    timestamp: new Date().toISOString(),
    operation,
    userId,
    metadata,
    level: 'ADMIN_AUDIT',
  }

  // Use console.error to ensure it appears in logs and monitoring
  console.error('[ADMIN_AUDIT]', JSON.stringify(logEntry))
}
