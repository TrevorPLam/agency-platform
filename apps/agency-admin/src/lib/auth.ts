import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@agency/database'
import { NextRequest } from 'next/server'

/**
 * Authentication result interface
 */
export interface AuthResult {
  user: {
    id: string
    email: string
  }
  tenantId: string | null
  isPlatformAdmin: boolean
}

/**
 * Platform admin emails - these users can access all tenant data
 * In production, this should be moved to a database table or environment variable
 */
const PLATFORM_ADMINS = [
  'admin@agency.com',
  // Add other platform admin emails here
]

/**
 * Verifies the current user session and extracts tenant context
 * 
 * This function implements defense-in-depth authentication:
 * 1. Validates the JWT token from cookies
 * 2. Extracts tenant_id from app_metadata (never user_metadata)
 * 3. Checks for platform admin privileges
 * 4. Returns structured auth context for API routes
 * 
 * @returns Promise<AuthResult> Authentication context with user and tenant info
 * @throws {Error} If authentication fails or user is not found
 */
export async function verifySession(): Promise<AuthResult> {
  const cookieStore = await cookies()
  const supabase = createSupabaseServerClient({
    getAll: () => cookieStore.getAll().map((c) => ({ name: c.name, value: c.value })),
    setAll: (cookiesToSet) => {
      cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
    },
  })

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('Unauthorized: Invalid or missing authentication')
  }

  // Extract tenant_id from app_metadata (never user_metadata for security)
  const tenantId = user.app_metadata?.tenant_id as string | null

  // Check if user is a platform admin
  const isPlatformAdmin = PLATFORM_ADMINS.includes(user.email || '')

  return {
    user: {
      id: user.id,
      email: user.email || '',
    },
    tenantId,
    isPlatformAdmin,
  }
}

/**
 * Validates tenant access for the current user
 * 
 * @param request - Next.js request object (for fallback auth)
 * @param requestedTenantId - Tenant ID being requested (optional)
 * @returns Promise<AuthResult> Authentication context
 * @throws {Error} If user cannot access the requested tenant
 */
export async function validateTenantAccess(
  request?: NextRequest,
  requestedTenantId?: string
): Promise<AuthResult> {
  const auth = await verifySession()

  // Platform admins can access any tenant
  if (auth.isPlatformAdmin) {
    return auth
  }

  // Non-admin users must have a tenant_id in their app_metadata
  if (!auth.tenantId) {
    throw new Error('Forbidden: User is not assigned to any tenant')
  }

  // If a specific tenant is being requested, validate access
  if (requestedTenantId && auth.tenantId !== requestedTenantId) {
    throw new Error('Forbidden: Cannot access data from other tenants')
  }

  return auth
}

/**
 * Extracts tenant ID from request with validation
 * 
 * This is a transitional helper for APIs that still accept tenant_id
 * from query parameters but validates it against the user's session.
 * 
 * @param request - Next.js request object
 * @returns Promise<string> Validated tenant ID
 * @throws {Error} If tenant access is invalid
 */
export async function getValidatedTenantId(request: NextRequest): Promise<string> {
  const searchParams = request.nextUrl.searchParams
  const requestedTenantId = searchParams.get('tenant_id')

  const auth = await validateTenantAccess(request, requestedTenantId || undefined)

  // For platform admins, allow tenant_id from query params
  if (auth.isPlatformAdmin && requestedTenantId) {
    return requestedTenantId
  }

  // For regular users, always use their assigned tenant
  if (!auth.tenantId) {
    throw new Error('Forbidden: User is not assigned to any tenant')
  }

  return auth.tenantId
}
