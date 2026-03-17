/**
 * Security Monitoring API Route
 * 
 * Provides endpoints for security monitoring, alerts, and metrics
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSecurityMonitor, SecurityAlert, SecurityMetrics } from '@agency/security/monitoring'

/**
 * GET /api/security/monitoring
 * Get current security metrics and monitoring status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    const monitor = getSecurityMonitor()

    switch (action) {
      case 'metrics':
        const metrics = monitor.getMetrics()
        return NextResponse.json(metrics)

      case 'alerts':
        const alerts = monitor.getUnresolvedAlerts()
        return NextResponse.json({ alerts })

      case 'status':
        const status = monitor.getMonitoringStatus()
        return NextResponse.json(status)

      case 'trends':
        const application = searchParams.get('application')
        const days = parseInt(searchParams.get('days') || '7')
        
        if (!application) {
          return NextResponse.json(
            { error: 'Application parameter is required for trends' },
            { status: 400 }
          )
        }

        const trends = monitor.getApplicationTrends(application, days)
        return NextResponse.json({ trends })

      default:
        // Return comprehensive monitoring data
        const comprehensiveData = {
          metrics: monitor.getMetrics(),
          alerts: monitor.getUnresolvedAlerts(),
          status: monitor.getMonitoringStatus()
        }
        return NextResponse.json(comprehensiveData)
    }
  } catch (error) {
    console.error('Security monitoring API error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve monitoring data' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/security/monitoring
 * Control monitoring system and manage alerts
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...params } = body

    const monitor = getSecurityMonitor()

    switch (action) {
      case 'start':
        monitor.startMonitoring()
        return NextResponse.json({ 
          message: 'Security monitoring started',
          status: monitor.getMonitoringStatus()
        })

      case 'stop':
        monitor.stopMonitoring()
        return NextResponse.json({ 
          message: 'Security monitoring stopped',
          status: monitor.getMonitoringStatus()
        })

      case 'resolve-alert':
        const { alertId, resolvedBy } = params
        
        if (!alertId || !resolvedBy) {
          return NextResponse.json(
            { error: 'alertId and resolvedBy are required' },
            { status: 400 }
          )
        }

        monitor.resolveAlert(alertId, resolvedBy)
        return NextResponse.json({ 
          message: 'Alert resolved successfully',
          alert: { id: alertId, resolved: true, resolvedBy, resolvedAt: new Date() }
        })

      case 'update-config':
        const config = params.config
        
        if (!config) {
          return NextResponse.json(
            { error: 'Configuration is required' },
            { status: 400 }
          )
        }

        monitor.updateConfig(config)
        return NextResponse.json({ 
          message: 'Monitoring configuration updated',
          config: config
        })

      case 'scan-now':
        // Trigger immediate scan
        await monitor['performSecurityScan']() // Access private method for immediate scan
        return NextResponse.json({ 
          message: 'Security scan initiated',
          metrics: monitor.getMetrics()
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Security monitoring POST error:', error)
    return NextResponse.json(
      { error: 'Failed to process monitoring request' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/security/monitoring
 * Update monitoring configuration
 */
export async function PUT(request: NextRequest) {
  try {
    const config = await request.json()
    
    if (!config) {
      return NextResponse.json(
        { error: 'Configuration is required' },
        { status: 400 }
      )
    }

    const monitor = getSecurityMonitor()
    monitor.updateConfig(config)

    return NextResponse.json({
      message: 'Monitoring configuration updated successfully',
      config
    })
  } catch (error) {
    console.error('Security monitoring PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to update configuration' },
      { status: 500 }
    )
  }
}
