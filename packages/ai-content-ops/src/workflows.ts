import { 
  Workflow, 
  ReviewStep, 
  Review, 
  ContentRequest, 
  GeneratedContent, 
  ContentStatus,
  RiskLevel,
  ContentType,
  AIContentOpsError
} from './types'

// ============================================================================
// Workflow Engine
// ============================================================================

export interface WorkflowContext {
  contentRequest: ContentRequest
  generatedContent?: GeneratedContent
  currentStep?: number
  reviews: Review[]
  metadata: Record<string, any>
}

export class WorkflowEngine {
  private workflows: Map<string, Workflow> = new Map()
  private activeWorkflows: Map<string, WorkflowContext> = new Map()

  /**
   * Create a new workflow
   */
  createWorkflow(workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>): Workflow {
    const newWorkflow: Workflow = {
      ...workflow,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    this.workflows.set(newWorkflow.id, newWorkflow)
    return newWorkflow
  }

  /**
   * Get workflow for content request
   */
  getWorkflowForRequest(request: ContentRequest): Workflow | undefined {
    return Array.from(this.workflows.values()).find(workflow =>
      workflow.tenantId === request.tenantId &&
      workflow.contentType === request.contentType &&
      workflow.riskLevel === request.riskLevel &&
      workflow.isActive
    )
  }

  /**
   * Start workflow for content request
   */
  async startWorkflow(request: ContentRequest, generatedContent?: GeneratedContent): Promise<string> {
    const workflow = this.getWorkflowForRequest(request)
    if (!workflow) {
      throw new AIContentOpsError({
        code: 'WORKFLOW_ERROR',
        message: 'No workflow found for content request',
        details: { 
          contentType: request.contentType, 
          riskLevel: request.riskLevel 
        },
        timestamp: new Date().toISOString()
      })
    }

    const context: WorkflowContext = {
      contentRequest: request,
      generatedContent,
      currentStep: 0,
      reviews: [],
      metadata: {
        workflowId: workflow.id,
        startedAt: new Date().toISOString()
      }
    }

    this.activeWorkflows.set(request.id, context)
    
    // Auto-approve if no steps required
    if (workflow.steps.length === 0) {
      await this.completeWorkflow(request.id)
    }

    return workflow.id
  }

  /**
   * Get current workflow context
   */
  getWorkflowContext(requestId: string): WorkflowContext | undefined {
    return this.activeWorkflows.get(requestId)
  }

  /**
   * Submit review for current step
   */
  async submitReview(
    requestId: string,
    reviewerId: string,
    decision: 'approve' | 'reject' | 'request_changes',
    feedback?: string,
    riskAssessment?: {
      level: RiskLevel
      concerns: string[]
      recommendations: string[]
    }
  ): Promise<Review> {
    const context = this.activeWorkflows.get(requestId)
    if (!context) {
      throw new AIContentOpsError({
        code: 'WORKFLOW_ERROR',
        message: 'Active workflow not found',
        timestamp: new Date().toISOString()
      })
    }

    const workflow = this.workflows.get(context.metadata.workflowId)
    if (!workflow) {
      throw new AIContentOpsError({
        code: 'WORKFLOW_ERROR',
        message: 'Workflow not found',
        timestamp: new Date().toISOString()
      })
    }

    const currentStepIndex = context.currentStep || 0
    if (currentStepIndex >= workflow.steps.length) {
      throw new AIContentOpsError({
        code: 'WORKFLOW_ERROR',
        message: 'No current step to review',
        timestamp: new Date().toISOString()
      })
    }

    const currentStep = workflow.steps[currentStepIndex]

    // Create review
    const review: Review = {
      id: crypto.randomUUID(),
      contentId: requestId,
      workflowId: workflow.id,
      stepId: currentStep.id,
      reviewerId,
      status: decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected' : 'escalated',
      decision,
      feedback,
      riskAssessment,
      reviewedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    }

    context.reviews.push(review)

    // Check if step is complete
    const stepReviews = context.reviews.filter(r => r.stepId === currentStep.id)
    const requiredApprovals = currentStep.requiredRoles.length
    
    if (decision === 'reject') {
      // Rejection stops the workflow
      await this.rejectWorkflow(requestId, feedback)
    } else if (stepReviews.length >= requiredApprovals) {
      // Move to next step or complete
      const allApproved = stepReviews.every(r => r.decision === 'approve')
      
      if (allApproved) {
        if (currentStepIndex < workflow.steps.length - 1) {
          context.currentStep = currentStepIndex + 1
        } else {
          await this.completeWorkflow(requestId)
        }
      } else {
        // Some reviews requested changes - escalate
        await this.escalateWorkflow(requestId, 'Mixed review decisions')
      }
    }

    return review
  }

  /**
   * Complete workflow successfully
   */
  private async completeWorkflow(requestId: string): Promise<void> {
    const context = this.activeWorkflows.get(requestId)
    if (!context) return

    context.metadata.completedAt = new Date().toISOString()
    context.metadata.status = 'completed'

    // Update content request status
    // In a real implementation, this would update the database
    console.log(`Workflow completed for request ${requestId}`)
  }

  /**
   * Reject workflow
   */
  private async rejectWorkflow(requestId: string, reason?: string): Promise<void> {
    const context = this.activeWorkflows.get(requestId)
    if (!context) return

    context.metadata.rejectedAt = new Date().toISOString()
    context.metadata.status = 'rejected'
    context.metadata.rejectionReason = reason

    console.log(`Workflow rejected for request ${requestId}: ${reason}`)
  }

  /**
   * Escalate workflow
   */
  private async escalateWorkflow(requestId: string, reason: string): Promise<void> {
    const context = this.activeWorkflows.get(requestId)
    if (!context) return

    context.metadata.escalatedAt = new Date().toISOString()
    context.metadata.status = 'escalated'
    context.metadata.escalationReason = reason

    console.log(`Workflow escalated for request ${requestId}: ${reason}`)
  }

  /**
   * Get workflow status
   */
  getWorkflowStatus(requestId: string): {
    status: 'pending' | 'in_progress' | 'completed' | 'rejected' | 'escalated'
    currentStep?: ReviewStep
    progress: number
    totalSteps: number
  } {
    const context = this.activeWorkflows.get(requestId)
    if (!context) {
      return { status: 'pending', progress: 0, totalSteps: 0 }
    }

    const workflow = this.workflows.get(context.metadata.workflowId)
    if (!workflow) {
      return { status: 'pending', progress: 0, totalSteps: 0 }
    }

    const status = context.metadata.status || 'in_progress'
    const currentStepIndex = context.currentStep || 0
    const currentStep = workflow.steps[currentStepIndex]

    return {
      status: status as any,
      currentStep,
      progress: currentStepIndex,
      totalSteps: workflow.steps.length
    }
  }

  /**
   * Get all workflows for tenant
   */
  getWorkflowsForTenant(tenantId: string): Workflow[] {
    return Array.from(this.workflows.values())
      .filter(workflow => workflow.tenantId === tenantId && workflow.isActive)
  }
}

// ============================================================================
// Default Workflow Templates
// ============================================================================

export const DEFAULT_WORKFLOWS = {
  // Low risk content - minimal review
  lowRisk: {
    name: 'Low Risk Content Review',
    description: 'Minimal review for low-risk content like internal memos',
    contentType: 'internal_memo' as ContentType,
    riskLevel: 'low' as RiskLevel,
    steps: [
      {
        id: 'auto-approve',
        name: 'Auto-Approval',
        description: 'Automatically approve low-risk content',
        type: 'human_review' as const,
        requiredRoles: ['system'],
        autoApproveIfScore: 85,
        order: 1
      }
    ]
  },

  // Medium risk content - brand review only
  mediumRisk: {
    name: 'Standard Content Review',
    description: 'Brand review for medium-risk content',
    contentType: 'blog_post' as ContentType,
    riskLevel: 'medium' as RiskLevel,
    steps: [
      {
        id: 'brand-check',
        name: 'Brand Voice Review',
        description: 'Ensure content matches brand voice',
        type: 'brand_check' as const,
        requiredRoles: ['brand_manager'],
        autoApproveIfScore: 80,
        order: 1
      }
    ]
  },

  // High risk content - brand + compliance review
  highRisk: {
    name: 'High Risk Content Review',
    description: 'Comprehensive review for high-risk content',
    contentType: 'landing_page' as ContentType,
    riskLevel: 'high' as RiskLevel,
    steps: [
      {
        id: 'brand-check',
        name: 'Brand Voice Review',
        description: 'Ensure content matches brand voice',
        type: 'brand_check' as const,
        requiredRoles: ['brand_manager'],
        order: 1
      },
      {
        id: 'compliance-check',
        name: 'Compliance Review',
        description: 'Legal and regulatory compliance check',
        type: 'compliance_check' as const,
        requiredRoles: ['legal', 'compliance'],
        order: 2
      }
    ]
  },

  // Critical risk content - full review process
  criticalRisk: {
    name: 'Critical Content Review',
    description: 'Full review process for critical content',
    contentType: 'press_release' as ContentType,
    riskLevel: 'critical' as RiskLevel,
    steps: [
      {
        id: 'brand-check',
        name: 'Brand Voice Review',
        description: 'Ensure content matches brand voice',
        type: 'brand_check' as const,
        requiredRoles: ['brand_manager'],
        order: 1
      },
      {
        id: 'compliance-check',
        name: 'Compliance Review',
        description: 'Legal and regulatory compliance check',
        type: 'compliance_check' as const,
        requiredRoles: ['legal', 'compliance'],
        order: 2
      },
      {
        id: 'legal-review',
        name: 'Legal Review',
        description: 'Final legal approval',
        type: 'legal_review' as const,
        requiredRoles: ['legal_counsel'],
        order: 3
      }
    ]
  }
}

// ============================================================================
// Workflow Automation
// ============================================================================

export class WorkflowAutomation {
  private engine: WorkflowEngine

  constructor(engine: WorkflowEngine) {
    this.engine = engine
  }

  /**
   * Auto-approve content if it meets criteria
   */
  async checkAutoApproval(requestId: string): Promise<boolean> {
    const context = this.engine.getWorkflowContext(requestId)
    if (!context || !context.generatedContent) {
      return false
    }

    const workflow = this.engine.getWorkflowForRequest(context.contentRequest)
    if (!workflow) {
      return false
    }

    const currentStepIndex = context.currentStep || 0
    const currentStep = workflow.steps[currentStepIndex]

    // Check if auto-approval is enabled and criteria met
    if (currentStep.autoApproveIfScore) {
      const brandScore = context.generatedContent.metadata.brandScore
      const complianceScore = context.generatedContent.metadata.complianceScore
      
      if (brandScore >= currentStep.autoApproveIfScore && 
          complianceScore >= currentStep.autoApproveIfScore) {
        
        // Submit automatic approval
        await this.engine.submitReview(
          requestId,
          'system',
          'approve',
          `Auto-approved: Brand score ${brandScore}, Compliance score ${complianceScore}`
        )
        
        return true
      }
    }

    return false
  }

  /**
   * Check for workflow timeouts
   */
  async checkTimeouts(): Promise<string[]> {
    const timedOutWorkflows: string[] = []
    
    for (const [requestId, context] of this.engine.activeWorkflows) {
      const workflow = this.engine.getWorkflowForRequest(context.contentRequest)
      if (!workflow) continue

      const currentStepIndex = context.currentStep || 0
      const currentStep = workflow.steps[currentStepIndex]

      if (currentStep.timeoutHours) {
        const startTime = new Date(context.metadata.startedAt)
        const timeoutTime = new Date(startTime.getTime() + (currentStep.timeoutHours * 60 * 60 * 1000))
        
        if (new Date() > timeoutTime) {
          await this.engine.escalateWorkflow(
            requestId, 
            `Workflow timed out after ${currentStep.timeoutHours} hours`
          )
          timedOutWorkflows.push(requestId)
        }
      }
    }

    return timedOutWorkflows
  }

  /**
   * Bulk approve multiple requests
   */
  async bulkApprove(requestIds: string[], approverId: string): Promise<Review[]> {
    const reviews: Review[] = []

    for (const requestId of requestIds) {
      try {
        const review = await this.engine.submitReview(
          requestId,
          approverId,
          'approve',
          'Bulk approval'
        )
        reviews.push(review)
      } catch (error) {
        console.error(`Failed to approve request ${requestId}:`, error)
      }
    }

    return reviews
  }

  /**
   * Get workflow analytics
   */
  getWorkflowAnalytics(tenantId: string): {
    totalWorkflows: number
    activeWorkflows: number
    completedWorkflows: number
    rejectedWorkflows: number
    escalatedWorkflows: number
    averageCompletionTime: number
    stepCompletionRates: Record<string, number>
  } {
    const workflows = this.engine.getWorkflowsForTenant(tenantId)
    const activeContexts = Array.from(this.engine.activeWorkflows.values())
      .filter(ctx => ctx.contentRequest.tenantId === tenantId)

    const completed = activeContexts.filter(ctx => ctx.metadata.status === 'completed')
    const rejected = activeContexts.filter(ctx => ctx.metadata.status === 'rejected')
    const escalated = activeContexts.filter(ctx => ctx.metadata.status === 'escalated')

    // Calculate average completion time
    const completionTimes = completed.map(ctx => {
      const started = new Date(ctx.metadata.startedAt)
      const completed = new Date(ctx.metadata.completedAt)
      return (completed.getTime() - started.getTime()) / (1000 * 60 * 60) // hours
    })
    
    const averageCompletionTime = completionTimes.length > 0 
      ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length 
      : 0

    // Calculate step completion rates
    const stepCompletionRates: Record<string, number> = {}
    
    workflows.forEach(workflow => {
      workflow.steps.forEach((step, index) => {
        const stepKey = `${workflow.name} - ${step.name}`
        const stepReviews = activeContexts
          .filter(ctx => ctx.contentRequest.riskLevel === workflow.riskLevel)
          .flatMap(ctx => ctx.reviews.filter(r => r.stepId === step.id))
        
        const completedReviews = stepReviews.filter(r => r.status === 'approved')
        const completionRate = stepReviews.length > 0 
          ? (completedReviews.length / stepReviews.length) * 100 
          : 0
        
        stepCompletionRates[stepKey] = completionRate
      })
    })

    return {
      totalWorkflows: workflows.length,
      activeWorkflows: activeContexts.length,
      completedWorkflows: completed.length,
      rejectedWorkflows: rejected.length,
      escalatedWorkflows: escalated.length,
      averageCompletionTime,
      stepCompletionRates
    }
  }
}

// ============================================================================
// Workflow Utilities
// ============================================================================

export class WorkflowUtils {
  /**
   * Create default workflows for tenant
   */
  static createDefaultWorkflows(tenantId: string): Workflow[] {
    return Object.values(DEFAULT_WORKFLOWS).map(template => ({
      ...template,
      id: crypto.randomUUID(),
      tenantId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }))
  }

  /**
   * Estimate workflow duration
   */
  static estimateDuration(workflow: Workflow): {
    minHours: number
    maxHours: number
    averageHours: number
  } {
    const stepDurations = {
      human_review: { min: 1, max: 24, avg: 4 },
      brand_check: { min: 2, max: 48, avg: 8 },
      compliance_check: { min: 4, max: 72, avg: 24 },
      legal_review: { min: 8, max: 168, avg: 48 }
    }

    let totalMin = 0
    let totalMax = 0
    let totalAvg = 0

    workflow.steps.forEach(step => {
      const duration = stepDurations[step.type] || stepDurations.human_review
      totalMin += duration.min
      totalMax += duration.max
      totalAvg += duration.avg
    })

    return {
      minHours: totalMin,
      maxHours: totalMax,
      averageHours: totalAvg
    }
  }

  /**
   * Validate workflow configuration
   */
  static validateWorkflow(workflow: Workflow): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (!workflow.name.trim()) {
      errors.push('Workflow name is required')
    }

    if (workflow.steps.length === 0) {
      errors.push('Workflow must have at least one step')
    }

    // Check for duplicate step orders
    const orders = workflow.steps.map(step => step.order)
    const uniqueOrders = new Set(orders)
    if (orders.length !== uniqueOrders.size) {
      errors.push('Step orders must be unique')
    }

    // Check step configurations
    workflow.steps.forEach((step, index) => {
      if (!step.name.trim()) {
        errors.push(`Step ${index + 1} name is required`)
      }

      if (step.requiredRoles.length === 0) {
        errors.push(`Step ${index + 1} must have at least one required role`)
      }

      if (step.autoApproveIfScore && (step.autoApproveIfScore < 0 || step.autoApproveIfScore > 100)) {
        errors.push(`Step ${index + 1} auto-approval score must be between 0 and 100`)
      }
    })

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}
