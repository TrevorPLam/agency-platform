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
  addBudget(budget: Omit<PerformanceBudget, 'id' | 'createdAt' | 'updatedAt'>): void
  removeBudget(budgetId: string): void
  getAlerts(): PerformanceAlert[]
  clearAlerts(): void
  getPerformanceAggregation(period: 'hourly' | 'daily' | 'weekly' | 'monthly'): Promise<unknown>
  startCollection(): void
  stopCollection(): void
}

export function useWebVitals(config: {
  tenantId: string
  enableRealUserMonitoring?: boolean
  onAlert?: (alert: PerformanceAlert) => void
}): WebVitalsMonitor | null

export function usePerformanceBudgets(monitor: WebVitalsMonitor | null): {
  addBudget(budget: Omit<PerformanceBudget, 'id' | 'createdAt' | 'updatedAt'>): void
  removeBudget(budgetId: string): void
  getAlerts(): PerformanceAlert[]
  clearAlerts(): void
}

export function usePerformanceData(
  monitor: WebVitalsMonitor | null,
  period?: 'hourly' | 'daily' | 'weekly' | 'monthly'
): {
  data: unknown
  loading: boolean
  error: string | null
}

export function usePerformanceBudgetPresets(): {
  getDefaultBudgets(tenantId: string): Array<Omit<PerformanceBudget, 'id' | 'createdAt' | 'updatedAt'>>
}