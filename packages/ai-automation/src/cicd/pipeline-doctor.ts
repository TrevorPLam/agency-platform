import { z } from 'zod'
import winston from 'winston'
import { AIAutomationError, ErrorCodeSchema, PipelineFailure, HealingAction, HealingResult } from '../types'

// ============================================================================
// Pipeline Doctor - Self-Healing CI/CD System
// ============================================================================

export interface PipelineDoctorConfig {
  logAnalysisProvider: 'openai' | 'anthropic' | 'local'
  healingStrategies: HealingStrategy[]
  approvalRequired: string[]
  maxHealingAttempts: number
  confidenceThreshold: number
}

export interface HealingStrategy {
  id: string
  name: string
  patterns: string[]
  action: HealingAction
  confidence: number
  automated: boolean
}

export interface LogAnalysisResult {
  failureType: string
  rootCause: string
  suggestedFixes: HealingAction[]
  confidence: number
  metadata: {
    errorPatterns: string[]
    context: Record<string, unknown>
  }
}

export class PipelineDoctor {
  private config: PipelineDoctorConfig
  private logger: winston.Logger
  private healingStrategies: Map<string, HealingStrategy> = new Map()
  private activeHealings: Map<string, HealingResult> = new Map()

  constructor(config: PipelineDoctorConfig) {
    this.config = config
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'pipeline-doctor.log' })
      ]
    })

    this.initializeHealingStrategies()
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Analyze a pipeline failure and suggest healing actions
   */
  async analyzeFailure(failure: PipelineFailure): Promise<LogAnalysisResult> {
    this.logger.info('Analyzing pipeline failure', { failureId: failure.id })

    try {
      const analysis = await this.analyzeLogs(failure)
      this.logger.info('Failure analysis completed', { 
        failureId: failure.id,
        failureType: analysis.failureType,
        confidence: analysis.confidence
      })
      return analysis
    } catch (error) {
      this.logger.error('Failed to analyze failure', { 
        failureId: failure.id,
        error 
      })
      throw new AIAutomationError(
        'ANALYSIS_FAILED',
        'Failed to analyze pipeline failure',
        { error, failureId: failure.id }
      )
    }
  }

  /**
   * Attempt to heal a pipeline failure
   */
  async healFailure(
    failure: PipelineFailure,
    analysis: LogAnalysisResult
  ): Promise<HealingResult> {
    this.logger.info('Attempting to heal failure', { 
      failureId: failure.id,
      suggestedFixes: analysis.suggestedFixes.length
    })

    // Check if healing is already in progress
    if (this.activeHealings.has(failure.id)) {
      throw new AIAutomationError(
        'HEALING_IN_PROGRESS',
        `Healing already in progress for failure: ${failure.id}`
      )
    }

    // Select best healing action
    const action = this.selectHealingAction(analysis.suggestedFixes)
    if (!action) {
      throw new AIAutomationError(
        'NO_HEALING_ACTION',
        'No suitable healing action found'
      )
    }

    // Check if approval is required
    if (this.config.approvalRequired.includes(action.type)) {
      return this.createHealingResult(failure.id, action, 'failed', 
        'Healing action requires manual approval', false)
    }

    // Execute healing action
    const startTime = Date.now()
    try {
      const result = await this.executeHealingAction(failure, action)
      const healingTime = Date.now() - startTime

      this.logger.info('Healing completed', { 
        failureId: failure.id,
        action: action.type,
        outcome: result.outcome
      })

      const healingResult: HealingResult = {
        failureId: failure.id,
        action,
        outcome: result.success ? 'success' : 'failed',
        details: result.details,
        artifacts: result.artifacts,
        metadata: {
          healingTime,
          cost: this.calculateHealingCost(action),
          humanIntervention: false
        }
      }

      this.activeHealings.set(failure.id, healingResult)
      return healingResult

    } catch (error) {
      const healingTime = Date.now() - startTime
      this.logger.error('Healing failed', { 
        failureId: failure.id,
        action: action.type,
        error 
      })

      const healingResult: HealingResult = {
        failureId: failure.id,
        action,
        outcome: 'failed',
        details: error instanceof Error ? error.message : 'Unknown healing error',
        metadata: {
          healingTime,
          cost: this.calculateHealingCost(action),
          humanIntervention: true
        }
      }

      this.activeHealings.set(failure.id, healingResult)
      return healingResult
    }
  }

  /**
   * Get healing result for a failure
   */
  getHealingResult(failureId: string): HealingResult | undefined {
    return this.activeHealings.get(failureId)
  }

  /**
   * List all active healings
   */
  listActiveHealings(): HealingResult[] {
    return Array.from(this.activeHealings.values())
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private async analyzeLogs(failure: PipelineFailure): Promise<LogAnalysisResult> {
    // Combine all logs into a single context
    const logContent = failure.logs.join('\n')
    const context = {
      pipeline: failure.pipeline,
      stage: failure.stage,
      job: failure.job,
      error: failure.error,
      branch: failure.metadata.branch,
      commit: failure.metadata.commit
    }

    // Use AI to analyze the logs
    const analysisPrompt = this.buildAnalysisPrompt(logContent, context)
    
    const schema = {
      name: 'failure_analysis',
      schema: z.object({
        failureType: z.string().describe('Type of failure (e.g., dependency, syntax, test, timeout)'),
        rootCause: z.string().describe('Root cause of the failure'),
        suggestedFixes: z.array(z.object({
          type: z.enum(['retry', 'fix-code', 'update-config', 'skip-stage', 'escalate']),
          description: z.string(),
          automated: z.boolean(),
          requiresApproval: z.boolean(),
          implementation: z.string().optional(),
          confidence: z.number().min(0).max(1)
        })).describe('Suggested healing actions'),
        confidence: z.number().min(0).max(1).describe('Confidence in analysis'),
        errorPatterns: z.array(z.string()).describe('Error patterns identified'),
        context: z.record(z.unknown()).describe('Additional context')
      }),
      description: 'Pipeline failure analysis structure'
    }

    // Mock AI response - in production, use actual AI provider
    const mockResponse = this.generateMockAnalysis(failure)
    
    return {
      failureType: mockResponse.failureType,
      rootCause: mockResponse.rootCause,
      suggestedFixes: mockResponse.suggestedFixes,
      confidence: mockResponse.confidence,
      metadata: {
        errorPatterns: mockResponse.errorPatterns,
        context: mockResponse.context
      }
    }
  }

  private buildAnalysisPrompt(logs: string, context: Record<string, unknown>): string {
    return `
Analyze this CI/CD pipeline failure and provide healing recommendations:

Pipeline Context:
${JSON.stringify(context, null, 2)}

Error Message:
${context.error}

Log Output:
${logs.substring(0, 10000)} // Limit to prevent context overflow

Please analyze the failure and provide:
1. Failure type classification
2. Root cause analysis
3. Suggested healing actions with confidence scores
4. Error patterns identified
5. Additional context

Focus on actionable fixes that can be automated. For each suggested fix, indicate:
- Type (retry, fix-code, update-config, skip-stage, escalate)
- Whether it can be automated
- Whether it requires approval
- Implementation details if applicable
- Confidence score (0-1)
`
  }

  private generateMockAnalysis(failure: PipelineFailure): any {
    // Mock analysis based on common failure patterns
    const error = failure.error.toLowerCase()
    const logs = failure.logs.join(' ').toLowerCase()

    if (error.includes('dependency') || logs.includes('module not found')) {
      return {
        failureType: 'dependency',
        rootCause: 'Missing or incompatible dependency',
        suggestedFixes: [{
          type: 'fix-code',
          description: 'Add missing dependency to package.json',
          automated: true,
          requiresApproval: false,
          implementation: 'Add missing package and run npm install',
          confidence: 0.8
        }],
        confidence: 0.85,
        errorPatterns: ['module not found', 'cannot resolve module'],
        context: { dependencyIssue: true }
      }
    }

    if (error.includes('timeout') || logs.includes('timeout')) {
      return {
        failureType: 'timeout',
        rootCause: 'Operation exceeded time limit',
        suggestedFixes: [{
          type: 'retry',
          description: 'Retry the failed step with increased timeout',
          automated: true,
          requiresApproval: false,
          confidence: 0.7
        }],
        confidence: 0.8,
        errorPatterns: ['timeout', 'time limit exceeded'],
        context: { timeoutIssue: true }
      }
    }

    if (error.includes('test') || logs.includes('test failed')) {
      return {
        failureType: 'test',
        rootCause: 'Unit or integration test failure',
        suggestedFixes: [{
          type: 'fix-code',
          description: 'Update failing test implementation',
          automated: false,
          requiresApproval: true,
          confidence: 0.6
        }],
        confidence: 0.7,
        errorPatterns: ['test failed', 'assertion error'],
        context: { testFailure: true }
      }
    }

    // Default fallback
    return {
      failureType: 'unknown',
      rootCause: 'Unable to determine root cause',
      suggestedFixes: [{
        type: 'escalate',
        description: 'Escalate to human developer for manual investigation',
        automated: false,
        requiresApproval: true,
        confidence: 0.3
      }],
      confidence: 0.4,
      errorPatterns: [],
      context: { unknownIssue: true }
    }
  }

  private selectHealingAction(suggestions: HealingAction[]): HealingAction | undefined {
    // Filter by confidence threshold
    const confidentSuggestions = suggestions.filter(
      s => s.confidence >= this.config.confidenceThreshold
    )

    if (confidentSuggestions.length === 0) {
      return undefined
    }

    // Prefer automated actions
    const automatedSuggestions = confidentSuggestions.filter(s => s.automated)
    if (automatedSuggestions.length > 0) {
      // Return highest confidence automated action
      return automatedSuggestions.reduce((prev, curr) => 
        curr.confidence > prev.confidence ? curr : prev
      )
    }

    // Return highest confidence action overall
    return confidentSuggestions.reduce((prev, curr) => 
      curr.confidence > prev.confidence ? curr : prev
    )
  }

  private async executeHealingAction(
    failure: PipelineFailure,
    action: HealingAction
  ): Promise<{ success: boolean; details: string; artifacts?: string[] }> {
    switch (action.type) {
      case 'retry':
        return this.executeRetry(failure)
      case 'fix-code':
        return this.executeCodeFix(failure, action)
      case 'update-config':
        return this.executeConfigUpdate(failure, action)
      case 'skip-stage':
        return this.executeStageSkip(failure, action)
      case 'escalate':
        return this.executeEscalation(failure, action)
      default:
        throw new AIAutomationError(
          'UNSUPPORTED_ACTION',
          `Unsupported healing action: ${action.type}`
        )
    }
  }

  private async executeRetry(failure: PipelineFailure): Promise<{ success: boolean; details: string }> {
    // Mock retry implementation
    // In production, this would trigger the actual CI/CD retry
    return {
      success: true,
      details: `Retried ${failure.pipeline}/${failure.stage}/${failure.job}`
    }
  }

  private async executeCodeFix(
    failure: PipelineFailure,
    action: HealingAction
  ): Promise<{ success: boolean; details: string; artifacts?: string[] }> {
    // Mock code fix implementation
    // In production, this would:
    // 1. Analyze the failing code
    // 2. Generate a fix
    // 3. Create a PR with the fix
    return {
      success: true,
      details: `Applied code fix: ${action.description}`,
      artifacts: ['fix-pr-123']
    }
  }

  private async executeConfigUpdate(
    failure: PipelineFailure,
    action: HealingAction
  ): Promise<{ success: boolean; details: string }> {
    // Mock config update implementation
    return {
      success: true,
      details: `Updated configuration: ${action.description}`
    }
  }

  private async executeStageSkip(
    failure: PipelineFailure,
    action: HealingAction
  ): Promise<{ success: boolean; details: string }> {
    // Mock stage skip implementation
    return {
      success: true,
      details: `Skipped stage: ${failure.stage}`
    }
  }

  private async executeEscalation(
    failure: PipelineFailure,
    action: HealingAction
  ): Promise<{ success: boolean; details: string }> {
    // Mock escalation implementation
    return {
      success: false,
      details: `Escalated to human: ${action.description}`
    }
  }

  private calculateHealingCost(action: HealingAction): number {
    // Simple cost calculation based on action type
    const costs = {
      retry: 0.01,
      'fix-code': 0.05,
      'update-config': 0.02,
      'skip-stage': 0.01,
      escalate: 0.001
    }
    return costs[action.type as keyof typeof costs] || 0.01
  }

  private createHealingResult(
    failureId: string,
    action: HealingAction,
    outcome: 'success' | 'failed' | 'partial',
    details: string,
    humanIntervention: boolean
  ): HealingResult {
    return {
      failureId,
      action,
      outcome,
      details,
      metadata: {
        healingTime: 0,
        cost: this.calculateHealingCost(action),
        humanIntervention
      }
    }
  }

  private initializeHealingStrategies(): void {
    // Initialize built-in healing strategies
    const builtInStrategies: HealingStrategy[] = [
      {
        id: 'dependency-fix',
        name: 'Fix Missing Dependencies',
        patterns: ['module not found', 'cannot resolve', 'dependency not found'],
        action: {
          type: 'fix-code',
          description: 'Add missing dependency to package.json',
          automated: true,
          requiresApproval: false,
          confidence: 0.8
        },
        confidence: 0.8,
        automated: true
      },
      {
        id: 'timeout-retry',
        name: 'Retry Timeout Failures',
        patterns: ['timeout', 'time limit exceeded', 'operation timed out'],
        action: {
          type: 'retry',
          description: 'Retry with increased timeout',
          automated: true,
          requiresApproval: false,
          confidence: 0.7
        },
        confidence: 0.7,
        automated: true
      },
      {
        id: 'test-failure-escalate',
        name: 'Escalate Test Failures',
        patterns: ['test failed', 'assertion error', 'spec failed'],
        action: {
          type: 'escalate',
          description: 'Escalate test failures to developer',
          automated: false,
          requiresApproval: true,
          confidence: 0.6
        },
        confidence: 0.6,
        automated: false
      }
    ]

    builtInStrategies.forEach(strategy => {
      this.healingStrategies.set(strategy.id, strategy)
    })

    // Add custom strategies from config
    this.config.healingStrategies.forEach(strategy => {
      this.healingStrategies.set(strategy.id, strategy)
    })
  }
}
