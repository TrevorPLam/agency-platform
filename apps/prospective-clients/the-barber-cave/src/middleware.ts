import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { resolveTenantFromRequest } from '@agency/database'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: { headers: request.headers },
  })

  try {
    const tenant = await resolveTenantFromRequest(request)
    response.headers.set('x-tenant-id', tenant.tenantId)
    response.headers.set('x-tenant-slug', tenant.tenantSlug)
    response.headers.set('x-tenant-source', tenant.source)
  } catch {
    // No tenant resolved (e.g. hostname not in tenants table); continue without tenant headers
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
