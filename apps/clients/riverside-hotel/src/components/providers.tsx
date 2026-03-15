'use client'

import { initAnalytics } from '@agency/analytics'

export function Providers({ children }: { children: React.ReactNode }) {
  // Initialize analytics for riverside-hotel tenant
  initAnalytics('riverside-hotel')

  return <>{children}</>
}
