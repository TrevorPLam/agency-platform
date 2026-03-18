import { cacheLife, cacheTag } from 'next/cache'
import { type BlogPost } from './types'

/**
 * Firm app blog content - typed and validated
 *
 * This replaces inline hardcoded blog data with type-safe content
 * that can be validated at build time and used across multiple components.
 */
export const posts: BlogPost[] = [
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
    seo: {
      title: 'Getting Started with Digital Marketing | Agency',
      description:
        'A practical guide for small businesses taking their first steps in digital marketing.',
      keywords: ['digital marketing', 'small business', 'marketing strategy'],
    },
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
    seo: {
      title: 'Design Tips That Convert | Agency',
      description: 'How to use design to build trust and drive action on your website.',
      keywords: ['design', 'conversion', 'UX design', 'web design'],
    },
  },
] // Runtime validation will be added later once Zod issues are resolved

/**
 * Get all blog posts
 */
export async function getAllPosts(): Promise<BlogPost[]> {
  'use cache'
  cacheLife({ stale: 300, revalidate: 3600, expire: 86400 })
  cacheTag('blog')
  return posts
}

/**
 * Get a single blog post by slug
 */
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  'use cache'
  cacheLife({ stale: 300, revalidate: 3600, expire: 86400 })
  cacheTag('blog', `blog:${slug}`)
  return posts.find((post) => post.slug === slug) ?? null
}

/**
 * Get featured blog posts
 */
export function getFeaturedPosts(): BlogPost[] {
  return posts.filter((post) => post.featured)
}

/**
 * Get blog posts by tag
 */
export function getPostsByTag(tag: string): BlogPost[] {
  return posts.filter((post) => post.tags && post.tags.indexOf(tag) !== -1)
}

/**
 * Get all unique tags from blog posts
 */
export function getAllTags(): string[] {
  const allTags = posts.reduce((tags, post) => {
    if (post.tags) {
      tags.push(...post.tags)
    }
    return tags
  }, [] as string[])

  // Remove duplicates manually and convert back to array
  const uniqueTags = allTags.reduce((unique, tag) => {
    if (unique.indexOf(tag) === -1) {
      unique.push(tag)
    }
    return unique
  }, [] as string[])

  return uniqueTags.sort()
}
