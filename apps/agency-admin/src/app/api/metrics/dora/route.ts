import { NextRequest, NextResponse } from 'next/server'
import { validateTenantAccess } from '@/lib/auth'
import {
  ValidationError,
} from '@/lib/error-types'
import { withApiErrorHandling } from '@/lib/api-error-handling'
import { createRequestLogger } from '@/lib/logger'

export const GET = withApiErrorHandling(async (request: NextRequest) => {
  await validateTenantAccess(request)
  const { searchParams } = new URL(request.url)
  const timeWindowDays = parseInt(searchParams.get('timeWindowDays') || '30', 10)

  if (Number.isNaN(timeWindowDays) || timeWindowDays <= 0) {
    throw new ValidationError('timeWindowDays must be a positive number.')
  }

  const mockMetrics = {
    metrics: {
      deploymentFrequency: 3.5,
      leadTimeForChanges: 12.5,
      changeFailureRate: 8.2,
      meanTimeToRecovery: 0.75,
    },
    performanceLevels: {
      'deployment-frequency': { level: 'High', minThreshold: 1, maxThreshold: 6.99, description: 'Daily to weekly deployments' },
      'lead-time-for-changes': { level: 'Elite', minThreshold: 0, maxThreshold: 24, description: 'Less than one day' },
      'change-failure-rate': { level: 'Elite', minThreshold: 0, maxThreshold: 15, description: '0-15% failure rate' },
      'mean-time-to-recovery': { level: 'Elite', minThreshold: 0, maxThreshold: 1, description: 'Less than one hour' },
    },
    period: {
      start: new Date(Date.now() - timeWindowDays * 24 * 60 * 60 * 1000).toISOString(),
      end: new Date().toISOString(),
    },
    dataPoints: {
      deployments: 25,
      incidents: 2,
      pullRequests: 18,
    },
    calculatedAt: new Date().toISOString(),
  }

  return NextResponse.json(mockMetrics, {
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
  logger.info('Received DORA metrics event', {
    eventType: typeof body['type'] === 'string' ? body['type'] : 'unknown',
  })
  return NextResponse.json({ success: true, message: 'Event received' })
}, 'metrics.dora.POST')
