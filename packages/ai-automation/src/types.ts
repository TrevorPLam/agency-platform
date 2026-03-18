import { z } from 'zod'

// ============================================================================
// Core Agent Types
// ============================================================================

export const AgentTypeSchema = z.enum([
  'repository-automation',
  'cicd-healing', 
  'code-review',
  'multimodal-analysis',
  'orchestrator'
])

export const AutonomyLevelSchema = z.enum([
  'low',      // Human-supervised, limited decision making
  'medium',   // Autonomous within defined boundaries
  'high',     // Mostly autonomous with human oversight
  'critical'  // Fully autonomous (production-ready only)
])

export const DecisionScopeSchema = z.enum([
  'internal',     // Repository-internal operations
  'cross-repo',  // Multi-repository operations
  'system-admin', // System-level changes
  'customer-facing' // External-facing operations
])

export const AgentStatusSchema = z.enum([
  'idle',
  'running',
  'completed',
  'failed',
  'paused',
  'terminated'
])

export type AgentType = z.infer<typeof AgentTypeSchema>
export type AutonomyLevel = z.infer<typeof AutonomyLevelSchema>
export type DecisionScope = z.infer<typeof DecisionScopeSchema>
export type AgentStatus = z.infer<typeof AgentStatusSchema>

// ============================================================================
// Workflow and Task Types
// ============================================================================

export const TaskPrioritySchema = z.enum(['low', 'medium', 'high', 'critical'])
export const TaskStatusSchema = z.enum(['pending', 'running', 'completed', 'failed', 'cancelled'])

export interface AgentTask {
  id: string
  type: AgentType
  priority: z.infer<typeof TaskPrioritySchema>
  status: z.infer<typeof TaskStatusSchema>
  input: Record<string, unknown>
  output?: Record<string, unknown>
  error?: string
  createdAt: string
  startedAt?: string
  completedAt?: string
  metadata: {
    tenantId?: string
    userId?: string
    requestId?: string
    traceId: string
  }
}

export interface WorkflowStep {
  id: string
  name: string
  type: 'ai-agent' | 'pure-function' | 'condition' | 'parallel'
  agentType?: AgentType
  functionName?: string
  condition?: string
  inputs: Record<string, unknown>
  outputs?: Record<string, unknown>
  nextSteps: string[]
  errorSteps?: string[]
  timeout?: number
  retries?: number
}

export interface WorkflowDefinition {
  id: string
  name: string
  description: string
  version: string
  steps: WorkflowStep[]
  entryPoint: string
  timeout?: number
  metadata: {
    category: string
    riskLevel: z.infer<typeof TaskPrioritySchema>
    requiredApprovals?: string[]
    complianceFrameworks?: string[]
  }
}

// ============================================================================
// AI Provider Types
// ============================================================================

export const AIProviderSchema = z.enum(['openai', 'anthropic', 'local'])
export type AIProvider = z.infer<typeof AIProviderSchema>

export interface AIProviderConfig {
  provider: AIProvider
  model: string
  apiKey?: string
  endpoint?: string
  maxTokens?: number
  temperature?: number
  timeout?: number
}

export interface StructuredOutputSchema {
  name: string
  schema: z.ZodSchema
  description?: string
}

export interface AIRequest {
  prompt: string
  context?: Record<string, unknown>
  structuredOutput?: StructuredOutputSchema
  tools?: AITool[]
  systemPrompt?: string
}

export interface AITool {
  name: string
  description: string
  parameters: z.ZodSchema
  function: (params: unknown) => Promise<unknown>
}

export interface AIResponse {
  content: string
  structuredData?: Record<string, unknown>
  toolCalls?: Array<{
    tool: string
    parameters: Record<string, unknown>
    result?: unknown
  }>
  metadata: {
    model: string
    tokensUsed: {
      prompt: number
      completion: number
      total: number
    }
    cost: number
    latency: number
  }
}

// ============================================================================
// Repository Automation Types
// ============================================================================

export interface RepositoryOperation {
  type: 'create-pr' | 'merge-pr' | 'update-file' | 'create-branch' | 'add-reviewer'
  parameters: Record<string, unknown>
  validation?: z.ZodSchema
}

export interface RepositoryContext {
  owner: string
  repo: string
  branch: string
  commitSha: string
  prNumber?: number
  files?: string[]
  metadata: {
    language: string
    framework?: string
    dependencies: Record<string, string>
    size: 'small' | 'medium' | 'large'
  }
}

// ============================================================================
// CI/CD Healing Types
// ============================================================================

export interface PipelineFailure {
  id: string
  pipeline: string
  stage: string
  job: string
  error: string
  logs: string[]
  metadata: {
    timestamp: string
    branch: string
    commit: string
    runner: string
    duration: number
  }
}

export interface HealingAction {
  type: 'retry' | 'fix-code' | 'update-config' | 'skip-stage' | 'escalate'
  description: string
  automated: boolean
  requiresApproval: boolean
  implementation?: string
  confidence: number
}

export interface HealingResult {
  failureId: string
  action: HealingAction
  outcome: 'success' | 'failed' | 'partial'
  details: string
  artifacts?: string[]
  metadata: {
    healingTime: number
    cost: number
    humanIntervention: boolean
  }
}

// ============================================================================
// Code Review Types
// ============================================================================

export interface CodeReviewFinding {
  id: string
  type: 'security' | 'performance' | 'maintainability' | 'style' | 'bug' | 'architecture'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  location: {
    file: string
    line?: number
    lines?: [number, number]
  }
  suggestion?: string
  automatedFix?: {
    code: string
    confidence: number
  }
  metadata: {
    ruleId?: string
    category: string
    falsePositiveRisk: number
  }
}

export interface ReviewContext {
  pullRequest: {
    number: number
    title: string
    description: string
    author: string
    baseBranch: string
    headBranch: string
    files: Array<{
      path: string
      additions: number
      deletions: number
      patch: string
    }>
  }
  repository: RepositoryContext
  metadata: {
    languages: string[]
    frameworks: string[]
    complexity: 'low' | 'medium' | 'high'
    riskLevel: 'low' | 'medium' | 'high'
  }
}

// ============================================================================
// Multimodal Analysis Types
// ============================================================================

export interface MultimodalInput {
  type: 'text' | 'image' | 'audio' | 'video'
  content: string | Buffer
  metadata: {
    format: string
    size: number
    duration?: number
    dimensions?: { width: number; height: number }
  }
}

export interface MultimodalAnalysis {
  type: 'ui-screenshot' | 'design-mockup' | 'meeting-recording' | 'user-session'
  findings: Array<{
    category: string
    confidence: number
    description: string
    location?: string
    actionable: boolean
  }>
  metadata: {
    processingTime: number
    model: string
    cost: number
  }
}

// ============================================================================
// Agent Configuration Types
// ============================================================================

export interface AgentConfiguration {
  id: string
  type: AgentType
  name: string
  description: string
  autonomyLevel: AutonomyLevel
  decisionScope: DecisionScope
  aiProvider: AIProviderConfig
  capabilities: string[]
  restrictions: {
    maxTokens?: number
    allowedOperations: string[]
    forbiddenOperations: string[]
    requireApproval: boolean
  }
  governance: {
    auditLevel: 'basic' | 'detailed' | 'comprehensive'
    complianceFrameworks: string[]
    dataRetention: number
    privacyControls: string[]
  }
  monitoring: {
    logLevel: 'error' | 'warn' | 'info' | 'debug'
    metrics: string[]
    alerts: Array<{
      condition: string
      action: string
      threshold: number
    }>
  }
}

// ============================================================================
// Error Types
// ============================================================================

export class AIAutomationError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, unknown>,
    public timestamp: string = new Date().toISOString()
  ) {
    super(message)
    this.name = 'AIAutomationError'
  }
}

export const ErrorCodeSchema = z.enum([
  'AGENT_NOT_FOUND',
  'WORKFLOW_VALIDATION_FAILED',
  'AI_PROVIDER_ERROR',
  'STRUCTURED_OUTPUT_FAILED',
  'TOOL_EXECUTION_FAILED',
  'GOVERNANCE_VIOLATION',
  'TIMEOUT_EXCEEDED',
  'INSUFFICIENT_PERMISSIONS',
  'RATE_LIMIT_EXCEEDED',
  'CONTEXT_TOO_LARGE'
])

export type ErrorCode = z.infer<typeof ErrorCodeSchema>
