/**
 * Security Manager
 * 
 * Main security coordinator that provides unified access to all
 * supply chain security features in the agency platform.
 */

import { SBOMGenerator } from './sbom'
import { IntegrityVerifier } from './integrity'
import { ProvenanceTracker } from './provenance'
import { SupplyChainMonitor } from './monitoring'
import { CryptoVerifier } from './crypto'
import { AgentAuditingSystem } from './agent-auditing'
import { SecurityConfig } from './types'
import { AgentProperties, AgentAuthorization, ComplianceFramework } from '@agency/governance/types'

export interface SecurityManagerOptions {
  config: SecurityConfig
}

export class SecurityManager {
  private sbomGenerator: SBOMGenerator
  private integrityVerifier: IntegrityVerifier
  private provenanceTracker: ProvenanceTracker
  private supplyChainMonitor: SupplyChainMonitor
  private cryptoVerifier: CryptoVerifier
  private agentAuditingSystems: Map<string, AgentAuditingSystem> = new Map()

  constructor(options: SecurityManagerOptions) {
    this.sbomGenerator = new SBOMGenerator(options.config.sbomGeneration)
    this.integrityVerifier = new IntegrityVerifier(options.config.integrityVerification)
    this.provenanceTracker = new ProvenanceTracker(options.config.provenanceTracking)
    this.supplyChainMonitor = new SupplyChainMonitor(options.config.vulnerabilityScanning)
    this.cryptoVerifier = new CryptoVerifier()
  }

  /**
   * Run comprehensive security analysis
   */
  async runComprehensiveAnalysis(projectPath: string): Promise<{
    sbom: any
    integrity: any
    provenance: any
    vulnerabilities: any
    overall: 'passed' | 'warning' | 'failed'
    recommendations: string[]
  }> {
    console.log('🔒 Running comprehensive security analysis...')

    const results = {
      sbom: null,
      integrity: null,
      provenance: null,
      vulnerabilities: null,
      overall: 'passed' as 'passed' | 'warning' | 'failed',
      recommendations: [] as string[],
    }

    try {
      // SBOM Generation
      if (this.sbomGenerator['config'].enabled) {
        console.log('📦 Generating SBOM...')
        const sbomPath = `${projectPath}/sbom.json`
        results.sbom = await this.sbomGenerator.generate({
          projectPath,
          outputPath: sbomPath,
          format: 'cyclonedx',
        })
        console.log('✅ SBOM generation completed')
      }

      // Integrity Verification
      if (this.integrityVerifier['config'].enabled) {
        console.log('🔍 Verifying integrity...')
        results.integrity = await this.integrityVerifier.generateReport(projectPath)
        console.log(`✅ Integrity check: ${results.integrity.summary.status}`)
      }

      // Provenance Tracking
      if (this.provenanceTracker['config'].enabled) {
        console.log('📋 Generating provenance...')
        results.provenance = await this.provenanceTracker.generate({
          buildId: `analysis-${Date.now()}`,
          commitSha: 'current',
          branch: 'main',
          actor: 'security-manager',
          workflow: 'comprehensive-analysis',
          repository: 'agency-platform',
          runner: 'local',
          packageName: 'security-analysis',
          packagePath: projectPath,
        })
        console.log('✅ Provenance tracking completed')
      }

      // Vulnerability Scanning
      if (this.supplyChainMonitor['config'].enabled) {
        console.log('🔍 Scanning for vulnerabilities...')
        results.vulnerabilities = await this.supplyChainMonitor.scanDependencies(projectPath)
        console.log(`✅ Vulnerability scan: ${results.vulnerabilities.status}`)
      }

      // Determine overall status
      const statuses = [
        results.integrity?.summary?.status,
        results.vulnerabilities?.status,
      ].filter(Boolean)

      if (statuses.includes('failed')) {
        results.overall = 'failed'
      } else if (statuses.includes('warning')) {
        results.overall = 'warning'
      }

      // Aggregate recommendations
      const allRecommendations = [
        ...(results.integrity?.recommendations || []),
        ...(results.vulnerabilities?.recommendations || []),
      ]

      results.recommendations = [...new Set(allRecommendations)]

      console.log(`🎯 Overall security status: ${results.overall.toUpperCase()}`)
      console.log(`💡 Total recommendations: ${results.recommendations.length}`)

      return results

    } catch (error) {
      console.error('❌ Security analysis failed:', error)
      throw error
    }
  }

  /**
   * Quick security check for CI/CD
   */
  async quickSecurityCheck(projectPath: string): Promise<{
    passed: boolean
    criticalIssues: number
    highIssues: number
    summary: string
  }> {
    const issues = {
      critical: 0,
      high: 0,
    }

    try {
      // Quick integrity check
      const criticalFiles = [
        `${projectPath}/package.json`,
        `${projectPath}/pnpm-lock.yaml`,
      ].filter(path => require('fs').existsSync(path))

      const integrityResult = await this.integrityVerifier.quickCheck(criticalFiles)
      if (!integrityResult.passed) {
        issues.critical += 1
      }

      // Quick vulnerability check
      if (this.supplyChainMonitor['config'].enabled) {
        const vulnResult = await this.supplyChainMonitor.scanDependencies(projectPath)
        
        if (vulnResult.details) {
          issues.critical += vulnResult.details.criticalVulnerabilities || 0
          issues.high += vulnResult.details.highVulnerabilities || 0
        }
      }

      const passed = issues.critical === 0 && 
                     (this.supplyChainMonitor['config'].failOnThreshold ? issues.high === 0 : true)

      const summary = `Quick security check: ${passed ? 'PASSED' : 'FAILED'} (${issues.critical} critical, ${issues.high} high issues)`

      return {
        passed,
        criticalIssues: issues.critical,
        highIssues: issues.high,
        summary,
      }

    } catch (error) {
      return {
        passed: false,
        criticalIssues: 1,
        highIssues: 0,
        summary: `Quick security check FAILED: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  }

  /**
   * Generate security report
   */
  async generateSecurityReport(projectPath: string, outputPath: string): Promise<void> {
    const analysis = await this.runComprehensiveAnalysis(projectPath)
    
    const report = {
      timestamp: new Date().toISOString(),
      projectPath,
      overall: analysis.overall,
      results: analysis,
      summary: {
        sbomGenerated: !!analysis.sbom,
        integrityVerified: !!analysis.integrity,
        provenanceTracked: !!analysis.provenance,
        vulnerabilitiesScanned: !!analysis.vulnerabilities,
        totalRecommendations: analysis.recommendations.length,
      },
    }

    const reportPath = `${outputPath}/security-report.json`
    require('fs').writeFileSync(reportPath, JSON.stringify(report, null, 2))
    console.log(`📄 Security report saved: ${reportPath}`)
  }

  /**
   * Get security configuration
   */
  getConfig(): SecurityConfig {
    return {
      sbomGeneration: this.sbomGenerator['config'],
      integrityVerification: this.integrityVerifier['config'],
      provenanceTracking: this.provenanceTracker['config'],
      vulnerabilityScanning: this.supplyChainMonitor['config'],
    }
  }

  /**
   * Update security configuration
   */
  updateConfig(newConfig: Partial<SecurityConfig>): void {
    if (newConfig.sbomGeneration) {
      Object.assign(this.sbomGenerator['config'], newConfig.sbomGeneration)
    }
    if (newConfig.integrityVerification) {
      Object.assign(this.integrityVerifier['config'], newConfig.integrityVerification)
    }
    if (newConfig.provenanceTracking) {
      Object.assign(this.provenanceTracker['config'], newConfig.provenanceTracking)
    }
    if (newConfig.vulnerabilityScanning) {
      Object.assign(this.supplyChainMonitor['config'], newConfig.vulnerabilityScanning)
    }
  }

  /**
   * Get individual security modules
   */
  getModules() {
    return {
      sbom: this.sbomGenerator,
      integrity: this.integrityVerifier,
      provenance: this.provenanceTracker,
      monitoring: this.supplyChainMonitor,
      crypto: this.cryptoVerifier,
    }
  }

  /**
   * Validate security setup
   */
  async validateSetup(projectPath: string): Promise<{
    valid: boolean
    issues: string[]
    recommendations: string[]
  }> {
    const issues: string[] = []
    const recommendations: string[] = []

    // Check if project has package.json
    if (!require('fs').existsSync(`${projectPath}/package.json`)) {
      issues.push('package.json not found')
    }

    // Check if lockfile exists
    if (!require('fs').existsSync(`${projectPath}/pnpm-lock.yaml`)) {
      issues.push('pnpm-lock.yaml not found')
      recommendations.push('Run pnpm install to generate lockfile')
    }

    // Check if security package is available
    try {
      require('@agency/security')
    } catch {
      issues.push('@agency/security package not available')
      recommendations.push('Install @agency/security package')
    }

    // Check configuration
    const config = this.getConfig()
    if (!config.sbomGeneration.enabled && !config.vulnerabilityScanning.enabled) {
      issues.push('No security features enabled')
      recommendations.push('Enable at least SBOM generation or vulnerability scanning')
    }

    return {
      valid: issues.length === 0,
      issues,
      recommendations,
    }
  }

  // ============================================================================
  // AGENT-SPECIFIC SECURITY METHODS
  // ============================================================================

  /**
   * Register an agent for security monitoring and auditing
   */
  public registerAgent(
    agentId: string,
    agentProperties: AgentProperties,
    authorization: AgentAuthorization,
    complianceFrameworks: ComplianceFramework[]
  ): void {
    const auditingSystem = new AgentAuditingSystem({
      agentProperties,
      authorization,
      complianceFrameworks,
      config: this.config
    })

    this.agentAuditingSystems.set(agentId, auditingSystem)
    console.log(`🤖 Agent ${agentId} registered for security monitoring`)
  }

  /**
   * Start security monitoring session for an agent
   */
  public startAgentSecuritySession(agentId: string): string {
    const auditingSystem = this.agentAuditingSystems.get(agentId)
    if (!auditingSystem) {
      throw new Error(`Agent ${agentId} not registered. Call registerAgent() first.`)
    }

    const sessionId = auditingSystem.startAuditSession()
    console.log(`🔒 Started security session ${sessionId} for agent ${agentId}`)
    return sessionId
  }

  /**
   * End security monitoring session for an agent
   */
  public endAgentSecuritySession(agentId: string, sessionId?: string): {
    session_id: string
    events_count: number
    compliance_status: string
    findings_count: number
    duration_ms: number
  } {
    const auditingSystem = this.agentAuditingSystems.get(agentId)
    if (!auditingSystem) {
      throw new Error(`Agent ${agentId} not registered`)
    }

    const result = auditingSystem.endAuditSession(sessionId)
    console.log(`✅ Ended security session for agent ${agentId}: ${result.events_count} events, ${result.findings_count} findings`)
    return result
  }

  /**
   * Log a security event for an agent
   */
  public logAgentSecurityEvent(
    agentId: string,
    eventType: 'Decision' | 'Action' | 'Data_Access' | 'Error' | 'Escalation',
    description: string,
    context: Record<string, any>,
    riskScore?: number
  ): string {
    const auditingSystem = this.agentAuditingSystems.get(agentId)
    if (!auditingSystem) {
      throw new Error(`Agent ${agentId} not registered`)
    }

    const eventId = auditingSystem.logEvent({
      event_type: eventType,
      description,
      context,
      risk_score: riskScore,
      human_reviewed: false
    })

    console.log(`📝 Logged security event ${eventId} for agent ${agentId}`)
    return eventId
  }

  /**
   * Get security audit trail for an agent
   */
  public getAgentAuditTrail(agentId: string, sessionId?: string) {
    const auditingSystem = this.agentAuditingSystems.get(agentId)
    if (!auditingSystem) {
      throw new Error(`Agent ${agentId} not registered`)
    }

    if (sessionId) {
      return auditingSystem.getAuditTrail(sessionId)
    } else {
      return auditingSystem.getAllAuditTrails()
    }
  }

  /**
   * Get security compliance summary for an agent
   */
  public getAgentSecurityCompliance(agentId: string) {
    const auditingSystem = this.agentAuditingSystems.get(agentId)
    if (!auditingSystem) {
      throw new Error(`Agent ${agentId} not registered`)
    }

    return auditingSystem.getComplianceSummary()
  }

  /**
   * Perform comprehensive security analysis for an agent
   */
  public async runAgentSecurityAnalysis(
    agentId: string,
    agentPath: string
  ): Promise<{
    audit_summary: any
    compliance_status: any
    security_findings: any
    recommendations: string[]
    overall: 'secure' | 'warning' | 'critical'
  }> {
    const auditingSystem = this.agentAuditingSystems.get(agentId)
    if (!auditingSystem) {
      throw new Error(`Agent ${agentId} not registered`)
    }

    console.log(`🔒 Running comprehensive security analysis for agent ${agentId}...`)

    const results = {
      audit_summary: null,
      compliance_status: null,
      security_findings: null,
      overall: 'secure' as 'secure' | 'warning' | 'critical',
      recommendations: [] as string[],
    }

    try {
      // Get compliance summary
      results.compliance_status = auditingSystem.getComplianceSummary()
      console.log(`📊 Compliance status: ${results.compliance_status.overall_status}`)

      // Get audit trails
      const auditTrails = auditingSystem.getAllAuditTrails()
      results.audit_summary = {
        total_sessions: auditTrails.length,
        total_events: auditTrails.reduce((sum, trail) => sum + trail.events.length, 0),
        total_findings: auditTrails.reduce((sum, trail) => sum + trail.audit_findings.length, 0),
        last_audit: results.compliance_status.last_audit
      }

      // Aggregate security findings
      const allFindings = auditTrails.flatMap(trail => trail.audit_findings)
      results.security_findings = {
        total_findings: allFindings.length,
        critical_findings: allFindings.filter(f => f.severity === 'Critical').length,
        high_findings: allFindings.filter(f => f.severity === 'High').length,
        medium_findings: allFindings.filter(f => f.severity === 'Medium').length,
        low_findings: allFindings.filter(f => f.severity === 'Low').length,
        findings_by_category: this.categorizeFindings(allFindings)
      }

      // Generate recommendations
      results.recommendations = this.generateAgentSecurityRecommendations(
        results.compliance_status,
        results.security_findings
      )

      // Determine overall security status
      if (results.compliance_status.overall_status === 'Non-Compliant' || 
          results.security_findings.critical_findings > 0) {
        results.overall = 'critical'
      } else if (results.security_findings.high_findings > 0 || 
                 results.compliance_status.overall_status === 'Under Review') {
        results.overall = 'warning'
      }

      console.log(`✅ Agent security analysis completed: ${results.overall}`)

    } catch (error) {
      console.error(`❌ Agent security analysis failed:`, error)
      results.overall = 'critical'
      results.recommendations.push('Review agent security configuration and try again')
    }

    return results
  }

  /**
   * Monitor agent behavior for anomalies
   */
  public monitorAgentBehavior(agentId: string): {
    anomaly_detected: boolean
    anomalies: string[]
    risk_level: 'low' | 'medium' | 'high' | 'critical'
    recommendations: string[]
  } {
    const auditingSystem = this.agentAuditingSystems.get(agentId)
    if (!auditingSystem) {
      throw new Error(`Agent ${agentId} not registered`)
    }

    const auditTrails = auditingSystem.getAllAuditTrails()
    const anomalies: string[] = []
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'

    // Check for unusual patterns in recent events
    const recentEvents = auditTrails
      .flatMap(trail => trail.events)
      .filter(event => {
        const eventTime = new Date(event.timestamp)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
        return eventTime > oneHourAgo
      })

    // Check for high error rate
    const errorEvents = recentEvents.filter(e => e.event_type === 'Error')
    const errorRate = errorEvents.length / recentEvents.length
    if (errorRate > 0.1) {
      anomalies.push(`High error rate detected: ${(errorRate * 100).toFixed(1)}%`)
      riskLevel = 'high'
    }

    // Check for escalation frequency
    const escalationEvents = recentEvents.filter(e => e.event_type === 'Escalation')
    if (escalationEvents.length > 5) {
      anomalies.push(`High escalation frequency: ${escalationEvents.length} escalations in last hour`)
      riskLevel = 'critical'
    }

    // Check for high-risk decisions
    const highRiskEvents = recentEvents.filter(e => e.risk_score > 3.0)
    if (highRiskEvents.length > 3) {
      anomalies.push(`Multiple high-risk decisions: ${highRiskEvents.length} events with risk score > 3.0`)
      if (riskLevel !== 'critical') riskLevel = 'high'
    }

    // Check for data access patterns
    const dataAccessEvents = recentEvents.filter(e => e.event_type === 'Data_Access')
    if (dataAccessEvents.length > 20) {
      anomalies.push(`Unusual data access pattern: ${dataAccessEvents.length} data access events`)
      riskLevel = 'medium'
    }

    const recommendations = this.generateAnomalyRecommendations(anomalies, riskLevel)

    return {
      anomaly_detected: anomalies.length > 0,
      anomalies,
      risk_level: riskLevel,
      recommendations
    }
  }

  /**
   * Get security status for all registered agents
   */
  public getAllAgentsSecurityStatus(): Record<string, {
    registered: boolean
    compliance_status: string
    active_sessions: number
    total_findings: number
    last_activity: string
  }> {
    const status: Record<string, any> = {}

    for (const [agentId, auditingSystem] of this.agentAuditingSystems) {
      const compliance = auditingSystem.getComplianceSummary()
      const auditTrails = auditingSystem.getAllAuditTrails()
      
      status[agentId] = {
        registered: true,
        compliance_status: compliance.overall_status,
        active_sessions: auditTrails.filter(trail => 
          trail.events.length > 0 && 
          new Date(trail.events[trail.events.length - 1].timestamp).getTime() > 
          Date.now() - 60 * 60 * 1000 // Active in last hour
        ).length,
        total_findings: compliance.total_findings,
        last_activity: compliance.last_audit
      }
    }

    return status
  }

  // Helper methods for agent security

  private categorizeFindings(findings: any[]): Record<string, number> {
    const categories: Record<string, number> = {}
    
    findings.forEach(finding => {
      categories[finding.category] = (categories[finding.category] || 0) + 1
    })

    return categories
  }

  private generateAgentSecurityRecommendations(complianceStatus: any, securityFindings: any): string[] {
    const recommendations: string[] = []

    // Compliance-based recommendations
    if (complianceStatus.overall_status === 'Non-Compliant') {
      recommendations.push('Address compliance violations immediately')
      recommendations.push('Review and update agent governance policies')
    }

    if (complianceStatus.overall_status === 'Under Review') {
      recommendations.push('Complete pending compliance reviews')
      recommendations.push('Implement additional monitoring controls')
    }

    // Security findings-based recommendations
    if (securityFindings.critical_findings > 0) {
      recommendations.push('Address critical security findings immediately')
      recommendations.push('Consider temporarily suspending agent operations')
    }

    if (securityFindings.high_findings > 0) {
      recommendations.push('Address high-priority security findings')
      recommendations.push('Enhance agent monitoring and oversight')
    }

    // Compliance score-based recommendations
    if (complianceStatus.compliance_score < 80) {
      recommendations.push('Improve agent compliance posture')
      recommendations.push('Implement additional compliance controls')
    }

    if (recommendations.length === 0) {
      recommendations.push('Continue monitoring agent security posture')
    }

    return recommendations
  }

  private generateAnomalyRecommendations(anomalies: string[], riskLevel: string): string[] {
    const recommendations: string[] = []

    switch (riskLevel) {
      case 'critical':
        recommendations.push('Immediately investigate agent behavior anomalies')
        recommendations.push('Consider suspending agent operations')
        recommendations.push('Review recent agent decisions and actions')
        break
      case 'high':
        recommendations.push('Investigate agent behavior anomalies promptly')
        recommendations.push('Increase monitoring frequency')
        recommendations.push('Review agent configuration and boundaries')
        break
      case 'medium':
        recommendations.push('Monitor agent behavior closely')
        recommendations.push('Review recent agent activities')
        break
      case 'low':
        recommendations.push('Continue normal monitoring')
        break
    }

    // Specific recommendations based on anomaly types
    if (anomalies.some(a => a.includes('error rate'))) {
      recommendations.push('Review agent error handling and retry logic')
    }

    if (anomalies.some(a => a.includes('escalation'))) {
      recommendations.push('Review agent decision-making and escalation logic')
    }

    if (anomalies.some(a => a.includes('data access'))) {
      recommendations.push('Review agent data access patterns and permissions')
    }

    return recommendations
  }
}

export * from './types'
