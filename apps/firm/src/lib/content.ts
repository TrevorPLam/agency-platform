/**
 * Content Management Utilities for Firm App
 *
 * This provides a bridge between the new content system and the existing
 * hardcoded blog implementation, allowing for gradual migration.
 */

import 'server-only'

import { initializeContentRepository, type BlogPost } from '@agency/content'

// Initialize the content repository with default content
const contentRepository = initializeContentRepository()

/**
 * Get all blog posts
 */
export async function getAllBlogPosts(): Promise<BlogPost[]> {
  const allContent = await contentRepository.getAll()
  return allContent.filter((content) => content.type === 'blog') as BlogPost[]
}

/**
 * Get blog post by slug
 */
export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const content = await contentRepository.getBySlug(slug)
  return content?.type === 'blog' ? content : null
}

/**
 * Get featured blog posts
 */
export async function getFeaturedBlogPosts(): Promise<BlogPost[]> {
  const allPosts = await getAllBlogPosts()
  return allPosts.filter((post) => post.featured)
}

/**
 * Search blog posts
 */
export async function searchBlogPosts(query: string): Promise<BlogPost[]> {
  const results = await contentRepository.search(query)
  return results.filter((content) => content.type === 'blog') as BlogPost[]
}

/**
 * Legacy compatibility function - converts new format to old format
 * This allows existing components to work without changes
 */
export async function getLegacyBlogPosts() {
  const posts = await getAllBlogPosts()
  return posts.map((post) => ({
    slug: post.slug,
    title: post.title,
    date: post.publishedAt,
    excerpt: post.description,
    content: post.content,
  }))
}

/**
 * Get legacy blog post by slug for existing components
 */
export async function getLegacyBlogPost(slug: string) {
  const post = await getBlogPostBySlug(slug)
  if (!post) return null

  return {
    title: post.title,
    date: post.publishedAt,
    content: post.content,
  }
}
