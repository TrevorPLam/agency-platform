/**
 * Security Monitoring Module
 *
 * Real-time security monitoring, metrics calculation, and threat detection
 * following 2026 security monitoring best practices.
 */

import { SecurityEvent, SecurityEventType, SecuritySeverity, SecurityMetrics } from './security-events'
import { SecurityAlert, SecurityAlertType } from './security-alerting'

/**
 * Security monitoring configuration
 */
export interface SecurityMonitoringConfig {
  retentionPeriod: number // days
  aggregationInterval: number // minutes
  alertThresholds: {
    criticalEventsPerHour: number
    highEventsPerHour: number
    suspiciousActivityThreshold: number
    riskScoreThreshold: number
  }
  compliance: {
    logAllEvents: boolean
    excludeSensitiveData: boolean
    dataRetentionDays: number
  }
}

/**
 * Threat intelligence data
 */
export interface ThreatIntelligence {
  iocs: IndicatorOfCompromise[]
  patterns: ThreatPattern[]
  signatures: ThreatSignature[]
  lastUpdated: string
}

/**
 * Indicator of Compromise
 */
export interface IndicatorOfCompromise {
  id: string
  type: 'ip' | 'domain' | 'hash' | 'url' | 'email'
  value: string
  severity: SecuritySeverity
  description: string
  source: string
  confidence: number
  expiresAt?: string
}

/**
 * Threat pattern definition
 */
export interface ThreatPattern {
  id: string
  name: string
  description: string
  eventType: SecurityEventType
  pattern: {
    timeWindow: number // minutes
    count: number
    conditions: ThreatPatternCondition[]
  }
  severity: SecuritySeverity
  mitigation: string
}

/**
 * Threat pattern condition
 */
export interface ThreatPatternCondition {
  field: string
  operator: 'equals' | 'contains' | 'regex' | 'range'
  value: string | number | RegExp
  weight: number
}

/**
 * Threat signature
 */
export interface ThreatSignature {
  id: string
  name: string
  pattern: RegExp
  severity: SecuritySeverity
  category: 'malware' | 'exploit' | 'reconnaissance' | 'persistence'
}

/**
 * Security monitoring engine
 */
export class SecurityMonitoringEngine {
  private config: SecurityMonitoringConfig
  private eventStore: SecurityEvent[] = []
  private alertStore: SecurityAlert[] = []
  private threatIntel: ThreatIntelligence
  private metricsCache: Map<string, SecurityMetrics> = new Map()
  private processing = false

  constructor(config?: Partial<SecurityMonitoringConfig>) {
    this.config = {
      retentionPeriod: 90,
      aggregationInterval: 5,
      alertThresholds: {
        criticalEventsPerHour: 5,
        highEventsPerHour: 20,
        suspiciousActivityThreshold: 50,
        riskScoreThreshold: 75,
      },
      compliance: {
        logAllEvents: true,
        excludeSensitiveData: true,
        dataRetentionDays: 30,
      },
      ...config,
    }

    this.threatIntel = this.initializeThreatIntelligence()
  }

  /**
   * Initialize threat intelligence data
   */
  private initializeThreatIntelligence(): ThreatIntelligence {
    return {
      iocs: [
        // Example malicious IPs (would be updated from threat feeds)
        {
          id: 'ioc-001',
          type: 'ip',
          value: '192.0.2.0/24',
          severity: 'high',
          description: 'Known malicious IP range',
          source: 'internal-threat-feed',
          confidence: 0.9,
        },
      ],
      patterns: [
        {
          id: 'pattern-001',
          name: 'Rapid Authentication Failures',
          description: 'Multiple authentication failures from same IP within short time',
          eventType: SecurityEventType.AUTH_FAILURE,
          pattern: {
            timeWindow: 10,
            count: 5,
            conditions: [
              { field: 'source.ip', operator: 'equals', value: '', weight: 1.0 },
            ],
          },
          severity: 'high',
          mitigation: 'Block IP and require additional authentication',
        },
        {
          id: 'pattern-002',
          name: 'Cross-Tenant Access Attempts',
          description: 'Attempts to access data from different tenants',
          eventType: SecurityEventType.CROSS_TENANT_ACCESS,
          pattern: {
            timeWindow: 5,
            count: 1,
            conditions: [
              { field: 'actor.tenantId', operator: 'not_equals', value: '', weight: 1.0 },
            ],
          },
          severity: 'critical',
          mitigation: 'Immediate IP blocking and security investigation',
        },
      ],
      signatures: [
        {
          id: 'sig-001',
          name: 'SQL Injection Pattern',
          pattern: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC)\b)/i,
          severity: 'high',
          category: 'exploit',
        },
        {
          id: 'sig-002',
          name: 'XSS Pattern',
          pattern: /(<script|javascript:|on\w+\s*=)/i,
          severity: 'medium',
          category: 'exploit',
        },
      ],
      lastUpdated: new Date().toISOString(),
    }
  }

  /**
   * Add security events to monitoring
   */
  public async addEvents(events: SecurityEvent[]): Promise<void> {
    // Enrich events with threat intelligence
    const enrichedEvents = await this.enrichEvents(events)

    // Store events
    this.eventStore.push(...enrichedEvents)

    // Apply retention policy
    this.applyRetentionPolicy()

    // Clear metrics cache
    this.metricsCache.clear()
  }

  /**
   * Enrich events with threat intelligence
   */
  private async enrichEvents(events: SecurityEvent[]): Promise<SecurityEvent[]> {
    return events.map(event => {
      const enrichedEvent = { ...event }

      // Check against IOCs
      const iocMatch = this.checkIOCs(event)
      if (iocMatch) {
        enrichedEvent.threat = {
          ioc: iocMatch.id,
          pattern: iocMatch.description,
          confidence: iocMatch.confidence,
          source: iocMatch.source,
        }
        enrichedEvent.severity = this.maxSeverity(enrichedEvent.severity, iocMatch.severity)
      }

      // Check against threat signatures
      const signatureMatch = this.checkSignatures(event)
      if (signatureMatch) {
        enrichedEvent.threat = {
          ...enrichedEvent.threat,
          pattern: signatureMatch.name,
          confidence: 0.8,
          source: 'threat-signatures',
        }
        enrichedEvent.severity = this.maxSeverity(enrichedEvent.severity, signatureMatch.severity)
      }

      return enrichedEvent
    })
  }

  /**
   * Check event against indicators of compromise
   */
  private checkIOCs(event: SecurityEvent): IndicatorOfCompromise | null {
    for (const ioc of this.threatIntel.iocs) {
      if (ioc.expiresAt && new Date(ioc.expiresAt) < new Date()) {
        continue // Skip expired IOCs
      }

      switch (ioc.type) {
        case 'ip':
          if (this.matchesIP(event.source.ip, ioc.value)) {
            return ioc
          }
          break
        // Add other IOC types as needed
      }
    }

    return null
  }

  /**
   * Check if IP matches IOC pattern
   */
  private matchesIP(eventIP: string, iocPattern: string): boolean {
    // Simple IP matching (would be enhanced with proper CIDR matching)
    return eventIP === iocPattern || iocPattern.includes('/')
  }

  /**
   * Check event against threat signatures
   */
  private checkSignatures(event: SecurityEvent): ThreatSignature | null {
    // Check relevant fields for signature matches
    const fieldsToCheck = [
      event.description,
      event.context.error,
      event.context.metadata?.toString(),
    ].filter(Boolean)

    for (const signature of this.threatIntel.signatures) {
      for (const field of fieldsToCheck) {
        if (signature.pattern.test(field as string)) {
          return signature
        }
      }
    }

    return null
  }

  /**
   * Get maximum severity level
   */
  private maxSeverity(severity1: SecuritySeverity, severity2: SecuritySeverity): SecuritySeverity {
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
    const level1 = severityOrder[severity1]
    const level2 = severityOrder[severity2]

    return level1 >= level2 ? severity1 : severity2
  }

  /**
   * Apply retention policy
   */
  private applyRetentionPolicy(): void {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionPeriod)

    this.eventStore = this.eventStore.filter(event =>
      new Date(event.timestamp) >= cutoffDate
    )

    this.alertStore = this.alertStore.filter(alert =>
      new Date(alert.timestamp) >= cutoffDate
    )
  }

  /**
   * Calculate security metrics
   */
  public calculateMetrics(tenantId?: string, timeRange?: { start: string; end: string }): SecurityMetrics {
    const cacheKey = `${tenantId || 'all'}_${timeRange?.start || 'all'}`

    if (this.metricsCache.has(cacheKey)) {
      return this.metricsCache.get(cacheKey)!
    }

    const now = new Date()
    const defaultEnd = now.toISOString()
    const defaultStart = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString() // 24 hours ago

    const timeRangeObj = {
      start: timeRange?.start || defaultStart,
      end: timeRange?.end || defaultEnd,
    }

    const metrics: SecurityMetrics = {
      timeRange: timeRangeObj,
      tenantId,

      // Filter events by time range and tenant
      events: this.eventStore.filter(event => {
        const eventTime = new Date(event.timestamp)
        const afterStart = eventTime >= new Date(timeRangeObj.start)
        const beforeEnd = eventTime <= new Date(timeRangeObj.end)
        const tenantMatch = !tenantId || event.actor.tenantId === tenantId

        return afterStart && beforeEnd && tenantMatch
      }),
    }

    // Calculate event counts by severity
    metrics.totalEvents = metrics.events.length
    metrics.criticalEvents = metrics.events.filter(e => e.severity === 'critical').length
    metrics.highEvents = metrics.events.filter(e => e.severity === 'high').length
    metrics.mediumEvents = metrics.events.filter(e => e.severity === 'medium').length
    metrics.lowEvents = metrics.events.filter(e => e.severity === 'low').length

    // Calculate alert status
    const recentAlerts = this.alertStore.filter(alert =>
      new Date(alert.timestamp) >= new Date(metrics.timeRange.start) &&
      new Date(alert.timestamp) <= new Date(metrics.timeRange.end) &&
      (!tenantId || alert.tenantId === tenantId)
    )

    metrics.activeAlerts = recentAlerts.filter(a => a.status === 'active').length
    metrics.acknowledgedAlerts = recentAlerts.filter(a => a.status === 'acknowledged').length
    metrics.resolvedAlerts = recentAlerts.filter(a => a.status === 'resolved').length

    // Calculate security KPIs
    const authEvents = metrics.events.filter(e =>
      e.eventType === SecurityEventType.AUTH_FAILURE
    )
    const totalAuthEvents = authEvents.length +
      metrics.events.filter(e => e.eventType === SecurityEventType.AUTH_SUCCESS).length

    metrics.authenticationFailureRate = totalAuthEvents > 0
      ? (authEvents.length / totalAuthEvents) * 100
      : 0

    const rateLimitEvents = metrics.events.filter(e =>
      e.eventType === SecurityEventType.RATE_LIMIT_EXCEEDED
    )
    metrics.rateLimitViolationRate = metrics.totalEvents > 0
      ? (rateLimitEvents.length / metrics.totalEvents) * 100
      : 0

    const suspiciousEvents = metrics.events.filter(e =>
      [
        SecurityEventType.ABNORMAL_BEHAVIOR_PATTERN,
        SecurityEventType.SUSPICIOUS_USER_AGENT,
        SecurityEventType.GEOLOCATION_ANOMALY,
      ].includes(e.eventType)
    )
    metrics.suspiciousActivityRate = metrics.totalEvents > 0
      ? (suspiciousEvents.length / metrics.totalEvents) * 100
      : 0

    const dataAccessEvents = metrics.events.filter(e =>
      [
        SecurityEventType.DATA_ACCESS_ANOMALY,
        SecurityEventType.SENSITIVE_DATA_ACCESS,
        SecurityEventType.DATA_EXFILTRATION_ATTEMPT,
      ].includes(e.eventType)
    )
    metrics.dataAccessAnomalyRate = metrics.totalEvents > 0
      ? (dataAccessEvents.length / metrics.totalEvents) * 100
      : 0

    // Calculate trends (hourly data points)
    metrics.trends = this.calculateTrends(metrics.events, metrics.timeRange)

    // Calculate risk assessment
    metrics.riskScore = this.calculateOverallRiskScore(metrics)
    metrics.riskLevel = this.determineRiskLevel(metrics.riskScore)

    // Cache the metrics
    this.metricsCache.set(cacheKey, metrics)

    return metrics
  }

  /**
   * Calculate hourly trends
   */
  private calculateTrends(events: SecurityEvent[], timeRange: { start: string; end: string }) {
    const hours = 24 // 24-hour trends
    const interval = (new Date(timeRange.end).getTime() - new Date(timeRange.start).getTime()) / hours

    const trends = {
      authenticationFailures: [] as number[],
      rateLimitViolations: [] as number[],
      suspiciousActivity: [] as number[],
      dataAccessAnomalies: [] as number[],
      timestamps: [] as string[],
    }

    for (let i = 0; i < hours; i++) {
      const hourStart = new Date(new Date(timeRange.start).getTime() + (i * interval))
      const hourEnd = new Date(hourStart.getTime() + interval)

      const hourEvents = events.filter(event => {
        const eventTime = new Date(event.timestamp)
        return eventTime >= hourStart && eventTime < hourEnd
      })

      trends.authenticationFailures.push(
        hourEvents.filter(e => e.eventType === SecurityEventType.AUTH_FAILURE).length
      )
      trends.rateLimitViolations.push(
        hourEvents.filter(e => e.eventType === SecurityEventType.RATE_LIMIT_EXCEEDED).length
      )
      trends.suspiciousActivity.push(
        hourEvents.filter(e => [
          SecurityEventType.ABNORMAL_BEHAVIOR_PATTERN,
          SecurityEventType.SUSPICIOUS_USER_AGENT,
          SecurityEventType.GEOLOCATION_ANOMALY,
        ].includes(e.eventType)).length
      )
      trends.dataAccessAnomalies.push(
        hourEvents.filter(e => [
          SecurityEventType.DATA_ACCESS_ANOMALY,
          SecurityEventType.SENSITIVE_DATA_ACCESS,
          SecurityEventType.DATA_EXFILTRATION_ATTEMPT,
        ].includes(e.eventType)).length
      )
      trends.timestamps.push(hourStart.toISOString())
    }

    return trends
  }

  /**
   * Calculate overall risk score
   */
  private calculateOverallRiskScore(metrics: SecurityMetrics): number {
    // Base score from event counts
    const severityWeights = { critical: 10, high: 5, medium: 2, low: 1 }
    const eventScore =
      metrics.criticalEvents * severityWeights.critical +
      metrics.highEvents * severityWeights.high +
      metrics.mediumEvents * severityWeights.medium +
      metrics.lowEvents * severityWeights.low

    // Alert impact
    const alertScore =
      metrics.activeAlerts * 8 +
      metrics.acknowledgedAlerts * 3

    // KPI impact
    const kpiScore =
      metrics.authenticationFailureRate * 0.5 +
      metrics.rateLimitViolationRate * 0.3 +
      metrics.suspiciousActivityRate * 0.4 +
      metrics.dataAccessAnomalyRate * 0.6

    // Normalize to 0-100 scale
    const rawScore = eventScore + alertScore + kpiScore
    const normalizedScore = Math.min((rawScore / 20) * 100, 100) // Scale factor adjusted for typical ranges

    return Math.round(normalizedScore)
  }

  /**
   * Determine risk level from score
   */
  private determineRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 80) return 'critical'
    if (score >= 60) return 'high'
    if (score >= 40) return 'medium'
    return 'low'
  }

  /**
   * Detect threat patterns
   */
  public detectThreatPatterns(tenantId?: string): ThreatPattern[] {
    const detectedPatterns: ThreatPattern[] = []
    const events = tenantId
      ? this.eventStore.filter(e => e.actor.tenantId === tenantId)
      : this.eventStore

    for (const pattern of this.threatIntel.patterns) {
      const matchingEvents = events.filter(event =>
        event.eventType === pattern.eventType &&
        this.matchesPatternConditions(event, pattern.pattern.conditions)
      )

      if (matchingEvents.length >= pattern.pattern.count) {
        detectedPatterns.push({
          ...pattern,
          description: `${pattern.description} - ${matchingEvents.length} events detected`,
        })
      }
    }

    return detectedPatterns
  }

  /**
   * Check if event matches pattern conditions
   */
  private matchesPatternConditions(event: SecurityEvent, conditions: ThreatPatternCondition[]): boolean {
    return conditions.every(condition => {
      const fieldValue = this.getFieldValue(event, condition.field)

      switch (condition.operator) {
        case 'equals':
          return fieldValue === condition.value
        case 'contains':
          return typeof fieldValue === 'string' &&
                 (fieldValue as string).includes(condition.value as string)
        case 'regex':
          return typeof fieldValue === 'string' &&
                 (condition.value as RegExp).test(fieldValue)
        case 'range':
          if (typeof fieldValue === 'number' && Array.isArray(condition.value)) {
            const [min, max] = condition.value as number[]
            return fieldValue >= min && fieldValue <= max
          }
          return false
        default:
          return false
      }
    })
  }

  /**
   * Get field value from event
   */
  private getFieldValue(event: SecurityEvent, field: string): unknown {
    const parts = field.split('.')
    let value: unknown = event

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = (value as Record<string, unknown>)[part]
      } else {
        return undefined
      }
    }

    return value
  }

  /**
   * Get security alerts
   */
  public getAlerts(tenantId?: string, status?: SecurityAlert['status']): SecurityAlert[] {
    return this.alertStore.filter(alert => {
      const tenantMatch = !tenantId || alert.tenantId === tenantId
      const statusMatch = !status || alert.status === status
      return tenantMatch && statusMatch
    })
  }

  /**
   * Add security alert
   */
  public addAlert(alert: SecurityAlert): void {
    this.alertStore.push(alert)
    this.metricsCache.clear()
  }

  /**
   * Update alert status
   */
  public updateAlertStatus(alertId: string, status: SecurityAlert['status']): boolean {
    const alert = this.alertStore.find(a => a.id === alertId)
    if (alert) {
      alert.status = status
      this.metricsCache.clear()
      return true
    }
    return false
  }

  /**
   * Get threat intelligence
   */
  public getThreatIntelligence(): ThreatIntelligence {
    return this.threatIntel
  }

  /**
   * Update threat intelligence
   */
  public updateThreatIntelligence(update: Partial<ThreatIntelligence>): void {
    this.threatIntel = {
      ...this.threatIntel,
      ...update,
      lastUpdated: new Date().toISOString(),
    }
  }

  /**
   * Get monitoring configuration
   */
  public getConfig(): SecurityMonitoringConfig {
    return { ...this.config }
  }

  /**
   * Update monitoring configuration
   */
  public updateConfig(config: Partial<SecurityMonitoringConfig>): void {
    this.config = { ...this.config, ...config }
  }
}

// Global monitoring engine instance
export const securityMonitoringEngine = new SecurityMonitoringEngine()

/**
 * Calculate security metrics
 */
export function calculateSecurityMetrics(tenantId?: string, timeRange?: { start: string; end: string }): SecurityMetrics {
  return securityMonitoringEngine.calculateMetrics(tenantId, timeRange)
}

/**
 * Detect threat patterns
 */
export function detectThreatPatterns(tenantId?: string): ThreatPattern[] {
  return securityMonitoringEngine.detectThreatPatterns(tenantId)
}

/**
 * Get security alerts
 */
export function getSecurityAlerts(tenantId?: string, status?: SecurityAlert['status']): SecurityAlert[] {
  return securityMonitoringEngine.getAlerts(tenantId, status)
}
