/**
 * CORS Configuration Utilities
 *
 * Provides secure CORS configuration functions for Next.js middleware
 * following 2026 security best practices.
 */

/**
 * Parse CORS origins from environment variable
 */
export function parseCorsOrigins(): string[] {
  const origins = process.env['CORS_ALLOWED_ORIGINS']
  if (!origins) {
    // Default to localhost for development
    return process.env['NODE_ENV'] === 'development'
      ? ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003']
      : []
  }

  return origins
    .split(',')
    .map(origin => origin.trim())
    .filter(origin => origin.length > 0)
}

/**
 * Parse CORS methods from environment variable
 */
export function parseCorsMethods(): string[] {
  const methods = process.env['CORS_ALLOWED_METHODS'] || 'GET,POST,PUT,DELETE,OPTIONS,PATCH'
  return methods
    .split(',')
    .map(method => method.trim().toUpperCase())
    .filter(method => method.length > 0)
}

/**
 * Parse CORS headers from environment variable
 */
export function parseCorsHeaders(): string[] {
  const headers = process.env['CORS_ALLOWED_HEADERS'] || 'Content-Type,Authorization,X-Requested-With'
  return headers
    .split(',')
    .map(header => header.trim())
    .filter(header => header.length > 0)
}

/**
 * Check if credentials are allowed in CORS requests
 */
export function corsCredentialsAllowed(): boolean {
  return process.env['CORS_CREDENTIALS'] === 'true'
}

/**
 * Get CORS max age for preflight caching
 */
export function corsMaxAge(): string {
  return process.env['CORS_MAX_AGE'] || '86400' // 24 hours default
}

/**
 * Validate if origin is allowed based on CORS configuration
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false

  const allowedOrigins = parseCorsOrigins()

  // In development, allow all localhost origins
  if (process.env['NODE_ENV'] === 'development' && origin.startsWith('http://localhost:')) {
    return true
  }

  return allowedOrigins.includes(origin)
}

/**
 * Log CORS violation for security monitoring
 */
export function logCorsViolation(origin: string | null, pathname: string, requestId: string): void {
  const violation = {
    timestamp: new Date().toISOString(),
    level: 'warn',
    message: 'CORS violation detected',
    service: 'middleware',
    requestId,
    pathname,
    origin: origin || 'null',
    allowedOrigins: parseCorsOrigins(),
  }

  console.warn(JSON.stringify(violation))
}

/**
 * Set CORS headers on response for allowed origins
 */
export function setCorsHeaders(
  response: Response,
  origin: string | null,
  requestId: string
): void {
  if (!isOriginAllowed(origin)) {
    // Log violation for security monitoring
    logCorsViolation(origin, 'unknown', requestId)
    return
  }

  const allowedMethods = parseCorsMethods()
  const allowedHeaders = parseCorsHeaders()
  const credentialsAllowed = corsCredentialsAllowed()
  const maxAge = corsMaxAge()

  // Set Access-Control-Allow-Origin to the specific origin
  response.headers.set('Access-Control-Allow-Origin', origin!)

  // Add Vary: Origin header for proper caching
  response.headers.set('Vary', 'Origin')

  // Set other CORS headers
  response.headers.set('Access-Control-Allow-Methods', allowedMethods.join(', '))
  response.headers.set('Access-Control-Allow-Headers', allowedHeaders.join(', '))
  response.headers.set('Access-Control-Max-Age', maxAge)

  // Only set credentials if allowed and origin is not wildcard
  if (credentialsAllowed && origin !== '*') {
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }
}

/**
 * Handle CORS preflight requests (OPTIONS method)
 */
export function handleCorsPreflight(
  request: Request,
  origin: string | null,
  requestId: string
): Response | null {
  // Only handle OPTIONS requests
  if (request.method !== 'OPTIONS') {
    return null
  }

  // Validate origin
  if (!isOriginAllowed(origin)) {
    logCorsViolation(origin, 'preflight', requestId)
    return new Response(null, { status: 403 })
  }

  // Create preflight response
  const response = new Response(null, { status: 204 })
  setCorsHeaders(response, origin, requestId)

  return response
}
