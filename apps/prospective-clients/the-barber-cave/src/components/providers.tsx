'use client'

import { SiteProviders } from '@agency/marketing/providers'
import { AuthAnalytics } from '@/components/auth-analytics'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SiteProviders tenantSlug="the-barber-cave" authAnalytics={<AuthAnalytics />}>
      {children}
    </SiteProviders>
  )
}
