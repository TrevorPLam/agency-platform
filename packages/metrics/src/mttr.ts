import type {
  MetricsConfig,
  IncidentEvent
} from './types'

/**
 * Mean Time to Recovery (MTTR) Tracker
 * 
 * Calculates the MTTR metric based on the average time to restore
 * service after deployment failures and incidents.
 */
export class MTTRTracker {
  private config: MetricsConfig

  constructor(config: MetricsConfig) {
    this.config = config
  }

  /**
   * Calculate Mean Time to Recovery (in hours)
   */
  async calculate(incidents: IncidentEvent[]): Promise<number> {
    // Filter incidents based on configuration
    const relevantIncidents = incidents.filter(incident => 
      this.config.services.length === 0 || this.config.services.includes(incident.service)
    ).filter(incident => incident.resolvedAt) // Only include resolved incidents

    if (relevantIncidents.length === 0) {
      return 0
    }

    // Calculate MTTR for each incident
    const mttrValues = relevantIncidents.map(incident => this.calculateIncidentMTTR(incident))

    // Return average MTTR in hours
    const averageMTTR = mttrValues.reduce((sum, mttr) => sum + mttr, 0) / mttrValues.length

    return Math.round(averageMTTR * 100) / 100 // Round to 2 decimal places
  }

  /**
   * Get MTTR trend over time
   */
  getMTTRTrend(incidents: IncidentEvent[]): Array<{
    date: string
    mttr: number
    incidentCount: number
  }> {
    // Group resolved incidents by resolution date
    const dailyMTTR = new Map<string, number[]>()

    incidents
      .filter(incident => incident.resolvedAt)
      .forEach(incident => {
        const date = (incident.resolvedAt || '').split('T')[0]
        const mttr = this.calculateIncidentMTTR(incident)
        
        if (date && !dailyMTTR.has(date)) {
          dailyMTTR.set(date, [])
        }
        if (date) {
          dailyMTTR.get(date)!.push(mttr)
        }
      })

    // Calculate daily average MTTR
    const trend = []
    for (const [date, mttrValues] of dailyMTTR.entries()) {
      const averageMTTR = mttrValues.reduce((sum, mttr) => sum + mttr, 0) / mttrValues.length
      
      trend.push({
        date,
        mttr: Math.round(averageMTTR * 100) / 100,
        incidentCount: mttrValues.length
      })
    }

    return trend.sort((a, b) => a.date.localeCompare(b.date))
  }

  /**
   * Get MTTR by service
   */
  getMTTRByService(incidents: IncidentEvent[]): Record<string, number> {
    const serviceMTTR = new Map<string, number[]>()

    incidents
      .filter(incident => incident.resolvedAt)
      .forEach(incident => {
        const mttr = this.calculateIncidentMTTR(incident)
        
        if (!serviceMTTR.has(incident.service)) {
          serviceMTTR.set(incident.service, [])
        }
        serviceMTTR.get(incident.service)!.push(mttr)
      })

    const result: Record<string, number> = {}
    for (const [service, mttrValues] of serviceMTTR.entries()) {
      const averageMTTR = mttrValues.reduce((sum, mttr) => sum + mttr, 0) / mttrValues.length
      result[service] = Math.round(averageMTTR * 100) / 100
    }

    return result
  }

  /**
   * Get MTTR by severity
   */
  getMTTRBySeverity(incidents: IncidentEvent[]): Record<string, number> {
    const severityMTTR = new Map<string, number[]>()

    incidents
      .filter(incident => incident.resolvedAt)
      .forEach(incident => {
        const mttr = this.calculateIncidentMTTR(incident)
        
        if (!severityMTTR.has(incident.severity)) {
          severityMTTR.set(incident.severity, [])
        }
        severityMTTR.get(incident.severity)!.push(mttr)
      })

    const result: Record<string, number> = {}
    for (const [severity, mttrValues] of severityMTTR.entries()) {
      const averageMTTR = mttrValues.reduce((sum, mttr) => sum + mttr, 0) / mttrValues.length
      result[severity] = Math.round(averageMTTR * 100) / 100
    }

    return result
  }

  /**
   * Get MTTR statistics
   */
  getMTTRStatistics(incidents: IncidentEvent[]): {
    average: number
    median: number
    p95: number
    p99: number
    min: number
    max: number
    sampleSize: number
    unresolvedCount: number
  } {
    const resolvedIncidents = incidents.filter(incident => incident.resolvedAt)
    
    if (resolvedIncidents.length === 0) {
      return {
        average: 0,
        median: 0,
        p95: 0,
        p99: 0,
        min: 0,
        max: 0,
        sampleSize: 0,
        unresolvedCount: incidents.length - resolvedIncidents.length
      }
    }

    const mttrValues = resolvedIncidents.map(incident => this.calculateIncidentMTTR(incident))
    mttrValues.sort((a, b) => a - b)

    const average = mttrValues.reduce((sum, mttr) => sum + mttr, 0) / mttrValues.length
    const median = this.getPercentile(mttrValues, 50)
    const p95 = this.getPercentile(mttrValues, 95)
    const p99 = this.getPercentile(mttrValues, 99)
    const min = mttrValues[0]
    const max = mttrValues[mttrValues.length - 1]

    return {
      average: Math.round(average * 100) / 100,
      median: Math.round(median * 100) / 100,
      p95: Math.round(p95 * 100) / 100,
      p99: Math.round(p99 * 100) / 100,
      min: Math.round((min || 0) * 100) / 100,
      max: Math.round((max || 0) * 100) / 100,
      sampleSize: resolvedIncidents.length,
      unresolvedCount: incidents.length - resolvedIncidents.length
    }
  }

  /**
   * Get recovery time patterns
   */
  getRecoveryPatterns(incidents: IncidentEvent[]): {
    fastestRecoveries: Array<{ service: string, severity: string, mttr: number, description: string }>
    slowestRecoveries: Array<{ service: string, severity: string, mttr: number, description: string }>
    recoveryByHourOfDay: Array<{ hour: number, averageMTTR: number, incidentCount: number }>
    recoveryByDayOfWeek: Array<{ day: number, averageMTTR: number, incidentCount: number }>
  } {
    const resolvedIncidents = incidents.filter(incident => incident.resolvedAt)

    // Fastest recoveries
    const fastestRecoveries = resolvedIncidents
      .map(incident => ({
        service: incident.service,
        severity: incident.severity,
        mttr: this.calculateIncidentMTTR(incident),
        description: incident.description
      }))
      .sort((a, b) => a.mttr - b.mttr)
      .slice(0, 5)
      .map(item => ({ ...item, mttr: Math.round(item.mttr * 100) / 100 }))

    // Slowest recoveries
    const slowestRecoveries = resolvedIncidents
      .map(incident => ({
        service: incident.service,
        severity: incident.severity,
        mttr: this.calculateIncidentMTTR(incident),
        description: incident.description
      }))
      .sort((a, b) => b.mttr - a.mttr)
      .slice(0, 5)
      .map(item => ({ ...item, mttr: Math.round(item.mttr * 100) / 100 }))

    // Recovery by hour of day
    const hourlyMTTR = new Map<number, number[]>()
    resolvedIncidents.forEach(incident => {
      const hour = new Date(incident.resolvedAt!).getHours()
      const mttr = this.calculateIncidentMTTR(incident)
      
      if (!hourlyMTTR.has(hour)) {
        hourlyMTTR.set(hour, [])
      }
      hourlyMTTR.get(hour)!.push(mttr)
    })

    const recoveryByHourOfDay = Array.from(hourlyMTTR.entries())
      .map(([hour, mttrValues]) => ({
        hour,
        averageMTTR: Math.round((mttrValues.reduce((sum, mttr) => sum + mttr, 0) / mttrValues.length) * 100) / 100,
        incidentCount: mttrValues.length
      }))
      .sort((a, b) => a.hour - b.hour)

    // Recovery by day of week
    const dailyMTTR = new Map<number, number[]>()
    resolvedIncidents.forEach(incident => {
      const day = new Date(incident.resolvedAt!).getDay()
      const mttr = this.calculateIncidentMTTR(incident)
      
      if (!dailyMTTR.has(day)) {
        dailyMTTR.set(day, [])
      }
      dailyMTTR.get(day)!.push(mttr)
    })

    const recoveryByDayOfWeek = Array.from(dailyMTTR.entries())
      .map(([day, mttrValues]) => ({
        day,
        averageMTTR: Math.round((mttrValues.reduce((sum, mttr) => sum + mttr, 0) / mttrValues.length) * 100) / 100,
        incidentCount: mttrValues.length
      }))
      .sort((a, b) => a.day - b.day)

    return {
      fastestRecoveries,
      slowestRecoveries,
      recoveryByHourOfDay,
      recoveryByDayOfWeek
    }
  }

  /**
   * Get incident resolution efficiency
   */
  getResolutionEfficiency(incidents: IncidentEvent[]): {
    resolutionRate: number
    averageResolutionTime: number
    unresolvedIncidents: Array<{
      id: string
      service: string
      severity: string
      detectedAt: string
      duration: number // hours since detection
    }>
  } {
    const resolvedIncidents = incidents.filter(incident => incident.resolvedAt)
    const unresolvedIncidents = incidents.filter(incident => !incident.resolvedAt)

    const resolutionRate = incidents.length > 0 ? (resolvedIncidents.length / incidents.length) * 100 : 100

    let averageResolutionTime = 0
    if (resolvedIncidents.length > 0) {
      const resolutionTimes = resolvedIncidents.map(incident => this.calculateIncidentMTTR(incident))
      averageResolutionTime = resolutionTimes.reduce((sum, time) => sum + time, 0) / resolutionTimes.length
    }

    const unresolvedDetails = unresolvedIncidents.map(incident => ({
      id: incident.id,
      service: incident.service,
      severity: incident.severity,
      detectedAt: incident.detectedAt,
      duration: (new Date().getTime() - new Date(incident.detectedAt).getTime()) / (1000 * 60 * 60)
    }))

    return {
      resolutionRate: Math.round(resolutionRate * 100) / 100,
      averageResolutionTime: Math.round(averageResolutionTime * 100) / 100,
      unresolvedIncidents: unresolvedDetails
    }
  }

  private calculateIncidentMTTR(incident: IncidentEvent): number {
    if (!incident.resolvedAt) {
      return 0
    }

    const detectedTime = new Date(incident.detectedAt).getTime()
    const resolvedTime = new Date(incident.resolvedAt).getTime()
    
    return (resolvedTime - detectedTime) / (1000 * 60 * 60) // Convert to hours
  }

  private getPercentile(sortedArray: number[], percentile: number): number {
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1
    return sortedArray[Math.max(0, Math.min(index, sortedArray.length - 1))] || 0
  }
}
