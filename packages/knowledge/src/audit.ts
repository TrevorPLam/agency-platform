/**
 * Knowledge Audit System
 * 
 * This module implements systematic knowledge audits for quality,
 * completeness, accuracy, and relevance monitoring.
 */

import { z } from 'zod'
import {
  KnowledgeAudit,
  KnowledgeCapture,
  AuditResult,
  AuditIssue,
  AuditSummary,
  KnowledgeCategory,
  ExpertiseLevel
} from './types'

// Validation schemas
const KnowledgeAuditSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  type: z.enum(['quality', 'completeness', 'accuracy', 'relevance']),
  status: z.enum(['pending', 'in_progress', 'completed', 'failed']),
  scope: z.object({
    category: z.enum([
      'architecture', 'security', 'performance', 'testing', 'deployment',
      'monitoring', 'governance', 'best-practices', 'troubleshooting', 'onboarding'
    ]).optional(),
    dateRange: z.object({
      start: z.string(),
      end: z.string()
    }).optional(),
    author: z.string().optional()
  }),
  results: z.array(z.object({
    itemId: z.string(),
    issues: z.array(z.object({
      type: z.enum(['clarity', 'accuracy', 'completeness', 'relevance', 'formatting']),
      severity: z.enum(['low', 'medium', 'high', 'critical']),
      description: z.string(),
      suggestion: z.string(),
      location: z.string().optional()
    })),
    score: z.number().min(0).max(100),
    recommendations: z.array(z.string()),
    status: z.enum(['passed', 'warning', 'failed'])
  })),
  summary: z.object({
    totalItems: z.number(),
    passed: z.number(),
    warnings: z.number(),
    failed: z.number(),
    averageScore: z.number(),
    topIssues: z.array(z.object({
      type: z.enum(['clarity', 'accuracy', 'completeness', 'relevance', 'formatting']),
      severity: z.enum(['low', 'medium', 'high', 'critical']),
      description: z.string(),
      suggestion: z.string()
    }))
  })
})

export class KnowledgeAuditor {
  private auditRules: AuditRule[]
  private qualityThresholds: QualityThresholds

  constructor() {
    this.auditRules = this.getDefaultAuditRules()
    this.qualityThresholds = this.getDefaultQualityThresholds()
  }

  /**
   * Perform comprehensive knowledge audit
   */
  async auditKnowledge(
    knowledgeBase: KnowledgeCapture[],
    type: 'quality' | 'completeness' | 'accuracy' | 'relevance',
    scope?: {
      category?: KnowledgeCategory
      dateRange?: { start: string; end: string }
      author?: string
    }
  ): Promise<KnowledgeAudit> {
    const audit: KnowledgeAudit = {
      id: this.generateAuditId(),
      timestamp: new Date().toISOString(),
      type,
      status: 'in_progress',
      scope: scope || {},
      results: [],
      summary: {
        totalItems: 0,
        passed: 0,
        warnings: 0,
        failed: 0,
        averageScore: 0,
        topIssues: []
      }
    }

    try {
      // Filter knowledge based on scope
      const filteredKnowledge = this.filterKnowledge(knowledgeBase, scope)
      audit.summary.totalItems = filteredKnowledge.length

      // Perform audit based on type
      for (const item of filteredKnowledge) {
        const result = await this.auditItem(item, type, scope)
        audit.results.push(result)
      }

      // Calculate summary
      audit.summary = this.calculateAuditSummary(audit.results)
      audit.status = 'completed'

      return audit
    } catch (error) {
      console.error('Audit failed:', error)
      audit.status = 'failed'
      return audit
    }
  }

  /**
   * Audit individual knowledge item
   */
  private async auditItem(
    item: KnowledgeCapture,
    type: 'quality' | 'completeness' | 'accuracy' | 'relevance',
    scope?: any
  ): Promise<AuditResult> {
    const issues: AuditIssue[] = []
    const recommendations: string[] = []

    switch (type) {
      case 'quality':
        this.auditQuality(item, issues, recommendations)
        break
      case 'completeness':
        this.auditCompleteness(item, issues, recommendations)
        break
      case 'accuracy':
        this.auditAccuracy(item, issues, recommendations)
        break
      case 'relevance':
        this.auditRelevance(item, issues, recommendations)
        break
    }

    const score = this.calculateAuditScore(item, issues)
    const status = this.determineAuditStatus(issues)

    return {
      itemId: item.id,
      issues,
      score,
      recommendations,
      status
    }
  }

  /**
   * Audit quality metrics
   */
  private auditQuality(item: KnowledgeCapture, issues: AuditIssue[], recommendations: string[]): void {
    // Check clarity
    if (item.quality.clarity < this.qualityThresholds.clarity) {
      issues.push({
        type: 'clarity',
        severity: item.quality.clarity < 50 ? 'high' : 'medium',
        description: `Low clarity score: ${item.quality.clarity}`,
        suggestion: 'Improve writing clarity, add structure, and use clearer language',
        location: 'content'
      })
      recommendations.push('Rewrite content for better clarity')
    }

    // Check accuracy
    if (item.quality.accuracy < this.qualityThresholds.accuracy) {
      issues.push({
        type: 'accuracy',
        severity: item.quality.accuracy < 60 ? 'high' : 'medium',
        description: `Low accuracy score: ${item.quality.accuracy}`,
        suggestion: 'Verify facts, update outdated information, and add citations',
        location: 'content'
      })
      recommendations.push('Review and verify content accuracy')
    }

    // Check completeness
    if (item.quality.completeness < this.qualityThresholds.completeness) {
      issues.push({
        type: 'completeness',
        severity: item.quality.completeness < 50 ? 'high' : 'medium',
        description: `Low completeness score: ${item.quality.completeness}`,
        suggestion: 'Add missing information, examples, and context',
        location: 'content'
      })
      recommendations.push('Enhance content completeness')
    }

    // Check relevance
    if (item.quality.relevance < this.qualityThresholds.relevance) {
      issues.push({
        type: 'relevance',
        severity: item.quality.relevance < 60 ? 'medium' : 'low',
        description: `Low relevance score: ${item.quality.relevance}`,
        suggestion: 'Focus on core topics and remove irrelevant information',
        location: 'content'
      })
      recommendations.push('Improve content relevance')
    }

    // Check overall quality
    if (item.quality.overall < this.qualityThresholds.overall) {
      issues.push({
        type: 'formatting',
        severity: item.quality.overall < 60 ? 'high' : 'medium',
        description: `Low overall quality: ${item.quality.overall}`,
        suggestion: 'Comprehensive quality improvement needed',
        location: 'overall'
      })
      recommendations.push('Comprehensive quality review required')
    }
  }

  /**
   * Audit completeness metrics
   */
  private auditCompleteness(item: KnowledgeCapture, issues: AuditIssue[], recommendations: string[]): void {
    // Check title quality
    if (item.title.length < 10) {
      issues.push({
        type: 'completeness',
        severity: 'medium',
        description: 'Title too short',
        suggestion: 'Provide a more descriptive title',
        location: 'title'
      })
      recommendations.push('Improve title description')
    }

    // Check content length
    if (item.content.length < 100) {
      issues.push({
        type: 'completeness',
        severity: 'high',
        description: 'Content too brief',
        suggestion: 'Add more detailed information and examples',
        location: 'content'
      })
      recommendations.push('Expand content with more details')
    }

    // Check summary quality
    if (item.summary.length < 20) {
      issues.push({
        type: 'completeness',
        severity: 'medium',
        description: 'Summary too brief',
        suggestion: 'Provide a more comprehensive summary',
        location: 'summary'
      })
      recommendations.push('Enhance summary')
    }

    // Check tags
    if (item.tags.length === 0) {
      issues.push({
        type: 'completeness',
        severity: 'low',
        description: 'No tags provided',
        suggestion: 'Add relevant tags for better discoverability',
        location: 'tags'
      })
      recommendations.push('Add relevant tags')
    } else if (item.tags.length < 2) {
      issues.push({
        type: 'completeness',
        severity: 'low',
        description: 'Insufficient tags',
        suggestion: 'Add more specific tags',
        location: 'tags'
      })
      recommendations.push('Add more specific tags')
    }

    // Check citations
    if (item.citations.length === 0 && item.category !== 'troubleshooting') {
      issues.push({
        type: 'completeness',
        severity: 'low',
        description: 'No citations provided',
        suggestion: 'Add citations to support claims',
        location: 'citations'
      })
      recommendations.push('Add supporting citations')
    }

    // Check metadata
    if (Object.keys(item.metadata).length === 0) {
      issues.push({
        type: 'completeness',
        severity: 'low',
        description: 'No metadata provided',
        suggestion: 'Add relevant metadata for better context',
        location: 'metadata'
      })
      recommendations.push('Add metadata')
    }
  }

  /**
   * Audit accuracy metrics
   */
  private auditAccuracy(item: KnowledgeCapture, issues: AuditIssue[], recommendations: string[]): void {
    // Check for outdated content
    const contentAge = (Date.now() - new Date(item.timestamp).getTime()) / (1000 * 60 * 60 * 24)
    if (contentAge > 365 && item.category !== 'best-practices') {
      issues.push({
        type: 'accuracy',
        severity: 'medium',
        description: 'Content may be outdated',
        suggestion: 'Review and update content for accuracy',
        location: 'timestamp'
      })
      recommendations.push('Review for outdated information')
    }

    // Check for technical accuracy indicators
    const technicalTerms = ['api', 'database', 'security', 'performance', 'testing']
    const hasTechnicalContent = technicalTerms.some(term => 
      item.content.toLowerCase().includes(term)
    )

    if (hasTechnicalContent && item.citations.length === 0) {
      issues.push({
        type: 'accuracy',
        severity: 'medium',
        description: 'Technical content lacks citations',
        suggestion: 'Add citations for technical claims',
        location: 'content'
      })
      recommendations.push('Add technical citations')
    }

    // Check for potential inaccuracies
    const potentialIssues = [
      { pattern: /\b(always|never)\b/g, issue: 'Absolute statements' },
      { pattern: /\b(obviously|clearly)\b/g, issue: 'Assumptive language' },
      { pattern: /\b(quickly|easily)\b/g, issue: 'Unverified claims' }
    ]

    potentialIssues.forEach(({ pattern, issue }) => {
      const matches = item.content.match(pattern)
      if (matches && matches.length > 2) {
        issues.push({
          type: 'accuracy',
          severity: 'low',
          description: `Potential inaccuracies: ${issue}`,
          suggestion: 'Review absolute statements and unverified claims',
          location: 'content'
        })
        recommendations.push(`Review ${issue.toLowerCase()}`)
      }
    })
  }

  /**
   * Audit relevance metrics
   */
  private auditRelevance(item: KnowledgeCapture, issues: AuditIssue[], recommendations: string[]): void {
    // Check category relevance
    const categoryKeywords = this.getCategoryKeywords(item.category)
    const hasCategoryKeywords = categoryKeywords.some(keyword =>
      item.content.toLowerCase().includes(keyword.toLowerCase())
    )

    if (!hasCategoryKeywords) {
      issues.push({
        type: 'relevance',
        severity: 'medium',
        description: 'Content may not match category',
        suggestion: 'Ensure content aligns with selected category',
        location: 'category'
      })
      recommendations.push('Improve category alignment')
    }

    // Check expertise level appropriateness
    if (item.expertise === 'expert' && item.content.length < 500) {
      issues.push({
        type: 'relevance',
        severity: 'medium',
        description: 'Expert-level content too brief',
        suggestion: 'Expand content for expert-level depth',
        location: 'content'
      })
      recommendations.push('Expand expert-level content')
    }

    if (item.expertise === 'beginner' && item.content.length > 2000) {
      issues.push({
        type: 'relevance',
        severity: 'low',
        description: 'Beginner content may be too complex',
        suggestion: 'Simplify content for beginner audience',
        location: 'content'
      })
      recommendations.push('Simplify for beginners')
    }

    // Check title-content relevance
    const titleWords = item.title.toLowerCase().split(/\s+/)
    const contentLower = item.content.toLowerCase()
    const titleRelevance = titleWords.filter(word => 
      word.length > 3 && contentLower.includes(word)
    ).length / titleWords.length

    if (titleRelevance < 0.3) {
      issues.push({
        type: 'relevance',
        severity: 'medium',
        description: 'Title may not reflect content',
        suggestion: 'Update title to better represent content',
        location: 'title'
      })
      recommendations.push('Improve title relevance')
    }
  }

  /**
   * Filter knowledge based on audit scope
   */
  private filterKnowledge(
    knowledgeBase: KnowledgeCapture[],
    scope?: {
      category?: KnowledgeCategory
      dateRange?: { start: string; end: string }
      author?: string
    }
  ): KnowledgeCapture[] {
    let filtered = [...knowledgeBase]

    if (scope?.category) {
      filtered = filtered.filter(item => item.category === scope.category)
    }

    if (scope?.dateRange) {
      const startDate = new Date(scope.dateRange.start)
      const endDate = new Date(scope.dateRange.end)
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.timestamp)
        return itemDate >= startDate && itemDate <= endDate
      })
    }

    if (scope?.author) {
      filtered = filtered.filter(item => 
        item.author.toLowerCase().includes(scope.author!.toLowerCase()) ||
        item.authorEmail.toLowerCase().includes(scope.author!.toLowerCase())
      )
    }

    return filtered
  }

  /**
   * Calculate audit summary
   */
  private calculateAuditSummary(results: AuditResult[]): AuditSummary {
    const passed = results.filter(r => r.status === 'passed').length
    const warnings = results.filter(r => r.status === 'warning').length
    const failed = results.filter(r => r.status === 'failed').length
    const averageScore = results.reduce((sum, r) => sum + r.score, 0) / results.length

    // Collect top issues
    const allIssues = results.flatMap(r => r.issues)
    const issueCounts = allIssues.reduce((counts, issue) => {
      const key = `${issue.type}-${issue.severity}`
      counts[key] = (counts[key] || 0) + 1
      return counts
    }, {} as Record<string, number>)

    const topIssues = Object.entries(issueCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([key, count]) => {
        const [type, severity] = key.split('-')
        const issue = allIssues.find(i => i.type === type && i.severity === severity)
        return issue!
      })

    return {
      totalItems: results.length,
      passed,
      warnings,
      failed,
      averageScore,
      topIssues
    }
  }

  /**
   * Calculate audit score for an item
   */
  private calculateAuditScore(item: KnowledgeCapture, issues: AuditIssue[]): number {
    let score = item.quality.overall

    // Deduct points for issues
    issues.forEach(issue => {
      switch (issue.severity) {
        case 'critical':
          score -= 30
          break
        case 'high':
          score -= 20
          break
        case 'medium':
          score -= 10
          break
        case 'low':
          score -= 5
          break
      }
    })

    return Math.max(0, Math.min(100, score))
  }

  /**
   * Determine audit status based on issues
   */
  private determineAuditStatus(issues: AuditIssue[]): 'passed' | 'warning' | 'failed' {
    if (issues.length === 0) return 'passed'
    
    const hasCritical = issues.some(i => i.severity === 'critical')
    const hasHigh = issues.some(i => i.severity === 'high')
    
    if (hasCritical || hasHigh) return 'failed'
    return 'warning'
  }

  /**
   * Get keywords for category relevance checking
   */
  private getCategoryKeywords(category: KnowledgeCategory): string[] {
    const keywordMap: Record<KnowledgeCategory, string[]> = {
      architecture: ['architecture', 'design', 'pattern', 'structure', 'component', 'system'],
      security: ['security', 'auth', 'authentication', 'authorization', 'encryption', 'vulnerability', 'threat'],
      performance: ['performance', 'optimize', 'speed', 'memory', 'cpu', 'cache', 'latency', 'throughput'],
      testing: ['test', 'testing', 'unit', 'integration', 'e2e', 'mock', 'assert', 'coverage'],
      deployment: ['deploy', 'deployment', 'release', 'build', 'ci', 'cd', 'production', 'staging'],
      monitoring: ['monitor', 'logging', 'metrics', 'alert', 'health', 'trace', 'observability'],
      governance: ['governance', 'policy', 'compliance', 'audit', 'standard', 'procedure', 'guideline'],
      'best-practices': ['best practice', 'recommendation', 'guideline', 'standard', 'pattern'],
      troubleshooting: ['troubleshoot', 'debug', 'fix', 'error', 'issue', 'problem', 'solution'],
      onboarding: ['onboard', 'setup', 'install', 'configure', 'getting started', 'tutorial', 'guide']
    }

    return keywordMap[category] || []
  }

  /**
   * Generate audit ID
   */
  private generateAuditId(): string {
    return `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get default audit rules
   */
  private getDefaultAuditRules(): AuditRule[] {
    return [
      {
        type: 'quality',
        condition: 'clarity < 70',
        severity: 'medium',
        description: 'Content clarity is below threshold',
        recommendation: 'Improve writing clarity and structure'
      },
      {
        type: 'completeness',
        condition: 'content.length < 100',
        severity: 'high',
        description: 'Content is too brief',
        recommendation: 'Add more detailed information'
      },
      {
        type: 'accuracy',
        condition: 'age > 365 days',
        severity: 'medium',
        description: 'Content may be outdated',
        recommendation: 'Review and update content'
      },
      {
        type: 'relevance',
        condition: 'title-content mismatch',
        severity: 'medium',
        description: 'Title does not reflect content',
        recommendation: 'Update title to match content'
      }
    ]
  }

  /**
   * Get default quality thresholds
   */
  private getDefaultQualityThresholds(): QualityThresholds {
    return {
      clarity: 70,
      accuracy: 80,
      completeness: 75,
      relevance: 70,
      overall: 75
    }
  }
}

interface AuditRule {
  type: string
  condition: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  recommendation: string
}

interface QualityThresholds {
  clarity: number
  accuracy: number
  completeness: number
  relevance: number
  overall: number
}
