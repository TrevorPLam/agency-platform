'use client'

import { useEffect } from 'react'
import { createSupabaseBrowserClient } from '@agency/database'
import { identifyUser, resetUser } from '@agency/analytics/client'

/**
 * Syncs Supabase auth state to PostHog: identifies the user after login,
 * resets identity after logout. Renders nothing.
 */
export function AuthAnalytics() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const tenantSlug = process.env['NEXT_PUBLIC_TENANT_SLUG']
    if (!tenantSlug) return
    const slug: string = tenantSlug

    const supabase = createSupabaseBrowserClient()

    async function syncIdentity() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user?.id) {
        identifyUser(session.user.id, slug)
      } else {
        resetUser()
      }
    }

    void syncIdentity()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void syncIdentity()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return null
}
