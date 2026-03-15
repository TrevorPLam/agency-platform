'use client'

import { initAnalytics } from '@agency/analytics'
import { AuthAnalytics } from '@/components/auth-analytics'

export function Providers({ children }: { children: React.ReactNode }) {
  // Initialize analytics for riverside-hotel tenant
  initAnalytics('riverside-hotel')

  return (
    <>
      <AuthAnalytics />
      {children}
    </>
  )
}
