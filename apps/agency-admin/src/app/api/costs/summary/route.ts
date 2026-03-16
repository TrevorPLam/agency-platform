import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@agency/database/admin'

export async function GET(request: NextRequest) {
  try {
    const admin = getAdminClient()
    
    // Get current tenant from request context
    const searchParams = request.nextUrl.searchParams
    const tenantId = searchParams.get('tenant_id')
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      )
    }

    // Get cost summary for the tenant
    const { data, error } = await admin
      .rpc('get_tenant_cost_summary', { 
        p_tenant_id: tenantId, 
        p_days: 7 
      })

    if (error) {
      console.error('Error fetching cost summary:', error)
      return NextResponse.json(
        { error: 'Failed to fetch cost summary' },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      return NextResponse.json({
        totalCost: 0,
        storageCost: 0,
        cicdCost: 0,
        bandwidthCost: 0,
        averageDailyCost: 0,
        trendDirection: 'stable' as const,
        trendPercentage: 0,
      })
    }

    const summary = data[0]

    return NextResponse.json({
      totalCost: parseFloat(summary.total_cost) || 0,
      storageCost: parseFloat(summary.storage_cost) || 0,
      cicdCost: parseFloat(summary.cicd_cost) || 0,
      bandwidthCost: parseFloat(summary.bandwidth_cost) || 0,
      averageDailyCost: parseFloat(summary.average_daily_cost) || 0,
      trendDirection: summary.trend_direction || 'stable',
      trendPercentage: parseFloat(summary.trend_percentage) || 0,
    })
  } catch (error) {
    console.error('Error in cost summary API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
