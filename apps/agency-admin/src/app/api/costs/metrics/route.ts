import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@agency/database/admin'
import { captureServerEvent } from '@agency/analytics/server'
import { validateTenantAccess } from '@/lib/auth'
import {
  DatabaseOperationError,
  ValidationError,
} from '@/lib/error-types'
import { withApiErrorHandling } from '@/lib/api-error-handling'
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
    return typeof data?.slug === 'string' ? data.slug : null
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
export const GET = withApiErrorHandling(async (request: NextRequest) => {
  const correlationId = request.headers.get('x-request-id') ?? crypto.randomUUID()
  const logger = createRequestLogger({
    service: 'agency-admin',
    component: 'cost-metrics-route',
    requestId: correlationId,
  })

  const auth = await validateTenantAccess(request)
  const searchParams = request.nextUrl.searchParams
  const requestedTenantId = searchParams.get('tenant_id')
  const period = searchParams.get('period') || 'daily'
  const days = parseInt(searchParams.get('days') || '30', 10)
  const tenantId = auth.isPlatformAdmin && requestedTenantId ? requestedTenantId : auth.tenantId

  if (!tenantId) {
    throw new ValidationError('Tenant ID is required.')
  }

  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  const admin = getAdminClient()
  const { data, error } = await admin
    .from('cost_metrics')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('period', period)
    .gte('timestamp', startDate)
    .order('timestamp', { ascending: false })

  if (error) {
    throw new DatabaseOperationError('Failed to fetch cost metrics.')
  }

  const metrics = (data || []).map((metric) => ({
    id: metric['id'],
    storageUsage: metric['storage_usage'] || 0,
    cicdRuntime: metric['cicd_runtime'] || 0,
    bandwidthUsage: metric['bandwidth_usage'] || 0,
    totalCost: parseFloat(String(metric['total_cost'])) || 0,
    currency: metric['currency'] || 'USD',
    timestamp: metric['timestamp'],
    period: metric['period'],
    metadata: metric['metadata'] || {},
  }))

  const tenantSlug = await getTenantSlug(tenantId)
  if (tenantSlug) {
    try {
      captureServerEvent('system', 'costs:metrics_viewed', {
        tenant: tenantSlug,
        period,
        days,
        metrics_count: metrics.length,
      })
    } catch (analyticsError) {
      logger.warn('Failed to capture metrics analytics event', {
        errorName: analyticsError instanceof Error ? analyticsError.name : 'UnknownError',
      })
    }
  }

  return NextResponse.json(metrics)
}, 'costs.metrics.GET')

export const POST = withApiErrorHandling(async (request: NextRequest) => {
  const correlationId = request.headers.get('x-request-id') ?? crypto.randomUUID()
  const logger = createRequestLogger({
    service: 'agency-admin',
    component: 'cost-metrics-route',
    requestId: correlationId,
  })

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
  } = body as Record<string, unknown>

  const tenantId = auth.isPlatformAdmin && typeof requestedTenantId === 'string'
    ? requestedTenantId
    : auth.tenantId

  if (!tenantId) {
    throw new ValidationError('Tenant ID is required.')
  }

  const { data, error } = await admin
    .from('cost_metrics')
    .insert({
      tenant_id: tenantId,
      storage_usage: Number(storageUsage) || 0,
      cicd_runtime: Number(cicdRuntime) || 0,
      bandwidth_usage: Number(bandwidthUsage) || 0,
      total_cost: Number(totalCost) || 0,
      currency: typeof currency === 'string' ? currency : 'USD',
      period: typeof period === 'string' ? period : 'daily',
      metadata: typeof metadata === 'object' && metadata !== null ? metadata : {},
      timestamp: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    throw new DatabaseOperationError('Failed to create cost metric.')
  }

  const metric = {
    id: data['id'],
    storageUsage: data['storage_usage'] || 0,
    cicdRuntime: data['cicd_runtime'] || 0,
    bandwidthUsage: data['bandwidth_usage'] || 0,
    totalCost: parseFloat(String(data['total_cost'])) || 0,
    currency: data['currency'] || 'USD',
    timestamp: data['timestamp'],
    period: data['period'],
    metadata: data['metadata'] || {},
  }

  const tenantSlug = await getTenantSlug(tenantId)
  if (tenantSlug) {
    try {
      captureServerEvent('system', 'costs:metric_created', {
        tenant: tenantSlug,
        period: metric.period,
        currency: metric.currency,
      })
    } catch (analyticsError) {
      logger.warn('Failed to capture metric creation analytics event', {
        errorName: analyticsError instanceof Error ? analyticsError.name : 'UnknownError',
      })
    }
  }

  return NextResponse.json(metric, { status: 201 })
}, 'costs.metrics.POST')
