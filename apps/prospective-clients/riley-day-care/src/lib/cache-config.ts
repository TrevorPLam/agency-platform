/**
 * Cache configuration for Riley Day Care
 * 
 * Standardized ISR revalidation windows for content pages.
 * Aligns with agency platform caching strategy.
 */

export const CACHE_CONFIG = {
  /** Content pages - revalidate every hour */
  REVALIDATE_CONTENT: 3600,
  
  /** Static pages - revalidate daily */
  REVALIDATE_STATIC: 86400,
  
  /** API routes - revalidate every 5 minutes */
  REVALIDATE_API: 300,
} as const

/** Revalidation time for content pages (blog, programs, etc.) */
export const REVALIDATE_CONTENT = CACHE_CONFIG.REVALIDATE_CONTENT

/** Revalidation time for static pages */
export const REVALIDATE_STATIC = CACHE_CONFIG.REVALIDATE_STATIC

/** Revalidation time for API routes */
export const REVALIDATE_API = CACHE_CONFIG.REVALIDATE_API
