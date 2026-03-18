import { z } from 'zod'
import winston from 'winston'
import {
  CodeReviewFinding,
  ReviewContext,
  AIAutomationError,
  ErrorCodeSchema,
  AIRequest,
  AIResponse,
  StructuredOutputSchema
} from '../types'

// ============================================================================
// AI-Assisted Code Review Agent
// ============================================================================

export interface CodeReviewAgentConfig {
  aiProvider: {
    provider: 'openai' | 'anthropic' | 'local'
    model: string
    apiKey?: string
    endpoint?: string
  }
  reviewRules: ReviewRule[]
  severityThresholds: {
    security: 'low' | 'medium' | 'high' | 'critical'
    performance: 'low' | 'medium' | 'high' | 'critical'
    maintainability: 'low' | 'medium' | 'high' | 'critical'
  }
  multiRepoAnalysis: boolean
  automatedFixes: boolean
  complianceFrameworks: string[]
}

export interface ReviewRule {
  id: string
  name: string
  description: string
  type: 'security' | 'performance' | 'maintainability' | 'style' | 'bug' | 'architecture'
  severity: 'low' | 'medium' | 'high' | 'critical'
  pattern: string | RegExp
  enabled: boolean
  automatedFix?: {
    description: string
    template: string
    confidence: number
  }
}

export interface ReviewAnalysis {
  findings: CodeReviewFinding[]
  summary: {
    totalFindings: number
    bySeverity: Record<string, number>
    byType: Record<string, number>
    riskScore: number
  }
  recommendations: string[]
  metadata: {
    analysisTime: number
    linesAnalyzed: number
    filesAnalyzed: number
    confidence: number
  }
}

export class CodeReviewAgent {
  private config: CodeReviewAgentConfig
  private logger: winston.Logger
  private aiProvider: AIProvider
  private ruleEngine: RuleEngine

  constructor(config: CodeReviewAgentConfig) {
    this.config = config
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'code-review-agent.log' })
      ]
    })

    this.aiProvider = this.createAIProvider(config.aiProvider)
    this.ruleEngine = new RuleEngine(config.reviewRules)
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Perform comprehensive code review
   */
  async reviewCode(context: ReviewContext): Promise<ReviewAnalysis> {
    this.logger.info('Starting code review', {
      prNumber: context.pullRequest.number,
      filesCount: context.pullRequest.files.length
    })

    const startTime = Date.now()

    try {
      // Analyze changes with AI
      const aiFindings = await this.analyzeWithAI(context)
      
      // Apply rule-based analysis
      const ruleFindings = await this.analyzeWithRules(context)
      
      // Combine and deduplicate findings
      const allFindings = this.combineFindings(aiFindings, ruleFindings)
      
      // Generate automated fixes where possible
      const findingsWithFixes = await this.generateAutomatedFixes(allFindings, context)
      
      // Calculate summary and recommendations
      const analysis = this.generateAnalysis(findingsWithFixes, context, startTime)
      
      this.logger.info('Code review completed', {
        prNumber: context.pullRequest.number,
        totalFindings: analysis.summary.totalFindings,
        riskScore: analysis.summary.riskScore
      })

      return analysis

    } catch (error) {
      this.logger.error('Code review failed', {
        prNumber: context.pullRequest.number,
        error
      })
      throw new AIAutomationError(
        'REVIEW_FAILED',
        'Failed to complete code review',
        { error, prNumber: context.pullRequest.number }
      )
    }
  }

  /**
   * Get review rules
   */
  getRules(): ReviewRule[] {
    return this.ruleEngine.getRules()
  }

  /**
   * Update review rules
   */
  updateRules(rules: ReviewRule[]): void {
    this.ruleEngine.updateRules(rules)
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private async analyzeWithAI(context: ReviewContext): Promise<CodeReviewFinding[]> {
    this.logger.debug('Analyzing with AI', { prNumber: context.pullRequest.number })

    // Build comprehensive analysis prompt
    const prompt = this.buildAnalysisPrompt(context)
    
    const schema: StructuredOutputSchema = {
      name: 'code_review_findings',
      schema: z.object({
        findings: z.array(z.object({
          type: z.enum(['security', 'performance', 'maintainability', 'style', 'bug', 'architecture']),
          severity: z.enum(['low', 'medium', 'high', 'critical']),
          title: z.string(),
          description: z.string(),
          location: z.object({
            file: z.string(),
            line: z.number().optional(),
            lines: z.tuple([z.number(), z.number()]).optional()
          }),
          suggestion: z.string().optional(),
          automatedFix: z.object({
            code: z.string(),
            confidence: z.number()
          }).optional(),
          falsePositiveRisk: z.number()
        })).describe('Code review findings'),
        summary: z.object({
          riskScore: z.number(),
          recommendations: z.array(z.string())
        }).describe('Review summary')
      }),
      description: 'Code review analysis structure'
    }

    const response = await this.aiProvider.generate({
      prompt,
      structuredOutput: schema,
      systemPrompt: `You are an expert code reviewer for a ${context.repository.metadata.language} project using ${context.repository.metadata.framework || 'no specific framework'}. 

Focus on:
1. Security vulnerabilities and best practices
2. Performance issues and optimizations
3. Code maintainability and readability
4. Potential bugs and edge cases
5. Architectural concerns

Provide specific, actionable feedback with line numbers when possible. For each finding, assess the risk of it being a false positive (0-1 scale).`
    })

    if (!response.structuredData) {
      throw new AIAutomationError(
        'AI_PROVIDER_ERROR',
        'Failed to generate structured code review'
      )
    }

    const data = response.structuredData as any
    
    return data.findings.map((finding: any) => ({
      id: `ai-${Date.now()}-${Math.random()}`,
      ...finding,
      metadata: {
        category: finding.type,
        falsePositiveRisk: finding.falsePositiveRisk || 0.1
      }
    }))
  }

  private async analyzeWithRules(context: ReviewContext): Promise<CodeReviewFinding[]> {
    this.logger.debug('Analyzing with rules', { prNumber: context.pullRequest.number })

    const findings: CodeReviewFinding[] = []

    for (const file of context.pullRequest.files) {
      const fileFindings = await this.ruleEngine.analyzeFile(file.patch, file.path)
      findings.push(...fileFindings)
    }

    return findings
  }

  private combineFindings(
    aiFindings: CodeReviewFinding[],
    ruleFindings: CodeReviewFinding[]
  ): CodeReviewFinding[] {
    const combined = [...aiFindings, ...ruleFindings]
    
    // Deduplicate by location and type
    const deduplicated = combined.reduce((acc, finding) => {
      const key = `${finding.location.file}:${finding.location.line || 0}:${finding.type}`
      
      if (!acc.has(key)) {
        acc.set(key, finding)
      } else {
        // Merge findings if they're at the same location
        const existing = acc.get(key)!
        if (finding.severity === 'critical' || finding.severity === 'high') {
          existing.severity = finding.severity
        }
        if (finding.description.length > existing.description.length) {
          existing.description = finding.description
        }
      }
      
      return acc
    }, new Map<string, CodeReviewFinding>())

    return Array.from(deduplicated.values())
  }

  private async generateAutomatedFixes(
    findings: CodeReviewFinding[],
    context: ReviewContext
  ): Promise<CodeReviewFinding[]> {
    if (!this.config.automatedFixes) {
      return findings
    }

    this.logger.debug('Generating automated fixes', { 
      prNumber: context.pullRequest.number,
      findingsCount: findings.length 
    })

    for (const finding of findings) {
      if (finding.automatedFix) {
        continue // Already has automated fix
      }

      // Try to generate automated fix for certain types of issues
      if (this.canGenerateFix(finding)) {
        try {
          const fix = await this.generateFix(finding, context)
          if (fix) {
            finding.automatedFix = fix
          }
        } catch (error) {
          this.logger.debug('Failed to generate automated fix', {
            findingId: finding.id,
            error
          })
        }
      }
    }

    return findings
  }

  private canGenerateFix(finding: CodeReviewFinding): boolean {
    // Define which types of findings can have automated fixes
    const fixableTypes = ['style', 'maintainability', 'performance']
    const fixableSeverities = ['low', 'medium']
    
    return fixableTypes.includes(finding.type) && 
           fixableSeverities.includes(finding.severity)
  }

  private async generateFix(
    finding: CodeReviewFinding,
    context: ReviewContext
  ): Promise<{ code: string; confidence: number } | null {
    // Mock automated fix generation
    // In production, this would use AI to generate actual code fixes
    
    if (finding.type === 'style' && finding.description.includes('formatting')) {
      return {
        code: '// Automated formatting fix applied',
        confidence: 0.8
      }
    }

    if (finding.type === 'performance' && finding.description.includes('optimization')) {
      return {
        code: '// Automated performance optimization applied',
        confidence: 0.6
      }
    }

    return null
  }

  private generateAnalysis(
    findings: CodeReviewFinding[],
    context: ReviewContext,
    startTime: number
  ): ReviewAnalysis {
    const analysisTime = Date.now() - startTime
    const linesAnalyzed = context.pullRequest.files.reduce(
      (sum, file) => sum + file.additions + file.deletions,
      0
    )
    const filesAnalyzed = context.pullRequest.files.length

    // Calculate summary statistics
    const summary = {
      totalFindings: findings.length,
      bySeverity: findings.reduce((acc, f) => {
        acc[f.severity] = (acc[f.severity] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      byType: findings.reduce((acc, f) => {
        acc[f.type] = (acc[f.type] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      riskScore: this.calculateRiskScore(findings)
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(findings, context)

    return {
      findings,
      summary,
      recommendations,
      metadata: {
        analysisTime,
        linesAnalyzed,
        filesAnalyzed,
        confidence: this.calculateConfidence(findings)
      }
    }
  }

  private calculateRiskScore(findings: CodeReviewFinding[]): number {
    const severityWeights = {
      critical: 10,
      high: 5,
      medium: 2,
      low: 1
    }

    const totalScore = findings.reduce((sum, finding) => {
      return sum + severityWeights[finding.severity]
    }, 0)

    // Normalize to 0-100 scale
    return Math.min(100, (totalScore / findings.length) * 10)
  }

  private calculateConfidence(findings: CodeReviewFinding[]): number {
    if (findings.length === 0) return 1.0

    const avgFalsePositiveRisk = findings.reduce(
      (sum, f) => sum + (f.metadata.falsePositiveRisk || 0.1),
      0
    ) / findings.length

    return Math.max(0.1, 1.0 - avgFalsePositiveRisk)
  }

  private generateRecommendations(
    findings: CodeReviewFinding[],
    context: ReviewContext
  ): string[] {
    const recommendations: string[] = []

    // High-level recommendations based on findings
    if (findings.some(f => f.type === 'security' && f.severity === 'critical')) {
      recommendations.push('Address critical security issues before merging')
    }

    if (findings.some(f => f.type === 'performance' && f.severity === 'high')) {
      recommendations.push('Consider performance testing for the changes')
    }

    if (findings.filter(f => f.type === 'maintainability').length > 3) {
      recommendations.push('Refactor code to improve maintainability')
    }

    // Specific recommendations based on repository context
    if (context.repository.metadata.framework === 'Next.js') {
      recommendations.push('Ensure Next.js best practices are followed')
    }

    if (context.repository.metadata.language === 'TypeScript') {
      recommendations.push('Verify TypeScript types are properly defined')
    }

    return recommendations
  }

  private buildAnalysisPrompt(context: ReviewContext): string {
    const filesOverview = context.pullRequest.files
      .slice(0, 5) // Limit to prevent context overflow
      .map(file => `File: ${file.path} (+${file.additions}, -${file.deletions})`)
      .join('\n')

    return `
Review this pull request for code quality, security, and best practices:

Repository: ${context.repository.owner}/${context.repository.repo}
Language: ${context.repository.metadata.language}
Framework: ${context.repository.metadata.framework || 'None'}
Complexity: ${context.repository.metadata.complexity}

Pull Request: #${context.pullRequest.number}
Title: ${context.pullRequest.title}
Author: ${context.pullRequest.author}
Base Branch: ${context.pullRequest.baseBranch}
Head Branch: ${context.pullRequest.headBranch}

Files Changed (${context.pullRequest.files.length}):
${filesOverview}

Full diff for first few files:
${context.pullRequest.files.slice(0, 3).map(f => f.patch.substring(0, 2000)).join('\n\n---\n\n')}

Please analyze these changes and provide specific feedback on:
1. Security vulnerabilities or anti-patterns
2. Performance issues or optimizations
3. Code maintainability and readability
4. Potential bugs or edge cases
5. Architectural concerns or design patterns

For each finding, provide:
- Type and severity level
- Specific location (file and line numbers)
- Clear description
- Suggested fix if applicable
- Assessment of false positive risk (0-1 scale)
`
  }

  private createAIProvider(config: CodeReviewAgentConfig['aiProvider']): AIProvider {
    switch (config.provider) {
      case 'openai':
        return new OpenAIReviewProvider(config)
      case 'anthropic':
        return new AnthropicReviewProvider(config)
      default:
        throw new AIAutomationError(
          'UNSUPPORTED_PROVIDER',
          `AI provider not supported: ${config.provider}`
        )
    }
  }
}

// ============================================================================
// Rule Engine
// ============================================================================

export class RuleEngine {
  private rules: Map<string, ReviewRule> = new Map()

  constructor(rules: ReviewRule[]) {
    rules.forEach(rule => this.rules.set(rule.id, rule))
  }

  async analyzeFile(patch: string, filePath: string): Promise<CodeReviewFinding[]> {
    const findings: CodeReviewFinding[] = []

    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue

      const matches = this.applyRule(rule, patch, filePath)
      findings.push(...matches)
    }

    return findings
  }

  private applyRule(rule: ReviewRule, patch: string, filePath: string): CodeReviewFinding[] {
    const findings: CodeReviewFinding[] = []

    if (typeof rule.pattern === 'string') {
      if (patch.includes(rule.pattern)) {
        findings.push(this.createFinding(rule, filePath, patch))
      }
    } else if (rule.pattern instanceof RegExp) {
      const matches = patch.match(rule.pattern)
      if (matches) {
        findings.push(this.createFinding(rule, filePath, patch))
      }
    }

    return findings
  }

  private createFinding(rule: ReviewRule, filePath: string, patch: string): CodeReviewFinding {
    return {
      id: `rule-${rule.id}-${Date.now()}`,
      type: rule.type,
      severity: rule.severity,
      title: rule.name,
      description: rule.description,
      location: {
        file: filePath
      },
      suggestion: rule.automatedFix?.description,
      automatedFix: rule.automatedFix ? {
        code: rule.automatedFix.template,
        confidence: rule.automatedFix.confidence
      } : undefined,
      metadata: {
        ruleId: rule.id,
        category: rule.type,
        falsePositiveRisk: 0.2 // Default for rule-based findings
      }
    }
  }

  getRules(): ReviewRule[] {
    return Array.from(this.rules.values())
  }

  updateRules(rules: ReviewRule[]): void {
    this.rules.clear()
    rules.forEach(rule => this.rules.set(rule.id, rule))
  }
}

// ============================================================================
// AI Provider Implementations
// ============================================================================

export interface AIProvider {
  generate(request: AIRequest): Promise<AIResponse>
}

export class OpenAIReviewProvider implements AIProvider {
  private config: CodeReviewAgentConfig['aiProvider']

  constructor(config: CodeReviewAgentConfig['aiProvider']) {
    this.config = config
  }

  async generate(request: AIRequest): Promise<AIResponse> {
    // Mock implementation - in production, use actual OpenAI API
    return {
      content: 'Code review analysis from OpenAI',
      structuredData: request.structuredOutput ? {
        findings: [{
          type: 'security',
          severity: 'medium',
          title: 'Potential security issue',
          description: 'Review this security concern',
          location: { file: 'example.ts', line: 42 },
          falsePositiveRisk: 0.2
        }],
        summary: {
          riskScore: 45,
          recommendations: ['Address security issues']
        }
      } : undefined,
      metadata: {
        model: this.config.model,
        tokensUsed: { prompt: 500, completion: 300, total: 800 },
        cost: 0.024,
        latency: 3000
      }
    }
  }
}

export class AnthropicReviewProvider implements AIProvider {
  private config: CodeReviewAgentConfig['aiProvider']

  constructor(config: CodeReviewAgentConfig['aiProvider']) {
    this.config = config
  }

  async generate(request: AIRequest): Promise<AIResponse> {
    // Mock implementation - in production, use actual Anthropic API
    return {
      content: 'Code review analysis from Claude',
      structuredData: request.structuredOutput ? {
        findings: [{
          type: 'maintainability',
          severity: 'low',
          title: 'Code style improvement',
          description: 'Consider refactoring for better readability',
          location: { file: 'example.ts', line: 15 },
          falsePositiveRisk: 0.3
        }],
        summary: {
          riskScore: 25,
          recommendations: ['Improve code readability']
        }
      } : undefined,
      metadata: {
        model: this.config.model,
        tokensUsed: { prompt: 450, completion: 250, total: 700 },
        cost: 0.021,
        latency: 2500
      }
    }
  }
}
