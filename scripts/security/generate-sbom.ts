#!/usr/bin/env tsx

/**
 * SBOM Generation Script
 * 
 * This script generates Software Bill of Materials (SBOM) for the agency platform
 * using Syft and enhances it with additional metadata and vulnerability scanning.
 */

import { Command } from 'commander'
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { SBOMGenerator, SBOMFormat } from '../../packages/security/src/sbom'
import { SecurityConfig } from '../../packages/security/src/types'

const program = new Command()

program
  .name('generate-sbom')
  .description('Generate SBOM for agency platform')
  .option('-p, --path <path>', 'Project path to scan', '.')
  .option('-o, --output <path>', 'Output directory for SBOM files', './sbom-artifacts')
  .option('-f, --format <format>', 'SBOM format (cyclonedx|spdx)', 'cyclonedx')
  .option('--include-dev', 'Include development dependencies', false)
  .option('--exclude <patterns>', 'Comma-separated exclude patterns', '')
  .option('--scan-vulns', 'Scan for vulnerabilities', true)
  .action(async (options) => {
    try {
      console.log('🔒 Agency Platform SBOM Generator')
      console.log('=====================================')

      // Validate inputs
      if (!existsSync(options.path)) {
        console.error(`❌ Error: Project path does not exist: ${options.path}`)
        process.exit(1)
      }

      const format = options.format as SBOMFormat
      if (!['cyclonedx', 'spdx'].includes(format)) {
        console.error(`❌ Error: Invalid format. Use 'cyclonedx' or 'spdx'`)
        process.exit(1)
      }

      // Create output directory
      if (!existsSync(options.output)) {
        mkdirSync(options.output, { recursive: true })
      }

      // Parse exclude patterns
      const excludePatterns = options.exclude 
        ? options.exclude.split(',').map((p: string) => p.trim())
        : []

      // Security configuration
      const securityConfig: SecurityConfig = {
        sbomGeneration: {
          enabled: true,
          formats: [format],
          includeDevDependencies: options.includeDev,
          excludePatterns: [
            '**/node_modules/**',
            '**/.git/**',
            '**/dist/**',
            '**/.next/**',
            '**/coverage/**',
            ...excludePatterns,
          ],
        },
        integrityVerification: {
          enabled: true,
          algorithm: 'sha256',
          verifyArtifacts: true,
        },
        provenanceTracking: {
          enabled: true,
          slsaLevel: 3,
          attestations: true,
        },
        vulnerabilityScanning: {
          enabled: options.scanVulns,
          severityThreshold: 'HIGH',
          failOnThreshold: true,
        },
      }

      // Initialize SBOM generator
      const sbomGenerator = new SBOMGenerator(securityConfig.sbomGeneration)

      // Generate SBOM
      console.log(`📦 Generating SBOM for: ${options.path}`)
      console.log(`📄 Format: ${format}`)
      console.log(`📁 Output: ${options.output}`)
      console.log(`🔧 Include dev dependencies: ${options.includeDev}`)
      console.log('')

      const outputFile = join(options.output, `sbom.${format}.json`)
      
      await sbomGenerator.generate({
        projectPath: options.path,
        outputPath: outputFile,
        format,
        includeDevDependencies: options.includeDev,
        excludePatterns,
      })

      console.log(`✅ SBOM generated successfully: ${outputFile}`)

      // Scan for vulnerabilities if enabled
      if (options.scanVulns) {
        console.log('🔍 Scanning for vulnerabilities...')
        
        const sbomData = require(join(process.cwd(), outputFile))
        const scanResult = await sbomGenerator.scanVulnerabilities(sbomData)
        
        console.log(`📊 Scan Result: ${scanResult.status.toUpperCase()}`)
        console.log(`📝 ${scanResult.summary}`)
        
        if (scanResult.recommendations.length > 0) {
          console.log('')
          console.log('💡 Recommendations:')
          scanResult.recommendations.forEach(rec => {
            console.log(`   • ${rec}`)
          })
        }

        // Save scan results
        const scanOutputFile = join(options.output, 'vulnerability-scan.json')
        writeFileSync(scanOutputFile, JSON.stringify(scanResult, null, 2))
        console.log(`📄 Scan results saved: ${scanOutputFile}`)
      }

      // Generate summary report
      console.log('')
      console.log('📋 Generating summary report...')
      
      const reportContent = generateSummaryReport(options, outputFile, format)
      const reportFile = join(options.output, 'sbom-report.md')
      writeFileSync(reportFile, reportContent)
      
      console.log(`📄 Summary report: ${reportFile}`)
      console.log('')
      console.log('🎉 SBOM generation completed successfully!')

    } catch (error) {
      console.error('❌ Error generating SBOM:', error instanceof Error ? error.message : 'Unknown error')
      process.exit(1)
    }
  })

/**
 * Generate markdown summary report
 */
function generateSummaryReport(options: any, outputFile: string, format: SBOMFormat): string {
  const timestamp = new Date().toISOString()
  
  return `# Agency Platform SBOM Report

Generated: ${timestamp}

## Configuration
- **Project Path**: ${options.path}
- **Output Directory**: ${options.output}
- **Format**: ${format}
- **Include Dev Dependencies**: ${options.includeDev}
- **Exclude Patterns**: ${options.exclude || 'None'}

## Generated Files
- **SBOM**: \`${outputFile}\`
- **Vulnerability Scan**: \`${join(options.output, 'vulnerability-scan.json')}\`

## Security Information
This SBOM provides complete visibility into the software supply chain for the agency platform.
All dependencies are tracked and monitored for security vulnerabilities.

## Usage
- Use this SBOM for compliance reporting (SOC 2, ISO 27001)
- Monitor for new vulnerabilities in identified components
- Track dependency changes over time
- Verify build integrity and provenance

## Next Steps
1. Review the generated SBOM for completeness
2. Address any critical vulnerabilities found
3. Integrate SBOM into your security monitoring pipeline
4. Update dependency management policies based on findings

---
*Generated by Agency Platform Security Package*
`
}

// Parse command line arguments
program.parse()

// Export for use in other scripts
export { generateSummaryReport }
