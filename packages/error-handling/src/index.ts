/**
 * @agency/error-handling
 *
 * Centralised error handling for the Agency Platform.
 *
 * Re-exports the typed error hierarchy from @agency/database and provides a
 * RFC 9457 (Problem Details for HTTP APIs) helper for Next.js API routes.
 */

export {
  AppError,
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  TenantResolutionError,
  ResourceNotFoundError,
  DatabaseOperationError,
  ExternalServiceError,
  InternalServerError,
  isAppError,
} from '@agency/database'
export type { ErrorCode, AppErrorOptions } from '@agency/database'

import { AppError } from '@agency/database'

/** RFC 9457 Problem Details shape returned by toHttpResponse. */
interface RFC9457ProblemDetail {
  type: string
  title: string
  status: number
  detail: string
}

/**
 * Converts an AppError into an RFC 9457 JSON response.
 *
 * Returns a standard Web `Response` (compatible with Next.js API routes,
 * Edge Runtime, and plain Node.js) — no `next/server` peer dep required.
 *
 * @param error   The AppError to serialise.
 * @param status  Optional HTTP status override (defaults to error.status).
 */
export function toHttpResponse(error: AppError, status?: number): Response {
  const httpStatus = status ?? error.status
  const body: RFC9457ProblemDetail = {
    type: error.type,
    title: error.title,
    status: httpStatus,
    detail: error.detail,
  }
  return new Response(JSON.stringify(body), {
    status: httpStatus,
    headers: { 'Content-Type': 'application/problem+json' },
  })
}
