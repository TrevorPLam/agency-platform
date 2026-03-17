/**
 * Automated Knowledge Capture System
 * 
 * This module implements automated knowledge capture from various sources
 * including git commits, pull requests, issues, and documentation.
 */

import { z } from 'zod'
import { execSync } from 'child_process'
import { readFile, readdir, stat } from 'fs/promises'
import { join, extname, basename } from 'path'
import { 
  KnowledgeCapture, 
  KnowledgeSource, 
  KnowledgeCategory, 
  ExpertiseLevel,
  CreateKnowledgeCapture,
  QualityMetrics,
  Citation 
} from './types'

// Validation schemas
const CreateKnowledgeCaptureSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(10),
  summary: z.string().min(1).max(500),
  source: z.enum(['commit', 'pr', 'discussion', 'meeting', 'documentation', 'code', 'issue']),
  category: z.enum([
    'architecture', 'security', 'performance', 'testing', 'deployment',
    'monitoring', 'governance', 'best-practices', 'troubleshooting', 'onboarding'
  ]),
  tags: z.array(z.string()).max(10),
  expertise: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  author: z.string().email(),
  authorEmail: z.string().email(),
  repository: z.string(),
  filePath: z.string().optional(),
  prNumber: z.number().optional(),
  commitHash: z.string().optional(),
  issueNumber: z.number().optional(),
  citations: z.array(z.object({
    id: z.string(),
    url: z.string().url(),
    title: z.string(),
    snippet: z.string(),
    confidence: z.number().min(0).max(1),
    type: z.enum(['file', 'commit', 'pr', 'issue', 'documentation'])
  })).optional(),
  metadata: z.record(z.unknown()).optional()
})

export class KnowledgeCaptureEngine {
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
   * Capture knowledge from git commits
   */
  async captureFromCommits(since?: string, limit: number = 50): Promise<KnowledgeCapture[]> {
    try {
      const gitCommand = since 
        ? `git log --since="${since}" --pretty=format:"%H|%an|%ae|%s|%b" --no-pager -n ${limit}`
        : `git log --pretty=format:"%H|%an|%ae|%s|%b" --no-pager -n ${limit}`
      
      const output = execSync(gitCommand, { 
        cwd: this.repositoryPath, 
        encoding: 'utf-8' 
      })
      
      const commits = output.split('\n').filter(line => line.trim())
      const captures: KnowledgeCapture[] = []

      for (const commit of commits) {
        const [hash, author, email, subject, body] = commit.split('|')
        const capture = await this.processCommit(hash, author, email, subject, body)
        if (capture) {
          captures.push(capture)
        }
      }

      return captures
    } catch (error) {
      console.error('Error capturing from commits:', error)
      return []
    }
  }

  /**
   * Process a single commit into knowledge capture
   */
  private async processCommit(
    hash: string, 
    author: string, 
    email: string, 
    subject: string, 
    body: string
  ): Promise<KnowledgeCapture | null> {
    try {
      // Get changed files
      const changedFiles = execSync(
        `git show --name-only --pretty=format:"" ${hash}`,
        { cwd: this.repositoryPath, encoding: 'utf-8' }
      ).trim().split('\n').filter(f => f.trim())

      // Analyze commit content for knowledge value
      const fullMessage = `${subject}\n\n${body}`
      const analysis = await this.analyzeContent(fullMessage, changedFiles)
      
      if (!analysis.hasValue) {
        return null
      }

      const capture: CreateKnowledgeCapture = {
        title: this.extractTitle(subject, body),
        content: fullMessage,
        summary: analysis.summary,
        source: 'commit',
        category: analysis.category,
        tags: analysis.tags,
        expertise: analysis.expertise,
        author: email,
        authorEmail: email,
        repository: this.getRepositoryName(),
        commitHash: hash,
        citations: await this.generateCitations(hash, changedFiles),
        metadata: {
          changedFiles,
          commitType: this.categorizeCommitType(subject),
          impact: analysis.impact
        }
      }

      const validated = CreateKnowledgeCaptureSchema.parse(capture)
      return this.createKnowledgeCapture(validated)
    } catch (error) {
      console.error(`Error processing commit ${hash}:`, error)
      return null
    }
  }

  /**
   * Capture knowledge from code files
   */
  async captureFromCode(directory: string = this.repositoryPath): Promise<KnowledgeCapture[]> {
    const captures: KnowledgeCapture[] = []
    const codeFiles = await this.findCodeFiles(directory)

    for (const filePath of codeFiles) {
      try {
        const content = await readFile(filePath, 'utf-8')
        const analysis = await this.analyzeCodeContent(content, filePath)
        
        if (analysis.hasValue) {
          const capture: CreateKnowledgeCapture = {
            title: analysis.title,
            content: content,
            summary: analysis.summary,
            source: 'code',
            category: analysis.category,
            tags: analysis.tags,
            expertise: analysis.expertise,
            author: this.extractAuthorFromGit(filePath),
            authorEmail: this.extractAuthorEmailFromGit(filePath),
            repository: this.getRepositoryName(),
            filePath,
            metadata: {
              language: this.getLanguageFromPath(filePath),
              complexity: analysis.complexity,
              patterns: analysis.patterns
            }
          }

          const validated = CreateKnowledgeCaptureSchema.parse(capture)
          captures.push(this.createKnowledgeCapture(validated))
        }
      } catch (error) {
        console.error(`Error processing file ${filePath}:`, error)
      }
    }

    return captures
  }

  /**
   * Analyze content for knowledge value
   */
  private async analyzeContent(content: string, context: string[] = []): Promise<{
    hasValue: boolean
    summary: string
    category: KnowledgeCategory
    tags: string[]
    expertise: ExpertiseLevel
    impact: 'low' | 'medium' | 'high'
  }> {
    const lowerContent = content.toLowerCase()
    
    // Knowledge indicators
    const knowledgeIndicators = [
      'fix', 'bug', 'issue', 'problem', 'solution', 'implement', 'add', 'feature',
      'improve', 'optimize', 'refactor', 'update', 'security', 'performance',
      'test', 'deploy', 'monitor', 'architecture', 'design', 'pattern',
      'best practice', 'lesson learned', 'note', 'warning', 'important'
    ]

    const hasKnowledge = knowledgeIndicators.some(indicator => 
      lowerContent.includes(indicator)
    )

    if (!hasKnowledge) {
      return {
        hasValue: false,
        summary: '',
        category: 'best-practices',
        tags: [],
        expertise: 'beginner',
        impact: 'low'
      }
    }

    // Categorize content
    const category = this.categorizeContent(lowerContent)
    
    // Extract tags
    const tags = this.extractTags(lowerContent, context)
    
    // Determine expertise level
    const expertise = this.determineExpertiseLevel(lowerContent, context)
    
    // Generate summary
    const summary = this.generateSummary(content)
    
    // Assess impact
    const impact = this.assessImpact(lowerContent, context)

    return {
      hasValue: true,
      summary,
      category,
      tags,
      expertise,
      impact
    }
  }

  /**
   * Analyze code content for knowledge value
   */
  private async analyzeCodeContent(content: string, filePath: string): Promise<{
    hasValue: boolean
    title: string
    summary: string
    category: KnowledgeCategory
    tags: string[]
    expertise: ExpertiseLevel
    complexity: number
    patterns: string[]
  }> {
    const language = this.getLanguageFromPath(filePath)
    const analysis = await this.analyzeContent(content, [filePath])
    
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

    // Extract code-specific patterns
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
   * Categorize content based on keywords
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

  /**
   * Extract tags from content
   */
  private extractTags(content: string, context: string[]): string[] {
    const tags = new Set<string>()
    
    // Extract hashtags
    const hashtagMatches = content.match(/#\w+/g)
    if (hashtagMatches) {
      hashtagMatches.forEach(tag => tags.add(tag.slice(1)))
    }

    // Extract mentions
    const mentionMatches = content.match(/@\w+/g)
    if (mentionMatches) {
      mentionMatches.forEach(mention => tags.add(mention.slice(1)))
    }

    // Extract file extensions from context
    context.forEach(file => {
      const ext = extname(file).slice(1)
      if (ext) tags.add(ext)
    })

    // Extract common tech terms
    const techTerms = [
      'api', 'database', 'frontend', 'backend', 'react', 'typescript', 'nodejs',
      'docker', 'kubernetes', 'aws', 'azure', 'github', 'git', 'ci', 'cd'
    ]
    
    techTerms.forEach(term => {
      if (content.includes(term)) {
        tags.add(term)
      }
    })

    return Array.from(tags).slice(0, 10)
  }

  /**
   * Determine expertise level
   */
  private determineExpertiseLevel(content: string, context: string[]): ExpertiseLevel {
    const beginnerIndicators = ['basic', 'simple', 'getting started', 'intro', 'tutorial']
    const intermediateIndicators = ['improve', 'refactor', 'optimize', 'implement']
    const advancedIndicators = ['architecture', 'design pattern', 'complex', 'advanced']
    const expertIndicators = ['expert', 'deep dive', 'comprehensive', 'master']

    const lowerContent = content.toLowerCase()

    if (expertIndicators.some(indicator => lowerContent.includes(indicator))) {
      return 'expert'
    }
    if (advancedIndicators.some(indicator => lowerContent.includes(indicator))) {
      return 'advanced'
    }
    if (intermediateIndicators.some(indicator => lowerContent.includes(indicator))) {
      return 'intermediate'
    }
    if (beginnerIndicators.some(indicator => lowerContent.includes(indicator))) {
      return 'beginner'
    }

    // Default based on context complexity
    return context.length > 5 ? 'intermediate' : 'beginner'
  }

  /**
   * Generate summary
   */
  private generateSummary(content: string): string {
    const lines = content.split('\n').filter(line => line.trim())
    const firstLine = lines[0] || ''
    
    if (firstLine.length <= 200) {
      return firstLine
    }

    return firstLine.substring(0, 197) + '...'
  }

  /**
   * Assess impact
   */
  private assessImpact(content: string, context: string[]): 'low' | 'medium' | 'high' {
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

  /**
   * Helper methods
   */
  private extractTitle(subject: string, body: string): string {
    return subject.length > 200 ? subject.substring(0, 197) + '...' : subject
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

  private async generateCitations(commitHash: string, files: string[]): Promise<Citation[]> {
    const citations: Citation[] = []
    
    for (const file of files.slice(0, 5)) { // Limit to 5 files
      try {
        const fileUrl = `https://github.com/${this.getRepositoryName()}/blob/${commitHash}/${file}`
        citations.push({
          id: `file-${file}`,
          url: fileUrl,
          title: basename(file),
          snippet: `Modified file: ${file}`,
          confidence: 0.8,
          type: 'file'
        })
      } catch (error) {
        // Skip files that can't be cited
      }
    }

    return citations
  }

  private extractAuthorFromGit(filePath: string): string {
    try {
      const output = execSync(
        `git log -1 --pretty=format:"%an" -- "${filePath}"`,
        { cwd: this.repositoryPath, encoding: 'utf-8' }
      ).trim()
      return output || 'unknown'
    } catch {
      return 'unknown'
    }
  }

  private extractAuthorEmailFromGit(filePath: string): string {
    try {
      const output = execSync(
        `git log -1 --pretty=format:"%ae" -- "${filePath}"`,
        { cwd: this.repositoryPath, encoding: 'utf-8' }
      ).trim()
      return output || 'unknown@example.com'
    } catch {
      return 'unknown@example.com'
    }
  }

  private getRepositoryName(): string {
    try {
      const remoteUrl = execSync(
        'git config --get remote.origin.url',
        { cwd: this.repositoryPath, encoding: 'utf-8' }
      ).trim()
      
      // Extract repo name from git URL
      const match = remoteUrl.match(/github\.com[:\/](.+?)(?:\.git)?$/)
      return match ? match[1] : 'unknown-repo'
    } catch {
      return 'unknown-repo'
    }
  }

  private async findCodeFiles(directory: string): Promise<string[]> {
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
    
    await scanDirectory(directory)
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
    
    // Common patterns across languages
    if (content.includes('class ')) patterns.add('class')
    if (content.includes('function ') || content.includes('def ')) patterns.add('function')
    if (content.includes('interface ')) patterns.add('interface')
    if (content.includes('async ')) patterns.add('async')
    if (content.includes('await ')) patterns.add('await')
    if (content.includes('try ') || content.includes('catch')) patterns.add('error-handling')
    
    // Language-specific patterns
    if (language === 'typescript') {
      if (content.includes('type ')) patterns.add('type')
      if (content.includes('enum ')) patterns.add('enum')
      if (content.includes('namespace ')) patterns.add('namespace')
    }
    
    return Array.from(patterns)
  }

  private calculateComplexity(content: string, language: string): number {
    // Simple complexity calculation based on lines, nesting, and patterns
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
    
    // Look for class/function definitions
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

  /**
   * Create a knowledge capture with generated metadata
   */
  private createKnowledgeCapture(data: CreateKnowledgeCapture): KnowledgeCapture {
    return {
      ...data,
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      quality: this.calculateQuality(data)
    }
  }

  private generateId(): string {
    return `kc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private calculateQuality(data: CreateKnowledgeCapture): QualityMetrics {
    // Simple quality calculation based on content metrics
    const contentLength = data.content.length
    const summaryLength = data.summary.length
    const tagCount = data.tags.length
    
    // Base quality calculations
    const clarity = Math.min(100, Math.max(0, 
      (summaryLength > 50 ? 20 : 0) + 
      (data.title.length > 10 ? 20 : 0) +
      (contentLength > 100 ? 20 : 0)
    ))
    
    const completeness = Math.min(100, Math.max(0,
      (tagCount > 0 ? 25 : 0) +
      (data.citations.length > 0 ? 25 : 0) +
      (contentLength > 500 ? 25 : 0) +
      (Object.keys(data.metadata).length > 0 ? 25 : 0)
    ))
    
    const relevance = Math.min(100, Math.max(0,
      (data.category !== 'best-practices' ? 30 : 0) +
      (data.expertise !== 'beginner' ? 20 : 0) +
      (tagCount >= 3 ? 25 : 0) +
      (contentLength > 200 ? 25 : 0)
    ))
    
    const accuracy = 85 // Default accuracy, would be improved with AI analysis
    
    const overall = Math.round((clarity + completeness + relevance + accuracy) / 4)
    
    return {
      clarity,
      accuracy,
      completeness,
      relevance,
      overall
    }
  }
}
