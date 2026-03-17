'use client'

import { useEffect } from 'react'
import { ConsentProvider, useAnalyticsConsent, SimpleConsentBanner } from '@agency/analytics'
import { initAnalyticsWithConsent } from '@agency/analytics'
import { useWebVitals, usePerformanceBudgetPresets, usePerformanceBudgets } from '@agency/monitoring'
import { AuthAnalytics } from '@/components/auth-analytics'

function AnalyticsInitializer({ tenantSlug }: { tenantSlug: string }) {
  const hasConsent = useAnalyticsConsent()

  useEffect(() => {
    // Only initialize analytics if user has granted consent
    initAnalyticsWithConsent(tenantSlug, hasConsent)
  }, [tenantSlug, hasConsent])

  return null
}

function PerformanceMonitor({ tenantSlug }: { tenantSlug: string }) {
  // Initialize Web Vitals monitoring
  const webVitalsMonitor = useWebVitals({
    tenantId: tenantSlug as any,
    enableRealUserMonitoring: true,
    onAlert: (alert) => {
      console.warn(`Performance alert for ${tenantSlug}:`, alert)
      // In production, this would send alerts to your monitoring system
    },
  })

  // Set up performance budgets
  const { getDefaultBudgets } = usePerformanceBudgetPresets()
  const { addBudget } = usePerformanceBudgets(webVitalsMonitor)

  useEffect(() => {
    if (!webVitalsMonitor) return

    // Add default performance budgets
    const defaultBudgets = getDefaultBudgets(tenantSlug as any)
    defaultBudgets.forEach(budget => {
      addBudget(budget)
    })
  }, [webVitalsMonitor, tenantSlug, getDefaultBudgets, addBudget])

  return null
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConsentProvider tenantSlug="riley-day-care">
      <AnalyticsInitializer tenantSlug="riley-day-care" />
      <PerformanceMonitor tenantSlug="riley-day-care" />
      <SimpleConsentBanner />
      <AuthAnalytics />
      {children}
    </ConsentProvider>
  )
}
