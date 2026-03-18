/**
 * Security Alerts API Route
 *
 * Manages security alerts including creation, retrieval, and status updates
 * following 2026 security alerting best practices.
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateTenantAccess } from '@/lib/auth'
import {
  SecurityAlert,
  SecurityAlertType,
  SecuritySeverity,
  getSecurityAlerts,
  securityMonitoringEngine,
} from '@agency/analytics/security-server'

const SECURITY_SEVERITIES = Object.values(SecuritySeverity)

/**
 * GET /api/security/alerts
 *
 * Retrieve security alerts with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    // Validate tenant access
    const auth = await validateTenantAccess(request)
    if (!auth) {
      return NextResponse.json(
        {
          code: 'UNAUTHORIZED',
          status: 401,
          title: 'Unauthorized',
          detail: 'Authentication required',
        },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const tenantId = auth.tenantId

    if (!tenantId) {
      return NextResponse.json(
        {
          code: 'TENANT_CONTEXT_REQUIRED',
          status: 400,
          title: 'Tenant Context Required',
          detail: 'Tenant context is required to retrieve security alerts',
        },
        { status: 400 }
      )
    }

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status') as SecurityAlert['status'] | null
    const severity = searchParams.get('severity') as SecuritySeverity | null
    const type = searchParams.get('type') as SecurityAlertType | null
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const assignedTo = searchParams.get('assignedTo')

    // Validate pagination
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        {
          code: 'INVALID_PARAMETERS',
          status: 400,
          title: 'Invalid Parameters',
          detail: 'Page must be >= 1, limit must be between 1 and 100',
        },
        { status: 400 }
      )
    }

    // Get alerts with filters
    let alerts = getSecurityAlerts(tenantId, status ?? undefined)

    // Apply additional filters
    if (severity) {
      alerts = alerts.filter((alert) => alert.severity === severity)
    }

    if (type) {
      alerts = alerts.filter((alert) => alert.type === type)
    }

    if (startDate) {
      const start = new Date(startDate)
      alerts = alerts.filter((alert) => new Date(alert.timestamp) >= start)
    }

    if (endDate) {
      const end = new Date(endDate)
      alerts = alerts.filter((alert) => new Date(alert.timestamp) <= end)
    }

    if (assignedTo) {
      alerts = alerts.filter((alert) => alert.assignedTo === assignedTo)
    }

    // Sort alerts by timestamp (newest first) and then by severity
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
    alerts.sort((a, b) => {
      const severityDiff = severityOrder[b.severity as keyof typeof severityOrder] - severityOrder[a.severity as keyof typeof severityOrder]
      if (severityDiff !== 0) return severityDiff

      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    })

    // Apply pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedAlerts = alerts.slice(startIndex, endIndex)

    // Calculate summary statistics
    const summary = {
      total: alerts.length,
      byStatus: {
        active: alerts.filter((a) => a.status === 'active').length,
        acknowledged: alerts.filter((a) => a.status === 'acknowledged').length,
        investigating: alerts.filter((a) => a.status === 'investigating').length,
        resolved: alerts.filter((a) => a.status === 'resolved').length,
        false_positive: alerts.filter((a) => a.status === 'false_positive').length,
      },
      bySeverity: {
        critical: alerts.filter((a) => a.severity === 'critical').length,
        high: alerts.filter((a) => a.severity === 'high').length,
        medium: alerts.filter((a) => a.severity === 'medium').length,
        low: alerts.filter((a) => a.severity === 'low').length,
      },
      byType: alerts.reduce(
        (counts, alert) => {
          counts[alert.type] = (counts[alert.type] || 0) + 1
          return counts
        },
        {} as Record<string, number>
      ),
    }

    // Return paginated results
    return NextResponse.json({
      data: paginatedAlerts,
      pagination: {
        page,
        limit,
        total: alerts.length,
        totalPages: Math.ceil(alerts.length / limit),
        hasNext: endIndex < alerts.length,
        hasPrev: page > 1,
      },
      filters: {
        status,
        severity,
        type,
        startDate,
        endDate,
        assignedTo,
      },
      summary,
    })
  } catch (error) {
    console.error('Security alerts GET error:', error)

    return NextResponse.json(
      {
        code: 'INTERNAL_ERROR',
        status: 500,
        title: 'Internal Server Error',
        detail: 'Failed to retrieve security alerts',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/security/alerts
 *
 * Create a new security alert (manual or system-generated)
 */
export async function POST(request: NextRequest) {
  try {
    // Validate tenant access
    const auth = await validateTenantAccess(request)
    if (!auth) {
      return NextResponse.json(
        {
          code: 'UNAUTHORIZED',
          status: 401,
          title: 'Unauthorized',
          detail: 'Authentication required',
        },
        { status: 401 }
      )
    }

    const tenantId = auth.tenantId
    if (!tenantId) {
      return NextResponse.json(
        {
          code: 'TENANT_CONTEXT_REQUIRED',
          status: 400,
          title: 'Tenant Context Required',
          detail: 'Tenant context is required to create security alerts',
        },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Validate required fields
    const requiredFields = ['title', 'description', 'severity', 'type']
    const missingFields = requiredFields.filter((field) => !(field in body))

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          code: 'MISSING_REQUIRED_FIELDS',
          status: 400,
          title: 'Missing Required Fields',
          detail: `Missing required fields: ${missingFields.join(', ')}`,
        },
        { status: 400 }
      )
    }

    // Validate enum values
    if (!SECURITY_SEVERITIES.includes(body.severity)) {
      return NextResponse.json(
        {
          code: 'INVALID_SEVERITY',
          status: 400,
          title: 'Invalid Severity',
          detail: `Invalid severity: ${body.severity}`,
        },
        { status: 400 }
      )
    }

    if (!Object.values(SecurityAlertType).includes(body.type)) {
      return NextResponse.json(
        {
          code: 'INVALID_ALERT_TYPE',
          status: 400,
          title: 'Invalid Alert Type',
          detail: `Invalid alert type: ${body.type}`,
        },
        { status: 400 }
      )
    }

    // Create security alert
    const alert: SecurityAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      severity: body.severity,
      type: body.type,
      title: body.title,
      description: body.description,
      tenantId,
      events: body.events || [],
      status: 'active',
      assignedTo: typeof body.assignedTo === 'string' ? body.assignedTo : undefined,
      metadata: {
        riskScore: body.metadata?.riskScore || calculateInitialRiskScore(body.severity, body.type),
        affectedUsers: body.metadata?.affectedUsers || 0,
        affectedSystems: body.metadata?.affectedSystems || [],
        mitigation: body.metadata?.mitigation || '',
        recommendation: body.metadata?.recommendation || '',
      },
    }

    // Add alert to monitoring engine
    securityMonitoringEngine.addAlert(alert)

    // Log alert creation event
    const { SecurityEvents } = await import('@agency/analytics/security-server')
    SecurityEvents.suspiciousActivity({
      tenantId,
      userId: auth.userId,
      ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
      pattern: 'manual_security_alert_creation',
      riskScore: alert.metadata.riskScore,
    })

    return NextResponse.json(
      {
        id: alert.id,
        timestamp: alert.timestamp,
        status: 'created',
        alert: {
          id: alert.id,
          title: alert.title,
          severity: alert.severity,
          type: alert.type,
          status: alert.status,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Security alerts POST error:', error)

    return NextResponse.json(
      {
        code: 'INTERNAL_ERROR',
        status: 500,
        title: 'Internal Server Error',
        detail: 'Failed to create security alert',
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/security/alerts
 *
 * Update security alert status or assignment
 */
export async function PATCH(request: NextRequest) {
  try {
    // Validate tenant access
    const auth = await validateTenantAccess(request)
    if (!auth) {
      return NextResponse.json(
        {
          code: 'UNAUTHORIZED',
          status: 401,
          title: 'Unauthorized',
          detail: 'Authentication required',
        },
        { status: 401 }
      )
    }

    const tenantId = auth.tenantId
    if (!tenantId) {
      return NextResponse.json(
        {
          code: 'TENANT_CONTEXT_REQUIRED',
          status: 400,
          title: 'Tenant Context Required',
          detail: 'Tenant context is required to update security alerts',
        },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Validate required fields
    if (!body.id) {
      return NextResponse.json(
        {
          code: 'MISSING_ALERT_ID',
          status: 400,
          title: 'Missing Alert ID',
          detail: 'Alert ID is required for updates',
        },
        { status: 400 }
      )
    }

    // Validate allowed update fields
    const allowedFields = ['status', 'assignedTo']
    const updateFields = Object.keys(body).filter((key) => key !== 'id')
    const invalidFields = updateFields.filter((field) => !allowedFields.includes(field))

    if (invalidFields.length > 0) {
      return NextResponse.json(
        {
          code: 'INVALID_UPDATE_FIELDS',
          status: 400,
          title: 'Invalid Update Fields',
          detail: `Invalid fields for update: ${invalidFields.join(', ')}`,
        },
        { status: 400 }
      )
    }

    // Validate status if provided
    if (
      body.status &&
      !['active', 'acknowledged', 'investigating', 'resolved', 'false_positive'].includes(
        body.status
      )
    ) {
      return NextResponse.json(
        {
          code: 'INVALID_STATUS',
          status: 400,
          title: 'Invalid Status',
          detail: `Invalid status: ${body.status}`,
        },
        { status: 400 }
      )
    }

    // Update alert
    const updated = securityMonitoringEngine.updateAlertStatus(body.id, body.status)

    if (!updated) {
      return NextResponse.json(
        {
          code: 'ALERT_NOT_FOUND',
          status: 404,
          title: 'Alert Not Found',
          detail: `Security alert with ID ${body.id} not found`,
        },
        { status: 404 }
      )
    }

    // Get updated alert
    const alerts = getSecurityAlerts(tenantId)
    const updatedAlert = alerts.find((a) => a.id === body.id)

    if (!updatedAlert) {
      return NextResponse.json(
        {
          code: 'ALERT_NOT_FOUND',
          status: 404,
          title: 'Alert Not Found',
          detail: `Security alert with ID ${body.id} not found`,
        },
        { status: 404 }
      )
    }

    // Update additional fields if provided
    if (body.assignedTo) {
      updatedAlert.assignedTo = body.assignedTo
    }

    // Log alert update event
    const { SecurityEvents } = await import('@agency/analytics/security-server')
    SecurityEvents.suspiciousActivity({
      tenantId,
      userId: auth.userId,
      ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
      pattern: 'security_alert_status_update',
      riskScore: 20, // Low risk for status updates
    })

    return NextResponse.json({
      id: updatedAlert.id,
      status: 'updated',
      alert: {
        id: updatedAlert.id,
        title: updatedAlert.title,
        severity: updatedAlert.severity,
        status: updatedAlert.status,
        assignedTo: updatedAlert.assignedTo,
        updatedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Security alerts PATCH error:', error)

    return NextResponse.json(
      {
        code: 'INTERNAL_ERROR',
        status: 500,
        title: 'Internal Server Error',
        detail: 'Failed to update security alert',
      },
      { status: 500 }
    )
  }
}

/**
 * Calculate initial risk score for new alerts
 */
function calculateInitialRiskScore(severity: SecuritySeverity, type: SecurityAlertType): number {
  const severityScores = { critical: 80, high: 60, medium: 40, low: 20 }
  const typeModifiers = {
    [SecurityAlertType.BRUTE_FORCE_ATTACK]: 10,
    [SecurityAlertType.CROSS_TENANT_ACCESS_ATTEMPT]: 20,
    [SecurityAlertType.DATA_EXFILTRATION_RISK]: 15,
    [SecurityAlertType.INFRASTRUCTURE_COMPROMISE]: 20,
    [SecurityAlertType.MALICIOUS_PAYLOAD_DETECTED]: 10,
    [SecurityAlertType.RATE_LIMIT_ABUSE]: 5,
    [SecurityAlertType.SECURITY_MISCONFIGURATION]: 5,
    [SecurityAlertType.SUSPICIOUS_LOGIN_PATTERN]: 8,
    [SecurityAlertType.ANOMALOUS_DATA_ACCESS]: 12,
    [SecurityAlertType.VULNERABILITY_DETECTED]: 8,
  }

  const baseScore = severityScores[severity as keyof typeof severityScores]
  const modifier = typeModifiers[type] || 0

  return Math.min(baseScore + modifier, 100)
}
