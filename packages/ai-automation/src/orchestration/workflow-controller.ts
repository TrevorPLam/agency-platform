import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'
import winston from 'winston'
import {
  WorkflowDefinition,
  WorkflowStep,
  AgentTask,
  AgentStatus,
  TaskStatus,
  AIAutomationError,
  ErrorCodeSchema
} from '../types'

// ============================================================================
// Deterministic Workflow Controller
// ============================================================================

export interface WorkflowControllerConfig {
  maxConcurrentTasks: number
  defaultTimeout: number
  retryAttempts: number
  logLevel: 'error' | 'warn' | 'info' | 'debug'
}

export class WorkflowController {
  private workflows: Map<string, WorkflowDefinition> = new Map()
  private activeTasks: Map<string, AgentTask> = new Map()
  private taskQueue: AgentTask[] = []
  private executingSteps: Map<string, WorkflowStep> = new Map()
  private config: WorkflowControllerConfig
  private logger: winston.Logger
  private stepExecutors: Map<string, StepExecutor> = new Map()

  constructor(config: Partial<WorkflowControllerConfig> = {}) {
    this.config = {
      maxConcurrentTasks: 5,
      defaultTimeout: 300000, // 5 minutes
      retryAttempts: 3,
      logLevel: 'info',
      ...config
    }

    this.logger = winston.createLogger({
      level: this.config.logLevel,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'workflow-controller.log' })
      ]
    })

    this.initializeStepExecutors()
  }

  // ============================================================================
  // Workflow Registration
  // ============================================================================

  /**
   * Register a workflow definition
   */
  registerWorkflow(workflow: WorkflowDefinition): void {
    this.validateWorkflow(workflow)
    this.workflows.set(workflow.id, workflow)
    this.logger.info(`Workflow registered: ${workflow.id}`)
  }

  /**
   * Get a workflow definition
   */
  getWorkflow(id: string): WorkflowDefinition | undefined {
    return this.workflows.get(id)
  }

  /**
   * List all registered workflows
   */
  listWorkflows(): WorkflowDefinition[] {
    return Array.from(this.workflows.values())
  }

  // ============================================================================
  // Task Execution
  // ============================================================================

  /**
   * Execute a workflow with given input
   */
  async executeWorkflow(
    workflowId: string,
    input: Record<string, unknown>,
    metadata: AgentTask['metadata']
  ): Promise<AgentTask> {
    const workflow = this.workflows.get(workflowId)
    if (!workflow) {
      throw new AIAutomationError(
        'WORKFLOW_NOT_FOUND',
        `Workflow not found: ${workflowId}`
      )
    }

    const task: AgentTask = {
      id: uuidv4(),
      type: 'orchestrator' as any,
      priority: 'medium',
      status: 'pending',
      input,
      metadata: {
        ...metadata,
        traceId: uuidv4()
      },
      createdAt: new Date().toISOString()
    }

    this.activeTasks.set(task.id, task)
    this.taskQueue.push(task)

    // Start processing if we have capacity
    this.processQueue()

    return task
  }

  /**
   * Get task status
   */
  getTask(taskId: string): AgentTask | undefined {
    return this.activeTasks.get(taskId)
  }

  /**
   * List all active tasks
   */
  listTasks(): AgentTask[] {
    return Array.from(this.activeTasks.values())
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private async processQueue(): Promise<void> {
    while (
      this.taskQueue.length > 0 &&
      this.executingSteps.size < this.config.maxConcurrentTasks
    ) {
      const task = this.taskQueue.shift()!
      this.executeTask(task)
    }
  }

  private async executeTask(task: AgentTask): Promise<void> {
    const workflowId = task.input.workflowId as string
    const workflow = this.workflows.get(workflowId)
    
    if (!workflow) {
      task.status = 'failed'
      task.error = `Workflow not found: ${workflowId}`
      return
    }

    try {
      task.status = 'running'
      task.startedAt = new Date().toISOString()

      const result = await this.executeWorkflowSteps(workflow, task)
      
      task.status = 'completed'
      task.completedAt = new Date().toISOString()
      task.output = result

      this.logger.info(`Task completed: ${task.id}`)
    } catch (error) {
      task.status = 'failed'
      task.error = error instanceof Error ? error.message : 'Unknown error'
      task.completedAt = new Date().toISOString()

      this.logger.error(`Task failed: ${task.id}`, { error, task })
    } finally {
      this.activeTasks.delete(task.id)
      this.processQueue() // Process next task in queue
    }
  }

  private async executeWorkflowSteps(
    workflow: WorkflowDefinition,
    task: AgentTask
  ): Promise<Record<string, unknown>> {
    const context: Record<string, unknown> = { ...task.input }
    const visitedSteps = new Set<string>()
    let currentStepId = workflow.entryPoint

    while (currentStepId && !visitedSteps.has(currentStepId)) {
      visitedSteps.add(currentStepId)

      const step = workflow.steps.find(s => s.id === currentStepId)
      if (!step) {
        throw new AIAutomationError(
          'STEP_NOT_FOUND',
          `Step not found: ${currentStepId}`
        )
      }

      this.logger.debug(`Executing step: ${step.id}`, { step, context })

      const executor = this.stepExecutors.get(step.type)
      if (!executor) {
        throw new AIAutomationError(
          'EXECUTOR_NOT_FOUND',
          `Executor not found for step type: ${step.type}`
        )
      }

      // Execute step with timeout
      const stepResult = await this.executeStepWithTimeout(
        executor,
        step,
        context,
        task
      )

      // Merge step outputs into context
      Object.assign(context, stepResult)

      // Determine next step
      currentStepId = this.determineNextStep(step, stepResult, context)
    }

    return context
  }

  private async executeStepWithTimeout(
    executor: StepExecutor,
    step: WorkflowStep,
    context: Record<string, unknown>,
    task: AgentTask
  ): Promise<Record<string, unknown>> {
    const timeout = step.timeout || this.config.defaultTimeout
    
    return Promise.race([
      executor.execute(step, context, task),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Step timeout')), timeout)
      )
    ])
  }

  private determineNextStep(
    step: WorkflowStep,
    result: Record<string, unknown>,
    context: Record<string, unknown>
  ): string | undefined {
    // Handle conditional steps
    if (step.type === 'condition' && step.condition) {
      try {
        const conditionResult = this.evaluateCondition(step.condition, context)
        return conditionResult ? step.nextSteps[0] : step.nextSteps[1]
      } catch (error) {
        this.logger.error('Condition evaluation failed', { step, error })
        return step.errorSteps?.[0] // Fall back to error path
      }
    }

    // Handle parallel steps (execute all, then move to next)
    if (step.type === 'parallel') {
      return step.nextSteps[0]
    }

    // Default: first next step
    return step.nextSteps[0]
  }

  private evaluateCondition(
    condition: string,
    context: Record<string, unknown>
  ): boolean {
    // Simple condition evaluation (in production, use a proper expression parser)
    try {
      // Replace placeholders with actual values
      let evalCondition = condition
      Object.entries(context).forEach(([key, value]) => {
        evalCondition = evalCondition.replace(
          new RegExp(`\\$\\{${key}\\}`, 'g'),
          JSON.stringify(value)
        )
      })

      // Safe evaluation (in production, use a proper sandbox)
      return Function(`"use strict"; return (${evalCondition})`)()
    } catch (error) {
      throw new AIAutomationError(
        'CONDITION_EVALUATION_FAILED',
        `Failed to evaluate condition: ${condition}`,
        { error, context }
      )
    }
  }

  private validateWorkflow(workflow: WorkflowDefinition): void {
    if (!workflow.id || !workflow.name || !workflow.entryPoint) {
      throw new AIAutomationError(
        'WORKFLOW_VALIDATION_FAILED',
        'Workflow must have id, name, and entryPoint'
      )
    }

    const stepIds = new Set(workflow.steps.map(s => s.id))
    if (!stepIds.has(workflow.entryPoint)) {
      throw new AIAutomationError(
        'WORKFLOW_VALIDATION_FAILED',
        'EntryPoint must reference an existing step'
      )
    }

    // Validate step references
    workflow.steps.forEach(step => {
      step.nextSteps.forEach(nextId => {
        if (!stepIds.has(nextId)) {
          throw new AIAutomationError(
            'WORKFLOW_VALIDATION_FAILED',
            `Step ${step.id} references non-existent next step: ${nextId}`
          )
        }
      })
    })
  }

  private initializeStepExecutors(): void {
    this.stepExecutors.set('ai-agent', new AIAgentStepExecutor())
    this.stepExecutors.set('pure-function', new PureFunctionStepExecutor())
    this.stepExecutors.set('condition', new ConditionStepExecutor())
    this.stepExecutors.set('parallel', new ParallelStepExecutor())
  }
}

// ============================================================================
// Step Executors
// ============================================================================

export interface StepExecutor {
  execute(
    step: WorkflowStep,
    context: Record<string, unknown>,
    task: AgentTask
  ): Promise<Record<string, unknown>>
}

export class AIAgentStepExecutor implements StepExecutor {
  async execute(
    step: WorkflowStep,
    context: Record<string, unknown>,
    task: AgentTask
  ): Promise<Record<string, unknown>> {
    // This will be implemented when we create the AI agent system
    throw new Error('AI Agent executor not yet implemented')
  }
}

export class PureFunctionStepExecutor implements StepExecutor {
  async execute(
    step: WorkflowStep,
    context: Record<string, unknown>,
    task: AgentTask
  ): Promise<Record<string, unknown>> {
    if (!step.functionName) {
      throw new Error('Pure function step must specify functionName')
    }

    // Get function from registry (to be implemented)
    const func = this.getFunction(step.functionName)
    if (!func) {
      throw new Error(`Function not found: ${step.functionName}`)
    }

    const inputs = this.resolveInputs(step.inputs, context)
    const result = await func(inputs)

    return {
      [`${step.id}_result`]: result,
      ...result
    }
  }

  private getFunction(name: string): Function | undefined {
    // This would be a registry of pure functions
    // For now, return undefined to indicate not implemented
    return undefined
  }

  private resolveInputs(
    inputs: Record<string, unknown>,
    context: Record<string, unknown>
  ): Record<string, unknown> {
    const resolved: Record<string, unknown> = {}
    
    Object.entries(inputs).forEach(([key, value]) => {
      if (typeof value === 'string' && value.startsWith('${') && value.endsWith('}')) {
        const contextKey = value.slice(2, -1)
        resolved[key] = context[contextKey]
      } else {
        resolved[key] = value
      }
    })

    return resolved
  }
}

export class ConditionStepExecutor implements StepExecutor {
  async execute(
    step: WorkflowStep,
    context: Record<string, unknown>,
    task: AgentTask
  ): Promise<Record<string, unknown>> {
    // Condition evaluation is handled in the workflow controller
    // This executor is a no-op
    return { conditionEvaluated: true }
  }
}

export class ParallelStepExecutor implements StepExecutor {
  async execute(
    step: WorkflowStep,
    context: Record<string, unknown>,
    task: AgentTask
  ): Promise<Record<string, unknown>> {
    // Execute all parallel steps concurrently
    const controller = new WorkflowController()
    
    const promises = step.nextSteps.map(async (stepId) => {
      // This would need access to the workflow definition
      // For now, return a placeholder
      return { [`${stepId}_result`]: 'parallel_result' }
    })

    const results = await Promise.all(promises)
    
    return {
      [`${step.id}_results`]: results.reduce((acc, result) => ({ ...acc, ...result }), {})
    }
  }
}
