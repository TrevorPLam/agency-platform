import { 
  SafetyCheck, 
  ComplianceReport, 
  GeneratedContent, 
  AIContentOpsConfig,
  AIContentOpsError
} from './types'

// ============================================================================
// Safety & Compliance Engine
// ============================================================================

export interface SafetyCheckResult {
  passed: boolean
  score: number
  detectedItems: string[]
  confidence: number
  explanation?: string
}

export class SafetyEngine {
  private config: AIContentOpsConfig

  constructor(config: AIContentOpsConfig) {
    this.config = config
  }

  /**
   * Run comprehensive safety checks on generated content
   */
  async runSafetyChecks(contentId: string, content: string): Promise<SafetyCheck[]> {
    const checks: SafetyCheck[] = []

    // PII Detection
    if (this.config.safety.enablePIIDetection) {
      const piiResult = await this.detectPII(content)
      checks.push({
        id: crypto.randomUUID(),
        contentId,
        type: 'pii_detection',
        status: piiResult.passed ? 'passed' : 'failed',
        score: piiResult.score,
        details: {
          detectedItems: piiResult.detectedItems,
          confidence: piiResult.confidence,
          explanation: piiResult.explanation
        },
        checkedAt: new Date().toISOString()
      })
    }

    // Toxicity Detection
    if (this.config.safety.enableToxicityCheck) {
      const toxicityResult = await this.detectToxicity(content)
      checks.push({
        id: crypto.randomUUID(),
        contentId,
        type: 'toxicity',
        status: toxicityResult.passed ? 'passed' : 'failed',
        score: toxicityResult.score,
        details: {
          detectedItems: toxicityResult.detectedItems,
          confidence: toxicityResult.confidence,
          explanation: toxicityResult.explanation
        },
        checkedAt: new Date().toISOString()
      })
    }

    // Bias Detection
    if (this.config.safety.enableBiasDetection) {
      const biasResult = await this.detectBias(content)
      checks.push({
        id: crypto.randomUUID(),
        contentId,
        type: 'bias',
        status: biasResult.passed ? 'passed' : 'warning',
        score: biasResult.score,
        details: {
          detectedItems: biasResult.detectedItems,
          confidence: biasResult.confidence,
          explanation: biasResult.explanation
        },
        checkedAt: new Date().toISOString()
      })
    }

    // Factual Accuracy Check
    const accuracyResult = await this.checkFactualAccuracy(content)
    checks.push({
      id: crypto.randomUUID(),
      contentId,
      type: 'factual_accuracy',
      status: accuracyResult.passed ? 'passed' : 'warning',
      score: accuracyResult.score,
      details: {
        detectedItems: accuracyResult.detectedItems,
        confidence: accuracyResult.confidence,
        explanation: accuracyResult.explanation
      },
      checkedAt: new Date().toISOString()
    })

    return checks
  }

  /**
   * Detect Personally Identifiable Information (PII)
   */
  private async detectPII(content: string): Promise<SafetyCheckResult> {
    const detectedItems: string[] = []
    let confidence = 0

    // Email addresses
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
    const emails = content.match(emailPattern) || []
    detectedItems.push(...emails.map(email => `Email: ${email}`))
    confidence += emails.length * 0.3

    // Phone numbers
    const phonePatterns = [
      /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, // US format
      /\b\+?1?[-.]?\(?[0-9]{3}\)?[-.]?[0-9]{3}[-.]?[0-9]{4}\b/g, // International
      /\b\d{2,4}[-.]?\d{2,4}[-.]?\d{4,6}\b/g // General
    ]

    phonePatterns.forEach(pattern => {
      const matches = content.match(pattern) || []
      detectedItems.push(...matches.map(phone => `Phone: ${phone}`))
      confidence += matches.length * 0.2
    })

    // Social Security Numbers
    const ssnPattern = /\b\d{3}-\d{2}-\d{4}\b/g
    const ssns = content.match(ssnPattern) || []
    detectedItems.push(...ssns.map(ssn => `SSN: ${ssn}`))
    confidence += ssns.length * 0.5

    // Credit card numbers
    const ccPattern = /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g
    const creditCards = content.match(ccPattern) || []
    detectedItems.push(...creditCards.map(cc => `Credit Card: ${cc}`))
    confidence += creditCards.length * 0.4

    // Addresses (simplified)
    const addressPattern = /\d+\s+([A-Z][a-z]*\s)+\b(street|st|avenue|ave|road|rd|lane|ln|drive|dr|court|ct|place|pl|boulevard|blvd)\b/gi
    const addresses = content.match(addressPattern) || []
    detectedItems.push(...addresses.map(addr => `Address: ${addr}`))
    confidence += addresses.length * 0.3

    // Names (simplified - look for capitalized words in context)
    const namePattern = /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g
    const names = content.match(namePattern) || []
    detectedItems.push(...names.slice(0, 5).map(name => `Potential Name: ${name}`))
    confidence += names.length * 0.1

    const threshold = this.config.safety.piiThreshold
    const passed = detectedItems.length === 0 || confidence < threshold

    return {
      passed,
      score: Math.max(0, 100 - (confidence * 100)),
      detectedItems,
      confidence: Math.min(1, confidence),
      explanation: detectedItems.length > 0 
        ? `Detected ${detectedItems.length} potential PII items` 
        : 'No PII detected'
    }
  }

  /**
   * Detect toxic content
   */
  private async detectToxicity(content: string): Promise<SafetyCheckResult> {
    const toxicWords = [
      'hate', 'kill', 'die', 'death', 'murder', 'violence', 'violent',
      'abuse', 'abusive', 'toxic', 'harmful', 'harm', 'hurt', 'damage',
      'destroy', 'attack', 'threat', 'threaten', 'bully', 'harass',
      'discriminat', 'racist', 'sexist', 'homophobic', 'xenophobic'
    ]

    const detectedItems: string[] = []
    const contentLower = content.toLowerCase()

    toxicWords.forEach(word => {
      const pattern = new RegExp(`\\b${word}\\w*\\b`, 'gi')
      const matches = content.match(pattern) || []
      detectedItems.push(...matches.map(match => `Toxic language: ${match}`))
    })

    // Check for aggressive language patterns
    const aggressivePatterns = [
      /\b(you\s+always|you\s+never|everyone\s+knows|no\s+one\s+cares)\b/gi,
      /\b(stupid|idiot|dumb|moron|retard|lame)\b/gi,
      /\b(shut\s+up|go\s+away|get\s+lost|drop\s+dead)\b/gi
    ]

    aggressivePatterns.forEach(pattern => {
      const matches = content.match(pattern) || []
      detectedItems.push(...matches.map(match => `Aggressive: ${match}`))
    })

    const threshold = this.config.safety.toxicityThreshold
    const toxicityScore = detectedItems.length / Math.max(content.split(/\s+/).length, 1) * 100
    const passed = toxicityScore < (threshold * 100)

    return {
      passed,
      score: Math.max(0, 100 - toxicityScore),
      detectedItems,
      confidence: Math.min(1, detectedItems.length * 0.2),
      explanation: detectedItems.length > 0 
        ? `Detected ${detectedItems.length} potentially toxic elements` 
        : 'No toxic content detected'
    }
  }

  /**
   * Detect biased content
   */
  private async detectBias(content: string): Promise<SafetyCheckResult> {
    const detectedItems: string[] = []
    const contentLower = content.toLowerCase()

    // Gender bias indicators
    const genderBiasPatterns = [
      /\b(men\s+are|women\s+are|girls\s+are|boys\s+are)\s+(better|worse|smarter|dumber|weaker|stronger)\b/gi,
      /\b(only\s+men|only\s+women|men\s+can't|women\s+can't)\b/gi,
      /\b(typical\s+(man|woman|girl|boy)|male\s+dominated|female\s+dominated)\b/gi
    ]

    genderBiasPatterns.forEach(pattern => {
      const matches = content.match(pattern) || []
      detectedItems.push(...matches.map(match => `Gender bias: ${match}`))
    })

    // Age bias indicators
    const ageBiasPatterns = [
      /\b(young\s+people\s+are|old\s+people\s+are|teenagers\s+are|seniors\s+are)\s+(lazy|inexperienced|out\w+touch|technophobic)\b/gi,
      /\b(dumb\s+teen|wise\s+old|fresh\s+young|senile\s+old)\b/gi
    ]

    ageBiasPatterns.forEach(pattern => {
      const matches = content.match(pattern) || []
      detectedItems.push(...matches.map(match => `Age bias: ${match}`))
    })

    // Racial/ethnic bias indicators
    const racialBiasPatterns = [
      /\b(all\s+(black|white|asian|hispanic|latino|indian)\s+people)\b/gi,
      /\b(typical\s+(black|white|asian|hispanic|latino|indian))\b/gi
    ]

    racialBiasPatterns.forEach(pattern => {
      const matches = content.match(pattern) || []
      detectedItems.push(...matches.map(match => `Racial bias: ${match}`))
    })

    const threshold = this.config.safety.biasThreshold
    const biasScore = detectedItems.length / Math.max(content.split(/\s+/).length, 1) * 100
    const passed = biasScore < (threshold * 100)

    return {
      passed,
      score: Math.max(0, 100 - biasScore),
      detectedItems,
      confidence: Math.min(1, detectedItems.length * 0.15),
      explanation: detectedItems.length > 0 
        ? `Detected ${detectedItems.length} potentially biased elements` 
        : 'No biased content detected'
    }
  }

  /**
   * Check factual accuracy (simplified implementation)
   */
  private async checkFactualAccuracy(content: string): Promise<SafetyCheckResult> {
    const detectedItems: string[] = []
    let confidence = 0

    // Check for obviously false claims (simplified)
    const falseClaims = [
      /\b(the\s+earth\s+is\s+flat|earth\s+is\s+flat)\b/gi,
      /\b(2\s*\+\s*2\s*=\s*5|two\s+plus\s+two\s+equals\s+five)\b/gi,
      /\b(humans\s+can\s+breathe\s+in\s+space|breathe\s+in\s+vacuum)\b/gi,
      /\b(moon\s+is\s+made\s+of\s+cheese|cheese\s+moon)\b/gi
    ]

    falseClaims.forEach(pattern => {
      const matches = content.match(pattern) || []
      detectedItems.push(...matches.map(match => `False claim: ${match}`))
      confidence += matches.length * 0.8
    })

    // Check for unsubstantiated superlatives
    const superlativePattern = /\b(best|worst|greatest|least|most|least)\s+(amazing|incredible|unbelievable|impossible|perfect|awful|terrible)\b/gi
    const superlatives = content.match(superlativePattern) || []
    detectedItems.push(...superlatives.map(s => `Unsubstantiated superlative: ${s}`))
    confidence += superlatives.length * 0.3

    // Check for vague statistics without sources
    const statsPattern = /\b(\d+%|\d+\s+percent|\d+\s+out\s+of\s+\d+|\d+\s+in\s+\d+)\s+(of\s+people|believe|think|say|agree)\b/gi
    const vagueStats = content.match(statsPattern) || []
    detectedItems.push(...vagueStats.map(stat => `Unsourced statistic: ${stat}`))
    confidence += vagueStats.length * 0.4

    const threshold = 0.7 // 70% confidence threshold for accuracy
    const passed = confidence < threshold

    return {
      passed,
      score: Math.max(0, 100 - (confidence * 100)),
      detectedItems,
      confidence: Math.min(1, confidence),
      explanation: detectedItems.length > 0 
        ? `Found ${detectedItems.length} potential accuracy issues` 
        : 'No obvious accuracy issues detected'
    }
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(
    contentId: string,
    checks: SafetyCheck[],
    framework: string = 'custom'
  ): Promise<ComplianceReport> {
    const failedChecks = checks.filter(check => check.status === 'failed')
    const warningChecks = checks.filter(check => check.status === 'warning')
    const passedChecks = checks.filter(check => check.status === 'passed')

    let status: ComplianceReport['status'] = 'compliant'
    const recommendations: string[] = []

    if (failedChecks.length > 0) {
      status = 'non_compliant'
      recommendations.push('Address all failed safety checks before publication')
    } else if (warningChecks.length > 0) {
      status = 'requires_review'
      recommendations.push('Review warning items and address if necessary')
    }

    // Add specific recommendations based on check types
    checks.forEach(check => {
      if (check.type === 'pii_detection' && check.status !== 'passed') {
        recommendations.push('Remove or redact all personally identifiable information')
      }
      if (check.type === 'toxicity' && check.status !== 'passed') {
        recommendations.push('Revise content to remove toxic or harmful language')
      }
      if (check.type === 'bias' && check.status !== 'passed') {
        recommendations.push('Review content for biased language and stereotypes')
      }
      if (check.type === 'factual_accuracy' && check.status !== 'passed') {
        recommendations.push('Verify factual claims and add sources where appropriate')
      }
    })

    const report: ComplianceReport = {
      id: crypto.randomUUID(),
      contentId,
      framework: framework as any,
      status,
      checks,
      recommendations,
      reviewedAt: new Date().toISOString(),
      nextReviewAt: this.calculateNextReviewDate(status)
    }

    return report
  }

  /**
   * Calculate next review date based on compliance status
   */
  private calculateNextReviewDate(status: ComplianceReport['status']): string {
    const now = new Date()
    const days = {
      compliant: 365,
      requires_review: 180,
      non_compliant: 30
    }

    now.setDate(now.getDate() + (days[status] || 180))
    return now.toISOString()
  }
}

// ============================================================================
// Content Filter
// ============================================================================

export class ContentFilter {
  private blockedWords: Set<string>
  private blockedPhrases: Set<string>
  private allowedDomains: Set<string>

  constructor() {
    this.blockedWords = new Set([
      // Profanity (simplified list)
      'damn', 'hell', 'crap', 'suck', 'stupid', 'idiot', 'dumb',
      // Inappropriate content
      'illegal', 'unlawful', 'criminal', 'fraud', 'scam', 'hack'
    ])

    this.blockedPhrases = new Set([
      // Harmful instructions
      'how to kill', 'how to harm', 'how to hurt',
      'how to steal', 'how to cheat', 'how to hack',
      // Dangerous activities
      'how to make bomb', 'how to make weapon', 'how to commit crime'
    ])

    this.allowedDomains = new Set([
      'example.com', 'test.com', 'demo.com'
    ])
  }

  /**
   * Filter content for blocked content
   */
  filterContent(content: string): {
    filtered: string
    blocked: boolean
    blockedItems: string[]
    replacements: Array<{ original: string; replacement: string }>
  } {
    let filtered = content
    const blockedItems: string[] = []
    const replacements: Array<{ original: string; replacement: string }> = []

    // Filter blocked words
    this.blockedWords.forEach(word => {
      const pattern = new RegExp(`\\b${word}\\b`, 'gi')
      const matches = filtered.match(pattern) || []
      
      if (matches.length > 0) {
        blockedItems.push(...matches.map(m => `Word: ${m}`))
        filtered = filtered.replace(pattern, '*'.repeat(word.length))
        matches.forEach(match => {
          replacements.push({
            original: match,
            replacement: '*'.repeat(match.length)
          })
        })
      }
    })

    // Filter blocked phrases
    this.blockedPhrases.forEach(phrase => {
      const pattern = new RegExp(phrase.replace(/\s+/g, '\\s+'), 'gi')
      const matches = filtered.match(pattern) || []
      
      if (matches.length > 0) {
        blockedItems.push(...matches.map(m => `Phrase: ${m}`))
        filtered = filtered.replace(pattern, '[FILTERED]')
        matches.forEach(match => {
          replacements.push({
            original: match,
            replacement: '[FILTERED]'
          })
        })
      }
    })

    // Filter external links (except allowed domains)
    const linkPattern = /\bhttps?:\/\/[^\s<>\"]+/gi
    const links = filtered.match(linkPattern) || []
    
    links.forEach(link => {
      const domain = this.extractDomain(link)
      if (!this.allowedDomains.has(domain)) {
        blockedItems.push(`External link: ${link}`)
        filtered = filtered.replace(link, '[EXTERNAL_LINK_REMOVED]')
        replacements.push({
          original: link,
          replacement: '[EXTERNAL_LINK_REMOVED]'
        })
      }
    })

    return {
      filtered,
      blocked: blockedItems.length > 0,
      blockedItems,
      replacements
    }
  }

  /**
   * Extract domain from URL
   */
  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname.replace('www.', '')
    } catch {
      return ''
    }
  }

  /**
   * Add blocked word
   */
  addBlockedWord(word: string): void {
    this.blockedWords.add(word.toLowerCase())
  }

  /**
   * Add blocked phrase
   */
  addBlockedPhrase(phrase: string): void {
    this.blockedPhrases.add(phrase.toLowerCase())
  }

  /**
   * Add allowed domain
   */
  addAllowedDomain(domain: string): void {
    this.allowedDomains.add(domain.toLowerCase().replace('www.', ''))
  }
}

// ============================================================================
// Safety Utilities
// ============================================================================

export class SafetyUtils {
  /**
   * Calculate overall safety score
   */
  static calculateOverallScore(checks: SafetyCheck[]): number {
    if (checks.length === 0) return 100

    const totalScore = checks.reduce((sum, check) => sum + check.score, 0)
    return Math.round(totalScore / checks.length)
  }

  /**
   * Get most critical safety issue
   */
  static getMostCriticalIssue(checks: SafetyCheck[]): SafetyCheck | null {
    const failedChecks = checks.filter(check => check.status === 'failed')
    
    if (failedChecks.length === 0) return null

    return failedChecks.reduce((mostCritical, check) => 
      check.score < mostCritical.score ? check : mostCritical
    )
  }

  /**
   * Generate safety summary
   */
  static generateSafetySummary(checks: SafetyCheck[]): {
    overallScore: number
    status: 'safe' | 'warning' | 'unsafe'
    passedChecks: number
    failedChecks: number
    warningChecks: number
    criticalIssues: string[]
  } {
    const overallScore = this.calculateOverallScore(checks)
    const passedChecks = checks.filter(c => c.status === 'passed').length
    const failedChecks = checks.filter(c => c.status === 'failed').length
    const warningChecks = checks.filter(c => c.status === 'warning').length

    let status: 'safe' | 'warning' | 'unsafe'
    if (overallScore >= 80 && failedChecks === 0) {
      status = 'safe'
    } else if (overallScore >= 60 && failedChecks === 0) {
      status = 'warning'
    } else {
      status = 'unsafe'
    }

    const criticalIssues = checks
      .filter(check => check.status === 'failed')
      .map(check => `${check.type}: ${check.details.detectedItems.join(', ')}`)

    return {
      overallScore,
      status,
      passedChecks,
      failedChecks,
      warningChecks,
      criticalIssues
    }
  }

  /**
   * Validate safety configuration
   */
  static validateSafetyConfig(config: AIContentOpsConfig['safety']): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (config.piiThreshold < 0 || config.piiThreshold > 1) {
      errors.push('PII threshold must be between 0 and 1')
    }

    if (config.toxicityThreshold < 0 || config.toxicityThreshold > 1) {
      errors.push('Toxicity threshold must be between 0 and 1')
    }

    if (config.biasThreshold < 0 || config.biasThreshold > 1) {
      errors.push('Bias threshold must be between 0 and 1')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}
