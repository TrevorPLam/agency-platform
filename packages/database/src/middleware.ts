import { getAdminClient } from './admin'
import type { NextRequest } from 'next/server'

/**
 * Tenant resolution result interface.
 */
export interface TenantResolution {
  tenantId: string
  tenantSlug: string
  source: 'development' | 'hostname' | 'subdomain' | 'header'
}

/**
 * Resolves tenant information from incoming request.
 *
 * This function implements multi-tenant resolution using multiple strategies:
 * - Development: Uses NEXT_PUBLIC_TENANT_SLUG environment variable
 * - Production: Uses hostname lookup via admin client
 *
 * @param request - Next.js request object
 * @returns Tenant resolution information
 *
 * @example
 * ```typescript
 * import { resolveTenantFromRequest } from '@agency/database'
 *
 * export async function middleware(request: NextRequest) {
 *   const tenant = await resolveTenantFromRequest(request)
 *
 *   // Add tenant context to request headers
 *   const response = NextResponse.next()
 *   response.headers.set('x-tenant-id', tenant.tenantId)
 *   response.headers.set('x-tenant-slug', tenant.tenantSlug)
 *
 *   return response
 * }
 * ```
 */
export async function resolveTenantFromRequest(request: NextRequest): Promise<TenantResolution> {
  const hostname = request.headers.get('host') || ''
  const isDevelopment = process.env.NODE_ENV === 'development'

  // Development mode: resolve tenant by slug so tenantId is always UUID (consistent with production)
  if (isDevelopment && process.env.NEXT_PUBLIC_TENANT_SLUG) {
    const slug = process.env.NEXT_PUBLIC_TENANT_SLUG
    const tenant = await resolveTenantBySlug(slug)
    if (!tenant) {
      throw new Error(
        `Unable to resolve tenant for slug: ${slug}. ` +
          `Ensure the tenant exists in the tenants table and NEXT_PUBLIC_TENANT_SLUG is correct.`
      )
    }
    return {
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      source: 'development',
    }
  }

  // Production mode: resolve tenant from hostname
  const tenant = await resolveTenantFromHostname(hostname)

  if (!tenant) {
    throw new Error(
      `Unable to resolve tenant for hostname: ${hostname}. ` +
        `Ensure the hostname is configured in the tenants table.`
    )
  }

  return {
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
    source: 'hostname',
  }
}

/**
 * Resolves tenant by slug (e.g. for development mode).
 */
async function resolveTenantBySlug(slug: string): Promise<{
  id: string
  slug: string
  domain: string
} | null> {
  try {
    const admin = getAdminClient()
    const { data } = await admin
      .from('tenants')
      .select('id, slug, domain')
      .eq('slug', slug)
      .single()
    return data
  } catch (error) {
    console.error('Error resolving tenant by slug:', error)
    return null
  }
}

/**
 * Resolves tenant information from database using hostname lookup.
 *
 * This function queries the tenants table to find a matching
 * domain configuration for the given hostname.
 *
 * @param hostname - Request hostname (e.g., "client.example.com")
 * @returns Tenant information or null if not found
 *
 * @example
 * ```typescript
 * const tenant = await resolveTenantFromHostname('riley-day-care.example.com')
 * // Returns: { id: '<uuid>', slug: 'riley-day-care', domain: 'riley-day-care.example.com' }
 * ```
 */
async function resolveTenantFromHostname(hostname: string): Promise<{
  id: string
  slug: string
  domain: string
} | null> {
  try {
    const admin = getAdminClient()

    // Look for exact hostname match first
    const { data: exactMatch } = await admin
      .from('tenants')
      .select('id, slug, domain')
      .eq('domain', hostname)
      .single()

    if (exactMatch) {
      return exactMatch
    }

    // Look for subdomain pattern (e.g., riley-day-care.localhost -> riley-day-care)
    const subdomain = hostname.split('.')[0]
    if (subdomain && subdomain !== 'www' && subdomain !== 'localhost') {
      const { data: subdomainMatch } = await admin
        .from('tenants')
        .select('id, slug, domain')
        .eq('slug', subdomain)
        .single()

      if (subdomainMatch) {
        return subdomainMatch
      }
    }

    return null
  } catch (error) {
    console.error('Error resolving tenant from hostname:', error)
    return null
  }
}

/**
 * Validates tenant context for the current request.
 *
 * This function ensures that a tenant is properly resolved and
 * available for database operations. It throws descriptive errors
 * for common misconfiguration scenarios.
 *
 * @param tenant - Tenant resolution result
 * @throws {Error} If tenant resolution is invalid
 *
 * @example
 * ```typescript
 * const tenant = await resolveTenantFromRequest(request)
 * validateTenantContext(tenant)
 *
 * // Tenant is now guaranteed to be valid for database operations
 * ```
 */
export function validateTenantContext(tenant: TenantResolution): void {
  if (!tenant.tenantId) {
    throw new Error('Tenant ID is required for database operations')
  }

  if (!tenant.tenantSlug) {
    throw new Error('Tenant slug is required for routing')
  }

  // Additional validation can be added here
  // For example, checking tenant status, subscription, etc.
}

/**
 * Extracts tenant information from request headers.
 *
 * This function is useful in API routes and server components
 * where middleware has already resolved the tenant context.
 *
 * @param request - Next.js request object
 * @returns Tenant information if available in headers
 *
 * @example
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const tenant = getTenantFromHeaders(request)
 *
 *   if (!tenant) {
 *     return new Response('Tenant context required', { status: 400 })
 *   }
 *
 *   // Use tenant for database operations
 * }
 * ```
 */
export function getTenantFromHeaders(request: NextRequest): TenantResolution | null {
  const tenantId = request.headers.get('x-tenant-id')
  const tenantSlug = request.headers.get('x-tenant-slug')
  const source = request.headers.get('x-tenant-source') as TenantResolution['source']

  if (!tenantId || !tenantSlug) {
    return null
  }

  return {
    tenantId,
    tenantSlug,
    source: source || 'header',
  }
}
