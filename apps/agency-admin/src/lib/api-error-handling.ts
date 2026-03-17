import { NextRequest, NextResponse } from 'next/server'
import {
  AppError,
  InternalServerError,
  isAppError,
} from '@/lib/error-types'
import { createRequestLogger } from '@/lib/logger'

export interface ProblemDetails {
  type: string
  title: string
  status: number
  detail: string
  instance: string
  code: string
  correlationId: string
  traceparent?: string
  sentryTrace?: string
  errors?: Record<string, string>
}

function createProblemDetails(
  error: unknown,
  request: NextRequest,
  correlationId: string
): ProblemDetails {
  const resolvedError = isAppError(error) ? error : new InternalServerError()
  const hideDetail = resolvedError.status >= 500 && process.env['NODE_ENV'] === 'production'
  const traceparent = request.headers.get('traceparent') ?? undefined
  const sentryTrace = request.headers.get('sentry-trace') ?? undefined

  return {
    type: resolvedError.type,
    title: resolvedError.title,
    status: resolvedError.status,
    detail: hideDetail
      ? 'An unexpected error occurred while processing your request.'
      : resolvedError.detail,
    instance: request.nextUrl.pathname,
    code: resolvedError.code,
    correlationId,
    ...(traceparent ? { traceparent } : {}),
    ...(sentryTrace ? { sentryTrace } : {}),
  }
}

export function problemResponse(
  request: NextRequest,
  correlationId: string,
  error: unknown
): NextResponse<ProblemDetails> {
  const details = createProblemDetails(error, request, correlationId)
  return NextResponse.json(details, {
    status: details.status,
    headers: {
      'x-request-id': correlationId,
      'content-type': 'application/problem+json',
    },
  })
}

type RouteHandler = (request: NextRequest) => Promise<NextResponse>

export function withApiErrorHandling(
  handler: RouteHandler,
  routeName: string
): RouteHandler {
  return async (request: NextRequest) => {
    const correlationId = request.headers.get('x-request-id') ?? crypto.randomUUID()
    const traceparent = request.headers.get('traceparent') ?? undefined
    const sentryTrace = request.headers.get('sentry-trace') ?? undefined
    const logger = createRequestLogger({
      service: 'agency-admin',
      component: 'api',
      routeName,
      requestId: correlationId,
      traceId: traceparent,
    })

    try {
      const response = await handler(request)
      response.headers.set('x-request-id', correlationId)
      if (traceparent) {
        response.headers.set('traceparent', traceparent)
      }
      if (sentryTrace) {
        response.headers.set('sentry-trace', sentryTrace)
      }
      return response
    } catch (error) {
      const status = error instanceof AppError ? error.status : 500
      logger.error('Unhandled API route error', {
        status,
        errorName: error instanceof Error ? error.name : 'UnknownError',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      })
      return problemResponse(request, correlationId, error)
    }
  }
}
