/**
 * @agency/monitoring - Cost Management Monitoring Infrastructure
 *
 * Comprehensive cost monitoring and optimization system for the agency platform.
 * Provides storage, CI/CD, and bandwidth cost tracking with tenant isolation.
 *
 * @example
 * ```typescript
 * import { CostMonitoringSystem } from '@agency/monitoring'
 * 
 * const monitoring = new CostMonitoringSystem({
 *   githubToken: process.env.GITHUB_TOKEN,
 *   organization: 'my-org',
 * })
 * 
 * const metrics = await monitoring.collectMetrics()
 * const recommendations = await monitoring.generateRecommendations(metrics)
 * ```
 */

export type {
  CostMetrics,
  BudgetAlert,
  NotificationChannel,
  StorageUsage,
  CicdUsage,
  OptimizationRecommendation,
  MonitoringConfig,
  CostQueryFilters,
  CostAggregation,
} from './types'

export { StorageMonitor } from './storage-monitor'
export { CicdCostMonitor } from './cicd-costs'
export { CostAlertEngine } from './cost-alerts'
export { CostOptimizationEngine } from './optimization-engine'
export { createRequestLogger, logInfo, logWarn, logError, type LogContext, type LogLevel } from './logger'
export {
  DEFAULT_SLOS,
  DEFAULT_ERROR_BUDGET_POLICIES,
  ERROR_CLASS_RUNBOOKS,
  type ServiceLevelObjective,
  type ErrorBudgetPolicy,
  type ErrorClassRunbook,
} from './error-budget'

// Import types for use in the class
import type {
  CostMetrics,
  BudgetAlert,
  StorageUsage,
  CicdUsage,
  OptimizationRecommendation,
  MonitoringConfig,
} from './types'

import { StorageMonitor } from './storage-monitor'
import { CicdCostMonitor } from './cicd-costs'
import { CostAlertEngine } from './cost-alerts'
import { CostOptimizationEngine } from './optimization-engine'

/**
 * Main cost monitoring system class
 * Coordinates all monitoring components and provides unified interface
 */
export class CostMonitoringSystem {
  private storageMonitor: StorageMonitor
  private cicdMonitor: CicdCostMonitor
  private alertEngine: CostAlertEngine
  private optimizationEngine: CostOptimizationEngine

  constructor(config: {
    githubToken: string
    organization: string
    monitoringConfig?: Partial<MonitoringConfig>
  }) {
    this.storageMonitor = new StorageMonitor()
    this.cicdMonitor = new CicdCostMonitor({
      organization: config.organization,
      githubToken: config.githubToken,
      pricing: {
        ubuntuPerMinute: 0.008,
        windowsPerMinute: 0.016,
        macosPerMinute: 0.08,
        freeMinutesPerMonth: 2000,
      },
      collectionInterval: 1,
    })
    this.alertEngine = new CostAlertEngine()
    this.optimizationEngine = new CostOptimizationEngine()
  }

  /**
   * Collects all cost metrics
   */
  async collectMetrics(tenantId?: string): Promise<CostMetrics[]> {
    try {
      const [storageUsage, cicdUsage] = await Promise.all([
        this.storageMonitor.collectStorageUsage(),
        this.cicdMonitor.collectCicdUsage(),
      ])

      const metrics: CostMetrics[] = []

      // Convert storage usage to cost metrics
      if (storageUsage.length > 0 && tenantId) {
        const storageMetrics = await this.storageMonitor.convertToCostMetrics(
          storageUsage,
          tenantId as any
        )
        metrics.push(storageMetrics)
      }

      // Convert CI/CD usage to cost metrics
      if (cicdUsage.length > 0 && tenantId) {
        const cicdMetrics = await this.cicdMonitor.convertToCostMetrics(
          cicdUsage,
          tenantId as any
        )
        metrics.push(cicdMetrics)
      }

      return metrics
    } catch (error) {
      console.error('Error collecting metrics:', error)
      throw error
    }
  }

  /**
   * Generates optimization recommendations
   */
  async generateRecommendations(params: {
    costMetrics: CostMetrics[]
    tenantId: string
  }): Promise<OptimizationRecommendation[]> {
    try {
      const [storageUsage, cicdUsage] = await Promise.all([
        this.storageMonitor.collectStorageUsage(),
        this.cicdMonitor.collectCicdUsage(),
      ])

      return this.optimizationEngine.generateRecommendations({
        costMetrics: params.costMetrics,
        storageUsage,
        cicdUsage,
        tenantId: params.tenantId as any,
      })
    } catch (error) {
      console.error('Error generating recommendations:', error)
      throw error
    }
  }

  /**
   * Checks and triggers alerts
   */
  async checkAlerts(metrics: CostMetrics[]): Promise<BudgetAlert[]> {
    return this.alertEngine.checkAlerts(metrics)
  }

  /**
   * Creates a new budget alert
   */
  async createAlert(alert: Omit<BudgetAlert, 'id' | 'createdAt' | 'updatedAt' | 'lastTriggered'>): Promise<BudgetAlert> {
    return this.alertEngine.createAlert(alert)
  }

  /**
   * Gets storage usage for a tenant
   */
  async getStorageUsage(tenantId: string): Promise<StorageUsage[]> {
    return this.storageMonitor.getTenantStorageUsage(tenantId as any)
  }

  /**
   * Gets CI/CD usage data
   */
  async getCicdUsage(): Promise<CicdUsage[]> {
    return this.cicdMonitor.collectCicdUsage()
  }

  /**
   * Identifies large files for optimization
   */
  async identifyLargeFiles(threshold?: number): Promise<Array<{
    name: string
    bucket: string
    size: number
    sizeFormatted: string
    createdAt: string
  }>> {
    return this.storageMonitor.identifyLargeFiles(threshold)
  }

  /**
   * Gets billing period usage summary
   */
  async getBillingSummary(): Promise<{
    storage: { totalSize: number; cost: number }
    cicd: { totalMinutes: number; cost: number }
    total: number
  }> {
    try {
      const [storageUsage, cicdUsage] = await Promise.all([
        this.storageMonitor.collectStorageUsage(),
        this.cicdMonitor.collectCicdUsage(),
      ])

      const storageSize = storageUsage.reduce((sum, usage) => sum + usage.totalSize, 0)
      const storageCost = (storageSize / 1024 / 1024 / 1024) * 0.021 // $0.021 per GB

      const cicdMinutes = cicdUsage.reduce((sum, usage) => sum + usage.runtimeMinutes, 0)
      const cicdCost = cicdUsage.reduce((sum, usage) => sum + usage.totalCost, 0)

      return {
        storage: { totalSize: storageSize, cost: storageCost },
        cicd: { totalMinutes: cicdMinutes, cost: cicdCost },
        total: storageCost + cicdCost,
      }
    } catch (error) {
      console.error('Error getting billing summary:', error)
      throw error
    }
  }
}
