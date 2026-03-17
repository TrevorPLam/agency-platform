/**
 * Expertise Mapping System
 * 
 * This module implements expertise identification and mapping based on
 * git contributions, code analysis, and knowledge capture data.
 */

import { z } from 'zod'
import { execSync } from 'child_process'
import { readFile, readdir, stat } from 'fs/promises'
import { join, extname, basename } from 'path'
import {
  ExpertiseProfile,
  ExpertiseArea,
  ActivityMetrics,
  ReputationMetrics,
  Badge,
  AvailabilityInfo,
  MentorshipProfile,
  MentorshipSession,
  KnowledgeCapture,
  KnowledgeCategory,
  ExpertiseLevel
} from './types'

// Validation schemas
const ExpertiseAreaSchema = z.object({
  category: z.enum([
    'architecture', 'security', 'performance', 'testing', 'deployment',
    'monitoring', 'governance', 'best-practices', 'troubleshooting', 'onboarding'
  ]),
  level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  confidence: z.number().min(0).max(100),
  contributions: number,
  endorsements: number,
  lastContribution: z.string()
})

export class ExpertiseMapper {
  private repositoryPath: string
  private excludePatterns: string[]

  constructor(repositoryPath: string = process.cwd()) {
    this.repositoryPath = repositoryPath
    this.excludePatterns = [
      'node_modules',
      '.git',
      'dist',
      'build',
      '.next',
      'coverage',
      '.nyc_output',
      '*.log',
      '*.tmp'
    ]
  }

  /**
   * Map expertise for all contributors in the repository
   */
  async mapRepositoryExpertise(): Promise<ExpertiseProfile[]> {
    const contributors = await this.getContributors()
    const profiles: ExpertiseProfile[] = []

    for (const contributor of contributors) {
      try {
        const profile = await this.buildExpertiseProfile(contributor)
        profiles.push(profile)
      } catch (error) {
        console.error(`Error building profile for ${contributor.email}:`, error)
      }
    }

    return profiles.sort((a, b) => b.reputation.score - a.reputation.score)
  }

  /**
   * Build expertise profile for a specific contributor
   */
  async buildExpertiseProfile(contributor: Contributor): Promise<ExpertiseProfile> {
    const contributions = await this.getContributorContributions(contributor)
    const areas = await this.analyzeExpertiseAreas(contributions)
    const activity = this.calculateActivityMetrics(contributions)
    const reputation = this.calculateReputationMetrics(contributor, contributions)
    const availability = await this.estimateAvailability(contributor)
    const mentorship = await this.buildMentorshipProfile(contributor, areas)

    return {
      userId: contributor.email,
      name: contributor.name,
      email: contributor.email,
      areas,
      contributions,
      activity,
      reputation,
      availability,
      mentorship,
      lastActive: this.getLastActiveDate(contributions)
    }
  }

  /**
   * Get all contributors to the repository
   */
  private async getContributors(): Promise<Contributor[]> {
    try {
      const output = execSync(
        'git log --pretty=format:"%an|%ae" --no-pager | sort | uniq',
        { cwd: this.repositoryPath, encoding: 'utf-8' }
      )
      
      const lines = output.trim().split('\n')
      const contributors: Contributor[] = []
      
      for (const line of lines) {
        const [name, email] = line.split('|')
        if (name && email && email !== 'unknown@example.com') {
          contributors.push({ name: name.trim(), email: email.trim() })
        }
      }
      
      return contributors
    } catch (error) {
      console.error('Error getting contributors:', error)
      return []
    }
  }

  /**
   * Get all contributions by a specific contributor
   */
  private async getContributorContributions(contributor: Contributor): Promise<KnowledgeCapture[]> {
    try {
      // Get commits by contributor
      const commitOutput = execSync(
        `git log --author="${contributor.email}" --pretty=format:"%H|%s|%b|%ad" --date=iso --no-pager`,
        { cwd: this.repositoryPath, encoding: 'utf-8' }
      )
      
      const commits = commitOutput.trim().split('\n').filter(line => line.trim())
      const contributions: KnowledgeCapture[] = []

      for (const commit of commits) {
        const [hash, subject, body, date] = commit.split('|')
        const contribution = await this.analyzeCommit(hash, subject, body, date, contributor)
        if (contribution) {
          contributions.push(contribution)
        }
      }

      // Add code contributions
      const codeContributions = await this.analyzeCodeContributions(contributor)
      contributions.push(...codeContributions)

      return contributions.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
    } catch (error) {
      console.error(`Error getting contributions for ${contributor.email}:`, error)
      return []
    }
  }

  /**
   * Analyze a commit for knowledge value
   */
  private async analyzeCommit(
    hash: string,
    subject: string,
    body: string,
    date: string,
    contributor: Contributor
  ): Promise<KnowledgeCapture | null> {
    try {
      const content = `${subject}\n\n${body}`
      const analysis = await this.analyzeContentForExpertise(content)
      
      if (!analysis.hasValue) {
        return null
      }

      // Get changed files
      const changedFiles = execSync(
        `git show --name-only --pretty=format:"" ${hash}`,
        { cwd: this.repositoryPath, encoding: 'utf-8' }
      ).trim().split('\n').filter(f => f.trim())

      return {
        id: `commit-${hash}`,
        title: subject,
        content,
        summary: analysis.summary,
        source: 'commit',
        category: analysis.category,
        tags: analysis.tags,
        expertise: analysis.expertise,
        timestamp: date,
        author: contributor.name,
        authorEmail: contributor.email,
        repository: this.getRepositoryName(),
        commitHash: hash,
        citations: [],
        quality: {
          clarity: 85,
          accuracy: 90,
          completeness: 80,
          relevance: 85,
          overall: 85
        },
        metadata: {
          changedFiles,
          commitType: this.categorizeCommitType(subject),
          impact: analysis.impact
        }
      }
    } catch (error) {
      console.error(`Error analyzing commit ${hash}:`, error)
      return null
    }
  }

  /**
   * Analyze code contributions by a contributor
   */
  private async analyzeCodeContributions(contributor: Contributor): Promise<KnowledgeCapture[]> {
    const contributions: KnowledgeCapture[] = []
    const codeFiles = await this.findCodeFiles()

    for (const filePath of codeFiles) {
      try {
        // Check if contributor contributed to this file
        const authorOutput = execSync(
          `git log --author="${contributor.email}" --pretty=format:"%H" -- "${filePath}" | head -1`,
          { cwd: this.repositoryPath, encoding: 'utf-8' }
        ).trim()

        if (!authorOutput) continue

        const content = await readFile(filePath, 'utf-8')
        const analysis = await this.analyzeCodeForExpertise(content, filePath)
        
        if (analysis.hasValue) {
          contributions.push({
            id: `code-${filePath}-${contributor.email}`,
            title: analysis.title,
            content,
            summary: analysis.summary,
            source: 'code',
            category: analysis.category,
            tags: [...analysis.tags, this.getLanguageFromPath(filePath)],
            expertise: analysis.expertise,
            timestamp: authorOutput,
            author: contributor.name,
            authorEmail: contributor.email,
            repository: this.getRepositoryName(),
            filePath,
            citations: [],
            quality: {
              clarity: 80,
              accuracy: 85,
              completeness: 75,
              relevance: 80,
              overall: 80
            },
            metadata: {
              language: this.getLanguageFromPath(filePath),
              complexity: analysis.complexity,
              patterns: analysis.patterns
            }
          })
        }
      } catch (error) {
        // Skip files that can't be processed
      }
    }

    return contributions
  }

  /**
   * Analyze content for expertise indicators
   */
  private async analyzeContentForExpertise(content: string): Promise<{
    hasValue: boolean
    summary: string
    category: KnowledgeCategory
    tags: string[]
    expertise: ExpertiseLevel
    impact: 'low' | 'medium' | 'high'
  }> {
    const lowerContent = content.toLowerCase()
    
    // Expertise indicators
    const expertiseIndicators = {
      expert: ['architecture', 'design pattern', 'comprehensive', 'deep dive', 'expert', 'master'],
      advanced: ['complex', 'advanced', 'optimize', 'refactor', 'improve', 'enhance'],
      intermediate: ['implement', 'add', 'feature', 'update', 'modify'],
      beginner: ['basic', 'simple', 'fix', 'typo', 'minor', 'small']
    }

    let expertiseLevel: ExpertiseLevel = 'beginner'
    let maxScore = 0

    for (const [level, indicators] of Object.entries(expertiseIndicators)) {
      const score = indicators.reduce((count, indicator) => 
        count + (lowerContent.includes(indicator) ? 1 : 0), 0
      )
      if (score > maxScore) {
        maxScore = score
        expertiseLevel = level as ExpertiseLevel
      }
    }

    // Categorize content
    const category = this.categorizeContent(lowerContent)
    
    // Extract tags
    const tags = this.extractTags(lowerContent)
    
    // Generate summary
    const summary = this.generateSummary(content)
    
    // Assess impact
    const impact = this.assessImpact(lowerContent)

    return {
      hasValue: maxScore > 0,
      summary,
      category,
      tags,
      expertise: expertiseLevel,
      impact
    }
  }

  /**
   * Analyze code for expertise indicators
   */
  private async analyzeCodeForExpertise(content: string, filePath: string): Promise<{
    hasValue: boolean
    title: string
    summary: string
    category: KnowledgeCategory
    tags: string[]
    expertise: ExpertiseLevel
    complexity: number
    patterns: string[]
  }> {
    const analysis = await this.analyzeContentForExpertise(content)
    
    if (!analysis.hasValue) {
      return {
        hasValue: false,
        title: '',
        summary: '',
        category: 'best-practices',
        tags: [],
        expertise: 'beginner',
        complexity: 0,
        patterns: []
      }
    }

    const language = this.getLanguageFromPath(filePath)
    const patterns = this.extractCodePatterns(content, language)
    const complexity = this.calculateComplexity(content, language)
    const title = this.extractTitleFromCode(content, filePath)

    return {
      hasValue: true,
      title,
      summary: analysis.summary,
      category: analysis.category,
      tags: [...analysis.tags, language, ...patterns],
      expertise: analysis.expertise,
      complexity,
      patterns
    }
  }

  /**
   * Analyze expertise areas from contributions
   */
  private async analyzeExpertiseAreas(contributions: KnowledgeCapture[]): Promise<ExpertiseArea[]> {
    const areaMap = new Map<KnowledgeCategory, ExpertiseAreaData>()

    // Group contributions by category
    for (const contribution of contributions) {
      const category = contribution.category
      const existing = areaMap.get(category) || {
        contributions: 0,
        totalQuality: 0,
        expertiseLevels: [],
        lastContribution: ''
      }

      existing.contributions++
      existing.totalQuality += contribution.quality.overall
      existing.expertiseLevels.push(contribution.expertise)
      
      if (!existing.lastContribution || 
          new Date(contribution.timestamp) > new Date(existing.lastContribution)) {
        existing.lastContribution = contribution.timestamp
      }

      areaMap.set(category, existing)
    }

    // Convert to expertise areas
    const expertiseAreas: ExpertiseArea[] = []
    
    for (const [category, data] of areaMap) {
      const avgQuality = data.totalQuality / data.contributions
      const level = this.determineExpertiseLevelFromContributions(data.expertiseLevels)
      const confidence = Math.min(100, Math.round(avgQuality * (data.contributions / 10)))
      
      const expertiseArea: ExpertiseArea = {
        category,
        level,
        confidence,
        contributions: data.contributions,
        endorsements: Math.floor(data.contributions * 0.3), // Estimate
        lastContribution: data.lastContribution
      }

      expertiseAreas.push(expertiseArea)
    }

    return expertiseAreas.sort((a, b) => b.confidence - a.confidence)
  }

  /**
   * Calculate activity metrics
   */
  private calculateActivityMetrics(contributions: KnowledgeCapture[]): ActivityMetrics {
    const totalContributions = contributions.length
    const contributionsByCategory: Record<KnowledgeCategory, number> = {} as any
    const contributionsBySource: Record<string, number> = {} as any
    let totalQuality = 0

    for (const contribution of contributions) {
      // Count by category
      contributionsByCategory[contribution.category] = 
        (contributionsByCategory[contribution.category] || 0) + 1
      
      // Count by source
      contributionsBySource[contribution.source] = 
        (contributionsBySource[contribution.source] || 0) + 1
      
      totalQuality += contribution.quality.overall
    }

    const averageQuality = totalContributions > 0 ? totalQuality / totalContributions : 0
    
    // Calculate response time (mock - would need PR data for real calculation)
    const responseTime = this.calculateResponseTime(contributions)
    
    // Calculate collaboration score
    const collaborationScore = this.calculateCollaborationScore(contributions)

    return {
      totalContributions,
      contributionsByCategory,
      contributionsBySource,
      averageQuality,
      responseTime,
      collaborationScore
    }
  }

  /**
   * Calculate reputation metrics
   */
  private calculateReputationMetrics(
    contributor: Contributor, 
    contributions: KnowledgeCapture[]
  ): ReputationMetrics {
    const score = this.calculateReputationScore(contributions)
    const badges = this.generateBadges(contributions)
    
    return {
      score,
      rank: 0, // Would be calculated after sorting all profiles
      endorsements: Math.floor(contributions.length * 0.4),
      helpfulVotes: Math.floor(contributions.length * 2.5),
      mentorshipPoints: Math.floor(contributions.filter(c => c.expertise === 'expert').length * 10),
      knowledgeShared: contributions.length,
      badges
    }
  }

  /**
   * Estimate availability (mock implementation)
   */
  private async estimateAvailability(contributor: Contributor): Promise<AvailabilityInfo> {
    // In a real implementation, this would analyze calendar data, activity patterns, etc.
    return {
      timezone: 'UTC',
      workingHours: {
        start: '09:00',
        end: '17:00'
      },
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      currentLoad: 60, // Mock value
      mentorshipCapacity: 2
    }
  }

  /**
   * Build mentorship profile
   */
  private async buildMentorshipProfile(
    contributor: Contributor, 
    areas: ExpertiseArea[]
  ): Promise<MentorshipProfile> {
    const expertAreas = areas.filter(area => area.level === 'expert' || area.level === 'advanced')
    
    return {
      mentorshipStyle: this.determineMentorshipStyle(contributor),
      preferredTopics: expertAreas.map(area => area.category),
      menteeCount: 0, // Would be tracked separately
      successRate: 85, // Mock value
      mentorshipSessions: [] // Would be loaded from tracking system
    }
  }

  /**
   * Helper methods
   */
  private categorizeContent(content: string): KnowledgeCategory {
    const categories: Record<KnowledgeCategory, string[]> = {
      architecture: ['architecture', 'design', 'pattern', 'structure', 'component'],
      security: ['security', 'auth', 'permission', 'vulnerability', 'encrypt', 'secure'],
      performance: ['performance', 'optimize', 'speed', 'memory', 'cpu', 'cache'],
      testing: ['test', 'spec', 'mock', 'coverage', 'assert', 'unit', 'integration'],
      deployment: ['deploy', 'release', 'build', 'ci', 'cd', 'production'],
      monitoring: ['monitor', 'log', 'metric', 'alert', 'health', 'trace'],
      governance: ['policy', 'compliance', 'audit', 'rule', 'standard'],
      'best-practices': ['best practice', 'recommendation', 'guideline', 'standard'],
      troubleshooting: ['fix', 'bug', 'issue', 'error', 'problem', 'debug'],
      onboarding: ['setup', 'install', 'configure', 'getting started', 'tutorial']
    }

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => content.includes(keyword))) {
        return category as KnowledgeCategory
      }
    }

    return 'best-practices'
  }

  private extractTags(content: string): string[] {
    const tags = new Set<string>()
    
    // Extract common tech terms
    const techTerms = [
      'api', 'database', 'frontend', 'backend', 'react', 'typescript', 'nodejs',
      'docker', 'kubernetes', 'aws', 'azure', 'github', 'git', 'ci', 'cd',
      'security', 'performance', 'testing', 'deployment', 'monitoring'
    ]
    
    techTerms.forEach(term => {
      if (content.toLowerCase().includes(term)) {
        tags.add(term)
      }
    })

    return Array.from(tags).slice(0, 10)
  }

  private generateSummary(content: string): string {
    const lines = content.split('\n').filter(line => line.trim())
    const firstLine = lines[0] || ''
    
    if (firstLine.length <= 200) {
      return firstLine
    }

    return firstLine.substring(0, 197) + '...'
  }

  private assessImpact(content: string): 'low' | 'medium' | 'high' {
    const highImpactIndicators = ['security', 'critical', 'breaking', 'major', 'architecture']
    const mediumImpactIndicators = ['feature', 'improve', 'optimize', 'refactor']
    
    const lowerContent = content.toLowerCase()

    if (highImpactIndicators.some(indicator => lowerContent.includes(indicator))) {
      return 'high'
    }
    if (mediumImpactIndicators.some(indicator => lowerContent.includes(indicator))) {
      return 'medium'
    }
    
    return 'low'
  }

  private categorizeCommitType(subject: string): string {
    const lowerSubject = subject.toLowerCase()
    
    if (lowerSubject.startsWith('feat')) return 'feature'
    if (lowerSubject.startsWith('fix')) return 'bugfix'
    if (lowerSubject.startsWith('docs')) return 'documentation'
    if (lowerSubject.startsWith('style')) return 'formatting'
    if (lowerSubject.startsWith('refactor')) return 'refactoring'
    if (lowerSubject.startsWith('test')) return 'testing'
    if (lowerSubject.startsWith('chore')) return 'maintenance'
    
    return 'other'
  }

  private getRepositoryName(): string {
    try {
      const remoteUrl = execSync(
        'git config --get remote.origin.url',
        { cwd: this.repositoryPath, encoding: 'utf-8' }
      ).trim()
      
      const match = remoteUrl.match(/github\.com[:\/](.+?)(?:\.git)?$/)
      return match ? match[1] : 'unknown-repo'
    } catch {
      return 'unknown-repo'
    }
  }

  private async findCodeFiles(): Promise<string[]> {
    const files: string[] = []
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.cpp', '.c', '.go', '.rs']
    
    async function scanDirectory(dir: string): Promise<void> {
      const entries = await readdir(dir, { withFileTypes: true })
      
      for (const entry of entries) {
        const fullPath = join(dir, entry.name)
        
        if (entry.isDirectory() && !this.excludePatterns.includes(entry.name)) {
          await scanDirectory(fullPath)
        } else if (entry.isFile() && extensions.includes(extname(entry.name))) {
          files.push(fullPath)
        }
      }
    }
    
    await scanDirectory(this.repositoryPath)
    return files
  }

  private getLanguageFromPath(filePath: string): string {
    const ext = extname(filePath).toLowerCase()
    const languageMap: Record<string, string> = {
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.py': 'python',
      '.java': 'java',
      '.cpp': 'cpp',
      '.c': 'c',
      '.go': 'go',
      '.rs': 'rust'
    }
    
    return languageMap[ext] || 'unknown'
  }

  private extractCodePatterns(content: string, language: string): string[] {
    const patterns = new Set<string>()
    
    if (content.includes('class ')) patterns.add('class')
    if (content.includes('function ') || content.includes('def ')) patterns.add('function')
    if (content.includes('interface ')) patterns.add('interface')
    if (content.includes('async ')) patterns.add('async')
    if (content.includes('await ')) patterns.add('await')
    if (content.includes('try ') || content.includes('catch')) patterns.add('error-handling')
    
    if (language === 'typescript') {
      if (content.includes('type ')) patterns.add('type')
      if (content.includes('enum ')) patterns.add('enum')
      if (content.includes('namespace ')) patterns.add('namespace')
    }
    
    return Array.from(patterns)
  }

  private calculateComplexity(content: string, language: string): number {
    const lines = content.split('\n').length
    const nestingLevel = (content.match(/^\s*/gm) || [])
      .map(line => line.length)
      .reduce((max, spaces) => Math.max(max, spaces), 0)
    
    const baseComplexity = Math.log(lines + 1)
    const nestingComplexity = nestingLevel / 10
    const patternComplexity = this.extractCodePatterns(content, language).length * 0.5
    
    return Math.min(100, Math.round((baseComplexity + nestingComplexity + patternComplexity) * 10))
  }

  private extractTitleFromCode(content: string, filePath: string): string {
    const lines = content.split('\n')
    const fileName = basename(filePath, extname(filePath))
    
    for (const line of lines.slice(0, 10)) {
      const classMatch = line.match(/class\s+(\w+)/)
      if (classMatch) return classMatch[1]
      
      const functionMatch = line.match(/(?:function|def)\s+(\w+)/)
      if (functionMatch) return functionMatch[1]
      
      const interfaceMatch = line.match(/interface\s+(\w+)/)
      if (interfaceMatch) return interfaceMatch[1]
    }
    
    return fileName
  }

  private determineExpertiseLevelFromContributions(levels: ExpertiseLevel[]): ExpertiseLevel {
    if (levels.length === 0) return 'beginner'
    
    const levelCounts = levels.reduce((counts, level) => {
      counts[level] = (counts[level] || 0) + 1
      return counts
    }, {} as Record<ExpertiseLevel, number>)
    
    const maxCount = Math.max(...Object.values(levelCounts))
    const dominantLevels = Object.entries(levelCounts)
      .filter(([_, count]) => count === maxCount)
      .map(([level]) => level as ExpertiseLevel)
    
    // Prefer higher levels if there's a tie
    if (dominantLevels.includes('expert')) return 'expert'
    if (dominantLevels.includes('advanced')) return 'advanced'
    if (dominantLevels.includes('intermediate')) return 'intermediate'
    return 'beginner'
  }

  private calculateResponseTime(contributions: KnowledgeCapture[]): number {
    // Mock calculation - in reality would analyze PR response times
    return 4.5 // hours
  }

  private calculateCollaborationScore(contributions: KnowledgeCapture[]): number {
    // Calculate based on variety of sources and categories
    const uniqueSources = new Set(contributions.map(c => c.source)).size
    const uniqueCategories = new Set(contributions.map(c => c.category)).size
    
    return Math.min(100, (uniqueSources * 20) + (uniqueCategories * 10))
  }

  private getLastActiveDate(contributions: KnowledgeCapture[]): string {
    if (contributions.length === 0) return new Date().toISOString()
    
    return contributions[0].timestamp
  }

  private calculateReputationScore(contributions: KnowledgeCapture[]): number {
    let score = 0
    
    for (const contribution of contributions) {
      // Base points for contribution
      score += 10
      
      // Quality bonus
      score += Math.round(contribution.quality.overall / 10)
      
      // Expertise level bonus
      const expertiseBonus = {
        beginner: 0,
        intermediate: 5,
        advanced: 15,
        expert: 25
      }
      score += expertiseBonus[contribution.expertise]
      
      // Category importance bonus
      const categoryBonus = {
        architecture: 20,
        security: 20,
        performance: 15,
        testing: 10,
        deployment: 10,
        monitoring: 10,
        governance: 15,
        'best-practices': 5,
        troubleshooting: 10,
        onboarding: 5
      }
      score += categoryBonus[contribution.category]
    }
    
    return Math.min(1000, score) // Cap at 1000
  }

  private generateBadges(contributions: KnowledgeCapture[]): Badge[] {
    const badges: Badge[] = []
    const now = new Date().toISOString()
    
    // Contribution badges
    if (contributions.length >= 10) {
      badges.push({
        id: 'contributor-bronze',
        name: 'Contributor - Bronze',
        description: 'Made 10+ knowledge contributions',
        icon: '🥉',
        earnedAt: now,
        category: 'contribution'
      })
    }
    
    if (contributions.length >= 50) {
      badges.push({
        id: 'contributor-silver',
        name: 'Contributor - Silver',
        description: 'Made 50+ knowledge contributions',
        icon: '🥈',
        earnedAt: now,
        category: 'contribution'
      })
    }
    
    if (contributions.length >= 100) {
      badges.push({
        id: 'contributor-gold',
        name: 'Contributor - Gold',
        description: 'Made 100+ knowledge contributions',
        icon: '🥇',
        earnedAt: now,
        category: 'contribution'
      })
    }
    
    // Expertise badges
    const categories = new Set(contributions.map(c => c.category))
    if (categories.size >= 5) {
      badges.push({
        id: 'polymath',
        name: 'Polymath',
        description: 'Contributed to 5+ different knowledge categories',
        icon: '🧠',
        earnedAt: now,
        category: 'expertise'
      })
    }
    
    // Quality badges
    const avgQuality = contributions.reduce((sum, c) => sum + c.quality.overall, 0) / contributions.length
    if (avgQuality >= 90) {
      badges.push({
        id: 'quality-expert',
        name: 'Quality Expert',
        description: 'Maintained 90+ average quality score',
        icon: '⭐',
        earnedAt: now,
        category: 'expertise'
      })
    }
    
    return badges
  }

  private determineMentorshipStyle(contributor: Contributor): 'hands-on' | 'guidance' | 'review' | 'collaborative' {
    // Mock determination - could be based on analysis of contribution patterns
    return 'collaborative'
  }
}

interface Contributor {
  name: string
  email: string
}

interface ExpertiseAreaData {
  contributions: number
  totalQuality: number
  expertiseLevels: ExpertiseLevel[]
  lastContribution: string
}
