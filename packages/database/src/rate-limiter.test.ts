import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  RateLimiter,
  RateLimitPresets,
  getClientIP,
  addRateLimitHeaders,
  applyRateLimit,
  type RateLimitContext
} from './rate-limiter'
import type { NextRequest } from 'next/server'

// Mock Redis for testing
vi.mock('ioredis', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    default: vi.fn(),
    ...actual,
  }
})

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter

  beforeEach(() => {
    vi.clearAllMocks()
    rateLimiter = new RateLimiter({
      limit: 5,
      window: 60, // 1 minute
      keyPrefix: 'test',
    }, 'memory') // Use in-memory for testing
  })

  afterEach(async () => {
    await rateLimiter.disconnect()
    // Clear global store
    if (global._rateLimitStore) {
      global._rateLimitStore.clear()
    }
  })

  describe('check', () => {
    it('should allow requests within limit', async () => {
      const context: RateLimitContext = {
        tenantId: 'tenant-123',
        ip: '192.168.1.1',
        authenticated: false,
      }

      for (let i = 0; i < 5; i++) {
        const result = await rateLimiter.check(context)
        expect(result.success).toBe(true)
        expect(result.remaining).toBe(4 - i)
        expect(result.limit).toBe(5)
      }
    })

    it('should deny requests exceeding limit', async () => {
      const context: RateLimitContext = {
        tenantId: 'tenant-123',
        ip: '192.168.1.1',
        authenticated: false,
      }

      // Exhaust limit
      for (let i = 0; i < 5; i++) {
        await rateLimiter.check(context)
      }

      // Next request should be denied
      const result = await rateLimiter.check(context)
      expect(result.success).toBe(false)
      expect(result.remaining).toBe(0)
      expect(result.retryAfter).toBeGreaterThan(0)
    })

    it('should bypass rate limiting for service operations', async () => {
      const context: RateLimitContext = {
        tenantId: 'tenant-123',
        ip: '192.168.1.1',
        authenticated: false,
        isService: true,
      }

      const result = await rateLimiter.check(context)
      expect(result.success).toBe(true)
      expect(result.limit).toBe(Infinity)
      expect(result.remaining).toBe(Infinity)
    })

    it('should isolate rate limits by tenant', async () => {
      const context1: RateLimitContext = {
        tenantId: 'tenant-1',
        ip: '192.168.1.1',
        authenticated: false,
      }

      const context2: RateLimitContext = {
        tenantId: 'tenant-2',
        ip: '192.168.1.1',
        authenticated: false,
      }

      // Exhaust limit for tenant 1
      for (let i = 0; i < 5; i++) {
        await rateLimiter.check(context1)
      }

      // Tenant 1 should be denied
      const result1 = await rateLimiter.check(context1)
      expect(result1.success).toBe(false)

      // Tenant 2 should still be allowed
      const result2 = await rateLimiter.check(context2)
      expect(result2.success).toBe(true)
    })

    it('should isolate rate limits by IP address', async () => {
      const context1: RateLimitContext = {
        tenantId: 'tenant-123',
        ip: '192.168.1.1',
        authenticated: false,
      }

      const context2: RateLimitContext = {
        tenantId: 'tenant-123',
        ip: '192.168.1.2',
        authenticated: false,
      }

      // Exhaust limit for IP 1
      for (let i = 0; i < 5; i++) {
        await rateLimiter.check(context1)
      }

      // IP 1 should be denied
      const result1 = await rateLimiter.check(context1)
      expect(result1.success).toBe(false)

      // IP 2 should still be allowed
      const result2 = await rateLimiter.check(context2)
      expect(result2.success).toBe(true)
    })

    it('should differentiate between authenticated and anonymous users', async () => {
      const anonymousContext: RateLimitContext = {
        tenantId: 'tenant-123',
        ip: '192.168.1.1',
        authenticated: false,
      }

      const authenticatedContext: RateLimitContext = {
        tenantId: 'tenant-123',
        ip: '192.168.1.1',
        authenticated: true,
      }

      // Each should have separate limits
      for (let i = 0; i < 5; i++) {
        await rateLimiter.check(anonymousContext)
        await rateLimiter.check(authenticatedContext)
      }

      // Both should be denied separately
      const result1 = await rateLimiter.check(anonymousContext)
      const result2 = await rateLimiter.check(authenticatedContext)

      expect(result1.success).toBe(false)
      expect(result2.success).toBe(false)
    })
  })
})

describe('RateLimitPresets', () => {
  it('should have preset configurations', () => {
    expect(RateLimitPresets.general).toBeDefined()
    expect(RateLimitPresets.authenticated).toBeDefined()
    expect(RateLimitPresets.strict).toBeDefined()
  })

  it('should have different limits for different presets', async () => {
    const context: RateLimitContext = {
      tenantId: 'tenant-123',
      ip: '192.168.1.1',
      authenticated: false,
    }

    const generalResult = await RateLimitPresets.general.check(context)
    const authenticatedResult = await RateLimitPresets.authenticated.check(context)
    const strictResult = await RateLimitPresets.strict.check(context)

    expect(generalResult.limit).toBe(100) // 100 requests/hour
    expect(authenticatedResult.limit).toBe(1000) // 1000 requests/hour
    expect(strictResult.limit).toBe(10) // 10 requests/minute
  })
})

describe('getClientIP', () => {
  it('should extract IP from x-forwarded-for header', () => {
    const mockRequest = {
      headers: {
        get: vi.fn((header: string) => {
          if (header === 'x-forwarded-for') return '192.168.1.1, 10.0.0.1'
          if (header === 'x-real-ip') return null
          if (header === 'cf-connecting-ip') return null
          return null
        }),
      },
      ip: '127.0.0.1',
    } as unknown as NextRequest

    const ip = getClientIP(mockRequest)
    expect(ip).toBe('192.168.1.1')
  })

  it('should extract IP from x-real-ip header', () => {
    const mockRequest = {
      headers: {
        get: vi.fn((header: string) => {
          if (header === 'x-forwarded-for') return null
          if (header === 'x-real-ip') return '192.168.1.2'
          if (header === 'cf-connecting-ip') return null
          return null
        }),
      },
      ip: '127.0.0.1',
    } as unknown as NextRequest

    const ip = getClientIP(mockRequest)
    expect(ip).toBe('192.168.1.2')
  })

  it('should extract IP from cf-connecting-ip header', () => {
    const mockRequest = {
      headers: {
        get: vi.fn((header: string) => {
          if (header === 'x-forwarded-for') return null
          if (header === 'x-real-ip') return null
          if (header === 'cf-connecting-ip') return '192.168.1.3'
          return null
        }),
      },
      ip: '127.0.0.1',
    } as unknown as NextRequest

    const ip = getClientIP(mockRequest)
    expect(ip).toBe('192.168.1.3')
  })

  it('should fall back to request IP', () => {
    const mockRequest = {
      headers: {
        get: vi.fn(() => null),
      },
      ip: '192.168.1.4',
    } as unknown as NextRequest

    const ip = getClientIP(mockRequest)
    expect(ip).toBe('192.168.1.4')
  })

  it('should fall back to localhost if no IP found', () => {
    const mockRequest = {
      headers: {
        get: vi.fn(() => null),
      },
      ip: null,
    } as unknown as NextRequest

    const ip = getClientIP(mockRequest)
    expect(ip).toBe('127.0.0.1')
  })
})

describe('addRateLimitHeaders', () => {
  it('should add rate limit headers to response', () => {
    const mockResponse = {
      headers: {
        set: vi.fn(),
      },
    } as unknown as Response

    const result = {
      success: true,
      limit: 100,
      remaining: 95,
      resetTime: 1640995200,
      retryAfter: 30,
    }

    addRateLimitHeaders(mockResponse, result)

    expect(mockResponse.headers.set).toHaveBeenCalledWith('X-RateLimit-Limit', '100')
    expect(mockResponse.headers.set).toHaveBeenCalledWith('X-RateLimit-Remaining', '95')
    expect(mockResponse.headers.set).toHaveBeenCalledWith('X-RateLimit-Reset', '1640995200')
    expect(mockResponse.headers.set).toHaveBeenCalledWith('Retry-After', '30')
  })

  it('should not add Retry-After header if not present', () => {
    const mockResponse = {
      headers: {
        set: vi.fn(),
      },
    } as unknown as Response

    const result = {
      success: true,
      limit: 100,
      remaining: 95,
      resetTime: 1640995200,
    }

    addRateLimitHeaders(mockResponse, result)

    expect(mockResponse.headers.set).toHaveBeenCalledWith('X-RateLimit-Limit', '100')
    expect(mockResponse.headers.set).toHaveBeenCalledWith('X-RateLimit-Remaining', '95')
    expect(mockResponse.headers.set).toHaveBeenCalledWith('X-RateLimit-Reset', '1640995200')
    expect(mockResponse.headers.set).not.toHaveBeenCalledWith('Retry-After', expect.any(String))
  })
})

describe('applyRateLimit', () => {
  it('should apply rate limit and return result', async () => {
    const mockRequest = {
      headers: {
        get: vi.fn(() => null),
      },
      ip: '192.168.1.1',
    } as unknown as NextRequest

    const context: RateLimitContext = {
      tenantId: 'tenant-123',
      ip: '192.168.1.1',
      authenticated: false,
    }

    const { allowed, result } = await applyRateLimit(mockRequest, context)

    expect(typeof allowed).toBe('boolean')
    expect(result).toHaveProperty('success')
    expect(result).toHaveProperty('limit')
    expect(result).toHaveProperty('remaining')
    expect(result).toHaveProperty('resetTime')
  })

  it('should use custom limiter when provided', async () => {
    const mockRequest = {
      headers: {
        get: vi.fn(() => null),
      },
      ip: '192.168.1.1',
    } as unknown as NextRequest

    const context: RateLimitContext = {
      tenantId: 'tenant-123',
      ip: '192.168.1.1',
      authenticated: false,
    }

    const customLimiter = new RateLimiter({
      limit: 10,
      window: 60,
    }, 'memory')

    const { allowed, result } = await applyRateLimit(mockRequest, context, customLimiter)

    expect(result.limit).toBe(10)
    await customLimiter.disconnect()
  })
})
