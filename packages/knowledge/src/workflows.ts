/**
 * Workflow Integration System
 * 
 * This module integrates knowledge management with existing development workflows,
 * providing automated capture, indexing, and notification capabilities.
 */

import { z } from 'zod'
import { execSync } from 'child_process'
import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import {
  WorkflowTrigger,
  WorkflowAction,
  KnowledgeCapture,
  IncentiveProgram,
  IncentiveRule,
  Reward
} from './types'
import { KnowledgeCaptureEngine } from './capture'
import { ExpertiseMapper } from './expertise'
import { KnowledgeSearchEngine } from './search'

// Validation schemas
const WorkflowTriggerSchema = z.object({
  type: z.enum(['commit', 'pr', 'issue', 'release', 'schedule']),
  conditions: z.record(z.unknown()),
  actions: z.array(z.object({
    type: z.enum(['capture', 'index', 'notify', 'audit', 'incentivize']),
    config: z.record(z.unknown())
  }))
})

export class WorkflowManager {
  private captureEngine: KnowledgeCaptureEngine
  private expertiseMapper: ExpertiseMapper
  private searchEngine: KnowledgeSearchEngine
  private triggers: WorkflowTrigger[]
  private incentivePrograms: IncentiveProgram[]

  constructor(repositoryPath: string = process.cwd()) {
    this.captureEngine = new KnowledgeCaptureEngine(repositoryPath)
    this.expertiseMapper = new ExpertiseMapper(repositoryPath)
    this.searchEngine = new KnowledgeSearchEngine()
    this.triggers = this.getDefaultTriggers()
    this.incentivePrograms = this.getDefaultIncentivePrograms()
  }

  /**
   * Process workflow triggers based on git events
   */
  async processEvent(eventType: string, eventData: any): Promise<void> {
    try {
      const relevantTriggers = this.triggers.filter(trigger => 
        trigger.type === eventType && this.evaluateConditions(trigger.conditions, eventData)
      )

      for (const trigger of relevantTriggers) {
        await this.executeActions(trigger.actions, eventData)
      }
    } catch (error) {
      console.error(`Error processing ${eventType} event:`, error)
    }
  }

  /**
   * Execute workflow actions
   */
  private async executeActions(actions: WorkflowAction[], eventData: any): Promise<void> {
    for (const action of actions) {
      try {
        switch (action.type) {
          case 'capture':
            await this.executeCaptureAction(action.config, eventData)
            break
          case 'index':
            await this.executeIndexAction(action.config, eventData)
            break
          case 'notify':
            await this.executeNotifyAction(action.config, eventData)
            break
          case 'audit':
            await this.executeAuditAction(action.config, eventData)
            break
          case 'incentivize':
            await this.executeIncentivizeAction(action.config, eventData)
            break
        }
      } catch (error) {
        console.error(`Error executing ${action.type} action:`, error)
      }
    }
  }

  /**
   * Execute knowledge capture action
   */
  private async executeCaptureAction(config: any, eventData: any): Promise<void> {
    const { source, limit = 50 } = config

    let captures: KnowledgeCapture[] = []

    switch (source) {
      case 'commits':
        captures = await this.captureEngine.captureFromCommits(undefined, limit)
        break
      case 'code':
        captures = await this.captureEngine.captureFromCode()
        break
      case 'pr':
        captures = await this.captureFromPR(eventData.prNumber)
        break
      case 'issue':
        captures = await this.captureFromIssue(eventData.issueNumber)
        break
    }

    if (captures.length > 0) {
      console.log(`Captured ${captures.length} knowledge items from ${source}`)
      
      // Update search engine with new captures
      const existingKnowledge = this.searchEngine['knowledgeBase'] || []
      this.searchEngine.updateKnowledgeBase([...existingKnowledge, ...captures])
      
      // Store captures (in a real implementation, would save to database)
      await this.storeKnowledgeCaptures(captures)
    }
  }

  /**
   * Execute indexing action
   */
  private async executeIndexAction(config: any, eventData: any): Promise<void> {
    const { rebuildExpertise = false } = config

    if (rebuildExpertise) {
      const expertiseProfiles = await this.expertiseMapper.mapRepositoryExpertise()
      console.log(`Indexed expertise for ${expertiseProfiles.length} contributors`)
      
      // Store expertise profiles (in a real implementation, would save to database)
      await this.storeExpertiseProfiles(expertiseProfiles)
    }

    // Rebuild search index
    const allKnowledge = await this.loadAllKnowledge()
    this.searchEngine.updateKnowledgeBase(allKnowledge)
    console.log('Rebuilt search index')
  }

  /**
   * Execute notification action
   */
  private async executeNotifyAction(config: any, eventData: any): Promise<void> {
    const { type, recipients, message } = config

    switch (type) {
      case 'new-knowledge':
        await this.notifyNewKnowledge(eventData, recipients)
        break
      case 'expertise-update':
        await this.notifyExpertiseUpdate(eventData, recipients)
        break
      case 'quality-alert':
        await this.notifyQualityAlert(eventData, recipients)
        break
    }
  }

  /**
   * Execute audit action
   */
  private async executeAuditAction(config: any, eventData: any): Promise<void> {
    const { type, scope } = config

    switch (type) {
      case 'quality':
        await this.auditKnowledgeQuality(scope)
        break
      case 'completeness':
        await this.auditKnowledgeCompleteness(scope)
        break
      case 'accuracy':
        await this.auditKnowledgeAccuracy(scope)
        break
    }
  }

  /**
   * Execute incentivize action
   */
  private async executeIncentivizeAction(config: any, eventData: any): Promise<void> {
    const { programId, action } = config

    const program = this.incentivePrograms.find(p => p.id === programId)
    if (!program || !program.active) {
      return
    }

    await this.applyIncentiveRules(program, action, eventData)
  }

  /**
   * Capture knowledge from pull request
   */
  private async captureFromPR(prNumber: number): Promise<KnowledgeCapture[]> {
    try {
      // Get PR information
      const prInfo = execSync(
        `gh pr view ${prNumber} --json title,body,author,files,createdAt`,
        { encoding: 'utf-8' }
      )
      
      const pr = JSON.parse(prInfo)
      const captures: KnowledgeCapture[] = []

      // Capture PR description as knowledge
      if (pr.body && pr.body.length > 100) {
        const capture = await this.captureEngine['processCommit'](
          `pr-${prNumber}`,
          pr.author.name || pr.author.login,
          pr.author.email || `${pr.author.login}@users.noreply.github.com`,
          pr.title,
          pr.body
        )
        
        if (capture) {
          captures.push({
            ...capture,
            source: 'pr',
            prNumber,
            metadata: {
              ...capture.metadata,
              prUrl: `https://github.com/${this.getRepositoryName()}/pull/${prNumber}`,
              filesChanged: pr.files.length
            }
          })
        }
      }

      // Capture knowledge from changed files
      for (const file of pr.files.slice(0, 10)) { // Limit to 10 files
        try {
          const fileContent = await this.getFileContent(file.path, pr.base.sha)
          const analysis = await this.captureEngine['analyzeCodeContent'](fileContent, file.path)
          
          if (analysis.hasValue) {
            captures.push({
              id: `pr-${prNumber}-${file.path}`,
              title: analysis.title,
              content: fileContent,
              summary: analysis.summary,
              source: 'pr',
              category: analysis.category,
              tags: [...analysis.tags, 'pull-request'],
              expertise: analysis.expertise,
              timestamp: pr.createdAt,
              author: pr.author.name || pr.author.login,
              authorEmail: pr.author.email || `${pr.author.login}@users.noreply.github.com`,
              repository: this.getRepositoryName(),
              filePath: file.path,
              prNumber,
              citations: [],
              quality: {
                clarity: 85,
                accuracy: 90,
                completeness: 80,
                relevance: 85,
                overall: 85
              },
              metadata: {
                language: this.captureEngine['getLanguageFromPath'](file.path),
                complexity: analysis.complexity,
                patterns: analysis.patterns,
                prUrl: `https://github.com/${this.getRepositoryName()}/pull/${prNumber}`
              }
            })
          }
        } catch (error) {
          // Skip files that can't be processed
        }
      }

      return captures
    } catch (error) {
      console.error(`Error capturing from PR ${prNumber}:`, error)
      return []
    }
  }

  /**
   * Capture knowledge from issue
   */
  private async captureFromIssue(issueNumber: number): Promise<KnowledgeCapture[]> {
    try {
      const issueInfo = execSync(
        `gh issue view ${issueNumber} --json title,body,author,createdAt,labels`,
        { encoding: 'utf-8' }
      )
      
      const issue = JSON.parse(issueInfo)
      const captures: KnowledgeCapture[] = []

      if (issue.body && issue.body.length > 100) {
        const analysis = await this.captureEngine['analyzeContentForExpertise'](
          `${issue.title}\n\n${issue.body}`
        )
        
        if (analysis.hasValue) {
          captures.push({
            id: `issue-${issueNumber}`,
            title: issue.title,
            content: issue.body,
            summary: analysis.summary,
            source: 'issue',
            category: this.categorizeIssue(issue.labels),
            tags: [...analysis.tags, ...issue.labels.map((l: any) => l.name)],
            expertise: analysis.expertise,
            timestamp: issue.createdAt,
            author: issue.author.name || issue.author.login,
            authorEmail: issue.author.email || `${issue.author.login}@users.noreply.github.com`,
            repository: this.getRepositoryName(),
            issueNumber,
            citations: [],
            quality: {
              clarity: 80,
              accuracy: 85,
              completeness: 75,
              relevance: 80,
              overall: 80
            },
            metadata: {
              issueUrl: `https://github.com/${this.getRepositoryName()}/issues/${issueNumber}`,
              labels: issue.labels
            }
          })
        }
      }

      return captures
    } catch (error) {
      console.error(`Error capturing from issue ${issueNumber}:`, error)
      return []
    }
  }

  /**
   * Helper methods
   */
  private evaluateConditions(conditions: any, eventData: any): boolean {
    // Simple condition evaluation - in a real implementation would be more sophisticated
    for (const [key, value] of Object.entries(conditions)) {
      if (eventData[key] !== value) {
        return false
      }
    }
    return true
  }

  private async storeKnowledgeCaptures(captures: KnowledgeCapture[]): Promise<void> {
    // In a real implementation, would save to database
    console.log(`Storing ${captures.length} knowledge captures`)
  }

  private async storeExpertiseProfiles(profiles: any[]): Promise<void> {
    // In a real implementation, would save to database
    console.log(`Storing expertise profiles for ${profiles.length} contributors`)
  }

  private async loadAllKnowledge(): Promise<KnowledgeCapture[]> {
    // In a real implementation, would load from database
    return []
  }

  private async notifyNewKnowledge(eventData: any, recipients: string[]): Promise<void> {
    const message = `New knowledge captured: ${eventData.title || 'Unknown'}`
    console.log(`Notifying ${recipients.join(', ')}: ${message}`)
  }

  private async notifyExpertiseUpdate(eventData: any, recipients: string[]): Promise<void> {
    const message = `Expertise profile updated for ${eventData.contributor || 'Unknown'}`
    console.log(`Notifying ${recipients.join(', ')}: ${message}`)
  }

  private async notifyQualityAlert(eventData: any, recipients: string[]): Promise<void> {
    const message = `Quality alert: ${eventData.issue || 'Unknown quality issue'}`
    console.log(`Notifying ${recipients.join(', ')}: ${message}`)
  }

  private async auditKnowledgeQuality(scope: any): Promise<void> {
    console.log(`Auditing knowledge quality for scope:`, scope)
  }

  private async auditKnowledgeCompleteness(scope: any): Promise<void> {
    console.log(`Auditing knowledge completeness for scope:`, scope)
  }

  private async auditKnowledgeAccuracy(scope: any): Promise<void> {
    console.log(`Auditing knowledge accuracy for scope:`, scope)
  }

  private async applyIncentiveRules(program: IncentiveProgram, action: string, eventData: any): Promise<void> {
    const applicableRules = program.rules.filter(rule => rule.action === action)
    
    for (const rule of applicableRules) {
      if (this.evaluateRuleCondition(rule.condition, eventData)) {
        await this.awardIncentive(eventData.contributor, rule)
      }
    }
  }

  private evaluateRuleCondition(condition: any, eventData: any): boolean {
    // Simple condition evaluation
    return true
  }

  private async awardIncentive(contributor: string, rule: IncentiveRule): Promise<void> {
    console.log(`Awarding ${rule.points} points to ${contributor} for ${rule.action}`)
    
    if (rule.badges) {
      console.log(`Awarding badges: ${rule.badges.join(', ')} to ${contributor}`)
    }
  }

  private getRepositoryName(): string {
    try {
      const remoteUrl = execSync(
        'git config --get remote.origin.url',
        { encoding: 'utf-8' }
      ).trim()
      
      const match = remoteUrl.match(/github\.com[:\/](.+?)(?:\.git)?$/)
      return match ? match[1] : 'unknown-repo'
    } catch {
      return 'unknown-repo'
    }
  }

  private async getFileContent(filePath: string, ref: string): Promise<string> {
    try {
      return execSync(
        `git show ${ref}:${filePath}`,
        { encoding: 'utf-8' }
      )
    } catch (error) {
      throw new Error(`Failed to get file content for ${filePath} at ${ref}`)
    }
  }

  private categorizeIssue(labels: any[]): KnowledgeCategory {
    const labelNames = labels.map((l: any) => l.name.toLowerCase())
    
    if (labelNames.some(l => l.includes('bug'))) return 'troubleshooting'
    if (labelNames.some(l => l.includes('security'))) return 'security'
    if (labelNames.some(l => l.includes('performance'))) return 'performance'
    if (labelNames.some(l => l.includes('test'))) return 'testing'
    if (labelNames.some(l => l.includes('deploy'))) return 'deployment'
    if (labelNames.some(l => l.includes('monitor'))) return 'monitoring'
    if (labelNames.some(l => l.includes('docs'))) return 'best-practices'
    
    return 'best-practices'
  }

  /**
   * Get default workflow triggers
   */
  private getDefaultTriggers(): WorkflowTrigger[] {
    return [
      {
        type: 'commit',
        conditions: {},
        actions: [
          {
            type: 'capture',
            config: { source: 'commits', limit: 10 }
          },
          {
            type: 'index',
            config: { rebuildExpertise: false }
          }
        ]
      },
      {
        type: 'pr',
        conditions: {},
        actions: [
          {
            type: 'capture',
            config: { source: 'pr' }
          },
          {
            type: 'incentivize',
            config: { programId: 'contribution-program', action: 'contribute' }
          }
        ]
      },
      {
        type: 'issue',
        conditions: {},
        actions: [
          {
            type: 'capture',
            config: { source: 'issue' }
          }
        ]
      },
      {
        type: 'schedule',
        conditions: { frequency: 'daily' },
        actions: [
          {
            type: 'index',
            config: { rebuildExpertise: true }
          },
          {
            type: 'audit',
            config: { type: 'quality', scope: 'recent' }
          }
        ]
      }
    ]
  }

  /**
   * Get default incentive programs
   */
  private getDefaultIncentivePrograms(): IncentiveProgram[] {
    return [
      {
        id: 'contribution-program',
        name: 'Knowledge Contribution Program',
        description: 'Rewards contributors for sharing valuable knowledge',
        type: 'points',
        rules: [
          {
            id: 'contribute',
            action: 'contribute',
            condition: { quality: 'high' },
            points: 10,
            description: 'High-quality knowledge contribution'
          },
          {
            id: 'contribute-expert',
            action: 'contribute',
            condition: { expertise: 'expert' },
            points: 25,
            description: 'Expert-level knowledge contribution'
          },
          {
            id: 'mentor',
            action: 'mentor',
            condition: {},
            points: 15,
            description: 'Mentoring other team members'
          }
        ],
        rewards: [
          {
            id: 'recognition',
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
          }
        ],
        active: true,
        startDate: new Date().toISOString()
      }
    ]
  }
}
