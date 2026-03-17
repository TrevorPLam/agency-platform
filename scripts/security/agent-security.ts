#!/usr/bin/env node

/**
 * Agent Security Integration Script
 * 
 * Integrates agent security capabilities with the existing security framework,
 * providing agent behavior monitoring, anomaly detection, and security validation.
 */

import { SecurityManager } from '@agency/security'
import { 
  AgentProperties,
  AgentAuthorization,
  ComplianceFramework
} from '@agency/governance/types'

import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

interface SecurityConfig {
  agent_monitoring_enabled: boolean
  anomaly_detection_enabled: boolean
  real_time_alerting: boolean
  security_scan_interval: number // minutes
  alert_thresholds: {
    error_rate: number
    escalation_frequency: number
    high_risk_decisions: number
    data_access_events: number
  }
}

interface AgentSecurityConfig {
  agent_id: string
  properties: AgentProperties
  authorization: AgentAuthorization
  compliance_frameworks: ComplianceFramework[]
  security_policies: {
    max_error_rate: number
    max_escalations_per_hour: number
    max_high_risk_decisions_per_hour: number
    max_data_access_events_per_hour: number
    require_human_review_for: string[]
  }
}

function loadSecurityConfig(): SecurityConfig {
  try {
    const configPath = resolve(__dirname, '../security-config.json')
    const configData = readFileSync(configPath, 'utf-8')
    return JSON.parse(configData)
  } catch (error) {
    console.warn('No security-config.json found, using defaults')
    return {
      agent_monitoring_enabled: true,
      anomaly_detection_enabled: true,
      real_time_alerting: true,
      security_scan_interval: 5,
      alert_thresholds: {
        error_rate: 0.1,
        escalation_frequency: 5,
        high_risk_decisions: 3,
        data_access_events: 20
      }
    }
  }
}

function loadAgentSecurityConfigs(): AgentSecurityConfig[] {
  try {
    const agentsPath = resolve(__dirname, '../agent-security-configs.json')
    const agentsData = readFileSync(agentsPath, 'utf-8')
    return JSON.parse(agentsData)
  } catch (error) {
    console.warn('No agent-security-configs.json found, using empty configuration')
    return []
  }
}

class AgentSecurityManager {
  private securityManager: SecurityManager
  private config: SecurityConfig
  private agentConfigs: AgentSecurityConfig[]
  private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map()

  constructor(config: SecurityConfig, agentConfigs: AgentSecurityConfig[]) {
    this.config = config
    this.agentConfigs = agentConfigs
    
    // Initialize security manager
    this.securityManager = new SecurityManager({
      config: {
        sbomGeneration: { enabled: true },
        integrityVerification: { enabled: true },
        provenanceTracking: { enabled: true },
        vulnerabilityScanning: { enabled: true }
      }
    })

    // Register all agents
    this.registerAgents()
  }

  /**
   * Register all agents with security manager
   */
  private registerAgents(): void {
    for (const agentConfig of this.agentConfigs) {
      this.securityManager.registerAgent(
        agentConfig.agent_id,
        agentConfig.properties,
        agentConfig.authorization,
        agentConfig.compliance_frameworks
      )
      console.log(`🔐 Registered agent for security monitoring: ${agentConfig.agent_id}`)
    }
  }

  /**
   * Start continuous security monitoring for all agents
   */
  startContinuousMonitoring(): void {
    if (!this.config.agent_monitoring_enabled) {
      console.log('ℹ️ Agent monitoring is disabled in configuration')
      return
    }

    console.log('🔍 Starting continuous agent security monitoring...')

    for (const agentConfig of this.agentConfigs) {
      this.startAgentMonitoring(agentConfig.agent_id)
    }

    console.log(`✅ Started monitoring for ${this.agentConfigs.length} agents`)
  }

  /**
   * Start monitoring for a specific agent
   */
  startAgentMonitoring(agentId: string): void {
    // Start security session
    const sessionId = this.securityManager.startAgentSecuritySession(agentId)
    console.log(`🔒 Started security session for agent ${agentId}: ${sessionId}`)

    // Set up monitoring interval
    const interval = setInterval(() => {
      this.performAgentSecurityCheck(agentId)
    }, this.config.security_scan_interval * 60 * 1000) // Convert minutes to milliseconds

    this.monitoringIntervals.set(agentId, interval)
    console.log(`⏰ Set up monitoring interval for agent ${agentId} (${this.config.security_scan_interval}min)`)
  }

  /**
   * Stop monitoring for a specific agent
   */
  stopAgentMonitoring(agentId: string): void {
    const interval = this.monitoringIntervals.get(agentId)
    if (interval) {
      clearInterval(interval)
      this.monitoringIntervals.delete(agentId)
      
      // End security session
      this.securityManager.endAgentSecuritySession(agentId)
      console.log(`🛑 Stopped monitoring for agent ${agentId}`)
    }
  }

  /**
   * Stop all monitoring
   */
  stopAllMonitoring(): void {
    console.log('🛑 Stopping all agent monitoring...')
    
    for (const agentId of this.monitoringIntervals.keys()) {
      this.stopAgentMonitoring(agentId)
    }
    
    console.log('✅ All monitoring stopped')
  }

  /**
   * Perform security check for an agent
   */
  private async performAgentSecurityCheck(agentId: string): Promise<void> {
    try {
      console.log(`🔍 Performing security check for agent ${agentId}...`)

      // Monitor agent behavior for anomalies
      if (this.config.anomaly_detection_enabled) {
        const behaviorAnalysis = this.securityManager.monitorAgentBehavior(agentId)
        
        if (behaviorAnalysis.anomaly_detected) {
          await this.handleSecurityAnomaly(agentId, behaviorAnalysis)
        }
      }

      // Get compliance status
      const compliance = this.securityManager.getAgentSecurityCompliance(agentId)
      
      if (compliance.overall_status === 'Non-Compliant') {
        await this.handleComplianceIssue(agentId, compliance)
      }

      console.log(`✅ Security check completed for agent ${agentId}`)

    } catch (error) {
      console.error(`❌ Security check failed for agent ${agentId}:`, error)
      await this.handleSecurityError(agentId, error)
    }
  }

  /**
   * Handle detected security anomaly
   */
  private async handleSecurityAnomaly(agentId: string, behaviorAnalysis: any): Promise<void> {
    console.log(`🚨 Security anomaly detected for agent ${agentId}:`)
    console.log(`  Risk Level: ${behaviorAnalysis.risk_level}`)
    console.log(`  Anomalies: ${behaviorAnalysis.anomalies.length}`)

    // Log security event
    this.securityManager.logAgentSecurityEvent(
      agentId,
      'Escalation',
      `Security anomaly detected: ${behaviorAnalysis.anomalies.join(', ')}`,
      {
        risk_level: behaviorAnalysis.risk_level,
        anomalies: behaviorAnalysis.anomalies,
        recommendations: behaviorAnalysis.recommendations,
        timestamp: new Date().toISOString()
      },
      this.calculateRiskScore(behaviorAnalysis.risk_level)
    )

    // Handle based on risk level
    switch (behaviorAnalysis.risk_level) {
      case 'critical':
        await this.handleCriticalAnomaly(agentId, behaviorAnalysis)
        break
      case 'high':
        await this.handleHighRiskAnomaly(agentId, behaviorAnalysis)
        break
      case 'medium':
        await this.handleMediumRiskAnomaly(agentId, behaviorAnalysis)
        break
      case 'low':
        await this.handleLowRiskAnomaly(agentId, behaviorAnalysis)
        break
    }
  }

  /**
   * Handle compliance issues
   */
  private async handleComplianceIssue(agentId: string, compliance: any): Promise<void> {
    console.log(`⚠️ Compliance issue detected for agent ${agentId}:`)
    console.log(`  Status: ${compliance.overall_status}`)
    console.log(`  Score: ${compliance.compliance_score}`)
    console.log(`  Findings: ${compliance.total_findings}`)

    // Log compliance event
    this.securityManager.logAgentSecurityEvent(
      agentId,
      'Error',
      `Compliance violation detected: ${compliance.total_findings} findings`,
      {
        compliance_status: compliance.overall_status,
        compliance_score: compliance.compliance_score,
        findings_by_severity: compliance.findings_by_severity,
        timestamp: new Date().toISOString()
      },
      2.5 // Medium-high risk for compliance issues
    )

    // Generate compliance alert
    if (this.config.real_time_alerting) {
      await this.sendComplianceAlert(agentId, compliance)
    }
  }

  /**
   * Handle security errors
   */
  private async handleSecurityError(agentId: string, error: any): Promise<void> {
    console.log(`❌ Security error for agent ${agentId}:`, error.message)

    // Log error event
    this.securityManager.logAgentSecurityEvent(
      agentId,
      'Error',
      `Security monitoring error: ${error.message}`,
      {
        error_type: error.constructor.name,
        stack: error.stack,
        timestamp: new Date().toISOString()
      },
      3.0 // High risk for security errors
    )
  }

  /**
   * Handle critical anomalies
   */
  private async handleCriticalAnomaly(agentId: string, behaviorAnalysis: any): Promise<void> {
    console.log(`🚨 CRITICAL: Immediate action required for agent ${agentId}`)
    
    // Log critical event
    this.securityManager.logAgentSecurityEvent(
      agentId,
      'Escalation',
      'Critical security anomaly - immediate intervention required',
      {
        anomalies: behaviorAnalysis.anomalies,
        recommendations: behaviorAnalysis.recommendations,
        escalation_level: 'CRITICAL',
        timestamp: new Date().toISOString()
      },
      4.0 // Maximum risk
    )

    // Send immediate alert
    if (this.config.real_time_alerting) {
      await this.sendCriticalAlert(agentId, behaviorAnalysis)
    }

    // Consider suspending agent operations
    console.log(`⚠️ Consider suspending agent ${agentId} operations immediately`)
  }

  /**
   * Handle high-risk anomalies
   */
  private async handleHighRiskAnomaly(agentId: string, behaviorAnalysis: any): Promise<void> {
    console.log(`⚠️ HIGH RISK: Prompt attention required for agent ${agentId}`)
    
    // Send alert
    if (this.config.real_time_alerting) {
      await this.sendHighRiskAlert(agentId, behaviorAnalysis)
    }

    // Increase monitoring frequency
    this.increaseMonitoringFrequency(agentId)
  }

  /**
   * Handle medium-risk anomalies
   */
  private async handleMediumRiskAnomaly(agentId: string, behaviorAnalysis: any): Promise<void> {
    console.log(`⚠️ MEDIUM RISK: Monitor closely for agent ${agentId}`)
    
    // Log for review
    console.log(`📝 Medium risk anomalies logged for review: ${behaviorAnalysis.anomalies.join(', ')}`)
  }

  /**
   * Handle low-risk anomalies
   */
  private async handleLowRiskAnomaly(agentId: string, behaviorAnalysis: any): Promise<void> {
    console.log(`ℹ️ LOW RISK: Normal monitoring for agent ${agentId}`)
    
    // Continue normal monitoring
    console.log(`📝 Low risk anomalies noted: ${behaviorAnalysis.anomalies.join(', ')}`)
  }

  /**
   * Run comprehensive security analysis for all agents
   */
  async runComprehensiveSecurityAnalysis(): Promise<{
    timestamp: string
    summary: {
      total_agents: number
      secure_agents: number
      warning_agents: number
      critical_agents: number
      total_findings: number
    }
    agent_analyses: Record<string, any>
    recommendations: string[]
    overall_security_posture: 'secure' | 'at_risk' | 'compromised'
  }> {
    console.log('🔍 Running comprehensive agent security analysis...')

    const agentAnalyses: Record<string, any> = {}
    const summary = {
      total_agents: this.agentConfigs.length,
      secure_agents: 0,
      warning_agents: 0,
      critical_agents: 0,
      total_findings: 0
    }

    for (const agentConfig of this.agentConfigs) {
      try {
        console.log(`\n📊 Analyzing security for agent: ${agentConfig.agent_id}`)
        
        const analysis = await this.securityManager.runAgentSecurityAnalysis(
          agentConfig.agent_id,
          `/agents/${agentConfig.agent_id}`
        )
        
        agentAnalyses[agentConfig.agent_id] = analysis
        summary.total_findings += analysis.security_findings.total_findings

        // Categorize security posture
        switch (analysis.overall) {
          case 'secure':
            summary.secure_agents++
            break
          case 'warning':
            summary.warning_agents++
            break
          case 'critical':
            summary.critical_agents++
            break
        }

      } catch (error) {
        console.error(`❌ Failed to analyze agent ${agentConfig.agent_id}:`, error)
        summary.critical_agents++
      }
    }

    // Generate recommendations
    const recommendations = this.generateSecurityRecommendations(summary)

    // Determine overall security posture
    let overallPosture: 'secure' | 'at_risk' | 'compromised' = 'secure'
    if (summary.critical_agents > 0) {
      overallPosture = 'compromised'
    } else if (summary.warning_agents > 0 || summary.total_findings > 0) {
      overallPosture = 'at_risk'
    }

    const report = {
      timestamp: new Date().toISOString(),
      summary,
      agent_analyses: agentAnalyses,
      recommendations,
      overall_security_posture: overallPosture
    }

    console.log(`\n✅ Security analysis completed: ${overallPosture.toUpperCase()} posture`)
    return report
  }

  /**
   * Get real-time security status for all agents
   */
  getRealTimeSecurityStatus(): Record<string, any> {
    return this.securityManager.getAllAgentsSecurityStatus()
  }

  /**
   * Generate security compliance report
   */
  async generateSecurityComplianceReport(): Promise<{
    timestamp: string
    compliance_summary: Record<string, any>
    compliance_trends: {
      improving: string[]
      degrading: string[]
      stable: string[]
    }
    compliance_recommendations: string[]
  }> {
    console.log('📊 Generating security compliance report...')

    const complianceSummary: Record<string, any> = {}
    const trends = {
      improving: [] as string[],
      degrading: [] as string[],
      stable: [] as string[]
    }

    for (const agentConfig of this.agentConfigs) {
      try {
        const compliance = this.securityManager.getAgentSecurityCompliance(agentConfig.agent_id)
        complianceSummary[agentConfig.agent_id] = compliance

        // Analyze trends (simplified - would need historical data for real trends)
        if (compliance.compliance_score >= 90) {
          trends.improving.push(agentConfig.agent_id)
        } else if (compliance.compliance_score < 70) {
          trends.degrading.push(agentConfig.agent_id)
        } else {
          trends.stable.push(agentConfig.agent_id)
        }

      } catch (error) {
        console.error(`❌ Failed to get compliance for agent ${agentConfig.agent_id}:`, error)
      }
    }

    const recommendations = this.generateComplianceRecommendations(complianceSummary)

    const report = {
      timestamp: new Date().toISOString(),
      compliance_summary: complianceSummary,
      compliance_trends: trends,
      compliance_recommendations: recommendations
    }

    console.log('✅ Security compliance report generated')
    return report
  }

  // Helper methods

  private calculateRiskScore(riskLevel: string): number {
    const scores = {
      'low': 1.0,
      'medium': 2.0,
      'high': 3.0,
      'critical': 4.0
    }
    return scores[riskLevel as keyof typeof scores] || 2.0
  }

  private increaseMonitoringFrequency(agentId: string): void {
    console.log(`⏰ Increasing monitoring frequency for agent ${agentId}`)
    // Implementation would update the monitoring interval
  }

  private async sendCriticalAlert(agentId: string, behaviorAnalysis: any): Promise<void> {
    console.log(`🚨 CRITICAL ALERT: Agent ${agentId} requires immediate attention`)
    console.log(`Anomalies: ${behaviorAnalysis.anomalies.join(', ')}`)
    console.log(`Recommendations: ${behaviorAnalysis.recommendations.join(', ')}`)
    // Implementation would send actual alert (email, Slack, etc.)
  }

  private async sendHighRiskAlert(agentId: string, behaviorAnalysis: any): Promise<void> {
    console.log(`⚠️ HIGH RISK ALERT: Agent ${agentId} needs attention`)
    console.log(`Anomalies: ${behaviorAnalysis.anomalies.join(', ')}`)
    // Implementation would send actual alert
  }

  private async sendComplianceAlert(agentId: string, compliance: any): Promise<void> {
    console.log(`⚠️ COMPLIANCE ALERT: Agent ${agentId} has compliance issues`)
    console.log(`Status: ${compliance.overall_status}, Score: ${compliance.compliance_score}`)
    // Implementation would send actual alert
  }

  private generateSecurityRecommendations(summary: any): string[] {
    const recommendations: string[] = []

    if (summary.critical_agents > 0) {
      recommendations.push(`Immediately address ${summary.critical_agents} critical security issues`)
      recommendations.push('Consider suspending compromised agents')
    }

    if (summary.warning_agents > 0) {
      recommendations.push(`Review and remediate ${summary.warning_agents} agents with security warnings`)
    }

    if (summary.total_findings > 0) {
      recommendations.push(`Address ${summary.total_findings} total security findings across all agents`)
    }

    if (summary.secure_agents === summary.total_agents) {
      recommendations.push('All agents are secure - continue monitoring')
    }

    return recommendations
  }

  private generateComplianceRecommendations(complianceSummary: Record<string, any>): string[] {
    const recommendations: string[] = []
    const agentIds = Object.keys(complianceSummary)

    const nonCompliantAgents = agentIds.filter(id => 
      complianceSummary[id].overall_status === 'Non-Compliant'
    )

    if (nonCompliantAgents.length > 0) {
      recommendations.push(`Address compliance violations for ${nonCompliantAgents.length} agents`)
    }

    const lowScoreAgents = agentIds.filter(id => 
      complianceSummary[id].compliance_score < 80
    )

    if (lowScoreAgents.length > 0) {
      recommendations.push(`Improve compliance posture for ${lowScoreAgents.length} agents with low scores`)
    }

    return recommendations
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2)
  const command = args[0] || 'monitor'

  try {
    const config = loadSecurityConfig()
    const agentConfigs = loadAgentSecurityConfigs()
    const securityManager = new AgentSecurityManager(config, agentConfigs)

    switch (command) {
      case 'monitor':
        console.log('🔍 Starting agent security monitoring...')
        securityManager.startContinuousMonitoring()
        
        // Handle graceful shutdown
        process.on('SIGINT', () => {
          console.log('\n🛑 Shutting down security monitoring...')
          securityManager.stopAllMonitoring()
          process.exit(0)
        })
        
        console.log('🔒 Agent security monitoring is active. Press Ctrl+C to stop.')
        
        // Keep process alive
        await new Promise(() => {})
        break

      case 'analyze':
        console.log('📊 Running comprehensive security analysis...')
        const analysis = await securityManager.runComprehensiveSecurityAnalysis()
        
        const analysisPath = resolve(__dirname, '../agent-security-analysis.json')
        writeFileSync(analysisPath, JSON.stringify(analysis, null, 2))
        
        console.log(`\n📋 Security Analysis Summary:`)
        console.log(`Overall Posture: ${analysis.overall_security_posture.toUpperCase()}`)
        console.log(`Total Agents: ${analysis.summary.total_agents}`)
        console.log(`Secure: ${analysis.summary.secure_agents}`)
        console.log(`At Risk: ${analysis.summary.warning_agents}`)
        console.log(`Critical: ${analysis.summary.critical_agents}`)
        console.log(`Total Findings: ${analysis.summary.total_findings}`)
        console.log(`\n📄 Analysis report saved to: ${analysisPath}`)
        break

      case 'status':
        console.log('📊 Getting real-time security status...')
        const status = securityManager.getRealTimeSecurityStatus()
        console.log('\n📋 Real-time Security Status:')
        console.log(JSON.stringify(status, null, 2))
        break

      case 'compliance':
        console.log('📊 Generating security compliance report...')
        const compliance = await securityManager.generateSecurityComplianceReport()
        
        const compliancePath = resolve(__dirname, '../agent-security-compliance.json')
        writeFileSync(compliancePath, JSON.stringify(compliance, null, 2))
        
        console.log(`\n📋 Compliance Report Summary:`)
        console.log(`Improving: ${compliance.compliance_trends.improving.length} agents`)
        console.log(`Degrading: ${compliance.compliance_trends.degrading.length} agents`)
        console.log(`Stable: ${compliance.compliance_trends.stable.length} agents`)
        console.log(`\n📄 Compliance report saved to: ${compliancePath}`)
        break

      case 'check':
        const agentId = args[1]
        if (!agentId) {
          console.error('❌ Agent ID required for security check')
          process.exit(1)
        }
        
        console.log(`🔍 Performing security check for agent ${agentId}...`)
        await securityManager.performAgentSecurityCheck(agentId)
        console.log(`✅ Security check completed for agent ${agentId}`)
        break

      default:
        console.error(`❌ Unknown command: ${command}`)
        console.log('Available commands: monitor, analyze, status, compliance, check <agent-id>')
        process.exit(1)
    }

  } catch (error) {
    console.error('❌ Agent security execution failed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}
