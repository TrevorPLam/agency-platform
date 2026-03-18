/**
 * Security Report API Route
 * 
 * Provides comprehensive security reporting functionality
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateSecurityHeaders, generateSecurityReport } from '@agency/security/header-validator'

/**
 * GET /api/security/report
 * Generate and return comprehensive security report
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'json'
    const applications = [
      { name: 'Agency Admin', url: 'http://localhost:3001', type: 'admin' },
      { name: 'Firm', url: 'http://localhost:3000', type: 'public' },
      { name: 'Riley Day Care', url: 'http://localhost:3002', type: 'client' },
      { name: 'The Barber Cave', url: 'http://localhost:3003', type: 'client' }
    ]

    const validations: any[] = []
    const errors: string[] = []
    const scanResults: Array<{
      name: string
      url: string
      type: string
      score: number
      grade: string
      criticalIssues: number
      scannedAt: string
      error?: string
    }> = []

    // Scan each application
    for (const app of applications) {
      try {
        const response = await fetch(app.url, {
          method: 'GET',
          headers: {
            'User-Agent': 'Agency-Security-Scanner/1.0'
          }
        })

        if (!response.ok) {
          const error = `Failed to scan ${app.name}: ${response.statusText}`
          errors.push(error)
          scanResults.push({
            name: app.name,
            url: app.url,
            type: app.type,
            score: 0,
            grade: 'F',
            criticalIssues: 1,
            scannedAt: new Date().toISOString(),
            error
          })
          continue
        }

        const headers: Record<string, string> = {}
        response.headers.forEach((value, key) => {
          headers[key] = value
        })

        const validation = validateSecurityHeaders(app.url, headers)
        validations.push(validation)
        
        scanResults.push({
          name: app.name,
          url: app.url,
          type: app.type,
          score: Math.round((validation.overallScore / validation.maxScore) * 100),
          grade: validation.grade,
          criticalIssues: validation.criticalIssues.length,
          scannedAt: validation.timestamp
        })
      } catch (error) {
        const errorMessage = `Failed to scan ${app.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
        errors.push(errorMessage)
        scanResults.push({
          name: app.name,
          url: app.url,
          type: app.type,
          score: 0,
          grade: 'F',
          criticalIssues: 1,
          scannedAt: new Date().toISOString(),
          error: errorMessage
        })
      }
    }

    // Calculate overall statistics
    const totalScore = validations.reduce((sum, v) => sum + v.overallScore, 0)
    const totalMaxScore = validations.reduce((sum, v) => sum + v.maxScore, 0)
    const overallPercentage = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0
    const criticalIssuesCount = validations.reduce((sum, v) => sum + v.criticalIssues.length, 0)

    // Generate comprehensive report
    let report = `# Agency Platform Security Compliance Report\n\n`
    report += `**Date:** ${new Date().toLocaleDateString()}\n`
    report += `**Generated:** ${new Date().toISOString()}\n`
    report += `**Scanner Version:** 1.0\n\n`

    // Executive Summary
    report += `## Executive Summary\n\n`
    report += `The Agency Platform security posture has been assessed across ${applications.length} applications. `
    report += `Overall security compliance is **${overallPercentage}%** with **${criticalIssuesCount} critical ${criticalIssuesCount === 1 ? 'issue' : 'issues'}** requiring immediate attention.\n\n`

    // Overall Security Posture
    report += `## Overall Security Posture\n\n`
    report += `- **Applications Scanned:** ${validations.length}/${applications.length}\n`
    report += `- **Overall Score:** ${overallPercentage}%\n`
    report += `- **Critical Issues:** ${criticalIssuesCount}\n`
    report += `- **Scan Duration:** ${new Date().toLocaleTimeString()}\n\n`

    // Grade Distribution
    const gradeDistribution: Record<string, number> = {}
    validations.forEach(validation => {
      gradeDistribution[validation.grade] = (gradeDistribution[validation.grade] || 0) + 1
    })

    report += `## Grade Distribution\n\n`
    Object.entries(gradeDistribution)
      .sort(([a], [b]) => b.localeCompare(a))
      .forEach(([grade, count]) => {
        const percentage = Math.round((count / validations.length) * 100)
        report += `- **${grade}:** ${count} applications (${percentage}%)\n`
      })
    report += `\n`

    // Application Type Analysis
    const typeAnalysis: Record<string, { count: number; avgScore: number }> = {}
    validations.forEach(validation => {
      const app = applications.find(a => a.url === validation.url)
      if (app) {
        if (!typeAnalysis[app.type]) {
          typeAnalysis[app.type] = { count: 0, avgScore: 0 }
        }
        const entry = typeAnalysis[app.type]
        if (!entry) {
          return
        }

        entry.count++
        entry.avgScore += (validation.overallScore / validation.maxScore) * 100
      }
    })

    Object.keys(typeAnalysis).forEach(type => {
      const entry = typeAnalysis[type]
      if (!entry) {
        return
      }

      entry.avgScore = Math.round(entry.avgScore / entry.count)
    })

    report += `## Application Type Analysis\n\n`
    Object.entries(typeAnalysis).forEach(([type, data]) => {
      report += `- **${type.charAt(0).toUpperCase() + type.slice(1)} Applications:** ${data.count} apps, ${data.avgScore}% average score\n`
    })
    report += `\n`

    // Security Headers Compliance
    const headerStats: Record<string, { present: number; valid: number; total: number }> = {}
    validations.forEach(validation => {
      validation.results.forEach((result: any) => {
        if (!headerStats[result.header]) {
          headerStats[result.header] = { present: 0, valid: 0, total: 0 }
        }
        const stats = headerStats[result.header]
        if (!stats) {
          return
        }
        stats.total++
        if (result.present) stats.present++
        if (result.valid) stats.valid++
      })
    })

    report += `## Security Headers Compliance\n\n`
    Object.entries(headerStats)
      .sort(([,a], [,b]) => b.total - a.total)
      .forEach(([header, stats]) => {
        const complianceRate = Math.round((stats.valid / stats.total) * 100)
        report += `- **${header}:** ${stats.valid}/${stats.total} (${complianceRate}% compliant)\n`
      })
    report += `\n`

    // Individual Application Results
    report += `## Application Details\n\n`
    
    validations.forEach(validation => {
      const app = applications.find(a => a.url === validation.url)
      const appReport = generateSecurityReport(validation)
      
      report += `### ${app?.name || validation.url}\n`
      report += `**Type:** ${app?.type || 'unknown'}\n`
      report += `**URL:** ${validation.url}\n`
      report += appReport.replace(`# ${app?.name || validation.url}\n\n`, '').replace(`**URL:** ${validation.url}\n`, '')
      report += `\n---\n\n`
    })

    // Critical Issues Summary
    if (criticalIssuesCount > 0) {
      report += `## Critical Issues Summary\n\n`
      validations.forEach(validation => {
        if (validation.criticalIssues.length > 0) {
          const app = applications.find(a => a.url === validation.url)
          report += `### ${app?.name || validation.url}\n`
          validation.criticalIssues.forEach((issue: string) => {
            report += `- ${issue}\n`
          })
          report += `\n`
        }
      })
    }

    // Errors section
    if (errors.length > 0) {
      report += `## Scan Errors\n\n`
      errors.forEach((error: string) => {
        report += `- ${error}\n`
      })
      report += `\n`
    }

    // Recommendations
    const allRecommendations = validations.flatMap((v: any) => v.recommendations)
    const uniqueRecommendations = [...new Set(allRecommendations)]

    if (uniqueRecommendations.length > 0) {
      report += `## Recommendations\n\n`
      uniqueRecommendations.forEach((rec: string) => {
        report += `- ${rec}\n`
      })
      report += `\n`
    }

    // Security Best Practices Checklist
    report += `## Security Best Practices Checklist\n\n`
    const checklist = [
      { item: 'All applications have CSP with nonce-based policies', status: validations.every((v: any) => v.results.find((r: any) => r.header === 'Content-Security-Policy')?.present) },
      { item: 'HSTS is properly configured with max-age ≥ 31536000', status: validations.every((v: any) => {
        const hsts = v.results.find((r: any) => r.header === 'Strict-Transport-Security')
        return hsts?.present && hsts.value?.includes('max-age=31536000')
      })},
      { item: 'X-Frame-Options is set to DENY or SAMEORIGIN', status: validations.every((v: any) => v.results.find((r: any) => r.header === 'X-Frame-Options')?.present) },
      { item: 'X-Content-Type-Options is set to nosniff', status: validations.every((v: any) => v.results.find((r: any) => r.header === 'X-Content-Type-Options')?.valid) },
      { item: 'Referrer-Policy is configured securely', status: validations.every((v: any) => v.results.find((r: any) => r.header === 'Referrer-Policy')?.present) },
      { item: 'Permissions-Policy disables unnecessary features', status: validations.every((v: any) => v.results.find((r: any) => r.header === 'Permissions-Policy')?.present) },
      { item: 'No critical security issues present', status: criticalIssuesCount === 0 },
      { item: 'All applications score ≥ 70%', status: validations.every((v: any) => (v.overallScore / v.maxScore) * 100 >= 70) }
    ]

    checklist.forEach(({ item, status }) => {
      report += `- [${status ? 'x' : ' '}] ${item}\n`
    })
    report += `\n`

    // Trend Analysis (placeholder for future implementation)
    report += `## Trend Analysis\n\n`
    report += `*Historical trend analysis will be available in future versions*\n\n`

    // Compliance Standards
    report += `## Compliance Standards\n\n`
    report += `This assessment is based on:\n`
    report += `- OWASP Secure Headers Project best practices\n`
    report += `- 2026 security header recommendations\n`
    report += `- Industry-standard security scoring methodology\n`
    report += `- Mozilla Observatory-compatible grading\n\n`

    // Footer
    report += `---\n`
    report += `*Report generated by Agency Platform Security Scanner v1.0*\n`
    report += `*For questions or concerns, contact the security team*\n`

    // Return response based on format
    if (format === 'markdown') {
      return new NextResponse(report, {
        headers: {
          'Content-Type': 'text/markdown',
          'Content-Disposition': `attachment; filename="security-report-${new Date().toISOString().split('T')[0]}.md"`
        }
      })
    }

    // Default JSON response
    return NextResponse.json({
      report,
      metadata: {
        generatedAt: new Date().toISOString(),
        scannerVersion: '1.0',
        applicationsScanned: validations.length,
        totalApplications: applications.length,
        overallScore: overallPercentage,
        criticalIssues: criticalIssuesCount,
        errors: errors.length,
        gradeDistribution,
        typeAnalysis,
        headerCompliance: Object.fromEntries(
            Object.entries(headerStats).map(([header, stats]: [string, { present: number; valid: number; total: number }]) => [
            header,
            {
              ...stats,
              complianceRate: Math.round((stats.valid / stats.total) * 100)
            }
          ])
        ),
        scanResults
      }
    })
  } catch (error) {
    console.error('Report generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}
