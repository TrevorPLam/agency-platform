/**
 * Performance metrics API route
 * 
 * Provides aggregated performance data for the dashboard
 * Supports tenant isolation and multi-app data aggregation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@agency/database/admin'
import { validateTenantAccess } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Validate tenant access
    const authResult = await validateTenantAccess(request)
    if (!authResult) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { tenantId, isPlatformAdmin } = authResult
    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const app = searchParams.get('app') || 'firm'
    const period = (searchParams.get('period') as 'hourly' | 'daily' | 'weekly' | 'monthly') || 'daily'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Create database client
    const supabase = createClient()

    if (!isPlatformAdmin && !tenantId) {
      return NextResponse.json(
        { error: 'Tenant context is required' },
        { status: 400 }
      )
    }

    const tenantFilter = isPlatformAdmin ? app : tenantId

    if (!tenantFilter) {
      return NextResponse.json(
        { error: 'Tenant context is required' },
        { status: 400 }
      )
    }

    // Build query for performance metrics
    let query = supabase
      .from('web_vitals_metrics')
      .select('*')
      .eq('tenant_id', tenantFilter)

    // Apply date range filter
    if (startDate) {
      query = query.gte('timestamp', startDate)
    }
    if (endDate) {
      query = query.lte('timestamp', endDate)
    }

    // Apply period filtering
    const now = new Date()
    let periodStartDate: Date

    switch (period) {
      case 'hourly':
        periodStartDate = new Date(now.getTime() - 24 * 60 * 60 * 1000) // Last 24 hours
        break
      case 'daily':
        periodStartDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        break
      case 'weekly':
        periodStartDate = new Date(now.getTime() - 4 * 7 * 24 * 60 * 60 * 1000) // Last 4 weeks
        break
      case 'monthly':
        periodStartDate = new Date(now.getTime() - 12 * 30 * 24 * 60 * 60 * 1000) // Last 12 months
        break
      default:
        periodStartDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    }

    query = query.gte('timestamp', periodStartDate.toISOString())

    const { data: metrics, error } = await query.order('timestamp', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch performance metrics' },
        { status: 500 }
      )
    }

    if (!metrics || metrics.length === 0) {
      // Return empty aggregation if no data
      return NextResponse.json({
        period,
        avgLcp: 0,
        avgInp: 0,
        avgCls: 0,
        ratingDistribution: { good: 0, needsImprovement: 0, poor: 0 },
        trends: {
          lcp: { direction: 'stable', percentageChange: 0 },
          inp: { direction: 'stable', percentageChange: 0 },
          cls: { direction: 'stable', percentageChange: 0 },
        },
        dataPoints: 0,
        timestamp: new Date().toISOString(),
      })
    }

    // Calculate aggregations
    const aggregation = calculatePerformanceAggregation(metrics, period)

    return NextResponse.json(aggregation)

  } catch (error) {
    console.error('Performance metrics API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Calculate performance aggregation from raw metrics
 */
function calculatePerformanceAggregation(
  metrics: any[],
  period: 'hourly' | 'daily' | 'weekly' | 'monthly'
) {
  // Filter out incomplete metrics (where some vitals are 0)
  const completeMetrics = metrics.filter(m => 
    m.lcp > 0 && m.inp > 0 && m.cls > 0
  )

  if (completeMetrics.length === 0) {
    return {
      period,
      avgLcp: 0,
      avgInp: 0,
      avgCls: 0,
      ratingDistribution: { good: 0, needsImprovement: 0, poor: 0 },
      trends: {
        lcp: { direction: 'stable', percentageChange: 0 },
        inp: { direction: 'stable', percentageChange: 0 },
        cls: { direction: 'stable', percentageChange: 0 },
      },
      dataPoints: 0,
      timestamp: new Date().toISOString(),
    }
  }

  // Calculate averages
  const avgLcp = completeMetrics.reduce((sum, m) => sum + m.lcp, 0) / completeMetrics.length
  const avgInp = completeMetrics.reduce((sum, m) => sum + m.inp, 0) / completeMetrics.length
  const avgCls = completeMetrics.reduce((sum, m) => sum + m.cls, 0) / completeMetrics.length

  // Calculate rating distribution
  const ratingDistribution = completeMetrics.reduce(
    (acc, m) => {
      acc[m.rating === 'good' ? 'good' : m.rating === 'needs-improvement' ? 'needsImprovement' : 'poor']++
      return acc
    },
    { good: 0, needsImprovement: 0, poor: 0 }
  )

  // Calculate trends (compare with previous period)
  const trends = calculateTrends(completeMetrics, period)

  return {
    period,
    avgLcp: Math.round(avgLcp),
    avgInp: Math.round(avgInp),
    avgCls: Math.round(avgCls * 100) / 100, // Round to 2 decimal places
    ratingDistribution,
    trends,
    dataPoints: completeMetrics.length,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Calculate trends by comparing current period with previous period
 */
function calculateTrends(
  metrics: any[],
  _period: 'hourly' | 'daily' | 'weekly' | 'monthly'
) {
  // Split metrics into current and previous periods
  const midpoint = Math.floor(metrics.length / 2)
  const currentPeriod = metrics.slice(0, midpoint)
  const previousPeriod = metrics.slice(midpoint)

  if (previousPeriod.length === 0) {
    return {
      lcp: { direction: 'stable', percentageChange: 0 },
      inp: { direction: 'stable', percentageChange: 0 },
      cls: { direction: 'stable', percentageChange: 0 },
    }
  }

  // Calculate averages for both periods
  const currentAvg = {
    lcp: currentPeriod.reduce((sum, m) => sum + m.lcp, 0) / currentPeriod.length,
    inp: currentPeriod.reduce((sum, m) => sum + m.inp, 0) / currentPeriod.length,
    cls: currentPeriod.reduce((sum, m) => sum + m.cls, 0) / currentPeriod.length,
  }

  const previousAvg = {
    lcp: previousPeriod.reduce((sum, m) => sum + m.lcp, 0) / previousPeriod.length,
    inp: previousPeriod.reduce((sum, m) => sum + m.inp, 0) / previousPeriod.length,
    cls: previousPeriod.reduce((sum, m) => sum + m.cls, 0) / previousPeriod.length,
  }

  // Calculate percentage changes and directions
  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return { direction: 'stable', percentageChange: 0 }
    
    const percentageChange = ((current - previous) / previous) * 100
    const direction = Math.abs(percentageChange) < 5 ? 'stable' : percentageChange > 0 ? 'up' : 'down'
    
    return { direction, percentageChange: Math.abs(percentageChange) }
  }

  return {
    lcp: calculateTrend(currentAvg.lcp, previousAvg.lcp),
    inp: calculateTrend(currentAvg.inp, previousAvg.inp),
    cls: calculateTrend(currentAvg.cls, previousAvg.cls),
  }
}
