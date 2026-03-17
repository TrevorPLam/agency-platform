import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@agency/database/admin'
import { captureServerEvent } from '@agency/analytics/server'
import { validateTenantAccess } from '@/lib/auth'

// Helper function to resolve tenant slug from tenant_id
async function getTenantSlug(tenantId: string): Promise<string | null> {
  try {
    const admin = getAdminClient()
    const { data } = await admin
      .from('tenants')
      .select('slug')
      .eq('id', tenantId)
      .single()
    return data?.slug || null
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate and validate tenant access
    const auth = await validateTenantAccess(request)
    
    // Get tenant ID from authenticated user (not from query params)
    const searchParams = request.nextUrl.searchParams
    const requestedTenantId = searchParams.get('tenant_id')
    
    // For platform admins, allow specifying tenant_id in query params
    // For regular users, always use their assigned tenant
    const tenantId = auth.isPlatformAdmin && requestedTenantId 
      ? requestedTenantId 
      : auth.tenantId

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      )
    }

    // Get cost summary for the tenant
    const admin = getAdminClient()
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

    // Capture analytics event for cost summary view
    const tenantSlug = await getTenantSlug(tenantId)
    if (tenantSlug) {
      try {
        captureServerEvent(
          'system', // Use system as distinctId for operational events
          'costs:summary_viewed',
          {
            tenant: tenantSlug,
            period_days: 7,
            has_data: !!summary,
            trend_direction: summary?.trend_direction || 'stable',
          }
        )
      } catch (analyticsError) {
        // Log analytics error but don't fail the API
        console.error('Failed to capture cost summary analytics:', analyticsError)
      }
    }

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
    
    // Return appropriate error codes based on error type
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json(
          { error: error.message },
          { status: 401 }
        )
      }
      if (error.message.includes('Forbidden')) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
