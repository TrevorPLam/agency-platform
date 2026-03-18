import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@agency/database/admin'
import { captureServerEvent } from '@agency/analytics/server'
import { validateTenantAccess } from '@/lib/auth'
import {
  DatabaseOperationError,
  ValidationError,
  AuthorizationError,
} from '@agency/database'
import { toHttpResponse } from '@agency/error-handling'
import { createRequestLogger } from '@/lib/logger'

// Helper function to resolve tenant slug from tenant_id
async function getTenantSlug(tenantId: string): Promise<string | null> {
  try {
    const admin = getAdminClient()
    const { data } = await admin
      .from('tenants')
      .select('slug')
      .eq('id', tenantId)
      .single()
    return data?.slug || null
  } catch {
    return null
  }
}

/**
 * Cost Summary API Route
 *
 * Returns cost summary data for a tenant including total costs, trend data,
 * and cost breakdowns by category.
 *
 * SECURITY MODEL:
 * - Uses secure database function with caller authorization enforcement
 * - Platform admins can access any tenant data
 * - Regular users can only access their assigned tenant data
 * - Database function validates JWT claims and prevents cross-tenant access
 *
 * @route GET /api/costs/summary
 * @access Private - Requires authentication and tenant access
 * @param {string} [searchParams.tenant_id] - Tenant ID (platform admins only)
 * @returns {Promise<CostSummary>} Cost summary data
 *
 * @example
 * // GET /api/costs/summary
 * // Response:
 * {
 *   "totalCost": 150.75,
 *   "storageCost": 45.20,
 *   "cicdCost": 85.30,
 *   "bandwidthCost": 20.25,
 *   "averageDailyCost": 21.53,
 *   "trendDirection": "up",
 *   "trendPercentage": 12.5
 * }
 *
 * @error {401} Unauthorized - User not authenticated
 * @error {403} Forbidden - User lacks tenant access or attempts cross-tenant access
 * @error {500} Internal Server Error - Database or service failure
 */
export const GET = async (request: NextRequest) => {
  const correlationId = request.headers.get('x-request-id') ?? crypto.randomUUID()
  const logger = createRequestLogger({
    service: 'agency-admin',
    component: 'cost-summary-route',
    requestId: correlationId,
  })

  try {
    const auth = await validateTenantAccess(request)
    const searchParams = request.nextUrl.searchParams
    const requestedTenantId = searchParams.get('tenant_id')
    const tenantId = auth.isPlatformAdmin && requestedTenantId ? requestedTenantId : auth.tenantId

    if (!tenantId) {
      throw new ValidationError('Tenant ID is required.')
    }

    const admin = getAdminClient()
    // Call the secure function - it will enforce authorization internally
    const { data, error } = await admin.rpc('get_tenant_cost_summary', {
      p_tenant_id: tenantId,
      p_days: 7,
    })

    if (error) {
      // Handle authorization errors specifically
      if (error.code === '42501') {
        throw new AuthorizationError('Access denied: Cannot access cost summary for this tenant.')
      }
      throw new DatabaseOperationError('Failed to fetch cost summary.')
    }

    if (!data || data.length === 0) {
      return NextResponse.json({
        totalCost: 0,
        storageCost: 0,
        cicdCost: 0,
        bandwidthCost: 0,
        averageDailyCost: 0,
        trendDirection: 'stable' as const,
        trendPercentage: 0,
      })
    }

    const summary = data[0]

    const tenantSlug = await getTenantSlug(tenantId)
    if (tenantSlug) {
      try {
        captureServerEvent('system', 'costs:summary_viewed', {
          tenant: tenantSlug,
          period_days: 7,
          has_data: true,
          trend_direction: summary?.trend_direction || 'stable',
        })
      } catch (analyticsError) {
        logger.warn('Failed to capture summary analytics event', {
          errorName: analyticsError instanceof Error ? analyticsError.name : 'UnknownError',
        })
      }
    }

    return NextResponse.json({
      totalCost: parseFloat(summary.total_cost) || 0,
      storageCost: parseFloat(summary.storage_cost) || 0,
      cicdCost: parseFloat(summary.cicd_cost) || 0,
      bandwidthCost: parseFloat(summary.bandwidth_cost) || 0,
      averageDailyCost: parseFloat(summary.average_daily_cost) || 0,
      trendDirection: summary.trend_direction || 'stable',
      trendPercentage: parseFloat(summary.trend_percentage) || 0,
    })
  } catch (error) {
    logger.error('Cost summary API error', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    })

    if (error instanceof ValidationError || error instanceof AuthorizationError || error instanceof DatabaseOperationError) {
      return toHttpResponse(error)
    }

    // Fallback for any unexpected errors
    return toHttpResponse(new DatabaseOperationError('An unexpected error occurred.'))
  }
}
