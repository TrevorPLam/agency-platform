import { NextRequest, NextResponse } from 'next/server'

/**
 * CSP Violation Report Endpoint
 * Receives and logs Content Security Policy violation reports
 */
export async function POST(request: NextRequest) {
  try {
    const report = await request.json()
    
    // Log the CSP violation
    console.error('CSP Violation Report:', {
      timestamp: new Date().toISOString(),
      report,
      userAgent: request.headers.get('user-agent'),
      ip: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
    })

    // In a production environment, you might want to:
    // 1. Send this to your monitoring service (Sentry, etc.)
    // 2. Store in a database for analysis
    // 3. Send alerts for critical violations
    
    // For now, we'll just log and return success
    return NextResponse.json({ 
      success: true, 
      message: 'CSP violation report received' 
    })
  } catch (error) {
    console.error('Error processing CSP violation report:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to process CSP violation report' 
      },
      { status: 400 }
    )
  }
}

/**
 * Handle unsupported methods
 */
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}
