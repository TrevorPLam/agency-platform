/**
 * Web Vitals monitoring system
 * 
 * Provides comprehensive Core Web Vitals tracking with tenant isolation,
 * real user monitoring, and performance budget enforcement.
 */

import type { TenantId } from '@agency/database'
import type { 
  WebVitalsMetrics, 
  PerformanceBudget, 
  PerformanceAlert, 
  PerformanceAggregation 
} from './types'

/**
 * Web Vitals rating thresholds (2026 standards)
 */
const VITAL_THRESHOLDS = {
  lcp: { good: 2500, poor: 4000 }, // Largest Contentful Paint (ms)
  inp: { good: 200, poor: 500 },   // Interaction to Next Paint (ms)
  cls: { good: 0.1, poor: 0.25 },  // Cumulative Layout Shift
  fcp: { good: 1800, poor: 3000 }, // First Contentful Paint (ms)
  ttfb: { good: 800, poor: 1800 }, // Time to First Byte (ms)
} as const

/**
 * Get performance rating for a metric value
 */
function getRating(metric: keyof typeof VITAL_THRESHOLDS, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = VITAL_THRESHOLDS[metric]
  if (value <= thresholds.good) return 'good'
  if (value <= thresholds.poor) return 'needs-improvement'
  return 'poor'
}

/**
 * Get device category from user agent
 */
function getDeviceCategory(userAgent: string): 'mobile' | 'tablet' | 'desktop' {
  const ua = userAgent.toLowerCase()
  
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return 'mobile'
  }
  
  if (ua.includes('tablet') || ua.includes('ipad')) {
    return 'tablet'
  }
  
  return 'desktop'
}

/**
 * Get connection type from Network Information API
 */
function getConnectionType(): 'slow-2g' | '2g' | '3g' | '4g' | '5g' | 'unknown' {
  if (typeof window === 'undefined' || !('connection' in navigator)) {
    return 'unknown'
  }
  
  const connection = (navigator as any).connection
  if (!connection) return 'unknown'
  
  const effectiveType = connection.effectiveType
  switch (effectiveType) {
    case 'slow-2g': return 'slow-2g'
    case '2g': return '2g'
    case '3g': return '3g'
    case '4g': return '4g'
    case '5g': return '5g'
    default: return 'unknown'
  }
}

/**
 * Web Vitals monitoring class
 */
export class WebVitalsMonitor {
  private metricsBuffer: WebVitalsMetrics[] = []
  private budgets: Map<string, PerformanceBudget> = new Map()
  private alerts: Map<string, PerformanceAlert> = new Map()
  private isCollecting = false

  constructor(private config: {
    tenantId: TenantId
    batchSize?: number
    flushInterval?: number
    enableRealUserMonitoring?: boolean
  }) {
    this.config = {
      batchSize: 10,
      flushInterval: 30000, // 30 seconds
      enableRealUserMonitoring: true,
      ...config,
    }
  }

  /**
   * Start collecting Web Vitals metrics
   */
  startCollection(): void {
    if (this.isCollecting || typeof window === 'undefined') return
    
    this.isCollecting = true
    
    // Load web-vitals library dynamically
    this.loadWebVitalsLibrary().then(({ getCLS, getFID, getFCP, getLCP, getTTFB, getINP }) => {
      // Collect Core Web Vitals
      getCLS((metric) => this.handleMetric('cls', metric.value))
      getFID((metric) => this.handleMetric('fid', metric.value)) // Legacy FID for compatibility
      getFCP((metric) => this.handleMetric('fcp', metric.value))
      getLCP((metric) => this.handleMetric('lcp', metric.value))
      getTTFB((metric) => this.handleMetric('ttfb', metric.value))
      getINP((metric) => this.handleMetric('inp', metric.value))
      
      // Start periodic flushing
      if (this.config.enableRealUserMonitoring) {
        setInterval(() => this.flushMetrics(), this.config.flushInterval!)
      }
    }).catch(error => {
      console.error('Failed to load web-vitals library:', error)
    })
  }

  /**
   * Stop collecting metrics
   */
  stopCollection(): void {
    this.isCollecting = false
    this.flushMetrics() // Flush any remaining metrics
  }

  /**
   * Handle individual metric collection
   */
  private handleMetric(name: string, value: number): void {
    if (!this.isCollecting) return

    const userAgent = navigator.userAgent
    const deviceCategory = getDeviceCategory(userAgent)
    const connectionType = getConnectionType()
    
    // Create metric record
    const metric: WebVitalsMetrics = {
      id: this.generateId(),
      tenantId: this.config.tenantId,
      pageUrl: window.location.href,
      userAgent,
      deviceCategory,
      connectionType,
      lcp: name === 'lcp' ? value : 0,
      inp: name === 'inp' ? value : 0,
      cls: name === 'cls' ? value : 0,
      fcp: name === 'fcp' ? value : 0,
      ttfb: name === 'ttfb' ? value : 0,
      rating: this.getOverallRating({ lcp: name === 'lcp' ? value : 0, inp: name === 'inp' ? value : 0, cls: name === 'cls' ? value : 0 }),
      timestamp: new Date().toISOString(),
      context: {
        referrer: document.referrer,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        memory: (performance as any).memory ? {
          used: (performance as any).memory.usedJSHeapSize,
          total: (performance as any).memory.totalJSHeapSize,
        } : null,
      },
    }

    // Update existing metric or add new one
    const existingIndex = this.metricsBuffer.findIndex(m => m.pageUrl === metric.pageUrl)
    if (existingIndex >= 0) {
      // Merge with existing metric (some metrics arrive at different times)
      const existing = this.metricsBuffer[existingIndex]
      this.metricsBuffer[existingIndex] = { ...existing, ...metric }
    } else {
      this.metricsBuffer.push(metric)
    }

    // Check performance budgets
    this.checkBudgets(metric)
    
    // Auto-flush if buffer is full
    if (this.metricsBuffer.length >= this.config.batchSize!) {
      this.flushMetrics()
    }
  }

  /**
   * Get overall performance rating
   */
  private getOverallRating(metrics: { lcp: number; inp: number; cls: number }): 'good' | 'needs-improvement' | 'poor' {
    const lcpRating = getRating('lcp', metrics.lcp)
    const inpRating = getRating('inp', metrics.inp)
    const clsRating = getRating('cls', metrics.cls)
    
    // Overall rating is the worst of the three Core Web Vitals
    if (lcpRating === 'poor' || inpRating === 'poor' || clsRating === 'poor') return 'poor'
    if (lcpRating === 'needs-improvement' || inpRating === 'needs-improvement' || clsRating === 'needs-improvement') {
      return 'needs-improvement'
    }
    return 'good'
  }

  /**
   * Check performance budgets and trigger alerts
   */
  private checkBudgets(metric: WebVitalsMetrics): void {
    this.budgets.forEach(budget => {
      if (!budget.active || budget.tenantId !== this.config.tenantId) return
      
      let value: number
      switch (budget.category) {
        case 'lcp': value = metric.lcp; break
        case 'inp': value = metric.inp; break
        case 'cls': value = metric.cls; break
        case 'fcp': value = metric.fcp; break
        case 'ttfb': value = metric.ttfb; break
        default: return
      }

      const isViolation = budget.type === 'maximum' ? value > budget.threshold : value < budget.threshold
      
      if (isViolation) {
        this.triggerBudgetAlert(budget, value)
      }
    })
  }

  /**
   * Trigger a budget alert
   */
  private triggerBudgetAlert(budget: PerformanceBudget, currentValue: number): void {
    const alertKey = `${budget.id}-${budget.category}`
    let alert = this.alerts.get(alertKey)
    
    if (!alert) {
      alert = {
        id: this.generateId(),
        tenantId: this.config.tenantId,
        name: `Budget exceeded: ${budget.name}`,
        metric: budget.category,
        threshold: budget.threshold,
        currentValue,
        thresholdType: 'absolute',
        severity: budget.alertSeverity,
        active: true,
        violationCount: 1,
        lastTriggered: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      this.alerts.set(alertKey, alert)
    } else {
      alert.violationCount++
      alert.lastTriggered = new Date().toISOString()
      alert.updatedAt = new Date().toISOString()
    }

    // Send alert notification (implement based on your notification system)
    this.sendAlertNotification(alert)
  }

  /**
   * Send alert notification
   */
  private sendAlertNotification(alert: PerformanceAlert): void {
    // This would integrate with your existing notification system
    console.warn('Performance alert triggered:', {
      alert: alert.name,
      metric: alert.metric,
      threshold: alert.threshold,
      currentValue: alert.currentValue,
      severity: alert.severity,
      violations: alert.violationCount,
    })
  }

  /**
   * Flush metrics to storage/analytics
   */
  private async flushMetrics(): Promise<void> {
    if (this.metricsBuffer.length === 0) return

    const metricsToSend = [...this.metricsBuffer]
    this.metricsBuffer = []

    try {
      // Send to analytics system (PostHog, custom endpoint, etc.)
      await this.sendMetricsToAnalytics(metricsToSend)
      
      // Store in database for historical analysis
      await this.storeMetrics(metricsToSend)
    } catch (error) {
      console.error('Failed to flush Web Vitals metrics:', error)
      // Re-add metrics to buffer for retry
      this.metricsBuffer.unshift(...metricsToSend)
    }
  }

  /**
   * Send metrics to analytics system
   */
  private async sendMetricsToAnalytics(metrics: WebVitalsMetrics[]): Promise<void> {
    // Integrate with existing analytics package
    const { captureEvent } = await import('@agency/analytics')
    
    metrics.forEach(metric => {
      captureEvent('web_vitals', {
        page_url: metric.pageUrl,
        device_category: metric.deviceCategory,
        connection_type: metric.connectionType,
        lcp: metric.lcp,
        inp: metric.inp,
        cls: metric.cls,
        fcp: metric.fcp,
        ttfb: metric.ttfb,
        rating: metric.rating,
        tenant: metric.tenantId,
      })
    })
  }

  /**
   * Store metrics in database
   */
  private async storeMetrics(metrics: WebVitalsMetrics[]): Promise<void> {
    // This would store metrics in your database for historical analysis
    // Implementation depends on your database schema and RLS policies
    console.log('Storing Web Vitals metrics:', metrics.length, 'records')
  }

  /**
   * Load web-vitals library dynamically
   */
  private async loadWebVitalsLibrary(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('Web Vitals can only be loaded in browser'))
        return
      }

      // Check if already loaded
      if ((window as any).webVitals) {
        resolve((window as any).webVitals)
        return
      }

      const script = document.createElement('script')
      script.src = 'https://unpkg.com/web-vitals@4/dist/web-vitals.iife.js'
      script.async = true
      script.onload = () => resolve((window as any).webVitals)
      script.onerror = reject
      document.head.appendChild(script)
    })
  }

  /**
   * Add performance budget
   */
  addBudget(budget: Omit<PerformanceBudget, 'id' | 'createdAt' | 'updatedAt'>): void {
    const fullBudget: PerformanceBudget = {
      ...budget,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    this.budgets.set(fullBudget.id, fullBudget)
  }

  /**
   * Remove performance budget
   */
  removeBudget(budgetId: string): void {
    this.budgets.delete(budgetId)
  }

  /**
   * Get current alerts
   */
  getAlerts(): PerformanceAlert[] {
    return Array.from(this.alerts.values())
  }

  /**
   * Clear alerts
   */
  clearAlerts(): void {
    this.alerts.clear()
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get performance aggregation for dashboard
   */
  async getPerformanceAggregation(period: 'hourly' | 'daily' | 'weekly' | 'monthly'): Promise<PerformanceAggregation> {
    // This would aggregate stored metrics from your database
    // Implementation depends on your database schema
    
    // Mock implementation for now
    return {
      period,
      avgLcp: 2100,
      avgInp: 150,
      avgCls: 0.08,
      ratingDistribution: {
        good: 75,
        needsImprovement: 20,
        poor: 5,
      },
      trends: {
        lcp: { direction: 'down', percentageChange: -5.2 },
        inp: { direction: 'stable', percentageChange: 1.1 },
        cls: { direction: 'down', percentageChange: -8.3 },
      },
      dataPoints: 1000,
      timestamp: new Date().toISOString(),
    }
  }
}

/**
 * Create a Web Vitals monitor instance
 */
export function createWebVitalsMonitor(config: {
  tenantId: TenantId
  batchSize?: number
  flushInterval?: number
  enableRealUserMonitoring?: boolean
}): WebVitalsMonitor {
  return new WebVitalsMonitor(config)
}
