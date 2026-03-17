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
  CreateContentRequest,
  ContentResponse
} from './types'

// ============================================================================
// AI Content Operations Client
// ============================================================================

export interface ClientConfig extends AIContentOpsConfig {
  apiEndpoint?: string
  apiKey?: string
  tenantId: string
}

export class AIContentOpsClient {
  private config: ClientConfig
  private apiEndpoint: string

  constructor(config: ClientConfig) {
    this.config = config
    this.apiEndpoint = config.apiEndpoint || '/api/ai-content-ops'
  }

  // ============================================================================
  // Brand Voice Management
  // ============================================================================

  /**
   * Create brand voice from training documents
   */
  async createBrandVoice(
    name: string,
    documentIds: string[],
    description?: string
  ): Promise<BrandVoice> {
    const response = await this.fetch('/brand-voices', {
      method: 'POST',
      body: JSON.stringify({
        name,
        documentIds,
        description,
        tenantId: this.config.tenantId
      })
    })

    return response.json()
  }

  /**
   * Get brand voices for tenant
   */
  async getBrandVoices(): Promise<BrandVoice[]> {
    const response = await this.fetch(`/brand-voices?tenantId=${this.config.tenantId}`)
    return response.json()
  }

  /**
   * Get specific brand voice
   */
  async getBrandVoice(id: string): Promise<BrandVoice> {
    const response = await this.fetch(`/brand-voices/${id}`)
    return response.json()
  }

  /**
   * Update brand voice
   */
  async updateBrandVoice(id: string, updates: Partial<BrandVoice>): Promise<BrandVoice> {
    const response = await this.fetch(`/brand-voices/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    })

    return response.json()
  }

  /**
   * Add training document
   */
  async addTrainingDocument(document: Omit<TrainingDocument, 'id' | 'createdAt' | 'processedAt'>): Promise<TrainingDocument> {
    const response = await this.fetch('/training-documents', {
      method: 'POST',
      body: JSON.stringify({
        ...document,
        tenantId: this.config.tenantId
      })
    })

    return response.json()
  }

  /**
   * Get training documents for tenant
   */
  async getTrainingDocuments(): Promise<TrainingDocument[]> {
    const response = await this.fetch(`/training-documents?tenantId=${this.config.tenantId}`)
    return response.json()
  }

  // ============================================================================
  // Content Generation
  // ============================================================================

  /**
   * Generate content with AI
   */
  async generateContent(request: CreateContentRequest): Promise<ContentResponse> {
    const response = await this.fetch('/content/generate', {
      method: 'POST',
      body: JSON.stringify({
        ...request,
        tenantId: this.config.tenantId
      })
    })

    return response.json()
  }

  /**
   * Get content request
   */
  async getContentRequest(id: string): Promise<ContentRequest> {
    const response = await this.fetch(`/content/requests/${id}`)
    return response.json()
  }

  /**
   * Get content requests for tenant
   */
  async getContentRequests(status?: string): Promise<ContentRequest[]> {
    const params = new URLSearchParams({ tenantId: this.config.tenantId })
    if (status) params.append('status', status)

    const response = await this.fetch(`/content/requests?${params}`)
    return response.json()
  }

  /**
   * Update content request
   */
  async updateContentRequest(id: string, updates: Partial<ContentRequest>): Promise<ContentRequest> {
    const response = await this.fetch(`/content/requests/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    })

    return response.json()
  }

  // ============================================================================
  // Workflow Management
  // ============================================================================

  /**
   * Submit review for content
   */
  async submitReview(
    requestId: string,
    decision: 'approve' | 'reject' | 'request_changes',
    feedback?: string,
    riskAssessment?: {
      level: string
      concerns: string[]
      recommendations: string[]
    }
  ): Promise<Review> {
    const response = await this.fetch(`/content/reviews`, {
      method: 'POST',
      body: JSON.stringify({
        requestId,
        decision,
        feedback,
        riskAssessment
      })
    })

    return response.json()
  }

  /**
   * Get workflow status
   */
  async getWorkflowStatus(requestId: string): Promise<{
    status: 'pending' | 'in_progress' | 'completed' | 'rejected' | 'escalated'
    currentStep?: any
    progress: number
    totalSteps: number
  }> {
    const response = await this.fetch(`/workflows/status/${requestId}`)
    return response.json()
  }

  /**
   * Get reviews for content
   */
  async getReviewsForContent(contentId: string): Promise<Review[]> {
    const response = await this.fetch(`/content/reviews?contentId=${contentId}`)
    return response.json()
  }

  /**
   * Get workflows for tenant
   */
  async getWorkflows(): Promise<Workflow[]> {
    const response = await this.fetch(`/workflows?tenantId=${this.config.tenantId}`)
    return response.json()
  }

  // ============================================================================
  // Analytics & Reporting
  // ============================================================================

  /**
   * Get usage analytics
   */
  async getUsageAnalytics(period?: string): Promise<UsageAnalytics> {
    const params = new URLSearchParams({ tenantId: this.config.tenantId })
    if (period) params.append('period', period)

    const response = await this.fetch(`/analytics/usage?${params}`)
    return response.json()
  }

  /**
   * Get workflow analytics
   */
  async getWorkflowAnalytics(): Promise<{
    totalWorkflows: number
    activeWorkflows: number
    completedWorkflows: number
    rejectedWorkflows: number
    escalatedWorkflows: number
    averageCompletionTime: number
    stepCompletionRates: Record<string, number>
  }> {
    const response = await this.fetch(`/analytics/workflows?tenantId=${this.config.tenantId}`)
    return response.json()
  }

  /**
   * Get content metrics
   */
  async getContentMetrics(contentId: string): Promise<ContentMetrics[]> {
    const response = await this.fetch(`/analytics/content/${contentId}`)
    return response.json()
  }

  // ============================================================================
  // System Management
  // ============================================================================

  /**
   * Get system health
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
    const response = await this.fetch('/system/health')
    return response.json()
  }

  /**
   * Get compliance report
   */
  async getComplianceReport(contentId: string): Promise<ComplianceReport> {
    const response = await this.fetch(`/compliance/reports/${contentId}`)
    return response.json()
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private async fetch(path: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.apiEndpoint}${path}`
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers
    }

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`
    }

    const response = await fetch(url, {
      ...options,
      headers
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        code: 'NETWORK_ERROR',
        message: 'Network request failed'
      }))
      
      throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`)
    }

    return response
  }
}

// ============================================================================
// React Hook for AI Content Operations
// ============================================================================

import { useState, useEffect, useCallback } from 'react'

export function useAIContentOps(config: ClientConfig) {
  const [client] = useState(() => new AIContentOpsClient(config))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const executeOperation = useCallback(async <T>(
    operation: () => Promise<T>
  ): Promise<T | null> => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await operation()
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    client,
    loading,
    error,
    executeOperation
  }
}

// ============================================================================
// Specific Hooks
// ============================================================================

export function useBrandVoices(config: ClientConfig) {
  const { client, loading, error, executeOperation } = useAIContentOps(config)
  const [brandVoices, setBrandVoices] = useState<BrandVoice[]>([])

  const fetchBrandVoices = useCallback(async () => {
    const result = await executeOperation(() => client.getBrandVoices())
    if (result) setBrandVoices(result)
  }, [client, executeOperation])

  const createBrandVoice = useCallback(async (
    name: string,
    documentIds: string[],
    description?: string
  ) => {
    const result = await executeOperation(() => 
      client.createBrandVoice(name, documentIds, description)
    )
    if (result) {
      setBrandVoices(prev => [...prev, result])
      return result
    }
    return null
  }, [client, executeOperation])

  useEffect(() => {
    fetchBrandVoices()
  }, [fetchBrandVoices])

  return {
    brandVoices,
    loading,
    error,
    refresh: fetchBrandVoices,
    createBrandVoice
  }
}

export function useContentGeneration(config: ClientConfig) {
  const { client, loading, error, executeOperation } = useAIContentOps(config)
  const [requests, setRequests] = useState<ContentRequest[]>([])

  const fetchRequests = useCallback(async (status?: string) => {
    const result = await executeOperation(() => client.getContentRequests(status))
    if (result) setRequests(result)
  }, [client, executeOperation])

  const generateContent = useCallback(async (request: CreateContentRequest) => {
    const result = await executeOperation(() => client.generateContent(request))
    if (result) {
      setRequests(prev => [result, ...prev])
      return result
    }
    return null
  }, [client, executeOperation])

  const submitReview = useCallback(async (
    requestId: string,
    decision: 'approve' | 'reject' | 'request_changes',
    feedback?: string
  ) => {
    const result = await executeOperation(() => 
      client.submitReview(requestId, decision, feedback)
    )
    if (result) {
      setRequests(prev => prev.map(req => 
        req.id === requestId ? { ...req, status: 'human_review' } : req
      ))
      return result
    }
    return null
  }, [client, executeOperation])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  return {
    requests,
    loading,
    error,
    refresh: fetchRequests,
    generateContent,
    submitReview
  }
}

export function useAnalytics(config: ClientConfig) {
  const { client, loading, error, executeOperation } = useAIContentOps(config)
  const [usageAnalytics, setUsageAnalytics] = useState<UsageAnalytics | null>(null)
  const [workflowAnalytics, setWorkflowAnalytics] = useState<any>(null)

  const fetchUsageAnalytics = useCallback(async (period?: string) => {
    const result = await executeOperation(() => client.getUsageAnalytics(period))
    if (result) setUsageAnalytics(result)
  }, [client, executeOperation])

  const fetchWorkflowAnalytics = useCallback(async () => {
    const result = await executeOperation(() => client.getWorkflowAnalytics())
    if (result) setWorkflowAnalytics(result)
  }, [client, executeOperation])

  useEffect(() => {
    fetchUsageAnalytics()
    fetchWorkflowAnalytics()
  }, [fetchUsageAnalytics, fetchWorkflowAnalytics])

  return {
    usageAnalytics,
    workflowAnalytics,
    loading,
    error,
    refreshUsage: fetchUsageAnalytics,
    refreshWorkflow: fetchWorkflowAnalytics
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

export function createAIContentOpsClient(config: ClientConfig): AIContentOpsClient {
  return new AIContentOpsClient(config)
}

export function validateClientConfig(config: Partial<ClientConfig>): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!config.tenantId) {
    errors.push('Tenant ID is required')
  }

  if (!config.aiProvider) {
    errors.push('AI provider must be specified')
  }

  if (config.aiProvider === 'openai' && !config.openai?.apiKey) {
    errors.push('OpenAI API key is required when using OpenAI provider')
  }

  if (config.aiProvider === 'anthropic' && !config.anthropic?.apiKey) {
    errors.push('Anthropic API key is required when using Anthropic provider')
  }

  if (config.aiProvider === 'both' && (!config.openai?.apiKey || !config.anthropic?.apiKey)) {
    errors.push('Both OpenAI and Anthropic API keys are required when using both providers')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export function getDefaultConfig(tenantId: string): ClientConfig {
  return {
    tenantId,
    aiProvider: 'openai',
    openai: {
      apiKey: '',
      model: 'gpt-4',
      maxTokens: 2000,
      temperature: 0.7
    },
    safety: {
      enablePIIDetection: true,
      enableToxicityCheck: true,
      enableBiasDetection: true,
      piiThreshold: 0.8,
      toxicityThreshold: 0.7,
      biasThreshold: 0.8
    },
    compliance: {
      autoApproveLowRisk: true,
      requireLegalForHighRisk: true,
      retentionDays: 365,
      auditLogging: true
    },
    costs: {
      monthlyLimit: 1000,
      alertThreshold: 0.8,
      trackUsage: true
    }
  }
}
