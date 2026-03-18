'use client'

import 'client-only'

export {
  useWebVitals,
  usePerformanceBudgets,
  usePerformanceData,
  usePerformanceBudgetPresets,
} from './web-vitals-hooks'

export type { PerformanceBudget, PerformanceAlert } from './types'
export type { WebVitalsMonitor } from './web-vitals'
