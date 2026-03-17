/**
 * Security Events API Route
 * 
 * Handles logging and retrieval of security events
 * following OWASP logging standards and tenant isolation.
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateTenantAccess } from '@agency/database/auth'
import { 
  SecurityEvent, 
  SecurityEventType, 
  SecuritySeverity,
  createSecurityEvent,
  logSecurityEvent,
  securityMonitoringEngine,
} from '@agency/analytics'

/**
 * GET /api/security/events
 * 
 * Retrieve security events with filtering and pagination
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
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const severity = searchParams.get('severity') as SecuritySeverity | null
    const eventType = searchParams.get('eventType') as SecurityEventType | null
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const userId = searchParams.get('userId')
    const sourceIp = searchParams.get('sourceIp')

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

    // Calculate time range
    const timeRange = {
      start: startDate || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Default 24 hours
      end: endDate || new Date().toISOString(),
    }

    // Get security metrics (includes filtered events)
    const metrics = securityMonitoringEngine.calculateMetrics(auth.tenantId, timeRange)
    
    // Filter events based on query parameters
    let filteredEvents = metrics.events || []

    if (severity) {
      filteredEvents = filteredEvents.filter(event => event.severity === severity)
    }

    if (eventType) {
      filteredEvents = filteredEvents.filter(event => event.eventType === eventType)
    }

    if (userId) {
      filteredEvents = filteredEvents.filter(event => event.actor.userId === userId)
    }

    if (sourceIp) {
      filteredEvents = filteredEvents.filter(event => event.source.ip === sourceIp)
    }

    // Sort events by timestamp (newest first)
    filteredEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Apply pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedEvents = filteredEvents.slice(startIndex, endIndex)

    // Return paginated results
    return NextResponse.json({
      data: paginatedEvents,
      pagination: {
        page,
        limit,
        total: filteredEvents.length,
        totalPages: Math.ceil(filteredEvents.length / limit),
        hasNext: endIndex < filteredEvents.length,
        hasPrev: page > 1,
      },
      filters: {
        severity,
        eventType,
        startDate: timeRange.start,
        endDate: timeRange.end,
        userId,
        sourceIp,
      },
      summary: {
        totalEvents: metrics.totalEvents,
        criticalEvents: metrics.criticalEvents,
        highEvents: metrics.highEvents,
        mediumEvents: metrics.mediumEvents,
        lowEvents: metrics.lowEvents,
      },
    })

  } catch (error) {
    console.error('Security events GET error:', error)
    
    return NextResponse.json(
      {
        code: 'INTERNAL_ERROR',
        status: 500,
        title: 'Internal Server Error',
        detail: 'Failed to retrieve security events',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/security/events
 * 
 * Log a new security event
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

    const body = await request.json()

    // Validate required fields
    const requiredFields = ['eventType', 'severity', 'description', 'outcome']
    const missingFields = requiredFields.filter(field => !(field in body))
    
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
    if (!Object.values(SecurityEventType).includes(body.eventType)) {
      return NextResponse.json(
        {
          code: 'INVALID_EVENT_TYPE',
          status: 400,
          title: 'Invalid Event Type',
          detail: `Invalid event type: ${body.eventType}`,
        },
        { status: 400 }
      )
    }

    if (!Object.values(SecuritySeverity).includes(body.severity)) {
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

    // Extract request context
    const sourceIp = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    request.ip || 
                    'unknown'

    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Create security event
    const securityEvent = createSecurityEvent({
      eventType: body.eventType,
      severity: body.severity,
      tenantId: auth.tenantId,
      description: body.description,
      outcome: body.outcome,
      application: {
        name: body.application?.name || 'agency-admin',
        version: body.application?.version || '1.0.0',
        endpoint: body.application?.endpoint,
        method: body.application?.method,
        statusCode: body.application?.statusCode,
      },
      source: {
        ip: body.source?.ip || sourceIp,
        userAgent: body.source?.userAgent || userAgent,
        geolocation: body.source?.geolocation,
        hostname: body.source?.hostname,
      },
      actor: {
        userId: auth.userId,
        tenantId: auth.tenantId,
        email: auth.userEmail,
        role: auth.role,
        ...body.actor,
      },
      context: {
        correlationId: body.context?.correlationId,
        requestId: body.context?.requestId,
        error: body.context?.error,
        stackTrace: body.context?.stackTrace,
        metadata: body.context?.metadata || {},
      },
      compliance: {
        dataBreach: body.compliance?.dataBreach || false,
        hipaa: body.compliance?.hipaa || false,
        pci: body.compliance?.pci || false,
        gdpr: body.compliance?.gdpr || false,
        sox: body.compliance?.sox || false,
      },
      threat: body.threat,
    })

    // Log the security event
    logSecurityEvent(securityEvent)

    // Add to monitoring engine
    await securityMonitoringEngine.addEvents([securityEvent])

    // Process alerts
    const { processSecurityAlerts } = await import('@agency/analytics')
    await processSecurityAlerts([securityEvent])

    return NextResponse.json({
      id: securityEvent.context.correlationId,
      timestamp: securityEvent.timestamp,
      eventType: securityEvent.eventType,
      severity: securityEvent.severity,
      status: 'logged',
    }, { status: 201 })

  } catch (error) {
    console.error('Security events POST error:', error)
    
    return NextResponse.json(
      {
        code: 'INTERNAL_ERROR',
        status: 500,
        title: 'Internal Server Error',
        detail: 'Failed to log security event',
      },
      { status: 500 }
    )
  }
}
