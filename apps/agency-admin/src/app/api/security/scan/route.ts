/**
 * Security Scan API Route
 * 
 * Provides endpoints for scanning security headers and generating reports
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateSecurityHeaders, generateSecurityReport } from '@agency/security/header-validator'
import { validateCSP, generateCSPReport } from '@agency/security/csp-validator'

interface ScanRequest {
  url: string
}

interface SecurityScanResult {
  url: string
  timestamp: string
  overallScore: number
  maxScore: number
  grade: string
  headers: Record<string, any>
  criticalIssues: string[]
  recommendations: string[]
}

/**
 * POST /api/security/scan
 * Scan security headers for a given URL
 */
export async function POST(request: NextRequest) {
  try {
    const body: ScanRequest = await request.json()
    const { url } = body

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // Fetch the URL to get headers
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Agency-Security-Scanner/1.0'
      }
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL: ${response.statusText}` },
        { status: 400 }
      )
    }

    // Extract headers
    const headers: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      headers[key] = value
    })

    // Validate security headers
    const validation = validateSecurityHeaders(url, headers)
    
    // Format response for frontend
    const scanResult: SecurityScanResult = {
      url: validation.url,
      timestamp: validation.timestamp,
      overallScore: validation.overallScore,
      maxScore: validation.maxScore,
      grade: validation.grade,
      headers: validation.results.reduce((acc, result) => {
        acc[result.header] = {
          present: result.present,
          value: result.value,
          valid: result.valid,
          score: result.score,
          maxScore: result.maxScore,
          issues: result.issues
        }
        return acc
      }, {} as Record<string, any>),
      criticalIssues: validation.criticalIssues,
      recommendations: validation.recommendations
    }

    return NextResponse.json(scanResult)
  } catch (error) {
    console.error('Security scan error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/security/report
 * Generate comprehensive security report for all applications
 */
export async function GET() {
  try {
    const applications = [
      { name: 'Agency Admin', url: 'http://localhost:3001' },
      { name: 'Firm', url: 'http://localhost:3000' },
      { name: 'Riley Day Care', url: 'http://localhost:3002' },
      { name: 'The Barber Cave', url: 'http://localhost:3003' }
    ]

    const validations: any[] = []
    const errors: string[] = []

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
          errors.push(`Failed to scan ${app.name}: ${response.statusText}`)
          continue
        }

        const headers: Record<string, string> = {}
        response.headers.forEach((value, key) => {
          headers[key] = value
        })

        const validation = validateSecurityHeaders(app.url, headers)
        validations.push(validation)
      } catch (error) {
        errors.push(`Failed to scan ${app.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // Generate comprehensive report
    let report = `# Agency Platform Security Compliance Report\n\n`
    report += `**Date:** ${new Date().toLocaleDateString()}\n`
    report += `**Generated:** ${new Date().toISOString()}\n\n`

    // Overall statistics
    const totalScore = validations.reduce((sum, v) => sum + v.overallScore, 0)
    const totalMaxScore = validations.reduce((sum, v) => sum + v.maxScore, 0)
    const overallPercentage = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0

    report += `## Overall Security Posture\n\n`
    report += `- **Applications Scanned:** ${validations.length}/${applications.length}\n`
    report += `- **Overall Score:** ${overallPercentage}%\n`
    report += `- **Critical Issues:** ${validations.reduce((sum, v) => sum + v.criticalIssues.length, 0)}\n\n`

    // Grade distribution
    const gradeDistribution: Record<string, number> = {}
    validations.forEach(validation => {
      gradeDistribution[validation.grade] = (gradeDistribution[validation.grade] || 0) + 1
    })

    report += `## Grade Distribution\n\n`
    Object.entries(gradeDistribution)
      .sort(([a], [b]) => b.localeCompare(a))
      .forEach(([grade, count]) => {
        report += `- **${grade}:** ${count} application${count !== 1 ? 's' : ''}\n`
      })
    report += `\n`

    // Individual application results
    report += `## Application Details\n\n`
    
    validations.forEach(validation => {
      const appReport = generateSecurityReport(validation)
      report += appReport
      report += `\n---\n\n`
    })

    // Errors section
    if (errors.length > 0) {
      report += `## Scan Errors\n\n`
      errors.forEach(error => {
        report += `- ${error}\n`
      })
      report += `\n`
    }

    // Recommendations summary
    const allRecommendations = validations.flatMap(v => v.recommendations)
    const uniqueRecommendations = [...new Set(allRecommendations)]

    if (uniqueRecommendations.length > 0) {
      report += `## Summary Recommendations\n\n`
      uniqueRecommendations.forEach(rec => {
        report += `- ${rec}\n`
      })
      report += `\n`
    }

    // Security best practices checklist
    report += `## Security Best Practices Checklist\n\n`
    report += `- [ ] All applications have CSP with nonce-based policies\n`
    report += `- [ ] HSTS is properly configured with max-age ≥ 31536000\n`
    report += `- [ ] X-Frame-Options is set to DENY or SAMEORIGIN\n`
    report += `- [ ] X-Content-Type-Options is set to nosniff\n`
    report += `- [ ] Referrer-Policy is configured securely\n`
    report += `- [ ] Permissions-Policy disables unnecessary features\n`
    report += `- [ ] No critical security issues present\n`
    report += `- [ ] All applications score ≥ 70%\n\n`

    report += `---\n`
    report += `*Report generated by Agency Platform Security Scanner*\n`

    return NextResponse.json({
      report,
      metadata: {
        generatedAt: new Date().toISOString(),
        applicationsScanned: validations.length,
        totalApplications: applications.length,
        overallScore: overallPercentage,
        criticalIssues: validations.reduce((sum, v) => sum + v.criticalIssues.length, 0),
        errors: errors.length
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
