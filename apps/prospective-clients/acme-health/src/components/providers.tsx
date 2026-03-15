'use client'

import { initAnalytics } from '@agency/analytics'
import { AuthAnalytics } from '@/components/auth-analytics'

export function Providers({ children }: { children: React.ReactNode }) {
  // Initialize analytics for acme-health tenant
  initAnalytics('acme-health')

  return (
    <>
      <AuthAnalytics />
      {children}
    </>
  )
}
