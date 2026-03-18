'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { createWebVitalsMonitor } from './web-vitals'

export function useWebVitals(config) {
  const monitorRef = useRef(null)

  useEffect(() => {
    const monitor = createWebVitalsMonitor({
      tenantId: config.tenantId,
      enableRealUserMonitoring: config.enableRealUserMonitoring,
    })

    monitorRef.current = monitor
    monitor.startCollection()

    if (config.onAlert) {
      const originalSendAlert = monitor.sendAlertNotification.bind(monitor)
      monitor.sendAlertNotification = (alert) => {
        config.onAlert(alert)
        originalSendAlert(alert)
      }
    }

    return () => {
      monitor.stopCollection()
    }
  }, [config.tenantId, config.enableRealUserMonitoring, config.onAlert])

  return monitorRef.current
}

export function usePerformanceBudgets(monitor) {
  const addBudget = useCallback(
    (budget) => {
      if (!monitor) return
      monitor.addBudget(budget)
    },
    [monitor]
  )

  const removeBudget = useCallback(
    (budgetId) => {
      if (!monitor) return
      monitor.removeBudget(budgetId)
    },
    [monitor]
  )

  const getAlerts = useCallback(() => {
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

export function usePerformanceData(monitor, period = 'daily') {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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

    void fetchData()

    const interval = setInterval(() => {
      void fetchData()
    }, 60000)

    return () => clearInterval(interval)
  }, [monitor, period])

  return { data, loading, error }
}

export function usePerformanceBudgetPresets() {
  const getDefaultBudgets = useCallback((tenantId) => {
    return [
      {
        tenantId,
        name: 'Largest Contentful Paint',
        category: 'lcp',
        threshold: 2500,
        unit: 'milliseconds',
        type: 'maximum',
        active: true,
        alertSeverity: 'medium',
      },
      {
        tenantId,
        name: 'Interaction to Next Paint',
        category: 'inp',
        threshold: 200,
        unit: 'milliseconds',
        type: 'maximum',
        active: true,
        alertSeverity: 'high',
      },
      {
        tenantId,
        name: 'Cumulative Layout Shift',
        category: 'cls',
        threshold: 0.1,
        unit: 'score',
        type: 'maximum',
        active: true,
        alertSeverity: 'medium',
      },
    ]
  }, [])

  return { getDefaultBudgets }
}