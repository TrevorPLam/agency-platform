'use client'

import 'client-only'

import { useEffect, type ReactNode } from 'react'
import { ConsentProvider, useAnalyticsConsent } from '@agency/analytics/consent-context'
import { SimpleConsentBanner } from '@agency/analytics/consent-banner'
import { initAnalyticsWithConsent } from '@agency/analytics/client'
import {
  usePerformanceBudgetPresets,
  usePerformanceBudgets,
  useWebVitals,
} from '@agency/monitoring/client'
import type { PerformanceBudget } from '@agency/monitoring/client'

function AnalyticsInitializer({ tenantSlug }: { tenantSlug: string }) {
  const hasConsent = useAnalyticsConsent()

  useEffect(() => {
    initAnalyticsWithConsent(tenantSlug, hasConsent)
  }, [tenantSlug, hasConsent])

  return null
}

function PerformanceMonitor({ tenantSlug }: { tenantSlug: string }) {
  const webVitalsMonitor = useWebVitals({
    tenantId: tenantSlug,
    enableRealUserMonitoring: true,
    onAlert: (alert) => {
      console.warn(`Performance alert for ${tenantSlug}:`, alert)
    },
  })

  const { getDefaultBudgets } = usePerformanceBudgetPresets()
  const { addBudget } = usePerformanceBudgets(webVitalsMonitor)

  useEffect(() => {
    if (!webVitalsMonitor) {
      return
    }

    const defaultBudgets = getDefaultBudgets(tenantSlug)
    defaultBudgets.forEach((budget: PerformanceBudget) => {
      addBudget(budget)
    })
  }, [webVitalsMonitor, tenantSlug, getDefaultBudgets, addBudget])

  return null
}

export function SiteProviders({
  children,
  tenantSlug,
  authAnalytics,
}: {
  children: ReactNode
  tenantSlug: string
  authAnalytics?: ReactNode
}) {
  return (
    <ConsentProvider>
      <AnalyticsInitializer tenantSlug={tenantSlug} />
      <PerformanceMonitor tenantSlug={tenantSlug} />
      <SimpleConsentBanner />
      {authAnalytics}
      {children}
    </ConsentProvider>
  )
}
