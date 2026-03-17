/**
 * Security Header Validation Utilities
 * 
 * Provides comprehensive validation of HTTP security headers based on
 * OWASP Secure Headers Project best practices (2026)
 */

export interface SecurityHeaderResult {
  header: string
  present: boolean
  value?: string
  valid: boolean
  issues: string[]
  score: number
  maxScore: number
}

export interface SecurityHeaderValidation {
  url: string
  timestamp: string
  results: SecurityHeaderResult[]
  overallScore: number
  maxScore: number
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F'
  criticalIssues: string[]
  recommendations: string[]
}

export interface SecurityHeaderConfig {
  enabled: boolean
  required: boolean
  expectedValue?: string
  validationRegex?: RegExp
  scoreWeight: number
  issues: (value?: string) => string[]
}

/**
 * OWASP-recommended security headers configuration
 */
export const SECURITY_HEADERS_CONFIG: Record<string, SecurityHeaderConfig> = {
  'Content-Security-Policy': {
    enabled: true,
    required: true,
    scoreWeight: 25,
    issues: (value?: string) => {
      const issues: string[] = []
      if (!value) {
        issues.push('CSP header is missing')
        return issues
      }
      
      // Check for unsafe-inline
      if (value.includes("'unsafe-inline'")) {
        issues.push('CSP contains unsafe-inline - vulnerable to XSS')
      }
      
      // Check for unsafe-eval
      if (value.includes("'unsafe-eval'")) {
        issues.push('CSP contains unsafe-eval - vulnerable to code injection')
      }
      
      // Check for nonce-based CSP
      if (!value.includes('nonce-')) {
        issues.push('CSP should use nonce-based policy for dynamic content')
      }
      
      // Check for missing directives
      const requiredDirectives = ['default-src', 'script-src', 'style-src']
      requiredDirectives.forEach(directive => {
        if (!value.includes(directive)) {
          issues.push(`CSP missing ${directive} directive`)
        }
      })
      
      return issues
    }
  },
  
  'Strict-Transport-Security': {
    enabled: true,
    required: true,
    expectedValue: /max-age=\d+/,
    scoreWeight: 15,
    issues: (value?: string) => {
      const issues: string[] = []
      if (!value) {
        issues.push('HSTS header is missing')
        return issues
      }
      
      // Check max-age
      const maxAgeMatch = value.match(/max-age=(\d+)/)
      if (!maxAgeMatch) {
        issues.push('HSTS missing max-age directive')
      } else {
        const maxAge = parseInt(maxAgeMatch[1])
        if (maxAge < 31536000) { // Less than 1 year
          issues.push('HSTS max-age should be at least 1 year (31536000 seconds)')
        }
      }
      
      // Check for includeSubDomains
      if (!value.includes('includeSubDomains')) {
        issues.push('HSTS should include includeSubDomains for comprehensive protection')
      }
      
      // Check for preload
      if (!value.includes('preload')) {
        issues.push('Consider adding preload for browser inclusion in HSTS preload list')
      }
      
      return issues
    }
  },
  
  'X-Frame-Options': {
    enabled: true,
    required: true,
    expectedValue: /(DENY|SAMEORIGIN)/,
    scoreWeight: 10,
    issues: (value?: string) => {
      const issues: string[] = []
      if (!value) {
        issues.push('X-Frame-Options header is missing')
        return issues
      }
      
      if (!['DENY', 'SAMEORIGIN'].includes(value)) {
        issues.push('X-Frame-Options should be set to DENY or SAMEORIGIN')
      }
      
      if (value === 'ALLOW-FROM') {
        issues.push('X-Frame-Options ALLOW-FROM is deprecated, use CSP frame-ancestors instead')
      }
      
      return issues
    }
  },
  
  'X-Content-Type-Options': {
    enabled: true,
    required: true,
    expectedValue: 'nosniff',
    scoreWeight: 10,
    issues: (value?: string) => {
      const issues: string[] = []
      if (!value) {
        issues.push('X-Content-Type-Options header is missing')
        return issues
      }
      
      if (value !== 'nosniff') {
        issues.push('X-Content-Type-Options should be set to nosniff')
      }
      
      return issues
    }
  },
  
  'Referrer-Policy': {
    enabled: true,
    required: true,
    scoreWeight: 10,
    issues: (value?: string) => {
      const issues: string[] = []
      if (!value) {
        issues.push('Referrer-Policy header is missing')
        return issues
      }
      
      const validPolicies = [
        'no-referrer',
        'no-referrer-when-downgrade',
        'origin',
        'origin-when-cross-origin',
        'same-origin',
        'strict-origin',
        'strict-origin-when-cross-origin',
        'unsafe-url'
      ]
      
      if (!validPolicies.includes(value)) {
        issues.push('Invalid Referrer-Policy value')
      }
      
      if (value === 'unsafe-url') {
        issues.push('Referrer-Policy unsafe-url may expose sensitive information')
      }
      
      return issues
    }
  },
  
  'Permissions-Policy': {
    enabled: true,
    required: true,
    scoreWeight: 10,
    issues: (value?: string) => {
      const issues: string[] = []
      if (!value) {
        issues.push('Permissions-Policy header is missing')
        return issues
      }
      
      // Check for privacy-sensitive permissions
      const privacySensitive = ['camera', 'microphone', 'geolocation']
      privacySensitive.forEach(permission => {
        if (!value.includes(`${permission}=()`)) {
          issues.push(`Permissions-Policy should disable ${permission} by default`)
        }
      })
      
      // Check for interest-cohort (FLoC)
      if (!value.includes('interest-cohort=()')) {
        issues.push('Permissions-Policy should disable interest-cohort for privacy')
      }
      
      return issues
    }
  },
  
  'X-XSS-Protection': {
    enabled: false, // Deprecated in modern browsers
    required: false,
    scoreWeight: 0,
    issues: () => []
  },
  
  'Cross-Origin-Embedder-Policy': {
    enabled: false, // Optional for basic security
    required: false,
    scoreWeight: 5,
    issues: (value?: string) => {
      const issues: string[] = []
      if (!value) {
        issues.push('Consider adding Cross-Origin-Embedder-Policy for additional security')
        return issues
      }
      
      return issues
    }
  },
  
  'Cross-Origin-Resource-Policy': {
    enabled: false, // Optional for basic security
    required: false,
    scoreWeight: 5,
    issues: (value?: string) => {
      const issues: string[] = []
      if (!value) {
        issues.push('Consider adding Cross-Origin-Resource-Policy for additional security')
        return issues
      }
      
      return issues
    }
  }
}

/**
 * Calculate security grade based on score percentage
 */
export function calculateSecurityGrade(score: number, maxScore: number): SecurityHeaderValidation['grade'] {
  const percentage = (score / maxScore) * 100
  
  if (percentage >= 95) return 'A+'
  if (percentage >= 90) return 'A'
  if (percentage >= 80) return 'B'
  if (percentage >= 70) return 'C'
  if (percentage >= 60) return 'D'
  return 'F'
}

/**
 * Validate security headers from response headers
 */
export function validateSecurityHeaders(
  url: string, 
  headers: Record<string, string>
): SecurityHeaderValidation {
  const results: SecurityHeaderResult[] = []
  let totalScore = 0
  let totalMaxScore = 0
  const criticalIssues: string[] = []
  const recommendations: string[] = []

  Object.entries(SECURITY_HEADERS_CONFIG).forEach(([header, config]) => {
    if (!config.enabled) return

    const headerValue = headers[header.toLowerCase()]
    const present = !!headerValue
    const issues = config.issues(headerValue)
    
    // Calculate score for this header
    let headerScore = 0
    if (present && issues.length === 0) {
      headerScore = config.scoreWeight
    } else if (present) {
      // Partial score based on issue severity
      const criticalIssueCount = issues.filter(issue => 
        issue.includes('missing') || issue.includes('unsafe')
      ).length
      headerScore = Math.max(0, config.scoreWeight - (criticalIssueCount * 5))
    }

    results.push({
      header,
      present,
      value: headerValue,
      valid: present && issues.length === 0,
      issues,
      score: headerScore,
      maxScore: config.scoreWeight
    })

    totalScore += headerScore
    totalMaxScore += config.scoreWeight

    // Collect critical issues and recommendations
    if (config.required && !present) {
      criticalIssues.push(`${header} is required but missing`)
    }
    
    issues.forEach(issue => {
      if (issue.includes('unsafe') || issue.includes('missing')) {
        criticalIssues.push(issue)
      } else {
        recommendations.push(issue)
      }
    })
  })

  const overallScore = totalScore
  const grade = calculateSecurityGrade(overallScore, totalMaxScore)

  return {
    url,
    timestamp: new Date().toISOString(),
    results,
    overallScore,
    maxScore: totalMaxScore,
    grade,
    criticalIssues,
    recommendations
  }
}

/**
 * Generate security compliance report
 */
export function generateSecurityReport(validation: SecurityHeaderValidation): string {
  const { url, overallScore, maxScore, grade, criticalIssues, recommendations } = validation
  
  const percentage = Math.round((overallScore / maxScore) * 100)
  
  let report = `# Security Header Compliance Report\n\n`
  report += `**URL:** ${url}\n`
  report += `**Date:** ${new Date().toLocaleDateString()}\n`
  report += `**Overall Score:** ${overallScore}/${maxScore} (${percentage}%)\n`
  report += `**Grade:** ${grade}\n\n`

  if (criticalIssues.length > 0) {
    report += `## 🚨 Critical Issues\n\n`
    criticalIssues.forEach(issue => {
      report += `- ${issue}\n`
    })
    report += `\n`
  }

  if (recommendations.length > 0) {
    report += `## 💡 Recommendations\n\n`
    recommendations.forEach(rec => {
      report += `- ${rec}\n`
    })
    report += `\n`
  }

  report += `## 📊 Header Details\n\n`
  validation.results.forEach(result => {
    const status = result.valid ? '✅' : result.present ? '⚠️' : '❌'
    report += `### ${status} ${result.header}\n`
    report += `- **Present:** ${result.present ? 'Yes' : 'No'}\n`
    if (result.value) {
      report += `- **Value:** \`${result.value}\`\n`
    }
    report += `- **Score:** ${result.score}/${result.maxScore}\n`
    
    if (result.issues.length > 0) {
      report += `- **Issues:**\n`
      result.issues.forEach(issue => {
        report += `  - ${issue}\n`
      })
    }
    report += `\n`
  }

  return report
}

/**
 * Check if security compliance meets minimum requirements
 */
export function meetsMinimumRequirements(validation: SecurityHeaderValidation): boolean {
  return (
    validation.grade !== 'F' &&
    validation.criticalIssues.length === 0 &&
    validation.overallScore >= validation.maxScore * 0.7 // At least 70%
  )
}
