import { NextRequest, NextResponse } from 'next/server'
import { calculateSecurityScore, generateSecurityScoreReport } from '@agency/security'

/**
 * GET /api/security/headers
 * 
 * Analyzes security headers for a given URL and returns comprehensive security score
 * 
 * Query Parameters:
 * - url: The URL to analyze (required)
 * - format: Response format (json | report) - defaults to json
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const targetUrl = searchParams.get('url')
    const format = searchParams.get('format') || 'json'

    if (!targetUrl) {
      return NextResponse.json(
        {
          type: 'https://agency.dev/problems/invalid-request',
          title: 'Invalid request',
          status: 400,
          detail: 'URL parameter is required',
          code: 'MISSING_URL_PARAMETER',
        },
        { status: 400 }
      )
    }

    // Validate URL format
    let url: URL
    try {
      url = new URL(targetUrl)
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('Invalid protocol')
      }
    } catch {
      return NextResponse.json(
        {
          type: 'https://agency.dev/problems/invalid-request',
          title: 'Invalid URL',
          status: 400,
          detail: 'URL must be a valid HTTP or HTTPS URL',
          code: 'INVALID_URL',
        },
        { status: 400 }
      )
    }

    // Fetch headers from target URL
    let response: Response
    try {
      // Use fetch with timeout to avoid hanging
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      response = await fetch(url.toString(), {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Agency-Platform-Security-Monitor/1.0'
        }
      })

      clearTimeout(timeoutId)
    } catch (error) {
      return NextResponse.json(
        {
          type: 'https://agency.dev/problems/fetch-failed',
          title: 'Failed to fetch URL',
          status: 503,
          detail: `Unable to fetch headers from ${targetUrl}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          code: 'FETCH_FAILED',
        },
        { status: 503 }
      )
    }

    // Extract headers
    const headers: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value
    })

    // Calculate security score
    const securityReport = calculateSecurityScore(url.toString(), headers)

    // Log security analysis for monitoring
    console.log(`Security analysis completed for ${url.toString()}: Score ${securityReport.overallScore}/${securityReport.maxScore} (${securityReport.grade})`)

    // Return in requested format
    if (format === 'report') {
      const reportText = generateSecurityScoreReport(securityReport)
      return new NextResponse(reportText, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `inline; filename="security-report-${url.hostname}.md"`
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: securityReport,
      metadata: {
        analyzedUrl: url.toString(),
        timestamp: new Date().toISOString(),
        responseStatus: response.status,
        headerCount: Object.keys(headers).length
      }
    })

  } catch (error) {
    console.error('Security header analysis error:', error)
    
    return NextResponse.json(
      {
        type: 'https://agency.dev/problems/internal-error',
        title: 'Internal server error',
        status: 500,
        detail: 'An error occurred during security header analysis',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/security/headers
 * 
 * Analyzes multiple URLs for security headers in batch
 * 
 * Body:
 * - urls: Array of URLs to analyze
 * - format: Response format (json | report) - defaults to json
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { urls } = body

    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        {
          type: 'https://agency.dev/problems/invalid-request',
          title: 'Invalid request',
          status: 400,
          detail: 'URLs array is required and must not be empty',
          code: 'INVALID_URLS_ARRAY',
        },
        { status: 400 }
      )
    }

    if (urls.length > 10) {
      return NextResponse.json(
        {
          type: 'https://agency.dev/problems/invalid-request',
          title: 'Too many URLs',
          status: 400,
          detail: 'Maximum 10 URLs can be analyzed in a single request',
          code: 'TOO_MANY_URLS',
        },
        { status: 400 }
      )
    }

    // Validate all URLs
    const validUrls: string[] = []
    const invalidUrls: string[] = []

    for (const urlStr of urls) {
      try {
        const url = new URL(urlStr)
        if (!['http:', 'https:'].includes(url.protocol)) {
          invalidUrls.push(urlStr)
        } else {
          validUrls.push(url.toString())
        }
      } catch {
        invalidUrls.push(urlStr)
      }
    }

    if (invalidUrls.length > 0) {
      return NextResponse.json(
        {
          type: 'https://agency.dev/problems/invalid-request',
          title: 'Invalid URLs found',
          status: 400,
          detail: `Invalid URLs: ${invalidUrls.join(', ')}`,
          code: 'INVALID_URLS_FOUND',
        },
        { status: 400 }
      )
    }

    // Analyze URLs in parallel with concurrency limit
    const concurrencyLimit = 5
    const results: any[] = []

    for (let i = 0; i < validUrls.length; i += concurrencyLimit) {
      const batch = validUrls.slice(i, i + concurrencyLimit)
      
      const batchPromises = batch.map(async (url) => {
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 10000)

          const response = await fetch(url, {
            method: 'HEAD',
            signal: controller.signal,
            headers: {
              'User-Agent': 'Agency-Platform-Security-Monitor/1.0'
            }
          })

          clearTimeout(timeoutId)

          const headers: Record<string, string> = {}
          response.headers.forEach((value, key) => {
            headers[key.toLowerCase()] = value
          })

          const securityReport = calculateSecurityScore(url, headers)

          return {
            url,
            success: true,
            data: securityReport,
            error: null
          }
        } catch (error) {
          return {
            url,
            success: false,
            data: null,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      })

      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
    }

    // Calculate summary statistics
    const successful = results.filter(r => r.success)
    const failed = results.filter(r => !r.success)
    
    let summaryStats = null
    if (successful.length > 0) {
      const scores = successful.map(r => r.data.overallScore)
      const grades = successful.map(r => r.data.grade)
      
      summaryStats = {
        totalAnalyzed: results.length,
        successful: successful.length,
        failed: failed.length,
        averageScore: Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length),
        highestScore: Math.max(...scores),
        lowestScore: Math.min(...scores),
        gradeDistribution: {
          'A+': grades.filter(g => g === 'A+').length,
          'A': grades.filter(g => g === 'A').length,
          'B': grades.filter(g => g === 'B').length,
          'C': grades.filter(g => g === 'C').length,
          'D': grades.filter(g => g === 'D').length,
          'F': grades.filter(g => g === 'F').length,
        }
      }
    }

    // Log batch analysis
    console.log(`Batch security analysis completed: ${successful.length}/${results.length} successful`)

    return NextResponse.json({
      success: true,
      data: results,
      summary: summaryStats,
      metadata: {
        timestamp: new Date().toISOString(),
        requestedUrls: urls.length,
        validUrls: validUrls.length
      }
    })

  } catch (error) {
    console.error('Batch security header analysis error:', error)
    
    return NextResponse.json(
      {
        type: 'https://agency.dev/problems/internal-error',
        title: 'Internal server error',
        status: 500,
        detail: 'An error occurred during batch security header analysis',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    )
  }
}
