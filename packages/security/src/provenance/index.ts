/**
 * Build Provenance Tracking
 * 
 * Tracks and verifies build provenance for SLSA compliance
 */

import { createHash } from 'crypto'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { z } from 'zod'
import { 
  BuildProvenance, 
  Component, 
  SecurityScanResult,
  SecurityConfig
} from '../types'

export interface ProvenanceOptions {
  buildId: string
  commitSha: string
  branch: string
  actor: string
  workflow: string
  repository: string
  runner: string
  packageName: string
  packagePath: string
}

export class ProvenanceTracker {
  private config: SecurityConfig['provenanceTracking']

  constructor(config: SecurityConfig['provenanceTracking']) {
    this.config = config
  }

  /**
   * Generate build provenance
   */
  async generate(options: ProvenanceOptions): Promise<BuildProvenance> {
    if (!this.config.enabled) {
      throw new Error('Provenance tracking is disabled in configuration')
    }

    const provenance: BuildProvenance = {
      builder: {
        id: 'github-actions',
        version: 'latest',
      },
      buildType: 'npm-build',
      invocationId: options.buildId,
      buildConfig: this.getBuildConfig(options),
      resolvedDependencies: await this.getDependencies(options.packagePath),
      materials: this.getMaterials(options.packagePath),
    }

    return provenance
  }

  /**
   * Get build configuration
   */
  private getBuildConfig(options: ProvenanceOptions): Record<string, unknown> {
    return {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      buildTime: new Date().toISOString(),
      commitSha: options.commitSha,
      branch: options.branch,
      actor: options.actor,
      workflow: options.workflow,
      repository: options.repository,
      runner: options.runner,
      packageName: options.packageName,
      packagePath: options.packagePath,
      slsaLevel: this.config.slsaLevel,
    }
  }

  /**
   * Get resolved dependencies
   */
  private async getDependencies(packagePath: string): Promise<Component[]> {
    const packageJsonPath = join(packagePath, 'package.json')
    const lockfilePath = join(packagePath, 'pnpm-lock.yaml')

    if (!existsSync(packageJsonPath)) {
      return []
    }

    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
    const dependencies: Component[] = []

    // Add direct dependencies
    const deps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
      ...packageJson.peerDependencies,
    }

    for (const [name, version] of Object.entries(deps)) {
      dependencies.push({
        name,
        version: typeof version === 'string' ? version : 'unknown',
        type: 'library',
        purl: `pkg:npm/${name}@${version}`,
      })
    }

    // If lockfile exists, add more precise version info
    if (existsSync(lockfilePath)) {
      try {
        const lockfileContent = readFileSync(lockfilePath, 'utf-8')
        const lockfileHash = createHash('sha256').update(lockfileContent).digest('hex')
        
        // Add lockfile as a material
        dependencies.push({
          name: 'pnpm-lock.yaml',
          version: lockfileHash.substring(0, 16),
          type: 'tool',
          hash: { 'sha256': lockfileHash },
        })
      } catch (error) {
        console.warn('Could not read lockfile:', error)
      }
    }

    return dependencies
  }

  /**
   * Get build materials
   */
  private getMaterials(packagePath: string): Array<{
    uri: string
    digest: Record<string, string>
  }> {
    const materials: Array<{ uri: string; digest: Record<string, string> }> = []

    // Add package.json as material
    const packageJsonPath = join(packagePath, 'package.json')
    if (existsSync(packageJsonPath)) {
      const content = readFileSync(packageJsonPath, 'utf-8')
      const hash = createHash('sha256').update(content).digest('hex')
      
      materials.push({
        uri: 'file://package.json',
        digest: { 'sha256': hash },
      })
    }

    // Add lockfile as material
    const lockfilePath = join(packagePath, 'pnpm-lock.yaml')
    if (existsSync(lockfilePath)) {
      const content = readFileSync(lockfilePath, 'utf-8')
      const hash = createHash('sha256').update(content).digest('hex')
      
      materials.push({
        uri: 'file://pnpm-lock.yaml',
        digest: { 'sha256': hash },
      })
    }

    return materials
  }

  /**
   * Verify provenance integrity
   */
  async verify(provenance: BuildProvenance): Promise<SecurityScanResult> {
    const issues: string[] = []
    const recommendations: string[] = []

    // Check SLSA level compliance
    if (this.config.slsaLevel > 3 && !provenance.invocationId) {
      issues.push('Missing invocation ID for SLSA Level 4+ compliance')
    }

    // Check builder information
    if (!provenance.builder.id) {
      issues.push('Missing builder ID')
    }

    if (!provenance.builder.version) {
      issues.push('Missing builder version')
    }

    // Check dependencies
    if (!provenance.resolvedDependencies || provenance.resolvedDependencies.length === 0) {
      issues.push('No resolved dependencies found')
      recommendations.push('Ensure all dependencies are properly tracked')
    }

    // Check materials
    if (!provenance.materials || provenance.materials.length === 0) {
      issues.push('No build materials found')
      recommendations.push('Track source files and configuration files as materials')
    }

    // Verify material hashes
    for (const material of provenance.materials || []) {
      if (!material.digest || Object.keys(material.digest).length === 0) {
        issues.push(`Missing digest for material: ${material.uri}`)
      }
    }

    const status = issues.length > 0 ? 'failed' : 
                  recommendations.length > 0 ? 'warning' : 'passed'

    return {
      scanType: 'provenance',
      timestamp: new Date().toISOString(),
      status,
      summary: `Provenance verification: ${issues.length} issues, ${recommendations.length} recommendations`,
      details: { 
        slsaLevel: this.config.slsaLevel,
        dependencyCount: provenance.resolvedDependencies?.length || 0,
        materialCount: provenance.materials?.length || 0,
      },
      recommendations,
    }
  }

  /**
   * Generate SLSA attestation
   */
  async generateAttestation(provenance: BuildProvenance): Promise<any> {
    const attestation = {
      _type: 'https://in-toto.io/Statement/v1',
      predicateType: 'https://slsa.dev/provenance/v1',
      predicate: {
        buildDefinition: {
          buildType: provenance.buildType,
          externalParameters: provenance.buildConfig,
          internalParameters: {},
          resolvedDependencies: provenance.resolvedDependencies.map(dep => ({
            uri: dep.purl || `pkg:generic/${dep.name}@${dep.version}`,
            digest: dep.hash,
          })),
        },
        runDetails: {
          builder: {
            id: provenance.builder.id,
            version: provenance.builder.version,
          },
          buildMetadata: {
            invocationId: provenance.invocationId,
            startedOn: new Date().toISOString(),
            finishedOn: new Date().toISOString(),
          },
          materials: provenance.materials,
        },
      },
    }

    return attestation
  }

  /**
   * Export provenance to file
   */
  exportToFile(provenance: BuildProvenance, filePath: string): void {
    const content = JSON.stringify(provenance, null, 2)
    writeFileSync(filePath, content, 'utf-8')
  }

  /**
   * Import provenance from file
   */
  importFromFile(filePath: string): BuildProvenance {
    if (!existsSync(filePath)) {
      throw new Error(`Provenance file not found: ${filePath}`)
    }

    const content = readFileSync(filePath, 'utf-8')
    const data = JSON.parse(content)

    // Validate structure
    if (!data.builder || !data.buildType) {
      throw new Error('Invalid provenance file structure')
    }

    return data as BuildProvenance
  }

  /**
   * Compare two provenance records
   */
  compare(provenance1: BuildProvenance, provenance2: BuildProvenance): {
    identical: boolean
    differences: string[]
  } {
    const differences: string[] = []

    // Compare build type
    if (provenance1.buildType !== provenance2.buildType) {
      differences.push(`Build type: ${provenance1.buildType} vs ${provenance2.buildType}`)
    }

    // Compare builder
    if (provenance1.builder.id !== provenance2.builder.id) {
      differences.push(`Builder ID: ${provenance1.builder.id} vs ${provenance2.builder.id}`)
    }

    // Compare dependencies
    const deps1 = provenance1.resolvedDependencies || []
    const deps2 = provenance2.resolvedDependencies || []
    
    if (deps1.length !== deps2.length) {
      differences.push(`Dependency count: ${deps1.length} vs ${deps2.length}`)
    }

    // Compare materials
    const materials1 = provenance1.materials || []
    const materials2 = provenance2.materials || []
    
    if (materials1.length !== materials2.length) {
      differences.push(`Material count: ${materials1.length} vs ${materials2.length}`)
    }

    return {
      identical: differences.length === 0,
      differences,
    }
  }
}

export * from '../types'
