import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  parseCorsOrigins,
  parseCorsMethods,
  parseCorsHeaders,
  corsCredentialsAllowed,
  corsMaxAge,
  isOriginAllowed,
  setCorsHeaders,
  handleCorsPreflight,
  logCorsViolation
} from './cors'

describe('CORS Configuration', () => {
  beforeEach(() => {
    // Clear environment variables before each test
    delete process.env['CORS_ALLOWED_ORIGINS']
    delete process.env['CORS_ALLOWED_METHODS']
    delete process.env['CORS_ALLOWED_HEADERS']
    delete process.env['CORS_CREDENTIALS']
    delete process.env['CORS_MAX_AGE']
    process.env['NODE_ENV'] = 'test'
  })

  describe('parseCorsOrigins', () => {
    it('should return empty array when no origins configured', () => {
      const origins = parseCorsOrigins()
      expect(origins).toEqual([])
    })

    it('should return localhost origins in development', () => {
      process.env['NODE_ENV'] = 'development'
      const origins = parseCorsOrigins()
      expect(origins).toEqual([
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://localhost:3003'
      ])
    })

    it('should parse comma-separated origins', () => {
      process.env['CORS_ALLOWED_ORIGINS'] = 'https://example.com,https://app.example.com'
      const origins = parseCorsOrigins()
      expect(origins).toEqual(['https://example.com', 'https://app.example.com'])
    })

    it('should trim whitespace from origins', () => {
      process.env['CORS_ALLOWED_ORIGINS'] = ' https://example.com , https://app.example.com '
      const origins = parseCorsOrigins()
      expect(origins).toEqual(['https://example.com', 'https://app.example.com'])
    })

    it('should filter out empty origins', () => {
      process.env['CORS_ALLOWED_ORIGINS'] = 'https://example.com,,https://app.example.com,'
      const origins = parseCorsOrigins()
      expect(origins).toEqual(['https://example.com', 'https://app.example.com'])
    })
  })

  describe('parseCorsMethods', () => {
    it('should return default methods when none configured', () => {
      const methods = parseCorsMethods()
      expect(methods).toEqual(['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'])
    })

    it('should parse custom methods', () => {
      process.env['CORS_ALLOWED_METHODS'] = 'GET,POST,OPTIONS'
      const methods = parseCorsMethods()
      expect(methods).toEqual(['GET', 'POST', 'OPTIONS'])
    })

    it('should convert methods to uppercase', () => {
      process.env['CORS_ALLOWED_METHODS'] = 'get,post,options'
      const methods = parseCorsMethods()
      expect(methods).toEqual(['GET', 'POST', 'OPTIONS'])
    })
  })

  describe('parseCorsHeaders', () => {
    it('should return default headers when none configured', () => {
      const headers = parseCorsHeaders()
      expect(headers).toEqual(['Content-Type', 'Authorization', 'X-Requested-With'])
    })

    it('should parse custom headers', () => {
      process.env['CORS_ALLOWED_HEADERS'] = 'Content-Type,X-Custom-Header'
      const headers = parseCorsHeaders()
      expect(headers).toEqual(['Content-Type', 'X-Custom-Header'])
    })
  })

  describe('corsCredentialsAllowed', () => {
    it('should return false when not configured', () => {
      const allowed = corsCredentialsAllowed()
      expect(allowed).toBe(false)
    })

    it('should return true when set to true', () => {
      process.env['CORS_CREDENTIALS'] = 'true'
      const allowed = corsCredentialsAllowed()
      expect(allowed).toBe(true)
    })

    it('should return false when set to false', () => {
      process.env['CORS_CREDENTIALS'] = 'false'
      const allowed = corsCredentialsAllowed()
      expect(allowed).toBe(false)
    })
  })

  describe('corsMaxAge', () => {
    it('should return default max age when not configured', () => {
      const maxAge = corsMaxAge()
      expect(maxAge).toBe('86400')
    })

    it('should return custom max age', () => {
      process.env['CORS_MAX_AGE'] = '3600'
      const maxAge = corsMaxAge()
      expect(maxAge).toBe('3600')
    })
  })

  describe('isOriginAllowed', () => {
    it('should return false for null origin', () => {
      const allowed = isOriginAllowed(null)
      expect(allowed).toBe(false)
    })

    it('should allow localhost origins in development', () => {
      process.env['NODE_ENV'] = 'development'
      const allowed = isOriginAllowed('http://localhost:3000')
      expect(allowed).toBe(true)
    })

    it('should allow configured origins', () => {
      process.env['CORS_ALLOWED_ORIGINS'] = 'https://example.com,https://app.example.com'
      expect(isOriginAllowed('https://example.com')).toBe(true)
      expect(isOriginAllowed('https://app.example.com')).toBe(true)
    })

    it('should reject non-configured origins', () => {
      process.env['CORS_ALLOWED_ORIGINS'] = 'https://example.com'
      expect(isOriginAllowed('https://evil.com')).toBe(false)
    })
  })

  describe('setCorsHeaders', () => {
    it('should set CORS headers for allowed origins', () => {
      process.env['CORS_ALLOWED_ORIGINS'] = 'https://example.com'
      const response = new Response()
      setCorsHeaders(response, 'https://example.com', 'test-request-id')

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://example.com')
      expect(response.headers.get('Vary')).toBe('Origin')
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST, PUT, DELETE, OPTIONS, PATCH')
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type, Authorization, X-Requested-With')
      expect(response.headers.get('Access-Control-Max-Age')).toBe('86400')
    })

    it('should not set headers for disallowed origins', () => {
      const response = new Response()
      setCorsHeaders(response, 'https://evil.com', 'test-request-id')

      expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull()
    })

    it('should set credentials header when enabled', () => {
      process.env['CORS_ALLOWED_ORIGINS'] = 'https://example.com'
      process.env['CORS_CREDENTIALS'] = 'true'
      const response = new Response()
      setCorsHeaders(response, 'https://example.com', 'test-request-id')

      expect(response.headers.get('Access-Control-Allow-Credentials')).toBe('true')
    })
  })

  describe('handleCorsPreflight', () => {
    it('should return 204 for allowed preflight requests', () => {
      process.env['CORS_ALLOWED_ORIGINS'] = 'https://example.com'
      const request = new Request('https://example.com/api/test', {
        method: 'OPTIONS',
        headers: { Origin: 'https://example.com' }
      })

      const response = handleCorsPreflight(request, 'https://example.com', 'test-request-id')
      expect(response?.status).toBe(204)
    })

    it('should return null for non-OPTIONS requests', () => {
      const request = new Request('https://example.com/api/test', {
        method: 'GET',
        headers: { Origin: 'https://example.com' }
      })

      const response = handleCorsPreflight(request, 'https://example.com', 'test-request-id')
      expect(response).toBeNull()
    })

    it('should return 403 for disallowed origins', () => {
      const request = new Request('https://example.com/api/test', {
        method: 'OPTIONS',
        headers: { Origin: 'https://evil.com' }
      })

      const response = handleCorsPreflight(request, 'https://evil.com', 'test-request-id')
      expect(response?.status).toBe(403)
    })
  })

  describe('logCorsViolation', () => {
    it('should log CORS violations', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      logCorsViolation('https://evil.com', '/api/test', 'test-request-id')

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('CORS violation detected')
      )

      consoleSpy.mockRestore()
    })
  })
})
