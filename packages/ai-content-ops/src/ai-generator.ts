import { 
  ContentRequest, 
  GeneratedContent, 
  BrandVoice, 
  ContentType,
  AIContentOpsConfig,
  AIContentOpsError
} from './types'
import { BrandVoiceTrainer, ContentAnalyzer } from './brand-voice'

// ============================================================================
// AI Content Generator
// ============================================================================

export interface AIProvider {
  generateContent(prompt: string, options: GenerationOptions): Promise<GeneratedContentResponse>
}

export interface GenerationOptions {
  maxTokens?: number
  temperature?: number
  model?: string
}

export interface GeneratedContentResponse {
  content: string
  tokensUsed: {
    prompt: number
    completion: number
    total: number
  }
  model: string
  cost: number
}

export class AIContentGenerator {
  private providers: Map<string, AIProvider> = new Map()
  private brandTrainer: BrandVoiceTrainer
  private analyzer: ContentAnalyzer
  private config: AIContentOpsConfig

  constructor(config: AIContentOpsConfig) {
    this.config = config
    this.brandTrainer = new BrandVoiceTrainer()
    this.analyzer = new ContentAnalyzer()
    
    // Initialize providers based on config
    if (config.openai) {
      this.providers.set('openai', new OpenAIProvider(config.openai))
    }
    if (config.anthropic) {
      this.providers.set('anthropic', new AnthropicProvider(config.anthropic))
    }
  }

  /**
   * Generate content based on request
   */
  async generateContent(request: ContentRequest): Promise<GeneratedContent> {
    try {
      // Validate request
      this.validateRequest(request)

      // Get brand voice
      const brandVoice = this.brandTrainer.getBrandVoice(request.brandVoiceId)
      if (!brandVoice) {
        throw new AIContentOpsError({
          code: 'BRAND_VOICE_NOT_FOUND',
          message: 'Brand voice not found',
          details: { brandVoiceId: request.brandVoiceId },
          timestamp: new Date().toISOString()
        })
      }

      // Build enhanced prompt with brand voice
      const enhancedPrompt = this.buildEnhancedPrompt(request, brandVoice)

      // Select provider
      const provider = this.selectProvider(request.riskLevel)
      if (!provider) {
        throw new AIContentOpsError({
          code: 'AI_SERVICE_ERROR',
          message: 'No AI provider available',
          timestamp: new Date().toISOString()
        })
      }

      // Generate content
      const response = await provider.generateContent(enhancedPrompt, {
        maxTokens: request.wordCount?.max || brandVoice.formatting.maxLength || 1000,
        temperature: 0.7,
        model: this.getModelForProvider(provider)
      })

      // Analyze generated content
      const analysis = this.analyzer.analyzeBrandAlignment(response.content, brandVoice)

      // Create generated content record
      const generatedContent: GeneratedContent = {
        id: crypto.randomUUID(),
        requestId: request.id,
        content: response.content,
        metadata: {
          wordCount: response.content.split(/\s+/).length,
          readingTime: Math.ceil(response.content.split(/\s+/).length / 200),
          sentiment: this.analyzeSentiment(response.content),
          complexity: this.analyzeComplexity(response.content),
          brandScore: analysis.score,
          complianceScore: this.calculateComplianceScore(response.content, brandVoice),
          originalityScore: this.calculateOriginalityScore(response.content)
        },
        aiModel: response.model,
        tokensUsed: response.tokensUsed,
        cost: response.cost,
        generatedAt: new Date().toISOString(),
        expiresAt: this.calculateExpiryDate(request.riskLevel)
      }

      return generatedContent
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
   * Validate content request
   */
  private validateRequest(request: ContentRequest): void {
    if (!request.prompt.trim()) {
      throw new AIContentOpsError({
        code: 'VALIDATION_ERROR',
        message: 'Prompt cannot be empty',
        timestamp: new Date().toISOString()
      })
    }

    if (request.prompt.length > 2000) {
      throw new AIContentOpsError({
        code: 'VALIDATION_ERROR',
        message: 'Prompt too long (max 2000 characters)',
        timestamp: new Date().toISOString()
      })
    }

    if (request.wordCount?.min && request.wordCount.min > request.wordCount.max) {
      throw new AIContentOpsError({
        code: 'VALIDATION_ERROR',
        message: 'Minimum word count cannot exceed maximum',
        timestamp: new Date().toISOString()
      })
    }
  }

  /**
   * Build enhanced prompt with brand voice and context
   */
  private buildEnhancedPrompt(request: ContentRequest, brandVoice: BrandVoice): string {
    const brandPrompt = this.brandTrainer.generateBrandPrompt(brandVoice, request.contentType)
    
    const contextSections = [
      brandPrompt,
      request.targetAudience ? `Target Audience: ${request.targetAudience}` : '',
      request.keyPoints && request.keyPoints.length > 0 
        ? `Key Points to Include:\n${request.keyPoints.map((point, i) => `${i + 1}. ${point}`).join('\n')}` 
        : '',
      request.wordCount ? `Word Count: ${request.wordCount.min || 0}-${request.wordCount.max || 'unlimited'}` : '',
      request.tone ? `Additional Tone Guidance: ${request.tone}` : '',
      request.context ? `Additional Context: ${request.context}` : '',
      '',
      'Content Request:',
      request.prompt,
      '',
      'Generate content that follows all brand guidelines above. Ensure the content is original, engaging, and appropriate for the specified audience.'
    ].filter(Boolean)

    return contextSections.join('\n\n')
  }

  /**
   * Select AI provider based on risk level
   */
  private selectProvider(riskLevel: string): AIProvider | undefined {
    if (this.config.aiProvider === 'openai') {
      return this.providers.get('openai')
    }
    if (this.config.aiProvider === 'anthropic') {
      return this.providers.get('anthropic')
    }
    
    // For 'both' config, choose based on risk level
    if (this.config.aiProvider === 'both') {
      // Use OpenAI for lower risk, Anthropic for higher risk
      if (riskLevel === 'low' || riskLevel === 'medium') {
        return this.providers.get('openai')
      } else {
        return this.providers.get('anthropic')
      }
    }

    return undefined
  }

  /**
   * Get model name for provider
   */
  private getModelForProvider(provider: AIProvider): string {
    if (provider instanceof OpenAIProvider) {
      return this.config.openai?.model || 'gpt-4'
    }
    if (provider instanceof AnthropicProvider) {
      return this.config.anthropic?.model || 'claude-3-sonnet'
    }
    return 'unknown'
  }

  /**
   * Analyze sentiment of content
   */
  private analyzeSentiment(content: string): 'positive' | 'neutral' | 'negative' {
    // Simple sentiment analysis (in production, use NLP library)
    const positiveWords = ['excellent', 'great', 'amazing', 'wonderful', 'fantastic', 'good', 'best']
    const negativeWords = ['bad', 'terrible', 'awful', 'poor', 'worst', 'horrible', 'disappointing']
    
    const contentLower = content.toLowerCase()
    const positiveCount = positiveWords.filter(word => contentLower.includes(word)).length
    const negativeCount = negativeWords.filter(word => contentLower.includes(word)).length
    
    if (positiveCount > negativeCount) return 'positive'
    if (negativeCount > positiveCount) return 'negative'
    return 'neutral'
  }

  /**
   * Analyze content complexity
   */
  private analyzeComplexity(content: string): 'simple' | 'moderate' | 'complex' {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const avgSentenceLength = sentences.reduce((sum, sentence) => 
      sum + sentence.split(/\s+/).length, 0) / sentences.length
    
    const complexWords = content.match(/\b\w{10,}\b/g) || []
    const complexWordRatio = complexWords.length / content.split(/\s+/).length
    
    if (avgSentenceLength > 20 || complexWordRatio > 0.1) return 'complex'
    if (avgSentenceLength > 12 || complexWordRatio > 0.05) return 'moderate'
    return 'simple'
  }

  /**
   * Calculate compliance score
   */
  private calculateComplianceScore(content: string, brandVoice: BrandVoice): number {
    let score = 100

    // Check for restricted topics
    if (brandVoice.compliance.restrictedTopics.length > 0) {
      const contentLower = content.toLowerCase()
      const restrictedMatches = brandVoice.compliance.restrictedTopics.filter(topic =>
        contentLower.includes(topic.toLowerCase())
      )
      
      if (restrictedMatches.length > 0) {
        score -= 50
      }
    }

    // Check for PII (simplified)
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
    const phonePattern = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g
    const ssnPattern = /\b\d{3}-\d{2}-\d{4}\b/g
    
    if (emailPattern.test(content) || phonePattern.test(content) || ssnPattern.test(content)) {
      score -= 30
    }

    return Math.max(0, score)
  }

  /**
   * Calculate originality score
   */
  private calculateOriginalityScore(content: string): number {
    // Simple originality check (in production, use plagiarism detection)
    const commonPhrases = [
      'in today\'s fast-paced world',
      'at the end of the day',
      'it\'s worth noting that',
      'it\'s important to remember',
      'the fact of the matter is',
      'when all is said and done'
    ]

    const contentLower = content.toLowerCase()
    const commonPhraseCount = commonPhrases.filter(phrase => 
      contentLower.includes(phrase)
    ).length

    const score = 100 - (commonPhraseCount * 10)
    return Math.max(0, score)
  }

  /**
   * Calculate expiry date based on risk level
   */
  private calculateExpiryDate(riskLevel: string): string {
    const now = new Date()
    const expiryDays = {
      low: 90,
      medium: 60,
      high: 30,
      critical: 14
    }

    const days = expiryDays[riskLevel as keyof typeof expiryDays] || 60
    now.setDate(now.getDate() + days)
    
    return now.toISOString()
  }
}

// ============================================================================
// OpenAI Provider Implementation
// ============================================================================

class OpenAIProvider implements AIProvider {
  private apiKey: string
  private config: any

  constructor(config: any) {
    this.apiKey = config.apiKey
    this.config = config
  }

  async generateContent(prompt: string, options: GenerationOptions): Promise<GeneratedContentResponse> {
    // This is a mock implementation
    // In production, you would use the actual OpenAI API
    
    const mockResponse: GeneratedContentResponse = {
      content: `Generated content based on: ${prompt.substring(0, 100)}...`,
      tokensUsed: {
        prompt: Math.floor(prompt.length / 4),
        completion: 150,
        total: Math.floor(prompt.length / 4) + 150
      },
      model: options.model || this.config.model || 'gpt-4',
      cost: 0.01
    }

    return mockResponse
  }
}

// ============================================================================
// Anthropic Provider Implementation
// ============================================================================

class AnthropicProvider implements AIProvider {
  private apiKey: string
  private config: any

  constructor(config: any) {
    this.apiKey = config.apiKey
    this.config = config
  }

  async generateContent(prompt: string, options: GenerationOptions): Promise<GeneratedContentResponse> {
    // This is a mock implementation
    // In production, you would use the actual Anthropic API
    
    const mockResponse: GeneratedContentResponse = {
      content: `Claude-generated content based on: ${prompt.substring(0, 100)}...`,
      tokensUsed: {
        prompt: Math.floor(prompt.length / 4),
        completion: 180,
        total: Math.floor(prompt.length / 4) + 180
      },
      model: options.model || this.config.model || 'claude-3-sonnet',
      cost: 0.015
    }

    return mockResponse
  }
}

// ============================================================================
// Content Generation Utilities
// ============================================================================

export class ContentGenerationUtils {
  /**
   * Estimate token count for text
   */
  static estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4)
  }

  /**
   * Estimate cost for generation
   */
  static estimateCost(tokens: number, model: string): number {
    const pricing = {
      'gpt-4': 0.00003, // $0.03 per 1K tokens
      'gpt-3.5-turbo': 0.000002,
      'claude-3-sonnet': 0.000015,
      'claude-3-haiku': 0.0000025
    }

    const pricePerToken = pricing[model as keyof typeof pricing] || 0.00003
    return tokens * pricePerToken
  }

  /**
   * Validate content for safety
   */
  static validateContentSafety(content: string): {
    isSafe: boolean
    concerns: string[]
    score: number
  } {
    const concerns: string[] = []
    let score = 100

    // Check for potentially harmful content
    const harmfulPatterns = [
      /\b(hate|violence|harm|kill|hurt|damage)\b/gi,
      /\b(illegal|unlawful|criminal|fraud|scam)\b/gi,
      /\b(discriminat|racist|sexist|homophobic)\b/gi
    ]

    harmfulPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        concerns.push('Potentially harmful content detected')
        score -= 30
      }
    })

    // Check for PII
    const piiPatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
      /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g, // Credit card
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g // Email
    ]

    piiPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        concerns.push('Personal information detected')
        score -= 20
      }
    })

    return {
      isSafe: score >= 70,
      concerns,
      score: Math.max(0, score)
    }
  }

  /**
   * Generate content variations
   */
  static generateVariations(originalContent: string, count: number = 3): string[] {
    // Simple variation generation (in production, use AI for this)
    const variations: string[] = []
    
    for (let i = 0; i < count; i++) {
      // Simple transformations
      let variation = originalContent
      
      // Vary sentence structure slightly
      variation = variation.replace(/\./g, i % 2 === 0 ? '. ' : '! ')
      
      // Change some words
      variation = variation.replace(/\b(good|great|excellent)\b/gi, (match) => {
        const alternatives = ['wonderful', 'fantastic', 'amazing', 'outstanding']
        return alternatives[Math.floor(Math.random() * alternatives.length)]
      })
      
      variations.push(variation)
    }
    
    return variations
  }
}
