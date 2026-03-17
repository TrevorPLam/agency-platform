import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@agency/database/admin'
import { captureServerEvent } from '@agency/analytics/server'
import { validateTenantAccess } from '@/lib/auth'

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
 * Cost Metrics API Route
 * 
 * Retrieves historical cost metrics and allows creation of new metric entries.
 * Supports filtering by period and date range.
 * 
 * @route GET /api/costs/metrics
 * @access Private - Requires authentication and tenant access
 * @param {string} [searchParams.tenant_id] - Tenant ID (platform admins only)
 * @param {string} [searchParams.period=daily] - Period: 'daily', 'weekly', 'monthly'
 * @param {number} [searchParams.days=30] - Number of days to retrieve
 * @returns {Promise<CostMetrics[]>} Array of cost metric entries
 * 
 * @route POST /api/costs/metrics
 * @access Private - Requires authentication and tenant access
 * @param {object} body - Metric data
 * @param {string} [body.tenantId] - Tenant ID (platform admins only)
 * @param {number} [body.storageUsage=0] - Storage usage in bytes
 * @param {number} [body.cicdRuntime=0] - CI/CD runtime in minutes
 * @param {number} [body.bandwidthUsage=0] - Bandwidth usage in bytes
 * @param {number} [body.totalCost=0] - Total cost in currency
 * @param {string} [body.currency=USD] - Currency code
 * @param {string} [body.period=daily] - Period: 'daily', 'weekly', 'monthly'
 * @param {object} [body.metadata={}] - Additional metadata
 * @returns {Promise<CostMetrics>} Created metric entry
 * 
 * @example
 * // GET /api/costs/metrics?period=daily&days=7
 * // Response:
 * [{
 *   "id": "uuid",
 *   "storageUsage": 1073741824,
 *   "cicdRuntime": 45,
 *   "bandwidthUsage": 536870912,
 *   "totalCost": 25.50,
 *   "currency": "USD",
 *   "timestamp": "2026-03-16T12:00:00Z",
 *   "period": "daily",
 *   "metadata": {}
 * }]
 * 
 * @error {401} Unauthorized - User not authenticated
 * @error {403} Forbidden - User lacks tenant access
 * @error {400} Bad Request - Invalid parameters
 * @error {500} Internal Server Error - Database or service failure
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate and validate tenant access
    const auth = await validateTenantAccess(request)
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const requestedTenantId = searchParams.get('tenant_id')
    const period = searchParams.get('period') || 'daily'
    const days = parseInt(searchParams.get('days') || '30')
    
    // For platform admins, allow specifying tenant_id in query params
    // For regular users, always use their assigned tenant
    const tenantId = auth.isPlatformAdmin && requestedTenantId 
      ? requestedTenantId 
      : auth.tenantId

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      )
    }

    // Calculate date range
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    // Fetch metrics for the tenant
    const admin = getAdminClient()
    const { data, error } = await admin
      .from('cost_metrics')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('period', period)
      .gte('timestamp', startDate)
      .order('timestamp', { ascending: false })

    if (error) {
      console.error('Error fetching cost metrics:', error)
      return NextResponse.json(
        { error: 'Failed to fetch cost metrics' },
        { status: 500 }
      )
    }

    // Transform data to match expected format
    const metrics = (data || []).map(metric => ({
      id: metric.id,
      storageUsage: metric.storage_usage || 0,
      cicdRuntime: metric.cicd_runtime || 0,
      bandwidthUsage: metric.bandwidth_usage || 0,
      totalCost: parseFloat(metric.total_cost) || 0,
      currency: metric.currency || 'USD',
      timestamp: metric.timestamp,
      period: metric.period,
      metadata: metric.metadata || {},
    }))

    // Capture analytics event for cost metrics view
    const tenantSlug = await getTenantSlug(tenantId)
    if (tenantSlug) {
      try {
        captureServerEvent(
          'system',
          'costs:metrics_viewed',
          {
            tenant: tenantSlug,
            period,
            days,
            metrics_count: metrics.length,
          }
        )
      } catch (analyticsError) {
        console.error('Failed to capture cost metrics analytics:', analyticsError)
      }
    }

    return NextResponse.json(metrics)
  } catch (error) {
    console.error('Error in cost metrics API:', error)
    
    // Return appropriate error codes based on error type
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json(
          { error: error.message },
          { status: 401 }
        )
      }
      if (error.message.includes('Forbidden')) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate and validate tenant access
    const auth = await validateTenantAccess(request)
    
    const admin = getAdminClient()
    const body = await request.json()
    
    const {
      tenantId: requestedTenantId,
      storageUsage = 0,
      cicdRuntime = 0,
      bandwidthUsage = 0,
      totalCost = 0,
      currency = 'USD',
      period = 'daily',
      metadata = {},
    } = body

    // For platform admins, allow specifying tenant_id in body
    // For regular users, always use their assigned tenant
    const tenantId = auth.isPlatformAdmin && requestedTenantId 
      ? requestedTenantId 
      : auth.tenantId

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      )
    }

    // Insert new metric
    const { data, error } = await admin
      .from('cost_metrics')
      .insert({
        tenant_id: tenantId,
        storage_usage: storageUsage,
        cicd_runtime: cicdRuntime,
        bandwidth_usage: bandwidthUsage,
        total_cost: totalCost,
        currency,
        period,
        metadata,
        timestamp: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating cost metric:', error)
      return NextResponse.json(
        { error: 'Failed to create cost metric' },
        { status: 500 }
      )
    }

    const metric = {
      id: data.id,
      storageUsage: data.storage_usage || 0,
      cicdRuntime: data.cicd_runtime || 0,
      bandwidthUsage: data.bandwidth_usage || 0,
      totalCost: parseFloat(data.total_cost) || 0,
      currency: data.currency || 'USD',
      timestamp: data.timestamp,
      period: data.period,
      metadata: data.metadata || {},
    }

    // Capture analytics event for cost metric creation
    const tenantSlug = await getTenantSlug(tenantId)
    if (tenantSlug) {
      try {
        captureServerEvent(
          'system',
          'costs:metric_created',
          {
            tenant: tenantSlug,
            period,
            currency,
          }
        )
      } catch (analyticsError) {
        console.error('Failed to capture cost metric creation analytics:', analyticsError)
      }
    }

    return NextResponse.json(metric, { status: 201 })
  } catch (error) {
    console.error('Error in cost metrics POST API:', error)
    
    // Return appropriate error codes based on error type
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json(
          { error: error.message },
          { status: 401 }
        )
      }
      if (error.message.includes('Forbidden')) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
