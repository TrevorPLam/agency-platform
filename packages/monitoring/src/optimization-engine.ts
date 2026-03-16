/**
 * Cost Optimization Engine
 * 
 * AI/ML-driven optimization recommendations for cost management.
 * Analyzes usage patterns and provides actionable optimization suggestions.
 */

import type { 
  OptimizationRecommendation, 
  CostMetrics, 
  StorageUsage, 
  CicdUsage,
  TenantId 
} from './types'

/**
 * Optimization engine configuration
 */
interface OptimizationEngineConfig {
  /** Analysis period in days */
  analysisPeriod: number
  /** Minimum savings threshold for recommendations */
  minimumSavingsThreshold: number
  /** Confidence threshold for ML recommendations */
  confidenceThreshold: number
  /** Whether to enable automated optimizations */
  enableAutomatedOptimizations: boolean
}

/**
 * Cost optimization engine class
 */
export class CostOptimizationEngine {
  private config: OptimizationEngineConfig

  constructor(config: Partial<OptimizationEngineConfig> = {}) {
    this.config = {
      analysisPeriod: 30, // 30 days default
      minimumSavingsThreshold: 5, // $5 minimum savings
      confidenceThreshold: 0.7, // 70% confidence
      enableAutomatedOptimizations: false, // Disabled by default for safety
      ...config,
    }
  }

  /**
   * Generates comprehensive optimization recommendations
   */
  async generateRecommendations(params: {
    costMetrics: CostMetrics[]
    storageUsage?: StorageUsage[]
    cicdUsage?: CicdUsage[]
    tenantId: TenantId
  }): Promise<OptimizationRecommendation[]> {
    try {
      const recommendations: OptimizationRecommendation[] = []

      // Analyze cost trends
      const costTrendRecommendations = this.analyzeCostTrends(params.costMetrics)
      recommendations.push(...costTrendRecommendations)

      // Analyze storage usage
      if (params.storageUsage && params.storageUsage.length > 0) {
        const storageRecommendations = this.analyzeStorageUsage(params.storageUsage, params.tenantId)
        recommendations.push(...storageRecommendations)
      }

      // Analyze CI/CD usage
      if (params.cicdUsage && params.cicdUsage.length > 0) {
        const cicdRecommendations = this.analyzeCicdUsage(params.cicdUsage, params.tenantId)
        recommendations.push(...cicdRecommendations)
      }

      // Analyze usage patterns
      const patternRecommendations = this.analyzeUsagePatterns(params.costMetrics, params.tenantId)
      recommendations.push(...patternRecommendations)

      // Filter recommendations by minimum savings threshold
      const filteredRecommendations = recommendations.filter(
        rec => rec.estimatedSavings >= this.config.minimumSavingsThreshold
      )

      // Sort by priority and estimated savings
      filteredRecommendations.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
        
        if (priorityDiff !== 0) return priorityDiff
        return b.estimatedSavings - a.estimatedSavings
      })

      console.log('Optimization recommendations generated', {
        tenantId: params.tenantId,
        totalRecommendations: recommendations.length,
        filteredRecommendations: filteredRecommendations.length,
        totalSavings: filteredRecommendations.reduce((sum, rec) => sum + rec.estimatedSavings, 0),
      })

      return filteredRecommendations
    } catch (error) {
      console.error('Error generating optimization recommendations:', error)
      throw error
    }
  }

  /**
   * Analyzes cost trends and generates recommendations
   */
  private analyzeCostTrends(costMetrics: CostMetrics[]): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = []

    if (costMetrics.length < 7) {
      return recommendations // Not enough data for trend analysis
    }

    // Sort by timestamp
    const sortedMetrics = costMetrics.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )

    // Calculate week-over-week growth
    const recentWeek = sortedMetrics.slice(-7)
    const previousWeek = sortedMetrics.slice(-14, -7)

    if (previousWeek.length === 0) return recommendations

    const recentWeekTotal = recentWeek.reduce((sum, m) => sum + m.totalCost, 0)
    const previousWeekTotal = previousWeek.reduce((sum, m) => sum + m.totalCost, 0)

    const growthRate = (recentWeekTotal - previousWeekTotal) / previousWeekTotal

    // Generate recommendation if growth is concerning
    if (growthRate > 0.2) { // More than 20% growth
      recommendations.push({
        id: `trend-${Date.now()}`,
        tenantId: recentWeek[0].tenantId,
        category: 'general',
        title: 'Rising Cost Trend Detected',
        description: `Your costs have increased by ${(growthRate * 100).toFixed(1)}% week-over-week. Review recent changes and consider optimization strategies.`,
        estimatedSavings: recentWeekTotal * 0.15, // Assume 15% can be saved
        difficulty: 'medium',
        priority: growthRate > 0.5 ? 'high' : 'medium',
        status: 'pending',
        createdAt: new Date().toISOString(),
        reviewBy: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Review in 7 days
      })
    }

    return recommendations
  }

  /**
   * Analyzes storage usage patterns
   */
  private analyzeStorageUsage(storageUsage: StorageUsage[], tenantId: TenantId): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = []

    // Check for storage growth
    const totalStorage = storageUsage.reduce((sum, usage) => sum + usage.totalSize, 0)
    const averageFileSize = storageUsage.reduce((sum, usage) => sum + usage.averageFileSize, 0) / storageUsage.length

    // Large files recommendation
    if (averageFileSize > 10 * 1024 * 1024) { // Average > 10MB
      recommendations.push({
        id: `storage-large-${Date.now()}`,
        tenantId,
        category: 'storage',
        title: 'Optimize Large File Storage',
        description: `Average file size is ${(averageFileSize / 1024 / 1024).toFixed(1)}MB. Consider implementing compression or archiving for large files.`,
        estimatedSavings: (totalStorage * 0.3) * 0.021 / 1024 / 1024 / 1024, // 30% savings * $0.021/GB
        difficulty: 'medium',
        priority: 'medium',
        status: 'pending',
        createdAt: new Date().toISOString(),
      })
    }

    // File count optimization
    const totalFiles = storageUsage.reduce((sum, usage) => sum + usage.fileCount, 0)
    if (totalFiles > 10000) {
      recommendations.push({
        id: `storage-count-${Date.now()}`,
        tenantId,
        category: 'storage',
        title: 'Consolidate or Archive Files',
        description: `You have ${totalFiles.toLocaleString()} files. Consider consolidating small files or archiving old data to reduce storage overhead.`,
        estimatedSavings: (totalStorage * 0.1) * 0.021 / 1024 / 1024 / 1024, // 10% savings
        difficulty: 'easy',
        priority: 'low',
        status: 'pending',
        createdAt: new Date().toISOString(),
      })
    }

    return recommendations
  }

  /**
   * Analyzes CI/CD usage patterns
   */
  private analyzeCicdUsage(cicdUsage: CicdUsage[], tenantId: TenantId): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = []

    // Find expensive workflows
    const expensiveWorkflows = cicdUsage
      .filter(usage => usage.totalCost > 5) // More than $5 per period
      .sort((a, b) => b.totalCost - a.totalCost)

    for (const workflow of expensiveWorkflows.slice(0, 3)) {
      recommendations.push({
        id: `cicd-expensive-${workflow.workflowName}-${Date.now()}`,
        tenantId,
        category: 'compute',
        title: `Optimize ${workflow.workflowName} Workflow`,
        description: `The ${workflow.workflowName} workflow costs $${workflow.totalCost.toFixed(2)} per period. Consider using caching, parallel jobs, or more efficient runners.`,
        estimatedSavings: workflow.totalCost * 0.3, // 30% potential savings
        difficulty: 'medium',
        priority: workflow.totalCost > 20 ? 'high' : 'medium',
        status: 'pending',
        createdAt: new Date().toISOString(),
      })
    }

    // Check for inefficient runner usage
    const windowsMacosWorkflows = cicdUsage.filter(usage => 
      usage.runnerType.includes('windows') || usage.runnerType.includes('macos')
    )

    if (windowsMacosWorkflows.length > 0) {
      const totalCost = windowsMacosWorkflows.reduce((sum, usage) => sum + usage.totalCost, 0)
      recommendations.push({
        id: `cicd-runners-${Date.now()}`,
        tenantId,
        category: 'compute',
        title: 'Switch to Ubuntu Runners',
        description: `Found ${windowsMacosWorkflows.length} workflows using Windows/macOS runners. Ubuntu runners are significantly cheaper and often sufficient.`,
        estimatedSavings: totalCost * 0.5, // 50% potential savings
        difficulty: 'easy',
        priority: 'high',
        status: 'pending',
        createdAt: new Date().toISOString(),
      })
    }

    // Check for long-running workflows
    const longRunningWorkflows = cicdUsage.filter(usage => 
      usage.jobRuns > 0 && (usage.runtimeMinutes / usage.jobRuns) > 30 // Average > 30 minutes
    )

    for (const workflow of longRunningWorkflows) {
      recommendations.push({
        id: `cicd-long-${workflow.workflowName}-${Date.now()}`,
        tenantId,
        category: 'compute',
        title: `Optimize ${workflow.workflowName} Runtime`,
        description: `This workflow has an average runtime of ${(workflow.runtimeMinutes / workflow.jobRuns).toFixed(1)} minutes. Consider adding caching or optimizing workflow steps.`,
        estimatedSavings: workflow.totalCost * 0.2, // 20% potential savings
        difficulty: 'medium',
        priority: 'medium',
        status: 'pending',
        createdAt: new Date().toISOString(),
      })
    }

    return recommendations
  }

  /**
   * Analyzes general usage patterns
   */
  private analyzeUsagePatterns(costMetrics: CostMetrics[], tenantId: TenantId): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = []

    if (costMetrics.length < 14) {
      return recommendations // Not enough data for pattern analysis
    }

    // Analyze daily vs weekend usage
    const dailyUsage = this.categorizeUsageByDay(costMetrics)
    const weekendAvg = dailyUsage.weekend.reduce((sum, cost) => sum + cost, 0) / dailyUsage.weekend.length
    const weekdayAvg = dailyUsage.weekday.reduce((sum, cost) => sum + cost, 0) / dailyUsage.weekday.length

    // If weekend usage is high, suggest scheduling optimizations
    if (weekendAvg > weekdayAvg * 0.5) {
      recommendations.push({
        id: `pattern-weekend-${Date.now()}`,
        tenantId,
        category: 'general',
        title: 'Optimize Weekend Resource Usage',
        description: 'Your weekend usage is relatively high. Consider scheduling non-urgent tasks for weekdays or implementing auto-scaling.',
        estimatedSavings: weekendAvg * 0.3 * 4, // 30% savings over 4 weekends
        difficulty: 'easy',
        priority: 'medium',
        status: 'pending',
        createdAt: new Date().toISOString(),
      })
    }

    // Analyze peak usage hours
    const hourlyUsage = this.categorizeUsageByHour(costMetrics)
    const peakHour = hourlyUsage.reduce((max, curr, index) => 
      curr > hourlyUsage[max] ? index : max, 0
    )

    if (hourlyUsage[peakHour] > hourlyUsage.reduce((sum, cost) => sum + cost, 0) / hourlyUsage.length * 2) {
      recommendations.push({
        id: `pattern-peak-${Date.now()}`,
        tenantId,
        category: 'general',
        title: 'Optimize Peak Hour Usage',
        description: `Your costs peak around ${peakHour}:00. Consider spreading workloads or implementing auto-scaling to reduce peak costs.`,
        estimatedSavings: hourlyUsage[peakHour] * 0.2 * 30, // 20% savings over 30 days
        difficulty: 'medium',
        priority: 'medium',
        status: 'pending',
        createdAt: new Date().toISOString(),
      })
    }

    return recommendations
  }

  /**
   * Categorizes usage by weekday vs weekend
   */
  private categorizeUsageByDay(costMetrics: CostMetrics[]): {
    weekday: number[]
    weekend: number[]
  } {
    const weekday: number[] = []
    const weekend: number[] = []

    for (const metric of costMetrics) {
      const date = new Date(metric.timestamp)
      const dayOfWeek = date.getDay()
      
      if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
        weekend.push(metric.totalCost)
      } else {
        weekday.push(metric.totalCost)
      }
    }

    return { weekday, weekend }
  }

  /**
   * Categorizes usage by hour of day
   */
  private categorizeUsageByHour(costMetrics: CostMetrics[]): number[] {
    const hourlyUsage = new Array(24).fill(0)
    const hourlyCounts = new Array(24).fill(0)

    for (const metric of costMetrics) {
      const date = new Date(metric.timestamp)
      const hour = date.getHours()
      
      hourlyUsage[hour] += metric.totalCost
      hourlyCounts[hour] += 1
    }

    // Calculate averages
    return hourlyUsage.map((total, index) => 
      hourlyCounts[index] > 0 ? total / hourlyCounts[index] : 0
    )
  }

  /**
   * Implements automated optimization (if enabled)
   */
  async implementAutomatedOptimizations(recommendations: OptimizationRecommendation[]): Promise<{
    implemented: OptimizationRecommendation[]
    failed: Array<{ recommendation: OptimizationRecommendation; error: string }>
  }> {
    if (!this.config.enableAutomatedOptimizations) {
      return {
        implemented: [],
        failed: recommendations.map(rec => ({
          recommendation: rec,
          error: 'Automated optimizations are disabled',
        })),
      }
    }

    const implemented: OptimizationRecommendation[] = []
    const failed: Array<{ recommendation: OptimizationRecommendation; error: string }> = []

    for (const recommendation of recommendations) {
      try {
        // Only implement 'easy' difficulty recommendations automatically
        if (recommendation.difficulty !== 'easy') {
          failed.push({
            recommendation,
            error: 'Recommendation is not safe for automated implementation',
          })
          continue
        }

        // Implement based on category
        const success = await this.implementRecommendation(recommendation)
        
        if (success) {
          implemented.push({
            ...recommendation,
            status: 'completed',
          })
        } else {
          failed.push({
            recommendation,
            error: 'Implementation failed',
          })
        }
      } catch (error) {
        failed.push({
          recommendation,
          error: String(error),
        })
      }
    }

    console.log('Automated optimizations attempted', {
      totalRecommendations: recommendations.length,
      implemented: implemented.length,
      failed: failed.length,
    })

    return { implemented, failed }
  }

  /**
   * Implements a specific recommendation
   */
  private async implementRecommendation(recommendation: OptimizationRecommendation): Promise<boolean> {
    // This is a placeholder for actual implementation logic
    // In a real implementation, this would interact with various services
    
    switch (recommendation.category) {
      case 'storage':
        // Could implement automatic file compression, archiving, etc.
        console.log(`Implementing storage optimization: ${recommendation.title}`)
        return true
        
      case 'compute':
        // Could implement automatic runner switching, workflow optimization, etc.
        console.log(`Implementing compute optimization: ${recommendation.title}`)
        return true
        
      case 'general':
        // Could implement scheduling changes, auto-scaling, etc.
        console.log(`Implementing general optimization: ${recommendation.title}`)
        return true
        
      default:
        return false
    }
  }

  /**
   * Updates recommendation status
   */
  async updateRecommendationStatus(
    id: string,
    status: OptimizationRecommendation['status']
  ): Promise<OptimizationRecommendation> {
    // This would update the recommendation in the database
    // For now, return a mock implementation
    
    const updatedRecommendation: OptimizationRecommendation = {
      id,
      tenantId: '', // Would be fetched from database
      category: 'general',
      title: 'Updated Recommendation',
      description: 'This recommendation has been updated',
      estimatedSavings: 0,
      difficulty: 'easy',
      priority: 'medium',
      status,
      createdAt: new Date().toISOString(),
    }

    console.log('Recommendation status updated', {
      recommendationId: id,
      status,
    })

    return updatedRecommendation
  }
}
