import { NextRequest, NextResponse } from 'next/server'
import { validateSecurityHeaders, generateSecurityReport } from '@agency/security'
import { validateCSP, generateCSPReport } from '@agency/security'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const application = searchParams.get('app') || 'all'

    const applications = application === 'all' ? [
      { name: 'Agency Admin', url: 'http://localhost:3001', port: 3001 },
      { name: 'Firm', url: 'http://localhost:3000', port: 3000 },
      { name: 'Riley Day Care', url: 'http://localhost:3002', port: 3002 },
      { name: 'The Barber Cave', url: 'http://localhost:3003', port: 3003 }
    ] : [
      { name: application, url: `http://localhost:${getApplicationPort(application)}`, port: getApplicationPort(application) }
    ]

    const scores: any[] = []

    for (const app of applications) {
      try {
        const response = await fetch(app.url, {
          method: 'GET',
          headers: { 'User-Agent': 'Security-Score-Checker/1.0' }
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch ${app.name}: ${response.status}`)
        }

        const headers: Record<string, string> = {}
        response.headers.forEach((value, key) => {
          headers[key] = value
        })

        // Calculate security score
        const securityValidation = validateSecurityHeaders(app.url, headers)
        const securityScore = Math.round((securityValidation.overallScore / securityValidation.maxScore) * 100)

        // Calculate CSP score if present
        let cspScore = null
        const cspHeader = headers['content-security-policy']

        if (cspHeader) {
          const cspValidation = validateCSP(cspHeader)
          cspScore = Math.round((cspValidation.overallScore / cspValidation.maxScore) * 100)
        }

        // Calculate individual header scores
        const headerScores = calculateHeaderScores(headers)

        const appScore = {
          name: app.name,
          url: app.url,
          timestamp: new Date().toISOString(),
          overallScore: calculateOverallScore(securityScore, cspScore, headerScores),
          securityScore,
          cspScore,
          headerScores,
          grade: calculateGrade(calculateOverallScore(securityScore, cspScore, headerScores)),
          criticalIssues: [
            ...securityValidation.criticalIssues,
            ...(cspHeader ? validateCSP(cspHeader).criticalIssues : [])
          ]
        }

        scores.push(appScore)
      } catch (error) {
        console.error(`Failed to score ${app.name}:`, error)
        scores.push({
          name: app.name,
          url: app.url,
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error',
          overallScore: 0,
          securityScore: 0,
          cspScore: 0,
          headerScores: {},
          grade: 'F',
          criticalIssues: ['Failed to analyze security headers']
        })
      }
    }

    // Calculate trends if historical data is available (simplified for now)
    const trends = calculateTrends(scores)

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      application: application,
      scores,
      trends,
      summary: {
        totalApplications: scores.length,
        averageScore: Math.round(scores.reduce((sum, s) => sum + s.overallScore, 0) / scores.length),
        highestScore: Math.max(...scores.map(s => s.overallScore)),
        lowestScore: Math.min(...scores.map(s => s.overallScore)),
        applicationsWithCriticalIssues: scores.filter(s => s.criticalIssues.length > 0).length
      }
    })

  } catch (error) {
    console.error('Security score calculation failed:', error)
    return NextResponse.json(
      {
        type: 'https://agency.dev/problems/security-score-failed',
        title: 'Security score calculation failed',
        status: 500,
        detail: 'Failed to calculate security scores',
        instance: '/api/security/score',
        code: 'SECURITY_SCORE_FAILED',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

function getApplicationPort(appName: string): number {
  const ports: Record<string, number> = {
    'agency-admin': 3001,
    'firm': 3000,
    'riley-day-care': 3002,
    'the-barber-cave': 3003
  }
  return ports[appName] || 3000
}

function calculateHeaderScores(headers: Record<string, string>): Record<string, number> {
  const scores: Record<string, number> = {}

  // CSP score (25 points max)
  const cspHeader = headers['content-security-policy']
  if (cspHeader) {
    const cspValidation = validateCSP(cspHeader)
    scores.csp = Math.round((cspValidation.overallScore / cspValidation.maxScore) * 25)
  } else {
    scores.csp = 0
  }

  // HSTS score (15 points max)
  const hstsHeader = headers['strict-transport-security']
  if (hstsHeader) {
    let score = 15
    if (!hstsHeader.includes('max-age=')) score -= 10
    else {
      const maxAge = parseInt(hstsHeader.match(/max-age=(\d+)/)?.[1] || '0')
      if (maxAge < 31536000) score -= 5 // Less than 1 year
    }
    if (!hstsHeader.includes('includeSubDomains')) score -= 3
    if (!hstsHeader.includes('preload')) score -= 2
    scores.hsts = Math.max(0, score)
  } else {
    scores.hsts = 0
  }

  // X-Frame-Options score (10 points max)
  const xFrameOptions = headers['x-frame-options']
  if (xFrameOptions === 'DENY') {
    scores.xFrameOptions = 10
  } else if (xFrameOptions === 'SAMEORIGIN') {
    scores.xFrameOptions = 7
  } else {
    scores.xFrameOptions = 0
  }

  // X-Content-Type-Options score (10 points max)
  const xContentTypeOptions = headers['x-content-type-options']
  scores.xContentTypeOptions = xContentTypeOptions === 'nosniff' ? 10 : 0

  // Referrer-Policy score (10 points max)
  const referrerPolicy = headers['referrer-policy']
  const goodPolicies = ['no-referrer', 'no-referrer-when-downgrade', 'strict-origin', 'strict-origin-when-cross-origin']
  if (goodPolicies.includes(referrerPolicy)) {
    scores.referrerPolicy = 10
  } else if (referrerPolicy === 'origin' || referrerPolicy === 'origin-when-cross-origin') {
    scores.referrerPolicy = 7
  } else if (referrerPolicy === 'unsafe-url') {
    scores.referrerPolicy = 0
  } else {
    scores.referrerPolicy = 5
  }

  // Permissions-Policy score (10 points max)
  const permissionsPolicy = headers['permissions-policy']
  if (permissionsPolicy) {
    let score = 10
    const privacySensitive = ['camera', 'microphone', 'geolocation']
    privacySensitive.forEach(permission => {
      if (!permissionsPolicy.includes(`${permission}=()`)) {
        score -= 2
      }
    })
    if (!permissionsPolicy.includes('interest-cohort=()')) {
      score -= 2
    }
    scores.permissionsPolicy = Math.max(0, score)
  } else {
    scores.permissionsPolicy = 0
  }

  // Cross-Origin headers score (10 points each)
  scores.corp = headers['cross-origin-resource-policy'] ? 10 : 0
  scores.coep = headers['cross-origin-embedder-policy'] ? 10 : 0

  return scores
}

function calculateOverallScore(securityScore: number, cspScore: number | null, headerScores: Record<string, number>): number {
  // Weight the scores: CSP (25%), HSTS (15%), other headers (60%)
  const cspWeight = 0.25
  const hstsWeight = 0.15
  const otherWeight = 0.60

  const cspContribution = cspScore !== null ? cspScore * cspWeight : 0
  const hstsContribution = (headerScores.hsts || 0) / 15 * 100 * hstsWeight

  // Calculate other headers score (excluding CSP and HSTS which are already weighted)
  const otherHeaderScores = Object.entries(headerScores)
    .filter(([key]) => !['csp', 'hsts'].includes(key))
    .reduce((sum, [_, score]) => sum + score, 0)

  const maxOtherScore = Object.keys(headerScores)
    .filter(key => !['csp', 'hsts'].includes(key))
    .length * 10

  const otherContribution = maxOtherScore > 0 ? (otherHeaderScores / maxOtherScore) * 100 * otherWeight : 0

  return Math.round(cspContribution + hstsContribution + otherContribution)
}

function calculateGrade(score: number): string {
  if (score >= 95) return 'A+'
  if (score >= 90) return 'A'
  if (score >= 80) return 'B'
  if (score >= 70) return 'C'
  if (score >= 60) return 'D'
  return 'F'
}

function calculateTrends(scores: any[]): any {
  // Simplified trend calculation - in a real implementation, this would
  // compare with historical data from a database
  return {
    period: '7 days',
    trend: 'stable',
    change: 0,
    note: 'Trend analysis requires historical data storage'
  }
}
