/**
 * Content Security Policy (CSP) Validation Utilities
 * 
 * Provides comprehensive CSP validation and compliance checking
 * based on OWASP and 2026 security best practices
 */

export interface CSPDirective {
  name: string
  values: string[]
  issues: string[]
  score: number
  maxScore: number
}

export interface CSPValidation {
  cspHeader: string
  directives: CSPDirective[]
  overallScore: number
  maxScore: number
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F'
  criticalIssues: string[]
  recommendations: string[]
  nonceBased: boolean
  strictDynamic: boolean
  reportUri: string | null
  reportOnly: boolean
}

export interface CSPDirectiveConfig {
  required: boolean
  recommendedValues: string[]
  forbiddenValues: string[]
  scoreWeight: number
  validation: (values: string[]) => string[]
}

/**
 * CSP directive configurations based on OWASP best practices
 */
export const CSP_DIRECTIVE_CONFIGS: Record<string, CSPDirectiveConfig> = {
  'default-src': {
    required: true,
    recommendedValues: ["'self'"],
    forbiddenValues: ["'unsafe-inline'", "'unsafe-eval'", "*"],
    scoreWeight: 20,
    validation: (values: string[]) => {
      const issues: string[] = []
      
      if (values.length === 0) {
        issues.push('default-src directive is empty')
        return issues
      }

      if (!values.includes("'self'") && !values.includes("'none'")) {
        issues.push('default-src should include \'self\' or be set to \'none\'')
      }

      if (values.includes("*")) {
        issues.push('default-src should not use wildcard (*)')
      }

      if (values.includes("'unsafe-inline'")) {
        issues.push('default-src should not include unsafe-inline')
      }

      if (values.includes("'unsafe-eval'")) {
        issues.push('default-src should not include unsafe-eval')
      }

      return issues
    }
  },

  'script-src': {
    required: true,
    recommendedValues: ["'self'"],
    forbiddenValues: ["'unsafe-inline'", "'unsafe-eval'"],
    scoreWeight: 25,
    validation: (values: string[]) => {
      const issues: string[] = []
      
      if (values.length === 0) {
        issues.push('script-src directive is empty')
        return issues
      }

      // Check for nonce-based CSP
      const hasNonce = values.some(value => value.startsWith('nonce-'))
      const hasHash = values.some(value => value.startsWith('sha256-') || value.startsWith('sha384-') || value.startsWith('sha512-'))
      
      if (!hasNonce && !hasHash && !values.includes("'unsafe-inline'")) {
        issues.push('script-src should use nonce or hash-based CSP for dynamic scripts')
      }

      if (values.includes("'unsafe-inline'")) {
        issues.push('script-src should not use unsafe-inline (use nonce or hash instead)')
      }

      if (values.includes("'unsafe-eval'")) {
        issues.push('script-src should not include unsafe-eval')
      }

      if (values.includes("*")) {
        issues.push('script-src should not use wildcard (*)')
      }

      // Check for strict-dynamic
      if (hasHash && !values.includes("'strict-dynamic'")) {
        issues.push('script-src with hashes should include strict-dynamic')
      }

      return issues
    }
  },

  'style-src': {
    required: true,
    recommendedValues: ["'self'"],
    forbiddenValues: ["'unsafe-inline'"],
    scoreWeight: 15,
    validation: (values: string[]) => {
      const issues: string[] = []
      
      if (values.length === 0) {
        issues.push('style-src directive is empty')
        return issues
      }

      const hasNonce = values.some(value => value.startsWith('nonce-'))
      const hasHash = values.some(value => value.startsWith('sha256-') || value.startsWith('sha384-') || value.startsWith('sha512-'))
      
      if (!hasNonce && !hasHash && !values.includes("'unsafe-inline'")) {
        issues.push('style-src should use nonce, hash, or unsafe-inline for dynamic styles')
      }

      // Note: unsafe-inline is more acceptable for style-src with nonce/hash fallback
      if (values.includes("'unsafe-inline'") && !hasNonce && !hasHash) {
        issues.push('style-src unsafe-inline should be paired with nonce or hash')
      }

      if (values.includes("*")) {
        issues.push('style-src should not use wildcard (*)')
      }

      return issues
    }
  },

  'img-src': {
    required: true,
    recommendedValues: ["'self'", "data:", "blob:"],
    forbiddenValues: ["*"],
    scoreWeight: 10,
    validation: (values: string[]) => {
      const issues: string[] = []
      
      if (values.length === 0) {
        issues.push('img-src directive is empty')
        return issues
      }

      if (!values.includes("'self'")) {
        issues.push('img-src should include \'self\'')
      }

      if (values.includes("*") && values.length > 1) {
        issues.push('img-src wildcard should not be combined with other sources')
      }

      return issues
    }
  },

  'connect-src': {
    required: true,
    recommendedValues: ["'self'"],
    forbiddenValues: ["*"],
    scoreWeight: 10,
    validation: (values: string[]) => {
      const issues: string[] = []
      
      if (values.length === 0) {
        issues.push('connect-src directive is empty')
        return issues
      }

      if (!values.includes("'self'")) {
        issues.push('connect-src should include \'self\'')
      }

      // Check for analytics domains
      const analyticsDomains = ['*.posthog.com', '*.google-analytics.com', '*.googletagmanager.com']
      const hasAnalytics = analyticsDomains.some(domain => 
        values.some(value => value.includes(domain))
      )
      
      if (!hasAnalytics) {
        issues.push('connect-src should include analytics domains if analytics are used')
      }

      return issues
    }
  },

  'font-src': {
    required: true,
    recommendedValues: ["'self'"],
    forbiddenValues: ["*"],
    scoreWeight: 5,
    validation: (values: string[]) => {
      const issues: string[] = []
      
      if (values.length === 0) {
        issues.push('font-src directive is empty')
        return issues
      }

      if (!values.includes("'self'")) {
        issues.push('font-src should include \'self\'')
      }

      return issues
    }
  },

  'frame-ancestors': {
    required: true,
    recommendedValues: ["'none'"],
    forbiddenValues: ["*"],
    scoreWeight: 10,
    validation: (values: string[]) => {
      const issues: string[] = []
      
      if (values.length === 0) {
        issues.push('frame-ancestors directive is empty')
        return issues
      }

      if (!values.includes("'none'")) {
        issues.push('frame-ancestors should be set to \'none\' to prevent clickjacking')
      }

      if (values.includes("*")) {
        issues.push('frame-ancestors should not use wildcard (*)')
      }

      return issues
    }
  },

  'base-uri': {
    required: true,
    recommendedValues: ["'self'"],
    forbiddenValues: ["*"],
    scoreWeight: 5,
    validation: (values: string[]) => {
      const issues: string[] = []
      
      if (values.length === 0) {
        issues.push('base-uri directive is missing')
        return issues
      }

      if (!values.includes("'self'")) {
        issues.push('base-uri should include \'self\'')
      }

      return issues
    }
  },

  'form-action': {
    required: true,
    recommendedValues: ["'self'"],
    forbiddenValues: ["*"],
    scoreWeight: 5,
    validation: (values: string[]) => {
      const issues: string[] = []
      
      if (values.length === 0) {
        issues.push('form-action directive is missing')
        return issues
      }

      if (!values.includes("'self'")) {
        issues.push('form-action should include \'self\'')
      }

      return issues
    }
  },

  'upgrade-insecure-requests': {
    required: false,
    recommendedValues: [],
    forbiddenValues: [],
    scoreWeight: 5,
    validation: (values: string[]) => {
      const issues: string[] = []
      
      // This is a boolean directive, presence is what matters
      if (values.length > 0) {
        issues.push('upgrade-insecure-requests should be a standalone directive')
      }

      return issues
    }
  },

  'report-uri': {
    required: false,
    recommendedValues: [],
    forbiddenValues: [],
    scoreWeight: 5,
    validation: (values: string[]) => {
      const issues: string[] = []
      
      if (values.length === 0) {
        issues.push('Consider adding report-uri for CSP violation monitoring')
      } else {
        // Validate report URI format
        values.forEach(uri => {
          if (!uri.startsWith('/') && !uri.startsWith('http')) {
            issues.push('report-uri should be a valid absolute or relative URL')
          }
        })
      }

      return issues
    }
  }
}

/**
 * Parse CSP header into directives
 */
export function parseCSPHeader(cspHeader: string): Record<string, string[]> {
  const directives: Record<string, string[]> = {}
  
  if (!cspHeader) {
    return directives
  }

  const parts = cspHeader.split(';')
  
  for (const part of parts) {
    const trimmed = part.trim()
    if (!trimmed) continue
    
    const [name, ...values] = trimmed.split(/\s+/)
    if (name && values.length > 0) {
      directives[name] = values
    } else if (name) {
      // Boolean directive (like upgrade-insecure-requests)
      directives[name] = []
    }
  }

  return directives
}

/**
 * Calculate CSP grade based on score percentage
 */
export function calculateCSPGrade(score: number, maxScore: number): CSPValidation['grade'] {
  const percentage = (score / maxScore) * 100
  
  if (percentage >= 95) return 'A+'
  if (percentage >= 90) return 'A'
  if (percentage >= 80) return 'B'
  if (percentage >= 70) return 'C'
  if (percentage >= 60) return 'D'
  return 'F'
}

/**
 * Validate CSP header comprehensively
 */
export function validateCSP(cspHeader: string, isReportOnly = false): CSPValidation {
  const directives = parseCSPHeader(cspHeader)
  const results: CSPDirective[] = []
  let totalScore = 0
  let totalMaxScore = 0
  const criticalIssues: string[] = []
  const recommendations: string[] = []

  // Check if CSP uses nonce-based policy
  const nonceBased = Object.values(directives).some(values =>
    values.some(value => value.startsWith('nonce-'))
  )

  // Check for strict-dynamic
  const strictDynamic = Object.values(directives).some(values =>
    values.includes("'strict-dynamic'")
  )

  // Find report-uri
  const reportUri = directives['report-uri']?.[0] || directives['report-to']?.[0] || null

  Object.entries(CSP_DIRECTIVE_CONFIGS).forEach(([directiveName, config]) => {
    const directiveValues = directives[directiveName] || []
    const issues = config.validation(directiveValues)
    
    // Calculate score for this directive
    let directiveScore = 0
    if (directiveValues.length > 0 && issues.length === 0) {
      directiveScore = config.scoreWeight
    } else if (directiveValues.length > 0) {
      // Partial score based on issues
      const criticalIssueCount = issues.filter(issue => 
        issue.includes('missing') || 
        issue.includes('unsafe') || 
        issue.includes('wildcard') ||
        issue.includes('empty')
      ).length
      directiveScore = Math.max(0, config.scoreWeight - (criticalIssueCount * 3))
    } else if (config.required) {
      directiveScore = 0
    }

    results.push({
      name: directiveName,
      values: directiveValues,
      issues,
      score: directiveScore,
      maxScore: config.scoreWeight
    })

    totalScore += directiveScore
    totalMaxScore += config.scoreWeight

    // Collect issues
    if (config.required && directiveValues.length === 0) {
      criticalIssues.push(`${directiveName} directive is required but missing`)
    }
    
    issues.forEach(issue => {
      if (issue.includes('unsafe') || issue.includes('wildcard') || issue.includes('missing')) {
        criticalIssues.push(issue)
      } else {
        recommendations.push(issue)
      }
    })
  })

  const overallScore = totalScore
  const grade = calculateCSPGrade(overallScore, totalMaxScore)

  return {
    cspHeader,
    directives: results,
    overallScore,
    maxScore: totalMaxScore,
    grade,
    criticalIssues,
    recommendations,
    nonceBased,
    strictDynamic,
    reportUri,
    reportOnly: isReportOnly
  }
}

/**
 * Generate CSP validation report
 */
export function generateCSPReport(validation: CSPValidation): string {
  const { cspHeader, overallScore, maxScore, grade, criticalIssues, recommendations, nonceBased } = validation
  
  const percentage = Math.round((overallScore / maxScore) * 100)
  
  let report = `# Content Security Policy Validation Report\n\n`
  report += `**CSP Header:** \`${cspHeader}\`\n`
  report += `**Date:** ${new Date().toLocaleDateString()}\n`
  report += `**Overall Score:** ${overallScore}/${maxScore} (${percentage}%)\n`
  report += `**Grade:** ${grade}\n`
  report += `**Nonce-based:** ${nonceBased ? 'Yes ✅' : 'No ⚠️'}\n`
  report += `**Strict Dynamic:** ${validation.strictDynamic ? 'Yes ✅' : 'No ⚠️'}\n`
  report += `**Report URI:** ${validation.reportUri || 'Not configured ⚠️'}\n\n`

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

  report += `## 📊 Directive Details\n\n`
  validation.directives.forEach(directive => {
    const status = directive.issues.length === 0 ? '✅' : directive.values.length > 0 ? '⚠️' : '❌'
    report += `### ${status} ${directive.name}\n`
    
    if (directive.values.length > 0) {
      report += `- **Values:** \`${directive.values.join(' ')}\`\n`
    } else {
      report += `- **Values:** Not specified\n`
    }
    
    report += `- **Score:** ${directive.score}/${directive.maxScore}\n`
    
    if (directive.issues.length > 0) {
      report += `- **Issues:**\n`
      directive.issues.forEach(issue => {
        report += `  - ${issue}\n`
      })
    }
    report += `\n`
  })

  return report
}

/**
 * Check if CSP meets minimum security requirements
 */
export function meetsMinimumCSPRequirements(validation: CSPValidation): boolean {
  return (
    validation.grade !== 'F' &&
    validation.criticalIssues.length === 0 &&
    validation.overallScore >= validation.maxScore * 0.7 && // At least 70%
    validation.nonceBased // Should use nonce-based policy
  )
}
