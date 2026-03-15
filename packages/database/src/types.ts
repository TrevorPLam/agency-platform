/**
 * Database type definition for the agency platform.
 * 
 * This is a placeholder type that will be replaced by `supabase gen types`
 * in T-12 after database schema is created. For now, it provides type
 * safety for the Supabase client factories.
 * 
 * @example
 * ```typescript
 * import { createSupabaseServerClient } from '@agency/database'
 * 
 * const supabase = createSupabaseServerClient(await cookies())
 * // supabase is fully typed with Database schema
 * ```
 */
export type Database = Record<string, never>

/**
 * Type for a tenant identifier.
 * Used throughout the application for multi-tenant data isolation.
 */
export type TenantId = string

/**
 * Type for a user identifier within a tenant context.
 */
export type UserId = string
