/**
 * CI/CD Cost Monitoring
 * 
 * Monitors GitHub Actions usage and costs across repositories.
 * Provides detailed CI/CD metrics and cost optimization recommendations.
 */

import type { CicdUsage, CostMetrics, TenantId } from './types'

/**
 * GitHub Actions pricing configuration
 */
interface GitHubActionsPricing {
  /** Cost per minute for Ubuntu runners */
  ubuntuPerMinute: number
  /** Cost per minute for Windows runners */
  windowsPerMinute: number
  /** Cost per minute for macOS runners */
  macosPerMinute: number
  /** Free minutes per month */
  freeMinutesPerMonth: number
}

/**
 * CI/CD cost monitor configuration
 */
interface CicdCostConfig {
  /** GitHub organization name */
  organization: string
  /** GitHub token for API access */
  githubToken: string
  /** Pricing configuration */
  pricing: GitHubActionsPricing
  /** Collection interval in hours */
  collectionInterval: number
}

/**
 * CI/CD cost monitor class
 */
export class CicdCostMonitor {
  private config: CicdCostConfig

  constructor(config: CicdCostConfig) {
    this.config = {
      pricing: config.pricing || {
        ubuntuPerMinute: 0.008, // $0.008 per minute
        windowsPerMinute: 0.016, // $0.016 per minute
        macosPerMinute: 0.08, // $0.08 per minute
        freeMinutesPerMonth: 2000,
      },
      collectionInterval: config.collectionInterval || 1, // 1 hour default
      organization: config.organization,
      githubToken: config.githubToken,
    }
  }

  /**
   * Collects CI/CD usage data from GitHub Actions API
   */
  async collectCicdUsage(): Promise<CicdUsage[]> {
    try {
      const repositories = await this.getOrganizationRepositories()
      const usageData: CicdUsage[] = []

      for (const repo of repositories) {
        const repoUsage = await this.getRepositoryUsage(repo)
        usageData.push(...repoUsage)
      }

      // Sort by timestamp (most recent first)
      usageData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      console.log('CI/CD usage collected', {
        repositoryCount: repositories.length,
        totalWorkflows: usageData.length,
        totalRuntime: usageData.reduce((sum, usage) => sum + usage.runtimeMinutes, 0),
        totalCost: usageData.reduce((sum, usage) => sum + usage.totalCost, 0),
      })

      return usageData
    } catch (error) {
      console.error('Error collecting CI/CD usage:', error)
      throw error
    }
  }

  /**
   * Gets repository list for the organization
   */
  private async getOrganizationRepositories(): Promise<string[]> {
    try {
      const response = await fetch(
        `https://api.github.com/orgs/${this.config.organization}/repos`,
        {
          headers: {
            'Authorization': `token ${this.config.githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      )

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.statusText}`)
      }

      const repos = await response.json() as any[]
      return repos.map((repo: any) => repo.name)
    } catch (error) {
      console.error('Error getting organization repositories:', error)
      throw error
    }
  }

  /**
   * Gets usage data for a specific repository
   */
  private async getRepositoryUsage(repository: string): Promise<CicdUsage[]> {
    try {
      // Get workflow runs for the last 30 days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const response = await fetch(
        `https://api.github.com/repos/${this.config.organization}/${repository}/actions/runs`,
        {
          headers: {
            'Authorization': `token ${this.config.githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      )

      if (!response.ok) {
        console.warn(`Could not fetch runs for ${repository}: ${response.statusText}`)
        return []
      }

      const data = await response.json() as any
      const runs = data.workflow_runs || []

      // Group runs by workflow
      const workflowRuns = new Map<string, any[]>()
      
      for (const run of runs) {
        const workflowName = run.name || 'Unknown'
        if (!workflowRuns.has(workflowName)) {
          workflowRuns.set(workflowName, [])
        }
        workflowRuns.get(workflowName)!.push(run)
      }

      // Calculate usage for each workflow
      const usageData: CicdUsage[] = []
      
      for (const [workflowName, runs] of workflowRuns.entries()) {
        const usage = this.calculateWorkflowUsage(repository, workflowName, runs)
        if (usage) {
          usageData.push(usage)
        }
      }

      return usageData
    } catch (error) {
      console.error(`Error getting repository usage for ${repository}:`, error)
      return []
    }
  }

  /**
   * Calculates usage metrics for a specific workflow
   */
  private calculateWorkflowUsage(
    repository: string,
    workflowName: string,
    runs: any[]
  ): CicdUsage | null {
    if (runs.length === 0) return null

    // Filter runs from the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentRuns = runs.filter(run => 
      new Date(run.created_at) >= thirtyDaysAgo
    )

    if (recentRuns.length === 0) return null

    // Calculate total runtime and cost
    let totalRuntimeMinutes = 0
    let totalCost = 0
    const runnerTypes = new Set<string>()

    for (const run of recentRuns) {
      const runtimeMinutes = this.calculateRunTimeMinutes(run)
      const costPerMinute = this.getCostPerMinute(run)
      
      totalRuntimeMinutes += runtimeMinutes
      totalCost += runtimeMinutes * costPerMinute
      runnerTypes.add(run.runner_os || 'ubuntu-latest')
    }

    // Use the most common runner type
    const runnerType = this.getMostCommonRunnerType(Array.from(runnerTypes))

    return {
      workflowName,
      repository,
      runnerType,
      runtimeMinutes: totalRuntimeMinutes,
      jobRuns: recentRuns.length,
      costPerMinute: this.getCostPerMinute({ runner_os: runnerType }),
      totalCost,
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * Calculates runtime in minutes for a workflow run
   */
  private calculateRunTimeMinutes(run: any): number {
    if (!run.started_at || !run.completed_at) return 0
    
    const startTime = new Date(run.started_at)
    const endTime = new Date(run.completed_at)
    const durationMs = endTime.getTime() - startTime.getTime()
    
    return Math.max(0, durationMs / (1000 * 60)) // Convert to minutes
  }

  /**
   * Gets cost per minute based on runner type
   */
  private getCostPerMinute(run: any): number {
    const runnerOs = run.runner_os || 'ubuntu-latest'
    
    switch (runnerOs.toLowerCase()) {
      case 'windows':
      case 'windows-latest':
        return this.config.pricing.windowsPerMinute
      case 'macos':
      case 'macos-latest':
        return this.config.pricing.macosPerMinute
      default:
        return this.config.pricing.ubuntuPerMinute
    }
  }

  /**
   * Gets the most common runner type from an array
   */
  private getMostCommonRunnerType(runnerTypes: string[]): string {
    const counts = runnerTypes.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)[0][0]
  }

  /**
   * Generates CI/CD optimization recommendations
   */
  async generateOptimizationRecommendations(
    usageData: CicdUsage[]
  ): Promise<Array<{
    type: 'runner_optimization' | 'workflow_caching' | 'parallel_execution' | 'scheduling'
    title: string
    description: string
    estimatedSavings: number
    difficulty: 'easy' | 'medium' | 'hard'
    priority: 'low' | 'medium' | 'high'
    workflow?: string
    repository?: string
  }>> {
    const recommendations = []

    // Check for expensive workflows
    const expensiveWorkflows = usageData
      .filter(usage => usage.totalCost > 10) // More than $10 per month
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, 5)

    for (const workflow of expensiveWorkflows) {
      recommendations.push({
        type: 'runner_optimization' as const,
        title: `Optimize ${workflow.workflowName} Workflow`,
        description: `This workflow costs $${workflow.totalCost.toFixed(2)} per month. Consider using more efficient runners or optimizing the workflow steps.`,
        estimatedSavings: workflow.totalCost * 0.3, // 30% potential savings
        difficulty: 'medium' as const,
        priority: 'high' as const,
        workflow: workflow.workflowName,
        repository: workflow.repository,
      })
    }

    // Check for workflows using expensive runners
    const expensiveRunnerWorkflows = usageData.filter(usage => 
      usage.runnerType.includes('macos') || usage.runnerType.includes('windows')
    )

    if (expensiveRunnerWorkflows.length > 0) {
      recommendations.push({
        type: 'runner_optimization' as const,
        title: 'Switch to Ubuntu Runners',
        description: `Found ${expensiveRunnerWorkflows.length} workflows using expensive runners. Ubuntu runners are 50-75% cheaper than Windows/macOS.`,
        estimatedSavings: expensiveRunnerWorkflows.reduce((sum, usage) => 
          sum + (usage.totalCost * 0.5), 0), // 50% savings estimate
        difficulty: 'easy' as const,
        priority: 'high' as const,
      })
    }

    // Check for workflows with long runtimes
    const longRunningWorkflows = usageData.filter(usage => 
      usage.runtimeMinutes / usage.jobRuns > 30 // Average > 30 minutes per run
    )

    for (const workflow of longRunningWorkflows) {
      recommendations.push({
        type: 'workflow_caching' as const,
        title: `Add Caching to ${workflow.workflowName}`,
        description: `This workflow has an average runtime of ${(workflow.runtimeMinutes / workflow.jobRuns).toFixed(1)} minutes. Consider adding dependency caching or parallel execution.`,
        estimatedSavings: workflow.totalCost * 0.2, // 20% potential savings
        difficulty: 'medium' as const,
        priority: 'medium' as const,
        workflow: workflow.workflowName,
        repository: workflow.repository,
      })
    }

    console.log('CI/CD recommendations generated', {
        count: recommendations.length,
        totalSavings: recommendations.reduce((sum, rec) => sum + rec.estimatedSavings, 0),
      })

    return recommendations
  }

  /**
   * Converts CI/CD usage to cost metrics
   */
  async convertToCostMetrics(
    cicdUsage: CicdUsage[],
    tenantId: TenantId
  ): Promise<CostMetrics> {
    const totalRuntimeMinutes = cicdUsage.reduce((sum, usage) => sum + usage.runtimeMinutes, 0)
    const totalCost = cicdUsage.reduce((sum, usage) => sum + usage.totalCost, 0)
    
    return {
      id: `cicd-${Date.now()}`,
      tenantId,
      storageUsage: 0, // No storage cost in CI/CD metrics
      cicdRuntime: totalRuntimeMinutes,
      bandwidthUsage: 0, // No bandwidth cost in CI/CD metrics
      totalCost,
      currency: 'USD',
      timestamp: new Date().toISOString(),
      period: 'daily',
      metadata: {
        workflowCount: cicdUsage.length,
        repositoryCount: new Set(cicdUsage.map(u => u.repository)).size,
        averageRuntime: totalRuntimeMinutes / cicdUsage.length || 0,
        mostExpensiveWorkflow: cicdUsage.reduce((max, usage) => 
          usage.totalCost > max.totalCost ? usage : max, cicdUsage[0])?.workflowName,
      },
    }
  }

  /**
   * Gets current billing period usage from GitHub
   */
  async getBillingPeriodUsage(): Promise<{
    totalMinutes: number
    includedMinutes: number
    paidMinutes: number
    totalCost: number
  }> {
    try {
      // Note: This would require GitHub Enterprise Cloud API access
      // For now, we'll estimate based on collected data
      const usage = await this.collectCicdUsage()
      const totalMinutes = usage.reduce((sum, u) => sum + u.runtimeMinutes, 0)
      const totalCost = usage.reduce((sum, u) => sum + u.totalCost, 0)
      
      return {
        totalMinutes,
        includedMinutes: this.config.pricing.freeMinutesPerMonth,
        paidMinutes: Math.max(0, totalMinutes - this.config.pricing.freeMinutesPerMonth),
        totalCost,
      }
    } catch (error) {
      console.error('Error getting billing period usage:', error)
      throw error
    }
  }
}
