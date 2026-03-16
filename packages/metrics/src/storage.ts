import { getAdminClient } from '@agency/database/admin'
import type { MetricsResult, MetricSnapshot, DORAMetricType } from './types'

/**
 * Metrics storage and retrieval system
 * 
 * Handles persistent storage of calculated metrics and historical data
 * using Supabase as the backend database.
 */
export class MetricsStorage {
  private supabase = getAdminClient()

  /**
   * Store calculated metrics result
   */
  async storeMetrics(result: MetricsResult): Promise<void> {
    // Store the main metrics result
    const { error: mainError } = await this.supabase
      .from('dora_metrics_results')
      .insert({
        calculated_at: result.calculatedAt,
        period_start: result.period.start,
        period_end: result.period.end,
        deployment_frequency: result.metrics.deploymentFrequency,
        lead_time_for_changes: result.metrics.leadTimeForChanges,
        change_failure_rate: result.metrics.changeFailureRate,
        mean_time_to_recovery: result.metrics.meanTimeToRecovery,
        deployment_performance_level: result.performanceLevels['deployment-frequency'].level,
        lead_time_performance_level: result.performanceLevels['lead-time-for-changes'].level,
        failure_rate_performance_level: result.performanceLevels['change-failure-rate'].level,
        mttr_performance_level: result.performanceLevels['mean-time-to-recovery'].level,
        data_points_deployments: result.dataPoints.deployments,
        data_points_incidents: result.dataPoints.incidents,
        data_points_pull_requests: result.dataPoints.pullRequests
      })

    if (mainError) {
      console.error('Error storing metrics result:', mainError)
      throw mainError
    }

    // Store individual metric snapshots for time series analysis
    const snapshots: Omit<MetricSnapshot, 'id'>[] = [
      {
        timestamp: result.calculatedAt,
        value: result.metrics.deploymentFrequency,
        metadata: { period: result.period, performanceLevel: result.performanceLevels['deployment-frequency'].level },
        metricType: 'deployment-frequency'
      },
      {
        timestamp: result.calculatedAt,
        value: result.metrics.leadTimeForChanges,
        metadata: { period: result.period, performanceLevel: result.performanceLevels['lead-time-for-changes'].level },
        metricType: 'lead-time-for-changes'
      },
      {
        timestamp: result.calculatedAt,
        value: result.metrics.changeFailureRate,
        metadata: { period: result.period, performanceLevel: result.performanceLevels['change-failure-rate'].level },
        metricType: 'change-failure-rate'
      },
      {
        timestamp: result.calculatedAt,
        value: result.metrics.meanTimeToRecovery,
        metadata: { period: result.period, performanceLevel: result.performanceLevels['mean-time-to-recovery'].level },
        metricType: 'mean-time-to-recovery'
      }
    ]

    const { error: snapshotsError } = await this.supabase
      .from('dora_metric_snapshots')
      .insert(snapshots)

    if (snapshotsError) {
      console.error('Error storing metric snapshots:', snapshotsError)
      throw snapshotsError
    }
  }

  /**
   * Get historical metrics data for trend analysis
   */
  async getHistoricalMetrics(days: number = 90): Promise<MetricSnapshot[]> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await this.supabase
      .from('dora_metric_snapshots')
      .select('*')
      .gte('timestamp', startDate.toISOString())
      .order('timestamp', { ascending: true })

    if (error) {
      console.error('Error fetching historical metrics:', error)
      return []
    }

    return data || []
  }

  /**
   * Get metrics for a specific metric type
   */
  async getMetricsByType(metricType: DORAMetricType, days: number = 90): Promise<MetricSnapshot[]> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await this.supabase
      .from('dora_metric_snapshots')
      .select('*')
      .eq('metric_type', metricType)
      .gte('timestamp', startDate.toISOString())
      .order('timestamp', { ascending: true })

    if (error) {
      console.error(`Error fetching ${metricType} metrics:`, error)
      return []
    }

    return data || []
  }

  /**
   * Get latest metrics calculation result
   */
  async getLatestMetrics(): Promise<MetricsResult | null> {
    const { data, error } = await this.supabase
      .from('dora_metrics_results')
      .select('*')
      .order('calculated_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching latest metrics:', error)
      return null
    }

    if (!data) return null

    // Convert database row back to MetricsResult format
    return {
      metrics: {
        deploymentFrequency: data.deployment_frequency,
        leadTimeForChanges: data.lead_time_for_changes,
        changeFailureRate: data.change_failure_rate,
        meanTimeToRecovery: data.mean_time_to_recovery
      },
      performanceLevels: {
        'deployment-frequency': {
          level: data.deployment_performance_level,
          minThreshold: 0,
          maxThreshold: 0,
          description: ''
        },
        'lead-time-for-changes': {
          level: data.lead_time_performance_level,
          minThreshold: 0,
          maxThreshold: 0,
          description: ''
        },
        'change-failure-rate': {
          level: data.failure_rate_performance_level,
          minThreshold: 0,
          maxThreshold: 0,
          description: ''
        },
        'mean-time-to-recovery': {
          level: data.mttr_performance_level,
          minThreshold: 0,
          maxThreshold: 0,
          description: ''
        }
      },
      period: {
        start: data.period_start,
        end: data.period_end
      },
      dataPoints: {
        deployments: data.data_points_deployments,
        incidents: data.data_points_incidents,
        pullRequests: data.data_points_pull_requests
      },
      calculatedAt: data.calculated_at
    }
  }

  /**
   * Clean up old metrics data to manage storage
   */
  async cleanupOldData(retentionDays: number = 365): Promise<void> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

    // Delete old snapshots
    const { error: snapshotsError } = await this.supabase
      .from('dora_metric_snapshots')
      .delete()
      .lt('timestamp', cutoffDate.toISOString())

    if (snapshotsError) {
      console.error('Error cleaning up old snapshots:', snapshotsError)
      throw snapshotsError
    }

    // Delete old results
    const { error: resultsError } = await this.supabase
      .from('dora_metrics_results')
      .delete()
      .lt('calculated_at', cutoffDate.toISOString())

    if (resultsError) {
      console.error('Error cleaning up old results:', resultsError)
      throw resultsError
    }

    console.log(`Cleaned up metrics data older than ${retentionDays} days`)
  }
}
