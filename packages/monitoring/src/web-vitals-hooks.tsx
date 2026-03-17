/**
 * React hooks for Web Vitals monitoring
 *
 * Provides easy integration with Next.js applications for performance monitoring
 */

'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { WebVitalsMonitor, createWebVitalsMonitor } from './web-vitals'
import type { TenantId } from '@agency/database'
import type { PerformanceBudget, PerformanceAlert } from './types'

/**
 * Hook for Web Vitals monitoring
 * Automatically starts and stops monitoring based on component lifecycle
 */
export function useWebVitals(config: {
  tenantId: TenantId
  enableRealUserMonitoring?: boolean
  onAlert?: (alert: PerformanceAlert) => void
}) {
  const monitorRef = useRef<WebVitalsMonitor | null>(null)

  useEffect(() => {
    // Create monitor instance
    const monitor = createWebVitalsMonitor({
      tenantId: config.tenantId,
      enableRealUserMonitoring: config.enableRealUserMonitoring,
    })

    monitorRef.current = monitor

    // Start collection
    monitor.startCollection()

    // Set up alert listener if callback provided
    if (config.onAlert) {
      const originalSendAlert = monitor['sendAlertNotification'].bind(monitor)
      monitor['sendAlertNotification'] = (alert: PerformanceAlert) => {
        config.onAlert!(alert)
        originalSendAlert(alert)
      }
    }

    // Cleanup on unmount
    return () => {
      monitor.stopCollection()
    }
  }, [config.tenantId, config.enableRealUserMonitoring, config.onAlert])

  // Return monitor instance for advanced usage
  return monitorRef.current
}

/**
 * Hook for performance budget management
 */
export function usePerformanceBudgets(monitor: WebVitalsMonitor | null) {
  const addBudget = useCallback((budget: Omit<PerformanceBudget, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!monitor) return
    monitor.addBudget(budget)
  }, [monitor])

  const removeBudget = useCallback((budgetId: string) => {
    if (!monitor) return
    monitor.removeBudget(budgetId)
  }, [monitor])

  const getAlerts = useCallback((): PerformanceAlert[] => {
    if (!monitor) return []
    return monitor.getAlerts()
  }, [monitor])

  const clearAlerts = useCallback(() => {
    if (!monitor) return
    monitor.clearAlerts()
  }, [monitor])

  return {
    addBudget,
    removeBudget,
    getAlerts,
    clearAlerts,
  }
}

/**
 * Hook for performance data aggregation
 */
export function usePerformanceData(monitor: WebVitalsMonitor | null, period: 'hourly' | 'daily' | 'weekly' | 'monthly' = 'daily') {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!monitor) return

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const aggregation = await monitor.getPerformanceAggregation(period)
        setData(aggregation)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch performance data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Refresh data periodically
    const interval = setInterval(fetchData, 60000) // Every minute

    return () => clearInterval(interval)
  }, [monitor, period])

  return { data, loading, error }
}

/**
 * Hook for performance budget presets
 */
export function usePerformanceBudgetPresets() {
  const getDefaultBudgets = useCallback((tenantId: TenantId): Omit<PerformanceBudget, 'id' | 'createdAt' | 'updatedAt'>[] => {
    return [
      {
        tenantId,
        name: 'LCP Budget - Good Performance',
        category: 'lcp',
        threshold: 2500,
        unit: 'milliseconds',
        type: 'maximum',
        active: true,
        alertSeverity: 'medium',
      },
      {
        tenantId,
        name: 'INP Budget - Responsive Interaction',
        category: 'inp',
        threshold: 200,
        unit: 'milliseconds',
        type: 'maximum',
        active: true,
        alertSeverity: 'medium',
      },
      {
        tenantId,
        name: 'CLS Budget - Visual Stability',
        category: 'cls',
        threshold: 0.1,
        unit: 'score',
        type: 'maximum',
        active: true,
        alertSeverity: 'high',
      },
      {
        tenantId,
        name: 'FCP Budget - Fast Loading',
        category: 'fcp',
        threshold: 1800,
        unit: 'milliseconds',
        type: 'maximum',
        active: true,
        alertSeverity: 'medium',
      },
      {
        tenantId,
        name: 'TTFB Budget - Server Response',
        category: 'ttfb',
        threshold: 800,
        unit: 'milliseconds',
        type: 'maximum',
        active: true,
        alertSeverity: 'medium',
      },
    ]
  }, [])

  const getMobileBudgets = useCallback((tenantId: TenantId): Omit<PerformanceBudget, 'id' | 'createdAt' | 'updatedAt'>[] => {
    return [
      {
        tenantId,
        name: 'Mobile LCP Budget',
        category: 'lcp',
        threshold: 3000, // More lenient for mobile
        unit: 'milliseconds',
        type: 'maximum',
        active: true,
        alertSeverity: 'medium',
      },
      {
        tenantId,
        name: 'Mobile INP Budget',
        category: 'inp',
        threshold: 300, // More lenient for mobile
        unit: 'milliseconds',
        type: 'maximum',
        active: true,
        alertSeverity: 'medium',
      },
      {
        tenantId,
        name: 'Mobile CLS Budget',
        category: 'cls',
        threshold: 0.15, // More lenient for mobile
        unit: 'score',
        type: 'maximum',
        active: true,
        alertSeverity: 'high',
      },
    ]
  }, [])

  const getStrictBudgets = useCallback((tenantId: TenantId): Omit<PerformanceBudget, 'id' | 'createdAt' | 'updatedAt'>[] => {
    return [
      {
        tenantId,
        name: 'Strict LCP Budget',
        category: 'lcp',
        threshold: 1500, // Very strict
        unit: 'milliseconds',
        type: 'maximum',
        active: true,
        alertSeverity: 'high',
      },
      {
        tenantId,
        name: 'Strict INP Budget',
        category: 'inp',
        threshold: 100, // Very strict
        unit: 'milliseconds',
        type: 'maximum',
        active: true,
        alertSeverity: 'high',
      },
      {
        tenantId,
        name: 'Strict CLS Budget',
        category: 'cls',
        threshold: 0.05, // Very strict
        unit: 'score',
        type: 'maximum',
        active: true,
        alertSeverity: 'critical',
      },
    ]
  }, [])

  return {
    getDefaultBudgets,
    getMobileBudgets,
    getStrictBudgets,
  }
}
