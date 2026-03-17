import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  createSupabaseServerClient,
  resolveTenantFromRequest,
} from '@agency/database'

function ensureRequestId(request: NextRequest): string {
  const existing = request.headers.get('x-request-id')
  if (existing && existing.length > 0) {
    return existing
  }
  return crypto.randomUUID()
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

  try {
    const tenant = await resolveTenantFromRequest(request)
    response.headers.set('x-tenant-id', tenant.tenantId)
    response.headers.set('x-tenant-slug', tenant.tenantSlug)
    response.headers.set('x-tenant-source', tenant.source)
  } catch (error) {
    console.warn(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'warn',
        message: 'Tenant resolution failed in middleware',
        service: 'riley-day-care',
        requestId,
        pathname: request.nextUrl.pathname,
        errorName: error instanceof Error ? error.name : 'UnknownError',
      })
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
