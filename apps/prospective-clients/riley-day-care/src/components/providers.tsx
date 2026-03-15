'use client'

import { initAnalytics } from '@agency/analytics'
import { AuthAnalytics } from '@/components/auth-analytics'

export function Providers({ children }: { children: React.ReactNode }) {
  // Initialize analytics for riley-day-care tenant
  initAnalytics('riley-day-care')

  return (
    <>
      <AuthAnalytics />
      {children}
    </>
  )
}
