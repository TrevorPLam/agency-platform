import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'
import winston from 'winston'
import {
  AgentConfiguration,
  AgentType,
  AutonomyLevel,
  DecisionScope,
  AgentStatus,
  AgentTask,
  TaskPriority,
  TaskStatus,
  AIAutomationError,
  ErrorCodeSchema
} from '../types'

// ============================================================================
// Agent Orchestrator - Multi-Agent Coordination System
// ============================================================================

export interface AgentOrchestratorConfig {
  maxConcurrentAgents: number
  defaultTimeout: number
  governanceEnabled: boolean
  auditLevel: 'basic' | 'detailed' | 'comprehensive'
  complianceFrameworks: string[]
  resourceLimits: {
    maxMemoryPerAgent: number // MB
    maxCpuPerAgent: number // percentage
    maxTokensPerAgent: number
  }
}

export interface AgentInstance {
  id: string
  configuration: AgentConfiguration
  status: AgentStatus
  currentTask?: AgentTask
  metrics: {
    tasksCompleted: number
    tasksFailed: number
    averageExecutionTime: number
    totalTokensUsed: number
    totalCost: number
  }
  resources: {
    memoryUsage: number
    cpuUsage: number
    tokensUsed: number
  }
  lastActivity: string
  createdAt: string
}

export interface OrchestrationPolicy {
  id: string
  name: string
  description: string
  conditions: {
    agentTypes: AgentType[]
    autonomyLevels: AutonomyLevel[]
    decisionScopes: DecisionScope[]
  }
  actions: {
    requireApproval: boolean
    maxConcurrency: number
    timeoutOverride?: number
    resourceLimits?: Partial<AgentOrchestratorConfig['resourceLimits']>
  }
  enabled: boolean
}

export class AgentOrchestrator {
  private config: AgentOrchestratorConfig
  private logger: winston.Logger
  private agents: Map<string, AgentInstance> = new Map()
  private taskQueue: AgentTask[] = []
  private policies: Map<string, OrchestrationPolicy> = new Map()
  private governance: GovernanceManager
  private resourceManager: ResourceManager

  constructor(config: Partial<AgentOrchestratorConfig> = {}) {
    this.config = {
      maxConcurrentAgents: 10,
      defaultTimeout: 300000, // 5 minutes
      governanceEnabled: true,
      auditLevel: 'detailed',
      complianceFrameworks: ['SOC2', 'GDPR'],
      resourceLimits: {
        maxMemoryPerAgent: 512,
        maxCpuPerAgent: 25,
        maxTokensPerAgent: 100000
      },
      ...config
    }

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'agent-orchestrator.log' })
      ]
    })

    this.governance = new GovernanceManager({
      enabled: this.config.governanceEnabled,
      auditLevel: this.config.auditLevel,
      complianceFrameworks: this.config.complianceFrameworks
    })

    this.resourceManager = new ResourceManager(this.config.resourceLimits)
    this.initializeDefaultPolicies()
  }

  // ============================================================================
  // Agent Management
  // ============================================================================

  /**
   * Register an agent with the orchestrator
   */
  registerAgent(configuration: AgentConfiguration): string {
    this.logger.info('Registering agent', { 
      type: configuration.type,
      name: configuration.name 
    })

    const agentId = uuidv4()
    const agent: AgentInstance = {
      id: agentId,
      configuration,
      status: 'idle',
      metrics: {
        tasksCompleted: 0,
        tasksFailed: 0,
        averageExecutionTime: 0,
        totalTokensUsed: 0,
        totalCost: 0
      },
      resources: {
        memoryUsage: 0,
        cpuUsage: 0,
        tokensUsed: 0
      },
      lastActivity: new Date().toISOString(),
      createdAt: new Date().toISOString()
    }

    this.agents.set(agentId, agent)
    
    this.governance.recordAgentRegistration(agentId, configuration)
    
    this.logger.info('Agent registered successfully', { agentId })
    return agentId
  }

  /**
   * Unregister an agent
   */
  unregisterAgent(agentId: string): void {
    const agent = this.agents.get(agentId)
    if (!agent) {
      throw new AIAutomationError(
        'AGENT_NOT_FOUND',
        `Agent not found: ${agentId}`
      )
    }

    if (agent.status === 'running') {
      throw new AIAutomationError(
        'AGENT_ACTIVE',
        'Cannot unregister active agent. Wait for completion or terminate first.'
      )
    }

    this.agents.delete(agentId)
    this.governance.recordAgentUnregistration(agentId)
    
    this.logger.info('Agent unregistered', { agentId })
  }

  /**
   * Get agent information
   */
  getAgent(agentId: string): AgentInstance | undefined {
    return this.agents.get(agentId)
  }

  /**
   * List all agents
   */
  listAgents(): AgentInstance[] {
    return Array.from(this.agents.values())
  }

  /**
   * Get agents by type
   */
  getAgentsByType(type: AgentType): AgentInstance[] {
    return Array.from(this.agents.values()).filter(
      agent => agent.configuration.type === type
    )
  }

  // ============================================================================
  // Task Management
  // ============================================================================

  /**
   * Submit a task for execution
   */
  async submitTask(task: Omit<AgentTask, 'id' | 'createdAt'>): Promise<string> {
    this.logger.info('Submitting task', { 
      type: task.type,
      priority: task.priority 
    })

    const fullTask: AgentTask = {
      ...task,
      id: uuidv4(),
      createdAt: new Date().toISOString()
    }

    // Validate task against policies
    await this.validateTask(fullTask)

    // Add to queue
    this.taskQueue.push(fullTask)
    
    // Process queue
    this.processTaskQueue()

    this.logger.info('Task submitted successfully', { taskId: fullTask.id })
    return fullTask.id
  }

  /**
   * Get task status
   */
  getTask(taskId: string): AgentTask | undefined {
    // Check active agents first
    for (const agent of this.agents.values()) {
      if (agent.currentTask && agent.currentTask.id === taskId) {
        return agent.currentTask
      }
    }

    // Check queue
    return this.taskQueue.find(task => task.id === taskId)
  }

  /**
   * List all tasks
   */
  listTasks(): AgentTask[] {
    const tasks: AgentTask[] = []

    // Add tasks from active agents
    for (const agent of this.agents.values()) {
      if (agent.currentTask) {
        tasks.push(agent.currentTask)
      }
    }

    // Add queued tasks
    tasks.push(...this.taskQueue)

    return tasks
  }

  // ============================================================================
  // Policy Management
  // ============================================================================

  /**
   * Add orchestration policy
   */
  addPolicy(policy: OrchestrationPolicy): void {
    this.policies.set(policy.id, policy)
    this.logger.info('Policy added', { policyId: policy.id })
  }

  /**
   * Remove orchestration policy
   */
  removePolicy(policyId: string): void {
    this.policies.delete(policyId)
    this.logger.info('Policy removed', { policyId })
  }

  /**
   * Get policy
   */
  getPolicy(policyId: string): OrchestrationPolicy | undefined {
    return this.policies.get(policyId)
  }

  /**
   * List all policies
   */
  listPolicies(): OrchestrationPolicy[] {
    return Array.from(this.policies.values())
  }

  // ============================================================================
  // Monitoring and Metrics
  // ============================================================================

  /**
   * Get orchestrator metrics
   */
  getMetrics(): {
    totalAgents: number
    activeAgents: number
    queuedTasks: number
    averageExecutionTime: number
    totalCost: number
    resourceUtilization: {
      memory: number
      cpu: number
      tokens: number
    }
  } {
    const agents = Array.from(this.agents.values())
    const activeAgents = agents.filter(a => a.status === 'running')
    
    const totalMetrics = agents.reduce((acc, agent) => ({
      tasksCompleted: acc.tasksCompleted + agent.metrics.tasksCompleted,
      tasksFailed: acc.tasksFailed + agent.metrics.tasksFailed,
      executionTime: acc.executionTime + agent.metrics.averageExecutionTime * agent.metrics.tasksCompleted,
      cost: acc.cost + agent.metrics.totalCost,
      tokens: acc.tokens + agent.metrics.totalTokensUsed
    }), { tasksCompleted: 0, tasksFailed: 0, executionTime: 0, cost: 0, tokens: 0 })

    const averageExecutionTime = totalMetrics.tasksCompleted > 0 ? 
      totalMetrics.executionTime / totalMetrics.tasksCompleted : 0

    const resourceUtilization = this.resourceManager.getCurrentUtilization()

    return {
      totalAgents: agents.length,
      activeAgents: activeAgents.length,
      queuedTasks: this.taskQueue.length,
      averageExecutionTime,
      totalCost: totalMetrics.cost,
      resourceUtilization
    }
  }

  /**
   * Get agent metrics
   */
  getAgentMetrics(agentId: string): AgentInstance['metrics'] | undefined {
    const agent = this.agents.get(agentId)
    return agent?.metrics
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private async processTaskQueue(): Promise<void> {
    while (this.taskQueue.length > 0 && this.hasAvailableCapacity()) {
      const task = this.taskQueue.shift()!
      await this.assignTask(task)
    }
  }

  private async assignTask(task: AgentTask): Promise<void> {
    // Find suitable agent
    const agent = this.findSuitableAgent(task)
    if (!agent) {
      // No suitable agent available, put task back in queue
      this.taskQueue.unshift(task)
      return
    }

    // Check resource availability
    if (!this.resourceManager.hasResources(agent.configuration)) {
      this.taskQueue.unshift(task)
      return
    }

    // Assign task to agent
    await this.executeTask(agent, task)
  }

  private findSuitableAgent(task: AgentTask): AgentInstance | undefined {
    const availableAgents = Array.from(this.agents.values()).filter(
      agent => agent.status === 'idle' && agent.configuration.type === task.type
    )

    if (availableAgents.length === 0) {
      return undefined
    }

    // Select agent with best performance metrics
    return availableAgents.reduce((best, current) => {
      const bestScore = this.calculateAgentScore(best)
      const currentScore = this.calculateAgentScore(current)
      return currentScore > bestScore ? current : best
    })
  }

  private calculateAgentScore(agent: AgentInstance): number {
    // Score based on success rate and efficiency
    const totalTasks = agent.metrics.tasksCompleted + agent.metrics.tasksFailed
    const successRate = totalTasks > 0 ? agent.metrics.tasksCompleted / totalTasks : 1
    const efficiency = agent.metrics.averageExecutionTime > 0 ? 
      1000 / agent.metrics.averageExecutionTime : 1 // Inverse of execution time

    return successRate * efficiency * 0.5 + 0.5 // Weighted score
  }

  private async executeTask(agent: AgentInstance, task: AgentTask): Promise<void> {
    agent.status = 'running'
    agent.currentTask = task
    agent.lastActivity = new Date().toISOString()

    this.logger.info('Executing task', { 
      agentId: agent.id,
      taskId: task.id 
    })

    const startTime = Date.now()

    try {
      // Record task start
      this.governance.recordTaskStart(agent.id, task)

      // Execute task (mock implementation)
      const result = await this.mockTaskExecution(agent, task)

      // Update agent metrics
      agent.metrics.tasksCompleted++
      agent.metrics.averageExecutionTime = 
        (agent.metrics.averageExecutionTime * (agent.metrics.tasksCompleted - 1) + 
         (Date.now() - startTime)) / agent.metrics.tasksCompleted

      task.status = 'completed'
      task.output = result
      task.completedAt = new Date().toISOString()

      this.logger.info('Task completed successfully', {
        agentId: agent.id,
        taskId: task.id,
        executionTime: Date.now() - startTime
      })

    } catch (error) {
      agent.metrics.tasksFailed++
      
      task.status = 'failed'
      task.error = error instanceof Error ? error.message : 'Unknown error'
      task.completedAt = new Date().toISOString()

      this.logger.error('Task failed', {
        agentId: agent.id,
        taskId: task.id,
        error
      })

    } finally {
      agent.status = 'idle'
      agent.currentTask = undefined
      agent.lastActivity = new Date().toISOString()

      // Record task completion
      this.governance.recordTaskCompletion(agent.id, task)

      // Process next task in queue
      this.processTaskQueue()
    }
  }

  private async mockTaskExecution(agent: AgentInstance, task: AgentTask): Promise<Record<string, unknown>> {
    // Mock task execution based on agent type
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))

    const result = {
      agentId: agent.id,
      agentType: agent.configuration.type,
      taskId: task.id,
      executionTime: Date.now(),
      output: `Task ${task.id} completed by ${agent.configuration.name}`
    }

    return result
  }

  private hasAvailableCapacity(): boolean {
    const activeAgents = Array.from(this.agents.values()).filter(
      agent => agent.status === 'running'
    )

    return activeAgents.length < this.config.maxConcurrentAgents
  }

  private async validateTask(task: AgentTask): Promise<void> {
    // Find applicable policies
    const applicablePolicies = Array.from(this.policies.values()).filter(policy =>
      policy.enabled &&
      policy.conditions.agentTypes.includes(task.type) &&
      policy.conditions.autonomyLevels.includes(task.priority as any) &&
      policy.conditions.decisionScopes.length === 0 // Decision scope not applicable to tasks
    )

    // Apply policies
    for (const policy of applicablePolicies) {
      if (policy.actions.requireApproval) {
        // In production, this would trigger approval workflow
        this.logger.info('Task requires approval', { 
          taskId: task.id,
          policy: policy.name 
        })
      }

      if (policy.actions.timeoutOverride) {
        // Apply timeout override
        this.logger.debug('Applying timeout override', {
          taskId: task.id,
          timeout: policy.actions.timeoutOverride
        })
      }
    }

    // Governance validation
    await this.governance.validateTask(task)
  }

  private initializeDefaultPolicies(): void {
    const defaultPolicies: OrchestrationPolicy[] = [
      {
        id: 'high-autonomy-restrictions',
        name: 'High Autonomy Restrictions',
        description: 'Restrict high autonomy agents',
        conditions: {
          agentTypes: ['repository-automation', 'cicd-healing'],
          autonomyLevels: ['high', 'critical'],
          decisionScopes: ['system-admin', 'customer-facing']
        },
        actions: {
          requireApproval: true,
          maxConcurrency: 1,
          timeoutOverride: 600000 // 10 minutes
        },
        enabled: true
      },
      {
        id: 'resource-intensive-tasks',
        name: 'Resource Intensive Task Management',
        description: 'Manage resource-intensive tasks',
        conditions: {
          agentTypes: ['multimodal-analysis'],
          autonomyLevels: ['medium', 'high', 'critical'],
          decisionScopes: ['internal', 'cross-repo']
        },
        actions: {
          requireApproval: false,
          maxConcurrency: 2,
          resourceLimits: {
            maxMemoryPerAgent: 1024,
            maxCpuPerAgent: 50,
            maxTokensPerAgent: 200000
          }
        },
        enabled: true
      }
    ]

    defaultPolicies.forEach(policy => {
      this.policies.set(policy.id, policy)
    })
  }
}

// ============================================================================
// Supporting Classes
// ============================================================================

export class GovernanceManager {
  private config: {
    enabled: boolean
    auditLevel: 'basic' | 'detailed' | 'comprehensive'
    complianceFrameworks: string[]
  }

  constructor(config: GovernanceManager['config']) {
    this.config = config
  }

  recordAgentRegistration(agentId: string, configuration: AgentConfiguration): void {
    if (!this.config.enabled) return
    
    // In production, this would record to audit log
    console.log(`Agent registered: ${agentId}`, {
      type: configuration.type,
      autonomyLevel: configuration.autonomyLevel,
      decisionScope: configuration.decisionScope
    })
  }

  recordAgentUnregistration(agentId: string): void {
    if (!this.config.enabled) return
    
    console.log(`Agent unregistered: ${agentId}`)
  }

  recordTaskStart(agentId: string, task: AgentTask): void {
    if (!this.config.enabled) return
    
    console.log(`Task started: ${task.id} by ${agentId}`)
  }

  recordTaskCompletion(agentId: string, task: AgentTask): void {
    if (!this.config.enabled) return
    
    console.log(`Task completed: ${task.id} by ${agentId}`, {
      status: task.status,
      executionTime: task.completedAt && task.startedAt ? 
        new Date(task.completedAt).getTime() - new Date(task.startedAt).getTime() : 
        undefined
    })
  }

  async validateTask(task: AgentTask): Promise<void> {
    if (!this.config.enabled) return

    // Validate against compliance frameworks
    for (const framework of this.config.complianceFrameworks) {
      await this.validateCompliance(task, framework)
    }
  }

  private async validateCompliance(task: AgentTask, framework: string): Promise<void> {
    // Mock compliance validation
    // In production, this would check against specific framework requirements
    if (framework === 'GDPR' && task.metadata.tenantId) {
      // Validate GDPR compliance for tenant-specific tasks
      console.log(`GDPR validation for task: ${task.id}`)
    }
  }
}

export class ResourceManager {
  private limits: AgentOrchestratorConfig['resourceLimits']
  private currentUsage = {
    memory: 0,
    cpu: 0,
    tokens: 0
  }

  constructor(limits: AgentOrchestratorConfig['resourceLimits']) {
    this.limits = limits
  }

  hasResources(configuration: AgentConfiguration): boolean {
    return (
      this.currentUsage.memory < this.limits.maxMemoryPerAgent &&
      this.currentUsage.cpu < this.limits.maxCpuPerAgent &&
      this.currentUsage.tokens < this.limits.maxTokensPerAgent
    )
  }

  getCurrentUtilization(): { memory: number; cpu: number; tokens: number } {
    return { ...this.currentUsage }
  }

  allocateResources(amount: { memory: number; cpu: number; tokens: number }): void {
    this.currentUsage.memory += amount.memory
    this.currentUsage.cpu += amount.cpu
    this.currentUsage.tokens += amount.tokens
  }

  releaseResources(amount: { memory: number; cpu: number; tokens: number }): void {
    this.currentUsage.memory = Math.max(0, this.currentUsage.memory - amount.memory)
    this.currentUsage.cpu = Math.max(0, this.currentUsage.cpu - amount.cpu)
    this.currentUsage.tokens = Math.max(0, this.currentUsage.tokens - amount.tokens)
  }
}
