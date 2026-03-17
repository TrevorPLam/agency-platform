'use client'

import { useEffect } from 'react'
import { ConsentProvider, useAnalyticsConsent, SimpleConsentBanner } from '@agency/analytics'
import { initAnalyticsWithConsent } from '@agency/analytics'
import { useWebVitals, usePerformanceBudgetPresets, usePerformanceBudgets } from '@agency/monitoring'
import { AuthAnalytics } from '@/components/auth-analytics'

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
    if (!webVitalsMonitor) return
    const defaultBudgets = getDefaultBudgets(tenantSlug)
    defaultBudgets.forEach((budget) => {
      addBudget(budget)
    })
  }, [webVitalsMonitor, tenantSlug, getDefaultBudgets, addBudget])

  return null
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConsentProvider tenantSlug="TEMPLATE_SLUG">
      <AnalyticsInitializer tenantSlug="TEMPLATE_SLUG" />
      <PerformanceMonitor tenantSlug="TEMPLATE_SLUG" />
      <SimpleConsentBanner />
      <AuthAnalytics />
      {children}
    </ConsentProvider>
  )
}
