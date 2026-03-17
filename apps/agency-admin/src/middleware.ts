import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  createSupabaseServerClient,
  resolveTenantFromRequest,
} from '@agency/database'
import { ensureRequestId, logStructuredWarning } from '@/lib/request-context'

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
    logStructuredWarning('Tenant resolution failed in middleware', {
      service: 'agency-admin',
      requestId,
      pathname: request.nextUrl.pathname,
      errorName: error instanceof Error ? error.name : 'UnknownError',
    })

    if (
      request.nextUrl.pathname.startsWith('/api/costs') ||
      request.nextUrl.pathname.startsWith('/api/metrics')
    ) {
      return NextResponse.json(
        {
          type: 'https://agency.dev/problems/tenant-resolution-failed',
          title: 'Tenant resolution failed',
          status: 503,
          detail: 'Unable to resolve tenant context for this request.',
          instance: request.nextUrl.pathname,
          code: 'TENANT_RESOLUTION_FAILED',
          correlationId: requestId,
        },
        {
          status: 503,
          headers: {
            'x-request-id': requestId,
            'content-type': 'application/problem+json',
          },
        }
      )
    }
  }

  const pathname = request.nextUrl.pathname
  const isLogin = pathname.startsWith('/login')
  const isCallback = pathname.startsWith('/callback')

  if (!isLogin && !isCallback && !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isLogin && user) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
