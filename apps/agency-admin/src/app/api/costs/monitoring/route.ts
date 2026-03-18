/**
 * Cost Monitoring API Route
 * 
 * Provides real-time cost monitoring data and alerts for the Agency Platform.
 * Integrates with the @agency/cost package for comprehensive cost management.
 * 
 * Features:
 * - Real-time cost metrics aggregation
 * - Cost anomaly detection and alerting
 * - Budget threshold monitoring
 * - Cost trend analysis
 * - Multi-provider cost aggregation
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateTenantAccess } from '@/lib/auth/tenant-access'
import { CostMonitoringService } from '@agency/cost/monitoring'

const costMonitor = new CostMonitoringService()

export async function GET(request: NextRequest) {
  try {
    // Validate tenant access and permissions
    const tenantContext = await validateTenantAccess(request)
    
    if (!tenantContext.isAuthenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const provider = searchParams.get('provider') as 'supabase' | 'vercel' | 'github' | undefined
    const period = searchParams.get('period') as 'daily' | 'monthly' | 'yearly' | undefined
    const includeAlerts = searchParams.get('includeAlerts') === 'true'

    // Get cost metrics
    const metrics = costMonitor.getMetrics(provider, period)
    
    // Get active alerts if requested
    const activeAlerts = includeAlerts ? costMonitor.getActiveAlerts() : []

    // Get cost summary
    const summary = costMonitor.getCostSummary()

    return NextResponse.json({
      success: true,
      data: {
        metrics,
        summary,
        activeAlerts: activeAlerts.slice(0, 10), // Limit to recent alerts
        lastUpdated: summary.lastUpdated
      }
    })

  } catch (error) {
    console.error('Cost monitoring API error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch cost monitoring data',
        code: 'COST_MONITORING_ERROR'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validate tenant access and permissions
    const tenantContext = await validateTenantAccess(request)
    
    if (!tenantContext.isAuthenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user has permission to add cost data
    if (!tenantContext.isPlatformAdmin) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    
    // Validate request body
    const metrics = Array.isArray(body.metrics) ? body.metrics : [body]
    
    if (!Array.isArray(metrics) || metrics.length === 0) {
      return NextResponse.json(
        { error: 'Invalid metrics data provided' },
        { status: 400 }
      )
    }

    // Add metrics to monitoring service
    costMonitor.addMetrics(metrics)

    return NextResponse.json({
      success: true,
      message: `Added ${metrics.length} cost metrics`,
      count: metrics.length
    })

  } catch (error) {
    console.error('Cost monitoring POST error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process cost metrics',
        code: 'COST_METRICS_ERROR'
      },
      { status: 500 }
    )
  }
}
