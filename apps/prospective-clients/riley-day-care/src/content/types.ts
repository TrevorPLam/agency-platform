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
 * Program interface (for day care programs)
 */
export interface Program extends BaseContent {
  type: 'program'
  ageGroup: string
  schedule: string
  duration: string
  capacity: number
  features: Array<{
    title: string
    description: string
  }>
  pricing?: {
    model: string
    startingAt: string
    notes?: string
  }
}

export type Content = BlogPost | Program
