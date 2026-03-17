import { 
  AIContentOpsConfig,
  ContentRequest,
  GeneratedContent,
  BrandVoice,
  TrainingDocument,
  Workflow,
  Review,
  ComplianceReport,
  ContentMetrics,
  UsageAnalytics,
  AIContentOpsError
} from './types'
import { AIContentGenerator, ContentGenerationUtils } from './ai-generator'
import { BrandVoiceTrainer, ContentAnalyzer } from './brand-voice'
import { WorkflowEngine, WorkflowAutomation, DEFAULT_WORKFLOWS, WorkflowUtils } from './workflows'
import { SafetyEngine, ContentFilter, SafetyUtils } from './safety'

// ============================================================================
// Main AI Content Operations System
// ============================================================================

export interface SystemConfig extends AIContentOpsConfig {
  enableAnalytics?: boolean
  enableAuditLogging?: boolean
  retentionDays?: number
}

export class AIContentOpsSystem {
  private config: SystemConfig
  private generator: AIContentGenerator
  private brandTrainer: BrandVoiceTrainer
  private analyzer: ContentAnalyzer
  private workflowEngine: WorkflowEngine
  private workflowAutomation: WorkflowAutomation
  private safetyEngine: SafetyEngine
  private contentFilter: ContentFilter

  // In-memory storage (in production, use database)
  private contentRequests: Map<string, ContentRequest> = new Map()
  private generatedContent: Map<string, GeneratedContent> = new Map()
  private brandVoices: Map<string, BrandVoice> = new Map()
  private trainingDocuments: Map<string, TrainingDocument> = new Map()
  private workflows: Map<string, Workflow> = new Map()
  private reviews: Map<string, Review> = new Map()
  private complianceReports: Map<string, ComplianceReport> = new Map()
  private metrics: Map<string, ContentMetrics[]> = new Map()

  constructor(config: SystemConfig) {
    this.config = config
    this.generator = new AIContentGenerator(config)
    this.brandTrainer = new BrandVoiceTrainer()
    this.analyzer = new ContentAnalyzer()
    this.workflowEngine = new WorkflowEngine()
    this.workflowAutomation = new WorkflowAutomation(this.workflowEngine)
    this.safetyEngine = new SafetyEngine(config)
    this.contentFilter = new ContentFilter()

    // Initialize default workflows for tenant
    this.initializeDefaultWorkflows()
  }

  // ============================================================================
  // Brand Voice Management
  // ============================================================================

  /**
   * Create brand voice from training documents
   */
  async createBrandVoice(
    tenantId: string,
    name: string,
    documentIds: string[],
    description?: string
  ): Promise<BrandVoice> {
    const brandVoice = await this.brandTrainer.analyzeBrandVoice(
      tenantId,
      documentIds,
      name,
      description
    )

    this.brandVoices.set(brandVoice.id, brandVoice)
    
    if (this.config.enableAuditLogging) {
      console.log(`Brand voice created: ${brandVoice.id} for tenant: ${tenantId}`)
    }

    return brandVoice
  }

  /**
   * Get brand voice
   */
  getBrandVoice(id: string): BrandVoice | undefined {
    return this.brandVoices.get(id)
  }

  /**
   * Get brand voices for tenant
   */
  getBrandVoicesForTenant(tenantId: string): BrandVoice[] {
    return Array.from(this.brandVoices.values())
      .filter(voice => voice.tenantId === tenantId && voice.isActive)
  }

  /**
   * Add training document
   */
  addTrainingDocument(document: TrainingDocument): void {
    this.trainingDocuments.set(document.id, document)
    this.brandTrainer.addTrainingDocument(document)
  }

  /**
   * Get training documents for tenant
   */
  getTrainingDocumentsForTenant(tenantId: string): TrainingDocument[] {
    return Array.from(this.trainingDocuments.values())
      .filter(doc => doc.tenantId === tenantId)
  }

  // ============================================================================
  // Content Generation
  // ============================================================================

  /**
   * Generate content with full pipeline
   */
  async generateContent(request: CreateContentRequest): Promise<ContentResponse> {
    try {
      // Create content request
      const contentRequest: ContentRequest = {
        id: crypto.randomUUID(),
        ...request,
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      this.contentRequests.set(contentRequest.id, contentRequest)

      // Generate content
      const generated = await this.generator.generateContent(contentRequest)
      this.generatedContent.set(generated.id, generated)

      // Run safety checks
      const safetyChecks = await this.safetyEngine.runSafetyChecks(generated.id, generated.content)

      // Generate compliance report
      const complianceReport = await this.safetyEngine.generateComplianceReport(
        generated.id,
        safetyChecks
      )
      this.complianceReports.set(complianceReport.id, complianceReport)

      // Start workflow if needed
      const workflow = this.workflowEngine.getWorkflowForRequest(contentRequest)
      if (workflow && workflow.steps.length > 0) {
        await this.workflowEngine.startWorkflow(contentRequest.id, generated)
      } else {
        // Auto-approve if no workflow required
        contentRequest.status = 'approved'
      }

      // Update request status based on safety and compliance
      if (complianceReport.status === 'non_compliant') {
        contentRequest.status = 'rejected'
      } else if (complianceReport.status === 'requires_review') {
        contentRequest.status = 'human_review'
      }

      // Build response
      const response: ContentResponse = {
        ...contentRequest,
        generatedContent: generated,
        safetyChecks,
        complianceReport
      }

      if (this.config.enableAnalytics) {
        this.trackGeneration(contentRequest, generated)
      }

      return response
    } catch (error) {
      if (error instanceof AIContentOpsError) {
        throw error
      }
      
      throw new AIContentOpsError({
        code: 'CONTENT_GENERATION_FAILED',
        message: 'Failed to generate content',
        details: { originalError: error instanceof Error ? error.message : 'Unknown error' },
        timestamp: new Date().toISOString()
      })
    }
  }

  /**
   * Get content request
   */
  getContentRequest(id: string): ContentRequest | undefined {
    return this.contentRequests.get(id)
  }

  /**
   * Get content requests for tenant
   */
  getContentRequestsForTenant(tenantId: string): ContentRequest[] {
    return Array.from(this.contentRequests.values())
      .filter(request => request.tenantId === tenantId)
  }

  // ============================================================================
  // Workflow Management
  // ============================================================================

  /**
   * Submit review for content
   */
  async submitReview(
    requestId: string,
    reviewerId: string,
    decision: 'approve' | 'reject' | 'request_changes',
    feedback?: string,
    riskAssessment?: {
      level: string
      concerns: string[]
      recommendations: string[]
    }
  ): Promise<Review> {
    const review = await this.workflowEngine.submitReview(
      requestId,
      reviewerId,
      decision,
      feedback,
      riskAssessment
    )

    this.reviews.set(review.id, review)

    // Update content request status
    const request = this.contentRequests.get(requestId)
    if (request) {
      const workflowStatus = this.workflowEngine.getWorkflowStatus(requestId)
      if (workflowStatus.status === 'completed') {
        request.status = 'approved'
      } else if (workflowStatus.status === 'rejected') {
        request.status = 'rejected'
      }
    }

    return review
  }

  /**
   * Get workflow status
   */
  getWorkflowStatus(requestId: string) {
    return this.workflowEngine.getWorkflowStatus(requestId)
  }

  /**
   * Get reviews for content
   */
  getReviewsForContent(contentId: string): Review[] {
    return Array.from(this.reviews.values())
      .filter(review => review.contentId === contentId)
  }

  // ============================================================================
  // Analytics & Reporting
  // ============================================================================

  /**
   * Get usage analytics for tenant
   */
  async getUsageAnalytics(tenantId: string, period?: string): Promise<UsageAnalytics> {
    const requests = this.getContentRequestsForTenant(tenantId)
    const generated = Array.from(this.generatedContent.values())
      .filter(content => {
        const request = this.contentRequests.get(content.requestId)
        return request?.tenantId === tenantId
      })

    const totalRequests = requests.length
    const successfulGenerations = generated.length
    const averageGenerationTime = 2.5 // Mock value - would calculate from actual data
    const totalCost = generated.reduce((sum, content) => sum + content.cost, 0)
    const averageBrandScore = generated.length > 0 
      ? generated.reduce((sum, content) => sum + content.metadata.brandScore, 0) / generated.length 
      : 0
    const averageComplianceScore = generated.length > 0 
      ? generated.reduce((sum, content) => sum + content.metadata.complianceScore, 0) / generated.length 
      : 0

    // Content type distribution
    const contentTypeCounts = new Map<string, number>()
    requests.forEach(request => {
      const count = contentTypeCounts.get(request.contentType) || 0
      contentTypeCounts.set(request.contentType, count + 1)
    })

    const topContentTypes = Array.from(contentTypeCounts.entries())
      .map(([type, count]) => ({ type: type as any, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Rejection reasons
    const rejectionReasons = new Map<string, number>()
    requests.forEach(request => {
      if (request.status === 'rejected') {
        const reason = 'Safety check failed' // Would get from actual rejection data
        const count = rejectionReasons.get(reason) || 0
        rejectionReasons.set(reason, count + 1)
      }
    })

    const rejectionReasonsList = Array.from(rejectionReasons.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)

    return {
      period: period || 'current',
      tenantId,
      totalRequests,
      successfulGenerations,
      averageGenerationTime,
      totalCost,
      averageBrandScore,
      averageComplianceScore,
      topContentTypes,
      rejectionReasons: rejectionReasonsList
    }
  }

  /**
   * Get workflow analytics
   */
  getWorkflowAnalytics(tenantId: string) {
    return this.workflowAutomation.getWorkflowAnalytics(tenantId)
  }

  /**
   * Track generation metrics
   */
  private trackGeneration(request: ContentRequest, generated: GeneratedContent): void {
    if (!this.config.enableAnalytics) return

    const metrics: ContentMetrics = {
      id: crypto.randomUUID(),
      contentId: generated.id,
      tenantId: request.tenantId,
      period: new Date().toISOString().substring(0, 7), // YYYY-MM
      metrics: {
        views: 0,
        engagement: 0,
        conversions: 0,
        shares: 0,
        comments: 0,
        timeOnPage: 0,
        bounceRate: 0
      },
      recordedAt: new Date().toISOString()
    }

    const tenantMetrics = this.metrics.get(request.tenantId) || []
    tenantMetrics.push(metrics)
    this.metrics.set(request.tenantId, tenantMetrics)
  }

  // ============================================================================
  // System Management
  // ============================================================================

  /**
   * Initialize default workflows
   */
  private initializeDefaultWorkflows(): void {
    // This would be tenant-specific in production
    const defaultWorkflows = Object.values(DEFAULT_WORKFLOWS)
    
    defaultWorkflows.forEach(template => {
      const workflow: Workflow = {
        ...template,
        id: crypto.randomUUID(),
        tenantId: 'default', // Would be actual tenant ID
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      this.workflows.set(workflow.id, workflow)
      this.workflowEngine.createWorkflow(workflow)
    })
  }

  /**
   * Get system health status
   */
  async getSystemHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    checks: Array<{
      name: string
      status: 'pass' | 'fail' | 'warn'
      message?: string
    }>
    timestamp: string
  }> {
    const checks = []
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'

    // Check AI providers
    if (this.config.openai || this.config.anthropic) {
      checks.push({
        name: 'AI Providers',
        status: 'pass',
        message: 'AI providers configured'
      })
    } else {
      checks.push({
        name: 'AI Providers',
        status: 'fail',
        message: 'No AI providers configured'
      })
      overallStatus = 'unhealthy'
    }

    // Check safety configuration
    const safetyValidation = SafetyUtils.validateSafetyConfig(this.config.safety)
    checks.push({
      name: 'Safety Configuration',
      status: safetyValidation.isValid ? 'pass' : 'fail',
      message: safetyValidation.isValid ? 'Valid' : safetyValidation.errors.join(', ')
    })

    if (!safetyValidation.isValid) {
      overallStatus = 'degraded'
    }

    // Check system resources (mock)
    const memoryUsage = Math.random() * 100
    checks.push({
      name: 'Memory Usage',
      status: memoryUsage < 80 ? 'pass' : memoryUsage < 95 ? 'warn' : 'fail',
      message: `${Math.round(memoryUsage)}% used`
    })

    if (memoryUsage > 95) {
      overallStatus = 'unhealthy'
    } else if (memoryUsage > 80 && overallStatus === 'healthy') {
      overallStatus = 'degraded'
    }

    return {
      status: overallStatus,
      checks,
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Cleanup expired content
   */
  async cleanupExpiredContent(): Promise<number> {
    let cleaned = 0
    const now = new Date()

    // Clean expired generated content
    for (const [id, content] of this.generatedContent) {
      if (content.expiresAt && new Date(content.expiresAt) < now) {
        this.generatedContent.delete(id)
        cleaned++
      }
    }

    // Clean old compliance reports based on retention policy
    const retentionDays = this.config.retentionDays || 365
    const cutoffDate = new Date(now.getTime() - (retentionDays * 24 * 60 * 60 * 1000))

    for (const [id, report] of this.complianceReports) {
      if (new Date(report.reviewedAt) < cutoffDate) {
        this.complianceReports.delete(id)
        cleaned++
      }
    }

    return cleaned
  }

  /**
   * Export system data for backup
   */
  exportData(): {
    contentRequests: ContentRequest[]
    generatedContent: GeneratedContent[]
    brandVoices: BrandVoice[]
    trainingDocuments: TrainingDocument[]
    workflows: Workflow[]
    reviews: Review[]
    complianceReports: ComplianceReport[]
  } {
    return {
      contentRequests: Array.from(this.contentRequests.values()),
      generatedContent: Array.from(this.generatedContent.values()),
      brandVoices: Array.from(this.brandVoices.values()),
      trainingDocuments: Array.from(this.trainingDocuments.values()),
      workflows: Array.from(this.workflows.values()),
      reviews: Array.from(this.reviews.values()),
      complianceReports: Array.from(this.complianceReports.values())
    }
  }

  /**
   * Import system data from backup
   */
  importData(data: {
    contentRequests?: ContentRequest[]
    generatedContent?: GeneratedContent[]
    brandVoices?: BrandVoice[]
    trainingDocuments?: TrainingDocument[]
    workflows?: Workflow[]
    reviews?: Review[]
    complianceReports?: ComplianceReport[]
  }): void {
    if (data.contentRequests) {
      data.contentRequests.forEach(request => this.contentRequests.set(request.id, request))
    }
    if (data.generatedContent) {
      data.generatedContent.forEach(content => this.generatedContent.set(content.id, content))
    }
    if (data.brandVoices) {
      data.brandVoices.forEach(voice => this.brandVoices.set(voice.id, voice))
    }
    if (data.trainingDocuments) {
      data.trainingDocuments.forEach(doc => this.trainingDocuments.set(doc.id, doc))
    }
    if (data.workflows) {
      data.workflows.forEach(workflow => this.workflows.set(workflow.id, workflow))
    }
    if (data.reviews) {
      data.reviews.forEach(review => this.reviews.set(review.id, review))
    }
    if (data.complianceReports) {
      data.complianceReports.forEach(report => this.complianceReports.set(report.id, report))
    }
  }
}

// ============================================================================
// Helper Types
// ============================================================================

export type CreateContentRequest = Omit<ContentRequest, 
  'id' | 'status' | 'createdAt' | 'updatedAt'
>

export type ContentResponse = ContentRequest & {
  generatedContent?: GeneratedContent
  safetyChecks?: any[]
  complianceReport?: ComplianceReport
  metrics?: ContentMetrics
}
