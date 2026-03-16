import type { DeploymentEvent, MetricsConfig } from './types'

/**
 * Deployment Frequency Calculator
 * 
 * Calculates the deployment frequency metric based on successful deployments
 * to production environments over the configured time window.
 */
export class DeploymentFrequencyTracker {
  private config: MetricsConfig

  constructor(config: MetricsConfig) {
    this.config = config
  }

  /**
   * Calculate deployment frequency (deployments per week)
   */
  async calculate(deployments: DeploymentEvent[]): Promise<number> {
    // Filter for successful production deployments
    const successfulDeployments = deployments.filter(deployment => 
      deployment.status === 'success' &&
      this.config.environments.includes(deployment.environment) &&
      (this.config.services.length === 0 || this.config.services.includes(deployment.service))
    )

    if (successfulDeployments.length === 0) {
      return 0
    }

    // Calculate deployments per week
    const timeWindowDays = this.config.timeWindowDays
    const timeWindowWeeks = timeWindowDays / 7
    const deploymentsPerWeek = successfulDeployments.length / timeWindowWeeks

    return Math.round(deploymentsPerWeek * 100) / 100 // Round to 2 decimal places
  }

  /**
   * Get deployment frequency trend over time
   */
  getDeploymentTrend(deployments: DeploymentEvent[]): Array<{
    date: string
    count: number
    cumulative: number
  }> {
    // Group deployments by date
    const deploymentsByDate = new Map<string, number>()

    deployments
      .filter(deployment => 
        deployment.status === 'success' &&
        this.config.environments.includes(deployment.environment)
      )
      .forEach(deployment => {
        const date = deployment.timestamp.split('T')[0] // Extract date part
        deploymentsByDate.set(date, (deploymentsByDate.get(date) || 0) + 1)
      })

    // Convert to sorted array and calculate cumulative
    const sortedDates = Array.from(deploymentsByDate.keys()).sort()
    let cumulative = 0

    return sortedDates.map(date => {
      const count = deploymentsByDate.get(date) || 0
      cumulative += count
      return { date, count, cumulative }
    })
  }

  /**
   * Get deployment frequency by service
   */
  getDeploymentFrequencyByService(deployments: DeploymentEvent[]): Record<string, number> {
    const serviceDeployments = new Map<string, number>()

    deployments
      .filter(deployment => 
        deployment.status === 'success' &&
        this.config.environments.includes(deployment.environment)
      )
      .forEach(deployment => {
        const current = serviceDeployments.get(deployment.service) || 0
        serviceDeployments.set(deployment.service, current + 1)
      })

    const timeWindowWeeks = this.config.timeWindowDays / 7
    const result: Record<string, number> = {}

    serviceDeployments.forEach((count, service) => {
      result[service] = Math.round((count / timeWindowWeeks) * 100) / 100
    })

    return result
  }

  /**
   * Get deployment frequency by environment
   */
  getDeploymentFrequencyByEnvironment(deployments: DeploymentEvent[]): Record<string, number> {
    const environmentDeployments = new Map<string, number>()

    deployments
      .filter(deployment => deployment.status === 'success')
      .forEach(deployment => {
        const current = environmentDeployments.get(deployment.environment) || 0
        environmentDeployments.set(deployment.environment, current + 1)
      })

    const timeWindowWeeks = this.config.timeWindowDays / 7
    const result: Record<string, number> = {}

    environmentDeployments.forEach((count, environment) => {
      result[environment] = Math.round((count / timeWindowWeeks) * 100) / 100
    })

    return result
  }

  /**
   * Calculate deployment success rate
   */
  getDeploymentSuccessRate(deployments: DeploymentEvent[]): number {
    if (deployments.length === 0) return 100

    const successfulDeployments = deployments.filter(deployment => 
      deployment.status === 'success'
    ).length

    return Math.round((successfulDeployments / deployments.length) * 100 * 100) / 100 // Round to 2 decimal places
  }

  /**
   * Get deployment frequency statistics
   */
  getDeploymentStatistics(deployments: DeploymentEvent[]): {
    total: number
    successful: number
    failed: number
    rollbacks: number
    successRate: number
    averageTimeBetweenDeployments: number // in hours
  } {
    const successful = deployments.filter(d => d.status === 'success').length
    const failed = deployments.filter(d => d.status === 'failure').length
    const rollbacks = deployments.filter(d => d.status === 'rollback').length
    const total = deployments.length
    const successRate = total > 0 ? (successful / total) * 100 : 100

    // Calculate average time between successful deployments
    let averageTimeBetweenDeployments = 0
    const successfulDeployments = deployments
      .filter(d => d.status === 'success')
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

    if (successfulDeployments.length > 1) {
      const timeDifferences = []
      for (let i = 1; i < successfulDeployments.length; i++) {
        const prev = new Date(successfulDeployments[i - 1].timestamp).getTime()
        const curr = new Date(successfulDeployments[i].timestamp).getTime()
        timeDifferences.push((curr - prev) / (1000 * 60 * 60)) // Convert to hours
      }
      averageTimeBetweenDeployments = timeDifferences.reduce((sum, diff) => sum + diff, 0) / timeDifferences.length
    }

    return {
      total,
      successful,
      failed,
      rollbacks,
      successRate: Math.round(successRate * 100) / 100,
      averageTimeBetweenDeployments: Math.round(averageTimeBetweenDeployments * 100) / 100
    }
  }
}
