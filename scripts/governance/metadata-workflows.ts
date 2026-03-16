#!/usr/bin/env node

/**
 * Metadata-driven workflow automation for repository governance
 */

import { PropertyManager } from '@agency/governance'
import { 
  RepositoryProperties, 
  GovernancePolicy,
  ComplianceFramework 
} from '@agency/governance/types'
import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

interface Config {
  token: string
  organization: string
}

interface WorkflowTrigger {
  type: 'property_change' | 'schedule' | 'compliance_failure' | 'risk_threshold' | 'manual'
  condition: string
  metadata?: Record<string, any>
}

interface WorkflowAction {
  type: 'set_property' | 'create_issue' | 'send_notification' | 'run_scan' | 'trigger_build' | 'apply_policy'
  parameters: Record<string, any>
  delay?: number // seconds
}

interface WorkflowDefinition {
  id: string
  name: string
  description: string
  enabled: boolean
  triggers: WorkflowTrigger[]
  actions: WorkflowAction[]
  created_at: string
  updated_at: string
}

interface WorkflowExecution {
  id: string
  workflow_id: string
  repository: string
  trigger: WorkflowTrigger
  status: 'pending' | 'running' | 'completed' | 'failed'
  started_at: string
  completed_at?: string
  results: any[]
  errors: string[]
}

function loadConfig(): Config {
  try {
    const configPath = resolve(__dirname, '../config.json')
    const configData = readFileSync(configPath, 'utf-8')
    return JSON.parse(configData)
  } catch (error) {
    console.error('Failed to load config.json:', error)
    process.exit(1)
  }
}

/**
 * Manages metadata-driven workflows for repository governance
 */
export class WorkflowEngine {
  private propertyManager: PropertyManager
  private workflows: WorkflowDefinition[] = []
  private executions: WorkflowExecution[] = []

  constructor(token: string, organization: string) {
    this.propertyManager = new PropertyManager(token, organization)
    this.loadWorkflows()
  }

  /**
   * Load workflow definitions from storage
   */
  private loadWorkflows(): void {
    try {
      const data = readFileSync(resolve(__dirname, '../workflows.json'), 'utf-8')
      this.workflows = JSON.parse(data)
    } catch (error) {
      console.warn('No existing workflows found, starting with empty set')
      this.workflows = []
    }
  }

  /**
   * Save workflow definitions to storage
   */
  private saveWorkflows(): void {
    try {
      writeFileSync(resolve(__dirname, '../workflows.json'), JSON.stringify(this.workflows, null, 2))
    } catch (error) {
      console.error('Failed to save workflows:', error)
    }
  }

  /**
   * Create a new workflow
   */
  createWorkflow(
    name: string,
    description: string,
    triggers: WorkflowTrigger[],
    actions: WorkflowAction[]
  ): WorkflowDefinition {
    const workflow: WorkflowDefinition = {
      id: `workflow-${Date.now()}`,
      name,
      description,
      enabled: true,
      triggers,
      actions,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    this.workflows.push(workflow)
    this.saveWorkflows()
    
    return workflow
  }

  /**
   * Evaluate triggers for a repository event
   */
  async evaluateTriggers(
    repository: string,
    eventType: string,
    eventData?: any
  ): Promise<WorkflowExecution[]> {
    const executions: WorkflowExecution[] = []
    const properties = await this.propertyManager.getRepositoryProperties(repository)

    for (const workflow of this.workflows.filter(w => w.enabled)) {
      for (const trigger of workflow.triggers) {
        if (await this.matchesTrigger(trigger, repository, properties, eventType, eventData)) {
          const execution = await this.executeWorkflow(workflow, repository, trigger)
          executions.push(execution)
        }
      }
    }

    return executions
  }

  /**
   * Check if trigger conditions are met
   */
  private async matchesTrigger(
    trigger: WorkflowTrigger,
    repository: string,
    properties: Partial<RepositoryProperties>,
    eventType: string,
    eventData?: any
  ): Promise<boolean> {
    switch (trigger.type) {
      case 'property_change':
        return this.matchesPropertyChange(trigger, properties, eventData)
      case 'schedule':
        return this.matchesSchedule(trigger)
      case 'compliance_failure':
        return await this.matchesComplianceFailure(trigger, repository)
      case 'risk_threshold':
        return await this.matchesRiskThreshold(trigger, repository)
      case 'manual':
        return eventType === 'manual' && trigger.condition === eventData?.workflowId
      default:
        return false
    }
  }

  /**
   * Match property change trigger
   */
  private matchesPropertyChange(
    trigger: WorkflowTrigger,
    properties: Partial<RepositoryProperties>,
    eventData?: any
  ): boolean {
    if (!eventData || !eventData.changedProperty) return false

    const { changedProperty, oldValue, newValue } = eventData
    const condition = trigger.condition

    // Simple condition matching (can be enhanced with proper expression parser)
    if (condition.includes(changedProperty)) {
      if (condition.includes('->')) {
        // Check for specific value change
        const parts = condition.split('->')
        return parts[0].trim() === changedProperty && parts[1].trim() === newValue
      } else {
        // Check for any change to property
        return true
      }
    }

    return false
  }

  /**
   * Match schedule trigger
   */
  private matchesSchedule(trigger: WorkflowTrigger): boolean {
    const condition = trigger.condition
    const now = new Date()

    // Simple schedule matching (cron-like expressions)
    if (condition === 'daily') {
      return now.getHours() === 2 && now.getMinutes() === 0 // 2 AM daily
    } else if (condition === 'weekly') {
      return now.getDay() === 1 && now.getHours() === 2 && now.getMinutes() === 0 // Monday 2 AM
    } else if (condition === 'monthly') {
      return now.getDate() === 1 && now.getHours() === 2 && now.getMinutes() === 0 // 1st of month 2 AM
    }

    return false
  }

  /**
   * Match compliance failure trigger
   */
  private async matchesComplianceFailure(
    trigger: WorkflowTrigger,
    repository: string
  ): Promise<boolean> {
    // This would integrate with compliance checker
    // For now, simulate compliance check
    const condition = trigger.condition
    
    if (condition.includes('critical')) {
      // Simulate critical compliance failure
      return Math.random() < 0.1 // 10% chance for demo
    } else if (condition.includes('high')) {
      // Simulate high compliance failure
      return Math.random() < 0.2 // 20% chance for demo
    }

    return false
  }

  /**
   * Match risk threshold trigger
   */
  private async matchesRiskThreshold(
    trigger: WorkflowTrigger,
    repository: string
  ): Promise<boolean> {
    // This would integrate with risk assessment engine
    // For now, simulate risk assessment
    const condition = trigger.condition
    
    if (condition.includes('> 3.5')) {
      // Simulate critical risk score
      return Math.random() < 0.15 // 15% chance for demo
    } else if (condition.includes('> 2.8')) {
      // Simulate high risk score
      return Math.random() < 0.25 // 25% chance for demo
    }

    return false
  }

  /**
   * Execute a workflow
   */
  private async executeWorkflow(
    workflow: WorkflowDefinition,
    repository: string,
    trigger: WorkflowTrigger
  ): Promise<WorkflowExecution> {
    const execution: WorkflowExecution = {
      id: `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      workflow_id: workflow.id,
      repository,
      trigger,
      status: 'running',
      started_at: new Date().toISOString(),
      results: [],
      errors: []
    }

    console.log(`🚀 Executing workflow: ${workflow.name} for ${repository}`)

    try {
      for (const action of workflow.actions) {
        if (action.delay) {
          await this.delay(action.delay * 1000)
        }

        const result = await this.executeAction(action, repository, execution)
        execution.results.push(result)
      }

      execution.status = 'completed'
      execution.completed_at = new Date().toISOString()
      
      console.log(`✅ Workflow completed: ${workflow.name}`)
    } catch (error) {
      execution.status = 'failed'
      execution.errors.push(String(error))
      console.error(`❌ Workflow failed: ${workflow.name} - ${error}`)
    }

    this.executions.push(execution)
    return execution
  }

  /**
   * Execute a single workflow action
   */
  private async executeAction(
    action: WorkflowAction,
    repository: string,
    execution: WorkflowExecution
  ): Promise<any> {
    console.log(`  📋 Executing action: ${action.type}`)

    switch (action.type) {
      case 'set_property':
        return await this.executeSetProperty(action, repository)
      case 'create_issue':
        return await this.executeCreateIssue(action, repository, execution)
      case 'send_notification':
        return await this.executeSendNotification(action, repository)
      case 'run_scan':
        return await this.executeRunScan(action, repository)
      case 'trigger_build':
        return await this.executeTriggerBuild(action, repository)
      case 'apply_policy':
        return await this.executeApplyPolicy(action, repository)
      default:
        throw new Error(`Unknown action type: ${action.type}`)
    }
  }

  /**
   * Execute set property action
   */
  private async executeSetProperty(action: WorkflowAction, repository: string): Promise<any> {
    const { property, value } = action.parameters
    
    const result = await this.propertyManager.setRepositoryProperties(repository, {
      [property]: value
    })

    return {
      action: 'set_property',
      repository,
      property,
      value,
      success: result.success,
      updated: result.updated_properties,
      failed: result.failed_properties
    }
  }

  /**
   * Execute create issue action
   */
  private async executeCreateIssue(
    action: WorkflowAction, 
    repository: string, 
    execution: WorkflowExecution
  ): Promise<any> {
    const { title, body, labels } = action.parameters
    
    // In production, this would call GitHub API to create an issue
    const issueData = {
      repository,
      title: title.replace('{repo}', repository),
      body: body.replace('{repo}', repository).replace('{workflow}', execution.workflow_id),
      labels: labels || ['governance', 'automated'],
      workflow_id: execution.workflow_id,
      execution_id: execution.id
    }

    console.log(`    📝 Creating issue: ${issueData.title}`)
    
    // For demo, save to file
    const issues = this.loadIssues()
    issues.push({
      ...issueData,
      created_at: new Date().toISOString(),
      status: 'open'
    })
    this.saveIssues(issues)

    return {
      action: 'create_issue',
      repository,
      issue: issueData,
      success: true
    }
  }

  /**
   * Execute send notification action
   */
  private async executeSendNotification(action: WorkflowAction, repository: string): Promise<any> {
    const { channel, message, severity } = action.parameters
    
    const notification = {
      repository,
      channel,
      message: message.replace('{repo}', repository),
      severity: severity || 'info',
      timestamp: new Date().toISOString()
    }

    console.log(`    📢 Sending notification to ${channel}: ${notification.message}`)
    
    // In production, this would integrate with Slack, Teams, email, etc.
    // For demo, save to file
    const notifications = this.loadNotifications()
    notifications.push(notification)
    this.saveNotifications(notifications)

    return {
      action: 'send_notification',
      repository,
      notification,
      success: true
    }
  }

  /**
   * Execute run scan action
   */
  private async executeRunScan(action: WorkflowAction, repository: string): Promise<any> {
    const { scan_type, parameters } = action.parameters
    
    console.log(`    🔍 Running ${scan_type} scan on ${repository}`)
    
    // In production, this would trigger actual security scans
    // For demo, simulate scan results
    const scanResult = {
      repository,
      scan_type,
      started_at: new Date().toISOString(),
      status: 'running',
      parameters: parameters || {}
    }

    return {
      action: 'run_scan',
      repository,
      scan: scanResult,
      success: true
    }
  }

  /**
   * Execute trigger build action
   */
  private async executeTriggerBuild(action: WorkflowAction, repository: string): Promise<any> {
    const { branch, pipeline } = action.parameters
    
    console.log(`    🏗️  Triggering build for ${repository} on ${branch}`)
    
    // In production, this would trigger CI/CD pipeline
    const buildResult = {
      repository,
      branch: branch || 'main',
      pipeline: pipeline || 'default',
      triggered_at: new Date().toISOString(),
      status: 'queued'
    }

    return {
      action: 'trigger_build',
      repository,
      build: buildResult,
      success: true
    }
  }

  /**
   * Execute apply policy action
   */
  private async executeApplyPolicy(action: WorkflowAction, repository: string): Promise<any> {
    const { policy_id, policy_name } = action.parameters
    
    console.log(`    📋 Applying policy ${policy_name || policy_id} to ${repository}`)
    
    // In production, this would apply governance policies
    const policyResult = {
      repository,
      policy_id,
      policy_name,
      applied_at: new Date().toISOString(),
      status: 'applied'
    }

    return {
      action: 'apply_policy',
      repository,
      policy: policyResult,
      success: true
    }
  }

  /**
   * Generate predefined workflows
   */
  generatePredefinedWorkflows(): WorkflowDefinition[] {
    return [
      // High-risk repository onboarding
      this.createWorkflow(
        'High-Risk Repository Onboarding',
        'Automated onboarding for high-risk repositories',
        [
          {
            type: 'property_change',
            condition: 'business_criticality -> Critical'
          },
          {
            type: 'property_change',
            condition: 'data_classification -> Restricted'
          }
        ],
        [
          {
            type: 'set_property',
            parameters: {
              property: 'security_classification',
              value: 'Critical'
            }
          },
          {
            type: 'set_property',
            parameters: {
              property: 'review_frequency',
              value: 'Monthly'
            }
          },
          {
            type: 'create_issue',
            parameters: {
              title: 'High-Risk Repository Security Review Required',
              body: 'Repository {repo} has been classified as high-risk and requires immediate security review.\n\nWorkflow: {workflow}',
              labels: ['security', 'high-priority', 'governance']
            }
          },
          {
            type: 'send_notification',
            parameters: {
              channel: 'security-team',
              message: '🚨 High-risk repository detected: {repo}. Immediate security review required.',
              severity: 'critical'
            }
          }
        ]
      ),

      // Compliance framework activation
      this.createWorkflow(
        'Compliance Framework Activation',
        'Automated actions when compliance frameworks are added',
        [
          {
            type: 'property_change',
            condition: 'compliance_frameworks'
          }
        ],
        [
          {
            type: 'run_scan',
            parameters: {
              scan_type: 'compliance',
              parameters: { frameworks: '{frameworks}' }
            }
          },
          {
            type: 'create_issue',
            parameters: {
              title: 'Compliance Framework Added to {repo}',
              body: 'Repository {repo} now requires compliance with new frameworks.\n\nPlease review and implement required controls.',
              labels: ['compliance', 'governance']
            }
          },
          {
            type: 'apply_policy',
            parameters: {
              policy_id: 'compliance-{framework}',
              policy_name: 'Compliance Policy for {framework}'
            }
          }
        ]
      ),

      // Risk threshold breach
      this.createWorkflow(
        'Risk Threshold Breach',
        'Automated response when risk score exceeds threshold',
        [
          {
            type: 'risk_threshold',
            condition: '> 3.5'
          }
        ],
        [
          {
            type: 'set_property',
            parameters: {
              property: 'business_criticality',
              value: 'Critical'
            }
          },
          {
            type: 'create_issue',
            parameters: {
              title: 'Critical Risk Score for {repo}',
              body: 'Repository {repo} has exceeded critical risk threshold.\n\nImmediate action required.',
              labels: ['risk', 'critical', 'governance']
            }
          },
          {
            type: 'send_notification',
            parameters: {
              channel: 'management',
              message: '🚨 CRITICAL: Repository {repo} has exceeded risk threshold. Immediate management attention required.',
              severity: 'critical'
            }
          },
          {
            type: 'trigger_build',
            parameters: {
              branch: 'main',
              pipeline: 'security-scan'
            }
          }
        ]
      ),

      // Security review reminder
      this.createWorkflow(
        'Security Review Reminder',
        'Periodic security review reminders',
        [
          {
            type: 'schedule',
            condition: 'monthly'
          }
        ],
        [
          {
            type: 'run_scan',
            parameters: {
              scan_type: 'security'
            }
          },
          {
            type: 'create_issue',
            parameters: {
              title: 'Monthly Security Review - {repo}',
              body: 'Monthly security review is due for repository {repo}.\n\nPlease complete the security checklist.',
              labels: ['security', 'monthly-review', 'governance']
            }
          }
        ]
      ),

      // Public-facing application security
      this.createWorkflow(
        'Public-Facing Application Security',
        'Enhanced security for public-facing applications',
        [
          {
            type: 'property_change',
            condition: 'public_facing -> true'
          }
        ],
        [
          {
            type: 'set_property',
            parameters: {
              property: 'security_classification',
              value: 'Elevated'
            }
          },
          {
            type: 'run_scan',
            parameters: {
              scan_type: 'web-security'
            }
          },
          {
            type: 'create_issue',
            parameters: {
              title: 'Public-Facing Application Security Review',
              body: 'Repository {repo} is now public-facing and requires enhanced security measures.\n\nPlease implement WAF, DDoS protection, and regular security scanning.',
              labels: ['security', 'public-facing', 'governance']
            }
          }
        ]
      )
    ]
  }

  /**
   * Get workflow execution history
   */
  getExecutionHistory(
    repository?: string,
    workflowId?: string,
    limit: number = 50
  ): WorkflowExecution[] {
    let filtered = this.executions

    if (repository) {
      filtered = filtered.filter(exec => exec.repository === repository)
    }

    if (workflowId) {
      filtered = filtered.filter(exec => exec.workflow_id === workflowId)
    }

    return filtered
      .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
      .slice(0, limit)
  }

  /**
   * Get workflow statistics
   */
  getStatistics(): {
    total_workflows: number
    enabled_workflows: number
    total_executions: number
    success_rate: number
    most_active_workflows: Array<{ workflow_id: string; name: string; executions: number }>
  } {
    const enabledWorkflows = this.workflows.filter(w => w.enabled).length
    const successfulExecutions = this.executions.filter(e => e.status === 'completed').length
    const successRate = this.executions.length > 0 ? (successfulExecutions / this.executions.length) * 100 : 0

    const workflowCounts = this.executions.reduce((acc, exec) => {
      acc[exec.workflow_id] = (acc[exec.workflow_id] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const mostActiveWorkflows = Object.entries(workflowCounts)
      .map(([workflow_id, executions]) => {
        const workflow = this.workflows.find(w => w.id === workflow_id)
        return {
          workflow_id,
          name: workflow?.name || 'Unknown',
          executions
        }
      })
      .sort((a, b) => b.executions - a.executions)
      .slice(0, 5)

    return {
      total_workflows: this.workflows.length,
      enabled_workflows: enabledWorkflows,
      total_executions: this.executions.length,
      success_rate: Math.round(successRate * 100) / 100,
      most_active_workflows
    }
  }

  // Helper methods for data persistence
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private loadIssues(): any[] {
    try {
      const data = readFileSync(resolve(__dirname, '../issues.json'), 'utf-8')
      return JSON.parse(data)
    } catch (error) {
      return []
    }
  }

  private saveIssues(issues: any[]): void {
    try {
      writeFileSync(resolve(__dirname, '../issues.json'), JSON.stringify(issues, null, 2))
    } catch (error) {
      console.error('Failed to save issues:', error)
    }
  }

  private loadNotifications(): any[] {
    try {
      const data = readFileSync(resolve(__dirname, '../notifications.json'), 'utf-8')
      return JSON.parse(data)
    } catch (error) {
      return []
    }
  }

  private saveNotifications(notifications: any[]): void {
    try {
      writeFileSync(resolve(__dirname, '../notifications.json'), JSON.stringify(notifications, null, 2))
    } catch (error) {
      console.error('Failed to save notifications:', error)
    }
  }
}

async function main() {
  const args = process.argv.slice(2)
  const command = args[0]

  if (!command) {
    console.log(`
Usage: npm run metadata-workflows <command> [options]

Commands:
  create <name> <description> <triggers-file> <actions-file>  Create a new workflow
  list                                                          List all workflows
  enable <workflow-id>                                          Enable a workflow
  disable <workflow-id>                                         Disable a workflow
  trigger <repo> <event> <data>                                Trigger workflows manually
  history [repo] [workflow-id]                                  Show execution history
  stats                                                         Show workflow statistics
  generate-predefined                                          Generate predefined workflows

Examples:
  npm run metadata-workflows create "Security Review" "Automated security reviews" ./triggers.json ./actions.json
  npm run metadata-workflows list
  npm run metadata-workflows enable workflow-123
  npm run metadata-workflows trigger agency-platform property_change '{"property":"business_criticality","oldValue":"Medium","newValue":"Critical"}'
  npm run metadata-workflows history
  npm run metadata-workflows stats
  npm run metadata-workflows generate-predefined
    `)
    process.exit(0)
  }

  const config = loadConfig()
  const workflowEngine = new WorkflowEngine(config.token, config.organization)

  try {
    switch (command) {
      case 'create':
        await handleCreate(workflowEngine, args[1], args[2], args[3], args[4])
        break
      case 'list':
        await handleList(workflowEngine)
        break
      case 'enable':
        await handleEnable(workflowEngine, args[1])
        break
      case 'disable':
        await handleDisable(workflowEngine, args[1])
        break
      case 'trigger':
        await handleTrigger(workflowEngine, args[1], args[2], args[3])
        break
      case 'history':
        await handleHistory(workflowEngine, args[1], args[2])
        break
      case 'stats':
        await handleStats(workflowEngine)
        break
      case 'generate-predefined':
        await handleGeneratePredefined(workflowEngine)
        break
      default:
        console.error(`Unknown command: ${command}`)
        process.exit(1)
    }
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

async function handleCreate(
  workflowEngine: WorkflowEngine,
  name: string,
  description: string,
  triggersFile: string,
  actionsFile: string
) {
  if (!name || !description || !triggersFile || !actionsFile) {
    console.error('All arguments are required: name, description, triggers-file, actions-file')
    process.exit(1)
  }

  try {
    const triggersData = readFileSync(resolve(triggersFile), 'utf-8')
    const actionsData = readFileSync(resolve(actionsFile), 'utf-8')
    
    const triggers = JSON.parse(triggersData)
    const actions = JSON.parse(actionsData)
    
    const workflow = workflowEngine.createWorkflow(name, description, triggers, actions)
    
    console.log(`Workflow created: ${workflow.id}`)
    console.log(`Name: ${workflow.name}`)
    console.log(`Triggers: ${workflow.triggers.length}`)
    console.log(`Actions: ${workflow.actions.length}`)
  } catch (error) {
    console.error('Failed to create workflow:', error)
    process.exit(1)
  }
}

async function handleList(workflowEngine: WorkflowEngine) {
  const workflows = workflowEngine['workflows']
  
  console.log(`Found ${workflows.length} workflows:`)
  console.log()
  
  workflows.forEach(workflow => {
    const status = workflow.enabled ? '✅ Enabled' : '❌ Disabled'
    console.log(`${workflow.id}: ${workflow.name} (${status})`)
    console.log(`  Description: ${workflow.description}`)
    console.log(`  Triggers: ${workflow.triggers.length}`)
    console.log(`  Actions: ${workflow.actions.length}`)
    console.log(`  Created: ${workflow.created_at}`)
    console.log()
  })
}

async function handleEnable(workflowEngine: WorkflowEngine, workflowId: string) {
  if (!workflowId) {
    console.error('Workflow ID is required')
    process.exit(1)
  }

  const workflow = workflowEngine['workflows'].find(w => w.id === workflowId)
  if (!workflow) {
    console.error(`Workflow not found: ${workflowId}`)
    process.exit(1)
  }

  workflow.enabled = true
  workflowEngine['saveWorkflows']()
  
  console.log(`✅ Workflow enabled: ${workflow.name}`)
}

async function handleDisable(workflowEngine: WorkflowEngine, workflowId: string) {
  if (!workflowId) {
    console.error('Workflow ID is required')
    process.exit(1)
  }

  const workflow = workflowEngine['workflows'].find(w => w.id === workflowId)
  if (!workflow) {
    console.error(`Workflow not found: ${workflowId}`)
    process.exit(1)
  }

  workflow.enabled = false
  workflowEngine['saveWorkflows']()
  
  console.log(`❌ Workflow disabled: ${workflow.name}`)
}

async function handleTrigger(workflowEngine: WorkflowEngine, repo: string, event: string, data: string) {
  if (!repo || !event) {
    console.error('Repository and event type are required')
    process.exit(1)
  }

  const eventData = data ? JSON.parse(data) : undefined
  
  const executions = await workflowEngine.evaluateTriggers(repo, event, eventData)
  
  console.log(`Triggered ${executions.length} workflow executions for ${repo}:`)
  executions.forEach(exec => {
    const status = exec.status === 'completed' ? '✅' : exec.status === 'failed' ? '❌' : '🔄'
    console.log(`  ${status} ${exec.workflow_id}: ${exec.status}`)
  })
}

async function handleHistory(workflowEngine: WorkflowEngine, repo?: string, workflowId?: string) {
  const history = workflowEngine.getExecutionHistory(repo, workflowId)
  
  console.log(`Execution History (${history.length} executions):`)
  console.log()
  
  history.forEach(exec => {
    const status = exec.status === 'completed' ? '✅' : exec.status === 'failed' ? '❌' : '🔄'
    console.log(`${status} ${exec.repository} - ${exec.workflow_id}`)
    console.log(`  Started: ${exec.started_at}`)
    if (exec.completed_at) {
      console.log(`  Completed: ${exec.completed_at}`)
    }
    if (exec.errors.length > 0) {
      console.log(`  Errors: ${exec.errors.length}`)
    }
    console.log()
  })
}

async function handleStats(workflowEngine: WorkflowEngine) {
  const stats = workflowEngine.getStatistics()
  
  console.log('Workflow Statistics')
  console.log('===================')
  console.log()
  console.log(`Total workflows: ${stats.total_workflows}`)
  console.log(`Enabled workflows: ${stats.enabled_workflows}`)
  console.log(`Total executions: ${stats.total_executions}`)
  console.log(`Success rate: ${stats.success_rate}%`)
  console.log()
  
  if (stats.most_active_workflows.length > 0) {
    console.log('Most Active Workflows:')
    stats.most_active_workflows.forEach((workflow, index) => {
      console.log(`  ${index + 1}. ${workflow.name}: ${workflow.executions} executions`)
    })
  }
}

async function handleGeneratePredefined(workflowEngine: WorkflowEngine) {
  const workflows = workflowEngine.generatePredefinedWorkflows()
  
  console.log(`Generated ${workflows.length} predefined workflows:`)
  console.log()
  
  workflows.forEach(workflow => {
    console.log(`✅ ${workflow.name}`)
    console.log(`   ID: ${workflow.id}`)
    console.log(`   Triggers: ${workflow.triggers.length}`)
    console.log(`   Actions: ${workflow.actions.length}`)
    console.log()
  })
}

if (require.main === module) {
  main()
}
