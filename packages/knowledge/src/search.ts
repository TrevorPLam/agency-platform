/**
 * AI-Powered Search System
 * 
 * This module implements intelligent search with citations, recommendations,
 * and semantic understanding for the knowledge management system.
 */

import { z } from 'zod'
import {
  SearchQuery,
  SearchResult,
  SearchResponse,
  KnowledgeCapture,
  KnowledgeCategory,
  ExpertiseLevel,
  KnowledgeSource,
  CategoryStats
} from './types'

// Validation schemas
const SearchQuerySchema = z.object({
  query: z.string().min(1).max(500),
  category: z.enum([
    'architecture', 'security', 'performance', 'testing', 'deployment',
    'monitoring', 'governance', 'best-practices', 'troubleshooting', 'onboarding'
  ]).optional(),
  expertise: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
  source: z.enum(['commit', 'pr', 'discussion', 'meeting', 'documentation', 'code', 'issue']).optional(),
  author: z.string().optional(),
  dateRange: z.object({
    start: z.string(),
    end: z.string()
  }).optional(),
  tags: z.array(z.string()).optional(),
  sortBy: z.enum(['relevance', 'date', 'quality', 'author']).default('relevance'),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0)
})

export class KnowledgeSearchEngine {
  private knowledgeBase: KnowledgeCapture[]
  private index: SearchIndex

  constructor(knowledgeBase: KnowledgeCapture[] = []) {
    this.knowledgeBase = knowledgeBase
    this.index = this.buildSearchIndex(knowledgeBase)
  }

  /**
   * Search knowledge base with intelligent ranking
   */
  async search(query: SearchQuery): Promise<SearchResponse> {
    const startTime = Date.now()
    
    try {
      const validatedQuery = SearchQuerySchema.parse(query)
      const filteredKnowledge = this.filterKnowledge(validatedQuery)
      const rankedResults = this.rankResults(filteredKnowledge, validatedQuery)
      const paginatedResults = this.paginateResults(rankedResults, validatedQuery)
      
      const searchResults = paginatedResults.map(item => 
        this.createSearchResult(item, validatedQuery)
      )

      const response: SearchResponse = {
        results: searchResults,
        total: rankedResults.length,
        query: validatedQuery,
        suggestions: this.generateSuggestions(validatedQuery.query),
        categories: this.calculateCategoryStats(rankedResults),
        took: Date.now() - startTime
      }

      return response
    } catch (error) {
      console.error('Search error:', error)
      return this.createEmptyResponse(query, Date.now() - startTime)
    }
  }

  /**
   * Get personalized recommendations for a user
   */
  async getRecommendations(
    userId: string,
    categories?: KnowledgeCategory[],
    expertise?: ExpertiseLevel,
    limit: number = 10
  ): Promise<SearchResult[]> {
    // Filter based on user preferences and exclude their own contributions
    const recommendations = this.knowledgeBase
      .filter(item => item.authorEmail !== userId)
      .filter(item => !categories || categories.includes(item.category))
      .filter(item => !expertise || item.expertise === expertise)
      .filter(item => item.quality.overall >= 80) // Only high-quality content
      .sort((a, b) => {
        // Sort by quality, recency, and relevance
        const scoreA = this.calculateRecommendationScore(a, categories, expertise)
        const scoreB = this.calculateRecommendationScore(b, categories, expertise)
        return scoreB - scoreA
      })
      .slice(0, limit)
      .map(item => this.createSearchResult(item, { query: '', sortBy: 'relevance' }))

    return recommendations
  }

  /**
   * Find similar knowledge items
   */
  async findSimilar(itemId: string, limit: number = 5): Promise<SearchResult[]> {
    const targetItem = this.knowledgeBase.find(item => item.id === itemId)
    if (!targetItem) {
      return []
    }

    const similarities = this.knowledgeBase
      .filter(item => item.id !== itemId)
      .map(item => ({
        item,
        similarity: this.calculateSimilarity(targetItem, item)
      }))
      .filter(({ similarity }) => similarity > 0.3) // Minimum similarity threshold
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(({ item }) => this.createSearchResult(item, { query: '', sortBy: 'relevance' }))

    return similarities
  }

  /**
   * Update knowledge base and rebuild index
   */
  updateKnowledgeBase(knowledgeBase: KnowledgeCapture[]): void {
    this.knowledgeBase = knowledgeBase
    this.index = this.buildSearchIndex(knowledgeBase)
  }

  /**
   * Build search index for efficient searching
   */
  private buildSearchIndex(knowledgeBase: KnowledgeCapture[]): SearchIndex {
    const index: SearchIndex = {
      byCategory: new Map(),
      byExpertise: new Map(),
      bySource: new Map(),
      byAuthor: new Map(),
      byTags: new Map(),
      textIndex: new Map()
    }

    for (const item of knowledgeBase) {
      // Index by category
      if (!index.byCategory.has(item.category)) {
        index.byCategory.set(item.category, [])
      }
      index.byCategory.get(item.category)!.push(item)

      // Index by expertise level
      if (!index.byExpertise.has(item.expertise)) {
        index.byExpertise.set(item.expertise, [])
      }
      index.byExpertise.get(item.expertise)!.push(item)

      // Index by source
      if (!index.bySource.has(item.source)) {
        index.bySource.set(item.source, [])
      }
      index.bySource.get(item.source)!.push(item)

      // Index by author
      if (!index.byAuthor.has(item.authorEmail)) {
        index.byAuthor.set(item.authorEmail, [])
      }
      index.byAuthor.get(item.authorEmail)!.push(item)

      // Index by tags
      for (const tag of item.tags) {
        if (!index.byTags.has(tag)) {
          index.byTags.set(tag, [])
        }
        index.byTags.get(tag)!.push(item)
      }

      // Build text index for full-text search
      const terms = this.extractTerms(item)
      for (const term of terms) {
        if (!index.textIndex.has(term)) {
          index.textIndex.set(term, [])
        }
        index.textIndex.get(term)!.push(item)
      }
    }

    return index
  }

  /**
   * Filter knowledge base based on query criteria
   */
  private filterKnowledge(query: SearchQuery): KnowledgeCapture[] {
    let filtered = [...this.knowledgeBase]

    // Filter by category
    if (query.category) {
      filtered = filtered.filter(item => item.category === query.category)
    }

    // Filter by expertise level
    if (query.expertise) {
      filtered = filtered.filter(item => item.expertise === query.expertise)
    }

    // Filter by source
    if (query.source) {
      filtered = filtered.filter(item => item.source === query.source)
    }

    // Filter by author
    if (query.author) {
      filtered = filtered.filter(item => 
        item.author.toLowerCase().includes(query.author!.toLowerCase()) ||
        item.authorEmail.toLowerCase().includes(query.author!.toLowerCase())
      )
    }

    // Filter by date range
    if (query.dateRange) {
      const startDate = new Date(query.dateRange.start)
      const endDate = new Date(query.dateRange.end)
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.timestamp)
        return itemDate >= startDate && itemDate <= endDate
      })
    }

    // Filter by tags
    if (query.tags && query.tags.length > 0) {
      filtered = filtered.filter(item => 
        query.tags!.some(tag => item.tags.includes(tag))
      )
    }

    return filtered
  }

  /**
   * Rank results based on relevance and query criteria
   */
  private rankResults(knowledge: KnowledgeCapture[], query: SearchQuery): KnowledgeCapture[] {
    return knowledge
      .map(item => ({
        item,
        score: this.calculateRelevanceScore(item, query)
      }))
      .sort((a, b) => b.score - a.score)
      .map(({ item }) => item)
  }

  /**
   * Calculate relevance score for a knowledge item
   */
  private calculateRelevanceScore(item: KnowledgeCapture, query: SearchQuery): number {
    let score = 0

    // Text matching score
    if (query.query) {
      const queryTerms = this.extractTerms({ 
        title: query.query, 
        content: query.query, 
        tags: [] 
      } as KnowledgeCapture)
      const itemTerms = this.extractTerms(item)
      
      const commonTerms = queryTerms.filter(term => itemTerms.includes(term))
      score += (commonTerms.length / Math.max(queryTerms.length, 1)) * 100
    }

    // Quality bonus
    score += item.quality.overall * 0.3

    // Recency bonus (newer content gets slight boost)
    const daysSinceCreation = (Date.now() - new Date(item.timestamp).getTime()) / (1000 * 60 * 60 * 24)
    const recencyBonus = Math.max(0, 10 - daysSinceCreation / 30) // Decay over 30 days
    score += recencyBonus

    // Category match bonus
    if (query.category && item.category === query.category) {
      score += 50
    }

    // Expertise match bonus
    if (query.expertise && item.expertise === query.expertise) {
      score += 30
    }

    // Source match bonus
    if (query.source && item.source === query.source) {
      score += 20
    }

    // Tag matches bonus
    if (query.tags && query.tags.length > 0) {
      const matchingTags = query.tags.filter(tag => item.tags.includes(tag))
      score += (matchingTags.length / query.tags.length) * 25
    }

    return score
  }

  /**
   * Paginate results
   */
  private paginateResults(results: KnowledgeCapture[], query: SearchQuery): KnowledgeCapture[] {
    const start = query.offset
    const end = start + query.limit
    return results.slice(start, end)
  }

  /**
   * Create search result with highlights
   */
  private createSearchResult(item: KnowledgeCapture, query: SearchQuery): SearchResult {
    const highlights = this.generateHighlights(item, query.query)
    const matchedTerms = this.getMatchedTerms(item, query.query)

    return {
      item,
      relevance: this.calculateRelevanceScore(item, query),
      highlights,
      matchedTerms
    }
  }

  /**
   * Generate highlights for search results
   */
  private generateHighlights(item: KnowledgeCapture, query: string): string[] {
    const highlights: string[] = []
    const queryTerms = query.toLowerCase().split(/\s+/)

    // Highlight title matches
    const titleLower = item.title.toLowerCase()
    for (const term of queryTerms) {
      if (titleLower.includes(term)) {
        const startIndex = titleLower.indexOf(term)
        const endIndex = Math.min(startIndex + term.length + 50, item.title.length)
        highlights.push(item.title.substring(startIndex, endIndex))
        break
      }
    }

    // Highlight content matches
    const contentLower = item.content.toLowerCase()
    for (const term of queryTerms) {
      if (contentLower.includes(term)) {
        const startIndex = contentLower.indexOf(term)
        const start = Math.max(0, startIndex - 20)
        const end = Math.min(startIndex + term.length + 50, item.content.length)
        highlights.push(item.content.substring(start, end))
        break
      }
    }

    return highlights.slice(0, 3) // Limit to 3 highlights
  }

  /**
   * Get matched terms for search results
   */
  private getMatchedTerms(item: KnowledgeCapture, query: string): string[] {
    const queryTerms = this.extractTerms({ 
      title: query, 
      content: query, 
      tags: [] 
    } as KnowledgeCapture)
    const itemTerms = this.extractTerms(item)
    
    return queryTerms.filter(term => itemTerms.includes(term))
  }

  /**
   * Extract searchable terms from knowledge item
   */
  private extractTerms(item: KnowledgeCapture): string[] {
    const terms = new Set<string>()

    // Extract from title
    const titleTerms = item.title.toLowerCase().split(/\s+/)
    titleTerms.forEach(term => {
      if (term.length > 2) {
        terms.add(term)
        terms.add(term.replace(/[^\w]/g, '')) // Remove punctuation
      }
    })

    // Extract from content
    const contentTerms = item.content.toLowerCase().split(/\s+/)
    contentTerms.forEach(term => {
      if (term.length > 2) {
        terms.add(term)
        terms.add(term.replace(/[^\w]/g, ''))
      }
    })

    // Add tags
    item.tags.forEach(tag => terms.add(tag.toLowerCase()))

    // Add category
    terms.add(item.category.toLowerCase())

    // Add source
    terms.add(item.source.toLowerCase())

    return Array.from(terms)
  }

  /**
   * Generate search suggestions
   */
  private generateSuggestions(query: string): string[] {
    const suggestions = new Set<string>()
    const queryLower = query.toLowerCase()

    // Find similar terms in the index
    for (const term of this.index.textIndex.keys()) {
      if (term.includes(queryLower) || queryLower.includes(term)) {
        suggestions.add(term)
      }
    }

    // Add category suggestions
    const categories: KnowledgeCategory[] = [
      'architecture', 'security', 'performance', 'testing', 'deployment',
      'monitoring', 'governance', 'best-practices', 'troubleshooting', 'onboarding'
    ]
    
    for (const category of categories) {
      if (category.includes(queryLower) || queryLower.includes(category)) {
        suggestions.add(category)
      }
    }

    return Array.from(suggestions).slice(0, 10)
  }

  /**
   * Calculate category statistics
   */
  private calculateCategoryStats(results: KnowledgeCapture[]): CategoryStats[] {
    const categoryMap = new Map<KnowledgeCategory, {
      count: number
      totalQuality: number
      contributors: Set<string>
    }>()

    for (const item of results) {
      const existing = categoryMap.get(item.category) || {
        count: 0,
        totalQuality: 0,
        contributors: new Set()
      }

      existing.count++
      existing.totalQuality += item.quality.overall
      existing.contributors.add(item.authorEmail)

      categoryMap.set(item.category, existing)
    }

    return Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      count: data.count,
      avgQuality: data.totalQuality / data.count,
      topContributors: Array.from(data.contributors).slice(0, 3)
    }))
  }

  /**
   * Calculate recommendation score
   */
  private calculateRecommendationScore(
    item: KnowledgeCapture,
    categories?: KnowledgeCategory[],
    expertise?: ExpertiseLevel
  ): number {
    let score = 0

    // Quality is the primary factor
    score += item.quality.overall

    // Category preference bonus
    if (categories && categories.includes(item.category)) {
      score += 20
    }

    // Expertise level preference bonus
    if (expertise && item.expertise === expertise) {
      score += 15
    }

    // Recency bonus
    const daysSinceCreation = (Date.now() - new Date(item.timestamp).getTime()) / (1000 * 60 * 60 * 24)
    const recencyBonus = Math.max(0, 20 - daysSinceCreation / 60) // Decay over 60 days
    score += recencyBonus

    // Citations bonus (more citations = more valuable)
    score += item.citations.length * 5

    return score
  }

  /**
   * Calculate similarity between two knowledge items
   */
  private calculateSimilarity(item1: KnowledgeCapture, item2: KnowledgeCapture): number {
    let similarity = 0

    // Category similarity
    if (item1.category === item2.category) {
      similarity += 0.3
    }

    // Expertise level similarity
    if (item1.expertise === item2.expertise) {
      similarity += 0.2
    }

    // Tag overlap
    const commonTags = item1.tags.filter(tag => item2.tags.includes(tag))
    similarity += (commonTags.length / Math.max(item1.tags.length, item2.tags.length)) * 0.3

    // Text similarity (simplified)
    const terms1 = this.extractTerms(item1)
    const terms2 = this.extractTerms(item2)
    const commonTerms = terms1.filter(term => terms2.includes(term))
    similarity += (commonTerms.length / Math.max(terms1.length, terms2.length)) * 0.2

    return similarity
  }

  /**
   * Create empty response for errors
   */
  private createEmptyResponse(query: SearchQuery, took: number): SearchResponse {
    return {
      results: [],
      total: 0,
      query,
      suggestions: [],
      categories: [],
      took
    }
  }
}

interface SearchIndex {
  byCategory: Map<KnowledgeCategory, KnowledgeCapture[]>
  byExpertise: Map<ExpertiseLevel, KnowledgeCapture[]>
  bySource: Map<KnowledgeSource, KnowledgeCapture[]>
  byAuthor: Map<string, KnowledgeCapture[]>
  byTags: Map<string, KnowledgeCapture[]>
  textIndex: Map<string, KnowledgeCapture[]>
}
