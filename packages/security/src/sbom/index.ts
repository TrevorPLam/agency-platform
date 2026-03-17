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
  private readSBOM(filePath: string, format: SBOMFormat): unknown {
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
  private validateSBOM(sbomData: unknown, format: SBOMFormat): SBOMDocument {
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
  private validateCycloneDX(data: unknown): SBOMDocument {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid CycloneDX format: data must be an object')
    }
    
    const cycloneDX = data as Record<string, unknown>
    
    if (cycloneDX.bomFormat !== 'CycloneDX') {
      throw new Error('Invalid CycloneDX format: missing or incorrect bomFormat')
    }

    if (!cycloneDX.specVersion) {
      throw new Error('Invalid CycloneDX format: missing specVersion')
    }

    // Transform to our standard format
    return {
      bomFormat: 'CycloneDX',
      specVersion: cycloneDX.specVersion as string,
      metadata: {
        timestamp: (cycloneDX.metadata as Record<string, unknown>)?.timestamp as string || new Date().toISOString(),
        tools: (cycloneDX.metadata as Record<string, unknown>)?.tools?.map((tool: unknown) => ({
          name: (tool as Record<string, unknown>).name as string,
          version: (tool as Record<string, unknown>).version as string,
        })) || [],
        component: (cycloneDX.metadata as Record<string, unknown>)?.component ? 
          this.transformComponent((cycloneDX.metadata as Record<string, unknown>).component as Record<string, unknown>) : undefined,
      },
      components: (cycloneDX.components as unknown[] || []).map((comp: unknown) => 
        this.transformComponent(comp as Record<string, unknown>)
      ),
      dependencies: cycloneDX.dependencies as unknown[],
      vulnerabilities: (cycloneDX.vulnerabilities as unknown[] || []).map((vuln: unknown) => 
        this.transformVulnerability(vuln as Record<string, unknown>)
      ),
    }
  }

  /**
   * Validate SPDX SBOM
   */
  private validateSPDX(data: unknown): SBOMDocument {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid SPDX format: data must be an object')
    }
    
    const spdx = data as Record<string, unknown>
    
    if (!spdx.spdxVersion) {
      throw new Error('Invalid SPDX format: missing spdxVersion')
    }

    // Transform SPDX to our standard format
    return {
      bomFormat: 'SPDX',
      specVersion: spdx.spdxVersion as string,
      metadata: {
        timestamp: (spdx.creationInfo as Record<string, unknown>)?.created as string || new Date().toISOString(),
        tools: (spdx.creationInfo as Record<string, unknown>)?.creators?.map((creator: string) => {
          const match = creator.match(/Tool: (.+?)\s*(?:v?([\d.]+))?/)
          return match ? { name: match[1], version: match[2] || 'unknown' } : { name: creator, version: 'unknown' }
        }) || [],
      },
      components: ((spdx.packages as unknown[]) || []).map((pkg: unknown) => 
        this.transformSPDXPackage(pkg as Record<string, unknown>)
      ),
    }
  }

  /**
   * Transform component to standard format
   */
  private transformComponent(comp: Record<string, unknown>): Component {
    return {
      name: (comp.name || comp['@id'] || 'unknown') as string,
      version: (comp.version || 'unknown') as string,
      type: (comp.type || 'library') as string,
      purl: comp.purl as string,
      cpe: comp.cpe as string,
      supplier: typeof comp.supplier === 'string' ? comp.supplier : (comp.supplier as Record<string, unknown>)?.name as string,
      author: comp.author as string,
      copyright: comp.copyright as string,
      licenses: comp.licenses ? [comp.licenses].flat().map((lic: unknown) => 
        typeof lic === 'string' ? lic : ((lic as Record<string, unknown>)?.license?.id || (lic as Record<string, unknown>)?.license?.name || 'unknown') as string
      ) : undefined,
      hash: (comp.hashes as unknown[])?.reduce((acc: Record<string, string>, hash: unknown) => {
        const hashObj = hash as Record<string, unknown>
        acc[hashObj.alg as string] = hashObj.content as string
        return acc
      }, {}),
    }
  }

  /**
   * Transform SPDX package to component
   */
  private transformSPDXPackage(pkg: Record<string, unknown>): Component {
    return {
      name: (pkg.name || 'unknown') as string,
      version: (pkg.versionInfo || 'unknown') as string,
      type: 'library',
      purl: ((pkg.externalRefs as unknown[]) || []).find((ref: unknown) => 
        (ref as Record<string, unknown>).referenceType === 'purl'
      )?.referenceLocator as string,
      supplier: pkg.supplier as string,
      author: pkg.originator as string,
      copyright: pkg.copyrightText as string,
      licenses: pkg.licenseDeclared ? [pkg.licenseDeclared as string] : undefined,
      hash: ((pkg.checksums as unknown[]) || []).reduce((acc: Record<string, string>, checksum: unknown) => {
        const checksumObj = checksum as Record<string, unknown>
        acc[checksumObj.algorithm as string] = checksumObj.checksumValue as string
        return acc
      }, {}),
    }
  }

  /**
   * Transform vulnerability to standard format
   */
  private transformVulnerability(vuln: Record<string, unknown>): unknown {
    return {
      id: (vuln.id || vuln['bom-ref'] || 'unknown') as string,
      source: 'CVE', // Default, could be enhanced
      severity: this.mapSeverity((vuln.severity || (vuln as Record<string, unknown>)?.rating?.severity) as string),
      description: vuln.description as string,
      published: vuln.created as string,
      updated: vuln.updated as string,
      references: vuln.advisories as unknown[] || vuln.references as unknown[],
      affected: ((vuln.affects as unknown[]) || []).map((affect: unknown) => 
        (affect as Record<string, unknown>).ref as string
      ),
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
    const vulnerabilities: unknown[] = sbom.vulnerabilities || []
    
    const criticalVulns = vulnerabilities.filter((v: unknown) => 
      typeof v === 'object' && v !== null && (v as Record<string, unknown>).severity === 'CRITICAL'
    )
    const highVulns = vulnerabilities.filter((v: unknown) => 
      typeof v === 'object' && v !== null && (v as Record<string, unknown>).severity === 'HIGH'
    )

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
  private generateRecommendations(vulnerabilities: unknown[]): string[] {
    const recommendations: string[] = []

    if (vulnerabilities.length === 0) {
      recommendations.push('No vulnerabilities detected. Continue regular security monitoring.')
      return recommendations
    }

    const criticalCount = vulnerabilities.filter((v: unknown) => 
      typeof v === 'object' && v !== null && (v as Record<string, unknown>).severity === 'CRITICAL'
    ).length
    const highCount = vulnerabilities.filter((v: unknown) => 
      typeof v === 'object' && v !== null && (v as Record<string, unknown>).severity === 'HIGH'
    ).length

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
