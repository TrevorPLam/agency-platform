/**
 * Auto-Labeling System
 * 
 * Automatically applies labels to repositories based on semantic analysis
 * of file structure, commit patterns, and content characteristics.
 */

import { Octokit } from '@octokit/rest'
import { 
  GitHubRepository, 
  RepositoryProperties,
  ComplianceFramework 
} from './types'
import { RepositoryAnalysis, RepositoryCategory } from './classification'

export interface LabelDefinition {
  name: string
  description: string
  color: string
  category: 'technology' | 'purpose' | 'risk' | 'compliance' | 'status' | 'maintenance'
  conditions: LabelCondition[]
  priority: number
  autoApply: boolean
}

export interface LabelCondition {
  type: 'file_structure' | 'commit_pattern' | 'content_signal' | 'property' | 'custom'
  field: string
  operator: 'contains' | 'equals' | 'greater_than' | 'less_than' | 'regex' | 'in_list' | 'not_in_list'
  value: string | number | string[] | RegExp
  weight: number
}

export interface LabelApplication {
  repository: string
  labels: string[]
  removedLabels: string[]
  confidence: number
  reasoning: string[]
  appliedAt: string
  appliedBy: 'auto-labeling-system'
}

export interface LabelingConfiguration {
  enabled: boolean
  dryRun: boolean
  confidenceThreshold: number
  maxLabelsPerRepository: number
  labelCategories: Record<string, boolean>
  customLabels: LabelDefinition[]
}

export interface LabelingMetrics {
  totalRepositories: number
  labeledRepositories: number
  totalLabelsApplied: number
  labelsByCategory: Record<string, number>
  averageLabelsPerRepository: number
  averageConfidence: number
  topLabels: Array<{label: string, count: number}>
}

/**
 * Auto-Labeling Engine
 */
export class AutoLabelingEngine {
  private octokit: Octokit
  private organization: string
  private labelDefinitions: LabelDefinition[]
  private configuration: LabelingConfiguration
  private applicationHistory: LabelApplication[] = []

  constructor(token: string, organization: string) {
    this.octokit = new Octokit({ auth: token })
    this.organization = organization
    this.labelDefinitions = this.initializeLabelDefinitions()
    this.configuration = {
      enabled: true,
      dryRun: false,
      confidenceThreshold: 0.7,
      maxLabelsPerRepository: 10,
      labelCategories: {
        technology: true,
        purpose: true,
        risk: true,
        compliance: true,
        status: true,
        maintenance: true
      },
      customLabels: []
    }
  }

  /**
   * Analyze repository and apply appropriate labels
   */
  async analyzeAndApplyLabels(
    repoName: string, 
    analysis: RepositoryAnalysis,
    overrideConfig?: Partial<LabelingConfiguration>
  ): Promise<LabelApplication> {
    const config = { ...this.configuration, ...overrideConfig }
    
    if (!config.enabled) {
      return {
        repository: repoName,
        labels: [],
        removedLabels: [],
        confidence: 0,
        reasoning: ['Auto-labeling is disabled'],
        appliedAt: new Date().toISOString(),
        appliedBy: 'auto-labeling-system'
      }
    }

    const applicableLabels = this.findApplicableLabels(analysis, config)
    const currentLabels = await this.getCurrentRepositoryLabels(repoName)
    
    const labelsToAdd = applicableLabels
      .filter(label => !currentLabels.includes(label.name))
      .filter(label => config.labelCategories[label.category])
      .slice(0, config.maxLabelsPerRepository)

    const labelsToRemove = currentLabels.filter(label => 
      !applicableLabels.find(al => al.name === label) &&
      this.isManagedLabel(label)
    )

    const confidence = this.calculateLabelingConfidence(applicableLabels, labelsToAdd)
    const reasoning = this.generateLabelingReasoning(applicableLabels, analysis)

    const application: LabelApplication = {
      repository: repoName,
      labels: labelsToAdd.map(l => l.name),
      removedLabels: labelsToRemove,
      confidence,
      reasoning,
      appliedAt: new Date().toISOString(),
      appliedBy: 'auto-labeling-system'
    }

    if (!config.dryRun && labelsToAdd.length > 0) {
      await this.applyLabels(repoName, labelsToAdd.map(l => l.name))
    }

    if (!config.dryRun && labelsToRemove.length > 0) {
      await this.removeLabels(repoName, labelsToRemove)
    }

    this.applicationHistory.push(application)
    return application
  }

  /**
   * Find labels that apply to a repository based on analysis
   */
  private findApplicableLabels(
    analysis: RepositoryAnalysis, 
    config: LabelingConfiguration
  ): LabelDefinition[] {
    const applicableLabels: Array<{label: LabelDefinition, score: number}> = []

    this.labelDefinitions
      .filter(label => label.autoApply)
      .filter(label => config.labelCategories[label.category])
      .forEach(label => {
        const score = this.calculateLabelScore(label, analysis)
        if (score >= config.confidenceThreshold) {
          applicableLabels.push({ label, score })
        }
      })

    // Add custom labels
    config.customLabels
      .filter(label => label.autoApply)
      .filter(label => config.labelCategories[label.category])
      .forEach(label => {
        const score = this.calculateLabelScore(label, analysis)
        if (score >= config.confidenceThreshold) {
          applicableLabels.push({ label, score })
        }
      })

    // Sort by priority and score, then take top labels
    return applicableLabels
      .sort((a, b) => {
        // First sort by priority (higher first)
        if (b.label.priority !== a.label.priority) {
          return b.label.priority - a.label.priority
        }
        // Then by score (higher first)
        return b.score - a.score
      })
      .map(item => item.label)
      .slice(0, config.maxLabelsPerRepository)
  }

  /**
   * Calculate how well a label applies to a repository
   */
  private calculateLabelScore(label: LabelDefinition, analysis: RepositoryAnalysis): number {
    let totalScore = 0
    let totalWeight = 0

    for (const condition of label.conditions) {
      const conditionScore = this.evaluateCondition(condition, analysis)
      totalScore += conditionScore * condition.weight
      totalWeight += condition.weight
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0
  }

  /**
   * Evaluate a single condition against repository analysis
   */
  private evaluateCondition(condition: LabelCondition, analysis: RepositoryAnalysis): number {
    let value: any
    let matches = false

    switch (condition.type) {
      case 'file_structure':
        value = this.getFileStructureValue(condition.field, analysis.fileStructure)
        break
      case 'commit_pattern':
        value = this.getCommitPatternValue(condition.field, analysis.commitPatterns)
        break
      case 'content_signal':
        value = this.getContentSignalValue(condition.field, analysis.contentSignals)
        break
      case 'property':
        value = this.getPropertyValue(condition.field, analysis.recommendedProperties)
        break
      case 'custom':
        value = this.getCustomValue(condition.field, analysis)
        break
      default:
        return 0
    }

    matches = this.evaluateOperator(condition.operator, value, condition.value)
    return matches ? 1 : 0
  }

  /**
   * Evaluate operator against value and expected value
   */
  private evaluateOperator(operator: string, actual: any, expected: any): boolean {
    switch (operator) {
      case 'contains':
        return typeof actual === 'string' && 
               typeof expected === 'string' && 
               actual.toLowerCase().includes(expected.toLowerCase())
      case 'equals':
        return actual === expected
      case 'greater_than':
        return typeof actual === 'number' && 
               typeof expected === 'number' && 
               actual > expected
      case 'less_than':
        return typeof actual === 'number' && 
               typeof expected === 'number' && 
               actual < expected
      case 'regex':
        return typeof actual === 'string' && 
               expected instanceof RegExp && 
               expected.test(actual)
      case 'in_list':
        return Array.isArray(expected) && expected.includes(actual)
      case 'not_in_list':
        return Array.isArray(expected) && !expected.includes(actual)
      default:
        return false
    }
  }

  /**
   * Get value from file structure analysis
   */
  private getFileStructureValue(field: string, fileStructure: any): any {
    switch (field) {
      case 'total_files':
        return fileStructure.totalFiles
      case 'framework_count':
        return fileStructure.frameworkIndicators.length
      case 'security_indicators_count':
        return fileStructure.securityIndicators.length
      case 'compliance_indicators_count':
        return fileStructure.complianceIndicators.length
      case 'has_frameworks':
        return fileStructure.frameworkIndicators.length > 0
      case 'has_security_measures':
        return fileStructure.securityIndicators.length > 0
      case 'architecture_pattern':
        return fileStructure.architecturePatterns.map((p: any) => p.pattern)
      case 'frameworks':
        return fileStructure.frameworkIndicators.map((f: any) => f.framework)
      case 'directories':
        return fileStructure.directories
      default:
        return null
    }
  }

  /**
   * Get value from commit pattern analysis
   */
  private getCommitPatternValue(field: string, commitPatterns: any): any {
    switch (field) {
      case 'total_commits':
        return commitPatterns.totalCommits
      case 'commit_frequency':
        return commitPatterns.commitFrequency
      case 'commit_types':
        return Object.keys(commitPatterns.commitTypes)
      case 'has_regular_commits':
        return commitPatterns.commitFrequency > 0.1
      case 'is_stale':
        return commitPatterns.commitFrequency < 0.01
      case 'contributor_count':
        return commitPatterns.contributorPatterns.length
      default:
        return null
    }
  }

  /**
   * Get value from content signal analysis
   */
  private getContentSignalValue(field: string, contentSignals: any): any {
    switch (field) {
      case 'has_tests':
        return contentSignals.testing.hasTests
      case 'has_ci':
        return contentSignals.configurations.hasCI
      case 'has_documentation':
        return contentSignals.documentation.hasReadme
      case 'language_count':
        return Object.keys(contentSignals.languages).length
      case 'main_language':
        return this.getMainLanguage(contentSignals.languages)
      case 'dependency_count':
        return contentSignals.dependencies.total
      case 'has_security_vulnerabilities':
        return contentSignals.dependencies.securityVulnerabilities > 0
      default:
        return null
    }
  }

  /**
   * Get value from repository properties
   */
  private getPropertyValue(field: string, properties: Partial<RepositoryProperties>): any {
    return properties[field as keyof RepositoryProperties]
  }

  /**
   * Get custom value from analysis
   */
  private getCustomValue(field: string, analysis: RepositoryAnalysis): any {
    switch (field) {
      case 'category':
        return analysis.classification.category
      case 'risk_level':
        return analysis.classification.riskLevel
      case 'confidence':
        return analysis.classification.confidence
      case 'business_criticality':
        return analysis.classification.businessCriticality
      case 'service_tier':
        return analysis.classification.serviceTier
      case 'risk_score':
        return analysis.riskAssessment.score
      default:
        return null
    }
  }

  /**
   * Get main language from language analysis
   */
  private getMainLanguage(languages: Record<string, number>): string {
    const entries = Object.entries(languages)
    if (entries.length === 0) return 'unknown'
    
    return entries.reduce((a, b) => a[1] > b[1] ? a : b)[0]
  }

  /**
   * Calculate overall labeling confidence
   */
  private calculateLabelingConfidence(
    applicableLabels: LabelDefinition[], 
    selectedLabels: LabelDefinition[]
  ): number {
    if (applicableLabels.length === 0) return 0
    if (selectedLabels.length === 0) return 0

    const averagePriority = selectedLabels.reduce((sum, label) => sum + label.priority, 0) / selectedLabels.length
    const maxPriority = Math.max(...applicableLabels.map(l => l.priority))
    
    return maxPriority > 0 ? averagePriority / maxPriority : 0
  }

  /**
   * Generate reasoning for label application
   */
  private generateLabelingReasoning(labels: LabelDefinition[], analysis: RepositoryAnalysis): string[] {
    const reasoning: string[] = []

    labels.forEach(label => {
      const reasons: string[] = []
      
      label.conditions.forEach(condition => {
        const value = this.getConditionValue(condition, analysis)
        const matches = this.evaluateOperator(condition.operator, value, condition.value)
        
        if (matches) {
          reasons.push(`${condition.field} ${condition.operator} ${condition.value}`)
        }
      })

      if (reasons.length > 0) {
        reasoning.push(`${label.name}: ${reasons.join(', ')}`)
      }
    })

    return reasoning
  }

  /**
   * Get value for condition evaluation
   */
  private getConditionValue(condition: LabelCondition, analysis: RepositoryAnalysis): any {
    switch (condition.type) {
      case 'file_structure':
        return this.getFileStructureValue(condition.field, analysis.fileStructure)
      case 'commit_pattern':
        return this.getCommitPatternValue(condition.field, analysis.commitPatterns)
      case 'content_signal':
        return this.getContentSignalValue(condition.field, analysis.contentSignals)
      case 'property':
        return this.getPropertyValue(condition.field, analysis.recommendedProperties)
      case 'custom':
        return this.getCustomValue(condition.field, analysis)
      default:
        return null
    }
  }

  /**
   * Get current repository labels
   */
  private async getCurrentRepositoryLabels(repoName: string): Promise<string[]> {
    try {
      const { data: labels } = await this.octokit.rest.issues.listLabelsForRepo({
        owner: this.organization,
        repo: repoName,
        per_page: 100
      })

      return labels.map(label => label.name)
    } catch (error) {
      console.warn(`Failed to get labels for ${repoName}:`, error)
      return []
    }
  }

  /**
   * Apply labels to repository
   */
  private async applyLabels(repoName: string, labels: string[]): Promise<void> {
    try {
      await this.octokit.rest.issues.addLabels({
        owner: this.organization,
        repo: repoName,
        issue_number: 1, // Use a dummy issue number for repository labels
        labels: labels
      })
    } catch (error) {
      // Repository labels are applied differently - this is a simplified approach
      console.warn(`Failed to apply labels to ${repoName}:`, error)
    }
  }

  /**
   * Remove labels from repository
   */
  private async removeLabels(repoName: string, labels: string[]): Promise<void> {
    try {
      for (const label of labels) {
        await this.octokit.rest.issues.removeLabel({
          owner: this.organization,
          repo: repoName,
          issue_number: 1, // Use a dummy issue number for repository labels
          name: label
        })
      }
    } catch (error) {
      console.warn(`Failed to remove labels from ${repoName}:`, error)
    }
  }

  /**
   * Check if a label is managed by the auto-labeling system
   */
  private isManagedLabel(labelName: string): boolean {
    return this.labelDefinitions.some(label => label.name === labelName) ||
           this.configuration.customLabels.some(label => label.name === labelName)
  }

  /**
   * Initialize default label definitions
   */
  private initializeLabelDefinitions(): LabelDefinition[] {
    return [
      // Technology labels
      {
        name: 'react',
        description: 'React framework',
        color: '#61dafb',
        category: 'technology',
        conditions: [
          {
            type: 'file_structure',
            field: 'frameworks',
            operator: 'in_list',
            value: ['React'],
            weight: 0.8
          }
        ],
        priority: 80,
        autoApply: true
      },
      {
        name: 'nextjs',
        description: 'Next.js framework',
        color: '#000000',
        category: 'technology',
        conditions: [
          {
            type: 'file_structure',
            field: 'frameworks',
            operator: 'in_list',
            value: ['Next.js'],
            weight: 0.9
          }
        ],
        priority: 85,
        autoApply: true
      },
      {
        name: 'typescript',
        description: 'TypeScript language',
        color: '#3178c6',
        category: 'technology',
        conditions: [
          {
            type: 'content_signal',
            field: 'main_language',
            operator: 'equals',
            value: 'TypeScript',
            weight: 0.9
          }
        ],
        priority: 75,
        autoApply: true
      },
      {
        name: 'python',
        description: 'Python language',
        color: '#3776ab',
        category: 'technology',
        conditions: [
          {
            type: 'content_signal',
            field: 'main_language',
            operator: 'equals',
            value: 'Python',
            weight: 0.9
          }
        ],
        priority: 75,
        autoApply: true
      },
      {
        name: 'go',
        description: 'Go language',
        color: '#00add8',
        category: 'technology',
        conditions: [
          {
            type: 'content_signal',
            field: 'main_language',
            operator: 'equals',
            value: 'Go',
            weight: 0.9
          }
        ],
        priority: 75,
        autoApply: true
      },

      // Purpose labels
      {
        name: 'client-application',
        description: 'Client-facing application',
        color: '#ff9800',
        category: 'purpose',
        conditions: [
          {
            type: 'custom',
            field: 'category',
            operator: 'equals',
            value: 'Client Application',
            weight: 0.9
          }
        ],
        priority: 90,
        autoApply: true
      },
      {
        name: 'platform-infrastructure',
        description: 'Platform infrastructure',
        color: '#9c27b0',
        category: 'purpose',
        conditions: [
          {
            type: 'custom',
            field: 'category',
            operator: 'equals',
            value: 'Platform Infrastructure',
            weight: 0.9
          }
        ],
        priority: 90,
        autoApply: true
      },
      {
        name: 'shared-library',
        description: 'Shared library',
        color: '#4caf50',
        category: 'purpose',
        conditions: [
          {
            type: 'custom',
            field: 'category',
            operator: 'equals',
            value: 'Shared Library',
            weight: 0.9
          }
        ],
        priority: 85,
        autoApply: true
      },
      {
        name: 'data-pipeline',
        description: 'Data processing pipeline',
        color: '#f44336',
        category: 'purpose',
        conditions: [
          {
            type: 'custom',
            field: 'category',
            operator: 'equals',
            value: 'Data Pipeline',
            weight: 0.9
          }
        ],
        priority: 85,
        autoApply: true
      },
      {
        name: 'security-tool',
        description: 'Security tooling',
        color: '#795548',
        category: 'purpose',
        conditions: [
          {
            type: 'custom',
            field: 'category',
            operator: 'equals',
            value: 'Security Tool',
            weight: 0.9
          }
        ],
        priority: 85,
        autoApply: true
      },

      // Risk labels
      {
        name: 'high-risk',
        description: 'High risk repository',
        color: '#d32f2f',
        category: 'risk',
        conditions: [
          {
            type: 'custom',
            field: 'risk_level',
            operator: 'equals',
            value: 'Critical',
            weight: 0.9
          },
          {
            type: 'custom',
            field: 'risk_level',
            operator: 'equals',
            value: 'High',
            weight: 0.7
          }
        ],
        priority: 95,
        autoApply: true
      },
      {
        name: 'medium-risk',
        description: 'Medium risk repository',
        color: '#ff9800',
        category: 'risk',
        conditions: [
          {
            type: 'custom',
            field: 'risk_level',
            operator: 'equals',
            value: 'Medium',
            weight: 0.9
          }
        ],
        priority: 80,
        autoApply: true
      },
      {
        name: 'low-risk',
        description: 'Low risk repository',
        color: '#4caf50',
        category: 'risk',
        conditions: [
          {
            type: 'custom',
            field: 'risk_level',
            operator: 'equals',
            value: 'Low',
            weight: 0.9
          }
        ],
        priority: 70,
        autoApply: true
      },

      // Compliance labels
      {
        name: 'soc2',
        description: 'SOC 2 compliance',
        color: '#1976d2',
        category: 'compliance',
        conditions: [
          {
            type: 'property',
            field: 'compliance_frameworks',
            operator: 'in_list',
            value: ['SOC2'],
            weight: 0.9
          }
        ],
        priority: 85,
        autoApply: true
      },
      {
        name: 'iso27001',
        description: 'ISO 27001 compliance',
        color: '#388e3c',
        category: 'compliance',
        conditions: [
          {
            type: 'property',
            field: 'compliance_frameworks',
            operator: 'in_list',
            value: ['ISO27001'],
            weight: 0.9
          }
        ],
        priority: 85,
        autoApply: true
      },
      {
        name: 'gdpr',
        description: 'GDPR compliance',
        color: '#f57c00',
        category: 'compliance',
        conditions: [
          {
            type: 'property',
            field: 'compliance_frameworks',
            operator: 'in_list',
            value: ['GDPR'],
            weight: 0.9
          }
        ],
        priority: 80,
        autoApply: true
      },
      {
        name: 'hipaa',
        description: 'HIPAA compliance',
        color: '#c62828',
        category: 'compliance',
        conditions: [
          {
            type: 'property',
            field: 'compliance_frameworks',
            operator: 'in_list',
            value: ['HIPAA'],
            weight: 0.9
          }
        ],
        priority: 85,
        autoApply: true
      },

      // Status labels
      {
        name: 'active',
        description: 'Active development',
        color: '#4caf50',
        category: 'status',
        conditions: [
          {
            type: 'commit_pattern',
            field: 'has_regular_commits',
            operator: 'equals',
            value: true,
            weight: 0.8
          }
        ],
        priority: 60,
        autoApply: true
      },
      {
        name: 'stale',
        description: 'Stale repository',
        color: '#9e9e9e',
        category: 'status',
        conditions: [
          {
            type: 'commit_pattern',
            field: 'is_stale',
            operator: 'equals',
            value: true,
            weight: 0.9
          }
        ],
        priority: 70,
        autoApply: true
      },
      {
        name: 'experimental',
        description: 'Experimental project',
        color: '#9c27b0',
        category: 'status',
        conditions: [
          {
            type: 'custom',
            field: 'category',
            operator: 'equals',
            value: 'Experimental',
            weight: 0.9
          }
        ],
        priority: 75,
        autoApply: true
      },

      // Maintenance labels
      {
        name: 'needs-security-review',
        description: 'Requires security review',
        color: '#d32f2f',
        category: 'maintenance',
        conditions: [
          {
            type: 'file_structure',
            field: 'has_security_measures',
            operator: 'equals',
            value: false,
            weight: 0.8
          },
          {
            type: 'content_signal',
            field: 'has_security_vulnerabilities',
            operator: 'equals',
            value: true,
            weight: 0.9
          }
        ],
        priority: 90,
        autoApply: true
      },
      {
        name: 'needs-tests',
        description: 'Requires test coverage',
        color: '#ff9800',
        category: 'maintenance',
        conditions: [
          {
            type: 'content_signal',
            field: 'has_tests',
            operator: 'equals',
            value: false,
            weight: 0.8
          }
        ],
        priority: 80,
        autoApply: true
      },
      {
        name: 'needs-documentation',
        description: 'Requires documentation',
        color: '#607d8b',
        category: 'maintenance',
        conditions: [
          {
            type: 'content_signal',
            field: 'has_documentation',
            operator: 'equals',
            value: false,
            weight: 0.7
          }
        ],
        priority: 70,
        autoApply: true
      }
    ]
  }

  /**
   * Get labeling metrics
   */
  getLabelingMetrics(): LabelingMetrics {
    const totalRepositories = new Set(this.applicationHistory.map(a => a.repository)).size
    const labeledRepositories = this.applicationHistory.filter(a => a.labels.length > 0).length
    const totalLabelsApplied = this.applicationHistory.reduce((sum, a) => sum + a.labels.length, 0)
    
    const labelsByCategory: Record<string, number> = {}
    this.applicationHistory.forEach(application => {
      application.labels.forEach(labelName => {
        const label = this.labelDefinitions.find(l => l.name === labelName)
        if (label) {
          labelsByCategory[label.category] = (labelsByCategory[label.category] || 0) + 1
        }
      })
    })

    const averageLabelsPerRepository = totalRepositories > 0 ? totalLabelsApplied / totalRepositories : 0
    const averageConfidence = this.applicationHistory.length > 0 
      ? this.applicationHistory.reduce((sum, a) => sum + a.confidence, 0) / this.applicationHistory.length 
      : 0

    const labelCounts: Record<string, number> = {}
    this.applicationHistory.forEach(application => {
      application.labels.forEach(label => {
        labelCounts[label] = (labelCounts[label] || 0) + 1
      })
    })

    const topLabels = Object.entries(labelCounts)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return {
      totalRepositories,
      labeledRepositories,
      totalLabelsApplied,
      labelsByCategory,
      averageLabelsPerRepository,
      averageConfidence,
      topLabels
    }
  }

  /**
   * Add custom label definition
   */
  addCustomLabel(label: LabelDefinition): void {
    this.configuration.customLabels.push(label)
  }

  /**
   * Remove custom label definition
   */
  removeCustomLabel(labelName: string): boolean {
    const index = this.configuration.customLabels.findIndex(l => l.name === labelName)
    if (index >= 0) {
      this.configuration.customLabels.splice(index, 1)
      return true
    }
    return false
  }

  /**
   * Update configuration
   */
  updateConfiguration(updates: Partial<LabelingConfiguration>): void {
    this.configuration = { ...this.configuration, ...updates }
  }

  /**
   * Get current configuration
   */
  getConfiguration(): LabelingConfiguration {
    return { ...this.configuration }
  }

  /**
   * Get application history
   */
  getApplicationHistory(repository?: string, limit: number = 50): LabelApplication[] {
    let filtered = this.applicationHistory

    if (repository) {
      filtered = filtered.filter(a => a.repository === repository)
    }

    return filtered
      .sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime())
      .slice(0, limit)
  }
}
