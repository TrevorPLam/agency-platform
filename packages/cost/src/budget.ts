/**
 * Budget Management Package
 * 
 * Advanced budget management for the Agency Platform cost management system.
 * Provides budget allocation, tracking, forecasting, and automated enforcement.
 * 
 * Features:
 * - Multi-dimensional budget allocation
 * - Real-time budget tracking and alerts
 * - Cost forecasting and trend analysis
 * - Automated budget enforcement policies
 * - Chargeback and cost allocation
 * - Budget variance analysis
 */

export interface BudgetCategory {
  id: string
  name: string
  description: string
  allocation: {
    monthly: number
    quarterly: number
    yearly: number
  }
  actual: {
    monthly: number
    quarterly: number
    yearly: number
  }
  variance: {
    monthly: number
    quarterly: number
    yearly: number
  }
  trend: 'increasing' | 'decreasing' | 'stable'
  forecast: {
    nextMonth: number
    nextQuarter: number
    nextYear: number
  }
  alerts: BudgetAlert[]
}

export interface BudgetAlert {
  id: string
  type: 'threshold_warning' | 'threshold_critical' | 'forecast_exceed' | 'variance_anomaly'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  threshold: number
  actual: number
  timestamp: Date
  resolved: boolean
}

export interface CostAllocation {
  tenantId: string
  tenantName: string
  environment: 'development' | 'staging' | 'production'
  costs: {
    compute: number
    storage: number
    bandwidth: number
    database: number
    total: number
  }
  allocation: {
    percentage: number
    amount: number
  }
  efficiency: {
    costPerUser: number
    costPerRequest: number
    utilizationRate: number
  }
}

export interface BudgetForecast {
  period: 'month' | 'quarter' | 'year'
  projected: number
  confidence: number
  factors: {
    historical_trend: number
    seasonality: number
    growth_rate: number
    known_events: string[]
  }
  scenarios: {
    optimistic: number
    realistic: number
    pessimistic: number
  }
}

export interface BudgetPolicy {
  id: string
  name: string
  description: string
  condition: string
  action: string
  enabled: boolean
}

export class BudgetManager {
  private categories: Map<string, BudgetCategory> = new Map()
  private allocations: CostAllocation[] = []
  private forecasts: BudgetForecast[] = []
  private policies: BudgetPolicy[] = []

  constructor() {
    this.initializeBudgetCategories()
    this.setupPolicies()
  }

  private initializeBudgetCategories(): void {
    // Initialize budget categories based on industry best practices
    const categories = [
      {
        id: 'infrastructure',
        name: 'Infrastructure & Hosting',
        description: 'Cloud hosting, CDN, and infrastructure costs',
        allocation: { monthly: 800, quarterly: 2400, yearly: 9600 },
        actual: { monthly: 0, quarterly: 0, yearly: 0 },
        variance: { monthly: 0, quarterly: 0, yearly: 0 },
        trend: 'stable' as const,
        forecast: { nextMonth: 0, nextQuarter: 0, nextYear: 0 },
        alerts: []
      },
      {
        id: 'database',
        name: 'Database & Storage',
        description: 'Database compute, storage, and backup costs',
        allocation: { monthly: 500, quarterly: 1500, yearly: 6000 },
        actual: { monthly: 0, quarterly: 0, yearly: 0 },
        variance: { monthly: 0, quarterly: 0, yearly: 0 },
        trend: 'stable' as const,
        forecast: { nextMonth: 0, nextQuarter: 0, nextYear: 0 },
        alerts: []
      },
      {
        id: 'cicd',
        name: 'CI/CD & Development',
        description: 'CI/CD pipelines, testing, and development tools',
        allocation: { monthly: 300, quarterly: 900, yearly: 3600 },
        actual: { monthly: 0, quarterly: 0, yearly: 0 },
        variance: { monthly: 0, quarterly: 0, yearly: 0 },
        trend: 'stable' as const,
        forecast: { nextMonth: 0, nextQuarter: 0, nextYear: 0 },
        alerts: []
      },
      {
        id: 'monitoring',
        name: 'Monitoring & Analytics',
        description: 'Monitoring, analytics, and observability tools',
        allocation: { monthly: 200, quarterly: 600, yearly: 2400 },
        actual: { monthly: 0, quarterly: 0, yearly: 0 },
        variance: { monthly: 0, quarterly: 0, yearly: 0 },
        trend: 'stable' as const,
        forecast: { nextMonth: 0, nextQuarter: 0, nextYear: 0 },
        alerts: []
      },
      {
        id: 'contingency',
        name: 'Contingency & Growth',
        description: 'Buffer for unexpected costs and growth initiatives',
        allocation: { monthly: 200, quarterly: 600, yearly: 2400 },
        actual: { monthly: 0, quarterly: 0, yearly: 0 },
        variance: { monthly: 0, quarterly: 0, yearly: 0 },
        trend: 'stable' as const,
        forecast: { nextMonth: 0, nextQuarter: 0, nextYear: 0 },
        alerts: []
      }
    ]

    categories.forEach(cat => {
      this.categories.set(cat.id, cat)
    })
  }

  private setupPolicies(): void {
    this.policies = [
      {
        id: 'auto_freeze',
        name: 'Automatic Budget Freeze',
        description: 'Freeze spending when budget exceeds 100%',
        condition: 'budget_exceeds_100',
        action: 'freeze_spending',
        enabled: true
      },
      {
        id: 'approval_required',
        name: 'Approval Required',
        description: 'Require approval for spending over 90%',
        condition: 'budget_exceeds_90',
        action: 'require_approval',
        enabled: true
      },
      {
        id: 'cost_optimization',
        name: 'Cost Optimization Trigger',
        description: 'Trigger optimization when budget exceeds 80%',
        condition: 'budget_exceeds_80',
        action: 'optimize_resources',
        enabled: true
      }
    ]
  }

  /**
   * Track spending against budgets
   */
  async trackSpending(): Promise<void> {
    console.log('💰 Tracking spending against budgets...')

    // Load actual spending data
    const actualSpending = await this.loadActualSpending()

    // Update budget categories with actual spending
    this.categories.forEach((category) => {
      const spending = actualSpending[category.id] || 0
      category.actual.monthly = spending
      category.actual.quarterly = spending * 3
      category.actual.yearly = spending * 12

      // Calculate variance
      category.variance.monthly = category.actual.monthly - category.allocation.monthly
      category.variance.quarterly = category.actual.quarterly - category.allocation.quarterly
      category.variance.yearly = category.actual.yearly - category.allocation.yearly

      // Determine trend
      category.trend = this.calculateTrend(category)
    })

    // Generate forecasts
    await this.generateForecasts()

    // Check for alerts
    await this.checkBudgetAlerts()

    // Apply policies
    await this.applyPolicies()
  }

  private async loadActualSpending(): Promise<Record<string, number>> {
    // Simulate loading actual spending data
    return {
      infrastructure: 745.80,
      database: 467.30,
      cicd: 285.60,
      monitoring: 178.90,
      contingency: 45.20
    }
  }

  private calculateTrend(category: BudgetCategory): 'increasing' | 'decreasing' | 'stable' {
    const variance = category.variance.monthly
    const allocation = category.allocation.monthly
    const variancePercentage = (variance / allocation) * 100

    if (variancePercentage > 5) return 'increasing'
    if (variancePercentage < -5) return 'decreasing'
    return 'stable'
  }

  private async generateForecasts(): Promise<void> {
    console.log('📈 Generating budget forecasts...')

    this.categories.forEach((category) => {
      // Simple forecasting based on trend and variance
      const monthlyGrowthRate = category.trend === 'increasing' ? 1.05 : 
                              category.trend === 'decreasing' ? 0.95 : 1.0

      const seasonalityFactor = this.getSeasonalityFactor()
      
      category.forecast.nextMonth = category.actual.monthly * monthlyGrowthRate * seasonalityFactor
      category.forecast.nextQuarter = category.actual.quarterly * monthlyGrowthRate * seasonalityFactor * 3
      category.forecast.nextYear = category.actual.yearly * monthlyGrowthRate * seasonalityFactor * 12

      // Create detailed forecast
      this.forecasts.push({
        period: 'month',
        projected: category.forecast.nextMonth,
        confidence: 0.85,
        factors: {
          historical_trend: monthlyGrowthRate - 1,
          seasonality: seasonalityFactor - 1,
          growth_rate: 0.02,
          known_events: ['Q4 marketing campaign', 'Holiday traffic increase']
        },
        scenarios: {
          optimistic: category.forecast.nextMonth * 0.9,
          realistic: category.forecast.nextMonth,
          pessimistic: category.forecast.nextMonth * 1.2
        }
      })
    })
  }

  private getSeasonalityFactor(): number {
    const month = new Date().getMonth()
    // Simple seasonality: higher spending in Q4 (months 9-11)
    return (month >= 9 && month <= 11) ? 1.15 : 1.0
  }

  private async checkBudgetAlerts(): Promise<void> {
    console.log('🚨 Checking budget alerts...')

    this.categories.forEach((category) => {
      const utilizationRate = (category.actual.monthly / category.allocation.monthly) * 100

      // Critical threshold (95%)
      if (utilizationRate >= 95) {
        this.createAlert(category, 'threshold_critical', 95, utilizationRate)
      }
      // Warning threshold (80%)
      else if (utilizationRate >= 80) {
        this.createAlert(category, 'threshold_warning', 80, utilizationRate)
      }

      // Forecast exceedance
      if (category.forecast.nextMonth > category.allocation.monthly) {
        this.createAlert(category, 'forecast_exceed', category.allocation.monthly, category.forecast.nextMonth)
      }

      // Variance anomaly
      if (Math.abs(category.variance.monthly) > category.allocation.monthly * 0.2) {
        this.createAlert(category, 'variance_anomaly', category.allocation.monthly * 0.2, Math.abs(category.variance.monthly))
      }
    })
  }

  private createAlert(category: BudgetCategory, type: BudgetAlert['type'], threshold: number, actual: number): void {
    const alert: BudgetAlert = {
      id: `${category.id}-${type}-${Date.now()}`,
      type,
      severity: this.getAlertSeverity(type, actual, threshold),
      message: this.getAlertMessage(type, category.name, threshold, actual),
      threshold,
      actual,
      timestamp: new Date(),
      resolved: false
    }

    // Avoid duplicate alerts
    const existingAlert = category.alerts.find(a => 
      a.type === type && 
      !a.resolved &&
      a.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
    )

    if (!existingAlert) {
      category.alerts.push(alert)
      console.log(`🚨 ${alert.severity.toUpperCase()}: ${alert.message}`)
    }
  }

  private getAlertSeverity(type: BudgetAlert['type'], actual: number, threshold: number): BudgetAlert['severity'] {
    const percentage = (actual / threshold) * 100

    switch (type) {
      case 'threshold_critical':
        return percentage >= 100 ? 'critical' : 'high'
      case 'threshold_warning':
        return percentage >= 90 ? 'high' : 'medium'
      case 'forecast_exceed':
        return percentage >= 110 ? 'critical' : 'high'
      case 'variance_anomaly':
        return percentage >= 150 ? 'medium' : 'low'
      default:
        return 'low'
    }
  }

  private getAlertMessage(type: BudgetAlert['type'], categoryName: string, threshold: number, actual: number): string {
    switch (type) {
      case 'threshold_critical':
        return `Critical budget threshold for ${categoryName}: $${actual.toFixed(2)} / $${threshold.toFixed(2)} (${((actual/threshold)*100).toFixed(1)}%)`
      case 'threshold_warning':
        return `Budget warning for ${categoryName}: $${actual.toFixed(2)} / $${threshold.toFixed(2)} (${((actual/threshold)*100).toFixed(1)}%)`
      case 'forecast_exceed':
        return `Forecast exceeds budget for ${categoryName}: projected $${actual.toFixed(2)} vs allocated $${threshold.toFixed(2)}`
      case 'variance_anomaly':
        return `Budget variance anomaly for ${categoryName}: variance of $${actual.toFixed(2)} exceeds threshold of $${threshold.toFixed(2)}`
      default:
        return `Budget alert for ${categoryName}`
    }
  }

  private async applyPolicies(): Promise<void> {
    console.log('🔧 Applying budget policies...')

    this.policies.forEach(policy => {
      if (!policy.enabled) return

      const shouldApply = this.evaluatePolicyCondition(policy.condition)
      if (shouldApply) {
        this.executePolicyAction(policy.action)
      }
    })
  }

  private evaluatePolicyCondition(condition: string): boolean {
    // Simple policy evaluation
    switch (condition) {
      case 'budget_exceeds_100':
        return Array.from(this.categories.values()).some(cat => 
          (cat.actual.monthly / cat.allocation.monthly) >= 1.0
        )
      case 'budget_exceeds_90':
        return Array.from(this.categories.values()).some(cat => 
          (cat.actual.monthly / cat.allocation.monthly) >= 0.9
        )
      case 'budget_exceeds_80':
        return Array.from(this.categories.values()).some(cat => 
          (cat.actual.monthly / cat.allocation.monthly) >= 0.8
        )
      default:
        return false
    }
  }

  private executePolicyAction(action: string): void {
    console.log(`🔧 Executing policy action: ${action}`)
    
    switch (action) {
      case 'freeze_spending':
        console.log('❄️ Spending frozen - immediate action required')
        break
      case 'require_approval':
        console.log('✋ Approval required for additional spending')
        break
      case 'optimize_resources':
        console.log('⚡ Triggering resource optimization')
        break
    }
  }

  /**
   * Get budget category by ID
   */
  getCategory(id: string): BudgetCategory | undefined {
    return this.categories.get(id)
  }

  /**
   * Get all budget categories
   */
  getCategories(): BudgetCategory[] {
    return Array.from(this.categories.values())
  }

  /**
   * Get cost allocations
   */
  getAllocations(): CostAllocation[] {
    return this.allocations
  }

  /**
   * Get forecasts
   */
  getForecasts(): BudgetForecast[] {
    return this.forecasts
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): BudgetAlert[] {
    return Array.from(this.categories.values())
      .flatMap(cat => cat.alerts.filter(alert => !alert.resolved))
  }
}
