declare module '@agency/analytics' {
  import type { ReactNode } from 'react'

  export function ConsentProvider(props: { children: ReactNode }): ReactNode
  export function SimpleConsentBanner(): ReactNode
  export function initAnalyticsWithConsent(tenantSlug: string, hasConsent: boolean): void
  export function useAnalyticsConsent(): boolean
}

declare module '@agency/monitoring' {
  export interface PerformanceBudget {
    tenantId: string
    name: string
    category: 'lcp' | 'inp' | 'cls' | 'fcp' | 'ttfb' | 'bundle-size' | 'image-size'
    threshold: number
    unit: 'milliseconds' | 'bytes' | 'score'
    type: 'maximum' | 'minimum' | 'target'
    active: boolean
    alertSeverity: 'low' | 'medium' | 'high' | 'critical'
  }

  export interface PerformanceAlert {
    id: string
    tenantId: string
    name: string
    metric: 'lcp' | 'inp' | 'cls' | 'fcp' | 'ttfb'
    threshold: number
    currentValue: number
    thresholdType: 'absolute' | 'percentage' | 'rating'
    severity: 'low' | 'medium' | 'high' | 'critical'
    active: boolean
    violationCount: number
    lastTriggered?: string
    createdAt: string
    updatedAt: string
  }

  export interface WebVitalsMonitor {
    addBudget(budget: PerformanceBudget): void
    removeBudget(budgetId: string): void
    getAlerts(): PerformanceAlert[]
    clearAlerts(): void
  }

  export function useWebVitals(config: {
    tenantId: string
    enableRealUserMonitoring?: boolean
    onAlert?: (alert: PerformanceAlert) => void
  }): WebVitalsMonitor | null

  export function usePerformanceBudgets(monitor: WebVitalsMonitor | null): {
    addBudget(budget: PerformanceBudget): void
    removeBudget(budgetId: string): void
    getAlerts(): PerformanceAlert[]
    clearAlerts(): void
  }

  export function usePerformanceBudgetPresets(): {
    getDefaultBudgets(tenantId: string): PerformanceBudget[]
  }
}
