#!/usr/bin/env tsx

/**
 * Vulnerability Analysis Script
 * 
 * This script analyzes vulnerability scan results and provides
 * detailed reporting and recommendations.
 */

import { Command } from 'commander'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const program = new Command()

program
  .name('analyze-vulnerabilities')
  .description('Analyze vulnerability scan results')
  .option('--scan-results <path>', 'Path to vulnerability scan results')
  .option('--output-path <path>', 'Output path for analysis results', './vulnerability-analysis.json')
  .option('--fail-threshold <threshold>', 'Fail if vulnerabilities at or above threshold', 'CRITICAL')
  .option('--generate-report', 'Generate detailed markdown report', true)
  .action(async (options) => {
    try {
      console.log('🔍 Agency Platform Vulnerability Analyzer')
      console.log('=======================================')

      // Validate inputs
      if (!existsSync(options.scanResults)) {
        console.error(`❌ Error: Scan results file not found: ${options.scanResults}`)
        process.exit(1)
      }

      const threshold = options.failThreshold.toUpperCase()
      const validThresholds = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
      if (!validThresholds.includes(threshold)) {
        console.error(`❌ Error: Invalid threshold. Use one of: ${validThresholds.join(', ')}`)
        process.exit(1)
      }

      console.log(`📄 Analyzing: ${options.scanResults}`)
      console.log(`📊 Fail threshold: ${threshold}`)
      console.log(`📁 Output: ${options.outputPath}`)
      console.log('')

      // Read scan results
      const scanData = JSON.parse(readFileSync(options.scanResults, 'utf8'))

      // Analyze vulnerabilities
      const analysis = analyzeVulnerabilities(scanData, threshold)

      // Save analysis results
      writeFileSync(options.outputPath, JSON.stringify(analysis, null, 2))
      console.log(`✅ Analysis saved: ${options.outputPath}`)

      // Generate markdown report if requested
      if (options.generateReport) {
        const reportPath = options.outputPath.replace('.json', '.md')
        const reportContent = generateMarkdownReport(analysis, threshold)
        writeFileSync(reportPath, reportContent)
        console.log(`📄 Report saved: ${reportPath}`)
      }

      // Display summary
      console.log('')
      console.log('📊 Analysis Summary:')
      console.log(`   Critical: ${analysis.criticalVulnerabilities}`)
      console.log(`   High: ${analysis.highVulnerabilities}`)
      console.log(`   Medium: ${analysis.mediumVulnerabilities}`)
      console.log(`   Low: ${analysis.lowVulnerabilities}`)
      console.log(`   Total: ${analysis.totalVulnerabilities}`)
      console.log(`   Status: ${analysis.status.toUpperCase()}`)

      if (analysis.recommendations.length > 0) {
        console.log('')
        console.log('💡 Key Recommendations:')
        analysis.recommendations.slice(0, 5).forEach(rec => {
          console.log(`   • ${rec}`)
        })
      }

      // Fail if threshold is met or exceeded
      if (analysis.status === 'FAILED') {
        console.log('')
        console.log(`❌ Vulnerability threshold (${threshold}) exceeded!`)
        process.exit(1)
      }

      console.log('')
      console.log('✅ Vulnerability analysis completed!')

    } catch (error) {
      console.error('❌ Error analyzing vulnerabilities:', error instanceof Error ? error.message : 'Unknown error')
      process.exit(1)
    }
  })

interface VulnerabilityAnalysis {
  scanTimestamp: string
  totalVulnerabilities: number
  criticalVulnerabilities: number
  highVulnerabilities: number
  mediumVulnerabilities: number
  lowVulnerabilities: number
  status: 'PASSED' | 'FAILED'
  threshold: string
  vulnerabilities: Vulnerability[]
  recommendations: string[]
  affectedPackages: PackageSummary[]
  complianceStatus: ComplianceStatus
}

interface Vulnerability {
  id: string
  severity: string
  description: string
  package: string
  version: string
  cve?: string
  fixedVersion?: string
  references?: string[]
}

interface PackageSummary {
  name: string
  vulnerabilities: number
  highestSeverity: string
  criticalCount: number
  highCount: number
  recommendations: string[]
}

interface ComplianceStatus {
  soc2: boolean
  iso27001: boolean
  gdpr: boolean
  hipaa: boolean
  issues: string[]
}

function analyzeVulnerabilities(scanData: any, threshold: string): VulnerabilityAnalysis {
  const vulnerabilities: Vulnerability[] = []
  const packageMap = new Map<string, Vulnerability[]>()

  // Parse Grype output format
  if (scanData.matches) {
    scanData.matches.forEach((match: any) => {
      const vuln: Vulnerability = {
        id: match.vulnerability.id || match.id || 'unknown',
        severity: match.vulnerability.severity || match.severity || 'UNKNOWN',
        description: match.vulnerability.description || match.description || 'No description available',
        package: match.artifact.name || match.package || 'unknown',
        version: match.artifact.version || match.version || 'unknown',
        cve: match.vulnerability.id?.startsWith('CVE-') ? match.vulnerability.id : undefined,
        fixedVersion: match.vulnerability.fix?.version || match.fixedVersion,
        references: match.vulnerability.urls || match.references || []
      }

      vulnerabilities.push(vuln)

      // Group by package
      const packageName = vuln.package
      if (!packageMap.has(packageName)) {
        packageMap.set(packageName, [])
      }
      packageMap.get(packageName)!.push(vuln)
    })
  }

  // Count vulnerabilities by severity
  const criticalCount = vulnerabilities.filter(v => v.severity === 'CRITICAL').length
  const highCount = vulnerabilities.filter(v => v.severity === 'HIGH').length
  const mediumCount = vulnerabilities.filter(v => v.severity === 'MEDIUM').length
  const lowCount = vulnerabilities.filter(v => v.severity === 'LOW').length
  const totalCount = vulnerabilities.length

  // Determine status based on threshold
  let status: 'PASSED' | 'FAILED' = 'PASSED'
  if (threshold === 'CRITICAL' && criticalCount > 0) status = 'FAILED'
  if (threshold === 'HIGH' && (criticalCount > 0 || highCount > 0)) status = 'FAILED'
  if (threshold === 'MEDIUM' && (criticalCount > 0 || highCount > 0 || mediumCount > 0)) status = 'FAILED'
  if (threshold === 'LOW' && totalCount > 0) status = 'FAILED'

  // Generate recommendations
  const recommendations = generateRecommendations(vulnerabilities, packageMap)

  // Generate package summaries
  const packageSummaries: PackageSummary[] = []
  packageMap.forEach((vulns, packageName) => {
    const pkgCriticalCount = vulns.filter(v => v.severity === 'CRITICAL').length
    const pkgHighCount = vulns.filter(v => v.severity === 'HIGH').length
    const highestSeverity = getHighestSeverity(vulns)

    packageSummaries.push({
      name: packageName,
      vulnerabilities: vulns.length,
      highestSeverity,
      criticalCount: pkgCriticalCount,
      highCount: pkgHighCount,
      recommendations: generatePackageRecommendations(vulns)
    })
  })

  // Assess compliance status
  const complianceStatus = assessCompliance(vulnerabilities, threshold)

  return {
    scanTimestamp: new Date().toISOString(),
    totalVulnerabilities: totalCount,
    criticalVulnerabilities: criticalCount,
    highVulnerabilities: highCount,
    mediumVulnerabilities: mediumCount,
    lowVulnerabilities: lowCount,
    status,
    threshold,
    vulnerabilities,
    recommendations,
    affectedPackages: packageSummaries,
    complianceStatus
  }
}

function getHighestSeverity(vulnerabilities: Vulnerability[]): string {
  const severityOrder = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
  for (const severity of severityOrder) {
    if (vulnerabilities.some(v => v.severity === severity)) {
      return severity
    }
  }
  return 'UNKNOWN'
}

function generateRecommendations(vulnerabilities: Vulnerability[], packageMap: Map<string, Vulnerability[]>): string[] {
  const recommendations: string[] = []

  // Critical vulnerabilities
  const criticalCount = vulnerabilities.filter(v => v.severity === 'CRITICAL').length
  if (criticalCount > 0) {
    recommendations.push(`Immediately address ${criticalCount} critical vulnerabilities - these pose immediate security risks`)
  }

  // High vulnerabilities
  const highCount = vulnerabilities.filter(v => v.severity === 'HIGH').length
  if (highCount > 0) {
    recommendations.push(`Prioritize fixing ${highCount} high vulnerabilities in the next release cycle`)
  }

  // Package-specific recommendations
  const packagesWithManyVulns = Array.from(packageMap.entries())
    .filter(([_, vulns]) => vulns.length >= 3)
    .map(([name, _]) => name)

  if (packagesWithManyVulns.length > 0) {
    recommendations.push(`Consider upgrading or replacing packages with multiple vulnerabilities: ${packagesWithManyVulns.join(', ')}`)
  }

  // General recommendations
  recommendations.push('Implement regular vulnerability scanning in CI/CD pipeline')
  recommendations.push('Establish dependency update policies and procedures')
  recommendations.push('Monitor security advisories for all dependencies')
  recommendations.push('Consider using automated dependency update tools')

  if (vulnerabilities.length > 50) {
    recommendations.push('Large number of vulnerabilities detected - consider comprehensive dependency audit')
  }

  return recommendations
}

function generatePackageRecommendations(vulnerabilities: Vulnerability[]): string[] {
  const recommendations: string[] = []

  const hasCritical = vulnerabilities.some(v => v.severity === 'CRITICAL')
  if (hasCritical) {
    recommendations.push('Update immediately due to critical vulnerabilities')
  }

  const hasFixableVersions = vulnerabilities.some(v => v.fixedVersion)
  if (hasFixableVersions) {
    recommendations.push('Fixed versions available - update to latest secure version')
  }

  const hasCVEs = vulnerabilities.some(v => v.cve)
  if (hasCVEs) {
    recommendations.push('Known CVEs detected - review security advisories')
  }

  return recommendations
}

function assessCompliance(vulnerabilities: Vulnerability[], threshold: string): ComplianceStatus {
  const issues: string[] = []

  // SOC 2 compliance
  const soc2Compliant = threshold === 'CRITICAL' ? 
    vulnerabilities.filter(v => v.severity === 'CRITICAL').length === 0 :
    vulnerabilities.filter(v => ['CRITICAL', 'HIGH'].includes(v.severity)).length === 0

  if (!soc2Compliant) {
    issues.push('SOC 2: High or critical vulnerabilities require immediate remediation')
  }

  // ISO 27001 compliance
  const iso27001Compliant = vulnerabilities.filter(v => 
    ['CRITICAL', 'HIGH', 'MEDIUM'].includes(v.severity)
  ).length === 0

  if (!iso27001Compliant) {
    issues.push('ISO 27001: Medium+ vulnerabilities should be addressed within defined timeframes')
  }

  // GDPR compliance
  const gdprCompliant = vulnerabilities.filter(v => v.severity === 'CRITICAL').length === 0
  if (!gdprCompliant) {
    issues.push('GDPR: Critical vulnerabilities may impact data protection compliance')
  }

  // HIPAA compliance
  const hipaaCompliant = vulnerabilities.filter(v => 
    ['CRITICAL', 'HIGH'].includes(v.severity)
  ).length === 0

  if (!hipaaCompliant) {
    issues.push('HIPAA: High+ vulnerabilities require immediate attention for healthcare data')
  }

  return {
    soc2: soc2Compliant,
    iso27001: iso27001Compliant,
    gdpr: gdprCompliant,
    hipaa: hipaaCompliant,
    issues
  }
}

function generateMarkdownReport(analysis: VulnerabilityAnalysis, threshold: string): string {
  const timestamp = new Date().toISOString()

  return `# Vulnerability Analysis Report

Generated: ${timestamp}

## Executive Summary
- **Total Vulnerabilities**: ${analysis.totalVulnerabilities}
- **Critical**: ${analysis.criticalVulnerabilities}
- **High**: ${analysis.highVulnerabilities}
- **Medium**: ${analysis.mediumVulnerabilities}
- **Low**: ${analysis.lowVulnerabilities}
- **Status**: ${analysis.status}
- **Threshold**: ${analysis.threshold}

## Compliance Status
${Object.entries(analysis.complianceStatus).map(([framework, compliant]) => {
  if (framework === 'issues') return ''
  const status = compliant ? '✅ Compliant' : '❌ Non-compliant'
  return `- **${framework.toUpperCase()}**: ${status}`
}).filter(Boolean).join('\n')}

${analysis.complianceStatus.issues.length > 0 ? `
### Compliance Issues
${analysis.complianceStatus.issues.map(issue => `- ${issue}`).join('\n')}
` : ''}

## Affected Packages
${analysis.affectedPackages.map(pkg => `
### ${pkg.name}
- **Vulnerabilities**: ${pkg.vulnerabilities}
- **Highest Severity**: ${pkg.highestSeverity}
- **Critical**: ${pkg.criticalCount}, **High**: ${pkg.highCount}
- **Recommendations**: ${pkg.recommendations.join(', ')}
`).join('\n')}

## Key Recommendations
${analysis.recommendations.map(rec => `- ${rec}`).join('\n')}

## Detailed Vulnerabilities
${analysis.vulnerabilities.slice(0, 20).map(vuln => `
### ${vuln.id} (${vuln.severity})
- **Package**: ${vuln.package}@${vuln.version}
- **Description**: ${vuln.description}
${vuln.cve ? `- **CVE**: ${vuln.cve}` : ''}
${vuln.fixedVersion ? `- **Fixed in**: ${vuln.fixedVersion}` : ''}
${vuln.references ? `- **References**: ${vuln.references.slice(0, 3).join(', ')}` : ''}
`).join('\n')}

${analysis.vulnerabilities.length > 20 ? `
... and ${analysis.vulnerabilities.length - 20} more vulnerabilities
` : ''}

## Next Steps
1. Address critical and high vulnerabilities immediately
2. Plan remediation for medium and low vulnerabilities
3. Update dependency management policies
4. Implement regular scanning in CI/CD
5. Monitor for new security advisories

---
*Generated by Agency Platform Security Package*
`
}

// Parse command line arguments
program.parse()

// Export for use in other scripts
export { analyzeVulnerabilities, generateMarkdownReport }
