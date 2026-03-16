#!/usr/bin/env tsx

/**
 * Artifact Integrity Verification Script
 * 
 * This script verifies the integrity of build artifacts and generates
 * cryptographic hashes for supply chain security.
 */

import { Command } from 'commander'
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { IntegrityVerifier, IntegrityOptions } from '../../packages/security/src/integrity'
import { SecurityConfig } from '../../packages/security/src/types'

const program = new Command()

program
  .name('verify-integrity')
  .description('Verify artifact integrity for agency platform')
  .option('-p, --path <path>', 'Path to verify', '.')
  .option('-o, --output <path>', 'Output directory for reports', './integrity-reports')
  .option('-a, --algorithm <algorithm>', 'Hash algorithm (sha256|sha384|sha512)', 'sha256')
  .option('--generate-manifest', 'Generate integrity manifest', false)
  .option('--verify-manifest <path>', 'Verify against existing manifest')
  .option('--exclude <patterns>', 'Comma-separated exclude patterns', '')
  .option('--quick-check', 'Quick integrity check for CI/CD', false)
  .action(async (options) => {
    try {
      console.log('🔒 Agency Platform Integrity Verifier')
      console.log('=====================================')

      // Validate inputs
      if (!existsSync(options.path)) {
        console.error(`❌ Error: Path does not exist: ${options.path}`)
        process.exit(1)
      }

      const algorithm = options.algorithm as 'sha256' | 'sha384' | 'sha512'
      if (!['sha256', 'sha384', 'sha512'].includes(algorithm)) {
        console.error(`❌ Error: Invalid algorithm. Use 'sha256', 'sha384', or 'sha512'`)
        process.exit(1)
      }

      // Parse exclude patterns
      const excludePatterns = options.exclude 
        ? options.exclude.split(',').map((p: string) => p.trim())
        : []

      // Create output directory
      if (!existsSync(options.output)) {
        mkdirSync(options.output, { recursive: true })
      }

      // Security configuration
      const securityConfig: SecurityConfig = {
        sbomGeneration: {
          enabled: false,
          formats: ['cyclonedx'],
          includeDevDependencies: false,
          excludePatterns: [],
        },
        integrityVerification: {
          enabled: true,
          algorithm,
          verifyArtifacts: true,
        },
        provenanceTracking: {
          enabled: true,
          slsaLevel: 3,
          attestations: true,
        },
        vulnerabilityScanning: {
          enabled: false,
          severityThreshold: 'HIGH',
          failOnThreshold: true,
        },
      }

      // Initialize integrity verifier
      const verifier = new IntegrityVerifier(securityConfig.integrityVerification)

      console.log(`🔍 Verifying integrity: ${options.path}`)
      console.log(`🔧 Algorithm: ${algorithm}`)
      console.log(`📁 Output: ${options.output}`)
      console.log(`📋 Generate manifest: ${options.generateManifest}`)
      console.log('')

      if (options.quickCheck) {
        // Quick check for CI/CD
        console.log('⚡ Performing quick integrity check...')
        
        const pathsToCheck = [
          join(options.path, 'package.json'),
          join(options.path, 'pnpm-lock.yaml'),
        ].filter(p => existsSync(p))

        const result = await verifier.quickCheck(pathsToCheck)
        
        console.log(`📊 Quick check result: ${result.passed ? 'PASSED' : 'FAILED'}`)
        
        for (const item of result.results) {
          const status = item.verified ? '✅' : '❌'
          console.log(`   ${status} ${item.path}`)
          if (item.hash) {
            console.log(`      Hash: ${item.hash}`)
          }
        }

        if (!result.passed) {
          console.log('')
          console.log('❌ Integrity check failed!')
          process.exit(1)
        }

        console.log('✅ Quick integrity check passed!')
        return
      }

      if (options.verifyManifest) {
        // Verify against existing manifest
        console.log(`📋 Verifying against manifest: ${options.verifyManifest}`)
        
        if (!existsSync(options.verifyManifest)) {
          console.error(`❌ Error: Manifest file not found: ${options.verifyManifest}`)
          process.exit(1)
        }

        const manifest = verifier.importManifest(options.verifyManifest)
        const verification = await verifier.verifyManifest(options.path, manifest)
        
        console.log(`📊 Verification result: ${verification.status.toUpperCase()}`)
        console.log(`📝 ${verification.summary}`)
        
        if (verification.details) {
          console.log('')
          console.log('📈 Details:')
          Object.entries(verification.details).forEach(([key, value]) => {
            console.log(`   ${key}: ${value}`)
          })
        }

        if (verification.recommendations.length > 0) {
          console.log('')
          console.log('💡 Recommendations:')
          verification.recommendations.forEach(rec => {
            console.log(`   • ${rec}`)
          })
        }

        // Save verification report
        const reportFile = join(options.output, 'verification-report.json')
        writeFileSync(reportFile, JSON.stringify(verification, null, 2))
        console.log(`📄 Verification report: ${reportFile}`)

        if (verification.status === 'failed') {
          console.log('')
          console.log('❌ Integrity verification failed!')
          process.exit(1)
        }

        console.log('✅ Integrity verification completed!')
        return
      }

      // Generate integrity report
      console.log('📋 Generating comprehensive integrity report...')
      
      const report = await verifier.generateReport(options.path)
      
      console.log(`📊 Report status: ${report.summary.status.toUpperCase()}`)
      console.log(`📝 ${report.summary.summary}`)
      
      if (report.summary.details) {
        console.log('')
        console.log('📈 Details:')
        Object.entries(report.summary.details).forEach(([key, value]) => {
          console.log(`   ${key}: ${value}`)
        })
      }

      // Save manifest if requested
      if (options.generateManifest) {
        const manifestFile = join(options.output, 'integrity-manifest.json')
        verifier.exportManifest(report.manifest, manifestFile)
        console.log(`📄 Integrity manifest: ${manifestFile}`)
      }

      // Save comprehensive report
      const reportFile = join(options.output, 'integrity-report.json')
      writeFileSync(reportFile, JSON.stringify(report, null, 2))
      console.log(`📄 Integrity report: ${reportFile}`)

      // Generate summary markdown
      console.log('')
      console.log('📋 Generating summary report...')
      
      const summaryContent = generateSummaryReport(options, report, algorithm)
      const summaryFile = join(options.output, 'integrity-summary.md')
      writeFileSync(summaryFile, summaryContent)
      
      console.log(`📄 Summary report: ${summaryFile}`)
      console.log('')
      console.log('🎉 Integrity verification completed!')

    } catch (error) {
      console.error('❌ Error verifying integrity:', error instanceof Error ? error.message : 'Unknown error')
      process.exit(1)
    }
  })

/**
 * Generate markdown summary report
 */
function generateSummaryReport(options: any, report: any, algorithm: string): string {
  const timestamp = new Date().toISOString()
  
  return `# Artifact Integrity Report

Generated: ${timestamp}

## Configuration
- **Path**: ${options.path}
- **Output Directory**: ${options.output}
- **Algorithm**: ${algorithm}
- **Generate Manifest**: ${options.generateManifest}

## Verification Results
- **Status**: ${report.summary.status.toUpperCase()}
- **Summary**: ${report.summary.summary}

## Artifact Statistics
${Object.entries(report.summary.details || {}).map(([key, value]) => `- **${key}**: ${value}`).join('\n')}

## Security Benefits
1. **Cryptographic Verification**: ${algorithm} hash verification ensures file integrity
2. **Tamper Detection**: Any modification is immediately detectable
3. **Build Reproducibility**: Verify builds produce identical artifacts
4. **Supply Chain Security**: Prevent unauthorized artifact modifications

## Usage
- Use this report for compliance verification (SOC 2, ISO 27001)
- Monitor for unauthorized changes to critical files
- Verify build artifacts before deployment
- Integrate into CI/CD pipeline for automated checks

## Recommendations
${report.recommendations.map(rec => `- ${rec}`).join('\n')}

## Next Steps
1. Store the integrity manifest in a secure location
2. Implement regular integrity checks in CI/CD
3. Monitor for any integrity violations
4. Update manifest when legitimate changes are made

---
*Generated by Agency Platform Security Package*
`
}

// Parse command line arguments
program.parse()

// Export for use in other scripts
export { generateSummaryReport }
