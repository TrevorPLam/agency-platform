/**
 * Security Score Calculation System
 * 
 * Provides comprehensive security scoring based on headers, CSP, and overall
 * security posture. Implements 2026 security scoring best practices.
 */

import { SecurityHeaderValidation, validateSecurityHeaders } from './header-validator'
import { CSPValidation, validateCSP } from './csp-validator'

export interface SecurityScoreBreakdown {
  category: string
  score: number
  maxScore: number
  weight: number
  weightedScore: number
  issues: string[]
  recommendations: string[]
}

export interface SecurityScoreReport {
  url: string
  timestamp: string
  overallScore: number
  maxScore: number
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F'
  breakdown: SecurityScoreBreakdown[]
  criticalIssues: string[]
  recommendations: string[]
  trends: SecurityTrend[]
  compliance: SecurityCompliance
}

export interface SecurityTrend {
  date: string
  score: number
  grade: string
  changes: string[]
}

export interface SecurityCompliance {
  owaspCompliant: boolean
  industryStandard: boolean
  enterpriseReady: boolean
  hipaaCompliant: boolean
  gdprCompliant: boolean
  soc2Compliant: boolean
}

export interface SecurityScoringConfig {
  weights: {
    headers: number
    csp: number
    bestPractices: number
    advanced: number
  }
  thresholds: {
    excellent: number
    good: number
    acceptable: number
    poor: number
  }
  requirements: {
    minimumScore: number
    criticalIssueLimit: number
    requiredHeaders: string[]
  }
}

/**
 * Default security scoring configuration
 */
export const DEFAULT_SECURITY_SCORING_CONFIG: SecurityScoringConfig = {
  weights: {
    headers: 0.3,      // 30% - Basic security headers
    csp: 0.4,         // 40% - Content Security Policy
    bestPractices: 0.2, // 20% - Security best practices
    advanced: 0.1      // 10% - Advanced security features
  },
  thresholds: {
    excellent: 90,
    good: 80,
    acceptable: 70,
    poor: 60
  },
  requirements: {
    minimumScore: 70,
    criticalIssueLimit: 0,
    requiredHeaders: [
      'Content-Security-Policy',
      'X-Frame-Options',
      'X-Content-Type-Options',
      'Referrer-Policy',
      'Permissions-Policy'
    ]
  }
}

/**
 * Calculate security grade based on score
 */
export function calculateSecurityGrade(score: number, maxScore: number): SecurityScoreReport['grade'] {
  const percentage = (score / maxScore) * 100
  
  if (percentage >= 95) return 'A+'
  if (percentage >= 90) return 'A'
  if (percentage >= 80) return 'B'
  if (percentage >= 70) return 'C'
  if (percentage >= 60) return 'D'
  return 'F'
}

/**
 * Validate security best practices
 */
export function validateSecurityBestPractices(headers: Record<string, string>): SecurityScoreBreakdown {
  const issues: string[] = []
  const recommendations: string[] = []
  let score = 0
  const maxScore = 100

  // Check for server information disclosure
  const serverHeader = headers['server']
  if (serverHeader) {
    if (serverHeader.includes('Apache') || serverHeader.includes('nginx') || serverHeader.includes('IIS')) {
      issues.push('Server header exposes server software version')
      score -= 10
    }
  } else {
    score += 20
    recommendations.push('Server header is hidden (good practice)')
  }

  // Check for X-Powered-By header
  const poweredBy = headers['x-powered-by']
  if (poweredBy) {
    issues.push('X-Powered-By header exposes technology stack')
    score -= 10
  } else {
    score += 10
  }

  // Check for cache control on sensitive pages
  const cacheControl = headers['cache-control']
  if (cacheControl) {
    if (cacheControl.includes('no-store') || cacheControl.includes('no-cache')) {
      score += 15
      recommendations.push('Cache control headers prevent sensitive data caching')
    } else {
      issues.push('Cache control may allow sensitive data to be cached')
      score -= 5
    }
  } else {
    issues.push('Cache-Control header missing')
    score -= 10
  }

  // Check for security-related cookies
  const setCookie = headers['set-cookie']
  if (setCookie) {
    if (setCookie.includes('Secure') && setCookie.includes('HttpOnly')) {
      score += 20
      recommendations.push('Cookies have Secure and HttpOnly flags')
    } else {
      issues.push('Cookies missing security flags (Secure, HttpOnly)')
      score -= 15
    }
  } else {
    score += 10 // No cookies is neutral
  }

  // Check for CORS security
  const corsOrigin = headers['access-control-allow-origin']
  if (corsOrigin) {
    if (corsOrigin === '*' || corsOrigin.includes('null')) {
      issues.push('CORS allows any origin - potential security risk')
      score -= 15
    } else {
      score += 15
      recommendations.push('CORS properly restricted to specific origins')
    }
  }

  // Add remaining points for good practices
  score = Math.max(0, Math.min(maxScore, score + 20))

  return {
    category: 'Security Best Practices',
    score,
    maxScore,
    weight: 0.2,
    weightedScore: score * 0.2,
    issues,
    recommendations
  }
}

/**
 * Validate advanced security features
 */
export function validateAdvancedSecurity(headers: Record<string, string>): SecurityScoreBreakdown {
  const issues: string[] = []
  const recommendations: string[] = []
  let score = 0
  const maxScore = 100

  // Check for advanced CSP features
  const csp = headers['content-security-policy']
  if (csp) {
    // Check for strict-dynamic
    if (csp.includes('strict-dynamic')) {
      score += 25
      recommendations.push('CSP uses strict-dynamic for enhanced security')
    }

    // Check for report-uri or report-to
    if (csp.includes('report-uri') || csp.includes('report-to')) {
      score += 20
      recommendations.push('CSP includes violation reporting')
    } else {
      issues.push('CSP missing violation reporting')
      score -= 10
    }

    // Check for upgrade-insecure-requests
    if (csp.includes('upgrade-insecure-requests')) {
      score += 15
      recommendations.push('CSP upgrades insecure requests')
    }
  }

  // Check for advanced CORS features
  const corsCredentials = headers['access-control-allow-credentials']
  const corsMethods = headers['access-control-allow-methods']
  const corsHeaders = headers['access-control-allow-headers']

  if (corsCredentials && corsMethods && corsHeaders) {
    score += 20
    recommendations.push('CORS properly configured with credentials and methods')
  }

  // Check for feature policy / permissions policy
  const permissionsPolicy = headers['permissions-policy']
  if (permissionsPolicy) {
    // Check for privacy-sensitive permissions
    const privacyPermissions = ['camera=()', 'microphone=()', 'geolocation=()']
    const hasPrivacyControls = privacyPermissions.every(perm => permissionsPolicy.includes(perm))
    
    if (hasPrivacyControls) {
      score += 20
      recommendations.push('Permissions-Policy controls privacy-sensitive features')
    } else {
      issues.push('Permissions-Policy should control privacy-sensitive features')
      score -= 10
    }
  }

  score = Math.max(0, Math.min(maxScore, score))

  return {
    category: 'Advanced Security Features',
    score,
    maxScore,
    weight: 0.1,
    weightedScore: score * 0.1,
    issues,
    recommendations
  }
}

/**
 * Calculate comprehensive security score
 */
export function calculateSecurityScore(
  url: string,
  headers: Record<string, string>,
  config: SecurityScoringConfig = DEFAULT_SECURITY_SCORING_CONFIG
): SecurityScoreReport {
  const breakdown: SecurityScoreBreakdown[] = []
  const allCriticalIssues: string[] = []
  const allRecommendations: string[] = []

  // 1. Security Headers Score (30%)
  const headerValidation = validateSecurityHeaders(url, headers)
  const headerScore: SecurityScoreBreakdown = {
    category: 'Security Headers',
    score: headerValidation.overallScore,
    maxScore: headerValidation.maxScore,
    weight: config.weights.headers,
    weightedScore: headerValidation.overallScore * config.weights.headers,
    issues: headerValidation.criticalIssues,
    recommendations: headerValidation.recommendations
  }
  breakdown.push(headerScore)
  allCriticalIssues.push(...headerValidation.criticalIssues)
  allRecommendations.push(...headerValidation.recommendations)

  // 2. CSP Score (40%)
  const cspHeader = headers['content-security-policy']
  let cspScore: SecurityScoreBreakdown
  if (cspHeader) {
    const cspValidation = validateCSP(cspHeader)
    cspScore = {
      category: 'Content Security Policy',
      score: cspValidation.overallScore,
      maxScore: cspValidation.maxScore,
      weight: config.weights.csp,
      weightedScore: cspValidation.overallScore * config.weights.csp,
      issues: cspValidation.criticalIssues,
      recommendations: cspValidation.recommendations
    }
    allCriticalIssues.push(...cspValidation.criticalIssues)
    allRecommendations.push(...cspValidation.recommendations)
  } else {
    cspScore = {
      category: 'Content Security Policy',
      score: 0,
      maxScore: 100,
      weight: config.weights.csp,
      weightedScore: 0,
      issues: ['CSP header is missing'],
      recommendations: ['Implement Content Security Policy']
    }
    allCriticalIssues.push('CSP header is missing')
  }
  breakdown.push(cspScore)

  // 3. Security Best Practices Score (20%)
  const bestPracticesScore = validateSecurityBestPractices(headers)
  breakdown.push(bestPracticesScore)
  allCriticalIssues.push(...bestPracticesScore.issues)
  allRecommendations.push(...bestPracticesScore.recommendations)

  // 4. Advanced Security Features Score (10%)
  const advancedScore = validateAdvancedSecurity(headers)
  breakdown.push(advancedScore)
  allCriticalIssues.push(...advancedScore.issues)
  allRecommendations.push(...advancedScore.recommendations)

  // Calculate overall score
  const overallScore = breakdown.reduce((sum, item) => sum + item.weightedScore, 0)
  const maxScore = 100
  const grade = calculateSecurityGrade(overallScore, maxScore)

  // Determine compliance
  const compliance = determineSecurityCompliance(overallScore, maxScore, allCriticalIssues, headerValidation, cspHeader)

  return {
    url,
    timestamp: new Date().toISOString(),
    overallScore,
    maxScore,
    grade,
    breakdown,
    criticalIssues: allCriticalIssues,
    recommendations: allRecommendations,
    trends: [], // Would be populated with historical data
    compliance
  }
}

/**
 * Determine security compliance status
 */
export function determineSecurityCompliance(
  overallScore: number,
  maxScore: number,
  criticalIssues: string[],
  headerValidation: SecurityHeaderValidation,
  cspHeader?: string
): SecurityCompliance {
  const percentage = (overallScore / maxScore) * 100
  const hasCriticalIssues = criticalIssues.length > 0
  const hasRequiredHeaders = headerValidation.results
    .filter(r => DEFAULT_SECURITY_SCORING_CONFIG.requirements.requiredHeaders.includes(r.header))
    .every(r => r.present)

  return {
    owaspCompliant: percentage >= 80 && !hasCriticalIssues && hasRequiredHeaders,
    industryStandard: percentage >= 70 && criticalIssues.length <= 2,
    enterpriseReady: percentage >= 85 && !hasCriticalIssues,
    hipaaCompliant: percentage >= 90 && cspHeader && !cspHeader.includes('unsafe-inline'),
    gdprCompliant: percentage >= 75 && hasRequiredHeaders,
    soc2Compliant: percentage >= 85 && !hasCriticalIssues && cspHeader !== undefined
  }
}

/**
 * Generate security score report
 */
export function generateSecurityScoreReport(report: SecurityScoreReport): string {
  const { url, overallScore, maxScore, grade, breakdown, criticalIssues, recommendations, compliance } = report
  const percentage = Math.round((overallScore / maxScore) * 100)
  
  let output = `# Security Score Report\n\n`
  output += `**URL:** ${url}\n`
  output += `**Date:** ${new Date().toLocaleDateString()}\n`
  output += `**Overall Score:** ${overallScore}/${maxScore} (${percentage}%)\n`
  output += `**Grade:** ${grade}\n\n`

  // Compliance status
  output += `## 🛡️ Compliance Status\n\n`
  output += `- **OWASP Compliant:** ${compliance.owaspCompliant ? 'Yes ✅' : 'No ❌'}\n`
  output += `- **Industry Standard:** ${compliance.industryStandard ? 'Yes ✅' : 'No ❌'}\n`
  output += `- **Enterprise Ready:** ${compliance.enterpriseReady ? 'Yes ✅' : 'No ❌'}\n`
  output += `- **HIPAA Compliant:** ${compliance.hipaaCompliant ? 'Yes ✅' : 'No ❌'}\n`
  output += `- **GDPR Compliant:** ${compliance.gdprCompliant ? 'Yes ✅' : 'No ❌'}\n`
  output += `- **SOC 2 Compliant:** ${compliance.soc2Compliant ? 'Yes ✅' : 'No ❌'}\n\n`

  // Score breakdown
  output += `## 📊 Score Breakdown\n\n`
  breakdown.forEach(item => {
    const itemPercentage = Math.round((item.score / item.maxScore) * 100)
    const weightedPercentage = Math.round((item.weightedScore / 100) * 100)
    output += `### ${item.category}\n`
    output += `- **Score:** ${item.score}/${item.maxScore} (${itemPercentage}%)\n`
    output += `- **Weight:** ${(item.weight * 100)}%\n`
    output += `- **Weighted Score:** ${Math.round(item.weightedScore)} (${weightedPercentage}%)\n`
    
    if (item.issues.length > 0) {
      output += `- **Issues:** ${item.issues.length}\n`
    }
    
    output += `\n`
  })

  // Critical issues
  if (criticalIssues.length > 0) {
    output += `## 🚨 Critical Issues\n\n`
    criticalIssues.forEach(issue => {
      output += `- ${issue}\n`
    })
    output += `\n`
  }

  // Recommendations
  if (recommendations.length > 0) {
    output += `## 💡 Recommendations\n\n`
    recommendations.forEach(rec => {
      output += `- ${rec}\n`
    })
    output += `\n`
  }

  return output
}

/**
 * Compare security scores over time
 */
export function compareSecurityScores(current: SecurityScoreReport, previous: SecurityScoreReport): SecurityTrend {
  const scoreChange = current.overallScore - previous.overallScore
  const gradeChanged = current.grade !== previous.grade
  
  const changes: string[] = []
  
  if (scoreChange > 0) {
    changes.push(`Score improved by +${scoreChange} points`)
  } else if (scoreChange < 0) {
    changes.push(`Score decreased by ${scoreChange} points`)
  }
  
  if (gradeChanged) {
    changes.push(`Grade changed from ${previous.grade} to ${current.grade}`)
  }
  
  // Compare critical issues
  const currentIssues = current.criticalIssues.length
  const previousIssues = previous.criticalIssues.length
  
  if (currentIssues < previousIssues) {
    changes.push(`Critical issues reduced from ${previousIssues} to ${currentIssues}`)
  } else if (currentIssues > previousIssues) {
    changes.push(`Critical issues increased from ${previousIssues} to ${currentIssues}`)
  }
  
  return {
    date: current.timestamp,
    score: current.overallScore,
    grade: current.grade,
    changes
  }
}
