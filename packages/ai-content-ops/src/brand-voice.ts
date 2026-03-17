import { BrandVoice, TrainingDocument, ContentType } from './types'

// ============================================================================
// Brand Voice Training System
// ============================================================================

export class BrandVoiceTrainer {
  private documents: Map<string, TrainingDocument> = new Map()
  private brandVoices: Map<string, BrandVoice> = new Map()

  /**
   * Add training document for brand voice learning
   */
  addTrainingDocument(document: TrainingDocument): void {
    this.documents.set(document.id, document)
  }

  /**
   * Analyze training documents to extract brand voice patterns
   */
  async analyzeBrandVoice(
    tenantId: string,
    documentIds: string[],
    name: string,
    description?: string
  ): Promise<BrandVoice> {
    const documents = Array.from(this.documents.values())
      .filter(doc => doc.tenantId === tenantId && documentIds.includes(doc.id))
      .filter(doc => doc.isApproved && doc.quality !== 'poor')

    if (documents.length === 0) {
      throw new Error('No approved training documents found for brand voice analysis')
    }

    // Extract linguistic patterns
    const allContent = documents.map(doc => doc.content).join('\n')
    
    const analysis = await this.extractVoicePatterns(allContent)
    
    const brandVoice: BrandVoice = {
      id: crypto.randomUUID(),
      tenantId,
      name,
      description,
      tone: analysis.tone,
      style: analysis.style,
      vocabulary: analysis.vocabulary,
      phrases: analysis.phrases,
      avoidPhrases: analysis.avoidPhrases,
      formatting: analysis.formatting,
      compliance: analysis.compliance,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true
    }

    this.brandVoices.set(brandVoice.id, brandVoice)
    return brandVoice
  }

  /**
   * Extract linguistic patterns from content
   */
  private async extractVoicePatterns(content: string): Promise<{
    tone: BrandVoice['tone']
    style: BrandVoice['style']
    vocabulary: string[]
    phrases: string[]
    avoidPhrases: string[]
    formatting: BrandVoice['formatting']
    compliance: BrandVoice['compliance']
  }> {
    // This is a simplified implementation
    // In production, you'd use NLP libraries or AI to analyze patterns
    
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const words = content.toLowerCase().split(/\s+/)
    
    // Analyze tone based on word choice and sentence structure
    const formalWords = ['furthermore', 'moreover', 'consequently', 'therefore', 'however']
    const casualWords = ['awesome', 'cool', 'stuff', 'things', 'really']
    const friendlyWords = ['help', 'support', 'welcome', 'happy', 'glad']
    
    const formalCount = formalWords.filter(word => content.toLowerCase().includes(word)).length
    const casualCount = casualWords.filter(word => content.toLowerCase().includes(word)).length
    const friendlyCount = friendlyWords.filter(word => content.toLowerCase().includes(word)).length
    
    let tone: BrandVoice['tone']
    if (formalCount > casualCount && formalCount > friendlyCount) {
      tone = 'formal'
    } else if (friendlyCount > formalCount && friendlyCount > casualCount) {
      tone = 'friendly'
    } else if (casualCount > 0) {
      tone = 'casual'
    } else {
      tone = 'professional'
    }

    // Analyze style based on sentence length and structure
    const avgSentenceLength = sentences.reduce((sum, sentence) => 
      sum + sentence.split(/\s+/).length, 0) / sentences.length
    
    let style: BrandVoice['style']
    if (avgSentenceLength < 15) {
      style = 'concise'
    } else if (avgSentenceLength > 25) {
      style = 'detailed'
    } else {
      style = 'conversational'
    }

    // Extract common vocabulary (simplified)
    const wordFreq = new Map<string, number>()
    words.forEach(word => {
      if (word.length > 4 && !this.isStopWord(word)) {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1)
      }
    })
    
    const vocabulary = Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50)
      .map(([word]) => word)

    // Extract common phrases (simplified)
    const phrases = this.extractCommonPhrases(sentences)
    
    // Identify phrases to avoid (negative or problematic language)
    const avoidPhrases = this.identifyAvoidPhrases(content)

    // Analyze formatting preferences
    const formatting = {
      useHeadings: content.includes('#') || content.includes('##'),
      useBulletPoints: content.includes('•') || content.includes('-') || content.includes('*'),
      useBold: content.includes('**') || content.includes('__'),
      useItalics: content.includes('*') || content.includes('_'),
      maxLength: Math.max(...sentences.map(s => s.length))
    }

    // Default compliance settings
    const compliance = {
      requiresLegalReview: false,
      restrictedTopics: [],
      requiredDisclaimers: [],
      piiDetection: true
    }

    return {
      tone,
      style,
      vocabulary,
      phrases,
      avoidPhrases,
      formatting,
      compliance
    }
  }

  /**
   * Check if word is a stop word
   */
  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
      'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
      'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
      'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their',
      'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go',
      'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know',
      'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them',
      'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over',
      'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work',
      'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these',
      'give', 'day', 'most', 'us', 'is', 'was', 'are', 'been', 'has', 'had',
      'were', 'said', 'did', 'get', 'may', 'am'
    ])
    return stopWords.has(word.toLowerCase())
  }

  /**
   * Extract common phrases from sentences
   */
  private extractCommonPhrases(sentences: string[]): string[] {
    const phrases = new Map<string, number>()
    
    sentences.forEach(sentence => {
      const words = sentence.toLowerCase().split(/\s+/)
      for (let i = 0; i < words.length - 2; i++) {
        const phrase = words.slice(i, i + 3).join(' ')
        if (phrase.length > 10 && !this.isStopWord(phrase.split(' ')[0])) {
          phrases.set(phrase, (phrases.get(phrase) || 0) + 1)
        }
      }
    })

    return Array.from(phrases.entries())
      .filter(([_, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([phrase]) => phrase)
  }

  /**
   * Identify phrases to avoid
   */
  private identifyAvoidPhrases(content: string): string[] {
    const problematicPatterns = [
      /\b(guarantee|promise|always|never|everyone|nobody)\b/gi,
      /\b(obviously|clearly|basically|actually|literally)\b/gi,
      /\b(very|really|quite|rather|somewhat|rather)\s+\w+/gi,
      /\b(best|worst|perfect|awful|terrible|amazing)\b/gi
    ]

    const avoidPhrases: string[] = []
    
    problematicPatterns.forEach(pattern => {
      const matches = content.match(pattern)
      if (matches) {
        avoidPhrases.push(...matches.map(m => m.toLowerCase()))
      }
    })

    return [...new Set(avoidPhrases)]
  }

  /**
   * Get brand voice by ID
   */
  getBrandVoice(id: string): BrandVoice | undefined {
    return this.brandVoices.get(id)
  }

  /**
   * Get all brand voices for tenant
   */
  getBrandVoicesForTenant(tenantId: string): BrandVoice[] {
    return Array.from(this.brandVoices.values())
      .filter(voice => voice.tenantId === tenantId && voice.isActive)
  }

  /**
   * Update brand voice
   */
  updateBrandVoice(id: string, updates: Partial<BrandVoice>): BrandVoice {
    const existing = this.brandVoices.get(id)
    if (!existing) {
      throw new Error('Brand voice not found')
    }

    const updated: BrandVoice = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    }

    this.brandVoices.set(id, updated)
    return updated
  }

  /**
   * Generate brand voice prompt for AI
   */
  generateBrandPrompt(brandVoice: BrandVoice, contentType: ContentType): string {
    const promptSections = [
      `Brand Voice: ${brandVoice.name}`,
      brandVoice.description ? `Description: ${brandVoice.description}` : '',
      `Tone: ${brandVoice.tone}`,
      `Style: ${brandVoice.style}`,
      brandVoice.vocabulary.length > 0 ? `Key vocabulary: ${brandVoice.vocabulary.slice(0, 10).join(', ')}` : '',
      brandVoice.phrases.length > 0 ? `Common phrases: ${brandVoice.phrases.slice(0, 5).join(', ')}` : '',
      brandVoice.avoidPhrases.length > 0 ? `Avoid: ${brandVoice.avoidPhrases.slice(0, 5).join(', ')}` : '',
      `Content type: ${contentType}`,
      `Formatting: ${brandVoice.formatting.useHeadings ? 'Use headings' : 'No headings'}, ${brandVoice.formatting.useBulletPoints ? 'use bullet points' : 'no bullet points'}`
    ].filter(Boolean)

    return promptSections.join('\n')
  }
}

// ============================================================================
// Brand Voice Templates
// ============================================================================

export const BRAND_VOICE_TEMPLATES = {
  professional: {
    tone: 'professional' as const,
    style: 'detailed' as const,
    vocabulary: ['furthermore', 'moreover', 'consequently', 'therefore', 'however'],
    phrases: ['in accordance with', 'it is important to note', 'please be advised'],
    avoidPhrases: ['awesome', 'cool', 'stuff', 'things'],
    formatting: {
      useHeadings: true,
      useBulletPoints: true,
      useBold: true,
      useItalics: false
    }
  },
  
  casual: {
    tone: 'casual' as const,
    style: 'conversational' as const,
    vocabulary: ['awesome', 'great', 'fantastic', 'excellent', 'wonderful'],
    phrases: ['feel free to', 'no worries', 'let me know'],
    avoidPhrases: ['furthermore', 'moreover', 'consequently'],
    formatting: {
      useHeadings: false,
      useBulletPoints: true,
      useBold: true,
      useItalics: true
    }
  },
  
  friendly: {
    tone: 'friendly' as const,
    style: 'conversational' as const,
    vocabulary: ['welcome', 'help', 'support', 'happy', 'glad'],
    phrases: ['here to help', 'we\'re excited', 'thank you for'],
    avoidPhrases: ['unfortunately', 'regrettably', 'failure'],
    formatting: {
      useHeadings: true,
      useBulletPoints: true,
      useBold: true,
      useItalics: true
    }
  }
}

// ============================================================================
// Content Analysis Utilities
// ============================================================================

export class ContentAnalyzer {
  /**
   * Analyze content alignment with brand voice
   */
  analyzeBrandAlignment(content: string, brandVoice: BrandVoice): {
    score: number
    feedback: string[]
    suggestions: string[]
  } {
    const feedback: string[] = []
    const suggestions: string[] = []
    let score = 100

    // Check tone alignment
    if (!this.matchesTone(content, brandVoice.tone)) {
      score -= 20
      feedback.push(`Content tone doesn't match expected ${brandVoice.tone} tone`)
      suggestions.push(`Adjust language to be more ${brandVoice.tone}`)
    }

    // Check vocabulary usage
    const vocabMatches = this.checkVocabulary(content, brandVoice.vocabulary)
    if (vocabMatches.length < brandVoice.vocabulary.length * 0.3) {
      score -= 15
      feedback.push('Limited use of brand vocabulary')
      suggestions.push('Incorporate more brand-specific terminology')
    }

    // Check for avoided phrases
    const avoidMatches = this.checkAvoidedPhrases(content, brandVoice.avoidPhrases)
    if (avoidMatches.length > 0) {
      score -= 25
      feedback.push(`Contains avoided phrases: ${avoidMatches.join(', ')}`)
      suggestions.push('Remove or replace avoided phrases')
    }

    // Check formatting
    const formattingScore = this.checkFormatting(content, brandVoice.formatting)
    score -= (100 - formattingScore) * 0.2
    if (formattingScore < 80) {
      feedback.push('Formatting doesn\'t match brand guidelines')
      suggestions.push('Adjust formatting to match brand style')
    }

    return {
      score: Math.max(0, score),
      feedback,
      suggestions
    }
  }

  private matchesTone(content: string, expectedTone: BrandVoice['tone']): boolean {
    const toneIndicators = {
      professional: ['furthermore', 'moreover', 'consequently', 'therefore'],
      casual: ['awesome', 'cool', 'stuff', 'things'],
      friendly: ['help', 'support', 'welcome', 'happy'],
      formal: ['hereby', 'thus', 'henceforth', 'whereas'],
      authoritative: ['definitely', 'certainly', 'undoubtedly', 'clearly'],
      playful: ['fun', 'exciting', 'awesome', 'amazing']
    }

    const indicators = toneIndicators[expectedTone] || []
    const contentLower = content.toLowerCase()
    
    return indicators.some(indicator => contentLower.includes(indicator))
  }

  private checkVocabulary(content: string, vocabulary: string[]): string[] {
    const contentLower = content.toLowerCase()
    return vocabulary.filter(word => contentLower.includes(word.toLowerCase()))
  }

  private checkAvoidedPhrases(content: string, avoidPhrases: string[]): string[] {
    const contentLower = content.toLowerCase()
    return avoidPhrases.filter(phrase => contentLower.includes(phrase.toLowerCase()))
  }

  private checkFormatting(content: string, formatting: BrandVoice['formatting']): number {
    let score = 100

    if (formatting.useHeadings && !content.includes('#')) {
      score -= 25
    }
    if (!formatting.useHeadings && content.includes('#')) {
      score -= 25
    }

    if (formatting.useBulletPoints && !content.match(/[•\-\*]/)) {
      score -= 25
    }
    if (!formatting.useBulletPoints && content.match(/[•\-\*]/)) {
      score -= 25
    }

    if (formatting.useBold && !content.match(/\*\*|__/)) {
      score -= 25
    }
    if (!formatting.useBold && content.match(/\*\*|__/)) {
      score -= 25
    }

    return Math.max(0, score)
  }
}
