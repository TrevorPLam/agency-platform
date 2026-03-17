import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@agency/database/admin'
import { captureServerEvent } from '@agency/analytics/server'
import { validateTenantAccess } from '@/lib/auth'
import {
  DatabaseOperationError,
  ResourceNotFoundError,
  ValidationError,
  AuthorizationError,
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
 * Optimization Recommendations API Route
 * 
 * Manages cost optimization recommendations with CRUD operations.
 * Supports filtering by status, priority, and category.
 * 
 * @route GET /api/costs/recommendations
 * @access Private - Requires authentication and tenant access
 * @param {string} [searchParams.tenant_id] - Tenant ID (platform admins only)
 * @param {string} [searchParams.status] - Filter by status: 'pending', 'in_progress', 'completed', 'dismissed'
 * @param {string} [searchParams.priority] - Filter by priority: 'low', 'medium', 'high'
 * @returns {Promise<OptimizationRecommendation[]>} Array of recommendation entries
 * 
 * @route POST /api/costs/recommendations
 * @access Private - Requires authentication and tenant access
 * @param {object} body - Recommendation data
 * @param {string} [body.tenantId] - Tenant ID (platform admins only)
 * @param {string} body.category - Category: 'storage', 'compute', 'bandwidth', 'general'
 * @param {string} body.title - Recommendation title
 * @param {string} body.description - Detailed description
 * @param {number} [body.estimatedSavings=0] - Estimated cost savings
 * @param {string} [body.difficulty=medium] - Difficulty: 'easy', 'medium', 'hard'
 * @param {string} [body.priority=medium] - Priority: 'low', 'medium', 'high'
 * @param {string} [body.status=pending] - Status: 'pending', 'in_progress', 'completed', 'dismissed'
 * @param {string} [body.reviewBy] - Review assignment
 * @returns {Promise<OptimizationRecommendation>} Created recommendation entry
 * 
 * @route PATCH /api/costs/recommendations
 * @access Private - Requires authentication and tenant access
 * @param {object} body - Update data
 * @param {string} body.id - Recommendation ID (must belong to user's tenant)
 * @param {string} body.status - New status value
 * @returns {Promise<OptimizationRecommendation>} Updated recommendation entry
 * 
 * @example
 * // GET /api/costs/recommendations?status=pending&priority=high
 * // Response:
 * [{
 *   "id": "uuid",
 *   "tenantId": "tenant-uuid",
 *   "category": "storage",
 *   "title": "Compress Unused Images",
 *   "description": "Compress old images to reduce storage costs",
 *   "estimatedSavings": 25.50,
 *   "difficulty": "easy",
 *   "priority": "high",
 *   "status": "pending",
 *   "createdAt": "2026-03-16T10:00:00Z",
 *   "reviewBy": "admin@example.com"
 * }]
 * 
 * @error {401} Unauthorized - User not authenticated
 * @error {403} Forbidden - User lacks tenant access or cross-tenant access attempt
 * @error {400} Bad Request - Invalid parameters or missing required fields
 * @error {404} Not Found - Recommendation not found (PATCH only)
 * @error {500} Internal Server Error - Database or service failure
 */
export const GET = withApiErrorHandling(async (request: NextRequest) => {
  const correlationId = request.headers.get('x-request-id') ?? crypto.randomUUID()
  const logger = createRequestLogger({
    service: 'agency-admin',
    component: 'recommendations-route',
    requestId: correlationId,
  })

  const auth = await validateTenantAccess(request)
  const searchParams = request.nextUrl.searchParams
  const requestedTenantId = searchParams.get('tenant_id')
  const status = searchParams.get('status')
  const priority = searchParams.get('priority')
  const tenantId = auth.isPlatformAdmin && requestedTenantId ? requestedTenantId : auth.tenantId

  if (!tenantId) {
    throw new ValidationError('Tenant ID is required.')
  }

  const admin = getAdminClient()
  let query = admin
    .from('optimization_recommendations')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }
  if (priority) {
    query = query.eq('priority', priority)
  }

  const { data, error } = await query
  if (error) {
    throw new DatabaseOperationError('Failed to fetch optimization recommendations.')
  }

  const recommendations = (data || []).map((rec) => ({
    id: rec.id,
    tenantId: rec.tenant_id,
    category: rec.category,
    title: rec.title,
    description: rec.description,
    estimatedSavings: parseFloat(rec.estimated_savings) || 0,
    difficulty: rec.difficulty,
    priority: rec.priority,
    status: rec.status,
    createdAt: rec.created_at,
    reviewBy: rec.review_by,
  }))

  const tenantSlug = await getTenantSlug(tenantId)
  if (tenantSlug) {
    try {
      captureServerEvent('system', 'costs:recommendations_viewed', {
        tenant: tenantSlug,
        recommendations_count: recommendations.length,
        status_filter: status || 'all',
        priority_filter: priority || 'all',
      })
    } catch (analyticsError) {
      logger.warn('Failed to capture recommendations analytics event', {
        errorName: analyticsError instanceof Error ? analyticsError.name : 'UnknownError',
      })
    }
  }

  return NextResponse.json(recommendations)
}, 'costs.recommendations.GET')

export const POST = withApiErrorHandling(async (request: NextRequest) => {
  const correlationId = request.headers.get('x-request-id') ?? crypto.randomUUID()
  const logger = createRequestLogger({
    service: 'agency-admin',
    component: 'recommendations-route',
    requestId: correlationId,
  })

  const auth = await validateTenantAccess(request)
  const admin = getAdminClient()
  const body = (await request.json()) as Record<string, unknown>

  const requestedTenantId = body['tenantId']
  const category = body['category']
  const title = body['title']
  const description = body['description']
  const estimatedSavings = Number(body['estimatedSavings'] ?? 0)
  const difficulty = typeof body['difficulty'] === 'string' ? body['difficulty'] : 'medium'
  const priority = typeof body['priority'] === 'string' ? body['priority'] : 'medium'
  const status = typeof body['status'] === 'string' ? body['status'] : 'pending'
  const reviewBy = typeof body['reviewBy'] === 'string' ? body['reviewBy'] : null

  const tenantId = auth.isPlatformAdmin && typeof requestedTenantId === 'string'
    ? requestedTenantId
    : auth.tenantId

  if (!tenantId || typeof category !== 'string' || typeof title !== 'string' || typeof description !== 'string') {
    throw new ValidationError('Missing required fields: tenantId, category, title, description.')
  }

  const validCategories = ['storage', 'compute', 'bandwidth', 'general']
  if (!validCategories.includes(category)) {
    throw new ValidationError(`Invalid category. Must be one of: ${validCategories.join(', ')}`)
  }

  const validDifficulties = ['easy', 'medium', 'hard']
  if (!validDifficulties.includes(difficulty)) {
    throw new ValidationError(`Invalid difficulty. Must be one of: ${validDifficulties.join(', ')}`)
  }

  const validPriorities = ['low', 'medium', 'high']
  if (!validPriorities.includes(priority)) {
    throw new ValidationError(`Invalid priority. Must be one of: ${validPriorities.join(', ')}`)
  }

  const validStatuses = ['pending', 'in_progress', 'completed', 'dismissed']
  if (!validStatuses.includes(status)) {
    throw new ValidationError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`)
  }

  const { data, error } = await admin
    .from('optimization_recommendations')
    .insert({
      tenant_id: tenantId,
      category,
      title,
      description,
      estimated_savings: estimatedSavings,
      difficulty,
      priority,
      status,
      review_by: reviewBy,
    })
    .select()
    .single()

  if (error) {
    throw new DatabaseOperationError('Failed to create optimization recommendation.')
  }

  const recommendation = {
    id: data.id,
    tenantId: data.tenant_id,
    category: data.category,
    title: data.title,
    description: data.description,
    estimatedSavings: parseFloat(data.estimated_savings) || 0,
    difficulty: data.difficulty,
    priority: data.priority,
    status: data.status,
    createdAt: data.created_at,
    reviewBy: data.review_by,
  }

  const tenantSlug = await getTenantSlug(tenantId)
  if (tenantSlug) {
    try {
      captureServerEvent('system', 'costs:recommendation_created', {
        tenant: tenantSlug,
        category,
        difficulty,
        priority,
        status,
      })
    } catch (analyticsError) {
      logger.warn('Failed to capture recommendation creation analytics event', {
        errorName: analyticsError instanceof Error ? analyticsError.name : 'UnknownError',
      })
    }
  }

  return NextResponse.json(recommendation, { status: 201 })
}, 'costs.recommendations.POST')

export const PATCH = withApiErrorHandling(async (request: NextRequest) => {
  const correlationId = request.headers.get('x-request-id') ?? crypto.randomUUID()
  const logger = createRequestLogger({
    service: 'agency-admin',
    component: 'recommendations-route',
    requestId: correlationId,
  })

  const auth = await validateTenantAccess(request)
  const admin = getAdminClient()
  const body = (await request.json()) as Record<string, unknown>
  const id = body['id']
  const status = body['status']

  if (typeof id !== 'string' || typeof status !== 'string') {
    throw new ValidationError('Missing required fields: id, status.')
  }

  const validStatuses = ['pending', 'in_progress', 'completed', 'dismissed']
  if (!validStatuses.includes(status)) {
    throw new ValidationError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`)
  }

  const { data: existingRec, error: fetchError } = await admin
    .from('optimization_recommendations')
    .select('tenant_id, id')
    .eq('id', id)
    .single()

  if (fetchError || !existingRec) {
    throw new ResourceNotFoundError('Recommendation not found.')
  }

  if (!auth.isPlatformAdmin && existingRec.tenant_id !== auth.tenantId) {
    throw new AuthorizationError('Cannot access recommendation from another tenant.')
  }

  const { data, error } = await admin
    .from('optimization_recommendations')
    .update({ status })
    .eq('id', id)
    .eq('tenant_id', auth.isPlatformAdmin ? existingRec.tenant_id : auth.tenantId)
    .select()
    .single()

  if (error) {
    throw new DatabaseOperationError('Failed to update optimization recommendation.')
  }

  const recommendation = {
    id: data.id,
    tenantId: data.tenant_id,
    category: data.category,
    title: data.title,
    description: data.description,
    estimatedSavings: parseFloat(data.estimated_savings) || 0,
    difficulty: data.difficulty,
    priority: data.priority,
    status: data.status,
    createdAt: data.created_at,
    reviewBy: data.review_by,
  }

  if (data.tenant_id) {
    const tenantSlug = await getTenantSlug(data.tenant_id)
    if (tenantSlug) {
      try {
        captureServerEvent('system', 'costs:recommendation_updated', {
          tenant: tenantSlug,
          new_status: status,
          category: data.category,
        })
      } catch (analyticsError) {
        logger.warn('Failed to capture recommendation update analytics event', {
          errorName: analyticsError instanceof Error ? analyticsError.name : 'UnknownError',
        })
      }
    }
  }

  return NextResponse.json(recommendation)
}, 'costs.recommendations.PATCH')
