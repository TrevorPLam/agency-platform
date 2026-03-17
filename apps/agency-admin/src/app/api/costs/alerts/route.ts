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
    return data?.slug || null
  } catch {
    return null
  }
}

/**
 * Budget Alerts API Route
 * 
 * Manages budget alerts for cost monitoring with CRUD operations.
 * Supports filtering by active status and category.
 * 
 * @route GET /api/costs/alerts
 * @access Private - Requires authentication and tenant access
 * @param {string} [searchParams.tenant_id] - Tenant ID (platform admins only)
 * @param {boolean} [searchParams.active] - Filter by active status
 * @returns {Promise<BudgetAlert[]>} Array of budget alert entries
 * 
 * @route POST /api/costs/alerts
 * @access Private - Requires authentication and tenant access
 * @param {object} body - Alert data
 * @param {string} [body.tenantId] - Tenant ID (platform admins only)
 * @param {string} body.name - Alert name
 * @param {string} body.category - Category: 'storage', 'compute', 'bandwidth', 'total'
 * @param {number} body.threshold - Alert threshold value
 * @param {string} [body.thresholdType=absolute] - Threshold type: 'absolute', 'percentage'
 * @param {string} [body.severity=medium] - Severity: 'low', 'medium', 'high', 'critical'
 * @param {boolean} [body.active=true] - Alert active status
 * @param {string[]} [body.notificationChannels=[]] - Notification channels
 * @returns {Promise<BudgetAlert>} Created alert entry
 * 
 * @example
 * // GET /api/costs/alerts?active=true
 * // Response:
 * [{
 *   "id": "uuid",
 *   "tenantId": "tenant-uuid",
 *   "name": "Storage Budget Alert",
 *   "category": "storage",
 *   "threshold": 100,
 *   "current": 85.5,
 *   "thresholdType": "absolute",
 *   "severity": "medium",
 *   "active": true,
 *   "notificationChannels": ["email"],
 *   "lastTriggered": "2026-03-15T10:30:00Z",
 *   "createdAt": "2026-03-10T12:00:00Z",
 *   "updatedAt": "2026-03-16T09:15:00Z"
 * }]
 * 
 * @error {401} Unauthorized - User not authenticated
 * @error {403} Forbidden - User lacks tenant access
 * @error {400} Bad Request - Invalid parameters or missing required fields
 * @error {500} Internal Server Error - Database or service failure
 */
export const GET = withApiErrorHandling(async (request: NextRequest) => {
  const correlationId = request.headers.get('x-request-id') ?? crypto.randomUUID()
  const logger = createRequestLogger({
    service: 'agency-admin',
    component: 'budget-alerts-route',
    requestId: correlationId,
  })

  const auth = await validateTenantAccess(request)
  const searchParams = request.nextUrl.searchParams
  const requestedTenantId = searchParams.get('tenant_id')
  const active = searchParams.get('active')
  const tenantId = auth.isPlatformAdmin && requestedTenantId ? requestedTenantId : auth.tenantId

  if (!tenantId) {
    throw new ValidationError('Tenant ID is required.')
  }

  const admin = getAdminClient()
  let query = admin
    .from('budget_alerts')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (active !== null) {
    query = query.eq('active', active === 'true')
  }

  const { data, error } = await query
  if (error) {
    throw new DatabaseOperationError('Failed to fetch budget alerts.')
  }

  const alerts = (data || []).map((alert) => ({
    id: alert.id,
    tenantId: alert.tenant_id,
    name: alert.name,
    category: alert.category,
    threshold: parseFloat(alert.threshold) || 0,
    current: parseFloat(alert.current) || 0,
    thresholdType: alert.threshold_type,
    severity: alert.severity,
    active: alert.active,
    notificationChannels: alert.notification_channels || [],
    lastTriggered: alert.last_triggered,
    createdAt: alert.created_at,
    updatedAt: alert.updated_at,
  }))

  const tenantSlug = await getTenantSlug(tenantId)
  if (tenantSlug) {
    try {
      captureServerEvent('system', 'costs:alerts_viewed', {
        tenant: tenantSlug,
        alerts_count: alerts.length,
        active_filter: active === 'true' ? 'active' : active === 'false' ? 'inactive' : 'all',
      })
    } catch (analyticsError) {
      logger.warn('Failed to capture alerts analytics event', {
        errorName: analyticsError instanceof Error ? analyticsError.name : 'UnknownError',
      })
    }
  }

  return NextResponse.json(alerts)
}, 'costs.alerts.GET')

export const POST = withApiErrorHandling(async (request: NextRequest) => {
  const correlationId = request.headers.get('x-request-id') ?? crypto.randomUUID()
  const logger = createRequestLogger({
    service: 'agency-admin',
    component: 'budget-alerts-route',
    requestId: correlationId,
  })

  const auth = await validateTenantAccess(request)
  const admin = getAdminClient()
  const body = (await request.json()) as Record<string, unknown>

  const requestedTenantId = body['tenantId']
  const name = body['name']
  const category = body['category']
  const threshold = body['threshold']
  const thresholdType = typeof body['thresholdType'] === 'string' ? body['thresholdType'] : 'absolute'
  const severity = typeof body['severity'] === 'string' ? body['severity'] : 'medium'
  const active = typeof body['active'] === 'boolean' ? body['active'] : true
  const notificationChannels = Array.isArray(body['notificationChannels']) ? body['notificationChannels'] : []

  const tenantId = auth.isPlatformAdmin && typeof requestedTenantId === 'string'
    ? requestedTenantId
    : auth.tenantId

  if (!tenantId || typeof name !== 'string' || typeof category !== 'string' || threshold === undefined) {
    throw new ValidationError('Missing required fields: tenantId, name, category, threshold.')
  }

  const validCategories = ['storage', 'compute', 'bandwidth', 'total']
  if (!validCategories.includes(category)) {
    throw new ValidationError(`Invalid category. Must be one of: ${validCategories.join(', ')}`)
  }

  const validSeverities = ['low', 'medium', 'high', 'critical']
  if (!validSeverities.includes(severity)) {
    throw new ValidationError(`Invalid severity. Must be one of: ${validSeverities.join(', ')}`)
  }

  const { data, error } = await admin
    .from('budget_alerts')
    .insert({
      tenant_id: tenantId,
      name,
      category,
      threshold,
      threshold_type: thresholdType,
      severity,
      active,
      notification_channels: notificationChannels,
      current: 0,
    })
    .select()
    .single()

  if (error) {
    throw new DatabaseOperationError('Failed to create budget alert.')
  }

  const alert = {
    id: data.id,
    tenantId: data.tenant_id,
    name: data.name,
    category: data.category,
    threshold: parseFloat(data.threshold) || 0,
    current: parseFloat(data.current) || 0,
    thresholdType: data.threshold_type,
    severity: data.severity,
    active: data.active,
    notificationChannels: data.notification_channels || [],
    lastTriggered: data.last_triggered,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }

  const tenantSlug = await getTenantSlug(tenantId)
  if (tenantSlug) {
    try {
      captureServerEvent('system', 'costs:alert_created', {
        tenant: tenantSlug,
        category,
        severity,
        threshold_type: thresholdType,
        active,
      })
    } catch (analyticsError) {
      logger.warn('Failed to capture alert creation analytics event', {
        errorName: analyticsError instanceof Error ? analyticsError.name : 'UnknownError',
      })
    }
  }

  return NextResponse.json(alert, { status: 201 })
}, 'costs.alerts.POST')
