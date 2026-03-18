/**
 * Cost Monitoring Package
 * 
 * Core monitoring functionality for the Agency Platform cost management system.
 * Provides real-time cost tracking, anomaly detection, and alerting capabilities.
 * 
 * Features:
 * - Multi-provider cost aggregation
 * - Real-time cost monitoring
 * - Anomaly detection and alerting
 * - Cost trend analysis
 * - Budget threshold monitoring
 * - Integration with monitoring systems
 */

export interface CostMetrics {
  provider: 'supabase' | 'vercel' | 'github' | 'total'
  service: string
  cost: number
  currency: string
  period: 'daily' | 'monthly' | 'yearly'
  timestamp: Date
  metadata: Record<string, unknown>
}

export interface CostAlert {
  id: string
  type: 'budget_exceeded' | 'cost_spike' | 'anomaly' | 'recommendation'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  recommendation?: string
  timestamp: Date
  resolved: boolean
  provider?: string
  service?: string
}

export interface CostThreshold {
  provider: string
  service?: string
  warningThreshold: number // percentage
  criticalThreshold: number // percentage
  absoluteLimit?: number // absolute cost limit
}

export interface CostTrend {
  provider: string
  service: string
  period: number // days
  trend: 'increasing' | 'decreasing' | 'stable'
  changeRate: number // percentage change
  confidence: number // 0-1
}

export class CostMonitoringService {
  private metrics: CostMetrics[] = []
  private alerts: CostAlert[] = []
  private thresholds: Map<string, CostThreshold> = new Map()
  private alertCallbacks: ((alert: CostAlert) => void)[] = []

  constructor() {
    this.setupDefaultThresholds()
  }

  private setupDefaultThresholds(): void {
    // Default thresholds based on industry best practices
    const defaultThresholds: CostThreshold[] = [
      {
        provider: 'supabase',
        warningThreshold: 80,
        criticalThreshold: 95,
        absoluteLimit: 1000
      },
      {
        provider: 'vercel',
        warningThreshold: 85,
        criticalThreshold: 98,
        absoluteLimit: 500
      },
      {
        provider: 'github',
        warningThreshold: 90,
        criticalThreshold: 100,
        absoluteLimit: 300
      }
    ]

    defaultThresholds.forEach(threshold => {
      const key = threshold.provider
      this.thresholds.set(key, threshold)
    })
  }

  /**
   * Add cost metrics to the monitoring system
   */
  addMetrics(metrics: CostMetrics[]): void {
    this.metrics.push(...metrics)
    this.checkThresholds(metrics)
    this.detectAnomalies(metrics)
    this.notifyAlerts()
  }

  /**
   * Set custom thresholds for cost monitoring
   */
  setThreshold(threshold: CostThreshold): void {
    const key = threshold.provider
    this.thresholds.set(key, threshold)
  }

  /**
   * Register callback for alert notifications
   */
  onAlert(callback: (alert: CostAlert) => void): void {
    this.alertCallbacks.push(callback)
  }

  /**
   * Get current cost metrics for a specific period
   */
  getMetrics(provider?: string, period?: 'daily' | 'monthly' | 'yearly'): CostMetrics[] {
    return this.metrics.filter(metric => {
      if (provider && metric.provider !== provider) return false
      if (period && metric.period !== period) return false
      return true
    })
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): CostAlert[] {
    return this.alerts.filter(alert => !alert.resolved)
  }

  /**
   * Get cost trends for analysis
   */
  getCostTrends(lookbackDays: number = 30): CostTrend[] {
    const trends: CostTrend[] = []
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - lookbackDays)

    const recentMetrics = this.metrics.filter(m => m.timestamp >= cutoffDate)
    const providerServices = new Map<string, CostMetrics[]>()

    // Group metrics by provider and service
    recentMetrics.forEach(metric => {
      const key = `${metric.provider}:${metric.service}`
      const existing = providerServices.get(key) || []
      existing.push(metric)
      providerServices.set(key, existing)
    })

    // Calculate trends for each provider/service combination
    providerServices.forEach((metrics, key) => {
      const [provider, service] = key.split(':')
      if (!provider || !service) {
        return
      }

      const trend = this.calculateTrend(metrics, provider, service, lookbackDays)
      if (trend) {
        trends.push(trend)
      }
    })

    return trends
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.resolved = true
    }
  }

  /**
   * Get cost summary for dashboard display
   */
  getCostSummary(): CostSummary {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()

    const monthlyMetrics = this.metrics.filter(m => 
      m.period === 'monthly' &&
      m.timestamp.getMonth() === currentMonth &&
      m.timestamp.getFullYear() === currentYear
    )

    const totalSpend = monthlyMetrics
      .filter(m => m.service === 'total')
      .reduce((sum, m) => sum + m.cost, 0)

    const providerBreakdown = new Map<string, number>()
    monthlyMetrics.forEach(m => {
      if (m.service !== 'total') {
        const current = providerBreakdown.get(m.provider) || 0
        providerBreakdown.set(m.provider, current + m.cost)
      }
    })

    const activeAlerts = this.getActiveAlerts()
    const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical')

    return {
      totalSpend,
      providerBreakdown: Object.fromEntries(providerBreakdown),
      activeAlerts: activeAlerts.length,
      criticalAlerts: criticalAlerts.length,
      lastUpdated: new Date()
    }
  }

  private checkThresholds(metrics: CostMetrics[]): void {
    metrics.forEach(metric => {
      const threshold = this.thresholds.get(metric.provider)
      if (!threshold) return

      // Skip if service-specific threshold doesn't match
      if (threshold.service && threshold.service !== metric.service) return

      // Check absolute limit
      if (threshold.absoluteLimit && metric.cost > threshold.absoluteLimit) {
        this.createAlert({
          id: `absolute-limit-${metric.provider}-${Date.now()}`,
          type: 'budget_exceeded',
          severity: 'critical',
          message: `Absolute cost limit exceeded for ${metric.provider}: $${metric.cost.toFixed(2)} > $${threshold.absoluteLimit}`,
          recommendation: `Immediately review ${metric.provider} spending and implement cost controls`,
          timestamp: new Date(),
          resolved: false,
          provider: metric.provider,
          service: metric.service
        })
        return
      }

      // Get historical data for percentage calculation
      const historicalAverage = this.getHistoricalAverage(metric.provider, metric.service)
      if (historicalAverage > 0) {
        const percentage = (metric.cost / historicalAverage) * 100

        if (percentage >= threshold.criticalThreshold) {
          this.createAlert({
            id: `critical-${metric.provider}-${Date.now()}`,
            type: 'cost_spike',
            severity: 'critical',
            message: `Critical cost spike for ${metric.provider}: ${percentage.toFixed(1)}% of historical average`,
            recommendation: `Investigate unusual cost increase in ${metric.provider}`,
            timestamp: new Date(),
            resolved: false,
            provider: metric.provider,
            service: metric.service
          })
        } else if (percentage >= threshold.warningThreshold) {
          this.createAlert({
            id: `warning-${metric.provider}-${Date.now()}`,
            type: 'cost_spike',
            severity: 'medium',
            message: `Cost increase for ${metric.provider}: ${percentage.toFixed(1)}% of historical average`,
            recommendation: `Monitor ${metric.provider} spending for continued increases`,
            timestamp: new Date(),
            resolved: false,
            provider: metric.provider,
            service: metric.service
          })
        }
      }
    })
  }

  private detectAnomalies(metrics: CostMetrics[]): void {
    // Simple anomaly detection based on statistical outliers
    metrics.forEach(metric => {
      const historicalData = this.metrics.filter(m => 
        m.provider === metric.provider && 
        m.service === metric.service &&
        m.timestamp < metric.timestamp
      )

      if (historicalData.length < 5) return // Not enough data for anomaly detection

      const values = historicalData.map(m => m.cost)
      const mean = values.reduce((sum, v) => sum + v, 0) / values.length
      const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
      const stdDev = Math.sqrt(variance)

      // Check if current value is an outlier (more than 2 standard deviations)
      const zScore = Math.abs((metric.cost - mean) / stdDev)
      if (zScore > 2) {
        this.createAlert({
          id: `anomaly-${metric.provider}-${Date.now()}`,
          type: 'anomaly',
          severity: 'high',
          message: `Cost anomaly detected for ${metric.provider}: $${metric.cost.toFixed(2)} (Z-score: ${zScore.toFixed(2)})`,
          recommendation: `Investigate unusual cost pattern in ${metric.provider}`,
          timestamp: new Date(),
          resolved: false,
          provider: metric.provider,
          service: metric.service
        })
      }
    })
  }

  private getHistoricalAverage(provider: string, service?: string): number {
    const historicalMetrics = this.metrics.filter(m => 
      m.provider === provider && 
      (!service || m.service === service) &&
      m.timestamp < new Date()
    )

    if (historicalMetrics.length === 0) return 0

    return historicalMetrics.reduce((sum, m) => sum + m.cost, 0) / historicalMetrics.length
  }

  private calculateTrend(metrics: CostMetrics[], provider: string, service: string, period: number): CostTrend | null {
    if (metrics.length < 2) return null

    // Sort by timestamp
    const sortedMetrics = metrics.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    
    // Calculate trend using linear regression
    const n = sortedMetrics.length
    const xValues = sortedMetrics.map((_, i) => i)
    const yValues = sortedMetrics.map(m => m.cost)

    const sumX = xValues.reduce((sum, x) => sum + x, 0)
    const sumY = yValues.reduce((sum, y) => sum + y, 0)
    const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0)
    const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    const firstValue = yValues[0]
    const lastValue = yValues[yValues.length - 1]
    const changeRate = firstValue > 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0

    let trend: 'increasing' | 'decreasing' | 'stable'
    if (Math.abs(changeRate) < 5) {
      trend = 'stable'
    } else if (changeRate > 0) {
      trend = 'increasing'
    } else {
      trend = 'decreasing'
    }

    // Calculate confidence based on R-squared
    const meanY = sumY / n
    const totalSumSquares = yValues.reduce((sum, y) => sum + Math.pow(y - meanY, 2), 0)
    const residualSumSquares = yValues.reduce((sum, y, i) => {
      const predictedY = slope * xValues[i] + (sumY - slope * sumX) / n
      return sum + Math.pow(y - predictedY, 2)
    }, 0)
    
    const rSquared = 1 - (residualSumSquares / totalSumSquares)
    const confidence = Math.max(0, Math.min(1, rSquared))

    return {
      provider,
      service,
      period,
      trend,
      changeRate,
      confidence
    }
  }

  private createAlert(alert: CostAlert): void {
    // Avoid duplicate alerts
    const existingAlert = this.alerts.find(a => 
      a.type === alert.type && 
      a.provider === alert.provider &&
      a.service === alert.service &&
      !a.resolved &&
      a.timestamp > new Date(Date.now() - 60 * 60 * 1000) // Last hour
    )

    if (!existingAlert) {
      this.alerts.push(alert)
    }
  }

  private notifyAlerts(): void {
    const newAlerts = this.alerts.filter(alert => 
      !alert.resolved && 
      alert.timestamp > new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
    )

    newAlerts.forEach(alert => {
      this.alertCallbacks.forEach(callback => {
        try {
          callback(alert)
        } catch (error) {
          console.error('Error in alert callback:', error)
        }
      })
    })
  }
}

export interface CostSummary {
  totalSpend: number
  providerBreakdown: Record<string, number>
  activeAlerts: number
  criticalAlerts: number
  lastUpdated: Date
}

export { CostMonitoringService as default }
