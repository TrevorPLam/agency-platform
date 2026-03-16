/**
 * @agency/metrics - DORA Metrics Collection Infrastructure
 *
 * Comprehensive DORA metrics collection system for the agency platform.
 * Provides automated collection, calculation, and storage of DevOps performance metrics.
 *
 * @example
 * ```typescript
 * import { DORAMetricsCollector } from '@agency/metrics'
 * 
 * const collector = new DORAMetricsCollector({
 *   timeWindowDays: 30,
 *   environments: ['production'],
 *   services: [],
 *   alertThresholds: {
 *     deploymentFrequency: 7,
 *     leadTimeForChanges: 24,
 *     changeFailureRate: 15,
 *     meanTimeToRecovery: 1
 *   }
 * })
 * 
 * const metrics = await collector.calculateMetrics()
 * ```
 */

export type {
  DORAMetrics,
  MetricSnapshot,
  DORAMetricType,
  PerformanceLevel,
  DeploymentEvent,
  IncidentEvent,
  PullRequestEvent,
  MetricsConfig,
  MetricsResult
} from './types'

export { DORAMetricsCollector } from './collector'
export { DeploymentFrequencyTracker } from './deployment-frequency'
export { LeadTimeCalculator } from './lead-time'
export { ChangeFailureRateMonitor } from './change-failure-rate'
export { MTTRTracker } from './mttr'
export { MetricsStorage } from './storage'
