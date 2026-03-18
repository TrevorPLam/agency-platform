/**
 * Security Alerting System
 * 
 * Real-time security alert processing and management
 * following 2026 security monitoring best practices.
 */

import { SecurityEvent, SecurityEventType, SecuritySeverity, SecurityAlert, SecurityAlertType } from './security-events'

/**
 * Alert rule configuration
 */
export interface AlertRule {
  id: string
  name: string
  description: string
  enabled: boolean
  severity: SecuritySeverity
  type: SecurityAlertType
  conditions: AlertCondition[]
  threshold: AlertThreshold
  actions: AlertAction[]
  cooldown: number // minutes
  tenantSpecific?: boolean
}

/**
 * Alert condition interface
 */
export interface AlertCondition {
  field: keyof SecurityEvent | string
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'in' | 'not_in'
  value: unknown | unknown[]
  caseSensitive?: boolean
}

/**
 * Alert threshold configuration
 */
export interface AlertThreshold {
  count: number
  timeWindow: number // minutes
  aggregation: 'count' | 'unique_users' | 'unique_ips' | 'unique_tenants'
}

/**
 * Alert action configuration
 */
export interface AlertAction {
  type: 'webhook' | 'email' | 'slack' | 'dashboard' | 'block_ip' | 'require_mfa'
  config: Record<string, unknown>
  enabled: boolean
}

/**
 * Alert processing result
 */
export interface AlertProcessingResult {
  alertsCreated: SecurityAlert[]
  alertsTriggered: string[]
  eventsProcessed: number
  errors: string[]
}

/**
 * Security alerting engine
 */
export class SecurityAlertingEngine {
  private rules: Map<string, AlertRule> = new Map()
  private alertHistory: Map<string, number[]> = new Map() // ruleId -> timestamps
  private eventBuffer: SecurityEvent[] = []
  private processing = false

  constructor() {
    this.initializeDefaultRules()
  }

  /**
   * Initialize default security alert rules
   */
  private initializeDefaultRules(): void {
    const defaultRules: AlertRule[] = [
      // Brute Force Attack Detection
      {
        id: 'brute-force-attack',
        name: 'Brute Force Attack Detection',
        description: 'Detects multiple authentication failures from same IP',
        enabled: true,
        severity: 'high',
        type: SecurityAlertType.BRUTE_FORCE_ATTACK,
        conditions: [
          { field: 'eventType', operator: 'equals', value: SecurityEventType.AUTH_FAILURE },
          { field: 'source.ip', operator: 'not_equals', value: '' },
        ],
        threshold: { count: 10, timeWindow: 15, aggregation: 'count' },
        actions: [
          { type: 'dashboard', config: {}, enabled: true },
          { type: 'block_ip', config: { duration: 300 }, enabled: false }, // Disabled by default
        ],
        cooldown: 30,
      },

      // Suspicious Login Pattern
      {
        id: 'suspicious-login-pattern',
        name: 'Suspicious Login Pattern',
        description: 'Detects unusual login patterns',
        enabled: true,
        severity: 'medium',
        type: SecurityAlertType.SUSPICIOUS_LOGIN_PATTERN,
        conditions: [
          { field: 'eventType', operator: 'in', value: [SecurityEventType.AUTH_FAILURE, SecurityEventType.MFA_FAILURE] },
        ],
        threshold: { count: 5, timeWindow: 60, aggregation: 'unique_ips' },
        actions: [
          { type: 'dashboard', config: {}, enabled: true },
          { type: 'require_mfa', config: {}, enabled: true },
        ],
        cooldown: 60,
      },

      // Rate Limit Abuse
      {
        id: 'rate-limit-abuse',
        name: 'Rate Limit Abuse',
        description: 'Detects excessive rate limit violations',
        enabled: true,
        severity: 'high',
        type: SecurityAlertType.RATE_LIMIT_ABUSE,
        conditions: [
          { field: 'eventType', operator: 'equals', value: SecurityEventType.RATE_LIMIT_EXCEEDED },
        ],
        threshold: { count: 20, timeWindow: 10, aggregation: 'count' },
        actions: [
          { type: 'dashboard', config: {}, enabled: true },
          { type: 'block_ip', config: { duration: 900 }, enabled: true },
        ],
        cooldown: 15,
      },

      // Cross-Tenant Access Attempt
      {
        id: 'cross-tenant-access',
        name: 'Cross-Tenant Access Attempt',
        description: 'Detects attempts to access other tenant data',
        enabled: true,
        severity: 'critical',
        type: SecurityAlertType.CROSS_TENANT_ACCESS_ATTEMPT,
        conditions: [
          { field: 'eventType', operator: 'equals', value: SecurityEventType.CROSS_TENANT_ACCESS },
        ],
        threshold: { count: 1, timeWindow: 5, aggregation: 'count' },
        actions: [
          { type: 'dashboard', config: {}, enabled: true },
          { type: 'email', config: { immediate: true }, enabled: true },
          { type: 'block_ip', config: { duration: 3600 }, enabled: true },
        ],
        cooldown: 5,
      },

      // Data Exfiltration Risk
      {
        id: 'data-exfiltration-risk',
        name: 'Data Exfiltration Risk',
        description: 'Detects potential data exfiltration attempts',
        enabled: true,
        severity: 'critical',
        type: SecurityAlertType.DATA_EXFILTRATION_RISK,
        conditions: [
          { field: 'eventType', operator: 'in', value: [SecurityEventType.DATA_EXFILTRATION_ATTEMPT, SecurityEventType.UNAUTHORIZED_DATA_EXPORT] },
        ],
        threshold: { count: 1, timeWindow: 1, aggregation: 'count' },
        actions: [
          { type: 'dashboard', config: {}, enabled: true },
          { type: 'email', config: { immediate: true }, enabled: true },
        ],
        cooldown: 1,
      },

      // Malicious Payload Detection
      {
        id: 'malicious-payload',
        name: 'Malicious Payload Detected',
        description: 'Detects malicious payload injection attempts',
        enabled: true,
        severity: 'high',
        type: SecurityAlertType.MALICIOUS_PAYLOAD_DETECTED,
        conditions: [
          { field: 'eventType', operator: 'in', value: [SecurityEventType.MALICIOUS_PAYLOAD, SecurityEventType.SQL_INJECTION_ATTEMPT, SecurityEventType.XSS_ATTEMPT] },
        ],
        threshold: { count: 3, timeWindow: 30, aggregation: 'unique_ips' },
        actions: [
          { type: 'dashboard', config: {}, enabled: true },
          { type: 'block_ip', config: { duration: 1800 }, enabled: true },
        ],
        cooldown: 30,
      },

      // Infrastructure Compromise
      {
        id: 'infrastructure-compromise',
        name: 'Infrastructure Compromise',
        description: 'Detects signs of infrastructure compromise',
        enabled: true,
        severity: 'critical',
        type: SecurityAlertType.INFRASTRUCTURE_COMPROMISE,
        conditions: [
          { field: 'eventType', operator: 'in', value: [SecurityEventType.SESSION_HIJACKING, SecurityEventType.TOKEN_THEFT, SecurityEventType.TLS_FAILURE] },
        ],
        threshold: { count: 1, timeWindow: 1, aggregation: 'count' },
        actions: [
          { type: 'dashboard', config: {}, enabled: true },
          { type: 'email', config: { immediate: true }, enabled: true },
        ],
        cooldown: 1,
      },
    ]

    defaultRules.forEach(rule => this.rules.set(rule.id, rule))
  }

  /**
   * Add or update an alert rule
   */
  public addRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule)
  }

  /**
   * Remove an alert rule
   */
  public removeRule(ruleId: string): boolean {
    return this.rules.delete(ruleId)
  }

  /**
   * Get all alert rules
   */
  public getRules(): AlertRule[] {
    return Array.from(this.rules.values())
  }

  /**
   * Get rule by ID
   */
  public getRule(ruleId: string): AlertRule | undefined {
    return this.rules.get(ruleId)
  }

  /**
   * Process security events and generate alerts
   */
  public async processEvents(events: SecurityEvent[]): Promise<AlertProcessingResult> {
    this.eventBuffer.push(...events)
    
    if (this.processing) {
      return {
        alertsCreated: [],
        alertsTriggered: [],
        eventsProcessed: 0,
        errors: [],
      }
    }

    this.processing = true
    
    try {
      const result: AlertProcessingResult = {
        alertsCreated: [],
        alertsTriggered: [],
        eventsProcessed: this.eventBuffer.length,
        errors: [],
      }

      for (const rule of this.rules.values()) {
        if (!rule.enabled) continue

        try {
          const alerts = await this.evaluateRule(rule, this.eventBuffer)
          result.alertsCreated.push(...alerts)
          result.alertsTriggered.push(...alerts.map(alert => alert.id))
        } catch (error) {
          result.errors.push(`Rule ${rule.id} failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      // Clear processed events
      this.eventBuffer = []
      
      return result
    } finally {
      this.processing = false
    }
  }

  /**
   * Evaluate a single rule against events
   */
  private async evaluateRule(rule: AlertRule, events: SecurityEvent[]): Promise<SecurityAlert[]> {
    const now = Date.now()
    const ruleHistory = this.alertHistory.get(rule.id) || []
    
    // Check cooldown
    const lastAlert = Math.max(...ruleHistory, 0)
    if (now - lastAlert < rule.cooldown * 60 * 1000) {
      return []
    }

    // Filter events matching rule conditions
    const matchingEvents = events.filter(event => this.matchesConditions(event, rule.conditions))
    
    // Apply time window filter
    const timeWindowStart = now - rule.threshold.timeWindow * 60 * 1000
    const recentEvents = matchingEvents.filter(event => 
      new Date(event.timestamp).getTime() >= timeWindowStart
    )

    // Apply threshold
    const aggregatedCount = this.aggregateEvents(recentEvents, rule.threshold.aggregation)
    
    if (aggregatedCount < rule.threshold.count) {
      return []
    }

    // Create alert
    const alert = this.createAlert(rule, recentEvents)
    
    // Update alert history
    ruleHistory.push(now)
    this.alertHistory.set(rule.id, ruleHistory)

    // Execute actions
    await this.executeActions(alert, rule.actions)

    return [alert]
  }

  /**
   * Check if event matches rule conditions
   */
  private matchesConditions(event: SecurityEvent, conditions: AlertCondition[]): boolean {
    return conditions.every(condition => {
      const fieldValue = this.getFieldValue(event, condition.field)
      return this.evaluateCondition(fieldValue, condition)
    })
  }

  /**
   * Get field value from event (supports nested fields)
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
   * Evaluate condition against value
   */
  private evaluateCondition(value: unknown, condition: AlertCondition): boolean {
    const { operator, value: conditionValue, caseSensitive = true } = condition
    
    switch (operator) {
      case 'equals':
        return value === conditionValue
        
      case 'not_equals':
        return value !== conditionValue
        
      case 'contains':
        if (typeof value === 'string' && typeof conditionValue === 'string') {
          const strValue = caseSensitive ? value : value.toLowerCase()
          const strCondition = caseSensitive ? conditionValue : conditionValue.toLowerCase()
          return strValue.includes(strCondition)
        }
        return false
        
      case 'not_contains':
        if (typeof value === 'string' && typeof conditionValue === 'string') {
          const strValue = caseSensitive ? value : value.toLowerCase()
          const strCondition = caseSensitive ? conditionValue : conditionValue.toLowerCase()
          return !strValue.includes(strCondition)
        }
        return true
        
      case 'greater_than':
        if (typeof value === 'number' && typeof conditionValue === 'number') {
          return value > conditionValue
        }
        return false
        
      case 'less_than':
        if (typeof value === 'number' && typeof conditionValue === 'number') {
          return value < conditionValue
        }
        return false
        
      case 'in':
        if (Array.isArray(conditionValue)) {
          return conditionValue.includes(value)
        }
        return false
        
      case 'not_in':
        if (Array.isArray(conditionValue)) {
          return !conditionValue.includes(value)
        }
        return true
        
      default:
        return false
    }
  }

  /**
   * Aggregate events based on threshold configuration
   */
  private aggregateEvents(events: SecurityEvent[], aggregation: string): number {
    switch (aggregation) {
      case 'count':
        return events.length
        
      case 'unique_users':
        return new Set(events.map(e => e.actor.userId).filter(Boolean)).size
        
      case 'unique_ips':
        return new Set(events.map(e => e.source.ip)).size
        
      case 'unique_tenants':
        return new Set(events.map(e => e.actor.tenantId)).size
        
      default:
        return events.length
    }
  }

  /**
   * Create security alert
   */
  private createAlert(rule: AlertRule, events: SecurityEvent[]): SecurityAlert {
    const alert: SecurityAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      severity: rule.severity,
      type: rule.type,
      title: rule.name,
      description: this.generateAlertDescription(rule, events),
      tenantId: this.determineAlertTenant(events),
      events: events,
      status: 'active',
      metadata: {
        riskScore: this.calculateAlertRiskScore(events),
        affectedUsers: new Set(events.map(e => e.actor.userId).filter(Boolean)).size,
        affectedSystems: Array.from(new Set(events.map(e => e.application.name))),
        mitigation: this.generateMitigationAdvice(rule.type),
        recommendation: this.generateRecommendation(rule.type),
      },
    }

    return alert
  }

  /**
   * Generate alert description
   */
  private generateAlertDescription(rule: AlertRule, events: SecurityEvent[]): string {
    const eventCount = events.length
    const timeSpan = this.getTimeSpan(events)
    const uniqueIPs = new Set(events.map(e => e.source.ip)).size
    
    return `${rule.description}. ${eventCount} events detected from ${uniqueIPs} unique IP(s) over ${timeSpan}.`
  }

  /**
   * Get time span of events
   */
  private getTimeSpan(events: SecurityEvent[]): string {
    if (events.length === 0) return '0 minutes'
    
    const timestamps = events.map(e => new Date(e.timestamp).getTime())
    const min = Math.min(...timestamps)
    const max = Math.max(...timestamps)
    const diffMinutes = Math.round((max - min) / (60 * 1000))
    
    return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`
  }

  /**
   * Determine alert tenant (primary tenant affected)
   */
  private determineAlertTenant(events: SecurityEvent[]): string {
    // For cross-tenant events, return the target tenant
    const crossTenantEvent = events.find(e => e.eventType === SecurityEventType.CROSS_TENANT_ACCESS)
    if (crossTenantEvent) {
      const targetTenantId = crossTenantEvent.context.metadata?.['targetTenantId']
      return typeof targetTenantId === 'string' ? targetTenantId : crossTenantEvent.actor.tenantId
    }
    
    // Otherwise return the most common tenant
    const tenantCounts = events.reduce((counts, event) => {
      const tenant = event.actor.tenantId
      counts[tenant] = (counts[tenant] || 0) + 1
      return counts
    }, {} as Record<string, number>)
    
    return Object.entries(tenantCounts).sort(([,a], [,b]) => b - a)[0]?.[0] || 'unknown'
  }

  /**
   * Calculate alert risk score
   */
  private calculateAlertRiskScore(events: SecurityEvent[]): number {
    if (events.length === 0) return 0
    
    // Base score from event severities
    const severityScores: number[] = events.map(e => {
      switch (e.severity) {
        case 'critical': return 80
        case 'high': return 60
        case 'medium': return 40
        case 'low': return 20
        default: return 0
      }
    })
    
    const averageSeverity = severityScores.reduce((sum, score) => sum + score, 0) / severityScores.length
    
    // Event frequency modifier
    const frequencyModifier = Math.min(events.length * 5, 30)
    
    // Compliance impact modifier
    const complianceModifier = events.some(e => e.compliance.dataBreach) ? 20 : 0
    
    return Math.min(averageSeverity + frequencyModifier + complianceModifier, 100)
  }

  /**
   * Generate mitigation advice
   */
  private generateMitigationAdvice(alertType: SecurityAlertType): string {
    const advice: Record<SecurityAlertType, string> = {
      [SecurityAlertType.BRUTE_FORCE_ATTACK]: 'Block source IP addresses and implement account lockout policies',
      [SecurityAlertType.SUSPICIOUS_LOGIN_PATTERN]: 'Require additional authentication factors and monitor user behavior',
      [SecurityAlertType.RATE_LIMIT_ABUSE]: 'Implement stricter rate limits and consider IP blocking',
      [SecurityAlertType.CROSS_TENANT_ACCESS_ATTEMPT]: 'Immediate IP blocking and security investigation required',
      [SecurityAlertType.ANOMALOUS_DATA_ACCESS]: 'Review user permissions and audit data access logs',
      [SecurityAlertType.VULNERABILITY_DETECTED]: 'Apply security patches and update affected systems',
      [SecurityAlertType.SECURITY_MISCONFIGURATION]: 'Review and correct security configuration settings',
      [SecurityAlertType.DATA_EXFILTRATION_RISK]: 'Immediate investigation and potential containment measures',
      [SecurityAlertType.MALICIOUS_PAYLOAD_DETECTED]: 'Block malicious requests and sanitize inputs',
      [SecurityAlertType.INFRASTRUCTURE_COMPROMISE]: 'Immediate security incident response and system isolation',
    }
    
    return advice[alertType] || 'Investigate the security event and implement appropriate countermeasures'
  }

  /**
   * Generate recommendation
   */
  private generateRecommendation(alertType: SecurityAlertType): string {
    const recommendations: Record<SecurityAlertType, string> = {
      [SecurityAlertType.BRUTE_FORCE_ATTACK]: 'Implement progressive authentication delays and account lockout after repeated failures',
      [SecurityAlertType.SUSPICIOUS_LOGIN_PATTERN]: 'Enable multi-factor authentication and review user access patterns',
      [SecurityAlertType.RATE_LIMIT_ABUSE]: 'Review rate limiting policies and implement adaptive throttling',
      [SecurityAlertType.CROSS_TENANT_ACCESS_ATTEMPT]: 'Strengthen tenant isolation controls and audit access logs',
      [SecurityAlertType.ANOMALOUS_DATA_ACCESS]: 'Implement data access monitoring and anomaly detection',
      [SecurityAlertType.VULNERABILITY_DETECTED]: 'Update dependencies and apply security patches promptly',
      [SecurityAlertType.SECURITY_MISCONFIGURATION]: 'Regular security audits and configuration management',
      [SecurityAlertType.DATA_EXFILTRATION_RISK]: 'Implement data loss prevention controls and monitoring',
      [SecurityAlertType.MALICIOUS_PAYLOAD_DETECTED]: 'Enhance input validation and implement web application firewall',
      [SecurityAlertType.INFRASTRUCTURE_COMPROMISE]: 'Conduct security assessment and implement defense-in-depth measures',
    }
    
    return recommendations[alertType] || 'Review security policies and implement appropriate controls'
  }

  /**
   * Execute alert actions
   */
  private async executeActions(alert: SecurityAlert, actions: AlertAction[]): Promise<void> {
    for (const action of actions) {
      if (!action.enabled) continue
      
      try {
        switch (action.type) {
          case 'dashboard':
            // Alert is already stored for dashboard display
            break
            
          case 'email':
            await this.sendEmailAlert(alert, action.config)
            break
            
          case 'slack':
            await this.sendSlackAlert(alert, action.config)
            break
            
          case 'block_ip':
            await this.blockIPAddress(alert, action.config)
            break
            
          case 'require_mfa':
            await this.requireMultiFactorAuth(alert, action.config)
            break
        }
      } catch (error) {
        console.error(`Failed to execute alert action ${action.type}:`, error)
      }
    }
  }

  /**
   * Send email alert (placeholder implementation)
   */
  private async sendEmailAlert(alert: SecurityAlert, _config: Record<string, unknown>): Promise<void> {
    // Implementation would integrate with email service
    console.log(`Email alert sent for ${alert.id}: ${alert.title}`)
  }

  /**
   * Send Slack alert (placeholder implementation)
   */
  private async sendSlackAlert(alert: SecurityAlert, _config: Record<string, unknown>): Promise<void> {
    // Implementation would integrate with Slack API
    console.log(`Slack alert sent for ${alert.id}: ${alert.title}`)
  }

  /**
   * Block IP address (placeholder implementation)
   */
  private async blockIPAddress(alert: SecurityAlert, config: Record<string, unknown>): Promise<void> {
    const configDuration = config['duration']
    const duration = typeof configDuration === 'number' ? configDuration : 3600 // Default 1 hour
    const ips = new Set(alert.events.map(e => e.source.ip))
    
    // Implementation would integrate with firewall/rate limiting system
    console.log(`IP addresses blocked for ${duration}s:`, Array.from(ips))
  }

  /**
   * Require multi-factor authentication (placeholder implementation)
   */
  private async requireMultiFactorAuth(alert: SecurityAlert, _config: Record<string, unknown>): Promise<void> {
    const users = new Set(alert.events.map(e => e.actor.userId).filter(Boolean))
    
    // Implementation would integrate with authentication system
    console.log(`MFA required for users:`, Array.from(users))
  }
}

// Global alerting engine instance
export const securityAlertingEngine = new SecurityAlertingEngine()

/**
 * Process security events and generate alerts
 */
export async function processSecurityAlerts(events: SecurityEvent[]): Promise<AlertProcessingResult> {
  return securityAlertingEngine.processEvents(events)
}

/**
 * Get active alert rules
 */
export function getAlertRules(): AlertRule[] {
  return securityAlertingEngine.getRules()
}

/**
 * Add custom alert rule
 */
export function addAlertRule(rule: AlertRule): void {
  securityAlertingEngine.addRule(rule)
}
