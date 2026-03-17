/**
 * Security Metrics API Route
 * 
 * Provides security metrics, KPIs, and risk assessment
 * for monitoring and dashboard visualization.
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateTenantAccess } from '@agency/database/auth'
import { 
  calculateSecurityMetrics,
  detectThreatPatterns,
  getSecurityAlerts,
  securityMonitoringEngine,
} from '@agency/analytics'

/**
 * GET /api/security/metrics
 * 
 * Retrieve comprehensive security metrics and KPIs
 */
export async function GET(request: NextRequest) {
  try {
    // Validate tenant access
    const auth = await validateTenantAccess(request)
    if (!auth) {
      return NextResponse.json(
        { 
          code: 'UNAUTHORIZED',
          status: 401,
          title: 'Unauthorized',
          detail: 'Authentication required',
        },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const timeRange = searchParams.get('timeRange') || '24h'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const includeAlerts = searchParams.get('includeAlerts') !== 'false'
    const includeThreats = searchParams.get('includeThreats') !== 'false'

    // Calculate time range based on parameter
    let calculatedStart: string
    let calculatedEnd: string
    
    if (startDate && endDate) {
      calculatedStart = startDate
      calculatedEnd = endDate
    } else {
      const now = new Date()
      calculatedEnd = now.toISOString()
      
      switch (timeRange) {
        case '1h':
          calculatedStart = new Date(now.getTime() - 60 * 60 * 1000).toISOString()
          break
        case '24h':
          calculatedStart = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
          break
        case '7d':
          calculatedStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
          break
        case '30d':
          calculatedStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
          break
        default:
          calculatedStart = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
      }
    }

    const timeRangeObj = {
      start: calculatedStart,
      end: calculatedEnd,
    }

    // Get primary security metrics
    const metrics = calculateSecurityMetrics(auth.tenantId, timeRangeObj)

    // Get additional data if requested
    let alerts = []
    let threatPatterns = []

    if (includeAlerts) {
      alerts = getSecurityAlerts(auth.tenantId).slice(0, 50) // Limit to recent alerts
    }

    if (includeThreats) {
      threatPatterns = detectThreatPatterns(auth.tenantId)
    }

    // Calculate additional derived metrics
    const derivedMetrics = {
      // Security posture score
      securityPostureScore: calculateSecurityPostureScore(metrics),
      
      // Trend analysis
      trendAnalysis: calculateTrendAnalysis(metrics.trends),
      
      // Risk breakdown
      riskBreakdown: calculateRiskBreakdown(metrics),
      
      // Compliance status
      complianceStatus: calculateComplianceStatus(metrics),
      
      // Top security concerns
      topConcerns: identifyTopSecurityConcerns(metrics, alerts, threatPatterns),
    }

    // Return comprehensive metrics response
    return NextResponse.json({
      timeRange: timeRangeObj,
      metrics: {
        ...metrics,
        ...derivedMetrics,
      },
      alerts: includeAlerts ? {
        total: alerts.length,
        active: alerts.filter(a => a.status === 'active').length,
        critical: alerts.filter(a => a.severity === 'critical').length,
        high: alerts.filter(a => a.severity === 'high').length,
        recent: alerts.slice(0, 10), // Most recent alerts
      } : undefined,
      threats: includeThreats ? {
        patternsDetected: threatPatterns.length,
        patterns: threatPatterns.slice(0, 10), // Most recent patterns
      } : undefined,
      lastUpdated: new Date().toISOString(),
    })

  } catch (error) {
    console.error('Security metrics GET error:', error)
    
    return NextResponse.json(
      {
        code: 'INTERNAL_ERROR',
        status: 500,
        title: 'Internal Server Error',
        detail: 'Failed to retrieve security metrics',
      },
      { status: 500 }
    )
  }
}

/**
 * Calculate overall security posture score
 */
function calculateSecurityPostureScore(metrics: any): number {
  // Base score from risk level
  const riskScores = { critical: 20, high: 40, medium: 60, low: 80 }
  const baseScore = riskScores[metrics.riskLevel] || 50
  
  // Event volume factor (fewer events is better)
  const eventVolumeFactor = Math.max(0, 100 - (metrics.totalEvents / 10))
  
  // Alert resolution factor (more resolved alerts is better)
  const totalAlerts = metrics.activeAlerts + metrics.acknowledgedAlerts + metrics.resolvedAlerts
  const resolutionFactor = totalAlerts > 0 
    ? (metrics.resolvedAlerts / totalAlerts) * 20 
    : 10
  
  // Authentication success rate
  const authSuccessRate = 100 - metrics.authenticationFailureRate
  const authFactor = (authSuccessRate / 100) * 20
  
  // Calculate final score
  const finalScore = (baseScore * 0.4) + (eventVolumeFactor * 0.2) + (resolutionFactor * 0.2) + (authFactor * 0.2)
  
  return Math.round(Math.min(Math.max(finalScore, 0), 100))
}

/**
 * Calculate trend analysis
 */
function calculateTrendAnalysis(trends: any): any {
  if (!trends || !trends.timestamps || trends.timestamps.length < 2) {
    return {
      direction: 'stable',
      changeRate: 0,
      prediction: 'insufficient_data',
    }
  }

  const recentData = trends.authenticationFailures.slice(-6) // Last 6 hours
  const olderData = trends.authenticationFailures.slice(-12, -6) // Previous 6 hours

  if (recentData.length === 0 || olderData.length === 0) {
    return {
      direction: 'stable',
      changeRate: 0,
      prediction: 'insufficient_data',
    }
  }

  const recentAvg = recentData.reduce((sum: number, val: number) => sum + val, 0) / recentData.length
  const olderAvg = olderData.reduce((sum: number, val: number) => sum + val, 0) / olderData.length

  const changeRate = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0
  
  let direction: 'increasing' | 'decreasing' | 'stable'
  if (changeRate > 10) direction = 'increasing'
  else if (changeRate < -10) direction = 'decreasing'
  else direction = 'stable'

  let prediction: 'improving' | 'deteriorating' | 'stable'
  if (direction === 'decreasing') prediction = 'improving'
  else if (direction === 'increasing') prediction = 'deteriorating'
  else prediction = 'stable'

  return {
    direction,
    changeRate: Math.round(changeRate * 10) / 10,
    prediction,
  }
}

/**
 * Calculate risk breakdown by category
 */
function calculateRiskBreakdown(metrics: any): any {
  const total = metrics.totalEvents
  if (total === 0) {
    return {
      authentication: 0,
      authorization: 0,
      rateLimit: 0,
      dataSecurity: 0,
      infrastructure: 0,
      other: 0,
    }
  }

  return {
    authentication: Math.round((metrics.authenticationFailureRate / 100) * total),
    authorization: Math.round((metrics.dataAccessAnomalyRate / 100) * total),
    rateLimit: Math.round((metrics.rateLimitViolationRate / 100) * total),
    dataSecurity: Math.round((metrics.dataAccessAnomalyRate / 100) * total * 0.5),
    infrastructure: Math.round(total * 0.1), // Estimated
    other: Math.round(total * 0.05), // Estimated
  }
}

/**
 * Calculate compliance status
 */
function calculateComplianceStatus(metrics: any): any {
  // Check for compliance-related events
  const complianceEvents = metrics.events?.filter((event: any) => 
    event.compliance?.dataBreach || 
    event.compliance?.hipaa || 
    event.compliance?.pci || 
    event.compliance?.gdpr
  ) || []

  const hasComplianceIssues = complianceEvents.length > 0
  const hasCriticalEvents = metrics.criticalEvents > 0
  const riskScore = metrics.riskScore

  let status: 'compliant' | 'warning' | 'non_compliant'
  if (hasComplianceIssues || hasCriticalEvents || riskScore > 80) {
    status = 'non_compliant'
  } else if (riskScore > 60 || metrics.highEvents > 0) {
    status = 'warning'
  } else {
    status = 'compliant'
  }

  return {
    status,
    issues: complianceEvents.length,
    lastAudit: new Date().toISOString(), // Would be actual audit timestamp
    nextAudit: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
  }
}

/**
 * Identify top security concerns
 */
function identifyTopSecurityConcerns(metrics: any, alerts: any[], threatPatterns: any[]): any[] {
  const concerns = []

  // High risk score
  if (metrics.riskScore > 70) {
    concerns.push({
      type: 'high_risk_score',
      severity: 'high',
      title: 'High Security Risk Score',
      description: `Current risk score of ${metrics.riskScore} exceeds acceptable threshold`,
      recommendation: 'Review security events and implement additional controls',
    })
  }

  // Active critical alerts
  const criticalAlerts = alerts.filter(a => a.status === 'active' && a.severity === 'critical')
  if (criticalAlerts.length > 0) {
    concerns.push({
      type: 'critical_alerts',
      severity: 'critical',
      title: 'Active Critical Security Alerts',
      description: `${criticalAlerts.length} critical security alerts require immediate attention`,
      recommendation: 'Investigate and resolve critical alerts immediately',
    })
  }

  // High authentication failure rate
  if (metrics.authenticationFailureRate > 10) {
    concerns.push({
      type: 'auth_failures',
      severity: 'medium',
      title: 'High Authentication Failure Rate',
      description: `Authentication failure rate of ${metrics.authenticationFailureRate.toFixed(1)}% is elevated`,
      recommendation: 'Review authentication logs and consider additional security measures',
    })
  }

  // Rate limit violations
  if (metrics.rateLimitViolationRate > 5) {
    concerns.push({
      type: 'rate_limit_violations',
      severity: 'medium',
      title: 'Elevated Rate Limit Violations',
      description: `Rate limit violation rate of ${metrics.rateLimitViolationRate.toFixed(1)}% detected`,
      recommendation: 'Review rate limiting policies and monitor for abuse patterns',
    })
  }

  // Detected threat patterns
  if (threatPatterns.length > 0) {
    concerns.push({
      type: 'threat_patterns',
      severity: 'high',
      title: 'Threat Patterns Detected',
      description: `${threatPatterns.length} threat patterns detected in recent activity`,
      recommendation: 'Investigate detected patterns and implement countermeasures',
    })
  }

  // Sort by severity and limit to top 5
  const severityOrder = { critical: 3, high: 2, medium: 1, low: 0 }
  concerns.sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity])

  return concerns.slice(0, 5)
}
