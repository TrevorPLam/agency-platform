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
import { SecurityConfig } from './types'

export interface SecurityManagerOptions {
  config: SecurityConfig
}

export class SecurityManager {
  private sbomGenerator: SBOMGenerator
  private integrityVerifier: IntegrityVerifier
  private provenanceTracker: ProvenanceTracker
  private supplyChainMonitor: SupplyChainMonitor
  private cryptoVerifier: CryptoVerifier

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
}

export * from './types'
