import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  createSupabaseServerClient,
  resolveTenantFromRequest,
  getClientIP,
  addRateLimitHeaders,
  applyRateLimit,
  RateLimitPresets,
  type RateLimitContext,
} from '@agency/database'

function ensureRequestId(request: NextRequest): string {
  const existing = request.headers.get('x-request-id')
  if (existing && existing.length > 0) {
    return existing
  }
  return crypto.randomUUID()
}

/**
 * Generate a cryptographically secure nonce for CSP
 */
function generateNonce(): string {
  return Buffer.from(crypto.randomUUID()).toString('base64')
}

/**
 * Build Content Security Policy header with nonce
 */
function buildCspHeader(nonce: string, isDev: boolean): string {
  const directives = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}'${isDev ? " 'unsafe-eval'" : ''}`,
    `style-src 'self' 'nonce-${nonce}'${isDev ? " 'unsafe-inline'" : ''}`,
    `connect-src 'self' https://*.posthog.com`,
    `img-src 'self' blob: data:`,
    `font-src 'self'`,
    `object-src 'none'`,
    `media-src 'self'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `upgrade-insecure-requests`,
    `report-uri /api/csp-report`
  ]

  return directives.join('; ')
}

export async function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers)
  const requestId = ensureRequestId(request)
  const incomingTraceparent = request.headers.get('traceparent')
  const incomingSentryTrace = request.headers.get('sentry-trace')
  requestHeaders.set('x-request-id', requestId)
  if (incomingTraceparent) {
    requestHeaders.set('traceparent', incomingTraceparent)
  }
  if (incomingSentryTrace) {
    requestHeaders.set('sentry-trace', incomingSentryTrace)
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  })
  response.headers.set('x-request-id', requestId)
  if (incomingTraceparent) {
    response.headers.set('traceparent', incomingTraceparent)
  }
  if (incomingSentryTrace) {
    response.headers.set('sentry-trace', incomingSentryTrace)
  }

  const cookieStore = {
    getAll: () => request.cookies.getAll().map((c) => ({ name: c.name, value: c.value })),
    setAll: (cookiesToSet: Array<{ name: string; value: string; options?: object }>) => {
      cookiesToSet.forEach(({ name, value, options }) =>
        response.cookies.set(name, value, options as { path?: string; maxAge?: number })
      )
    },
  }

  const supabase = createSupabaseServerClient(cookieStore)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let tenantId: string | undefined
  let tenantSlug: string | undefined

  try {
    const tenant = await resolveTenantFromRequest(request)
    tenantId = tenant.tenantId
    tenantSlug = tenant.tenantSlug
    response.headers.set('x-tenant-id', tenant.tenantId)
    response.headers.set('x-tenant-slug', tenant.tenantSlug)
    response.headers.set('x-tenant-source', tenant.source)
  } catch (error) {
    console.warn(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'warn',
        message: 'Tenant resolution failed in middleware',
        service: 'the-barber-cave',
        requestId,
        pathname: request.nextUrl.pathname,
        errorName: error instanceof Error ? error.name : 'UnknownError',
      })
    )
  }

  // Apply rate limiting
  const clientIP = getClientIP(request)
  const isAPIRoute = request.nextUrl.pathname.startsWith('/api/')
  const rateLimitContext: RateLimitContext = {
    tenantId,
    ip: clientIP,
    authenticated: !!user,
    isService: false,
  }

  // Choose rate limiter based on authentication status and route type
  const limiter = user
    ? RateLimitPresets.authenticated
    : isAPIRoute
      ? RateLimitPresets.strict
      : RateLimitPresets.general

  const { allowed, result } = await applyRateLimit(request, rateLimitContext, limiter)

  // Add rate limit headers to response
  addRateLimitHeaders(response, result)

  // Add CSP headers for non-API routes
  if (!isAPIRoute) {
    const nonce = generateNonce()
    const isDev = process.env.NODE_ENV === 'development'

    // Set CSP header
    const cspHeader = buildCspHeader(nonce, isDev)
    response.headers.set('Content-Security-Policy', cspHeader)

    // Set nonce header for Next.js to use in components
    response.headers.set('x-nonce', nonce)

    // Set other security headers
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), interest-cohort=()'
    )

    // Production-safe HSTS
    if (process.env.NODE_ENV === 'production') {
      response.headers.set(
        'Strict-Transport-Security',
        'max-age=63072000; includeSubDomains'
      )
    }
  }

  // Return 429 Too Many Requests if rate limit exceeded
  if (!allowed) {
    return NextResponse.json(
      {
        type: 'https://agency.dev/problems/rate-limit-exceeded',
        title: 'Rate limit exceeded',
        status: 429,
        detail: 'Too many requests. Please try again later.',
        instance: request.nextUrl.pathname,
        code: 'RATE_LIMIT_EXCEEDED',
        correlationId: requestId,
        retryAfter: result.retryAfter,
      },
      {
        status: 429,
        headers: {
          'x-request-id': requestId,
          'content-type': 'application/problem+json',
          'Retry-After': result.retryAfter?.toString() || '60',
        },
      }
    )
  }

  const pathname = request.nextUrl.pathname
  const isProtected = pathname.startsWith('/dashboard')
  const isAuthRoute =
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/callback')

  if (isProtected && !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthRoute && user && pathname !== '/callback') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
