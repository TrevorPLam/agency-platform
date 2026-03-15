import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Database } from './types'
import type { cookies } from 'next/headers'

/**
 * Cookie store interface for decoupled testing.
 * 
 * This interface allows the Supabase client factories to be tested
 * with plain objects instead of requiring Next.js runtime mocks.
 * 
 * @example
 * ```typescript
 * // In production
 * const supabase = createSupabaseServerClient(await cookies())
 * 
 * // In tests
 * const mockCookieStore = { 
 *   get: () => undefined, 
 *   getAll: () => [] 
 * }
 * const supabase = createSupabaseServerClient(mockCookieStore)
 * ```
 */
export interface CookieStore {
  get: (name: string) => { value: string } | undefined
  getAll: () => Array<{ name: string; value: string }>
}

/**
 * Creates a Supabase client for server-side usage.
 * 
 * This factory uses the Supabase SSR package which automatically
 * handles the correct Supavisor URL (Port 6543) for connection
 * pooling in serverless environments.
 * 
 * @param cookieStore - Next.js cookies() result or mock for testing
 * @returns Typed Supabase client instance
 * 
 * @example
 * ```typescript
 * import { createSupabaseServerClient } from '@agency/database'
 * 
 * async function getServerData() {
 *   const supabase = createSupabaseServerClient(await cookies())
 *   const { data } = await supabase.from('users').select()
 *   return data
 * }
 * ```
 */
export function createSupabaseServerClient(cookieStore: Promise<ReturnType<typeof cookies>>) {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      cookies: {
        get(name: string) {
          return cookieStore.then(store => store.get(name))
        },
        getAll() {
          return cookieStore.then(store => store.getAll())
        },
        set() {
          // Server-side client doesn't set cookies
        },
        remove() {
          // Server-side client doesn't remove cookies
        }
      }
    }
  )
}

/**
 * Creates a Supabase client for browser-side usage.
 * 
 * This factory is intended for client components and browser
 * environments. It handles automatic token refresh and session
 * persistence.
 * 
 * @returns Typed Supabase client instance
 * 
 * @example
 * ```typescript
 * 'use client'
 * 
 * import { createSupabaseBrowserClient } from '@agency/database'
 * import { useEffect, useState } from 'react'
 * 
 * function UserProfile() {
 *   const [user, setUser] = useState(null)
 *   const supabase = createSupabaseBrowserClient()
 *   
 *   useEffect(() => {
 *     supabase.auth.getUser().then(({ data }) => {
 *       setUser(data.user)
 *     })
 *   }, [])
 *   
 *   return <div>{user?.email}</div>
 * }
 * ```
 */
export function createSupabaseBrowserClient() {
  if (typeof window === 'undefined') {
    throw new Error('createSupabaseBrowserClient can only be called in browser environment')
  }

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        storageKey: 'agency-auth-token'
      }
    }
  )
}

/**
 * ⚠️ SECURITY WARNING ⚠️
 * 
 * DO NOT export service role client from this file.
 * Service role access is restricted to admin.ts and requires
 * explicit import to prevent accidental client-side usage.
 * 
 * Use getAdminClient() from '@agency/database/admin' for elevated
 * access in secure server-side contexts only.
 */
