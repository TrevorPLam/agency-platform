#!/usr/bin/env node

/**
 * Agent Governance Automation Script
 * 
 * Extends the existing governance automation with agent-specific capabilities,
 * including agent lifecycle management, policy enforcement, and audit trail management.
 */

import { PropertyManager } from '@agency/governance'
import { SecurityManager } from '@agency/security'
import { 
  AgentProperties,
  AgentAuthorization,
  AgentRiskAssessment,
  AgentAuditTrail,
  ComplianceFramework,
  AgentLifecycleStage
} from '@agency/governance/types'

import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

interface Config {
  token: string
  organization: string
  agent_governance_enabled: boolean
  default_compliance_frameworks: ComplianceFramework[]
  risk_thresholds: {
    autonomy_risk: number
    decision_impact_risk: number
    bias_fairness_risk: number
    overall_risk: number
  }
}

interface AgentGovernanceConfig {
  agent_id: string
  properties: AgentProperties
  authorization: AgentAuthorization
  compliance_frameworks: ComplianceFramework[]
}

function loadConfig(): Config {
  try {
    const configPath = resolve(__dirname, '../config.json')
    const configData = readFileSync(configPath, 'utf-8')
    return JSON.parse(configData)
  } catch (error) {
    console.error('Failed to load config.json:', error)
    process.exit(1)
  }
}

function loadAgentConfigs(): AgentGovernanceConfig[] {
  try {
    const agentsPath = resolve(__dirname, '../agents.json')
    const agentsData = readFileSync(agentsPath, 'utf-8')
    return JSON.parse(agentsData)
  } catch (error) {
    console.warn('No agents.json found, using empty configuration')
    return []
  }
}

class AgentGovernanceManager {
  private propertyManager: PropertyManager
  private securityManager: SecurityManager
  private config: Config
  private agentConfigs: AgentGovernanceConfig[]

  constructor(config: Config, agentConfigs: AgentGovernanceConfig[]) {
    this.config = config
    this.agentConfigs = agentConfigs
    
    // Initialize property manager
    this.propertyManager = new PropertyManager({
      token: config.token,
      organization: config.organization
    })

    // Initialize security manager
    this.securityManager = new SecurityManager({
      config: {
        sbomGeneration: { enabled: true },
        integrityVerification: { enabled: true },
        provenanceTracking: { enabled: true },
        vulnerabilityScanning: { enabled: true }
      }
    })

    // Register all agents with security manager
    this.registerAgents()
  }

  /**
   * Register all configured agents with the security manager
   */
  private registerAgents(): void {
    for (const agentConfig of this.agentConfigs) {
      this.securityManager.registerAgent(
        agentConfig.agent_id,
        agentConfig.properties,
        agentConfig.authorization,
        agentConfig.compliance_frameworks
      )
      console.log(`🤖 Registered agent: ${agentConfig.agent_id}`)
    }
  }

  /**
   * Run comprehensive agent governance validation
   */
  async runAgentGovernanceValidation(): Promise<{
    valid: boolean
    agents_validated: number
    violations: string[]
    recommendations: string[]
    risk_summary: Record<string, any>
  }> {
    console.log('🔍 Running agent governance validation...')

    const results = {
      valid: true,
      agents_validated: 0,
      violations: [] as string[],
      recommendations: [] as string[],
      risk_summary: {} as Record<string, any>
    }

    if (!this.config.agent_governance_enabled) {
      console.log('ℹ️ Agent governance is disabled in configuration')
      return results
    }

    for (const agentConfig of this.agentConfigs) {
      try {
        console.log(`\n📋 Validating agent: ${agentConfig.agent_id}`)
        
        // Validate agent properties
        const propertyValidation = this.validateAgentProperties(agentConfig.properties)
        if (!propertyValidation.valid) {
          results.valid = false
          results.violations.push(...propertyValidation.violations)
        }
        results.recommendations.push(...propertyValidation.recommendations)

        // Validate agent authorization
        const authValidation = this.validateAgentAuthorization(agentConfig.authorization)
        if (!authValidation.valid) {
          results.valid = false
          results.violations.push(...authValidation.violations)
        }
        results.recommendations.push(...authValidation.recommendations)

        // Check compliance frameworks
        const complianceValidation = this.validateComplianceFrameworks(
          agentConfig.compliance_frameworks,
          agentConfig.properties
        )
        if (!complianceValidation.valid) {
          results.valid = false
          results.violations.push(...complianceValidation.violations)
        }
        results.recommendations.push(...complianceValidation.recommendations)

        // Calculate risk assessment
        const riskAssessment = this.calculateAgentRisk(agentConfig)
        results.risk_summary[agentConfig.agent_id] = riskAssessment

        // Check risk thresholds
        const riskValidation = this.validateRiskThresholds(riskAssessment)
        if (!riskValidation.valid) {
          results.valid = false
          results.violations.push(...riskValidation.violations)
        }
        results.recommendations.push(...riskValidation.recommendations)

        results.agents_validated++

      } catch (error) {
        console.error(`❌ Failed to validate agent ${agentConfig.agent_id}:`, error)
        results.valid = false
        results.violations.push(`Validation failed for agent ${agentConfig.agent_id}`)
      }
    }

    console.log(`\n✅ Agent governance validation completed: ${results.agents_validated} agents validated`)
    return results
  }

  /**
   * Validate agent properties against governance requirements
   */
  private validateAgentProperties(properties: AgentProperties): {
    valid: boolean
    violations: string[]
    recommendations: string[]
  } {
    const violations: string[] = []
    const recommendations: string[] = []

    // Check required fields
    if (!properties.agent_type) {
      violations.push('Agent type is required')
      recommendations.push('Specify agent type (Autonomous, Semi-Autonomous, Scripted, or Orchestrator)')
    }

    if (!properties.autonomy_level) {
      violations.push('Autonomy level is required')
      recommendations.push('Specify autonomy level (Low, Medium, High, or Critical)')
    }

    if (!properties.decision_scope) {
      violations.push('Decision scope is required')
      recommendations.push('Specify decision scope (Internal, Customer-Facing, System-Admin, or Cross-System)')
    }

    // Validate authority boundaries
    if (!properties.authority_boundaries || properties.authority_boundaries.length === 0) {
      violations.push('Authority boundaries are required')
      recommendations.push('Define authority boundaries for agent decision-making')
    }

    // Validate escalation paths
    if (!properties.escalation_paths || properties.escalation_paths.length === 0) {
      violations.push('Escalation paths are required')
      recommendations.push('Define escalation paths for agent decision escalation')
    }

    // Check human oversight requirements
    if (properties.autonomy_level === 'Critical' && !properties.human_oversight_required) {
      violations.push('Critical autonomy level requires human oversight')
      recommendations.push('Enable human oversight for critical autonomy agents')
    }

    // Validate compliance frameworks
    if (properties.data_access_level === 'Restricted' && properties.compliance_frameworks.length === 0) {
      violations.push('Restricted data access requires compliance frameworks')
      recommendations.push('Add appropriate compliance frameworks (HIPAA, GDPR, etc.)')
    }

    return {
      valid: violations.length === 0,
      violations,
      recommendations
    }
  }

  /**
   * Validate agent authorization configuration
   */
  private validateAgentAuthorization(authorization: AgentAuthorization): {
    valid: boolean
    violations: string[]
    recommendations: string[]
  } {
    const violations: string[] = []
    const recommendations: string[] = []

    // Check permissions
    if (!authorization.permissions || authorization.permissions.length === 0) {
      violations.push('Agent permissions are required')
      recommendations.push('Define agent permissions for system access')
    }

    // Check role assignments
    if (!authorization.role_assignments || authorization.role_assignments.length === 0) {
      violations.push('Agent role assignments are required')
      recommendations.push('Assign appropriate roles to the agent')
    }

    // Validate session management
    if (!authorization.session_management) {
      violations.push('Session management configuration is required')
      recommendations.push('Configure session management for the agent')
    }

    // Check session timeout
    if (authorization.session_management.session_timeout_minutes > 1440) {
      violations.push('Session timeout should not exceed 24 hours')
      recommendations.push('Set reasonable session timeout for security')
    }

    // Validate access tokens
    const activeTokens = authorization.access_tokens.filter(token => !token.revoked)
    if (activeTokens.length > authorization.session_management.max_concurrent_sessions) {
      violations.push('Active tokens exceed maximum concurrent sessions')
      recommendations.push('Revoke excess tokens or increase session limit')
    }

    return {
      valid: violations.length === 0,
      violations,
      recommendations
    }
  }

  /**
   * Validate compliance frameworks for agent
   */
  private validateComplianceFrameworks(
    frameworks: ComplianceFramework[],
    properties: AgentProperties
  ): {
    valid: boolean
    violations: string[]
    recommendations: string[]
  } {
    const violations: string[] = []
    const recommendations: string[] = []

    // Check HIPAA compliance for healthcare data
    if (properties.data_access_level === 'Restricted' && !frameworks.includes('HIPAA')) {
      violations.push('HIPAA compliance required for restricted data access')
      recommendations.push('Add HIPAA compliance framework for healthcare data')
    }

    // Check GDPR compliance for customer-facing agents
    if (properties.decision_scope === 'Customer-Facing' && !frameworks.includes('GDPR')) {
      violations.push('GDPR compliance recommended for customer-facing agents')
      recommendations.push('Consider adding GDPR compliance for customer data protection')
    }

    // Check SOC2 for high-risk agents
    if (properties.autonomy_level === 'Critical' && !frameworks.includes('SOC2')) {
      violations.push('SOC2 compliance recommended for critical autonomy agents')
      recommendations.push('Add SOC2 compliance framework for critical systems')
    }

    return {
      valid: violations.length === 0,
      violations,
      recommendations
    }
  }

  /**
   * Calculate risk assessment for agent
   */
  private calculateAgentRisk(agentConfig: AgentGovernanceConfig): AgentRiskAssessment {
    // This would integrate with the @agency/governance risk assessment engine
    // For now, return a simplified assessment
    const riskScore = this.calculateSimpleRiskScore(agentConfig.properties)
    
    return {
      score: riskScore,
      category: this.getRiskCategory(riskScore),
      factors: [],
      recommendations: [],
      last_assessed: new Date().toISOString(),
      agent_specific_factors: [],
      autonomy_risk_score: this.calculateAutonomyRisk(agentConfig.properties),
      human_oversight_risk: this.calculateHumanOversightRisk(agentConfig.properties),
      decision_impact_risk: this.calculateDecisionImpactRisk(agentConfig.properties),
      bias_fairness_risk: this.calculateBiasFairnessRisk(agentConfig.properties),
      overall_agent_risk: this.getRiskCategory(riskScore)
    }
  }

  /**
   * Validate risk assessment against thresholds
   */
  private validateRiskThresholds(riskAssessment: AgentRiskAssessment): {
    valid: boolean
    violations: string[]
    recommendations: string[]
  } {
    const violations: string[] = []
    const recommendations: string[] = []

    // Check autonomy risk
    if (riskAssessment.autonomy_risk_score > this.config.risk_thresholds.autonomy_risk) {
      violations.push(`Autonomy risk score ${riskAssessment.autonomy_risk_score} exceeds threshold ${this.config.risk_thresholds.autonomy_risk}`)
      recommendations.push('Implement additional autonomy controls and oversight')
    }

    // Check decision impact risk
    if (riskAssessment.decision_impact_risk > this.config.risk_thresholds.decision_impact_risk) {
      violations.push(`Decision impact risk score ${riskAssessment.decision_impact_risk} exceeds threshold ${this.config.risk_thresholds.decision_impact_risk}`)
      recommendations.push('Implement decision approval workflows and boundaries')
    }

    // Check bias and fairness risk
    if (riskAssessment.bias_fairness_risk > this.config.risk_thresholds.bias_fairness_risk) {
      violations.push(`Bias and fairness risk score ${riskAssessment.bias_fairness_risk} exceeds threshold ${this.config.risk_thresholds.bias_fairness_risk}`)
      recommendations.push('Implement bias detection and fairness monitoring')
    }

    // Check overall risk
    if (riskAssessment.score > this.config.risk_thresholds.overall_risk) {
      violations.push(`Overall risk score ${riskAssessment.score} exceeds threshold ${this.config.risk_thresholds.overall_risk}`)
      recommendations.push('Review agent configuration and implement additional controls')
    }

    return {
      valid: violations.length === 0,
      violations,
      recommendations
    }
  }

  /**
   * Start agent monitoring session
   */
  startAgentMonitoring(agentId: string): string {
    try {
      const sessionId = this.securityManager.startAgentSecuritySession(agentId)
      console.log(`🔒 Started monitoring session ${sessionId} for agent ${agentId}`)
      return sessionId
    } catch (error) {
      console.error(`❌ Failed to start monitoring for agent ${agentId}:`, error)
      throw error
    }
  }

  /**
   * End agent monitoring session
   */
  endAgentMonitoring(agentId: string, sessionId?: string) {
    try {
      const result = this.securityManager.endAgentSecuritySession(agentId, sessionId)
      console.log(`✅ Ended monitoring for agent ${agentId}: ${result.events_count} events, ${result.findings_count} findings`)
      return result
    } catch (error) {
      console.error(`❌ Failed to end monitoring for agent ${agentId}:`, error)
      throw error
    }
  }

  /**
   * Get agent compliance report
   */
  getAgentComplianceReport(agentId: string): any {
    try {
      const compliance = this.securityManager.getAgentSecurityCompliance(agentId)
      const auditTrails = this.securityManager.getAgentAuditTrail(agentId)
      
      return {
        agent_id: agentId,
        compliance_status: compliance.overall_status,
        compliance_score: compliance.compliance_score,
        total_findings: compliance.total_findings,
        findings_by_severity: compliance.findings_by_severity,
        findings_by_category: compliance.findings_by_category,
        total_sessions: auditTrails.length,
        last_audit: compliance.last_audit
      }
    } catch (error) {
      console.error(`❌ Failed to get compliance report for agent ${agentId}:`, error)
      throw error
    }
  }

  /**
   * Generate comprehensive agent governance report
   */
  async generateGovernanceReport(): Promise<{
    timestamp: string
    summary: {
      total_agents: number
      compliant_agents: number
      non_compliant_agents: number
      high_risk_agents: number
      critical_risk_agents: number
    }
    agent_reports: Record<string, any>
    recommendations: string[]
    overall_status: 'healthy' | 'warning' | 'critical'
  }> {
    console.log('📊 Generating agent governance report...')

    const agentReports: Record<string, any> = {}
    const summary = {
      total_agents: this.agentConfigs.length,
      compliant_agents: 0,
      non_compliant_agents: 0,
      high_risk_agents: 0,
      critical_risk_agents: 0
    }

    for (const agentConfig of this.agentConfigs) {
      try {
        const report = this.getAgentComplianceReport(agentConfig.agent_id)
        agentReports[agentConfig.agent_id] = report

        if (report.compliance_status === 'Compliant') {
          summary.compliant_agents++
        } else {
          summary.non_compliant_agents++
        }

        // Get risk assessment
        const riskAssessment = this.calculateAgentRisk(agentConfig)
        if (riskAssessment.category === 'High') {
          summary.high_risk_agents++
        } else if (riskAssessment.category === 'Critical') {
          summary.critical_risk_agents++
        }

      } catch (error) {
        console.error(`❌ Failed to generate report for agent ${agentConfig.agent_id}:`, error)
        summary.non_compliant_agents++
      }
    }

    // Generate overall recommendations
    const recommendations = this.generateOverallRecommendations(summary)

    // Determine overall status
    let overallStatus: 'healthy' | 'warning' | 'critical' = 'healthy'
    if (summary.critical_risk_agents > 0 || summary.non_compliant_agents > summary.compliant_agents) {
      overallStatus = 'critical'
    } else if (summary.high_risk_agents > 0 || summary.non_compliant_agents > 0) {
      overallStatus = 'warning'
    }

    const report = {
      timestamp: new Date().toISOString(),
      summary,
      agent_reports: agentReports,
      recommendations,
      overall_status
    }

    console.log(`✅ Governance report generated: ${overallStatus} status`)
    return report
  }

  // Helper methods

  private calculateSimpleRiskScore(properties: AgentProperties): number {
    let score = 1.0

    // Autonomy level contribution
    const autonomyWeights = { 'Low': 1.0, 'Medium': 2.0, 'High': 3.0, 'Critical': 4.0 }
    score += autonomyWeights[properties.autonomy_level] * 0.3

    // Decision scope contribution
    const scopeWeights = { 'Internal': 1.0, 'Customer-Facing': 2.0, 'System-Admin': 3.0, 'Cross-System': 4.0 }
    score += scopeWeights[properties.decision_scope] * 0.25

    // Data access contribution
    const dataWeights = { 'Public': 1.0, 'Internal': 2.0, 'Confidential': 3.0, 'Restricted': 4.0 }
    score += dataWeights[properties.data_access_level] * 0.2

    // Human oversight contribution
    score += properties.human_oversight_required ? 0.5 : 1.5

    return Math.min(score, 4.0)
  }

  private getRiskCategory(score: number): 'Low' | 'Medium' | 'High' | 'Critical' {
    if (score >= 3.0) return 'Critical'
    if (score >= 2.5) return 'High'
    if (score >= 1.8) return 'Medium'
    return 'Low'
  }

  private calculateAutonomyRisk(properties: AgentProperties): number {
    const weights = { 'Low': 1.0, 'Medium': 2.0, 'High': 3.0, 'Critical': 4.0 }
    return weights[properties.autonomy_level]
  }

  private calculateHumanOversightRisk(properties: AgentProperties): number {
    return properties.human_oversight_required ? 1.0 : 3.0
  }

  private calculateDecisionImpactRisk(properties: AgentProperties): number {
    const weights = { 'Low': 1.0, 'Medium': 2.0, 'High': 3.0, 'Critical': 4.0 }
    return weights[properties.max_decision_impact]
  }

  private calculateBiasFairnessRisk(properties: AgentProperties): number {
    let risk = 1.5
    if (properties.decision_scope === 'Customer-Facing') risk *= 1.5
    if (properties.reasoning_approach === 'Neural') risk *= 1.2
    return Math.min(risk, 4.0)
  }

  private generateOverallRecommendations(summary: any): string[] {
    const recommendations: string[] = []

    if (summary.critical_risk_agents > 0) {
      recommendations.push(`Address ${summary.critical_risk_agents} critical-risk agents immediately`)
      recommendations.push('Consider suspending high-risk agent operations')
    }

    if (summary.high_risk_agents > 0) {
      recommendations.push(`Review and mitigate risks for ${summary.high_risk_agents} high-risk agents`)
    }

    if (summary.non_compliant_agents > 0) {
      recommendations.push(`Address compliance violations for ${summary.non_compliant_agents} non-compliant agents`)
    }

    if (summary.compliant_agents < summary.total_agents) {
      recommendations.push('Implement enhanced agent governance controls')
      recommendations.push('Review and update agent governance policies')
    }

    if (recommendations.length === 0) {
      recommendations.push('Continue monitoring agent governance posture')
    }

    return recommendations
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2)
  const command = args[0] || 'validate'

  try {
    const config = loadConfig()
    const agentConfigs = loadAgentConfigs()
    const governanceManager = new AgentGovernanceManager(config, agentConfigs)

    switch (command) {
      case 'validate':
        console.log('🔍 Running agent governance validation...')
        const validationResults = await governanceManager.runAgentGovernanceValidation()
        console.log('\n📋 Validation Results:')
        console.log(`Valid: ${validationResults.valid}`)
        console.log(`Agents Validated: ${validationResults.agents_validated}`)
        console.log(`Violations: ${validationResults.violations.length}`)
        console.log(`Recommendations: ${validationResults.recommendations.length}`)
        
        if (validationResults.violations.length > 0) {
          console.log('\n❌ Violations:')
          validationResults.violations.forEach(v => console.log(`  - ${v}`))
        }
        
        if (validationResults.recommendations.length > 0) {
          console.log('\n💡 Recommendations:')
          validationResults.recommendations.forEach(r => console.log(`  - ${r}`))
        }
        break

      case 'monitor':
        const agentId = args[1]
        if (!agentId) {
          console.error('❌ Agent ID required for monitoring')
          process.exit(1)
        }
        
        const sessionId = governanceManager.startAgentMonitoring(agentId)
        console.log(`🔒 Monitoring started for agent ${agentId} (Session: ${sessionId})`)
        console.log('Press Ctrl+C to stop monitoring...')
        
        // Handle graceful shutdown
        process.on('SIGINT', () => {
          console.log('\n🛑 Stopping monitoring...')
          governanceManager.endAgentMonitoring(agentId, sessionId)
          process.exit(0)
        })
        
        // Keep process alive
        await new Promise(() => {})
        break

      case 'report':
        console.log('📊 Generating agent governance report...')
        const report = await governanceManager.generateGovernanceReport()
        
        const reportPath = resolve(__dirname, '../agent-governance-report.json')
        writeFileSync(reportPath, JSON.stringify(report, null, 2))
        
        console.log(`\n📋 Governance Report Summary:`)
        console.log(`Overall Status: ${report.overall_status.toUpperCase()}`)
        console.log(`Total Agents: ${report.summary.total_agents}`)
        console.log(`Compliant: ${report.summary.compliant_agents}`)
        console.log(`Non-Compliant: ${report.summary.non_compliant_agents}`)
        console.log(`High Risk: ${report.summary.high_risk_agents}`)
        console.log(`Critical Risk: ${report.summary.critical_risk_agents}`)
        console.log(`\n📄 Report saved to: ${reportPath}`)
        break

      case 'compliance':
        const complianceAgentId = args[1]
        if (!complianceAgentId) {
          console.error('❌ Agent ID required for compliance report')
          process.exit(1)
        }
        
        const complianceReport = governanceManager.getAgentComplianceReport(complianceAgentId)
        console.log(`\n📋 Compliance Report for ${complianceAgentId}:`)
        console.log(JSON.stringify(complianceReport, null, 2))
        break

      default:
        console.error(`❌ Unknown command: ${command}`)
        console.log('Available commands: validate, monitor <agent-id>, report, compliance <agent-id>')
        process.exit(1)
    }

  } catch (error) {
    console.error('❌ Agent governance execution failed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}
