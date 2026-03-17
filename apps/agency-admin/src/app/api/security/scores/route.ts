import { NextRequest, NextResponse } from 'next/server'

/**
 * Security score storage (in production, this would be a database)
 * For now, we'll use in-memory storage with persistence to a file
 */
interface SecurityScoreRecord {
  url: string
  score: number
  maxScore: number
  grade: string
  timestamp: string
  criticalIssues: number
  recommendations: number
  compliance: {
    owaspCompliant: boolean
    enterpriseReady: boolean
    hipaaCompliant: boolean
    gdprCompliant: boolean
    soc2Compliant: boolean
  }
}

// In production, replace with database storage
const securityScores = new Map<string, SecurityScoreRecord[]>()

/**
 * GET /api/security/scores
 * 
 * Retrieves security score history and trends
 * 
 * Query Parameters:
 * - url: Filter by specific URL (optional)
 * - days: Number of days of history to retrieve (default: 30)
 * - format: Response format (json | csv) - defaults to json
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')
    const days = Math.min(parseInt(searchParams.get('days') || '30'), 365) // Max 365 days
    const format = searchParams.get('format') || 'json'

    // Calculate date cutoff
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    // Get all scores or filter by URL
    let allScores: SecurityScoreRecord[] = []
    if (url) {
      allScores = securityScores.get(url) || []
    } else {
      // Get scores from all URLs
      for (const scores of securityScores.values()) {
        allScores.push(...scores)
      }
    }

    // Filter by date range
    const filteredScores = allScores.filter(record => 
      new Date(record.timestamp) >= cutoffDate
    )

    // Sort by timestamp (newest first)
    filteredScores.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    // Calculate trends
    const trends = calculateTrends(filteredScores)

    // Return in requested format
    if (format === 'csv') {
      const csvData = generateCSV(filteredScores)
      return new NextResponse(csvData, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `inline; filename="security-scores-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        scores: filteredScores,
        trends,
        summary: {
          totalRecords: filteredScores.length,
          dateRange: {
            start: cutoffDate.toISOString(),
            end: new Date().toISOString()
          },
          uniqueUrls: url ? 1 : new Set(filteredScores.map(s => s.url)).size
        }
      },
      metadata: {
        timestamp: new Date().toISOString(),
        days,
        urlFilter: url || null
      }
    })

  } catch (error) {
    console.error('Security scores retrieval error:', error)
    
    return NextResponse.json(
      {
        type: 'https://agency.dev/problems/internal-error',
        title: 'Internal server error',
        status: 500,
        detail: 'An error occurred while retrieving security scores',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/security/scores
 * 
 * Records a new security score (typically called by monitoring systems)
 * 
 * Body:
 * - url: The URL that was analyzed
 * - scoreData: Complete security score data
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, scoreData } = body

    if (!url || !scoreData) {
      return NextResponse.json(
        {
          type: 'https://agency.dev/problems/invalid-request',
          title: 'Invalid request',
          status: 400,
          detail: 'URL and scoreData are required',
          code: 'MISSING_REQUIRED_FIELDS',
        },
        { status: 400 }
      )
    }

    // Validate score data structure
    const requiredFields = ['overallScore', 'maxScore', 'grade', 'criticalIssues', 'recommendations', 'compliance']
    for (const field of requiredFields) {
      if (!(field in scoreData)) {
        return NextResponse.json(
          {
            type: 'https://agency.dev/problems/invalid-request',
            title: 'Invalid score data',
            status: 400,
            detail: `Missing required field: ${field}`,
            code: 'MISSING_SCORE_FIELD',
          },
          { status: 400 }
        )
      }
    }

    // Create new record
    const record: SecurityScoreRecord = {
      url,
      score: scoreData.overallScore,
      maxScore: scoreData.maxScore,
      grade: scoreData.grade,
      timestamp: new Date().toISOString(),
      criticalIssues: scoreData.criticalIssues.length || 0,
      recommendations: scoreData.recommendations?.length || 0,
      compliance: scoreData.compliance
    }

    // Store the record
    if (!securityScores.has(url)) {
      securityScores.set(url, [])
    }
    
    const urlScores = securityScores.get(url)!
    urlScores.push(record)

    // Keep only last 365 days of data per URL
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - 365)
    
    const filteredScores = urlScores.filter(score => 
      new Date(score.timestamp) >= cutoffDate
    )
    
    securityScores.set(url, filteredScores)

    console.log(`Security score recorded for ${url}: ${record.score}/${record.maxScore} (${record.grade})`)

    return NextResponse.json({
      success: true,
      data: record,
      metadata: {
        timestamp: new Date().toISOString(),
        totalRecordsForUrl: filteredScores.length
      }
    })

  } catch (error) {
    console.error('Security score recording error:', error)
    
    return NextResponse.json(
      {
        type: 'https://agency.dev/problems/internal-error',
        title: 'Internal server error',
        status: 500,
        detail: 'An error occurred while recording security score',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/security/scores
 * 
 * Deletes security score records (for maintenance/testing)
 * 
 * Query Parameters:
 * - url: Delete scores for specific URL (optional, if not provided, deletes all)
 * - olderThan: Delete records older than specified days (default: 365)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')
    const olderThan = parseInt(searchParams.get('olderThan') || '365')

    // Calculate cutoff date
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - olderThan)

    let deletedCount = 0

    if (url) {
      // Delete specific URL's scores
      const urlScores = securityScores.get(url) || []
      const originalCount = urlScores.length
      
      const filteredScores = urlScores.filter(record => 
        new Date(record.timestamp) >= cutoffDate
      )
      
      deletedCount = originalCount - filteredScores.length
      
      if (filteredScores.length === 0) {
        securityScores.delete(url)
      } else {
        securityScores.set(url, filteredScores)
      }
    } else {
      // Delete old scores from all URLs
      for (const [url, scores] of securityScores.entries()) {
        const originalCount = scores.length
        
        const filteredScores = scores.filter(record => 
          new Date(record.timestamp) >= cutoffDate
        )
        
        deletedCount += originalCount - filteredScores.length
        
        if (filteredScores.length === 0) {
          securityScores.delete(url)
        } else {
          securityScores.set(url, filteredScores)
        }
      }
    }

    console.log(`Security score cleanup completed: ${deletedCount} records deleted`)

    return NextResponse.json({
      success: true,
      data: {
        deletedCount,
        url: url || 'all',
        olderThanDays: olderThan
      },
      metadata: {
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Security score deletion error:', error)
    
    return NextResponse.json(
      {
        type: 'https://agency.dev/problems/internal-error',
        title: 'Internal server error',
        status: 500,
        detail: 'An error occurred while deleting security scores',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    )
  }
}

/**
 * Calculate trend statistics from score records
 */
function calculateTrends(scores: SecurityScoreRecord[]) {
  if (scores.length === 0) {
    return {
      averageScore: 0,
      trendDirection: 'stable' as 'improving' | 'declining' | 'stable',
      gradeDistribution: {},
      complianceRates: {
        owaspCompliant: 0,
        enterpriseReady: 0,
        hipaaCompliant: 0,
        gdprCompliant: 0,
        soc2Compliant: 0
      }
    }
  }

  // Calculate average score
  const totalScore = scores.reduce((sum, record) => sum + record.score, 0)
  const totalMaxScore = scores.reduce((sum, record) => sum + record.maxScore, 0)
  const averageScore = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0

  // Determine trend direction (compare last 10 scores with previous 10)
  let trendDirection: 'improving' | 'declining' | 'stable' = 'stable'
  if (scores.length >= 20) {
    const recent = scores.slice(0, 10)
    const previous = scores.slice(10, 20)
    
    const recentAvg = recent.reduce((sum, r) => sum + (r.score / r.maxScore) * 100, 0) / recent.length
    const previousAvg = previous.reduce((sum, r) => sum + (r.score / r.maxScore) * 100, 0) / previous.length
    
    if (recentAvg > previousAvg + 2) {
      trendDirection = 'improving'
    } else if (recentAvg < previousAvg - 2) {
      trendDirection = 'declining'
    }
  }

  // Calculate grade distribution
  const gradeDistribution = scores.reduce((dist, record) => {
    dist[record.grade] = (dist[record.grade] || 0) + 1
    return dist
  }, {} as Record<string, number>)

  // Calculate compliance rates
  const complianceRates = {
    owaspCompliant: scores.filter(s => s.compliance.owaspCompliant).length / scores.length * 100,
    enterpriseReady: scores.filter(s => s.compliance.enterpriseReady).length / scores.length * 100,
    hipaaCompliant: scores.filter(s => s.compliance.hipaaCompliant).length / scores.length * 100,
    gdprCompliant: scores.filter(s => s.compliance.gdprCompliant).length / scores.length * 100,
    soc2Compliant: scores.filter(s => s.compliance.soc2Compliant).length / scores.length * 100
  }

  return {
    averageScore: Math.round(averageScore),
    trendDirection,
    gradeDistribution,
    complianceRates
  }
}

/**
 * Generate CSV format for score data
 */
function generateCSV(scores: SecurityScoreRecord[]): string {
  const headers = [
    'URL',
    'Score',
    'Max Score',
    'Grade',
    'Timestamp',
    'Critical Issues',
    'Recommendations',
    'OWASP Compliant',
    'Enterprise Ready',
    'HIPAA Compliant',
    'GDPR Compliant',
    'SOC 2 Compliant'
  ]

  const rows = scores.map(record => [
    record.url,
    record.score,
    record.maxScore,
    record.grade,
    record.timestamp,
    record.criticalIssues,
    record.recommendations,
    record.compliance.owaspCompliant,
    record.compliance.enterpriseReady,
    record.compliance.hipaaCompliant,
    record.compliance.gdprCompliant,
    record.compliance.soc2Compliant
  ])

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
}
