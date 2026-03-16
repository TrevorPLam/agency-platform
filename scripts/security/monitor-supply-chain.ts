#!/usr/bin/env tsx

/**
 * Supply Chain Monitoring Script
 * 
 * This script monitors dependencies for vulnerabilities and security issues
 * in the agency platform supply chain.
 */

import { Command } from 'commander'
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { SupplyChainMonitor, MonitoringOptions } from '../../packages/security/src/monitoring'
import { SecurityConfig } from '../../packages/security/src/types'

const program = new Command()

program
  .name('monitor-supply-chain')
  .description('Monitor supply chain security for agency platform')
  .option('-p, --path <path>', 'Project path to monitor', '.')
  .option('-o, --output <path>', 'Output directory for reports', './supply-chain-reports')
  .option('-s, --severity <threshold>', 'Severity threshold (critical|high|medium|low)', 'high')
  .option('--fail-on-threshold', 'Fail build if threshold exceeded', true)
  .option('--include-dev', 'Include development dependencies', false)
  .option('--check-licenses', 'Check license compliance', true)
  .option('--dashboard-data', 'Generate dashboard data', false)
  .action(async (options) => {
    try {
      console.log('🔒 Agency Platform Supply Chain Monitor')
      console.log('========================================')

      // Validate inputs
      if (!existsSync(options.path)) {
        console.error(`❌ Error: Project path does not exist: ${options.path}`)
        process.exit(1)
      }

      const severity = options.severity.toUpperCase()
      if (!['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(severity)) {
        console.error(`❌ Error: Invalid severity. Use 'critical', 'high', 'medium', or 'low'`)
        process.exit(1)
      }

      // Create output directory
      if (!existsSync(options.output)) {
        mkdirSync(options.output, { recursive: true })
      }

      // Security configuration
      const securityConfig: SecurityConfig = {
        sbomGeneration: {
          enabled: false,
          formats: ['cyclonedx'],
          includeDevDependencies: options.includeDev,
          excludePatterns: [],
        },
        integrityVerification: {
          enabled: false,
          algorithm: 'sha256',
          verifyArtifacts: true,
        },
        provenanceTracking: {
          enabled: false,
          slsaLevel: 3,
          attestations: true,
        },
        vulnerabilityScanning: {
          enabled: true,
          severityThreshold: severity as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
          failOnThreshold: options.failOnThreshold,
        },
      }

      // Initialize supply chain monitor
      const monitor = new SupplyChainMonitor(securityConfig.vulnerabilityScanning)

      console.log(`🔍 Monitoring supply chain: ${options.path}`)
      console.log(`📊 Severity threshold: ${severity}`)
      console.log(`📁 Output: ${options.output}`)
      console.log(`🔧 Include dev dependencies: ${options.includeDev}`)
      console.log(`📋 Check licenses: ${options.checkLicenses}`)
      console.log('')

      // Run vulnerability scan
      console.log('🔍 Scanning for vulnerabilities...')
      const scanResult = await monitor.scanDependencies(options.path)
      
      console.log(`📊 Scan result: ${scanResult.status.toUpperCase()}`)
      console.log(`📝 ${scanResult.summary}`)
      
      if (scanResult.details) {
        console.log('')
        console.log('📈 Scan Details:')
        Object.entries(scanResult.details).forEach(([key, value]) => {
          console.log(`   ${key}: ${value}`)
        })
      }

      // Show vulnerabilities if any
      if (scanResult.vulnerabilities && scanResult.vulnerabilities.length > 0) {
        console.log('')
        console.log('🚨 Vulnerabilities Found:')
        
        const groupedVulns = scanResult.vulnerabilities.reduce((acc, vuln) => {
          if (!acc[vuln.severity]) {
            acc[vuln.severity] = []
          }
          acc[vuln.severity].push(vuln)
          return acc
        }, {} as Record<string, typeof scanResult.vulnerabilities>)

        const severityOrder = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
        
        for (const severity of severityOrder) {
          const vulns = groupedVulns[severity]
          if (vulns && vulns.length > 0) {
            console.log(`   ${severity}:`)
            vulns.forEach(vuln => {
              console.log(`     • ${vuln.id} in ${vuln.affected?.join(', ') || 'unknown'}`)
              console.log(`       ${vuln.description}`)
            })
          }
        }
      }

      // Show recommendations
      if (scanResult.recommendations && scanResult.recommendations.length > 0) {
        console.log('')
        console.log('💡 Recommendations:')
        scanResult.recommendations.forEach(rec => {
          console.log(`   • ${rec}`)
        })
      }

      // Check license compliance if requested
      let licenseReport = null
      if (options.checkLicenses) {
        console.log('')
        console.log('📋 Checking license compliance...')
        const dependencies = monitor['getDependencies'](options.path)
        licenseReport = await monitor.checkLicenseCompliance(dependencies)
        
        console.log(`📊 License compliance: ${licenseReport.compliant ? 'COMPLIANT' : 'ISSUES FOUND'}`)
        
        if (licenseReport.issues.length > 0) {
          console.log('')
          console.log('⚠️  License Issues:')
          licenseReport.issues.forEach(issue => {
            console.log(`   • ${issue.package}: ${issue.license}`)
            console.log(`     ${issue.issue}`)
          })
        }
      }

      // Generate dashboard data if requested
      if (options.dashboardData) {
        console.log('')
        console.log('📊 Generating dashboard data...')
        const dashboardData = await monitor.generateDashboardData(options.path)
        
        const dashboardFile = join(options.output, 'dashboard-data.json')
        writeFileSync(dashboardFile, JSON.stringify(dashboardData, null, 2))
        console.log(`📄 Dashboard data: ${dashboardFile}`)
      }

      // Save reports
      console.log('')
      console.log('💾 Saving reports...')
      
      const scanReportFile = join(options.output, 'vulnerability-scan.json')
      monitor.exportReport(scanResult, scanReportFile)
      console.log(`📄 Vulnerability scan: ${scanReportFile}`)
      
      if (licenseReport) {
        const licenseReportFile = join(options.output, 'license-compliance.json')
        writeFileSync(licenseReportFile, JSON.stringify(licenseReport, null, 2))
        console.log(`📄 License compliance: ${licenseReportFile}`)
      }

      // Generate summary markdown
      console.log('')
      console.log('📋 Generating summary report...')
      
      const summaryContent = generateSummaryReport(options, scanResult, licenseReport, severity)
      const summaryFile = join(options.output, 'supply-chain-summary.md')
      writeFileSync(summaryFile, summaryContent)
      
      console.log(`📄 Summary report: ${summaryFile}`)
      console.log('')

      // Determine final status
      if (scanResult.status === 'failed') {
        console.log('❌ Supply chain monitoring failed!')
        console.log('   Critical or high-severity vulnerabilities detected.')
        console.log('   Update dependencies immediately to resolve security issues.')
        process.exit(1)
      } else if (scanResult.status === 'warning') {
        console.log('⚠️  Supply chain monitoring completed with warnings')
        console.log('   Some vulnerabilities detected. Review and update as needed.')
      } else {
        console.log('✅ Supply chain monitoring completed successfully!')
        console.log('   No critical vulnerabilities detected.')
      }

    } catch (error) {
      console.error('❌ Error monitoring supply chain:', error instanceof Error ? error.message : 'Unknown error')
      process.exit(1)
    }
  })

/**
 * Generate markdown summary report
 */
function generateSummaryReport(options: any, scanResult: any, licenseReport: any, severity: string): string {
  const timestamp = new Date().toISOString()
  
  return `# Supply Chain Security Report

Generated: ${timestamp}

## Configuration
- **Project Path**: ${options.path}
- **Output Directory**: ${options.output}
- **Severity Threshold**: ${severity}
- **Fail on Threshold**: ${options.failOnThreshold}
- **Include Dev Dependencies**: ${options.includeDev}
- **Check Licenses**: ${options.checkLicenses}

## Vulnerability Scan Results
- **Status**: ${scanResult.status.toUpperCase()}
- **Summary**: ${scanResult.summary}

### Statistics
${Object.entries(scanResult.details || {}).map(([key, value]) => `- **${key}**: ${value}`).join('\n')}

### Vulnerabilities by Severity
${scanResult.vulnerabilities ? scanResult.vulnerabilities.reduce((acc: string, vuln: any) => {
  return acc + `- **${vuln.severity}**: ${vuln.id} in ${vuln.affected?.join(', ') || 'unknown'}\n`
}, '') : 'No vulnerabilities detected.'}

## License Compliance
- **Status**: ${licenseReport ? (licenseReport.compliant ? 'COMPLIANT' : 'ISSUES FOUND') : 'NOT CHECKED'}
${licenseReport && licenseReport.issues.length > 0 ? `
### License Issues
${licenseReport.issues.map((issue: any) => `- **${issue.package}**: ${issue.license} - ${issue.issue}`).join('\n')}
` : ''}

## Security Benefits
1. **Vulnerability Detection**: Automated scanning for known security issues
2. **Dependency Monitoring**: Track all third-party dependencies for risks
3. **License Compliance**: Ensure legal compliance with open source licenses
4. **Risk Assessment**: Prioritize vulnerabilities by severity and impact

## Recommendations
${scanResult.recommendations ? scanResult.recommendations.map((rec: string) => `- ${rec}`).join('\n') : 'No specific recommendations.'}

## Next Steps
1. Review and address any critical or high-severity vulnerabilities
2. Update dependencies to secure versions
3. Review license compliance issues
4. Implement automated dependency updates where safe
5. Set up regular supply chain monitoring

## Integration
- Add this scan to your CI/CD pipeline
- Configure alerts for new vulnerabilities
- Integrate with dependency update tools
- Monitor trends over time for security posture

---
*Generated by Agency Platform Security Package*
`
}

// Parse command line arguments
program.parse()

// Export for use in other scripts
export { generateSummaryReport }
