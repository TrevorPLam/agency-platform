import { NextRequest, NextResponse } from 'next/server'
import { validateTenantAccess } from '@/lib/auth'
import {
  ValidationError,
} from '@/lib/error-types'
import { withApiErrorHandling } from '@/lib/api-error-handling'
import { createRequestLogger } from '@/lib/logger'
import { DORAMetricsCollector } from '@agency/metrics'

export const GET = withApiErrorHandling(async (request: NextRequest) => {
  await validateTenantAccess(request)
  const { searchParams } = new URL(request.url)
  const timeWindowDays = parseInt(searchParams.get('timeWindowDays') || '30', 10)

  if (Number.isNaN(timeWindowDays) || timeWindowDays <= 0) {
    throw new ValidationError('timeWindowDays must be a positive number.')
  }

  // Use real DORA metrics collection
  const collector = new DORAMetricsCollector({
    timeWindowDays,
    environments: ['production'],
    services: [], // All services
    alertThresholds: {
      deploymentFrequency: 7,
      leadTimeForChanges: 24,
      changeFailureRate: 15,
      meanTimeToRecovery: 1
    }
  })

  const metrics = await collector.calculateMetrics()

  return NextResponse.json(metrics, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      'Content-Type': 'application/json',
    },
  })
}, 'metrics.dora.GET')

export const POST = withApiErrorHandling(async (request: NextRequest) => {
  await validateTenantAccess(request)
  const correlationId = request.headers.get('x-request-id') ?? crypto.randomUUID()
  const logger = createRequestLogger({
    service: 'agency-admin',
    component: 'dora-route',
    requestId: correlationId,
  })

  const body = (await request.json()) as Record<string, unknown>
  const { action, timeWindowDays = 30 } = body

  if (action === 'refresh') {
    logger.info('DORA metrics refresh triggered', { timeWindowDays })

    // In a real implementation, this would trigger the GitHub workflow
    // or directly run the collection process
    // For now, we'll return a success response indicating the refresh was triggered

    return NextResponse.json({
      success: true,
      message: 'Metrics refresh triggered',
      timeWindowDays,
      status: 'pending',
      correlationId
    })
  }

  logger.info('Received DORA metrics event', {
    eventType: typeof body['type'] === 'string' ? body['type'] : 'unknown',
  })

  return NextResponse.json({ success: true, message: 'Event received' })
}, 'metrics.dora.POST')
