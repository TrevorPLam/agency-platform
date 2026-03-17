import { createServerClient, createBrowserClient } from '@supabase/ssr'
import { Database } from './types'

/**
 * Cookie store interface for server-side Supabase session.
 * Use with Next.js: pass an adapter that reads from request cookies
 * and writes to the response (e.g. in middleware or route handlers).
 *
 * @example
 * ```typescript
 * const cookieStore = await cookies()
 * const supabase = createSupabaseServerClient({
 *   getAll: () => cookieStore.getAll().map(c => ({ name: c.name, value: c.value })),
 *   setAll: (cookiesToSet) => {
 *     cookiesToSet.forEach(({ name, value, options }) =>
 *       cookieStore.set(name, value, options)
 *     )
 *   }
 * })
 * ```
 */
export interface CookieStore {
  getAll: () => Array<{ name: string; value: string }>
  setAll: (cookies: Array<{ name: string; value: string; options?: object }>) => void
}

/**
 * Creates a Supabase client for server-side usage.
 * Uses @supabase/ssr for correct Supavisor (port 6543) connection pooling
 * and session cookie handling in serverless environments.
 *
 * @param cookieStore - Adapter with getAll/setAll for request/response cookies
 * @returns Typed Supabase client instance
 */
export function createSupabaseServerClient(cookieStore: CookieStore) {
  return createServerClient<Database>(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: object }>) {
          cookieStore.setAll(cookiesToSet)
        },
      },
    }
  )
}

/**
 * Creates a Supabase client for browser-side usage.
 * Use in client components and browser environments.
 *
 * @returns Typed Supabase client instance
 */
export function createSupabaseBrowserClient() {
  if (typeof globalThis === 'undefined' || !('window' in globalThis)) {
    throw new Error('createSupabaseBrowserClient can only be called in browser environment')
  }

  return createBrowserClient<Database>(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
  )
}

/**
 * SECURITY: Do not export service role client from this file.
 * Use getAdminClient() from '@agency/database/admin' in server-side code only.
 */
