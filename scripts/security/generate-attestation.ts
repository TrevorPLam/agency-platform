#!/usr/bin/env tsx

/**
 * SLSA Attestation Generation Script
 * 
 * This script generates SLSA (Supply-chain Levels for Software Artifacts) attestations
 * for build artifacts using GitHub Actions attestation framework.
 */

import { Command } from 'commander'
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs'
import { join, dirname, basename } from 'path'
import { execSync } from 'child_process'
import { ProvenanceTracker, ProvenanceData } from '../../packages/security/src/provenance'
import { SecurityConfig } from '../../packages/security/src/types'

const program = new Command()

program
  .name('generate-attestation')
  .description('Generate SLSA attestations for build artifacts')
  .option('-a, --artifact <path>', 'Path to artifact to attest')
  .option('-d, --artifacts-dir <path>', 'Directory containing build artifacts', './dist')
  .option('-o, --output <path>', 'Output directory for attestations', './attestations')
  .option('--build-id <id>', 'Build identifier')
  .option('--commit-sha <sha>', 'Git commit SHA')
  .option('--branch <branch>', 'Git branch name')
  .option('--workflow <workflow>', 'GitHub Actions workflow name')
  .option('--run-id <id>', 'GitHub Actions run ID')
  .option('--repository <repo>', 'GitHub repository')
  .action(async (options) => {
    try {
      console.log('🔒 Agency Platform SLSA Attestation Generator')
      console.log('==========================================')

      // Determine artifact paths
      const artifactPaths: string[] = []
      
      if (options.artifact) {
        if (!existsSync(options.artifact)) {
          console.error(`❌ Error: Artifact does not exist: ${options.artifact}`)
          process.exit(1)
        }
        artifactPaths.push(options.artifact)
      } else if (options.artifactsDir && existsSync(options.artifactsDir)) {
        // Find all files in artifacts directory
        const findCommand = process.platform === 'win32' 
          ? `dir /s /b "${options.artifactsDir}"`
          : `find "${options.artifactsDir}" -type f`
        
        try {
          const output = execSync(findCommand, { encoding: 'utf8' })
          artifactPaths.push(...output.trim().split('\n').filter(Boolean))
        } catch (error) {
          console.error(`❌ Error: Could not scan artifacts directory: ${error}`)
          process.exit(1)
        }
      }

      if (artifactPaths.length === 0) {
        console.error('❌ Error: No artifacts found for attestation')
        process.exit(1)
      }

      // Create output directory
      if (!existsSync(options.output)) {
        mkdirSync(options.output, { recursive: true })
      }

      // Collect provenance data
      const provenanceData: ProvenanceData = {
        buildId: options.buildId || `build-${Date.now()}`,
        buildTime: new Date().toISOString(),
        commitSha: options.commitSha || getCurrentGitSha(),
        branch: options.branch || getCurrentGitBranch(),
        workflow: options.workflow || process.env.GITHUB_WORKFLOW || 'unknown',
        runId: options.runId || process.env.GITHUB_RUN_ID || 'local',
        repository: options.repository || process.env.GITHUB_REPOSITORY || 'local',
        actor: process.env.GITHUB_ACTOR || process.env.USER || 'unknown',
        runner: process.env.RUNNER_OS || process.platform,
        materials: [],
        dependencies: getProjectDependencies(),
        buildConfig: getBuildConfig(),
      }

      console.log(`📦 Processing ${artifactPaths.length} artifacts...`)

      // Generate attestations for each artifact
      const provenanceTracker = new ProvenanceTracker()
      
      for (const artifactPath of artifactPaths) {
        console.log(`🔒 Generating attestation for: ${artifactPath}`)
        
        try {
          // Calculate artifact hash
          const artifactHash = calculateFileHash(artifactPath)
          
          // Add artifact to materials
          provenanceData.materials.push({
            type: 'artifact',
            path: artifactPath,
            hash: artifactHash,
            size: getFileSize(artifactPath),
          })

          // Generate SLSA provenance
          const provenance = await provenanceTracker.generate({
            ...provenanceData,
            subject: {
              name: basename(artifactPath),
              digest: { sha256: artifactHash },
            },
          })

          // Save attestation
          const attestationPath = join(options.output, `${basename(artifactPath)}.attestation`)
          writeFileSync(attestationPath, JSON.stringify(provenance, null, 2))
          
          console.log(`✅ Attestation saved: ${attestationPath}`)

        } catch (error) {
          console.error(`❌ Error generating attestation for ${artifactPath}:`, error)
          // Continue with other artifacts
        }
      }

      // Generate summary manifest
      const manifest = {
        generated: new Date().toISOString(),
        build: provenanceData,
        artifacts: artifactPaths.map(path => ({
          path,
          attestation: join(options.output, `${basename(path)}.attestation`),
        })),
        total: artifactPaths.length,
      }

      const manifestPath = join(options.output, 'attestation-manifest.json')
      writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
      
      console.log(`✅ Attestation manifest saved: ${manifestPath}`)
      console.log(`🎉 Generated ${artifactPaths.length} SLSA attestations`)

    } catch (error) {
      console.error('❌ Error generating attestations:', error)
      process.exit(1)
    }
  })

function getCurrentGitSha(): string {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim()
  } catch {
    return 'unknown'
  }
}

function getCurrentGitBranch(): string {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim()
  } catch {
    return 'unknown'
  }
}

function getProjectDependencies(): any[] {
  try {
    const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'))
    const deps = Object.entries(packageJson.dependencies || {}).map(([name, version]) => ({
      name,
      version,
      type: 'production',
    }))
    const devDeps = Object.entries(packageJson.devDependencies || {}).map(([name, version]) => ({
      name,
      version,
      type: 'development',
    }))
    return [...deps, ...devDeps]
  } catch {
    return []
  }
}

function getBuildConfig(): any {
  return {
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    environment: process.env.NODE_ENV || 'development',
    buildTool: 'agency-platform-security',
  }
}

function calculateFileHash(filePath: string): string {
  try {
    const crypto = require('crypto')
    const fileBuffer = readFileSync(filePath)
    const hashSum = crypto.createHash('sha256')
    hashSum.update(fileBuffer)
    return hashSum.digest('hex')
  } catch {
    return 'unknown'
  }
}

function getFileSize(filePath: string): number {
  try {
    const stats = require('fs').statSync(filePath)
    return stats.size
  } catch {
    return 0
  }
}

if (require.main === module) {
  program.parse()
}
