/**
 * SBOM (Software Bill of Materials) generation and management
 */

import { execSync } from 'child_process'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { z } from 'zod'
import { 
  SBOMDocument, 
  SBOMFormat, 
  Component, 
  SecurityScanResult,
  SecurityConfig
} from '../types'

export interface SBOMGeneratorOptions {
  projectPath: string
  outputPath: string
  format: SBOMFormat
  includeDevDependencies?: boolean
  excludePatterns?: string[]
}

export class SBOMGenerator {
  private config: SecurityConfig['sbomGeneration']

  constructor(config: SecurityConfig['sbomGeneration']) {
    this.config = config
  }

  /**
   * Generate SBOM for the project
   */
  async generate(options: SBOMGeneratorOptions): Promise<SBOMDocument> {
    const { projectPath, outputPath, format, includeDevDependencies, excludePatterns } = options

    if (!this.config.enabled) {
      throw new Error('SBOM generation is disabled in configuration')
    }

    try {
      // Use Syft for SBOM generation
      const syftCommand = this.buildSyftCommand(options)
      console.log(`Generating SBOM: ${syftCommand}`)
      
      execSync(syftCommand, { stdio: 'inherit', cwd: projectPath })

      // Read and validate the generated SBOM
      const sbomData = this.readSBOM(outputPath, format)
      const validatedSBOM = this.validateSBOM(sbomData, format)

      // Enhance with additional metadata
      const enhancedSBOM = this.enhanceSBOM(validatedSBOM, options)

      // Write enhanced SBOM back to file
      writeFileSync(outputPath, JSON.stringify(enhancedSBOM, null, 2))

      return enhancedSBOM
    } catch (error) {
      console.error('SBOM generation failed:', error)
      throw new Error(`SBOM generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Build Syft command for SBOM generation
   */
  private buildSyftCommand(options: SBOMGeneratorOptions): string {
    const { projectPath, outputPath, format, includeDevDependencies, excludePatterns } = options

    let command = `syft dir:${projectPath} --output ${format}-json --file ${outputPath}`

    // Add exclude patterns
    const patterns = [...(excludePatterns || []), ...this.config.excludePatterns]
    if (patterns.length > 0) {
      command += ` --exclude "${patterns.join(',')}" `
    }

    // Handle dev dependencies (Syft doesn't have direct flag, but we can filter later)
    if (!includeDevDependencies && !this.config.includeDevDependencies) {
      console.log('Dev dependencies will be filtered during enhancement')
    }

    return command
  }

  /**
   * Read SBOM from file
   */
  private readSBOM(filePath: string, format: SBOMFormat): any {
    if (!existsSync(filePath)) {
      throw new Error(`SBOM file not found: ${filePath}`)
    }

    try {
      const content = readFileSync(filePath, 'utf-8')
      return JSON.parse(content)
    } catch (error) {
      throw new Error(`Failed to read SBOM file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Validate SBOM structure
   */
  private validateSBOM(sbomData: any, format: SBOMFormat): SBOMDocument {
    if (format === 'cyclonedx') {
      return this.validateCycloneDX(sbomData)
    } else if (format === 'spdx') {
      return this.validateSPDX(sbomData)
    }
    
    throw new Error(`Unsupported SBOM format: ${format}`)
  }

  /**
   * Validate CycloneDX SBOM
   */
  private validateCycloneDX(data: any): SBOMDocument {
    if (!data.bomFormat || data.bomFormat !== 'CycloneDX') {
      throw new Error('Invalid CycloneDX format: missing or incorrect bomFormat')
    }

    if (!data.specVersion) {
      throw new Error('Invalid CycloneDX format: missing specVersion')
    }

    // Transform to our standard format
    return {
      bomFormat: 'CycloneDX',
      specVersion: data.specVersion,
      metadata: {
        timestamp: data.metadata?.timestamp || new Date().toISOString(),
        tools: data.metadata?.tools?.map((tool: any) => ({
          name: tool.name,
          version: tool.version,
        })),
        component: data.metadata?.component ? this.transformComponent(data.metadata.component) : undefined,
      },
      components: (data.components || []).map((comp: any) => this.transformComponent(comp)),
      dependencies: data.dependencies,
      vulnerabilities: data.vulnerabilities?.map((vuln: any) => this.transformVulnerability(vuln)),
    }
  }

  /**
   * Validate SPDX SBOM
   */
  private validateSPDX(data: any): SBOMDocument {
    if (!data.spdxVersion) {
      throw new Error('Invalid SPDX format: missing spdxVersion')
    }

    // Transform SPDX to our standard format
    return {
      bomFormat: 'SPDX',
      specVersion: data.spdxVersion,
      metadata: {
        timestamp: data.creationInfo?.created || new Date().toISOString(),
        tools: data.creationInfo?.creators?.map((creator: string) => {
          const match = creator.match(/Tool: (.+?)\s*(?:v?([\d.]+))?/)
          return match ? { name: match[1], version: match[2] || 'unknown' } : { name: creator, version: 'unknown' }
        }),
      },
      components: (data.packages || []).map((pkg: any) => this.transformSPDXPackage(pkg)),
    }
  }

  /**
   * Transform component to standard format
   */
  private transformComponent(comp: any): Component {
    return {
      name: comp.name || comp['@id'] || 'unknown',
      version: comp.version || 'unknown',
      type: comp.type || 'library',
      purl: comp.purl,
      cpe: comp.cpe,
      supplier: comp.supplier?.name || comp.supplier,
      author: comp.author,
      copyright: comp.copyright,
      licenses: comp.licenses ? [comp.licenses].flat().map((lic: any) => 
        typeof lic === 'string' ? lic : lic.license?.id || lic.license?.name || 'unknown'
      ) : undefined,
      hash: comp.hashes?.reduce((acc: Record<string, string>, hash: any) => {
        acc[hash.alg] = hash.content
        return acc
      }, {}),
    }
  }

  /**
   * Transform SPDX package to component
   */
  private transformSPDXPackage(pkg: any): Component {
    return {
      name: pkg.name || 'unknown',
      version: pkg.versionInfo || 'unknown',
      type: 'library',
      purl: pkg.externalRefs?.find((ref: any) => ref.referenceType === 'purl')?.referenceLocator,
      supplier: pkg.supplier,
      author: pkg.originator,
      copyright: pkg.copyrightText,
      licenses: pkg.licenseDeclared ? [pkg.licenseDeclared] : undefined,
      hash: pkg.checksums?.reduce((acc: Record<string, string>, checksum: any) => {
        acc[checksum.algorithm] = checksum.checksumValue
        return acc
      }, {}),
    }
  }

  /**
   * Transform vulnerability to standard format
   */
  private transformVulnerability(vuln: any): any {
    return {
      id: vuln.id || vuln['bom-ref'] || 'unknown',
      source: 'CVE', // Default, could be enhanced
      severity: this.mapSeverity(vuln.severity || vuln.rating?.severity),
      description: vuln.description,
      published: vuln.created,
      updated: vuln.updated,
      references: vuln.advisories || vuln.references,
      affected: vuln.affects?.map((affect: any) => affect.ref),
    }
  }

  /**
   * Map severity strings to standard format
   */
  private mapSeverity(severity?: string): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO' {
    if (!severity) return 'INFO'
    
    const upper = severity.toUpperCase()
    if (upper.includes('CRITICAL')) return 'CRITICAL'
    if (upper.includes('HIGH')) return 'HIGH'
    if (upper.includes('MEDIUM')) return 'MEDIUM'
    if (upper.includes('LOW')) return 'LOW'
    return 'INFO'
  }

  /**
   * Enhance SBOM with additional metadata
   */
  private enhanceSBOM(sbom: SBOMDocument, options: SBOMGeneratorOptions): SBOMDocument {
    const enhanced = { ...sbom }

    // Filter dev dependencies if needed
    if (!options.includeDevDependencies && !this.config.includeDevDependencies) {
      enhanced.components = enhanced.components.filter(comp => 
        !this.isDevDependency(comp.name, options.projectPath)
      )
    }

    // Add agency-specific metadata
    enhanced.metadata = {
      ...enhanced.metadata,
      timestamp: new Date().toISOString(),
    }

    return enhanced
  }

  /**
   * Check if component is a dev dependency
   */
  private isDevDependency(componentName: string, projectPath: string): boolean {
    try {
      const packageJsonPath = join(projectPath, 'package.json')
      if (!existsSync(packageJsonPath)) return false

      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
      const devDeps = Object.keys(packageJson.devDependencies || {})
      
      return devDeps.some(dep => componentName.includes(dep) || dep.includes(componentName))
    } catch {
      return false
    }
  }

  /**
   * Scan for vulnerabilities in SBOM
   */
  async scanVulnerabilities(sbom: SBOMDocument): Promise<SecurityScanResult> {
    const vulnerabilities: any[] = sbom.vulnerabilities || []
    
    const criticalVulns = vulnerabilities.filter(v => v.severity === 'CRITICAL')
    const highVulns = vulnerabilities.filter(v => v.severity === 'HIGH')

    const status = criticalVulns.length > 0 ? 'failed' : 
                  highVulns.length > 0 ? 'warning' : 'passed'

    const recommendations = this.generateRecommendations(vulnerabilities)

    return {
      scanType: 'vulnerability',
      timestamp: new Date().toISOString(),
      status,
      summary: `Found ${vulnerabilities.length} vulnerabilities (${criticalVulns.length} critical, ${highVulns.length} high)`,
      details: { totalVulnerabilities: vulnerabilities.length },
      vulnerabilities,
      recommendations,
    }
  }

  /**
   * Generate security recommendations
   */
  private generateRecommendations(vulnerabilities: any[]): string[] {
    const recommendations: string[] = []

    if (vulnerabilities.length === 0) {
      recommendations.push('No vulnerabilities detected. Continue regular security monitoring.')
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

    recommendations.push('Review all vulnerability reports for exploitability')
    recommendations.push('Consider implementing automated dependency updates')
    recommendations.push('Monitor for new vulnerabilities in current dependencies')

    return recommendations
  }
}

export * from '../types'
