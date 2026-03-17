import { Redis } from 'ioredis'
import type { NextRequest } from 'next/server'

export interface RateLimitConfig {
  /** Number of requests allowed in the window */
  limit: number
  /** Time window in seconds */
  window: number
  /** Key prefix for Redis storage */
  keyPrefix?: string
}

export interface RateLimitResult {
  /** Whether the request is allowed */
  success: boolean
  /** Total requests allowed in the window */
  limit: number
  /** Remaining requests in the window */
  remaining: number
  /** When the window resets (Unix timestamp in seconds) */
  resetTime: number
  /** Time in seconds until the request can be retried */
  retryAfter?: number
}

export interface RateLimitContext {
  /** Tenant ID for multi-tenant isolation */
  tenantId?: string
  /** Client IP address */
  ip: string
  /** Whether this is an authenticated request */
  authenticated?: boolean
  /** Whether this is a service operation (bypasses limits) */
  isService?: boolean
}

/**
 * Sliding window rate limiter using Redis
 * 
 * This implementation uses the sliding window counter algorithm which provides:
 * - Better accuracy than fixed window (no boundary bursts)
 * - Better memory efficiency than sliding window log
 * - Single Redis round trip per request
 * 
 * Based on Redis best practices: https://redis.io/learn/howtos/ratelimiting
 */
export class RateLimiter {
  private redis: Redis | null = null
  private config: RateLimitConfig
  private keyPrefix: string

  constructor(config: RateLimitConfig, redisUrl?: string) {
    this.config = config
    this.keyPrefix = config.keyPrefix || 'rate-limit'
    
    // Initialize Redis if URL provided, otherwise use in-memory fallback
    if (redisUrl && redisUrl !== 'memory') {
      this.redis = new Redis(redisUrl, {
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      })
    }
  }

  /**
   * Check if a request is allowed based on rate limits
   */
  async check(context: RateLimitContext): Promise<RateLimitResult> {
    // Service operations bypass rate limits
    if (context.isService) {
      return {
        success: true,
        limit: Infinity,
        remaining: Infinity,
        resetTime: Math.floor(Date.now() / 1000) + this.config.window,
      }
    }

    const key = this.getKey(context)
    const now = Math.floor(Date.now() / 1000)
    const windowStart = now - this.config.window

    if (this.redis) {
      return this.checkRedis(key, windowStart, now)
    } else {
      return this.checkMemory(key, windowStart, now)
    }
  }

  /**
   * Get Redis key for rate limiting with tenant isolation
   */
  private getKey(context: RateLimitContext): string {
    const parts = [this.keyPrefix]
    
    // Add tenant context for multi-tenant isolation
    if (context.tenantId) {
      parts.push(`tenant:${context.tenantId}`)
    }
    
    // Add IP address for client identification
    parts.push(`ip:${context.ip}`)
    
    // Add authentication context for different limits
    if (context.authenticated) {
      parts.push('auth')
    } else {
      parts.push('anon')
    }
    
    return parts.join(':')
  }

  /**
   * Redis-based sliding window implementation
   */
  private async checkRedis(
    key: string,
    windowStart: number,
    now: number
  ): Promise<RateLimitResult> {
    try {
      // Sliding window counter algorithm using Lua script
      // This ensures atomicity and prevents race conditions
      const luaScript = `
        local key = KEYS[1]
        local window_start = tonumber(ARGV[1])
        local current_time = tonumber(ARGV[2])
        local window_size = tonumber(ARGV[3])
        local limit = tonumber(ARGV[4])
        
        -- Remove expired entries from the current window
        redis.call('ZREMRANGEBYSCORE', key, 0, window_start)
        
        -- Count requests in current window
        local current = redis.call('ZCARD', key)
        
        -- Check if limit exceeded
        if current >= limit then
          -- Get oldest request timestamp for retry-after calculation
          local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
          local retry_after = 0
          if #oldest > 0 then
            retry_after = tonumber(oldest[2]) + window_size - current_time
            if retry_after < 0 then
              retry_after = 0
            end
          end
          
          return {0, limit, 0, current_time, retry_after}
        end
        
        -- Add current request to window
        local unique_id = current_time .. ':' .. math.random()
        redis.call('ZADD', key, current_time, unique_id)
        redis.call('EXPIRE', key, window_size)
        
        local remaining = limit - current - 1
        
        return {1, limit, remaining, current_time, 0}
      `

      const result = await this.redis.eval(
        luaScript,
        1,
        key,
        windowStart.toString(),
        now.toString(),
        this.config.window.toString(),
        this.config.limit.toString()
      )

      // Parse Redis result
      const values = result as [number, number, number, number, number]
      const [success, limit, remaining, resetTime, retryAfter] = values

      return {
        success: success === 1,
        limit,
        remaining,
        resetTime,
        retryAfter: retryAfter > 0 ? retryAfter : undefined,
      }
    } catch (error) {
      // Fail open - allow request if Redis is unavailable
      console.error('Rate limiter Redis error:', error)
      return {
        success: true,
        limit: this.config.limit,
        remaining: this.config.limit,
        resetTime: now + this.config.window,
      }
    }
  }

  /**
   * In-memory fallback implementation (for development/testing)
   */
  private checkMemory(
    key: string,
    windowStart: number,
    now: number
  ): RateLimitResult {
    // Simple in-memory store (not production-ready for distributed systems)
    if (!global._rateLimitStore) {
      global._rateLimitStore = new Map()
    }
    const store = global._rateLimitStore as Map<string, number[]>

    // Get existing requests for this key
    let requests = store.get(key) || []
    
    // Remove expired requests
    requests = requests.filter(timestamp => timestamp > windowStart)
    
    // Check limit
    const success = requests.length < this.config.limit
    
    if (success) {
      // Add current request
      requests.push(now)
      store.set(key, requests)
    }

    return {
      success,
      limit: this.config.limit,
      remaining: Math.max(0, this.config.limit - requests.length),
      resetTime: now + this.config.window,
      retryAfter: success ? undefined : Math.max(0, requests[0] - windowStart),
    }
  }

  /**
   * Close Redis connection
   */
  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit()
      this.redis = null
    }
  }
}

/**
 * Pre-configured rate limiters for different use cases
 */
export const RateLimitPresets = {
  /** General API rate limit (100 requests/hour) */
  general: new RateLimiter({
    limit: 100,
    window: 3600, // 1 hour
    keyPrefix: 'api-general',
  }, process.env.REDIS_URL || 'memory'),

  /** Authenticated API rate limit (1000 requests/hour) */
  authenticated: new RateLimiter({
    limit: 1000,
    window: 3600, // 1 hour
    keyPrefix: 'api-auth',
  }, process.env.REDIS_URL || 'memory'),

  /** Strict rate limit for sensitive endpoints (10 requests/minute) */
  strict: new RateLimiter({
    limit: 10,
    window: 60, // 1 minute
    keyPrefix: 'api-strict',
  }, process.env.REDIS_URL || 'memory'),
}

/**
 * Extract client IP from Next.js request
 */
export function getClientIP(request: NextRequest): string {
  // Try various headers for real IP
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip') // Cloudflare
  
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP.trim()
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP.trim()
  }
  
  // Fallback to request IP
  return request.ip || '127.0.0.1'
}

/**
 * Add rate limit headers to Next.js response
 */
export function addRateLimitHeaders(
  response: Response,
  result: RateLimitResult
): void {
  response.headers.set('X-RateLimit-Limit', result.limit.toString())
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
  response.headers.set('X-RateLimit-Reset', result.resetTime.toString())
  
  if (result.retryAfter) {
    response.headers.set('Retry-After', result.retryAfter.toString())
  }
}

/**
 * Middleware helper function for rate limiting
 */
export async function applyRateLimit(
  request: NextRequest,
  context: RateLimitContext,
  limiter: RateLimiter = RateLimitPresets.general
): Promise<{ allowed: boolean; result: RateLimitResult }> {
  const result = await limiter.check(context)
  
  return {
    allowed: result.success,
    result,
  }
}

// Type declaration for global store
declare global {
  var _rateLimitStore: Map<string, number[]> | undefined
}
