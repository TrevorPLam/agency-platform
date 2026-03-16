#!/usr/bin/env node

/**
 * Automated compliance checking system for repository governance
 */

import { PropertyManager } from '@agency/governance'
import { 
  ComplianceCheck, 
  ComplianceViolation, 
  ComplianceFramework,
  RepositoryProperties 
} from '@agency/governance/types'
import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

interface Config {
  token: string
  organization: string
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

/**
 * Manages automated compliance checking for repositories
 */
export class ComplianceChecker {
  private propertyManager: PropertyManager

  constructor(token: string, organization: string) {
    this.propertyManager = new PropertyManager(token, organization)
  }

  /**
   * Run compliance checks for a single repository
   */
  async checkRepositoryCompliance(repository: string): Promise<ComplianceCheck[]> {
    const properties = await this.propertyManager.getRepositoryProperties(repository)
    const checks: ComplianceCheck[] = []

    // Check each applicable compliance framework
    if (properties.compliance_frameworks) {
      for (const framework of properties.compliance_frameworks) {
        const check = await this.checkFrameworkCompliance(repository, framework, properties)
        checks.push(check)
      }
    }

    return checks
  }

  /**
   * Check compliance for a specific framework
   */
  private async checkFrameworkCompliance(
    repository: string,
    framework: ComplianceFramework,
    properties: Partial<RepositoryProperties>
  ): Promise<ComplianceCheck> {
    const violations: ComplianceViolation[] = []
    const recommendations: string[] = []

    switch (framework) {
      case 'SOC2':
        violations.push(...await this.checkSOC2Compliance(repository, properties))
        recommendations.push(...this.getSOC2Recommendations(properties))
        break
      case 'ISO27001':
        violations.push(...await this.checkISO27001Compliance(repository, properties))
        recommendations.push(...this.getISO27001Recommendations(properties))
        break
      case 'HIPAA':
        violations.push(...await this.checkHIPAACompliance(repository, properties))
        recommendations.push(...this.getHIPAARecommendations(properties))
        break
      case 'PCI-DSS':
        violations.push(...await this.checkPCIDSSCompliance(repository, properties))
        recommendations.push(...this.getPCIDSSRecommendations(properties))
        break
      case 'GDPR':
        violations.push(...await this.checkGDPRCompliance(repository, properties))
        recommendations.push(...this.getGDPRRecommendations(properties))
        break
      default:
        console.warn(`Unknown compliance framework: ${framework}`)
    }

    return {
      framework,
      compliant: violations.filter(v => v.severity === 'critical' || v.severity === 'high').length === 0,
      violations,
      recommendations,
      last_checked: new Date().toISOString()
    }
  }

  /**
   * Check SOC 2 compliance
   */
  private async checkSOC2Compliance(
    repository: string,
    properties: Partial<RepositoryProperties>
  ): Promise<ComplianceViolation[]> {
    const violations: ComplianceViolation[] = []

    // CC1: Security - Access controls
    if (!properties.owner_team) {
      violations.push({
        control: 'CC1.1',
        severity: 'high',
        description: 'Missing owner team assignment',
        remediation: 'Assign an owner team to establish clear responsibility'
      })
    }

    // CC3: Information - Data classification
    if (!properties.data_classification) {
      violations.push({
        control: 'CC3.1',
        severity: 'critical',
        description: 'Missing data classification',
        remediation: 'Classify data according to sensitivity (Public, Internal, Confidential, Restricted)'
      })
    }

    // CC6: Security - Logical access controls
    if (properties.data_classification === 'Restricted' && properties.security_classification !== 'Critical') {
      violations.push({
        control: 'CC6.1',
        severity: 'high',
        description: 'Restricted data requires critical security classification',
        remediation: 'Upgrade security classification to Critical for repositories handling restricted data'
      })
    }

    // CC7: Systems - System operations
    if (!properties.ci_cd_enabled) {
      violations.push({
        control: 'CC7.1',
        severity: 'medium',
        description: 'CI/CD pipeline not enabled',
        remediation: 'Enable CI/CD pipeline for automated deployment and rollback capabilities'
      })
    }

    // CC8: Change - Change management
    if (!properties.automated_tests) {
      violations.push({
        control: 'CC8.1',
        severity: 'medium',
        description: 'Automated tests not implemented',
        remediation: 'Implement automated tests to ensure system changes are properly tested'
      })
    }

    return violations
  }

  /**
   * Check ISO 27001 compliance
   */
  private async checkISO27001Compliance(
    repository: string,
    properties: Partial<RepositoryProperties>
  ): Promise<ComplianceViolation[]> {
    const violations: ComplianceViolation[] = []

    // A.8.1: Asset inventory
    if (!properties.service_tier) {
      violations.push({
        control: 'A.8.1',
        severity: 'medium',
        description: 'Service tier not classified',
        remediation: 'Classify repository service tier (Platform, Application, Library, Infrastructure)'
      })
    }

    // A.9.2: Access control
    if (properties.public_facing && properties.security_classification === 'Standard') {
      violations.push({
        control: 'A.9.2',
        severity: 'medium',
        description: 'Public-facing applications require elevated security classification',
        remediation: 'Upgrade security classification to Elevated for public-facing applications'
      })
    }

    // A.12.6: Vulnerability management
    if (!properties.review_frequency) {
      violations.push({
        control: 'A.12.6',
        severity: 'low',
        description: 'Review frequency not specified',
        remediation: 'Define regular review frequency for security assessments'
      })
    }

    return violations
  }

  /**
   * Check HIPAA compliance
   */
  private async checkHIPAACompliance(
    repository: string,
    properties: Partial<RepositoryProperties>
  ): Promise<ComplianceViolation[]> {
    const violations: ComplianceViolation[] = []

    // Administrative safeguards - Security officer
    if (!properties.owner_team) {
      violations.push({
        control: '164.308(a)(2)',
        severity: 'critical',
        description: 'HIPAA repositories must have designated security team',
        remediation: 'Assign security team as owner for HIPAA compliance'
      })
    }

    // Access controls - Unique user identification
    if (properties.environment === 'Production' && properties.data_classification !== 'Restricted') {
      violations.push({
        control: '164.312(a)(2)',
        severity: 'critical',
        description: 'HIPAA production data must be classified as Restricted',
        remediation: 'Classify HIPAA production repositories as Restricted'
      })
    }

    // Audit controls - Hardware or software mechanisms
    if (!properties.last_security_review) {
      violations.push({
        control: '164.312(b)',
        severity: 'high',
        description: 'HIPAA repositories require documented security reviews',
        remediation: 'Conduct and document security review for HIPAA compliance'
      })
    }

    // Transmission security - Encryption
    if (properties.public_facing && properties.security_classification !== 'Critical') {
      violations.push({
        control: '164.312(e)(1)',
        severity: 'critical',
        description: 'Public-facing HIPAA applications require critical security classification',
        remediation: 'Upgrade to Critical security classification and implement encryption'
      })
    }

    return violations
  }

  /**
   * Check PCI DSS compliance
   */
  private async checkPCIDSSCompliance(
    repository: string,
    properties: Partial<RepositoryProperties>
  ): Promise<ComplianceViolation[]> {
    const violations: ComplianceViolation[] = []

    // Requirement 3: Protect stored cardholder data
    if (properties.data_classification !== 'Restricted') {
      violations.push({
        control: 'PCI-3.1',
        severity: 'critical',
        description: 'PCI DSS repositories must be classified as Restricted',
        remediation: 'Classify as Restricted and implement cardholder data protection'
      })
    }

    // Requirement 4: Encrypt transmission of cardholder data
    if (properties.public_facing && properties.security_classification !== 'Critical') {
      violations.push({
        control: 'PCI-4.1',
        severity: 'critical',
        description: 'Public-facing PCI applications require critical security classification',
        remediation: 'Implement critical security controls and encryption'
      })
    }

    // Requirement 7: Restrict access to cardholder data
    if (!properties.owner_team) {
      violations.push({
        control: 'PCI-7.1',
        severity: 'high',
        description: 'PCI repositories must have designated access control team',
        remediation: 'Assign owner team for access control management'
      })
    }

    return violations
  }

  /**
   * Check GDPR compliance
   */
  private async checkGDPRCompliance(
    repository: string,
    properties: Partial<RepositoryProperties>
  ): Promise<ComplianceViolation[]> {
    const violations: ComplianceViolation[] = []

    // Article 25: Data protection by design and by default
    if (properties.data_classification === 'Confidential' || properties.data_classification === 'Restricted') {
      if (properties.security_classification === 'Standard') {
        violations.push({
          control: 'GDPR-Article25',
          severity: 'medium',
          description: 'Personal data repositories require elevated security classification',
          remediation: 'Upgrade security classification for personal data protection'
        })
      }
    }

    // Article 32: Security of processing
    if (!properties.automated_tests) {
      violations.push({
        control: 'GDPR-Article32',
        severity: 'low',
        description: 'Automated testing recommended for GDPR compliance',
        remediation: 'Implement automated tests to ensure data processing security'
      })
    }

    return violations
  }

  /**
   * Get SOC 2 recommendations
   */
  private getSOC2Recommendations(properties: Partial<RepositoryProperties>): string[] {
    const recommendations: string[] = []

    if (properties.business_criticality === 'Critical') {
      recommendations.push('Implement quarterly security reviews for critical business systems')
      recommendations.push('Enable comprehensive logging and monitoring')
    }

    if (properties.public_facing) {
      recommendations.push('Conduct regular penetration testing')
      recommendations.push('Implement web application firewall (WAF)')
    }

    if (properties.ci_cd_enabled) {
      recommendations.push('Include security scanning in CI/CD pipeline')
      recommendations.push('Implement deployment approval workflows')
    }

    return recommendations
  }

  /**
   * Get ISO 27001 recommendations
   */
  private getISO27001Recommendations(properties: Partial<RepositoryProperties>): string[] {
    const recommendations: string[] = []

    recommendations.push('Document and maintain information security policies')
    recommendations.push('Implement risk assessment process')
    recommendations.push('Establish incident management procedures')

    if (properties.service_tier === 'Platform') {
      recommendations.push('Implement business continuity planning')
      recommendations.push('Regular security awareness training')
    }

    return recommendations
  }

  /**
   * Get HIPAA recommendations
   */
  private getHIPAARecommendations(properties: Partial<RepositoryProperties>): string[] {
    const recommendations: string[] = []

    recommendations.push('Implement dedicated infrastructure for HIPAA workloads')
    recommendations.push('Establish Business Associate Agreement (BAA) with cloud providers')
    recommendations.push('Implement comprehensive audit logging')
    recommendations.push('Regular HIPAA compliance training for team members')
    recommendations.push('Establish breach notification procedures')

    if (properties.environment === 'Production') {
      recommendations.push('Implement real-time security monitoring')
      recommendations.push('Regular vulnerability assessments')
    }

    return recommendations
  }

  /**
   * Get PCI DSS recommendations
   */
  private getPCIDSSRecommendations(properties: Partial<RepositoryProperties>): string[] {
    const recommendations: string[] = []

    recommendations.push('Implement network segmentation for cardholder data')
    recommendations.push('Use strong cryptography and security protocols')
    recommendations.push('Regular vulnerability scanning by qualified security assessor')
    recommendations.push('Implement strict access control measures')
    recommendations.push('Regular security testing of systems and networks')

    return recommendations
  }

  /**
   * Get GDPR recommendations
   */
  private getGDPRRecommendations(properties: Partial<RepositoryProperties>): string[] {
    const recommendations: string[] = []

    recommendations.push('Implement privacy by design principles')
    recommendations.push('Maintain records of processing activities')
    recommendations.push('Implement data subject rights procedures')
    recommendations.push('Regular privacy impact assessments')
    recommendations.push('Data protection officer appointment if required')

    return recommendations
  }

  /**
   * Run compliance checks for all repositories
   */
  async checkAllRepositories(): Promise<Record<string, ComplianceCheck[]>> {
    const repositories = await this.propertyManager.getAllRepositoriesWithProperties()
    const results: Record<string, ComplianceCheck[]> = {}

    for (const repo of repositories) {
      try {
        const checks = await this.checkRepositoryCompliance(repo.name)
        results[repo.name] = checks
      } catch (error) {
        console.error(`Failed to check compliance for ${repo.name}:`, error)
        results[repo.name] = []
      }
    }

    return results
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(): Promise<{
    summary: {
      total_repositories: number
      compliant_repositories: number
      non_compliant_repositories: number
      critical_violations: number
      high_violations: number
      medium_violations: number
      low_violations: number
    }
    repositories: Record<string, ComplianceCheck[]>
    frameworks: Record<ComplianceFramework, {
      total: number
      compliant: number
      violations: ComplianceViolation[]
    }>
  }> {
    const results = await this.checkAllRepositories()
    const summary = {
      total_repositories: Object.keys(results).length,
      compliant_repositories: 0,
      non_compliant_repositories: 0,
      critical_violations: 0,
      high_violations: 0,
      medium_violations: 0,
      low_violations: 0
    }

    const frameworks: Record<ComplianceFramework, {
      total: number
      compliant: number
      violations: ComplianceViolation[]
    }> = {
      SOC2: { total: 0, compliant: 0, violations: [] },
      ISO27001: { total: 0, compliant: 0, violations: [] },
      HIPAA: { total: 0, compliant: 0, violations: [] },
      'PCI-DSS': { total: 0, compliant: 0, violations: [] },
      GDPR: { total: 0, compliant: 0, violations: [] },
      NIST: { total: 0, compliant: 0, violations: [] }
    }

    // Process results
    for (const [repo, checks] of Object.entries(results)) {
      const isCompliant = checks.every(check => check.compliant)
      
      if (isCompliant) {
        summary.compliant_repositories++
      } else {
        summary.non_compliant_repositories++
      }

      // Count violations by severity
      for (const check of checks) {
        if (!frameworks[check.framework]) continue
        
        frameworks[check.framework].total++
        if (check.compliant) {
          frameworks[check.framework].compliant++
        }
        frameworks[check.framework].violations.push(...check.violations)

        for (const violation of check.violations) {
          switch (violation.severity) {
            case 'critical':
              summary.critical_violations++
              break
            case 'high':
              summary.high_violations++
              break
            case 'medium':
              summary.medium_violations++
              break
            case 'low':
              summary.low_violations++
              break
          }
        }
      }
    }

    return {
      summary,
      repositories: results,
      frameworks
    }
  }
}

async function main() {
  const args = process.argv.slice(2)
  const command = args[0]

  if (!command) {
    console.log(`
Usage: npm run compliance-automation <command> [options]

Commands:
  check <repo>                    Check compliance for a specific repository
  check-all                       Check compliance for all repositories
  report                          Generate comprehensive compliance report
  framework <framework> <repo>    Check specific framework compliance
  remediate <repo>                Generate remediation plan

Examples:
  npm run compliance-automation check agency-platform
  npm run compliance-automation check-all
  npm run compliance-automation report
  npm run compliance-automation framework SOC2 agency-platform
  npm run compliance-automation remediate agency-platform
    `)
    process.exit(0)
  }

  const config = loadConfig()
  const complianceChecker = new ComplianceChecker(config.token, config.organization)

  try {
    switch (command) {
      case 'check':
        await handleCheck(complianceChecker, args[1])
        break
      case 'check-all':
        await handleCheckAll(complianceChecker)
        break
      case 'report':
        await handleReport(complianceChecker)
        break
      case 'framework':
        await handleFrameworkCheck(complianceChecker, args[1] as ComplianceFramework, args[2])
        break
      case 'remediate':
        await handleRemediate(complianceChecker, args[1])
        break
      default:
        console.error(`Unknown command: ${command}`)
        process.exit(1)
    }
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

async function handleCheck(complianceChecker: ComplianceChecker, repo: string) {
  if (!repo) {
    console.error('Repository name is required')
    process.exit(1)
  }

  const checks = await complianceChecker.checkRepositoryCompliance(repo)
  
  console.log(`Compliance checks for ${repo}:`)
  console.log()
  
  checks.forEach(check => {
    console.log(`${check.framework}: ${check.compliant ? '✅ Compliant' : '❌ Non-compliant'}`)
    
    if (check.violations.length > 0) {
      console.log('  Violations:')
      check.violations.forEach(violation => {
        console.log(`    ${violation.severity.toUpperCase()}: ${violation.control} - ${violation.description}`)
        console.log(`      Remediation: ${violation.remediation}`)
      })
    }
    
    if (check.recommendations.length > 0) {
      console.log('  Recommendations:')
      check.recommendations.forEach(rec => console.log(`    - ${rec}`))
    }
    console.log()
  })
}

async function handleCheckAll(complianceChecker: ComplianceChecker) {
  const results = await complianceChecker.checkAllRepositories()
  
  console.log('Compliance check results:')
  console.log()
  
  Object.entries(results).forEach(([repo, checks]) => {
    const hasViolations = checks.some(check => !check.compliant)
    console.log(`${repo}: ${hasViolations ? '❌ Issues found' : '✅ Compliant'}`)
  })
}

async function handleReport(complianceChecker: ComplianceChecker) {
  const report = await complianceChecker.generateComplianceReport()
  
  console.log('Compliance Report')
  console.log('================')
  console.log()
  
  console.log('Summary:')
  console.log(`  Total repositories: ${report.summary.total_repositories}`)
  console.log(`  Compliant: ${report.summary.compliant_repositories}`)
  console.log(`  Non-compliant: ${report.summary.non_compliant_repositories}`)
  console.log()
  
  console.log('Violations by severity:')
  console.log(`  Critical: ${report.summary.critical_violations}`)
  console.log(`  High: ${report.summary.high_violations}`)
  console.log(`  Medium: ${report.summary.medium_violations}`)
  console.log(`  Low: ${report.summary.low_violations}`)
  console.log()
  
  console.log('By framework:')
  Object.entries(report.frameworks).forEach(([framework, data]) => {
    if (data.total > 0) {
      console.log(`  ${framework}: ${data.compliant}/${data.total} compliant`)
      if (data.violations.length > 0) {
        console.log(`    Violations: ${data.violations.length}`)
      }
    }
  })
  
  // Save detailed report
  writeFileSync('compliance-report.json', JSON.stringify(report, null, 2))
  console.log()
  console.log('Detailed report saved to: compliance-report.json')
}

async function handleFrameworkCheck(
  complianceChecker: ComplianceChecker, 
  framework: ComplianceFramework, 
  repo: string
) {
  if (!framework || !repo) {
    console.error('Framework and repository name are required')
    process.exit(1)
  }

  const properties = await complianceChecker['propertyManager'].getRepositoryProperties(repo)
  const check = await complianceChecker['checkFrameworkCompliance'](repo, framework, properties)
  
  console.log(`${framework} compliance for ${repo}: ${check.compliant ? '✅ Compliant' : '❌ Non-compliant'}`)
  console.log()
  
  if (check.violations.length > 0) {
    console.log('Violations:')
    check.violations.forEach(violation => {
      console.log(`  ${violation.severity.toUpperCase()}: ${violation.control}`)
      console.log(`    Description: ${violation.description}`)
      console.log(`    Remediation: ${violation.remediation}`)
      console.log()
    })
  }
  
  if (check.recommendations.length > 0) {
    console.log('Recommendations:')
    check.recommendations.forEach(rec => console.log(`  - ${rec}`))
  }
}

async function handleRemediate(complianceChecker: ComplianceChecker, repo: string) {
  if (!repo) {
    console.error('Repository name is required')
    process.exit(1)
  }

  const checks = await complianceChecker.checkRepositoryCompliance(repo)
  
  console.log(`Remediation plan for ${repo}:`)
  console.log()
  
  const allViolations = checks.flatMap(check => check.violations)
  const criticalViolations = allViolations.filter(v => v.severity === 'critical')
  const highViolations = allViolations.filter(v => v.severity === 'high')
  
  if (criticalViolations.length > 0) {
    console.log('🚨 CRITICAL - Immediate action required:')
    criticalViolations.forEach(violation => {
      console.log(`  ${violation.control}: ${violation.description}`)
      console.log(`    Action: ${violation.remediation}`)
      console.log()
    })
  }
  
  if (highViolations.length > 0) {
    console.log('⚠️  HIGH - Address within 30 days:')
    highViolations.forEach(violation => {
      console.log(`  ${violation.control}: ${violation.description}`)
      console.log(`    Action: ${violation.remediation}`)
      console.log()
    })
  }
  
  const allRecommendations = checks.flatMap(check => check.recommendations)
  if (allRecommendations.length > 0) {
    console.log('💡 Recommendations for improvement:')
    allRecommendations.forEach(rec => console.log(`  - ${rec}`))
  }
}

if (require.main === module) {
  main()
}
