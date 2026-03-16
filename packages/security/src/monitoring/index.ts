/**
 * Supply Chain Monitoring
 * 
 * Monitors dependencies for vulnerabilities and security issues
 */

import { execSync } from 'child_process'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { z } from 'zod'
import { 
  Vulnerability, 
  SecurityScanResult,
  SecurityConfig
} from '../types'

export interface MonitoringOptions {
  severityThreshold: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  failOnThreshold: boolean
  includeDevDependencies: boolean
  checkLicenseCompliance: boolean
}

export interface DependencyInfo {
  name: string
  version: string
  type: 'dependencies' | 'devDependencies' | 'peerDependencies' | 'optionalDependencies'
  license?: string
  repository?: string
  homepage?: string
  lastUpdated?: Date
  downloadCount?: number
  maintainers?: string[]
}

export interface VulnerabilityReport {
  package: string
  version: string
  vulnerability: Vulnerability
  affectedFiles?: string[]
  fixAvailable?: boolean
  fixedVersion?: string
}

export class SupplyChainMonitor {
  private config: SecurityConfig['vulnerabilityScanning']

  constructor(config: SecurityConfig['vulnerabilityScanning']) {
    this.config = config
  }

  /**
   * Scan dependencies for vulnerabilities
   */
  async scanDependencies(projectPath: string): Promise<SecurityScanResult> {
    if (!this.config.enabled) {
      throw new Error('Vulnerability scanning is disabled in configuration')
    }

    console.log('🔍 Scanning dependencies for vulnerabilities...')

    // Get all dependencies
    const dependencies = this.getDependencies(projectPath)
    
    // Run multiple vulnerability scans
    const npmAuditResult = await this.runNpmAudit(projectPath)
    const customScanResult = await this.customVulnerabilityScan(dependencies)
    
    // Merge results
    const allVulnerabilities = [
      ...npmAuditResult.vulnerabilities || [],
      ...customScanResult.vulnerabilities || [],
    ]

    // Filter by severity threshold
    const filteredVulnerabilities = this.filterBySeverity(allVulnerabilities)
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(filteredVulnerabilities, dependencies)

    // Determine status
    const criticalCount = filteredVulnerabilities.filter(v => v.severity === 'CRITICAL').length
    const highCount = filteredVulnerabilities.filter(v => v.severity === 'HIGH').length

    const status = this.determineStatus(criticalCount, highCount)

    return {
      scanType: 'vulnerability',
      timestamp: new Date().toISOString(),
      status,
      summary: `Found ${filteredVulnerabilities.length} vulnerabilities (${criticalCount} critical, ${highCount} high)`,
      details: {
        totalDependencies: dependencies.length,
        criticalVulnerabilities: criticalCount,
        highVulnerabilities: highCount,
        mediumVulnerabilities: filteredVulnerabilities.filter(v => v.severity === 'MEDIUM').length,
        lowVulnerabilities: filteredVulnerabilities.filter(v => v.severity === 'LOW').length,
      },
      vulnerabilities: filteredVulnerabilities,
      recommendations,
    }
  }

  /**
   * Get all dependencies from package.json
   */
  private getDependencies(projectPath: string): DependencyInfo[] {
    const packageJsonPath = join(projectPath, 'package.json')
    
    if (!existsSync(packageJsonPath)) {
      return []
    }

    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
    const dependencies: DependencyInfo[] = []

    const depTypes = [
      'dependencies',
      'devDependencies', 
      'peerDependencies',
      'optionalDependencies'
    ] as const

    for (const depType of depTypes) {
      if (packageJson[depType]) {
        for (const [name, version] of Object.entries(packageJson[depType])) {
          dependencies.push({
            name,
            version: typeof version === 'string' ? version : 'unknown',
            type: depType,
          })
        }
      }
    }

    return dependencies
  }

  /**
   * Run npm audit for vulnerability scanning
   */
  private async runNpmAudit(projectPath: string): Promise<{ vulnerabilities: Vulnerability[] }> {
    try {
      const auditOutput = execSync('npm audit --json', { 
        cwd: projectPath, 
        encoding: 'utf-8',
        stdio: 'pipe'
      })
      
      const auditData = JSON.parse(auditOutput)
      const vulnerabilities: Vulnerability[] = []

      if (auditData.vulnerabilities) {
        for (const [packageName, vulnData] of Object.entries(auditData.vulnerabilities)) {
          const vuln = vulnData as any
          
          vulnerabilities.push({
            id: vuln.cve || vuln.title || `npm-${packageName}`,
            source: 'CVE',
            severity: this.mapNpmSeverity(vuln.severity),
            description: vuln.title || vuln.overview || 'No description available',
            published: vuln.created,
            updated: vuln.updated,
            references: vuln.references || [],
            affected: [packageName],
          })
        }
      }

      return { vulnerabilities }
    } catch (error) {
      // npm audit exits with non-zero code when vulnerabilities are found
      const output = (error as any).stdout || (error as any).message || ''
      
      try {
        const auditData = JSON.parse(output)
        const vulnerabilities: Vulnerability[] = []

        if (auditData.vulnerabilities) {
          for (const [packageName, vulnData] of Object.entries(auditData.vulnerabilities)) {
            const vuln = vulnData as any
            
            vulnerabilities.push({
              id: vuln.cve || vuln.title || `npm-${packageName}`,
              source: 'CVE',
              severity: this.mapNpmSeverity(vuln.severity),
              description: vuln.title || vuln.overview || 'No description available',
              published: vuln.created,
              updated: vuln.updated,
              references: vuln.references || [],
              affected: [packageName],
            })
          }
        }

        return { vulnerabilities }
      } catch {
        console.warn('Could not parse npm audit output')
        return { vulnerabilities: [] }
      }
    }
  }

  /**
   * Custom vulnerability scanning for additional checks
   */
  private async customVulnerabilityScan(dependencies: DependencyInfo[]): Promise<{ vulnerabilities: Vulnerability[] }> {
    const vulnerabilities: Vulnerability[] = []

    // Check for known malicious packages (simplified example)
    const knownMalicious = [
      { name: 'event-stream', version: '<4.0.0', severity: 'CRITICAL' as const, id: 'CVE-2019-1010225' },
      { name: 'eslint-scope', version: '<4.0.0', severity: 'HIGH' as const, id: 'CVE-2019-10744' },
      { name: 'gethosts', version: '*', severity: 'CRITICAL' as const, id: 'MALICIOUS-001' },
    ]

    for (const dep of dependencies) {
      for (const malicious of knownMalicious) {
        if (dep.name === malicious.name && this.versionMatches(dep.version, malicious.version)) {
          vulnerabilities.push({
            id: malicious.id,
            source: 'CVE',
            severity: malicious.severity,
            description: `Known malicious package: ${malicious.name}`,
            affected: [dep.name],
          })
        }
      }
    }

    // Check for outdated packages (potential security risk)
    for (const dep of dependencies) {
      if (this.isOutdated(dep)) {
        vulnerabilities.push({
          id: `OUTDATED-${dep.name}`,
          source: 'POLICY',
          severity: 'LOW',
          description: `Package is outdated and may contain security vulnerabilities: ${dep.name}`,
          affected: [dep.name],
        })
      }
    }

    return { vulnerabilities }
  }

  /**
   * Map npm audit severity to standard format
   */
  private mapNpmSeverity(severity: string): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO' {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'CRITICAL'
      case 'high': return 'HIGH'
      case 'moderate': return 'MEDIUM'
      case 'low': return 'LOW'
      case 'info': return 'INFO'
      default: return 'INFO'
    }
  }

  /**
   * Filter vulnerabilities by severity threshold
   */
  private filterBySeverity(vulnerabilities: Vulnerability[]): Vulnerability[] {
    const thresholdOrder = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']
    const thresholdIndex = thresholdOrder.indexOf(this.config.severityThreshold)
    
    return vulnerabilities.filter(vuln => {
      const vulnIndex = thresholdOrder.indexOf(vuln.severity)
      return vulnIndex <= thresholdIndex
    })
  }

  /**
   * Determine scan status based on vulnerabilities
   */
  private determineStatus(criticalCount: number, highCount: number): 'passed' | 'warning' | 'failed' {
    if (this.config.failOnThreshold && criticalCount > 0) {
      return 'failed'
    }
    
    if (this.config.failOnThreshold && highCount > 0) {
      return 'failed'
    }
    
    if (criticalCount > 0) {
      return 'failed'
    }
    
    if (highCount > 0) {
      return 'warning'
    }
    
    return 'passed'
  }

  /**
   * Generate recommendations based on scan results
   */
  private generateRecommendations(vulnerabilities: Vulnerability[], dependencies: DependencyInfo[]): string[] {
    const recommendations: string[] = []

    if (vulnerabilities.length === 0) {
      recommendations.push('No vulnerabilities detected. Continue regular monitoring.')
      return recommendations
    }

    const criticalCount = vulnerabilities.filter(v => v.severity === 'CRITICAL').length
    const highCount = vulnerabilities.filter(v => v.severity === 'HIGH').length

    if (criticalCount > 0) {
      recommendations.push(`URGENT: Update ${criticalCount} critical dependencies immediately`)
    }

    if (highCount > 0) {
      recommendations.push(`HIGH: Update ${highCount} high-severity dependencies within 7 days`)
    }

    // Check for dependency update patterns
    const outdatedCount = vulnerabilities.filter(v => v.id.startsWith('OUTDATED-')).length
    if (outdatedCount > 0) {
      recommendations.push('Implement regular dependency updates to prevent security gaps')
    }

    // Check for common vulnerable patterns
    const hasExpress = dependencies.some(d => d.name === 'express')
    if (hasExpress) {
      recommendations.push('Review Express.js security best practices and middleware')
    }

    const hasLodash = dependencies.some(d => d.name === 'lodash')
    if (hasLodash) {
      recommendations.push('Consider using lodash-es for better tree-shaking and security')
    }

    recommendations.push('Review all vulnerability reports for exploitability')
    recommendations.push('Implement automated security updates where safe')
    recommendations.push('Monitor for new vulnerabilities in current dependencies')
    recommendations.push('Consider using dependency pinning for critical packages')

    return recommendations
  }

  /**
   * Check if version matches pattern
   */
  private versionMatches(version: string, pattern: string): boolean {
    if (pattern === '*') return true
    
    // Simple version matching (could be enhanced with semver)
    if (pattern.startsWith('<')) {
      const requiredVersion = pattern.substring(1)
      return version < requiredVersion
    }
    
    if (pattern.startsWith('>')) {
      const requiredVersion = pattern.substring(1)
      return version > requiredVersion
    }
    
    return version === pattern
  }

  /**
   * Check if package is outdated (simplified)
   */
  private isOutdated(dependency: DependencyInfo): boolean {
    // In a real implementation, this would check against npm registry
    // For now, just flag packages that haven't been updated in 2+ years
    const oldPackages = [
      'request', // Deprecated in favor of axios/fetch
      'mkdirp', // Often replaced with native fs.mkdir
      'debug', // Many old versions
    ]
    
    return oldPackages.includes(dependency.name) && 
           !dependency.version.includes('beta') && 
           !dependency.version.includes('alpha')
  }

  /**
   * Generate supply chain monitoring dashboard data
   */
  async generateDashboardData(projectPath: string): Promise<{
    summary: SecurityScanResult
    dependencies: DependencyInfo[]
    trends: Array<{
      date: string
      criticalCount: number
      highCount: number
      totalCount: number
    }>
  }> {
    const summary = await this.scanDependencies(projectPath)
    const dependencies = this.getDependencies(projectPath)
    
    // Mock trend data (in real implementation, this would come from database)
    const trends = [
      { date: '2026-03-01', criticalCount: 0, highCount: 2, totalCount: 2 },
      { date: '2026-03-08', criticalCount: 1, highCount: 1, totalCount: 2 },
      { date: '2026-03-15', criticalCount: 0, highCount: 3, totalCount: 3 },
      { date: new Date().toISOString().split('T')[0], criticalCount: summary.details?.criticalVulnerabilities || 0, highCount: summary.details?.highVulnerabilities || 0, totalCount: summary.vulnerabilities?.length || 0 },
    ]

    return {
      summary,
      dependencies,
      trends,
    }
  }

  /**
   * Export monitoring report to file
   */
  exportReport(report: SecurityScanResult, filePath: string): void {
    const content = JSON.stringify(report, null, 2)
    writeFileSync(filePath, content, 'utf-8')
  }

  /**
   * Check license compliance
   */
  async checkLicenseCompliance(dependencies: DependencyInfo[]): Promise<{
    compliant: boolean
    issues: Array<{ package: string; license: string; issue: string }>
  }> {
    const issues: Array<{ package: string; license: string; issue: string }> = []
    
    // Define problematic licenses
    const problematicLicenses = ['GPL-3.0', 'AGPL-3.0', 'LGPL-3.0']
    
    for (const dep of dependencies) {
      if (dep.license && problematicLicenses.some(lic => dep.license?.includes(lic))) {
        issues.push({
          package: dep.name,
          license: dep.license,
          issue: 'Copyleft license may require source code disclosure',
        })
      }
    }

    return {
      compliant: issues.length === 0,
      issues,
    }
  }
}

export * from '../types'
