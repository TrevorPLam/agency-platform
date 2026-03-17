import { z } from 'zod'

// ============================================================================
// Core Types
// ============================================================================

export const ContentStatus = z.enum([
  'draft',
  'ai_generated',
  'human_review',
  'compliance_review',
  'approved',
  'published',
  'rejected'
])

export type ContentStatus = z.infer<typeof ContentStatus>

export const ContentType = z.enum([
  'blog_post',
  'social_media',
  'email_newsletter',
  'landing_page',
  'product_description',
  'case_study',
  'press_release',
  'internal_memo'
])

export type ContentType = z.infer<typeof ContentType>

export const RiskLevel = z.enum(['low', 'medium', 'high', 'critical'])

export type RiskLevel = z.infer<typeof RiskLevel>

// ============================================================================
// Brand Voice & Training Data
// ============================================================================

export const BrandVoiceSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  tone: z.enum(['professional', 'casual', 'formal', 'friendly', 'authoritative', 'playful']),
  style: z.enum(['concise', 'detailed', 'conversational', 'technical', 'storytelling']),
  vocabulary: z.array(z.string()),
  phrases: z.array(z.string()),
  avoidPhrases: z.array(z.string()),
  formatting: z.object({
    useHeadings: z.boolean(),
    useBulletPoints: z.boolean(),
    useBold: z.boolean(),
    useItalics: z.boolean(),
    maxLength: z.number().positive().optional()
  }),
  compliance: z.object({
    requiresLegalReview: z.boolean(),
    restrictedTopics: z.array(z.string()),
    requiredDisclaimers: z.array(z.string()),
    piiDetection: z.boolean()
  }),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  isActive: z.boolean()
})

export type BrandVoice = z.infer<typeof BrandVoiceSchema>

export const TrainingDocumentSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  title: z.string().min(1).max(200),
  content: z.string().min(10),
  contentType: ContentType,
  source: z.enum(['website', 'blog', 'social', 'email', 'document']),
  quality: z.enum(['excellent', 'good', 'fair', 'poor']),
  tags: z.array(z.string()),
  isApproved: z.boolean(),
  createdAt: z.string().datetime(),
  processedAt: z.string().datetime().optional()
})

export type TrainingDocument = z.infer<typeof TrainingDocumentSchema>

// ============================================================================
// AI Content Generation
// ============================================================================

export const ContentRequestSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  userId: z.string().uuid(),
  title: z.string().min(1).max(200),
  contentType: ContentType,
  prompt: z.string().min(10).max(2000),
  brandVoiceId: z.string().uuid(),
  targetAudience: z.string().optional(),
  keyPoints: z.array(z.string()).optional(),
  tone: z.string().optional(),
  wordCount: z.object({
    min: z.number().positive().optional(),
    max: z.number().positive().optional()
  }).optional(),
  context: z.string().optional(),
  riskLevel: RiskLevel.default('medium'),
  requiresCompliance: z.boolean().default(false),
  status: ContentStatus.default('draft'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
})

export type ContentRequest = z.infer<typeof ContentRequestSchema>

export const GeneratedContentSchema = z.object({
  id: z.string().uuid(),
  requestId: z.string().uuid(),
  content: z.string().min(1),
  metadata: z.object({
    wordCount: z.number().positive(),
    readingTime: z.number().positive(),
    sentiment: z.enum(['positive', 'neutral', 'negative']),
    complexity: z.enum(['simple', 'moderate', 'complex']),
    brandScore: z.number().min(0).max(100),
    complianceScore: z.number().min(0).max(100),
    originalityScore: z.number().min(0).max(100)
  }),
  aiModel: z.string(),
  tokensUsed: z.object({
    prompt: z.number().positive(),
    completion: z.number().positive(),
    total: z.number().positive()
  }),
  cost: z.number().positive(),
  generatedAt: z.string().datetime(),
  expiresAt: z.string().datetime().optional()
})

export type GeneratedContent = z.infer<typeof GeneratedContentSchema>

// ============================================================================
// Approval Workflows
// ============================================================================

export const ReviewStepSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(50),
  description: z.string().optional(),
  type: z.enum(['human_review', 'compliance_check', 'legal_review', 'brand_check']),
  requiredRoles: z.array(z.string()),
  autoApproveIfScore: z.number().min(0).max(100).optional(),
  timeoutHours: z.number().positive().optional(),
  order: z.number().positive()
})

export type ReviewStep = z.infer<typeof ReviewStepSchema>

export const WorkflowSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  contentType: ContentType,
  riskLevel: RiskLevel,
  steps: z.array(ReviewStepSchema),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
})

export type Workflow = z.infer<typeof WorkflowSchema>

export const ReviewSchema = z.object({
  id: z.string().uuid(),
  contentId: z.string().uuid(),
  workflowId: z.string().uuid(),
  stepId: z.string().uuid(),
  reviewerId: z.string().uuid(),
  status: z.enum(['pending', 'approved', 'rejected', 'escalated']),
  decision: z.enum(['approve', 'reject', 'request_changes']).optional(),
  feedback: z.string().optional(),
  riskAssessment: z.object({
    level: RiskLevel,
    concerns: z.array(z.string()),
    recommendations: z.array(z.string())
  }).optional(),
  reviewedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime()
})

export type Review = z.infer<typeof ReviewSchema>

// ============================================================================
// Safety & Compliance
// ============================================================================

export const SafetyCheckSchema = z.object({
  id: z.string().uuid(),
  contentId: z.string().uuid(),
  type: z.enum(['pii_detection', 'toxicity', 'bias', 'factual_accuracy', 'brand_compliance']),
  status: z.enum(['passed', 'failed', 'warning']),
  score: z.number().min(0).max(100),
  details: z.object({
    detectedItems: z.array(z.string()),
    confidence: z.number().min(0).max(1),
    explanation: z.string().optional()
  }),
  checkedAt: z.string().datetime()
})

export type SafetyCheck = z.infer<typeof SafetyCheckSchema>

export const ComplianceReportSchema = z.object({
  id: z.string().uuid(),
  contentId: z.string().uuid(),
  framework: z.enum(['gdpr', 'ccpa', 'hipaa', 'soc2', 'custom']),
  status: z.enum(['compliant', 'non_compliant', 'requires_review']),
  checks: z.array(SafetyCheckSchema),
  recommendations: z.array(z.string()),
  reviewedAt: z.string().datetime(),
  nextReviewAt: z.string().datetime().optional()
})

export type ComplianceReport = z.infer<typeof ComplianceReportSchema>

// ============================================================================
// Analytics & Metrics
// ============================================================================

export const ContentMetricsSchema = z.object({
  id: z.string().uuid(),
  contentId: z.string().uuid(),
  tenantId: z.string().uuid(),
  period: z.string(),
  metrics: z.object({
    views: z.number().min(0),
    engagement: z.number().min(0),
    conversions: z.number().min(0),
    shares: z.number().min(0),
    comments: z.number().min(0),
    timeOnPage: z.number().min(0),
    bounceRate: z.number().min(0).max(1)
  }),
  recordedAt: z.string().datetime()
})

export type ContentMetrics = z.infer<typeof ContentMetricsSchema>

export const UsageAnalyticsSchema = z.object({
  period: z.string(),
  tenantId: z.string().uuid(),
  totalRequests: z.number().min(0),
  successfulGenerations: z.number().min(0),
  averageGenerationTime: z.number().min(0),
  totalCost: z.number().min(0),
  averageBrandScore: z.number().min(0).max(100),
  averageComplianceScore: z.number().min(0).max(100),
  topContentTypes: z.array(z.object({
    type: ContentType,
    count: z.number().min(0)
  })),
  rejectionReasons: z.array(z.object({
    reason: z.string(),
    count: z.number().min(0)
  }))
})

export type UsageAnalytics = z.infer<typeof UsageAnalyticsSchema>

// ============================================================================
// API Interfaces
// ============================================================================

export const CreateContentRequestSchema = ContentRequestSchema.omit({
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true
})

export type CreateContentRequest = z.infer<typeof CreateContentRequestSchema>

export const UpdateContentRequestSchema = ContentRequestSchema.partial().omit({
  id: true,
  tenantId: true,
  userId: true,
  createdAt: true
})

export type UpdateContentRequest = z.infer<typeof UpdateContentRequestSchema>

export const ContentResponseSchema = ContentRequestSchema.extend({
  generatedContent: GeneratedContentSchema.optional(),
  reviews: z.array(ReviewSchema).optional(),
  safetyChecks: z.array(SafetyCheckSchema).optional(),
  complianceReport: ComplianceReportSchema.optional(),
  metrics: ContentMetricsSchema.optional()
})

export type ContentResponse = z.infer<typeof ContentResponseSchema>

// ============================================================================
// Error Types
// ============================================================================

export const AIContentOpsErrorSchema = z.object({
  code: z.enum([
    'VALIDATION_ERROR',
    'BRAND_VOICE_NOT_FOUND',
    'INSUFFICIENT_PERMISSIONS',
    'AI_SERVICE_ERROR',
    'CONTENT_GENERATION_FAILED',
    'SAFETY_CHECK_FAILED',
    'COMPLIANCE_VIOLATION',
    'WORKFLOW_ERROR',
    'REVIEW_TIMEOUT',
    'COST_LIMIT_EXCEEDED'
  ]),
  message: z.string(),
  details: z.record(z.any()).optional(),
  timestamp: z.string().datetime()
})

export type AIContentOpsError = z.infer<typeof AIContentOpsErrorSchema>

// ============================================================================
// Configuration
// ============================================================================

export const AIContentOpsConfigSchema = z.object({
  tenantId: z.string().uuid(),
  aiProvider: z.enum(['openai', 'anthropic', 'both']),
  openai: z.object({
    apiKey: z.string().min(1),
    model: z.string().default('gpt-4'),
    maxTokens: z.number().positive().default(2000),
    temperature: z.number().min(0).max(2).default(0.7)
  }).optional(),
  anthropic: z.object({
    apiKey: z.string().min(1),
    model: z.string().default('claude-3-sonnet'),
    maxTokens: z.number().positive().default(2000),
    temperature: z.number().min(0).max(1).default(0.7)
  }).optional(),
  safety: z.object({
    enablePIIDetection: z.boolean().default(true),
    enableToxicityCheck: z.boolean().default(true),
    enableBiasDetection: z.boolean().default(true),
    piiThreshold: z.number().min(0).max(1).default(0.8),
    toxicityThreshold: z.number().min(0).max(1).default(0.7),
    biasThreshold: z.number().min(0).max(1).default(0.8)
  }),
  compliance: z.object({
    autoApproveLowRisk: z.boolean().default(true),
    requireLegalForHighRisk: z.boolean().default(true),
    retentionDays: z.number().positive().default(365),
    auditLogging: z.boolean().default(true)
  }),
  costs: z.object({
    monthlyLimit: z.number().positive().default(1000),
    alertThreshold: z.number().min(0).max(1).default(0.8),
    trackUsage: z.boolean().default(true)
  })
})

export type AIContentOpsConfig = z.infer<typeof AIContentOpsConfigSchema>
