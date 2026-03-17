import { getAdminClient } from '@agency/database/admin'
import type {
  DORAMetrics,
  DORAMetricType,
  MetricsConfig,
  MetricsResult,
  PerformanceLevel,
  DeploymentEvent,
  IncidentEvent,
  PullRequestEvent,
  MetricSnapshot
} from './types'
import { DeploymentFrequencyTracker } from './deployment-frequency'
import { LeadTimeCalculator } from './lead-time'
import { ChangeFailureRateMonitor } from './change-failure-rate'
import { MTTRTracker } from './mttr'
import { MetricsStorage } from './storage'

/**
 * Main DORA metrics collection orchestrator
 * 
 * Coordinates the collection and calculation of all DORA metrics
 * using the individual metric calculators.
 */
export class DORAMetricsCollector {
  private config: MetricsConfig
  private storage: MetricsStorage
  private deploymentTracker: DeploymentFrequencyTracker
  private leadTimeCalculator: LeadTimeCalculator
  private failureRateMonitor: ChangeFailureRateMonitor
  private mttrTracker: MTTRTracker

  constructor(config: MetricsConfig) {
    this.config = config
    this.storage = new MetricsStorage()
    this.deploymentTracker = new DeploymentFrequencyTracker(config)
    this.leadTimeCalculator = new LeadTimeCalculator(config)
    this.failureRateMonitor = new ChangeFailureRateMonitor(config)
    this.mttrTracker = new MTTRTracker(config)
  }

  /**
   * Calculate all DORA metrics for the configured time window
   */
  async calculateMetrics(): Promise<MetricsResult> {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - this.config.timeWindowDays)

    // Collect all data points in parallel for efficiency
    const [deployments, incidents, pullRequests] = await Promise.all([
      this.getDeployments(startDate, endDate),
      this.getIncidents(startDate, endDate),
      this.getPullRequests(startDate, endDate)
    ])

    // Calculate individual metrics
    const [deploymentFrequency, leadTime, changeFailureRate, mttr] = await Promise.all([
      this.deploymentTracker.calculate(deployments),
      this.leadTimeCalculator.calculate(pullRequests, deployments),
      this.failureRateMonitor.calculate(deployments, incidents),
      this.mttrTracker.calculate(incidents)
    ])

    const metrics: DORAMetrics = {
      deploymentFrequency,
      leadTimeForChanges: leadTime,
      changeFailureRate,
      meanTimeToRecovery: mttr
    }

    // Determine performance levels
    const performanceLevels = this.getPerformanceLevels(metrics)

    const result: MetricsResult = {
      metrics,
      performanceLevels,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      dataPoints: {
        deployments: deployments.length,
        incidents: incidents.length,
        pullRequests: pullRequests.length
      },
      calculatedAt: new Date().toISOString()
    }

    // Store the metrics result
    await this.storage.storeMetrics(result)

    return result
  }

  /**
   * Get historical metrics data
   */
  async getHistoricalMetrics(days: number = 90): Promise<MetricSnapshot[]> {
    return this.storage.getHistoricalMetrics(days)
  }

  /**
   * Get current performance levels and benchmarks
   */
  getPerformanceBenchmarks(): Record<DORAMetricType, PerformanceLevel[]> {
    return {
      'deployment-frequency': [
        { level: 'Elite', minThreshold: 7, maxThreshold: Infinity, description: 'Multiple deployments per day' },
        { level: 'High', minThreshold: 1, maxThreshold: 6.99, description: 'Daily to weekly deployments' },
        { level: 'Medium', minThreshold: 0.25, maxThreshold: 0.99, description: 'Weekly to monthly deployments' },
        { level: 'Low', minThreshold: 0, maxThreshold: 0.24, description: 'Monthly to less frequent deployments' }
      ],
      'lead-time-for-changes': [
        { level: 'Elite', minThreshold: 0, maxThreshold: 24, description: 'Less than one day' },
        { level: 'High', minThreshold: 24, maxThreshold: 168, description: 'One day to one week' },
        { level: 'Medium', minThreshold: 168, maxThreshold: 720, description: 'One week to one month' },
        { level: 'Low', minThreshold: 720, maxThreshold: Infinity, description: 'More than one month' }
      ],
      'change-failure-rate': [
        { level: 'Elite', minThreshold: 0, maxThreshold: 15, description: '0-15% failure rate' },
        { level: 'High', minThreshold: 15, maxThreshold: 30, description: '16-30% failure rate' },
        { level: 'Medium', minThreshold: 30, maxThreshold: 46, description: '31-46% failure rate' },
        { level: 'Low', minThreshold: 46, maxThreshold: 100, description: 'More than 46% failure rate' }
      ],
      'mean-time-to-recovery': [
        { level: 'Elite', minThreshold: 0, maxThreshold: 1, description: 'Less than one hour' },
        { level: 'High', minThreshold: 1, maxThreshold: 24, description: 'Less than one day' },
        { level: 'Medium', minThreshold: 24, maxThreshold: 168, description: 'One day to one week' },
        { level: 'Low', minThreshold: 168, maxThreshold: Infinity, description: 'More than one week' }
      ]
    }
  }

  private getPerformanceLevels(metrics: DORAMetrics): Record<DORAMetricType, PerformanceLevel> {
    const benchmarks = this.getPerformanceBenchmarks()
    const result: Record<DORAMetricType, PerformanceLevel> = {} as any

    for (const [metricType, value] of Object.entries(metrics)) {
      const levels = benchmarks[metricType as DORAMetricType]
      const level = levels.find(l => value >= l.minThreshold && value <= l.maxThreshold)
      result[metricType as DORAMetricType] = level || levels[levels.length - 1]! // fallback to lowest
    }

    return result
  }

  private async getDeployments(startDate: Date, endDate: Date): Promise<DeploymentEvent[]> {
    const supabase = getAdminClient()
    
    const { data, error } = await supabase
      .from('deployments')
      .select('*')
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString())
      .in('environment', this.config.environments)
      .order('timestamp', { ascending: true })

    if (error) {
      console.error('Error fetching deployments:', error)
      return []
    }

    return data || []
  }

  private async getIncidents(startDate: Date, endDate: Date): Promise<IncidentEvent[]> {
    const supabase = getAdminClient()
    
    const { data, error } = await supabase
      .from('incidents')
      .select('*')
      .gte('detected_at', startDate.toISOString())
      .lte('detected_at', endDate.toISOString())
      .order('detected_at', { ascending: true })

    if (error) {
      console.error('Error fetching incidents:', error)
      return []
    }

    return data || []
  }

  private async getPullRequests(startDate: Date, endDate: Date): Promise<PullRequestEvent[]> {
    const supabase = getAdminClient()
    
    const { data, error } = await supabase
      .from('pull_requests')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching pull requests:', error)
      return []
    }

    return data || []
  }
}
