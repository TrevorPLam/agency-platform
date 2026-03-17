import type { NextRequest } from 'next/server'

export function ensureRequestId(request: NextRequest): string {
  const existing = request.headers.get('x-request-id')
  if (existing && existing.length > 0) {
    return existing
  }
  return crypto.randomUUID()
}

export function logStructuredWarning(message: string, details: Record<string, unknown>): void {
  console.warn(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'warn',
      message,
      ...details,
    })
  )
}
