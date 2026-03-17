import { NextRequest, NextResponse } from 'next/server'

/**
 * CSP Violation Report Endpoint
 * Receives and logs Content Security Policy violation reports.
 */
export async function POST(request: NextRequest) {
  try {
    const report: unknown = await request.json()

    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'error',
        message: 'CSP violation report',
        service: process.env.NEXT_PUBLIC_TENANT_SLUG ?? 'unknown',
        userAgent: request.headers.get('user-agent'),
        report,
      })
    )

    return NextResponse.json({ success: true, message: 'CSP violation report received' })
  } catch (error) {
    console.error('Error processing CSP violation report:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to process CSP violation report' },
      { status: 400 }
    )
  }
}
