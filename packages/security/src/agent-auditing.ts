/**
 * Agent Auditing System
 * 
 * Extends the existing security framework with agent-specific audit trail capabilities,
 * behavior monitoring, and compliance validation for AI agents.
 */

import {
  AgentAuditTrail,
  AgentAuditEvent,
  AuditFinding,
  AgentProperties,
  AgentAuthorization,
  ComplianceFramework
} from '@agency/governance/types'

import { SecurityConfig } from './types'

export interface AgentAuditingOptions {
  agentProperties: AgentProperties
  authorization: AgentAuthorization
  complianceFrameworks: ComplianceFramework[]
  config: SecurityConfig
}

export interface AuditEventInput {
  event_type: 'Decision' | 'Action' | 'Data_Access' | 'Error' | 'Escalation'
  description: string
  context: Record<string, any>
  risk_score?: number
  human_reviewed?: boolean
}

export interface AuditFilter {
  event_type?: AgentAuditEvent['event_type'][]
  date_range?: { start: string; end: string }
  risk_score_range?: { min: number; max: number }
  human_reviewed?: boolean
  compliance_flags?: string[]
}

export class AgentAuditingSystem {
  private agentProperties: AgentProperties
  private authorization: AgentAuthorization
  private complianceFrameworks: ComplianceFramework[]
  private config: SecurityConfig
  private auditTrails: Map<string, AgentAuditTrail> = new Map()
  private activeSession: string | null = null

  constructor(options: AgentAuditingOptions) {
    this.agentProperties = options.agentProperties
    this.authorization = options.authorization
    this.complianceFrameworks = options.complianceFrameworks
    this.config = options.config
  }

  /**
   * Start a new audit session for the agent
   */
  public startAuditSession(): string {
    const sessionId = this.generateSessionId()
    const auditTrail: AgentAuditTrail = {
      agent_id: this.agentProperties.agent_type || 'unknown',
      session_id: sessionId,
      events: [],
      compliance_status: 'Compliant',
      last_audit: new Date().toISOString(),
      audit_findings: []
    }

    this.auditTrails.set(sessionId, auditTrail)
    this.activeSession = sessionId

    // Log session start
    this.logEvent({
      event_type: 'Action',
      description: 'Agent audit session started',
      context: {
        session_id: sessionId,
        agent_type: this.agentProperties.agent_type,
        autonomy_level: this.agentProperties.autonomy_level,
        compliance_frameworks: this.complianceFrameworks
      },
      risk_score: 0,
      human_reviewed: false
    })

    return sessionId
  }

  /**
   * End the current audit session
   */
  public endAuditSession(sessionId?: string): {
    session_id: string
    events_count: number
    compliance_status: string
    findings_count: number
    duration_ms: number
  } {
    const targetSession = sessionId || this.activeSession
    if (!targetSession) {
      throw new Error('No active audit session to end')
    }

    const auditTrail = this.auditTrails.get(targetSession)
    if (!auditTrail) {
      throw new Error(`Audit session ${targetSession} not found`)
    }

    // Calculate session duration
    const firstEvent = auditTrail.events[0]
    const lastEvent = auditTrail.events[auditTrail.events.length - 1]
    const duration = firstEvent && lastEvent 
      ? new Date(lastEvent.timestamp).getTime() - new Date(firstEvent.timestamp).getTime()
      : 0

    // Perform final compliance check
    this.performComplianceCheck(targetSession)

    // Log session end
    this.logEvent({
      event_type: 'Action',
      description: 'Agent audit session ended',
      context: {
        session_id: targetSession,
        events_count: auditTrail.events.length,
        findings_count: auditTrail.audit_findings.length,
        compliance_status: auditTrail.compliance_status,
        duration_ms: duration
      },
      risk_score: 0,
      human_reviewed: false
    })

    if (this.activeSession === targetSession) {
      this.activeSession = null
    }

    return {
      session_id: targetSession,
      events_count: auditTrail.events.length,
      compliance_status: auditTrail.compliance_status,
      findings_count: auditTrail.audit_findings.length,
      duration_ms: duration
    }
  }

  /**
   * Log an audit event for the agent
   */
  public logEvent(eventInput: AuditEventInput): string {
    const sessionId = this.activeSession
    if (!sessionId) {
      throw new Error('No active audit session. Call startAuditSession() first.')
    }

    const auditTrail = this.auditTrails.get(sessionId)
    if (!auditTrail) {
      throw new Error(`Audit session ${sessionId} not found`)
    }

    // Validate event against agent authority boundaries
    const validationResult = this.validateEventAgainstBoundaries(eventInput)
    if (!validationResult.valid) {
      // Log boundary violation as a finding
      this.addAuditFinding(sessionId, {
        finding_id: this.generateFindingId(),
        severity: 'High',
        category: 'Security',
        description: `Authority boundary violation: ${validationResult.violation}`,
        recommendation: 'Review agent authority boundaries and adjust permissions',
        remediation_required: true,
        remediation_deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        status: 'Open'
      })
    }

    // Create audit event
    const auditEvent: AgentAuditEvent = {
      event_id: this.generateEventId(),
      timestamp: new Date().toISOString(),
      event_type: eventInput.event_type,
      description: eventInput.description,
      context: eventInput.context,
      human_reviewed: eventInput.human_reviewed || false,
      compliance_flags: this.checkComplianceFlags(eventInput),
      risk_score: this.calculateEventRiskScore(eventInput)
    }

    // Add event to audit trail
    auditTrail.events.push(auditEvent)

    // Check for real-time compliance issues
    this.checkRealTimeCompliance(sessionId, auditEvent)

    return auditEvent.event_id
  }

  /**
   * Get audit trail for a specific session
   */
  public getAuditTrail(sessionId: string): AgentAuditTrail | null {
    return this.auditTrails.get(sessionId) || null
  }

  /**
   * Get all audit trails for the agent
   */
  public getAllAuditTrails(): AgentAuditTrail[] {
    return Array.from(this.auditTrails.values())
  }

  /**
   * Search audit events based on filters
   */
  public searchAuditEvents(filter: AuditFilter): AgentAuditEvent[] {
    const allEvents: AgentAuditEvent[] = []

    for (const auditTrail of this.auditTrails.values()) {
      for (const event of auditTrail.events) {
        if (this.matchesFilter(event, filter)) {
          allEvents.push(event)
        }
      }
    }

    return allEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }

  /**
   * Get compliance summary for the agent
   */
  public getComplianceSummary(): {
    overall_status: 'Compliant' | 'Non-Compliant' | 'Under Review'
    total_findings: number
    findings_by_severity: Record<string, number>
    findings_by_category: Record<string, number>
    compliance_score: number
    last_audit: string
  } {
    const allFindings: AuditFinding[] = []
    
    for (const auditTrail of this.auditTrails.values()) {
      allFindings.push(...auditTrail.audit_findings)
    }

    // Calculate findings by severity
    const findingsBySeverity: Record<string, number> = {
      'Low': 0,
      'Medium': 0,
      'High': 0,
      'Critical': 0
    }

    // Calculate findings by category
    const findingsByCategory: Record<string, number> = {}

    allFindings.forEach(finding => {
      findingsBySeverity[finding.severity]++
      findingsByCategory[finding.category] = (findingsByCategory[finding.category] || 0) + 1
    })

    // Calculate compliance score (0-100)
    const complianceScore = this.calculateComplianceScore(allFindings)

    // Determine overall status
    let overallStatus: 'Compliant' | 'Non-Compliant' | 'Under Review' = 'Compliant'
    if (findingsBySeverity['Critical'] > 0 || findingsBySeverity['High'] > 0) {
      overallStatus = 'Non-Compliant'
    } else if (allFindings.length > 0) {
      overallStatus = 'Under Review'
    }

    // Get last audit timestamp
    const lastAudit = this.getLastAuditTimestamp()

    return {
      overall_status: overallStatus,
      total_findings: allFindings.length,
      findings_by_severity: findingsBySeverity,
      findings_by_category: findingsByCategory,
      compliance_score: complianceScore,
      last_audit: lastAudit
    }
  }

  /**
   * Perform comprehensive compliance check
   */
  public performComplianceCheck(sessionId: string): {
    compliant: boolean
    violations: string[]
    recommendations: string[]
  } {
    const auditTrail = this.auditTrails.get(sessionId)
    if (!auditTrail) {
      throw new Error(`Audit session ${sessionId} not found`)
    }

    const violations: string[] = []
    const recommendations: string[] = []

    // Check compliance framework requirements
    for (const framework of this.complianceFrameworks) {
      const frameworkCheck = this.checkFrameworkCompliance(framework, auditTrail)
      violations.push(...frameworkCheck.violations)
      recommendations.push(...frameworkCheck.recommendations)
    }

    // Check agent-specific compliance
    const agentCheck = this.checkAgentCompliance(auditTrail)
    violations.push(...agentCheck.violations)
    recommendations.push(...agentCheck.recommendations)

    // Update compliance status
    auditTrail.compliance_status = violations.length === 0 ? 'Compliant' : 'Non-Compliant'
    auditTrail.last_audit = new Date().toISOString()

    return {
      compliant: violations.length === 0,
      violations,
      recommendations
    }
  }

  /**
   * Add an audit finding
   */
  public addAuditFinding(sessionId: string, finding: Omit<AuditFinding, 'finding_id'>): string {
    const auditTrail = this.auditTrails.get(sessionId)
    if (!auditTrail) {
      throw new Error(`Audit session ${sessionId} not found`)
    }

    const auditFinding: AuditFinding = {
      finding_id: this.generateFindingId(),
      ...finding
    }

    auditTrail.audit_findings.push(auditFinding)
    return auditFinding.finding_id
  }

  /**
   * Update audit finding status
   */
  public updateFindingStatus(
    sessionId: string, 
    findingId: string, 
    status: AuditFinding['status']
  ): boolean {
    const auditTrail = this.auditTrails.get(sessionId)
    if (!auditTrail) {
      throw new Error(`Audit session ${sessionId} not found`)
    }

    const finding = auditTrail.audit_findings.find(f => f.finding_id === findingId)
    if (!finding) {
      return false
    }

    finding.status = status
    return true
  }

  // Private helper methods

  private validateEventAgainstBoundaries(eventInput: AuditEventInput): {
    valid: boolean
    violation?: string
  } {
    // For decision events, check decision scope
    if (eventInput.event_type === 'Decision') {
      if (this.agentProperties.decision_scope === 'Internal' && 
          eventInput.context?.scope !== 'internal') {
        return {
          valid: false,
          violation: 'Agent attempted decision outside internal scope'
        }
      }
    }

    // For data access events, check data access level
    if (eventInput.event_type === 'Data_Access') {
      const dataLevel = eventInput.context?.data_classification
      const maxAllowed = this.agentProperties.data_access_level
      
      if (dataLevel && this.isDataLevelHigher(dataLevel, maxAllowed)) {
        return {
          valid: false,
          violation: `Agent attempted to access ${dataLevel} data, max allowed: ${maxAllowed}`
        }
      }
    }

    return { valid: true }
  }

  private checkComplianceFlags(eventInput: AuditEventInput): string[] {
    const flags: string[] = []

    // Check for high-risk events
    if (eventInput.risk_score && eventInput.risk_score > 3.0) {
      flags.push('HIGH_RISK_EVENT')
    }

    // Check for events requiring human review
    if (eventInput.event_type === 'Decision' && this.agentProperties.human_oversight_required) {
      flags.push('HUMAN_REVIEW_REQUIRED')
    }

    // Check for compliance framework specific flags
    if (this.complianceFrameworks.includes('HIPAA')) {
      if (eventInput.context?.phi_data === true) {
        flags.push('HIPAA_PHI_ACCESS')
      }
    }

    if (this.complianceFrameworks.includes('GDPR')) {
      if (eventInput.context?.personal_data === true) {
        flags.push('GDPR_PERSONAL_DATA_ACCESS')
      }
    }

    return flags
  }

  private calculateEventRiskScore(eventInput: AuditEventInput): number {
    let score = 1.0 // Base score

    // Adjust based on event type
    const eventScores = {
      'Decision': 2.0,
      'Action': 1.5,
      'Data_Access': 2.5,
      'Error': 3.0,
      'Escalation': 4.0
    }
    score *= eventScores[eventInput.event_type] || 1.0

    // Adjust based on agent autonomy
    const autonomyMultipliers = {
      'Low': 0.8,
      'Medium': 1.0,
      'High': 1.5,
      'Critical': 2.0
    }
    score *= autonomyMultipliers[this.agentProperties.autonomy_level] || 1.0

    // Adjust based on decision scope
    if (eventInput.context?.scope === 'Customer-Facing') {
      score *= 1.5
    }
    if (eventInput.context?.scope === 'Cross-System') {
      score *= 2.0
    }

    return Math.min(score, 4.0) // Cap at maximum risk
  }

  private checkRealTimeCompliance(sessionId: string, event: AgentAuditEvent): void {
    const auditTrail = this.auditTrails.get(sessionId)
    if (!auditTrail) return

    // Check for immediate compliance violations
    if (event.compliance_flags.includes('HIGH_RISK_EVENT')) {
      this.addAuditFinding(sessionId, {
        severity: 'Medium',
        category: 'Compliance',
        description: `High-risk event detected: ${event.description}`,
        recommendation: 'Review high-risk event and implement additional controls',
        remediation_required: true,
        remediation_deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48 hours
        status: 'Open'
      })
    }

    if (event.compliance_flags.includes('HUMAN_REVIEW_REQUIRED') && !event.human_reviewed) {
      this.addAuditFinding(sessionId, {
        severity: 'High',
        category: 'Compliance',
        description: `Decision made without required human review: ${event.description}`,
        recommendation: 'Implement human review process for agent decisions',
        remediation_required: true,
        remediation_deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        status: 'Open'
      })
    }
  }

  private matchesFilter(event: AgentAuditEvent, filter: AuditFilter): boolean {
    // Check event type filter
    if (filter.event_type && !filter.event_type.includes(event.event_type)) {
      return false
    }

    // Check date range filter
    if (filter.date_range) {
      const eventDate = new Date(event.timestamp)
      const startDate = new Date(filter.date_range.start)
      const endDate = new Date(filter.date_range.end)
      
      if (eventDate < startDate || eventDate > endDate) {
        return false
      }
    }

    // Check risk score range filter
    if (filter.risk_score_range) {
      if (event.risk_score < filter.risk_score_range.min || 
          event.risk_score > filter.risk_score_range.max) {
        return false
      }
    }

    // Check human reviewed filter
    if (filter.human_reviewed !== undefined && event.human_reviewed !== filter.human_reviewed) {
      return false
    }

    // Check compliance flags filter
    if (filter.compliance_flags && filter.compliance_flags.length > 0) {
      const hasMatchingFlag = filter.compliance_flags.some(flag => 
        event.compliance_flags.includes(flag)
      )
      if (!hasMatchingFlag) {
        return false
      }
    }

    return true
  }

  private calculateComplianceScore(findings: AuditFinding[]): number {
    if (findings.length === 0) return 100

    let score = 100

    findings.forEach(finding => {
      const deductions = {
        'Low': 5,
        'Medium': 15,
        'High': 30,
        'Critical': 50
      }
      score -= deductions[finding.severity] || 0
    })

    return Math.max(0, score)
  }

  private getLastAuditTimestamp(): string {
    let lastTimestamp = ''

    for (const auditTrail of this.auditTrails.values()) {
      if (auditTrail.last_audit > lastTimestamp) {
        lastTimestamp = auditTrail.last_audit
      }
    }

    return lastTimestamp || new Date().toISOString()
  }

  private checkFrameworkCompliance(
    framework: ComplianceFramework, 
    auditTrail: AgentAuditTrail
  ): { violations: string[]; recommendations: string[] } {
    const violations: string[] = []
    const recommendations: string[] = []

    switch (framework) {
      case 'HIPAA':
        // Check for PHI access logging
        const phiEvents = auditTrail.events.filter(e => 
          e.compliance_flags.includes('HIPAA_PHI_ACCESS')
        )
        if (phiEvents.length > 0 && !phiEvents.every(e => e.human_reviewed)) {
          violations.push('PHI access events not properly reviewed')
          recommendations.push('Implement mandatory human review for all PHI access')
        }
        break

      case 'GDPR':
        // Check for personal data access consent
        const personalDataEvents = auditTrail.events.filter(e => 
          e.compliance_flags.includes('GDPR_PERSONAL_DATA_ACCESS')
        )
        if (personalDataEvents.length > 0) {
          const consentEvents = personalDataEvents.filter(e => 
            e.context?.consent_recorded === true
          )
          if (consentEvents.length < personalDataEvents.length) {
            violations.push('Personal data accessed without proper consent recording')
            recommendations.push('Implement consent tracking for all personal data access')
          }
        }
        break

      case 'SOC2':
        // Check for audit trail completeness
        if (auditTrail.events.length === 0) {
          violations.push('No audit events recorded')
          recommendations.push('Ensure all agent actions are properly logged')
        }
        break
    }

    return { violations, recommendations }
  }

  private checkAgentCompliance(auditTrail: AgentAuditTrail): {
    violations: string[]
    recommendations: string[]
  } {
    const violations: string[] = []
    const recommendations: string[] = []

    // Check if human oversight requirements are met
    if (this.agentProperties.human_oversight_required) {
      const decisionEvents = auditTrail.events.filter(e => e.event_type === 'Decision')
      const reviewedDecisions = decisionEvents.filter(e => e.human_reviewed)
      
      if (reviewedDecisions.length < decisionEvents.length) {
        violations.push('Agent decisions made without required human oversight')
        recommendations.push('Implement human review process for all agent decisions')
      }
    }

    // Check audit frequency compliance
    const expectedFrequency = this.agentProperties.audit_frequency
    const now = new Date()
    let compliant = true

    switch (expectedFrequency) {
      case 'Real-time':
        // Should have events within the last minute
        const recentEvents = auditTrail.events.filter(e => 
          now.getTime() - new Date(e.timestamp).getTime() < 60000
        )
        if (recentEvents.length === 0) {
          compliant = false
        }
        break
      case 'Hourly':
        // Should have events within the last hour
        const hourlyEvents = auditTrail.events.filter(e => 
          now.getTime() - new Date(e.timestamp).getTime() < 3600000
        )
        if (hourlyEvents.length === 0) {
          compliant = false
        }
        break
    }

    if (!compliant) {
      violations.push(`Audit frequency requirement not met: expected ${expectedFrequency}`)
      recommendations.push(`Ensure agent events are logged at ${expectedFrequency} frequency`)
    }

    return { violations, recommendations }
  }

  private isDataLevelHigher(level: string, maxLevel: string): boolean {
    const levels = { 'Public': 1, 'Internal': 2, 'Confidential': 3, 'Restricted': 4 }
    return levels[level as keyof typeof levels] > levels[maxLevel as keyof typeof levels]
  }

  // ID generation methods

  private generateSessionId(): string {
    return `agent_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateFindingId(): string {
    return `finding_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}
