import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  createSupabaseServerClient,
  resolveTenantFromRequest,
} from '@agency/database'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: { headers: request.headers },
  })

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
  } catch {
    // No tenant resolved (e.g. hostname not in tenants table); continue without tenant headers
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
