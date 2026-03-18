/**
 * GitHub Rulesets Automation System
 * 
 * Provides programmatic management of GitHub rulesets at scale.
 * Integrates with classification and policy systems for automated governance.
 */

import { Octokit } from '@octokit/rest'
import { 
  GitHubRepository, 
  RepositoryProperties,
  GovernancePolicy,
  ComplianceFramework 
} from './types'
import { RulesetTemplate, PolicyApplication } from './dynamic-policies'

export interface GitHubRuleset {
  id: number
  name: string
  target: 'branch' | 'tag' | 'push'
  source_type: 'Organization' | 'Repository'
  source: string
  enforcement: 'disabled' | 'active' | 'evaluate'
  conditions: GitHubRulesetCondition
  rules: GitHubRulesetRule[]
  bypass_actors: GitHubBypassActor[]
  created_at: string
  updated_at: string
}

export interface GitHubRulesetCondition {
  ref_name: {
    include: string[]
    exclude: string[]
  }
}

export interface GitHubRulesetRule {
  type: string
  parameters?: Record<string, any>
}

export interface GitHubBypassActor {
  actor_id?: number
  actor_type: 'Integration' | 'OrganizationAdmin' | 'RepositoryRole' | 'Team' | 'DeployKey'
  bypass_mode: 'always' | 'pull_request' | 'exempt'
}

export interface RulesetOperation {
  type: 'create' | 'update' | 'delete'
  repository: string
  rulesetId?: number
  rulesetData?: Partial<GitHubRuleset>
  status: 'pending' | 'completed' | 'failed'
  error?: string
  appliedAt: string
}

export interface RulesetBatchOperation {
  operations: RulesetOperation[]
  summary: {
    total: number
    completed: number
    failed: number
    errors: string[]
  }
  executedAt: string
}

export interface RulesetInsights {
  rulesetId: number
  repository: string
  evaluationPeriod: {
    startDate: string
    endDate: string
  }
  totalEvaluations: number
  passedEvaluations: number
  failedEvaluations: number
  bypassedEvaluations: number
  topFailureReasons: Array<{reason: string, count: number}>
  recommendations: string[]
}

/**
 * GitHub Rulesets Automation Manager
 */
export class RulesetsAutomationManager {
  private octokit: Octokit
  private organization: string
  private operationHistory: RulesetOperation[] = []

  constructor(token: string, organization: string) {
    this.octokit = new Octokit({ auth: token })
    this.organization = organization
  }

  /**
   * Create a ruleset in a repository
   */
  async createRuleset(
    repoName: string, 
    rulesetTemplate: RulesetTemplate
  ): Promise<GitHubRuleset> {
    const operation: RulesetOperation = {
      type: 'create',
      repository: repoName,
      status: 'pending',
      appliedAt: new Date().toISOString()
    }

    try {
      const rulesetData = this.convertTemplateToGitHubFormat(rulesetTemplate)
      
      const { data: ruleset } = await this.octokit.rest.repos.createOrUpdateRuleset({
        owner: this.organization,
        repo: repoName,
        name: rulesetTemplate.name,
        target: rulesetTemplate.target,
        enforcement: rulesetTemplate.enforcement,
        conditions: rulesetData.conditions,
        rules: rulesetData.rules,
        bypass_actors: rulesetData.bypass_actors
      })

      operation.status = 'completed'
      this.operationHistory.push(operation)

      return this.formatGitHubRuleset(ruleset)
    } catch (error) {
      operation.status = 'failed'
      operation.error = String(error)
      this.operationHistory.push(operation)
      throw new Error(`Failed to create ruleset in ${repoName}: ${error}`)
    }
  }

  /**
   * Update an existing ruleset
   */
  async updateRuleset(
    repoName: string,
    rulesetId: number,
    updates: Partial<RulesetTemplate>
  ): Promise<GitHubRuleset> {
    const operation: RulesetOperation = {
      type: 'update',
      repository: repoName,
      rulesetId,
      status: 'pending',
      appliedAt: new Date().toISOString()
    }

    try {
      // Get current ruleset
      const { data: currentRuleset } = await this.octokit.rest.repos.getRuleset({
        owner: this.organization,
        repo: repoName,
        ruleset_id: rulesetId
      })

      // Merge updates with current ruleset
      const updatedTemplate = this.convertGitHubToTemplate(currentRuleset)
      const mergedTemplate = { ...updatedTemplate, ...updates }
      
      const rulesetData = this.convertTemplateToGitHubFormat(mergedTemplate)

      const { data: updatedRuleset } = await this.octokit.rest.repos.createOrUpdateRuleset({
        owner: this.organization,
        repo: repoName,
        ruleset_id: rulesetId,
        name: mergedTemplate.name,
        target: mergedTemplate.target,
        enforcement: mergedTemplate.enforcement,
        conditions: rulesetData.conditions,
        rules: rulesetData.rules,
        bypass_actors: rulesetData.bypass_actors
      })

      operation.status = 'completed'
      this.operationHistory.push(operation)

      return this.formatGitHubRuleset(updatedRuleset)
    } catch (error) {
      operation.status = 'failed'
      operation.error = String(error)
      this.operationHistory.push(operation)
      throw new Error(`Failed to update ruleset ${rulesetId} in ${repoName}: ${error}`)
    }
  }

  /**
   * Delete a ruleset
   */
  async deleteRuleset(repoName: string, rulesetId: number): Promise<void> {
    const operation: RulesetOperation = {
      type: 'delete',
      repository: repoName,
      rulesetId,
      status: 'pending',
      appliedAt: new Date().toISOString()
    }

    try {
      await this.octokit.rest.repos.deleteRuleset({
        owner: this.organization,
        repo: repoName,
        ruleset_id: rulesetId
      })

      operation.status = 'completed'
      this.operationHistory.push(operation)
    } catch (error) {
      operation.status = 'failed'
      operation.error = String(error)
      this.operationHistory.push(operation)
      throw new Error(`Failed to delete ruleset ${rulesetId} in ${repoName}: ${error}`)
    }
  }

  /**
   * Get all rulesets for a repository
   */
  async getRepositoryRulesets(repoName: string): Promise<GitHubRuleset[]> {
    try {
      const { data: rulesets } = await this.octokit.rest.repos.getAllRulesets({
        owner: this.organization,
        repo: repoName
      })

      return rulesets.map(ruleset => this.formatGitHubRuleset(ruleset))
    } catch (error) {
      throw new Error(`Failed to get rulesets for ${repoName}: ${error}`)
    }
  }

  /**
   * Get ruleset insights
   */
  async getRulesetInsights(
    repoName: string, 
    rulesetId: number,
    startDate?: string,
    endDate?: string
  ): Promise<RulesetInsights> {
    try {
      // Get rule suites for the ruleset
      const { data: ruleSuites } = await this.octokit.rest.repos.getRulesetViolations({
        owner: this.organization,
        repo: repoName,
        ruleset_id: rulesetId,
        per_page: 100
      })

      const evaluations = ruleSuites.suites || []
      const passed = evaluations.filter(e => e.result === 'pass').length
      const failed = evaluations.filter(e => e.result === 'fail').length
      const bypassed = evaluations.filter(e => e.result === 'bypass').length

      // Analyze failure reasons
      const failureReasons: Record<string, number> = {}
      evaluations.forEach(evaluation => {
        if (evaluation.result === 'fail' && evaluation.violations) {
          evaluation.violations.forEach((violation: any) => {
            const reason = violation.rule || 'unknown'
            failureReasons[reason] = (failureReasons[reason] || 0) + 1
          })
        }
      })

      const topFailureReasons = Object.entries(failureReasons)
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      const recommendations = this.generateInsightRecommendations(
        passed, failed, bypassed, topFailureReasons
      )

      return {
        rulesetId,
        repository: repoName,
        evaluationPeriod: {
          startDate: startDate || evaluations[0]?.created_at || new Date().toISOString(),
          endDate: endDate || new Date().toISOString()
        },
        totalEvaluations: evaluations.length,
        passedEvaluations: passed,
        failedEvaluations: failed,
        bypassedEvaluations: bypassed,
        topFailureReasons,
        recommendations
      }
    } catch (error) {
      throw new Error(`Failed to get insights for ruleset ${rulesetId} in ${repoName}: ${error}`)
    }
  }

  /**
   * Batch operations on multiple repositories
   */
  async batchRulesetOperations(
    operations: Array<{
      type: 'create' | 'update' | 'delete'
      repository: string
      rulesetId?: number
      rulesetTemplate?: RulesetTemplate
      updates?: Partial<RulesetTemplate>
    }>
  ): Promise<RulesetBatchOperation> {
    const results: RulesetOperation[] = []

    for (const operation of operations) {
      try {
        let result: RulesetOperation

        switch (operation.type) {
          case 'create':
            if (!operation.rulesetTemplate) {
              throw new Error('Ruleset template required for create operation')
            }
            await this.createRuleset(operation.repository, operation.rulesetTemplate)
            result = {
              type: 'create',
              repository: operation.repository,
              status: 'completed',
              appliedAt: new Date().toISOString()
            }
            break

          case 'update':
            if (!operation.rulesetId || !operation.updates) {
              throw new Error('Ruleset ID and updates required for update operation')
            }
            await this.updateRuleset(operation.repository, operation.rulesetId, operation.updates)
            result = {
              type: 'update',
              repository: operation.repository,
              rulesetId: operation.rulesetId,
              status: 'completed',
              appliedAt: new Date().toISOString()
            }
            break

          case 'delete':
            if (!operation.rulesetId) {
              throw new Error('Ruleset ID required for delete operation')
            }
            await this.deleteRuleset(operation.repository, operation.rulesetId)
            result = {
              type: 'delete',
              repository: operation.repository,
              rulesetId: operation.rulesetId,
              status: 'completed',
              appliedAt: new Date().toISOString()
            }
            break

          default:
            throw new Error(`Unknown operation type: ${operation.type}`)
        }

        results.push(result)
      } catch (error) {
        results.push({
          type: operation.type,
          repository: operation.repository,
          rulesetId: operation.rulesetId,
          status: 'failed',
          error: String(error),
          appliedAt: new Date().toISOString()
        })
      }
    }

    const completed = results.filter(r => r.status === 'completed').length
    const failed = results.filter(r => r.status === 'failed').length
    const errors = results
      .filter(r => r.status === 'failed')
      .map(r => r.error || 'Unknown error')

    return {
      operations: results,
      summary: {
        total: results.length,
        completed,
        failed,
        errors
      },
      executedAt: new Date().toISOString()
    }
  }

  /**
   * Sync rulesets across organization based on repository properties
   */
  async syncOrganizationRulesets(
    repositoryProperties: Record<string, Partial<RepositoryProperties>>,
    policyApplications: Record<string, PolicyApplication>
  ): Promise<RulesetBatchOperation> {
    const operations: Array<{
      type: 'create' | 'update' | 'delete'
      repository: string
      rulesetId?: number
      rulesetTemplate?: RulesetTemplate
      updates?: Partial<RulesetTemplate>
    }> = []

    // Get all repositories in the organization
    const { data: repos } = await this.octokit.rest.repos.listForOrg({
      org: this.organization,
      type: 'all',
      per_page: 100
    })

    for (const repo of repos) {
      const repoName = repo.name
      const properties = repositoryProperties[repoName]
      const policyApplication = policyApplications[repoName]

      if (!properties || !policyApplication) {
        continue
      }

      try {
        const currentRulesets = await this.getRepositoryRulesets(repoName)
        const desiredRulesetIds = policyApplication.rulesets.map(id => parseInt(id))

        // Delete rulesets that are no longer needed
        for (const currentRuleset of currentRulesets) {
          if (!desiredRulesetIds.includes(currentRuleset.id)) {
            operations.push({
              type: 'delete',
              repository: repoName,
              rulesetId: currentRuleset.id
            })
          }
        }

        // Create or update rulesets based on policy applications
        for (const rulesetId of desiredRulesetIds) {
          if (currentRulesets.some(r => r.id === rulesetId)) {
            // Update existing ruleset
            operations.push({
              type: 'update',
              repository: repoName,
              rulesetId,
              updates: {
                // Add any updates based on repository properties
                enforcement: this.determineEnforcementLevel(properties)
              }
            })
          } else {
            // Create new ruleset
            operations.push({
              type: 'create',
              repository: repoName,
              rulesetTemplate: {
                name: `Policy Ruleset ${rulesetId}`,
                description: `Auto-generated ruleset for ${repoName}`,
                target: 'branch',
                enforcement: this.determineEnforcementLevel(properties),
                conditions: {
                  refName: {
                    include: ['~DEFAULT_BRANCH', 'main', 'master'],
                    exclude: []
                  }
                },
                rules: this.generateRulesForProperties(properties),
                bypassActors: this.generateBypassActors(properties)
              }
            })
          }
        }
      } catch (error) {
        console.warn(`Failed to process rulesets for ${repoName}:`, error)
      }
    }

    return this.batchRulesetOperations(operations)
  }

  /**
   * Get operation history
   */
  getOperationHistory(
    repository?: string,
    operationType?: 'create' | 'update' | 'delete',
    limit: number = 50
  ): RulesetOperation[] {
    let filtered = this.operationHistory

    if (repository) {
      filtered = filtered.filter(op => op.repository === repository)
    }

    if (operationType) {
      filtered = filtered.filter(op => op.type === operationType)
    }

    return filtered
      .sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime())
      .slice(0, limit)
  }

  /**
   * Get compliance status across organization
   */
  async getOrganizationComplianceStatus(): Promise<{
    totalRepositories: number
    repositoriesWithRulesets: number
    totalRulesets: number
    activeRulesets: number
    evaluateRulesets: number
    disabledRulesets: number
    complianceScore: number
    repositories: Array<{
      name: string
      rulesets: number
      activeRulesets: number
      complianceScore: number
    }>
  }> {
    const { data: repos } = await this.octokit.rest.repos.listForOrg({
      org: this.organization,
      type: 'all',
      per_page: 100
    })

    let totalRulesets = 0
    let activeRulesets = 0
    let evaluateRulesets = 0
    let disabledRulesets = 0
    let repositoriesWithRulesets = 0

    const repositoryStats = []

    for (const repo of repos) {
      try {
        const rulesets = await this.getRepositoryRulesets(repo.name)
        
        if (rulesets.length > 0) {
          repositoriesWithRulesets++
        }

        totalRulesets += rulesets.length
        activeRulesets += rulesets.filter(r => r.enforcement === 'active').length
        evaluateRulesets += rulesets.filter(r => r.enforcement === 'evaluate').length
        disabledRulesets += rulesets.filter(r => r.enforcement === 'disabled').length

        const repoComplianceScore = this.calculateRepositoryComplianceScore(rulesets)
        
        repositoryStats.push({
          name: repo.name,
          rulesets: rulesets.length,
          activeRulesets: rulesets.filter(r => r.enforcement === 'active').length,
          complianceScore: repoComplianceScore
        })
      } catch (error) {
        console.warn(`Failed to get compliance status for ${repo.name}:`, error)
      }
    }

    const overallComplianceScore = repositoryStats.length > 0
      ? repositoryStats.reduce((sum, repo) => sum + repo.complianceScore, 0) / repositoryStats.length
      : 0

    return {
      totalRepositories: repos.length,
      repositoriesWithRulesets,
      totalRulesets,
      activeRulesets,
      evaluateRulesets,
      disabledRulesets,
      complianceScore: Math.round(overallComplianceScore * 100) / 100,
      repositories: repositoryStats.sort((a, b) => b.complianceScore - a.complianceScore)
    }
  }

  // Helper methods

  private convertTemplateToGitHubFormat(template: RulesetTemplate): any {
    const rules: any[] = []

    template.rules.forEach(rule => {
      const githubRule: any = { type: rule.type }
      
      if (rule.parameters) {
        githubRule.parameters = rule.parameters
      }

      rules.push(githubRule)
    })

    return {
      conditions: template.conditions,
      rules,
      bypass_actors: template.bypassActors
    }
  }

  private convertGitHubToTemplate(githubRuleset: any): RulesetTemplate {
    const rules: any[] = []

    if (githubRuleset.rules) {
      githubRuleset.rules.forEach((rule: any) => {
        const templateRule: any = {
          type: rule.type
        }
        
        if (rule.parameters) {
          templateRule.parameters = rule.parameters
        }

        rules.push(templateRule)
      })
    }

    return {
      name: githubRuleset.name,
      description: githubRuleset.description || '',
      target: githubRuleset.target,
      enforcement: githubRuleset.enforcement,
      conditions: githubRuleset.conditions || {
        refName: {
          include: [],
          exclude: []
        }
      },
      rules,
      bypassActors: githubRuleset.bypass_actors || []
    }
  }

  private formatGitHubRuleset(githubRuleset: any): GitHubRuleset {
    return {
      id: githubRuleset.id,
      name: githubRuleset.name,
      target: githubRuleset.target,
      source_type: githubRuleset.source_type,
      source: githubRuleset.source,
      enforcement: githubRuleset.enforcement,
      conditions: githubRuleset.conditions,
      rules: githubRuleset.rules || [],
      bypass_actors: githubRuleset.bypass_actors || [],
      created_at: githubRuleset.created_at,
      updated_at: githubRuleset.updated_at
    }
  }

  private generateInsightRecommendations(
    passed: number,
    failed: number,
    bypassed: number,
    topFailureReasons: Array<{reason: string, count: number}>
  ): string[] {
    const recommendations: string[] = []

    if (failed > passed) {
      recommendations.push('Consider reviewing ruleset configuration - high failure rate detected')
    }

    if (bypassed > passed) {
      recommendations.push('High bypass rate detected - consider reviewing bypass actor permissions')
    }

    if (topFailureReasons.length > 0) {
      const topReason = topFailureReasons[0]
      if (topReason.count > 5) {
        recommendations.push(`Address recurring failure: ${topReason.reason} (${topReason.count} occurrences)`)
      }
    }

    if (passed === 0 && failed === 0) {
      recommendations.push('No evaluations found - ruleset may not be actively enforced')
    }

    if (passed / (passed + failed) > 0.9) {
      recommendations.push('Excellent compliance rate - consider tightening rules for better security')
    }

    return recommendations
  }

  private determineEnforcementLevel(properties: Partial<RepositoryProperties>): 'disabled' | 'active' | 'evaluate' {
    if (properties.lifecycle_stage === 'Development' || properties.lifecycle_stage === 'Testing') {
      return 'evaluate'
    }
    
    if (properties.business_criticality === 'Critical' || properties.security_classification === 'Critical') {
      return 'active'
    }

    return 'active'
  }

  private generateRulesForProperties(properties: Partial<RepositoryProperties>): any[] {
    const rules: any[] = []

    // Base rules for all repositories
    rules.push({ type: 'creation' })
    rules.push({ type: 'update' })

    // Add rules based on properties
    if (properties.business_criticality === 'Critical' || properties.security_classification === 'Critical') {
      rules.push({ type: 'required_linear_history' })
      rules.push({
        type: 'pull_request',
        parameters: {
          required_approving_review_count: 3,
          require_code_owner_reviews: true,
          require_up_to_date_branch: true
        }
      })
    } else if (properties.business_criticality === 'High' || properties.security_classification === 'High') {
      rules.push({
        type: 'pull_request',
        parameters: {
          required_approving_review_count: 2,
          require_code_owner_reviews: true,
          require_up_to_date_branch: true
        }
      })
    } else {
      rules.push({
        type: 'pull_request',
        parameters: {
          required_approving_review_count: 1,
          require_up_to_date_branch: true
        }
      })
    }

    // Add testing requirements for critical systems
    if (properties.business_criticality === 'Critical' && properties.automated_tests) {
      rules.push({
        type: 'required_status_checks',
        parameters: {
          required_status_checks: [
            'build-test',
            'security-scan',
            'integration-test'
          ]
        }
      })
    }

    return rules
  }

  private generateBypassActors(properties: Partial<RepositoryProperties>): GitHubBypassActor[] {
    const bypassActors: GitHubBypassActor[] = []

    // Organization admins can always bypass
    bypassActors.push({
      actor_type: 'OrganizationAdmin',
      bypass_mode: 'pull_request'
    })

    // Core contributors can bypass for less critical repos
    if (properties.business_criticality !== 'Critical' && properties.security_classification !== 'Critical') {
      bypassActors.push({
        actor_type: 'RepositoryRole',
        bypass_mode: 'pull_request'
      })
    }

    return bypassActors
  }

  private calculateRepositoryComplianceScore(rulesets: GitHubRuleset[]): number {
    if (rulesets.length === 0) return 0

    let score = 0
    let maxScore = 0

    rulesets.forEach(ruleset => {
      const rulesetScore = this.calculateRulesetScore(ruleset)
      score += rulesetScore
      maxScore += 100
    })

    return maxScore > 0 ? (score / maxScore) * 100 : 0
  }

  private calculateRulesetScore(ruleset: GitHubRuleset): number {
    let score = 0

    // Base score for having a ruleset
    score += 20

    // Enforcement level scoring
    switch (ruleset.enforcement) {
      case 'active':
        score += 30
        break
      case 'evaluate':
        score += 20
        break
      case 'disabled':
        score += 0
        break
    }

    // Rules complexity scoring
    const ruleTypes = new Set(ruleset.rules.map(r => r.type))
    score += Math.min(ruleTypes.size * 5, 30)

    // Security-related rules bonus
    const securityRules = ruleset.rules.filter(r => 
      r.type === 'required_linear_history' || 
      r.type === 'required_status_checks' ||
      r.type === 'pull_request'
    )
    score += Math.min(securityRules.length * 5, 20)

    return Math.min(score, 100)
  }
}
