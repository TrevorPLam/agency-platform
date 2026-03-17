/**
 * Knowledge Sharing Incentives System
 * 
 * This module implements contribution tracking, gamification, and
 * incentive programs to encourage knowledge sharing.
 */

import { z } from 'zod'
import {
  IncentiveProgram,
  IncentiveRule,
  Reward,
  Badge,
  ExpertiseProfile,
  KnowledgeCapture
} from './types'

// Validation schemas
const IncentiveProgramSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  type: z.enum(['points', 'badges', 'recognition', 'privileges']),
  rules: z.array(z.object({
    id: z.string(),
    action: z.enum(['contribute', 'review', 'mentor', 'share', 'endorse']),
    condition: z.record(z.unknown()),
    points: z.number(),
    badges: z.array(z.string()).optional(),
    description: z.string()
  })),
  rewards: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    type: z.enum(['digital', 'physical', 'privilege', 'recognition']),
    cost: z.number(),
    available: z.boolean(),
    claimed: z.number(),
    maxClaims: z.number().optional()
  })),
  active: z.boolean(),
  startDate: z.string(),
  endDate: z.string().optional()
})

export class IncentiveManager {
  private programs: IncentiveProgram[]
  private contributionTracker: ContributionTracker
  private badgeManager: BadgeManager

  constructor() {
    this.programs = this.getDefaultPrograms()
    this.contributionTracker = new ContributionTracker()
    this.badgeManager = new BadgeManager()
  }

  /**
   * Process contribution and apply incentives
   */
  async processContribution(
    contribution: KnowledgeCapture,
    action: 'contribute' | 'review' | 'mentor' | 'share' | 'endorse'
  ): Promise<IncentiveResult> {
    const results: IncentiveResult = {
      pointsAwarded: 0,
      badgesEarned: [],
      rewardsUnlocked: [],
      milestones: []
    }

    // Apply active programs
    for (const program of this.programs.filter(p => p.active)) {
      const applicableRules = program.rules.filter(rule => rule.action === action)
      
      for (const rule of applicableRules) {
        if (this.evaluateRuleCondition(rule.condition, contribution)) {
          await this.applyIncentiveRule(program, rule, contribution.authorEmail, results)
        }
      }
    }

    // Check for milestone achievements
    const milestones = await this.checkMilestones(contribution.authorEmail)
    results.milestones = milestones

    // Track contribution
    await this.contributionTracker.trackContribution(contribution, action, results)

    return results
  }

  /**
   * Get user incentive summary
   */
  async getUserIncentiveSummary(userEmail: string): Promise<UserIncentiveSummary> {
    const contributions = await this.contributionTracker.getUserContributions(userEmail)
    const badges = await this.badgeManager.getUserBadges(userEmail)
    const points = await this.contributionTracker.getUserPoints(userEmail)
    const availableRewards = this.getAvailableRewards(points)

    return {
      userEmail,
      totalPoints: points,
      badges,
      contributions: contributions.length,
      rank: await this.calculateUserRank(userEmail),
      availableRewards,
      nextMilestone: await this.getNextMilestone(userEmail),
      streak: await this.getContributionStreak(userEmail)
    }
  }

  /**
   * Get leader board
   */
  async getLeaderBoard(limit: number = 10): Promise<LeaderBoardEntry[]> {
    const topContributors = await this.contributionTracker.getTopContributors(limit)
    
    return topContributors.map((contributor, index) => ({
      rank: index + 1,
      userEmail: contributor.email,
      name: contributor.name,
      points: contributor.points,
      contributions: contributor.contributions,
      badges: contributor.badges,
      trend: contributor.trend
    }))
  }

  /**
   * Claim reward
   */
  async claimReward(userEmail: string, rewardId: string): Promise<RewardClaimResult> {
    const userPoints = await this.contributionTracker.getUserPoints(userEmail)
    const reward = this.findReward(rewardId)

    if (!reward) {
      return {
        success: false,
        error: 'Reward not found'
      }
    }

    if (!reward.available) {
      return {
        success: false,
        error: 'Reward not available'
      }
    }

    if (userPoints < reward.cost) {
      return {
        success: false,
        error: 'Insufficient points'
      }
    }

    if (reward.maxClaims && reward.claimed >= reward.maxClaims) {
      return {
        success: false,
        error: 'Reward limit reached'
      }
    }

    // Process claim
    await this.contributionTracker.deductPoints(userEmail, reward.cost)
    reward.claimed++
    
    return {
      success: true,
      reward,
      pointsRemaining: userPoints - reward.cost
    }
  }

  /**
   * Apply incentive rule
   */
  private async applyIncentiveRule(
    program: IncentiveProgram,
    rule: IncentiveRule,
    userEmail: string,
    results: IncentiveResult
  ): Promise<void> {
    // Award points
    results.pointsAwarded += rule.points
    await this.contributionTracker.addPoints(userEmail, rule.points)

    // Award badges
    if (rule.badges) {
      for (const badgeId of rule.badges) {
        const earned = await this.badgeManager.awardBadge(userEmail, badgeId)
        if (earned) {
          results.badgesEarned.push(badgeId)
        }
      }
    }

    // Check for reward unlocks
    const userPoints = await this.contributionTracker.getUserPoints(userEmail)
    const unlockedRewards = this.getAvailableRewards(userPoints)
      .filter(reward => reward.cost <= userPoints && !results.rewardsUnlocked.includes(reward.id))
    
    results.rewardsUnlocked.push(...unlockedRewards.map(r => r.id))
  }

  /**
   * Evaluate rule condition
   */
  private evaluateRuleCondition(condition: any, contribution: KnowledgeCapture): boolean {
    // Simple condition evaluation - in a real implementation would be more sophisticated
    for (const [key, value] of Object.entries(condition)) {
      switch (key) {
        case 'quality':
          if (contribution.quality.overall < (value as number)) return false
          break
        case 'category':
          if (contribution.category !== value) return false
          break
        case 'expertise':
          if (contribution.expertise !== value) return false
          break
        case 'tags':
          const requiredTags = value as string[]
          if (!requiredTags.every(tag => contribution.tags.includes(tag))) return false
          break
        default:
          // Unknown condition - skip
          break
      }
    }
    return true
  }

  /**
   * Check for milestone achievements
   */
  private async checkMilestones(userEmail: string): Promise<Milestone[]> {
    const milestones: Milestone[] = []
    const contributions = await this.contributionTracker.getUserContributions(userEmail)
    const points = await this.contributionTracker.getUserPoints(userEmail)

    const milestoneDefinitions = [
      { id: 'first-contribution', name: 'First Contribution', condition: contributions.length === 1 },
      { id: '10-contributions', name: '10 Contributions', condition: contributions.length === 10 },
      { id: '50-contributions', name: '50 Contributions', condition: contributions.length === 50 },
      { id: '100-contributions', name: '100 Contributions', condition: contributions.length === 100 },
      { id: '100-points', name: '100 Points', condition: points >= 100 },
      { id: '500-points', name: '500 Points', condition: points >= 500 },
      { id: '1000-points', name: '1000 Points', condition: points >= 1000 },
      { id: 'quality-expert', name: 'Quality Expert', condition: this.hasHighQualityContributions(contributions) },
      { id: 'category-master', name: 'Category Master', condition: this.hasMultipleCategories(contributions) }
    ]

    for (const milestone of milestoneDefinitions) {
      if (milestone.condition) {
        const alreadyAchieved = await this.contributionTracker.hasAchievedMilestone(userEmail, milestone.id)
        if (!alreadyAchieved) {
          milestones.push(milestone)
          await this.contributionTracker.recordMilestone(userEmail, milestone.id)
        }
      }
    }

    return milestones
  }

  /**
   * Calculate user rank
   */
  private async calculateUserRank(userEmail: string): Promise<number> {
    const allUsers = await this.contributionTracker.getAllUserPoints()
    const sortedUsers = Object.entries(allUsers)
      .sort(([, a], [, b]) => b - a)
      .map(([email]) => email)

    return sortedUsers.indexOf(userEmail) + 1
  }

  /**
   * Get next milestone
   */
  private async getNextMilestone(userEmail: string): Promise<Milestone | null> {
    const contributions = await this.contributionTracker.getUserContributions(userEmail)
    const points = await this.contributionTracker.getUserPoints(userEmail)

    const nextMilestones = [
      { contributions: 10, name: '10 Contributions' },
      { contributions: 50, name: '50 Contributions' },
      { contributions: 100, name: '100 Contributions' },
      { points: 100, name: '100 Points' },
      { points: 500, name: '500 Points' },
      { points: 1000, name: '1000 Points' }
    ]

    for (const milestone of nextMilestones) {
      if (milestone.contributions && contributions.length < milestone.contributions) {
        return {
          id: `next-${milestone.contributions}`,
          name: milestone.name,
          progress: contributions.length / milestone.contributions,
          target: milestone.contributions,
          current: contributions.length
        }
      }
      if (milestone.points && points < milestone.points) {
        return {
          id: `next-${milestone.points}`,
          name: milestone.name,
          progress: points / milestone.points,
          target: milestone.points,
          current: points
        }
      }
    }

    return null
  }

  /**
   * Get contribution streak
   */
  private async getContributionStreak(userEmail: string): Promise<number> {
    return await this.contributionTracker.getContributionStreak(userEmail)
  }

  /**
   * Get available rewards for user
   */
  private getAvailableRewards(userPoints: number): Reward[] {
    return this.programs
      .flatMap(program => program.rewards)
      .filter(reward => reward.available && reward.cost <= userPoints)
      .sort((a, b) => a.cost - b.cost)
  }

  /**
   * Find reward by ID
   */
  private findReward(rewardId: string): Reward | undefined {
    return this.programs
      .flatMap(program => program.rewards)
      .find(reward => reward.id === rewardId)
  }

  /**
   * Check if user has high quality contributions
   */
  private hasHighQualityContributions(contributions: KnowledgeCapture[]): boolean {
    const highQualityCount = contributions.filter(c => c.quality.overall >= 90).length
    return highQualityCount >= 5
  }

  /**
   * Check if user has contributions in multiple categories
   */
  private hasMultipleCategories(contributions: KnowledgeCapture[]): boolean {
    const categories = new Set(contributions.map(c => c.category))
    return categories.size >= 3
  }

  /**
   * Get default incentive programs
   */
  private getDefaultPrograms(): IncentiveProgram[] {
    return [
      {
        id: 'knowledge-sharing',
        name: 'Knowledge Sharing Program',
        description: 'Rewards for contributing valuable knowledge to the team',
        type: 'points',
        active: true,
        startDate: new Date().toISOString(),
        rules: [
          {
            id: 'basic-contribution',
            action: 'contribute',
            condition: { quality: 70 },
            points: 10,
            description: 'Basic knowledge contribution'
          },
          {
            id: 'high-quality-contribution',
            action: 'contribute',
            condition: { quality: 90 },
            points: 25,
            description: 'High-quality knowledge contribution'
          },
          {
            id: 'expert-contribution',
            action: 'contribute',
            condition: { expertise: 'expert', quality: 85 },
            points: 50,
            description: 'Expert-level knowledge contribution'
          },
          {
            id: 'review-contribution',
            action: 'review',
            condition: {},
            points: 5,
            description: 'Reviewing and improving knowledge'
          },
          {
            id: 'mentorship',
            action: 'mentor',
            condition: {},
            points: 15,
            description: 'Mentoring team members'
          },
          {
            id: 'sharing',
            action: 'share',
            condition: {},
            points: 8,
            description: 'Sharing knowledge with others'
          }
        ],
        rewards: [
          {
            id: 'team-recognition',
            name: 'Team Recognition',
            description: 'Public recognition in team meeting',
            type: 'recognition',
            cost: 50,
            available: true,
            claimed: 0
          },
          {
            id: 'learning-budget',
            name: 'Learning Budget',
            description: '$50 learning budget',
            type: 'privilege',
            cost: 100,
            available: true,
            claimed: 0
          },
          {
            id: 'conference-ticket',
            name: 'Conference Ticket',
            description: 'Conference ticket allowance',
            type: 'privilege',
            cost: 500,
            available: true,
            claimed: 0,
            maxClaims: 2
          }
        ]
      },
      {
        id: 'badge-program',
        name: 'Badge Program',
        description: 'Earn badges for achievements',
        type: 'badges',
        active: true,
        startDate: new Date().toISOString(),
        rules: [
          {
            id: 'first-badge',
            action: 'contribute',
            condition: {},
            points: 0,
            badges: ['first-contribution'],
            description: 'First contribution badge'
          },
          {
            id: 'quality-badge',
            action: 'contribute',
            condition: { quality: 95 },
            points: 0,
            badges: ['quality-master'],
            description: 'Quality master badge'
          },
          {
            id: 'category-badge',
            action: 'contribute',
            condition: { category: 'security' },
            points: 0,
            badges: ['security-expert'],
            description: 'Security expert badge'
          }
        ],
        rewards: []
      }
    ]
  }
}

/**
 * Contribution tracking system
 */
class ContributionTracker {
  private contributions: Map<string, ContributionRecord[]> = new Map()
  private points: Map<string, number> = new Map()
  private milestones: Map<string, Set<string>> = new Map()

  async trackContribution(
    contribution: KnowledgeCapture,
    action: string,
    results: IncentiveResult
  ): Promise<void> {
    const userEmail = contribution.authorEmail
    const record: ContributionRecord = {
      id: contribution.id,
      timestamp: contribution.timestamp,
      action,
      points: results.pointsAwarded,
      quality: contribution.quality.overall,
      category: contribution.category
    }

    if (!this.contributions.has(userEmail)) {
      this.contributions.set(userEmail, [])
    }
    this.contributions.get(userEmail)!.push(record)
  }

  async getUserContributions(userEmail: string): Promise<KnowledgeCapture[]> {
    // In a real implementation, would load from database
    return []
  }

  async getUserPoints(userEmail: string): Promise<number> {
    return this.points.get(userEmail) || 0
  }

  async addPoints(userEmail: string, points: number): Promise<void> {
    const current = this.points.get(userEmail) || 0
    this.points.set(userEmail, current + points)
  }

  async deductPoints(userEmail: string, points: number): Promise<void> {
    const current = this.points.get(userEmail) || 0
    this.points.set(userEmail, Math.max(0, current - points))
  }

  async getTopContributors(limit: number): Promise<TopContributor[]> {
    const allPoints = Array.from(this.points.entries())
      .map(([email, points]) => ({ email, points }))
      .sort((a, b) => b.points - a.points)
      .slice(0, limit)

    return allPoints.map((contributor, index) => ({
      rank: index + 1,
      email: contributor.email,
      name: contributor.email.split('@')[0], // Extract name from email
      points: contributor.points,
      contributions: this.contributions.get(contributor.email)?.length || 0,
      badges: [], // Would be loaded from badge manager
      trend: 'up' // Would be calculated from historical data
    }))
  }

  async getAllUserPoints(): Promise<Record<string, number>> {
    const result: Record<string, number> = {}
    this.points.forEach((points, email) => {
      result[email] = points
    })
    return result
  }

  async hasAchievedMilestone(userEmail: string, milestoneId: string): Promise<boolean> {
    return this.milestones.get(userEmail)?.has(milestoneId) || false
  }

  async recordMilestone(userEmail: string, milestoneId: string): Promise<void> {
    if (!this.milestones.has(userEmail)) {
      this.milestones.set(userEmail, new Set())
    }
    this.milestones.get(userEmail)!.add(milestoneId)
  }

  async getContributionStreak(userEmail: string): Promise<number> {
    // Simplified streak calculation - in reality would analyze dates
    const contributions = this.contributions.get(userEmail) || []
    if (contributions.length === 0) return 0

    // Group by day and count consecutive days
    const days = new Set(contributions.map(c => 
      new Date(c.timestamp).toDateString()
    ))

    return days.size
  }
}

/**
 * Badge management system
 */
class BadgeManager {
  private badges: Map<string, Set<string>> = new Map()

  async awardBadge(userEmail: string, badgeId: string): Promise<boolean> {
    if (!this.badges.has(userEmail)) {
      this.badges.set(userEmail, new Set())
    }

    const userBadges = this.badges.get(userEmail)!
    if (userBadges.has(badgeId)) {
      return false // Already has badge
    }

    userBadges.add(badgeId)
    return true
  }

  async getUserBadges(userEmail: string): Promise<Badge[]> {
    const userBadgeIds = this.badges.get(userEmail) || new Set()
    
    // In a real implementation, would load badge definitions from database
    const badgeDefinitions: Record<string, Badge> = {
      'first-contribution': {
        id: 'first-contribution',
        name: 'First Contribution',
        description: 'Made your first knowledge contribution',
        icon: '🌟',
        earnedAt: new Date().toISOString(),
        category: 'contribution'
      },
      'quality-master': {
        id: 'quality-master',
        name: 'Quality Master',
        description: 'Consistently high-quality contributions',
        icon: '💎',
        earnedAt: new Date().toISOString(),
        category: 'expertise'
      },
      'security-expert': {
        id: 'security-expert',
        name: 'Security Expert',
        description: 'Expert in security knowledge',
        icon: '🔒',
        earnedAt: new Date().toISOString(),
        category: 'expertise'
      }
    }

    return Array.from(userBadgeIds).map(id => badgeDefinitions[id]).filter(Boolean)
  }
}

// Type definitions
interface IncentiveResult {
  pointsAwarded: number
  badgesEarned: string[]
  rewardsUnlocked: string[]
  milestones: Milestone[]
}

interface UserIncentiveSummary {
  userEmail: string
  totalPoints: number
  badges: Badge[]
  contributions: number
  rank: number
  availableRewards: Reward[]
  nextMilestone: Milestone | null
  streak: number
}

interface LeaderBoardEntry {
  rank: number
  userEmail: string
  name: string
  points: number
  contributions: number
  badges: Badge[]
  trend: 'up' | 'down' | 'stable'
}

interface Milestone {
  id: string
  name: string
  progress?: number
  target?: number
  current?: number
}

interface RewardClaimResult {
  success: boolean
  reward?: Reward
  pointsRemaining?: number
  error?: string
}

interface ContributionRecord {
  id: string
  timestamp: string
  action: string
  points: number
  quality: number
  category: string
}

interface TopContributor {
  rank: number
  email: string
  name: string
  points: number
  contributions: number
  badges: Badge[]
  trend: 'up' | 'down' | 'stable'
}
