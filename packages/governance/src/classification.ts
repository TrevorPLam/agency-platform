/**
 * Repository Classification Engine
 * 
 * Automatically classifies repositories based on semantic analysis of
 * file structure, commit patterns, and content characteristics.
 */

import { Octokit } from '@octokit/rest'
import { 
  RepositoryProperties, 
  GitHubRepository, 
  RiskAssessment,
  RiskFactor,
  ComplianceFramework
} from './types'

export interface RepositoryAnalysis {
  repository: GitHubRepository
  fileStructure: FileStructureAnalysis
  commitPatterns: CommitPatternAnalysis
  contentSignals: ContentSignalAnalysis
  classification: RepositoryClassification
  riskAssessment: RiskAssessment
  recommendedProperties: Partial<RepositoryProperties>
}

export interface FileStructureAnalysis {
  totalFiles: number
  directories: string[]
  fileTypes: Record<string, number>
  frameworkIndicators: FrameworkIndicator[]
  architecturePatterns: ArchitecturePattern[]
  securityIndicators: SecurityIndicator[]
  complianceIndicators: ComplianceIndicator[]
}

export interface CommitPatternAnalysis {
  totalCommits: number
  commitFrequency: number
  commitTypes: Record<string, number>
  commitMessagePatterns: CommitMessagePattern[]
  contributorPatterns: ContributorPattern[]
  codeChangePatterns: CodeChangePattern[]
}

export interface ContentSignalAnalysis {
  languages: Record<string, number>
  dependencies: DependencyAnalysis
  configurations: ConfigurationAnalysis
  documentation: DocumentationAnalysis
  testing: TestingAnalysis
}

export interface RepositoryClassification {
  category: RepositoryCategory
  subcategory: string
  confidence: number
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical'
  businessCriticality: RepositoryProperties['business_criticality']
  serviceTier: RepositoryProperties['service_tier']
  dataClassification: RepositoryProperties['data_classification']
  securityClassification: RepositoryProperties['security_classification']
  recommendedFrameworks: ComplianceFramework[]
}

export type RepositoryCategory = 
  | 'Platform Infrastructure'
  | 'Client Application' 
  | 'Shared Library'
  | 'Data Pipeline'
  | 'Security Tool'
  | 'DevOps Tool'
  | 'Documentation'
  | 'Experimental'
  | 'Archive'

export interface FrameworkIndicator {
  framework: string
  confidence: number
  files: string[]
  description: string
}

export interface ArchitecturePattern {
  pattern: string
  confidence: number
  indicators: string[]
}

export interface SecurityIndicator {
  type: 'security_scan' | 'auth' | 'encryption' | 'audit' | 'vulnerability'
  present: boolean
  files: string[]
  confidence: number
}

export interface ComplianceIndicator {
  framework: ComplianceFramework
  present: boolean
  files: string[]
  confidence: number
}

export interface CommitMessagePattern {
  pattern: string
  frequency: number
  type: 'feature' | 'bugfix' | 'hotfix' | 'refactor' | 'docs' | 'test' | 'chore' | 'security'
  examples: string[]
}

export interface ContributorPattern {
  contributorType: 'core' | 'occasional' | 'external' | 'bot'
  count: number
  contributionPercentage: number
}

export interface CodeChangePattern {
  changeType: 'addition' | 'deletion' | 'modification' | 'refactoring'
  frequency: number
  averageSize: number
  hotspots: string[]
}

export interface DependencyAnalysis {
  total: number
  external: number
  internal: number
  categories: Record<string, number>
  securityVulnerabilities: number
  outdatedPackages: number
}

export interface ConfigurationAnalysis {
  hasCI: boolean
  hasCD: boolean
  hasTesting: boolean
  hasLinting: boolean
  hasSecurity: boolean
  hasMonitoring: boolean
  configFiles: string[]
}

export interface DocumentationAnalysis {
  hasReadme: boolean
  hasApiDocs: boolean
  hasArchitectureDocs: boolean
  hasContributing: boolean
  hasChangelog: boolean
  documentationCoverage: number
}

export interface TestingAnalysis {
  hasTests: boolean
  testFrameworks: string[]
  testCoverage: number
  testTypes: ('unit' | 'integration' | 'e2e' | 'performance' | 'security')[]
}

/**
 * Repository Classification Engine
 */
export class ClassificationEngine {
  private octokit: Octokit
  private organization: string

  constructor(token: string, organization: string) {
    this.octokit = new Octokit({ auth: token })
    this.organization = organization
  }

  /**
   * Perform comprehensive repository analysis
   */
  async analyzeRepository(repoName: string): Promise<RepositoryAnalysis> {
    const repo = await this.getRepository(repoName)
    
    const [fileStructure, commitPatterns, contentSignals] = await Promise.all([
      this.analyzeFileStructure(repoName),
      this.analyzeCommitPatterns(repoName),
      this.analyzeContentSignals(repoName)
    ])

    const classification = this.classifyRepository(fileStructure, commitPatterns, contentSignals)
    const riskAssessment = this.assessRisk(classification, fileStructure, commitPatterns, contentSignals)
    const recommendedProperties = this.generateRecommendedProperties(classification, riskAssessment)

    return {
      repository: repo,
      fileStructure,
      commitPatterns,
      contentSignals,
      classification,
      riskAssessment,
      recommendedProperties
    }
  }

  /**
   * Analyze repository file structure
   */
  private async analyzeFileStructure(repoName: string): Promise<FileStructureAnalysis> {
    // Get repository tree
    const { data: tree } = await this.octokit.rest.git.getTree({
      owner: this.organization,
      repo: repoName,
      recursive: true
    })

    const files = tree.tree.filter(item => item.type === 'blob')
    const directories = [...new Set(files.map(file => this.getDirectory(file.path!)))]
    
    const fileTypes: Record<string, number> = {}
    files.forEach(file => {
      const ext = this.getFileExtension(file.path!)
      fileTypes[ext] = (fileTypes[ext] || 0) + 1
    })

    const frameworkIndicators = this.detectFrameworks(files)
    const architecturePatterns = this.detectArchitecturePatterns(files)
    const securityIndicators = this.detectSecurityIndicators(files)
    const complianceIndicators = this.detectComplianceIndicators(files)

    return {
      totalFiles: files.length,
      directories,
      fileTypes,
      frameworkIndicators,
      architecturePatterns,
      securityIndicators,
      complianceIndicators
    }
  }

  /**
   * Analyze commit patterns
   */
  private async analyzeCommitPatterns(repoName: string): Promise<CommitPatternAnalysis> {
    const { data: commits } = await this.octokit.rest.repos.listCommits({
      owner: this.organization,
      repo: repoName,
      per_page: 100,
      state: 'all'
    })

    const commitTypes: Record<string, number> = {}
    const commitMessagePatterns: CommitMessagePattern[] = []
    
    commits.forEach(commit => {
      if (commit.commit?.message) {
        const type = this.parseCommitType(commit.commit.message)
        commitTypes[type] = (commitTypes[type] || 0) + 1
      }
    })

    // Analyze patterns
    Object.entries(commitTypes).forEach(([type, frequency]) => {
      const examples = commits
        .filter(c => c.commit?.message && this.parseCommitType(c.commit.message) === type)
        .slice(0, 3)
        .map(c => c.commit?.message || '')

      commitMessagePatterns.push({
        pattern: type,
        frequency,
        type: this.mapCommitTypeToCategory(type),
        examples
      })
    })

    const contributorPatterns = this.analyzeContributorPatterns(commits)
    const codeChangePatterns = this.analyzeCodeChangePatterns(commits)

    return {
      totalCommits: commits.length,
      commitFrequency: this.calculateCommitFrequency(commits),
      commitTypes,
      commitMessagePatterns,
      contributorPatterns,
      codeChangePatterns
    }
  }

  /**
   * Analyze content signals
   */
  private async analyzeContentSignals(repoName: string): Promise<ContentSignalAnalysis> {
    const { data: repo } = await this.octokit.rest.repos.get({
      owner: this.organization,
      repo: repoName
    })

    const languages = await this.getLanguages(repoName)
    const dependencies = await this.analyzeDependencies(repoName)
    const configurations = await this.analyzeConfigurations(repoName)
    const documentation = await this.analyzeDocumentation(repoName)
    const testing = await this.analyzeTesting(repoName)

    return {
      languages,
      dependencies,
      configurations,
      documentation,
      testing
    }
  }

  /**
   * Classify repository based on analysis
   */
  private classifyRepository(
    fileStructure: FileStructureAnalysis,
    commitPatterns: CommitPatternAnalysis,
    contentSignals: ContentSignalAnalysis
  ): RepositoryClassification {
    const scores = this.calculateClassificationScores(fileStructure, commitPatterns, contentSignals)
    const topCategory = Object.entries(scores).reduce((a, b) => a[1] > b[1] ? a : b)

    const category = topCategory[0] as RepositoryCategory
    const confidence = topCategory[1] / 100 // Normalize to 0-1

    const riskLevel = this.calculateRiskLevel(fileStructure, commitPatterns, contentSignals)
    const businessCriticality = this.mapRiskToBusinessCriticality(riskLevel)
    const serviceTier = this.determineServiceTier(category, fileStructure)
    const dataClassification = this.determineDataClassification(category, contentSignals)
    const securityClassification = this.determineSecurityClassification(riskLevel, category)

    return {
      category,
      subcategory: this.determineSubcategory(category, fileStructure, contentSignals),
      confidence,
      riskLevel,
      businessCriticality,
      serviceTier,
      dataClassification,
      securityClassification,
      recommendedFrameworks: this.recommendComplianceFrameworks(category, riskLevel, contentSignals)
    }
  }

  /**
   * Assess repository risk
   */
  private assessRisk(
    classification: RepositoryClassification,
    fileStructure: FileStructureAnalysis,
    commitPatterns: CommitPatternAnalysis,
    contentSignals: ContentSignalAnalysis
  ): RiskAssessment {
    const factors: RiskFactor[] = []
    let totalScore = 0

    // Security risk factors
    if (fileStructure.securityIndicators.length === 0) {
      factors.push({
        factor: 'No security measures detected',
        weight: 0.3,
        value: 0.8,
        contribution: 0.24
      })
      totalScore += 0.24
    }

    // Testing risk factors
    if (!contentSignals.testing.hasTests) {
      factors.push({
        factor: 'No test suite detected',
        weight: 0.2,
        value: 0.7,
        contribution: 0.14
      })
      totalScore += 0.14
    }

    // Dependency risk factors
    if (contentSignals.dependencies.securityVulnerabilities > 0) {
      factors.push({
        factor: 'Security vulnerabilities in dependencies',
        weight: 0.25,
        value: Math.min(contentSignals.dependencies.securityVulnerabilities / 10, 1),
        contribution: 0.25 * Math.min(contentSignals.dependencies.securityVulnerabilities / 10, 1)
      })
      totalScore += 0.25 * Math.min(contentSignals.dependencies.securityVulnerabilities / 10, 1)
    }

    // Commit pattern risk factors
    if (commitPatterns.commitFrequency < 0.1) {
      factors.push({
        factor: 'Low commit frequency (stale repository)',
        weight: 0.15,
        value: 0.6,
        contribution: 0.09
      })
      totalScore += 0.09
    }

    // Documentation risk factors
    if (contentSignals.documentation.documentationCoverage < 0.3) {
      factors.push({
        factor: 'Poor documentation coverage',
        weight: 0.1,
        value: 0.5,
        contribution: 0.05
      })
      totalScore += 0.05
    }

    const score = Math.min(totalScore * 100, 100)
    const category = this.scoreToRiskCategory(score)

    return {
      score,
      category,
      factors,
      recommendations: this.generateRiskRecommendations(factors),
      last_assessed: new Date().toISOString()
    }
  }

  /**
   * Generate recommended repository properties
   */
  private generateRecommendedProperties(
    classification: RepositoryClassification,
    riskAssessment: RiskAssessment
  ): Partial<RepositoryProperties> {
    return {
      business_criticality: classification.businessCriticality,
      service_tier: classification.serviceTier,
      public_facing: classification.category === 'Client Application',
      compliance_frameworks: classification.recommendedFrameworks,
      data_classification: classification.dataClassification,
      environment: 'Production',
      security_classification: classification.securityClassification,
      lifecycle_stage: 'Maintenance',
      automated_tests: true,
      ci_cd_enabled: true,
      review_frequency: this.determineReviewFrequency(riskAssessment.category),
      tech_stack: Object.keys(this.getLanguagesFromContentSignals),
      architecture_pattern: this.mapCategoryToArchitecturePattern(classification.category),
      dependencies: this.determineDependencyType(classification.category),
      build_system: this.detectBuildSystem(classification.category)
    }
  }

  // Helper methods
  private async getRepository(repoName: string): Promise<GitHubRepository> {
    const { data: repo } = await this.octokit.rest.repos.get({
      owner: this.organization,
      repo: repoName
    })

    const properties = await this.getRepositoryProperties(repoName)

    return {
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      private: repo.private,
      owner: {
        login: repo.owner.login,
        id: repo.owner.id
      },
      custom_properties: properties as Record<string, any>,
      topics: repo.topics || [],
      language: repo.language,
      created_at: repo.created_at,
      updated_at: repo.updated_at,
      pushed_at: repo.pushed_at
    }
  }

  private async getRepositoryProperties(repoName: string): Promise<Partial<RepositoryProperties>> {
    try {
      const { data } = await this.octokit.rest.repos.getAllCustomPropertyValues({
        owner: this.organization,
        repo: repoName
      })

      const properties: Partial<RepositoryProperties> = {}
      
      data.forEach(prop => {
        const propertyName = prop.property_name
        const value = prop.value

        switch (propertyName) {
          case 'business_criticality':
            properties.business_criticality = value as any
            break
          case 'service_tier':
            properties.service_tier = value as any
            break
          // ... other properties
        }
      })

      return properties
    } catch (error) {
      return {}
    }
  }

  private getDirectory(path: string): string {
    const parts = path.split('/')
    return parts.slice(0, -1).join('/')
  }

  private getFileExtension(path: string): string {
    const parts = path.split('.')
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'no-extension'
  }

  private detectFrameworks(files: any[]): FrameworkIndicator[] {
    const indicators: FrameworkIndicator[] = []
    
    // Detect React
    const reactFiles = files.filter(f => 
      f.path?.includes('package.json') || 
      f.path?.endsWith('.jsx') || 
      f.path?.endsWith('.tsx')
    )
    
    if (reactFiles.length > 0) {
      indicators.push({
        framework: 'React',
        confidence: Math.min(reactFiles.length / 5, 1),
        files: reactFiles.map(f => f.path!),
        description: 'React framework detected'
      })
    }

    // Detect Next.js
    const nextFiles = files.filter(f => 
      f.path?.includes('next.config') || 
      f.path?.includes('pages/') || 
      f.path?.includes('app/')
    )
    
    if (nextFiles.length > 0) {
      indicators.push({
        framework: 'Next.js',
        confidence: Math.min(nextFiles.length / 3, 1),
        files: nextFiles.map(f => f.path!),
        description: 'Next.js framework detected'
      })
    }

    return indicators
  }

  private detectArchitecturePatterns(files: any[]): ArchitecturePattern[] {
    const patterns: ArchitecturePattern[] = []
    
    // Detect monorepo
    const hasPackages = files.some(f => f.path?.includes('packages/'))
    const hasApps = files.some(f => f.path?.includes('apps/'))
    
    if (hasPackages && hasApps) {
      patterns.push({
        pattern: 'Monorepo',
        confidence: 0.8,
        indicators: ['packages/', 'apps/']
      })
    }

    // Detect microservices
    const serviceFiles = files.filter(f => 
      f.path?.includes('service') || 
      f.path?.includes('src/main') ||
      f.path?.includes('Dockerfile')
    )
    
    if (serviceFiles.length > 2) {
      patterns.push({
        pattern: 'Microservices',
        confidence: Math.min(serviceFiles.length / 5, 1),
        indicators: serviceFiles.map(f => f.path!).slice(0, 5)
      })
    }

    return patterns
  }

  private detectSecurityIndicators(files: any[]): SecurityIndicator[] {
    const indicators: SecurityIndicator[] = []
    
    const securityFiles = files.filter(f => 
      f.path?.includes('security') ||
      f.path?.includes('auth') ||
      f.path?.includes('encrypt') ||
      f.path?.includes('audit') ||
      f.path?.includes('vulnerability')
    )

    if (securityFiles.length > 0) {
      indicators.push({
        type: 'security_scan',
        present: true,
        files: securityFiles.map(f => f.path!),
        confidence: Math.min(securityFiles.length / 3, 1)
      })
    }

    return indicators
  }

  private detectComplianceIndicators(files: any[]): ComplianceIndicator[] {
    const indicators: ComplianceIndicator[] = []
    
    const frameworks: ComplianceFramework[] = ['SOC2', 'ISO27001', 'HIPAA', 'PCI-DSS', 'GDPR', 'CCPA', 'NIST']
    
    frameworks.forEach(framework => {
      const frameworkFiles = files.filter(f => 
        f.path?.toLowerCase().includes(framework.toLowerCase())
      )
      
      if (frameworkFiles.length > 0) {
        indicators.push({
          framework,
          present: true,
          files: frameworkFiles.map(f => f.path!),
          confidence: Math.min(frameworkFiles.length / 2, 1)
        })
      }
    })

    return indicators
  }

  private parseCommitType(message: string): string {
    const conventionalCommitRegex = /^(\w+)(\(.+\))?:/
    const match = message.match(conventionalCommitRegex)
    return match ? match[1].toLowerCase() : 'other'
  }

  private mapCommitTypeToCategory(type: string): any {
    const typeMap: Record<string, any> = {
      'feat': 'feature',
      'fix': 'bugfix',
      'hotfix': 'hotfix',
      'refactor': 'refactor',
      'docs': 'docs',
      'test': 'test',
      'chore': 'chore',
      'security': 'security'
    }
    return typeMap[type] || 'other'
  }

  private calculateCommitFrequency(commits: any[]): number {
    if (commits.length < 2) return 0
    
    const now = new Date()
    const oldestCommit = new Date(commits[commits.length - 1].commit?.author?.date || now)
    const daysSinceFirst = (now.getTime() - oldestCommit.getTime()) / (1000 * 60 * 60 * 24)
    
    return daysSinceFirst > 0 ? commits.length / daysSinceFirst : commits.length
  }

  private analyzeContributorPatterns(commits: any[]): ContributorPattern[] {
    const contributors: Record<string, number> = {}
    
    commits.forEach(commit => {
      const author = commit.author?.login || commit.commit?.author?.name || 'unknown'
      contributors[author] = (contributors[author] || 0) + 1
    })

    const totalCommits = commits.length
    const patterns: ContributorPattern[] = []

    Object.entries(contributors).forEach(([contributor, count]) => {
      const percentage = (count / totalCommits) * 100
      let type: ContributorPattern['contributorType']

      if (percentage > 30) {
        type = 'core'
      } else if (percentage > 5) {
        type = 'occasional'
      } else if (contributor.includes('bot') || contributor.includes('[bot]')) {
        type = 'bot'
      } else {
        type = 'external'
      }

      patterns.push({
        contributorType: type,
        count,
        contributionPercentage: percentage
      })
    })

    return patterns
  }

  private analyzeCodeChangePatterns(commits: any[]): CodeChangePattern[] {
    // This would require analyzing file changes in each commit
    // For now, return placeholder data
    return [{
      changeType: 'addition',
      frequency: 0.4,
      averageSize: 100,
      hotspots: ['src/', 'tests/']
    }]
  }

  private async getLanguages(repoName: string): Promise<Record<string, number>> {
    const { data: languages } = await this.octokit.rest.repos.listLanguages({
      owner: this.organization,
      repo: repoName
    })
    return languages
  }

  private async analyzeDependencies(repoName: string): Promise<DependencyAnalysis> {
    // This would require analyzing package.json, requirements.txt, etc.
    return {
      total: 0,
      external: 0,
      internal: 0,
      categories: {},
      securityVulnerabilities: 0,
      outdatedPackages: 0
    }
  }

  private async analyzeConfigurations(repoName: string): Promise<ConfigurationAnalysis> {
    // This would require analyzing CI/CD config files
    return {
      hasCI: false,
      hasCD: false,
      hasTesting: false,
      hasLinting: false,
      hasSecurity: false,
      hasMonitoring: false,
      configFiles: []
    }
  }

  private async analyzeDocumentation(repoName: string): Promise<DocumentationAnalysis> {
    // This would require analyzing documentation files
    return {
      hasReadme: false,
      hasApiDocs: false,
      hasArchitectureDocs: false,
      hasContributing: false,
      hasChangelog: false,
      documentationCoverage: 0
    }
  }

  private async analyzeTesting(repoName: string): Promise<TestingAnalysis> {
    // This would require analyzing test files
    return {
      hasTests: false,
      testFrameworks: [],
      testCoverage: 0,
      testTypes: []
    }
  }

  private calculateClassificationScores(
    fileStructure: FileStructureAnalysis,
    commitPatterns: CommitPatternAnalysis,
    contentSignals: ContentSignalAnalysis
  ): Record<string, number> {
    const scores: Record<string, number> = {}

    // Platform Infrastructure
    scores['Platform Infrastructure'] = this.calculatePlatformScore(fileStructure, contentSignals)
    
    // Client Application
    scores['Client Application'] = this.calculateApplicationScore(fileStructure, contentSignals)
    
    // Shared Library
    scores['Shared Library'] = this.calculateLibraryScore(fileStructure, contentSignals)
    
    // Data Pipeline
    scores['Data Pipeline'] = this.calculateDataPipelineScore(fileStructure, contentSignals)
    
    // Security Tool
    scores['Security Tool'] = this.calculateSecurityToolScore(fileStructure, contentSignals)
    
    // DevOps Tool
    scores['DevOps Tool'] = this.calculateDevOpsScore(fileStructure, contentSignals)
    
    // Documentation
    scores['Documentation'] = this.calculateDocumentationScore(fileStructure, contentSignals)
    
    // Experimental
    scores['Experimental'] = this.calculateExperimentalScore(commitPatterns, contentSignals)
    
    // Archive
    scores['Archive'] = this.calculateArchiveScore(commitPatterns)

    return scores
  }

  private calculatePlatformScore(fileStructure: FileStructureAnalysis, contentSignals: ContentSignalAnalysis): number {
    let score = 0
    
    // Check for infrastructure patterns
    if (fileStructure.architecturePatterns.some(p => p.pattern === 'Microservices')) {
      score += 30
    }
    
    // Check for platform files
    if (fileStructure.directories.includes('infrastructure') || 
        fileStructure.directories.includes('platform')) {
      score += 25
    }
    
    // Check for CI/CD
    if (contentSignals.configurations.hasCI && contentSignals.configurations.hasCD) {
      score += 20
    }
    
    // Check for monitoring
    if (contentSignals.configurations.hasMonitoring) {
      score += 15
    }
    
    // Check for security measures
    if (fileStructure.securityIndicators.length > 0) {
      score += 10
    }

    return Math.min(score, 100)
  }

  private calculateApplicationScore(fileStructure: FileStructureAnalysis, contentSignals: ContentSignalAnalysis): number {
    let score = 0
    
    // Check for frontend frameworks
    if (fileStructure.frameworkIndicators.some(f => 
        ['React', 'Vue', 'Angular', 'Next.js'].includes(f.framework))) {
      score += 30
    }
    
    // Check for app structure
    if (fileStructure.directories.includes('src') || 
        fileStructure.directories.includes('app')) {
      score += 25
    }
    
    // Check for public-facing indicators
    if (fileStructure.directories.includes('public') || 
        fileStructure.directories.includes('static')) {
      score += 20
    }
    
    // Check for routing
    if (fileStructure.directories.includes('routes') || 
        fileStructure.directories.includes('pages')) {
      score += 15
    }
    
    // Check for UI components
    if (fileStructure.directories.includes('components') || 
        fileStructure.directories.includes('ui')) {
      score += 10
    }

    return Math.min(score, 100)
  }

  private calculateLibraryScore(fileStructure: FileStructureAnalysis, contentSignals: ContentSignalAnalysis): number {
    let score = 0
    
    // Check for library structure
    if (fileStructure.directories.includes('lib') || 
        fileStructure.directories.includes('src')) {
      score += 30
    }
    
    // Check for package files
    if (fileStructure.fileTypes['json'] > 0) {
      score += 25
    }
    
    // Check for documentation
    if (contentSignals.documentation.hasReadme && 
        contentSignals.documentation.hasApiDocs) {
      score += 20
    }
    
    // Check for tests
    if (contentSignals.testing.hasTests) {
      score += 15
    }
    
    // Check for build tools
    if (contentSignals.configurations.hasCI) {
      score += 10
    }

    return Math.min(score, 100)
  }

  private calculateDataPipelineScore(fileStructure: FileStructureAnalysis, contentSignals: ContentSignalAnalysis): number {
    let score = 0
    
    // Check for data directories
    if (fileStructure.directories.includes('data') || 
        fileStructure.directories.includes('etl') ||
        fileStructure.directories.includes('pipeline')) {
      score += 40
    }
    
    // Check for data file types
    const dataFileTypes = ['sql', 'csv', 'json', 'parquet', 'avro']
    const dataFileCount = dataFileTypes.reduce((count, type) => 
      count + (fileStructure.fileTypes[type] || 0), 0)
    
    if (dataFileCount > 0) {
      score += Math.min(dataFileCount * 5, 30)
    }
    
    // Check for data frameworks
    if (fileStructure.frameworkIndicators.some(f => 
        ['Spark', 'Airflow', 'dbt', 'Kafka'].includes(f.framework))) {
      score += 20
    }
    
    // Check for orchestration
    if (fileStructure.directories.includes('orchestration') || 
        fileStructure.directories.includes('dag')) {
      score += 10
    }

    return Math.min(score, 100)
  }

  private calculateSecurityToolScore(fileStructure: FileStructureAnalysis, contentSignals: ContentSignalAnalysis): number {
    let score = 0
    
    // Check for security indicators
    if (fileStructure.securityIndicators.length > 0) {
      score += 40
    }
    
    // Check for security directories
    if (fileStructure.directories.includes('security') || 
        fileStructure.directories.includes('auth')) {
      score += 30
    }
    
    // Check for security file types
    const securityFileTypes = ['yml', 'yaml', 'json', 'py', 'sh']
    const securityFileCount = securityFileTypes.reduce((count, type) => 
      count + (fileStructure.fileTypes[type] || 0), 0)
    
    if (securityFileCount > 0) {
      score += Math.min(securityFileCount * 2, 20)
    }
    
    // Check for compliance
    if (fileStructure.complianceIndicators.length > 0) {
      score += 10
    }

    return Math.min(score, 100)
  }

  private calculateDevOpsScore(fileStructure: FileStructureAnalysis, contentSignals: ContentSignalAnalysis): number {
    let score = 0
    
    // Check for CI/CD
    if (contentSignals.configurations.hasCI && contentSignals.configurations.hasCD) {
      score += 40
    }
    
    // Check for DevOps directories
    if (fileStructure.directories.includes('deploy') || 
        fileStructure.directories.includes('infrastructure') ||
        fileStructure.directories.includes('terraform')) {
      score += 30
    }
    
    // Check for IaC files
    const iacFileTypes = ['tf', 'hcl', 'yaml', 'yml']
    const iacFileCount = iacFileTypes.reduce((count, type) => 
      count + (fileStructure.fileTypes[type] || 0), 0)
    
    if (iacFileCount > 0) {
      score += Math.min(iacFileCount * 3, 20)
    }
    
    // Check for monitoring
    if (contentSignals.configurations.hasMonitoring) {
      score += 10
    }

    return Math.min(score, 100)
  }

  private calculateDocumentationScore(fileStructure: FileStructureAnalysis, contentSignals: ContentSignalAnalysis): number {
    let score = 0
    
    // Check for documentation coverage
    score += contentSignals.documentation.documentationCoverage * 50
    
    // Check for documentation directories
    if (fileStructure.directories.includes('docs') || 
        fileStructure.directories.includes('documentation')) {
      score += 30
    }
    
    // Check for documentation file types
    const docFileTypes = ['md', 'rst', 'txt', 'pdf']
    const docFileCount = docFileTypes.reduce((count, type) => 
      count + (fileStructure.fileTypes[type] || 0), 0)
    
    if (docFileCount > 0) {
      score += Math.min(docFileCount * 2, 20)
    }

    return Math.min(score, 100)
  }

  private calculateExperimentalScore(commitPatterns: CommitPatternAnalysis, contentSignals: ContentSignalAnalysis): number {
    let score = 0
    
    // Check for experimental indicators
    if (commitPatterns.totalCommits < 10) {
      score += 40
    }
    
    // Check for prototype patterns
    if (commitPatterns.commitTypes['prototype'] || 
        commitPatterns.commitTypes['experiment']) {
      score += 30
    }
    
    // Check for lack of production readiness
    if (!contentSignals.configurations.hasCI || 
        !contentSignals.testing.hasTests) {
      score += 20
    }
    
    // Check for research patterns
    if (commitPatterns.commitTypes['research'] || 
        commitPatterns.commitTypes['poc']) {
      score += 10
    }

    return Math.min(score, 100)
  }

  private calculateArchiveScore(commitPatterns: CommitPatternAnalysis): number {
    let score = 0
    
    // Check for inactivity
    if (commitPatterns.commitFrequency < 0.01) {
      score += 60
    }
    
    // Check for deprecated patterns
    if (commitPatterns.commitTypes['deprecate'] || 
        commitPatterns.commitTypes['archive']) {
      score += 30
    }
    
    // Check for old repository
    if (commitPatterns.totalCommits > 0 && commitPatterns.commitFrequency < 0.1) {
      score += 10
    }

    return Math.min(score, 100)
  }

  private calculateRiskLevel(
    fileStructure: FileStructureAnalysis,
    commitPatterns: CommitPatternAnalysis,
    contentSignals: ContentSignalAnalysis
  ): 'Low' | 'Medium' | 'High' | 'Critical' {
    let riskScore = 0
    
    // Security risks
    if (fileStructure.securityIndicators.length === 0) riskScore += 25
    if (contentSignals.dependencies.securityVulnerabilities > 0) riskScore += 20
    
    // Quality risks
    if (!contentSignals.testing.hasTests) riskScore += 15
    if (contentSignals.documentation.documentationCoverage < 0.3) riskScore += 10
    
    // Maintenance risks
    if (commitPatterns.commitFrequency < 0.1) riskScore += 20
    if (!contentSignals.configurations.hasCI) riskScore += 10
    
    if (riskScore >= 70) return 'Critical'
    if (riskScore >= 50) return 'High'
    if (riskScore >= 30) return 'Medium'
    return 'Low'
  }

  private mapRiskToBusinessCriticality(riskLevel: string): RepositoryProperties['business_criticality'] {
    switch (riskLevel) {
      case 'Critical': return 'Critical'
      case 'High': return 'High'
      case 'Medium': return 'Medium'
      case 'Low': return 'Low'
      default: return 'Medium'
    }
  }

  private determineServiceTier(category: RepositoryCategory, fileStructure: FileStructureAnalysis): RepositoryProperties['service_tier'] {
    switch (category) {
      case 'Platform Infrastructure': return 'Platform'
      case 'Client Application': return 'Application'
      case 'Shared Library': return 'Library'
      case 'Data Pipeline': return 'Platform'
      case 'Security Tool': return 'Infrastructure'
      case 'DevOps Tool': return 'Infrastructure'
      case 'Documentation': return 'Library'
      case 'Experimental': return 'Library'
      case 'Archive': return 'Infrastructure'
      default: return 'Library'
    }
  }

  private determineDataClassification(category: RepositoryCategory, contentSignals: ContentSignalAnalysis): RepositoryProperties['data_classification'] {
    switch (category) {
      case 'Client Application': return 'Confidential'
      case 'Platform Infrastructure': return 'Internal'
      case 'Security Tool': return 'Internal'
      case 'Data Pipeline': return 'Restricted'
      case 'DevOps Tool': return 'Internal'
      case 'Shared Library': return 'Public'
      case 'Documentation': return 'Public'
      case 'Experimental': return 'Internal'
      case 'Archive': return 'Internal'
      default: return 'Internal'
    }
  }

  private determineSecurityClassification(riskLevel: string, category: RepositoryCategory): RepositoryProperties['security_classification'] {
    if (riskLevel === 'Critical') return 'Critical'
    if (riskLevel === 'High') return 'High'
    
    switch (category) {
      case 'Client Application': return 'Elevated'
      case 'Security Tool': return 'High'
      case 'Data Pipeline': return 'Elevated'
      case 'Platform Infrastructure': return 'High'
      default: return 'Standard'
    }
  }

  private recommendComplianceFrameworks(category: RepositoryCategory, riskLevel: string, contentSignals: ContentSignalAnalysis): ComplianceFramework[] {
    const frameworks: ComplianceFramework[] = []
    
    // Base frameworks for all production code
    if (category !== 'Experimental' && category !== 'Archive') {
      frameworks.push('SOC2')
    }
    
    // Data protection for client-facing apps
    if (category === 'Client Application' || category === 'Data Pipeline') {
      frameworks.push('GDPR', 'CCPA')
    }
    
    // Security for security tools
    if (category === 'Security Tool' || riskLevel === 'Critical') {
      frameworks.push('ISO27001')
    }
    
    // Healthcare for medical data
    if (contentSignals.languages.python && 
        (contentSignals.languages.python > 50 || category === 'Data Pipeline')) {
      frameworks.push('HIPAA')
    }
    
    // Payment processing
    if (category === 'Client Application' && 
        fileStructure.complianceIndicators.some(c => c.framework === 'PCI-DSS')) {
      frameworks.push('PCI-DSS')
    }
    
    return frameworks
  }

  private determineSubcategory(category: RepositoryCategory, fileStructure: FileStructureAnalysis, contentSignals: ContentSignalAnalysis): string {
    switch (category) {
      case 'Client Application':
        if (fileStructure.frameworkIndicators.some(f => f.framework === 'Next.js')) {
          return 'Next.js Web Application'
        }
        if (fileStructure.frameworkIndicators.some(f => f.framework === 'React')) {
          return 'React Application'
        }
        return 'Web Application'
      
      case 'Platform Infrastructure':
        if (fileStructure.architecturePatterns.some(p => p.pattern === 'Microservices')) {
          return 'Microservices Platform'
        }
        return 'Infrastructure Platform'
      
      case 'Shared Library':
        if (fileStructure.frameworkIndicators.some(f => f.framework === 'React')) {
          return 'UI Component Library'
        }
        return 'Utility Library'
      
      default:
        return category
    }
  }

  private scoreToRiskCategory(score: number): RiskAssessment['category'] {
    if (score >= 70) return 'Critical'
    if (score >= 50) return 'High'
    if (score >= 30) return 'Medium'
    return 'Low'
  }

  private generateRiskRecommendations(factors: RiskFactor[]): string[] {
    const recommendations: string[] = []
    
    factors.forEach(factor => {
      switch (factor.factor) {
        case 'No security measures detected':
          recommendations.push('Implement security scanning and add authentication mechanisms')
          break
        case 'No test suite detected':
          recommendations.push('Add comprehensive test suite with unit, integration, and E2E tests')
          break
        case 'Security vulnerabilities in dependencies':
          recommendations.push('Update dependencies and implement dependency scanning in CI')
          break
        case 'Low commit frequency (stale repository)':
          recommendations.push('Consider archiving or updating the repository regularly')
          break
        case 'Poor documentation coverage':
          recommendations.push('Improve documentation with README, API docs, and usage examples')
          break
      }
    })
    
    return recommendations
  }

  private determineReviewFrequency(riskCategory: RiskAssessment['category']): RepositoryProperties['review_frequency'] {
    switch (riskCategory) {
      case 'Critical': return 'Monthly'
      case 'High': return 'Quarterly'
      case 'Medium': return 'Semi-annual'
      case 'Low': return 'Annual'
      default: return 'Quarterly'
    }
  }

  private mapCategoryToArchitecturePattern(category: RepositoryCategory): RepositoryProperties['architecture_pattern'] {
    switch (category) {
      case 'Platform Infrastructure': return 'Microservices'
      case 'Client Application': return 'Monolith'
      case 'Shared Library': return 'Library'
      case 'Data Pipeline': return 'Microservices'
      case 'Security Tool': return 'Serverless'
      case 'DevOps Tool': return 'Config'
      case 'Documentation': return 'Library'
      case 'Experimental': return 'Monolith'
      case 'Archive': return 'Library'
      default: return 'Monolith'
    }
  }

  private determineDependencyType(category: RepositoryCategory): RepositoryProperties['dependencies'] {
    switch (category) {
      case 'Platform Infrastructure': return 'Mixed'
      case 'Client Application': return 'External'
      case 'Shared Library': return 'Internal'
      case 'Data Pipeline': return 'External'
      case 'Security Tool': return 'Internal'
      case 'DevOps Tool': return 'Mixed'
      case 'Documentation': return 'Internal'
      case 'Experimental': return 'External'
      case 'Archive': return 'Internal'
      default: return 'Mixed'
    }
  }

  private detectBuildSystem(category: RepositoryCategory): RepositoryProperties['build_system'] {
    // Default to Turborepo for this platform
    return 'Turborepo'
  }

  private getLanguagesFromContentSignals: Record<string, number> = {}
}
