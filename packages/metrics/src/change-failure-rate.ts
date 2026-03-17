import type { DeploymentEvent, IncidentEvent, MetricsConfig } from './types'

/**
 * Change Failure Rate Monitor
 * 
 * Calculates the change failure rate metric based on the percentage of
 * deployments that result in service failures or incidents.
 */
export class ChangeFailureRateMonitor {
  private config: MetricsConfig

  constructor(config: MetricsConfig) {
    this.config = config
  }

  /**
   * Calculate change failure rate (percentage)
   */
  async calculate(deployments: DeploymentEvent[], incidents: IncidentEvent[]): Promise<number> {
    // Filter deployments based on configuration
    const relevantDeployments = deployments.filter(deployment => 
      this.config.environments.includes(deployment.environment) &&
      (this.config.services.length === 0 || this.config.services.includes(deployment.service))
    )

    if (relevantDeployments.length === 0) {
      return 0
    }

    // Find deployments that resulted in failures
    const failureDeployments = this.getFailureDeployments(relevantDeployments, incidents)

    // Calculate failure rate as percentage
    const failureRate = (failureDeployments.length / relevantDeployments.length) * 100

    return Math.round(failureRate * 100) / 100 // Round to 2 decimal places
  }

  /**
   * Get failure rate trend over time
   */
  getFailureRateTrend(deployments: DeploymentEvent[], incidents: IncidentEvent[]): Array<{
    date: string
    failureRate: number
    deploymentCount: number
    failureCount: number
  }> {
    const relevantDeployments = deployments.filter(deployment => 
      this.config.environments.includes(deployment.environment)
    )

    // Group deployments by date
    const dailyData = new Map<string, { deployments: DeploymentEvent[], incidents: IncidentEvent[] }>()

    relevantDeployments.forEach(deployment => {
      const date = (deployment.timestamp || '').split('T')[0]
      if (date && !dailyData.has(date)) {
        dailyData.set(date, { deployments: [], incidents: [] })
      }
      if (date) {
        dailyData.get(date)!.deployments.push(deployment)
      }
    })

    incidents.forEach(incident => {
      const date = (incident.detectedAt || '').split('T')[0]
      if (date && !dailyData.has(date)) {
        dailyData.set(date, { deployments: [], incidents: [] })
      }
      if (date) {
        dailyData.get(date)!.incidents.push(incident)
      }
    })

    // Calculate daily failure rates
    const trend = []
    for (const [date, data] of dailyData.entries()) {
      const failureDeployments = this.getFailureDeployments(data.deployments, data.incidents)
      const failureRate = data.deployments.length > 0 
        ? (failureDeployments.length / data.deployments.length) * 100 
        : 0

      trend.push({
        date,
        failureRate: Math.round(failureRate * 100) / 100,
        deploymentCount: data.deployments.length,
        failureCount: failureDeployments.length
      })
    }

    return trend.sort((a, b) => a.date.localeCompare(b.date))
  }

  /**
   * Get failure rate by service
   */
  getFailureRateByService(deployments: DeploymentEvent[], incidents: IncidentEvent[]): Record<string, number> {
    const serviceDeployments = new Map<string, DeploymentEvent[]>()
    const serviceIncidents = new Map<string, IncidentEvent[]>()

    // Group deployments and incidents by service
    deployments
      .filter(deployment => this.config.environments.includes(deployment.environment))
      .forEach(deployment => {
        if (!serviceDeployments.has(deployment.service)) {
          serviceDeployments.set(deployment.service, [])
        }
        serviceDeployments.get(deployment.service)!.push(deployment)
      })

    incidents.forEach(incident => {
      if (!serviceIncidents.has(incident.service)) {
        serviceIncidents.set(incident.service, [])
      }
      serviceIncidents.get(incident.service)!.push(incident)
    })

    // Calculate failure rates by service
    const result: Record<string, number> = {}
    for (const [service, serviceDeploymentList] of serviceDeployments.entries()) {
      const serviceIncidentList = serviceIncidents.get(service) || []
      const failureDeployments = this.getFailureDeployments(serviceDeploymentList, serviceIncidentList)
      const failureRate = serviceDeploymentList.length > 0 
        ? (failureDeployments.length / serviceDeploymentList.length) * 100 
        : 0
      result[service] = Math.round(failureRate * 100) / 100
    }

    return result
  }

  /**
   * Get failure rate by severity
   */
  getFailureRateBySeverity(deployments: DeploymentEvent[], incidents: IncidentEvent[]): Record<string, number> {
    const severityIncidents = new Map<string, IncidentEvent[]>()

    incidents.forEach(incident => {
      if (!severityIncidents.has(incident.severity)) {
        severityIncidents.set(incident.severity, [])
      }
      severityIncidents.get(incident.severity)!.push(incident)
    })

    const relevantDeployments = deployments.filter(deployment => 
      this.config.environments.includes(deployment.environment)
    )

    const result: Record<string, number> = {}
    for (const [severity, severityIncidentList] of severityIncidents.entries()) {
      const failureDeployments = this.getFailureDeployments(relevantDeployments, severityIncidentList)
      const failureRate = relevantDeployments.length > 0 
        ? (failureDeployments.length / relevantDeployments.length) * 100 
        : 0
      result[severity] = Math.round(failureRate * 100) / 100
    }

    return result
  }

  /**
   * Get failure statistics
   */
  getFailureStatistics(deployments: DeploymentEvent[], incidents: IncidentEvent[]): {
    totalDeployments: number
    failureDeployments: number
    failureRate: number
    incidentsBySeverity: Record<string, number>
    averageIncidentsPerFailure: number
    mttrForFailures: number // hours
  } {
    const relevantDeployments = deployments.filter(deployment => 
      this.config.environments.includes(deployment.environment)
    )

    const failureDeployments = this.getFailureDeployments(relevantDeployments, incidents)
    const failureRate = relevantDeployments.length > 0 
      ? (failureDeployments.length / relevantDeployments.length) * 100 
      : 0

    // Count incidents by severity
    const incidentsBySeverity: Record<string, number> = {}
    incidents.forEach(incident => {
      incidentsBySeverity[incident.severity] = (incidentsBySeverity[incident.severity] || 0) + 1
    })

    // Calculate average incidents per failure
    const averageIncidentsPerFailure = failureDeployments.length > 0 
      ? incidents.length / failureDeployments.length 
      : 0

    // Calculate MTTR for failure-related incidents
    const resolvedFailureIncidents = incidents.filter(incident => incident.resolvedAt)
    const mttrForFailures = resolvedFailureIncidents.length > 0 
      ? this.calculateAverageMTTR(resolvedFailureIncidents)
      : 0

    return {
      totalDeployments: relevantDeployments.length,
      failureDeployments: failureDeployments.length,
      failureRate: Math.round(failureRate * 100) / 100,
      incidentsBySeverity,
      averageIncidentsPerFailure: Math.round(averageIncidentsPerFailure * 100) / 100,
      mttrForFailures: Math.round(mttrForFailures * 100) / 100
    }
  }

  /**
   * Get failure patterns and insights
   */
  getFailurePatterns(deployments: DeploymentEvent[], incidents: IncidentEvent[]): {
    mostFailureProneServices: Array<{ service: string, failureRate: number, failureCount: number }>
    commonFailureTimes: Array<{ hour: number, failureCount: number }>
    failureHotspots: Array<{ date: string, failureCount: number, deploymentCount: number }>
  } {
    const relevantDeployments = deployments.filter(deployment => 
      this.config.environments.includes(deployment.environment)
    )

    // Most failure-prone services
    const serviceFailureRates = this.getFailureRateByService(relevantDeployments, incidents)
    const serviceFailureCounts = new Map<string, number>()
    
    incidents.forEach(incident => {
      serviceFailureCounts.set(incident.service, (serviceFailureCounts.get(incident.service) || 0) + 1)
    })

    const mostFailureProneServices = Object.entries(serviceFailureRates)
      .map(([service, failureRate]) => ({
        service,
        failureRate,
        failureCount: serviceFailureCounts.get(service) || 0
      }))
      .sort((a, b) => b.failureRate - a.failureRate)
      .slice(0, 5)

    // Common failure times (by hour of day)
    const hourlyFailures = new Map<number, number>()
    incidents.forEach(incident => {
      const hour = new Date(incident.detectedAt).getHours()
      hourlyFailures.set(hour, (hourlyFailures.get(hour) || 0) + 1)
    })

    const commonFailureTimes = Array.from(hourlyFailures.entries())
      .map(([hour, failureCount]) => ({ hour, failureCount }))
      .sort((a, b) => b.failureCount - a.failureCount)
      .slice(0, 5)

      // Failure hotspots (dates with high failure rates)
    const dailyFailures = new Map<string, number>()
    const dailyDeployments = new Map<string, number>()

    incidents.forEach(incident => {
      const date = (incident.detectedAt || '').split('T')[0]
      if (date) {
        dailyFailures.set(date, (dailyFailures.get(date) || 0) + 1)
      }
    })

    deployments.forEach(deployment => {
      const date = (deployment.timestamp || '').split('T')[0]
      if (date) {
        dailyDeployments.set(date, (dailyDeployments.get(date) || 0) + 1)
      }
    })

    const failureHotspots = Array.from(dailyFailures.keys()).map(date => ({
      date,
      failureCount: dailyFailures.get(date) || 0,
      deploymentCount: dailyDeployments.get(date) || 0,
      failureRate: dailyDeployments.get(date) ? (dailyFailures.get(date)! / dailyDeployments.get(date)!) * 100 : 0
    }))
      .filter(hotspot => hotspot.failureCount > 0)
      .sort((a, b) => b.failureRate - a.failureRate)
      .slice(0, 10)

    return {
      mostFailureProneServices,
      commonFailureTimes,
      failureHotspots
    }
  }

  private getFailureDeployments(deployments: DeploymentEvent[], incidents: IncidentEvent[]): DeploymentEvent[] {
    const failureDeployments = new Set<DeploymentEvent>()

    // Method 1: Direct deployment failures
    deployments.forEach(deployment => {
      if (deployment.status === 'failure') {
        failureDeployments.add(deployment)
      }
    })

    // Method 2: Incidents within time window after deployment
    incidents.forEach(incident => {
      const incidentTime = new Date(incident.detectedAt).getTime()
      
      deployments.forEach(deployment => {
        const deploymentTime = new Date(deployment.timestamp).getTime()
        const timeDiff = incidentTime - deploymentTime
        
        // Consider incident related to deployment if it occurs within 24 hours
        if (timeDiff >= 0 && timeDiff <= 24 * 60 * 60 * 1000) {
          failureDeployments.add(deployment)
        }
      })
    })

    return Array.from(failureDeployments)
  }

  private calculateAverageMTTR(resolvedIncidents: IncidentEvent[]): number {
    const mttrValues = resolvedIncidents.map(incident => {
      const detectedTime = new Date(incident.detectedAt).getTime()
      const resolvedTime = new Date(incident.resolvedAt!).getTime()
      return (resolvedTime - detectedTime) / (1000 * 60 * 60) // Convert to hours
    })

    const averageMTTR = mttrValues.reduce((sum, mttr) => sum + mttr, 0) / mttrValues.length
    return averageMTTR
  }
}
