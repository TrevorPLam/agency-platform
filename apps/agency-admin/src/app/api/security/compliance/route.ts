import { NextRequest, NextResponse } from 'next/server'
import { validateSecurityHeaders, generateSecurityReport, meetsMinimumRequirements } from '@agency/security'
import { validateCSP, generateCSPReport, meetsMinimumCSPRequirements } from '@agency/security'

export async function GET(request: NextRequest) {
  try {
    const applications = [
      { name: 'Agency Admin', url: 'http://localhost:3001', port: 3001 },
      { name: 'Firm', url: 'http://localhost:3000', port: 3000 },
      { name: 'Riley Day Care', url: 'http://localhost:3002', port: 3002 },
      { name: 'The Barber Cave', url: 'http://localhost:3003', port: 3003 }
    ]

    const complianceResults: any[] = []

    for (const app of applications) {
      try {
        // Fetch security headers from the application
        const response = await fetch(app.url, { 
          method: 'GET',
          headers: { 'User-Agent': 'Security-Compliance-Checker/1.0' }
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch ${app.name}: ${response.status}`)
        }

        const headers: Record<string, string> = {}
        response.headers.forEach((value, key) => {
          headers[key] = value
        })

        // Validate security headers
        const securityValidation = validateSecurityHeaders(app.url, headers)
        const securityReport = generateSecurityReport(securityValidation)

        // Validate CSP if present
        let cspValidation = null
        let cspReport = null
        const cspHeader = headers['content-security-policy']
        
        if (cspHeader) {
          cspValidation = validateCSP(cspHeader)
          cspReport = generateCSPReport(cspValidation)
        }

        const appResult = {
          name: app.name,
          url: app.url,
          port: app.port,
          timestamp: new Date().toISOString(),
          security: {
            validation: securityValidation,
            report: securityReport,
            meetsMinimums: meetsMinimumRequirements(securityValidation),
            score: Math.round((securityValidation.overallScore / securityValidation.maxScore) * 100),
            grade: securityValidation.grade,
            criticalIssues: securityValidation.criticalIssues,
            recommendations: securityValidation.recommendations
          },
          csp: cspValidation ? {
            validation: cspValidation,
            report: cspReport,
            meetsMinimums: meetsMinimumCSPRequirements(cspValidation),
            score: Math.round((cspValidation.overallScore / cspValidation.maxScore) * 100),
            grade: cspValidation.grade,
            criticalIssues: cspValidation.criticalIssues,
            recommendations: cspValidation.recommendations,
            nonceBased: cspValidation.nonceBased,
            strictDynamic: cspValidation.strictDynamic,
            reportUri: cspValidation.reportUri
          } : null,
          headers: {
            'content-security-policy': cspHeader || null,
            'strict-transport-security': headers['strict-transport-security'] || null,
            'x-frame-options': headers['x-frame-options'] || null,
            'x-content-type-options': headers['x-content-type-options'] || null,
            'referrer-policy': headers['referrer-policy'] || null,
            'permissions-policy': headers['permissions-policy'] || null,
            'cross-origin-resource-policy': headers['cross-origin-resource-policy'] || null,
            'cross-origin-embedder-policy': headers['cross-origin-embedder-policy'] || null
          }
        }

        complianceResults.push(appResult)
      } catch (error) {
        console.error(`Failed to check compliance for ${app.name}:`, error)
        
        complianceResults.push({
          name: app.name,
          url: app.url,
          port: app.port,
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error',
          security: null,
          csp: null,
          headers: null
        })
      }
    }

    // Calculate overall compliance metrics
    const successfulChecks = complianceResults.filter(r => !r.error)
    const overallSecurityScore = successfulChecks.length > 0 
      ? Math.round(successfulChecks.reduce((sum, r) => sum + (r.security?.score || 0), 0) / successfulChecks.length)
      : 0

    const overallCSPScore = successfulChecks.filter(r => r.csp).length > 0
      ? Math.round(successfulChecks.filter(r => r.csp).reduce((sum, r) => sum + (r.csp?.score || 0), 0) / successfulChecks.filter(r => r.csp).length)
      : 0

    const appsWithCriticalIssues = successfulChecks.filter(r => 
      (r.security?.criticalIssues?.length || 0) > 0 || (r.csp?.criticalIssues?.length || 0) > 0
    )

    const compliance = {
      timestamp: new Date().toISOString(),
      summary: {
        totalApplications: applications.length,
        successfulChecks: successfulChecks.length,
        failedChecks: complianceResults.length - successfulChecks.length,
        overallSecurityScore,
        overallCSPScore,
        appsWithCriticalIssues: appsWithCriticalIssues.length,
        complianceGrade: calculateComplianceGrade(overallSecurityScore, overallCSPScore, appsWithCriticalIssues.length)
      },
      applications: complianceResults,
      recommendations: generateComplianceRecommendations(complianceResults)
    }

    return NextResponse.json(compliance)

  } catch (error) {
    console.error('Security compliance check failed:', error)
    return NextResponse.json(
      {
        type: 'https://agency.dev/problems/security-compliance-failed',
        title: 'Security compliance check failed',
        status: 500,
        detail: 'Failed to perform security compliance check',
        instance: '/api/security/compliance',
        code: 'SECURITY_COMPLIANCE_FAILED',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

function calculateComplianceGrade(securityScore: number, cspScore: number, criticalIssuesCount: number): string {
  if (criticalIssuesCount > 0) return 'F'
  if (securityScore >= 95 && cspScore >= 95) return 'A+'
  if (securityScore >= 90 && cspScore >= 90) return 'A'
  if (securityScore >= 80 && cspScore >= 80) return 'B'
  if (securityScore >= 70 && cspScore >= 70) return 'C'
  if (securityScore >= 60 && cspScore >= 60) return 'D'
  return 'F'
}

function generateComplianceRecommendations(results: any[]): string[] {
  const recommendations: string[] = []
  
  // Check for common issues across applications
  const appsMissingCSP = results.filter(r => !r.error && !r.csp)
  if (appsMissingCSP.length > 0) {
    recommendations.push(`${appsMissingCSP.length} application(s) missing Content Security Policy`)
  }

  const appsWithCriticalSecurityIssues = results.filter(r => !r.error && r.security?.criticalIssues?.length > 0)
  if (appsWithCriticalSecurityIssues.length > 0) {
    recommendations.push(`${appsWithCriticalSecurityIssues.length} application(s) have critical security issues`)
  }

  const appsWithCriticalCSPIssues = results.filter(r => !r.error && r.csp?.criticalIssues?.length > 0)
  if (appsWithCriticalCSPIssues.length > 0) {
    recommendations.push(`${appsWithCriticalCSPIssues.length} application(s) have critical CSP issues`)
  }

  const appsWithLowSecurityScore = results.filter(r => !r.error && r.security?.score < 80)
  if (appsWithLowSecurityScore.length > 0) {
    recommendations.push(`${appsWithLowSecurityScore.length} application(s) have security score below 80%`)
  }

  const appsWithLowCSPScore = results.filter(r => !r.error && r.csp && r.csp.score < 80)
  if (appsWithLowCSPScore.length > 0) {
    recommendations.push(`${appsWithLowCSPScore.length} application(s) have CSP score below 80%`)
  }

  // Check for missing headers
  const appsMissingHSTS = results.filter(r => !r.error && !r.headers?.['strict-transport-security'])
  if (appsMissingHSTS.length > 0) {
    recommendations.push(`Consider adding HSTS to ${appsMissingHSTS.length} application(s)`)
  }

  const appsMissingXFrameOptions = results.filter(r => !r.error && !r.headers?.['x-frame-options'])
  if (appsMissingXFrameOptions.length > 0) {
    recommendations.push(`Add X-Frame-Options to ${appsMissingXFrameOptions.length} application(s)`)
  }

  return recommendations
}
