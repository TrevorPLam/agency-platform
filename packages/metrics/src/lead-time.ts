import type { PullRequestEvent, DeploymentEvent, MetricsConfig } from './types'

/**
 * Lead Time for Changes Calculator
 * 
 * Calculates the lead time metric based on the time from first commit
 * to production deployment for merged pull requests.
 */
export class LeadTimeCalculator {
  private config: MetricsConfig

  constructor(config: MetricsConfig) {
    this.config = config
  }

  /**
   * Calculate average lead time for changes (in hours)
   */
  async calculate(pullRequests: PullRequestEvent[], deployments: DeploymentEvent[]): Promise<number> {
    // Filter for merged PRs that have been deployed
    const deployedPRs = this.getMergedAndDeployedPRs(pullRequests, deployments)

    if (deployedPRs.length === 0) {
      return 0
    }

    // Calculate lead times
    const leadTimes = deployedPRs.map(pr => this.calculatePRLeadTime(pr))

    // Return average lead time in hours
    const averageLeadTimeMs = leadTimes.reduce((sum, time) => sum + time, 0) / leadTimes.length
    const averageLeadTimeHours = averageLeadTimeMs / (1000 * 60 * 60)

    return Math.round(averageLeadTimeHours * 100) / 100 // Round to 2 decimal places
  }

  /**
   * Get lead time breakdown by phase
   */
  getLeadTimeBreakdown(pullRequests: PullRequestEvent[]): Array<{
    prNumber: number
    codingTime: number // hours
    reviewTime: number // hours
    deploymentTime: number // hours
    totalTime: number // hours
  }> {
    const breakdown = []

    for (const pr of pullRequests) {
      if (!pr.mergedAt) continue

      const codingTime = this.calculateTimeDiff(pr.firstCommitAt, pr.createdAt)
      const reviewTime = this.calculateTimeDiff(pr.createdAt, pr.mergedAt)
      const totalTime = this.calculateTimeDiff(pr.firstCommitAt, pr.mergedAt)

      breakdown.push({
        prNumber: pr.number,
        codingTime: Math.round(codingTime * 100) / 100,
        reviewTime: Math.round(reviewTime * 100) / 100,
        deploymentTime: 0, // Will be calculated when deployment data is available
        totalTime: Math.round(totalTime * 100) / 100
      })
    }

    return breakdown.sort((a, b) => b.totalTime - a.totalTime)
  }

  /**
   * Get lead time trend over time
   */
  getLeadTimeTrend(pullRequests: PullRequestEvent[], deployments: DeploymentEvent[]): Array<{
    week: string
    averageLeadTime: number
    prCount: number
  }> {
    const deployedPRs = this.getMergedAndDeployedPRs(pullRequests, deployments)
    const weeklyData = new Map<string, number[]>()

    for (const pr of deployedPRs) {
      const leadTime = this.calculatePRLeadTime(pr)
      const week = this.getWeekKey(pr.mergedAt!)
      
      if (!weeklyData.has(week)) {
        weeklyData.set(week, [])
      }
      weeklyData.get(week)!.push(leadTime)
    }

    const trend = []
    for (const [week, leadTimes] of weeklyData.entries()) {
      const averageLeadTime = leadTimes.reduce((sum, time) => sum + time, 0) / leadTimes.length
      const averageLeadTimeHours = averageLeadTime / (1000 * 60 * 60)
      
      trend.push({
        week,
        averageLeadTime: Math.round(averageLeadTimeHours * 100) / 100,
        prCount: leadTimes.length
      })
    }

    return trend.sort((a, b) => a.week.localeCompare(b.week))
  }

  /**
   * Get lead time by service
   */
  getLeadTimeByService(pullRequests: PullRequestEvent[], deployments: DeploymentEvent[]): Record<string, number> {
    const deployedPRs = this.getMergedAndDeployedPRs(pullRequests, deployments)
    const serviceLeadTimes = new Map<string, number[]>()

    for (const pr of deployedPRs) {
      const leadTime = this.calculatePRLeadTime(pr)
      const service = this.getPRService(pr, deployments)
      
      if (!serviceLeadTimes.has(service)) {
        serviceLeadTimes.set(service, [])
      }
      serviceLeadTimes.get(service)!.push(leadTime)
    }

    const result: Record<string, number> = {}
    for (const [service, leadTimes] of serviceLeadTimes.entries()) {
      const averageLeadTime = leadTimes.reduce((sum, time) => sum + time, 0) / leadTimes.length
      const averageLeadTimeHours = averageLeadTime / (1000 * 60 * 60)
      result[service] = Math.round(averageLeadTimeHours * 100) / 100
    }

    return result
  }

  /**
   * Get lead time statistics
   */
  getLeadTimeStatistics(pullRequests: PullRequestEvent[], deployments: DeploymentEvent[]): {
    average: number
    median: number
    p95: number
    p99: number
    min: number
    max: number
    sampleSize: number
  } {
    const deployedPRs = this.getMergedAndDeployedPRs(pullRequests, deployments)
    
    if (deployedPRs.length === 0) {
      return {
        average: 0,
        median: 0,
        p95: 0,
        p99: 0,
        min: 0,
        max: 0,
        sampleSize: 0
      }
    }

    const leadTimes = deployedPRs.map(pr => this.calculatePRLeadTime(pr))
    const leadTimesHours = leadTimes.map(time => time / (1000 * 60 * 60))
    leadTimesHours.sort((a, b) => a - b)

    const average = leadTimesHours.reduce((sum, time) => sum + time, 0) / leadTimesHours.length
    const median = this.getPercentile(leadTimesHours, 50)
    const p95 = this.getPercentile(leadTimesHours, 95)
    const p99 = this.getPercentile(leadTimesHours, 99)
    const min = leadTimesHours[0]
    const max = leadTimesHours[leadTimesHours.length - 1]

    return {
      average: Math.round(average * 100) / 100,
      median: Math.round(median * 100) / 100,
      p95: Math.round(p95 * 100) / 100,
      p99: Math.round(p99 * 100) / 100,
      min: Math.round((min || 0) * 100) / 100,
      max: Math.round((max || 0) * 100) / 100,
      sampleSize: deployedPRs.length
    }
  }

  private getMergedAndDeployedPRs(pullRequests: PullRequestEvent[], deployments: DeploymentEvent[]): PullRequestEvent[] {
    return pullRequests.filter(pr => 
      pr.mergedAt && 
      deployments.some(deployment => 
        deployment.commitSha === this.getCommitShaFromPR(pr) &&
        this.config.environments.includes(deployment.environment)
      )
    )
  }

  private calculatePRLeadTime(pr: PullRequestEvent): number {
    return this.calculateTimeDiff(pr.firstCommitAt, pr.mergedAt!)
  }

  private calculateTimeDiff(startTime: string, endTime: string): number {
    return new Date(endTime).getTime() - new Date(startTime).getTime()
  }

  private getWeekKey(date: string): string {
    const d = new Date(date)
    const year = d.getFullYear()
    const week = this.getWeekNumber(d)
    return `${year}-W${week.toString().padStart(2, '0')}`
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  }

  private getPercentile(sortedArray: number[], percentile: number): number {
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1
    return sortedArray[Math.max(0, Math.min(index, sortedArray.length - 1))] || 0
  }

  private getCommitShaFromPR(pr: PullRequestEvent): string {
    // This would typically come from the PR data or GitHub API
    // For now, we'll use a placeholder that would be populated during data collection
    return (pr.metadata?.['commitSha'] as string) || ''
  }

  private getPRService(pr: PullRequestEvent, deployments: DeploymentEvent[]): string {
    const deployment = deployments.find(d => d.commitSha === this.getCommitShaFromPR(pr))
    return deployment?.service || 'unknown'
  }
}
