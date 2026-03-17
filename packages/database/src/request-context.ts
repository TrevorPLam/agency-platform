import type { NextRequest } from 'next/server'

export const REQUEST_ID_HEADER = 'x-request-id'

export function getRequestIdFromHeaders(headers: Headers): string | null {
  return headers.get(REQUEST_ID_HEADER)
}

export function ensureRequestId(request: NextRequest): string {
  const existing = request.headers.get(REQUEST_ID_HEADER)
  if (existing && existing.trim().length > 0) {
    return existing
  }
  return crypto.randomUUID()
}
