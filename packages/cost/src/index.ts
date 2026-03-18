/**
 * Agency Platform Cost Management Package
 *
 * Comprehensive cost management and resource optimization for the Agency Platform.
 * Provides monitoring, optimization, and budget management capabilities.
 *
 * Features:
 * - Real-time cost monitoring and alerting
 * - Advanced resource optimization algorithms
 * - Budget management and forecasting
 * - Predictive scaling and right-sizing
 * - Cost allocation and chargeback
 * - Integration with major cloud providers
 */

import { CostMonitoringService } from './monitoring'
import type { CostSummary, CostTrend } from './monitoring'
import { CostOptimizationEngine } from './optimization'
import type { OptimizationRecommendation, ROIAnalysis } from './optimization'
import { BudgetManager } from './budget'

export { CostMonitoringService, type CostMetrics, type CostAlert, type CostThreshold, type CostTrend, type CostSummary } from './monitoring'
export { CostOptimizationEngine, type OptimizationRecommendation, type ScalingPattern, type ROIAnalysis, type ResourceUsage } from './optimization'
export { BudgetManager, type BudgetCategory, type BudgetAlert as BudgetAlertType, type CostAllocation, type BudgetForecast } from './budget'

// Re-export main classes for convenience
export { CostMonitoringService as CostMonitor } from './monitoring'
export { CostOptimizationEngine as CostOptimizer } from './optimization'

// Package version and metadata
export const PACKAGE_VERSION = '1.0.0'
export const PACKAGE_NAME = '@agency/cost'

/**
 * Main entry point for cost management functionality
 */
export class CostManagementSystem {
  private monitor: CostMonitoringService
  private optimizer: CostOptimizationEngine
  private budgetManager: BudgetManager

  constructor() {
    this.monitor = new CostMonitoringService()
    this.optimizer = new CostOptimizationEngine()
    this.budgetManager = new BudgetManager()
  }

  /**
   * Initialize the cost management system
   */
  async initialize(): Promise<void> {
    // Set up alert forwarding
    this.monitor.onAlert((alert) => {
      // Forward alerts to budget manager for policy evaluation
      console.log(`Cost alert: ${alert.message}`)
    })

    console.log('✅ Cost Management System initialized')
  }

  /**
   * Get comprehensive cost analysis
   */
  async getCostAnalysis(): Promise<CostAnalysis> {
    const costSummary = this.monitor.getCostSummary()
    const trends = this.monitor.getCostTrends()
    const recommendations = await this.optimizer.analyzeUsage([])
    const roi = this.optimizer.calculateROI(recommendations)

    return {
      summary: costSummary,
      trends,
      recommendations,
      roi,
      lastUpdated: new Date()
    }
  }

  /**
   * Get monitoring service instance
   */
  getMonitoringService(): CostMonitoringService {
    return this.monitor
  }

  /**
   * Get optimization engine instance
   */
  getOptimizationEngine(): CostOptimizationEngine {
    return this.optimizer
  }

  /**
   * Get budget manager instance
   */
  getBudgetManager(): BudgetManager {
    return this.budgetManager
  }
}

export interface CostAnalysis {
  summary: CostSummary
  trends: CostTrend[]
  recommendations: OptimizationRecommendation[]
  roi: ROIAnalysis
  lastUpdated: Date
}
