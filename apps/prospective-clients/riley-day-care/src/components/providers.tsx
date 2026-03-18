'use client'

import { SiteProviders } from '@agency/marketing/providers'
import { AuthAnalytics } from '@/components/auth-analytics'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SiteProviders tenantSlug="riley-day-care" authAnalytics={<AuthAnalytics />}>
      {children}
    </SiteProviders>
  )
}
