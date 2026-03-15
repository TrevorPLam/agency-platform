'use client'

import { initAnalytics } from '@agency/analytics'
import { AuthAnalytics } from '@/components/auth-analytics'

export function Providers({ children }: { children: React.ReactNode }) {
  // Initialize analytics for the-barber-cave tenant
  initAnalytics('the-barber-cave')

  return (
    <>
      <AuthAnalytics />
      {children}
    </>
  )
}
