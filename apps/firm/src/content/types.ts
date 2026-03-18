// ============================================================================
// CONTENT TYPES
// ============================================================================

/**
 * Base content interface with common fields
 */
export interface BaseContent {
  id: string
  slug: string
  title: string
  description: string
  publishedAt: string
  updatedAt: string
  author: string
  tags?: string[]
  featured?: boolean
  seo?: {
    title?: string
    description?: string
    keywords?: string[]
    ogImage?: string
  }
}

/**
 * Blog post interface
 */
export interface BlogPost extends BaseContent {
  type: 'blog'
  content: string // Markdown content
  readingTime?: number
  category?: string
}

/**
 * Service page interface
 */
export interface ServicePage extends BaseContent {
  type: 'service'
  features: Array<{
    title: string
    description: string
    icon?: string
  }>
  pricing?: {
    model: string
    startingAt: string
    notes?: string
  }
  process?: Array<{
    step: number
    title: string
    description: string
  }>
}

export type Content = BlogPost | ServicePage
