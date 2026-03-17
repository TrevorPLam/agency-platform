import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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

/**
 * CSP Middleware for Firm App
 * Provides nonce-based Content Security Policy with PostHog integration
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const isAPIRoute = request.nextUrl.pathname.startsWith('/api/')
  
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

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
