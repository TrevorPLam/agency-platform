/**
 * Content Management System - Enhanced Interim Solution
 * 
 * This file provides a structured approach to content management
 * that bridges the gap between hardcoded content and a full CMS.
 * 
 * Features:
 * - Type-safe content definitions
 * - Content validation
 * - SEO metadata generation
 * - Content versioning
 * - Markdown support for rich content
 */

import { z } from 'zod'

// ============================================================================
// CONTENT SCHEMAS
// ============================================================================

/**
 * Base content schema with common fields
 */
export const BaseContentSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  publishedAt: z.string(),
  updatedAt: z.string(),
  author: z.string(),
  tags: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
  seo: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    ogImage: z.string().optional(),
  }).optional(),
})

/**
 * Blog post specific schema
 */
export const BlogPostSchema = BaseContentSchema.extend({
  type: z.literal('blog'),
  content: z.string(), // Markdown content
  readingTime: z.number().optional(),
  category: z.string().optional(),
})

/**
 * Case study specific schema
 */
export const CaseStudySchema = BaseContentSchema.extend({
  type: z.literal('case-study'),
  client: z.string(),
  industry: z.string(),
  services: z.array(z.string()),
  duration: z.string(),
  challenge: z.string(),
  solution: z.string(),
  results: z.string(),
  metrics: z.array(z.object({
    label: z.string(),
    value: z.string(),
  })).optional(),
})

/**
 * Service page specific schema
 */
export const ServicePageSchema = BaseContentSchema.extend({
  type: z.literal('service'),
  description: z.string(),
  features: z.array(z.object({
    title: z.string(),
    description: z.string(),
    icon: z.string().optional(),
  })),
  pricing: z.object({
    model: z.string(),
    startingAt: z.string(),
    notes: z.string().optional(),
  }).optional(),
  process: z.array(z.object({
    step: z.number(),
    title: z.string(),
    description: z.string(),
  })).optional(),
})

// ============================================================================
// CONTENT TYPES
// ============================================================================

export type BaseContent = z.infer<typeof BaseContentSchema>
export type BlogPost = z.infer<typeof BlogPostSchema>
export type CaseStudy = z.infer<typeof CaseStudySchema>
export type ServicePage = z.infer<typeof ServicePageSchema>

export type Content = BlogPost | CaseStudy | ServicePage

// ============================================================================
// CONTENT VALIDATION
// ============================================================================

/**
 * Validates content against its schema
 */
export function validateContent(content: unknown, type: Content['type']): Content {
  switch (type) {
    case 'blog':
      return BlogPostSchema.parse(content)
    case 'case-study':
      return CaseStudySchema.parse(content)
    case 'service':
      return ServicePageSchema.parse(content)
    default:
      throw new Error(`Unknown content type: ${type}`)
  }
}

/**
 * Validates an array of content items
 */
export function validateContentArray(contents: unknown[]): Content[] {
  return contents.map(content => {
    const typedContent = content as Content
    return validateContent(content, typedContent.type)
  })
}

// ============================================================================
// CONTENT UTILITIES
// ============================================================================

/**
 * Generates SEO metadata from content
 */
export function generateSEOMetadata(content: BaseContent) {
  return {
    title: content.seo?.title || content.title,
    description: content.seo?.description || content.description,
    keywords: content.seo?.keywords || content.tags,
    ogImage: content.seo?.ogImage,
    author: content.author,
    publishedAt: content.publishedAt,
    updatedAt: content.updatedAt,
  }
}

/**
 * Generates URL-safe slug from title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

/**
 * Calculates estimated reading time in minutes
 */
export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200
  const words = content.split(/\s+/).length
  return Math.ceil(words / wordsPerMinute)
}

/**
 * Formats date for display
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// ============================================================================
// CONTENT REPOSITORY
// ============================================================================

/**
 * Content repository interface
 */
export interface ContentRepository {
  getAll(): Promise<Content[]>
  getBySlug(slug: string): Promise<Content | null>
  getByType(type: Content['type']): Promise<Content[]>
  search(query: string): Promise<Content[]>
  create(content: Omit<Content, 'id' | 'publishedAt' | 'updatedAt'>): Promise<Content>
  update(id: string, content: Partial<Content>): Promise<Content>
  delete(id: string): Promise<void>
}

/**
 * File-based content repository (for interim solution)
 */
export class FileContentRepository implements ContentRepository {
  private content: Content[] = []

  constructor(initialContent: Content[] = []) {
    this.content = validateContentArray(initialContent)
  }

  async getAll(): Promise<Content[]> {
    return [...this.content]
  }

  async getBySlug(slug: string): Promise<Content | null> {
    return this.content.find(item => item.slug === slug) || null
  }

  async getByType(type: Content['type']): Promise<Content[]> {
    return this.content.filter(item => item.type === type)
  }

  async search(query: string): Promise<Content[]> {
    const lowercaseQuery = query.toLowerCase()
    return this.content.filter(item =>
      item.title.toLowerCase().includes(lowercaseQuery) ||
      item.description.toLowerCase().includes(lowercaseQuery) ||
      item.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    )
  }

  async create(content: Omit<Content, 'id' | 'publishedAt' | 'updatedAt'>): Promise<Content> {
    const now = new Date().toISOString()
    const newContent: Content = {
      ...content,
      id: crypto.randomUUID(),
      slug: content.slug || generateSlug(content.title),
      publishedAt: now,
      updatedAt: now,
    }

    const validatedContent = validateContent(newContent, content.type)
    this.content.push(validatedContent)
    return validatedContent
  }

  async update(id: string, updates: Partial<Content>): Promise<Content> {
    const index = this.content.findIndex(item => item.id === id)
    if (index === -1) {
      throw new Error(`Content with id ${id} not found`)
    }

    const existingContent = this.content[index]
    const updatedContent = {
      ...existingContent,
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    const validatedContent = validateContent(updatedContent, existingContent.type)
    this.content[index] = validatedContent
    return validatedContent
  }

  async delete(id: string): Promise<void> {
    const index = this.content.findIndex(item => item.id === id)
    if (index === -1) {
      throw new Error(`Content with id ${id} not found`)
    }
    this.content.splice(index, 1)
  }
}

// ============================================================================
// CONTENT MIGRATION UTILITIES
// ============================================================================

/**
 * Migrates hardcoded blog content to structured format
 */
export function migrateBlogContent(hardcodedPosts: any[]): BlogPost[] {
  return hardcodedPosts.map((post, index) => ({
    id: `blog-${index + 1}`,
    type: 'blog' as const,
    slug: post.slug || generateSlug(post.title),
    title: post.title,
    description: post.excerpt || post.content?.slice(0, 160) || '',
    publishedAt: post.date || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    author: 'Agency Team',
    content: post.content || '',
    readingTime: calculateReadingTime(post.content || ''),
    tags: post.tags || [],
    featured: post.featured || false,
  }))
}

/**
 * Exports content to JSON for backup/migration
 */
export function exportContent(content: Content[]): string {
  return JSON.stringify(content, null, 2)
}

/**
 * Imports content from JSON
 */
export function importContent(jsonContent: string): Content[] {
  try {
    const parsed = JSON.parse(jsonContent)
    return validateContentArray(parsed)
  } catch (error) {
    throw new Error(`Failed to import content: ${error}`)
  }
}

// ============================================================================
// DEFAULT CONTENT
// ============================================================================

/**
 * Default blog content for migration
 */
export const DEFAULT_BLOG_CONTENT: BlogPost[] = [
  {
    id: 'blog-1',
    type: 'blog',
    slug: 'getting-started-with-digital-marketing',
    title: 'Getting Started with Digital Marketing',
    description: 'A practical guide for small businesses taking their first steps online.',
    publishedAt: '2025-03-01T00:00:00.000Z',
    updatedAt: '2025-03-01T00:00:00.000Z',
    author: 'Agency Team',
    content: `# Getting Started with Digital Marketing

Taking your first steps in digital marketing can feel overwhelming. Start with a clear goal, know your audience, and focus on one or two channels before expanding. We help businesses build strategy and execution that scales.

## Key Steps

1. **Define Your Goals** - What do you want to achieve?
2. **Know Your Audience** - Who are you trying to reach?
3. **Choose Your Channels** - Where does your audience spend time?
4. **Create Content** - Provide value to your audience
5. **Measure and Optimize** - Track results and improve

## Getting Help

Our team specializes in helping businesses navigate the digital landscape with confidence.`,
    readingTime: 2,
    tags: ['digital-marketing', 'strategy', 'small-business'],
    featured: true,
  },
  {
    id: 'blog-2',
    type: 'blog',
    slug: 'design-tips-that-convert',
    title: 'Design Tips That Convert',
    description: 'How to use design to build trust and drive action.',
    publishedAt: '2025-02-15T00:00:00.000Z',
    updatedAt: '2025-02-15T00:00:00.000Z',
    author: 'Agency Team',
    content: `# Design Tips That Convert

Good design builds trust and guides users toward action. Use clear hierarchy, consistent branding, and simple calls-to-action. Test and iterate based on data to improve conversion over time.

## Conversion-Focused Design Principles

### Visual Hierarchy
Guide users' attention to the most important elements using size, color, and placement.

### Clear Call-to-Action
Make it obvious what you want users to do next. Use contrasting colors and action-oriented language.

### Trust Signals
Include testimonials, certifications, and social proof to build credibility.

### Mobile-First Design
Ensure your design works perfectly on mobile devices, as that's where most users will interact with it.`,
    readingTime: 3,
    tags: ['design', 'conversion', 'ux'],
    featured: false,
  },
]

/**
 * Initialize repository with default content
 */
export function initializeContentRepository(): FileContentRepository {
  return new FileContentRepository(DEFAULT_BLOG_CONTENT)
}
