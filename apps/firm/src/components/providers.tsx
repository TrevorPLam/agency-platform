'use client'

import { SiteProviders } from '@agency/marketing/providers'

export function Providers({ children }: { children: React.ReactNode }) {
  return <SiteProviders tenantSlug="firm">{children}</SiteProviders>
}
