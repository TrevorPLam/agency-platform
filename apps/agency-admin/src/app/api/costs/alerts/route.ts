import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@agency/database/admin'
import { captureServerEvent } from '@agency/analytics/server'

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
    const admin = getAdminClient()
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const tenantId = searchParams.get('tenant_id')
    const active = searchParams.get('active')
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      )
    }

    // Build query
    let query = admin
      .from('budget_alerts')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    // Filter by active status if specified
    if (active !== null) {
      query = query.eq('active', active === 'true')
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching budget alerts:', error)
      return NextResponse.json(
        { error: 'Failed to fetch budget alerts' },
        { status: 500 }
      )
    }

    // Transform data to match expected format
    const alerts = (data || []).map(alert => ({
      id: alert.id,
      tenantId: alert.tenant_id,
      name: alert.name,
      category: alert.category,
      threshold: parseFloat(alert.threshold) || 0,
      current: parseFloat(alert.current) || 0,
      thresholdType: alert.threshold_type,
      severity: alert.severity,
      active: alert.active,
      notificationChannels: alert.notification_channels || [],
      lastTriggered: alert.last_triggered,
      createdAt: alert.created_at,
      updatedAt: alert.updated_at,
    }))

    // Capture analytics event for cost alerts view
    const tenantSlug = await getTenantSlug(tenantId)
    if (tenantSlug) {
      try {
        captureServerEvent(
          'system',
          'costs:alerts_viewed',
          {
            tenant: tenantSlug,
            alerts_count: alerts.length,
            active_filter: active === 'true' ? 'active' : active === 'false' ? 'inactive' : 'all',
          }
        )
      } catch (analyticsError) {
        console.error('Failed to capture cost alerts analytics:', analyticsError)
      }
    }

    return NextResponse.json(alerts)
  } catch (error) {
    console.error('Error in budget alerts API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = getAdminClient()
    const body = await request.json()
    
    const {
      tenantId,
      name,
      category,
      threshold,
      thresholdType = 'absolute',
      severity = 'medium',
      active = true,
      notificationChannels = [],
    } = body

    if (!tenantId || !name || !category || threshold === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: tenantId, name, category, threshold' },
        { status: 400 }
      )
    }

    // Validate category
    const validCategories = ['storage', 'compute', 'bandwidth', 'total']
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate severity
    const validSeverities = ['low', 'medium', 'high', 'critical']
    if (!validSeverities.includes(severity)) {
      return NextResponse.json(
        { error: `Invalid severity. Must be one of: ${validSeverities.join(', ')}` },
        { status: 400 }
      )
    }

    // Insert new alert
    const { data, error } = await admin
      .from('budget_alerts')
      .insert({
        tenant_id: tenantId,
        name,
        category,
        threshold,
        threshold_type: thresholdType,
        severity,
        active,
        notification_channels: notificationChannels,
        current: 0, // Initialize current value
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating budget alert:', error)
      return NextResponse.json(
        { error: 'Failed to create budget alert' },
        { status: 500 }
      )
    }

    const alert = {
      id: data.id,
      tenantId: data.tenant_id,
      name: data.name,
      category: data.category,
      threshold: parseFloat(data.threshold) || 0,
      current: parseFloat(data.current) || 0,
      thresholdType: data.threshold_type,
      severity: data.severity,
      active: data.active,
      notificationChannels: data.notification_channels || [],
      lastTriggered: data.last_triggered,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }

    // Capture analytics event for cost alert creation
    const tenantSlug = await getTenantSlug(tenantId)
    if (tenantSlug) {
      try {
        captureServerEvent(
          'system',
          'costs:alert_created',
          {
            tenant: tenantSlug,
            category,
            severity,
            threshold_type: thresholdType,
            active,
          }
        )
      } catch (analyticsError) {
        console.error('Failed to capture cost alert creation analytics:', analyticsError)
      }
    }

    return NextResponse.json(alert, { status: 201 })
  } catch (error) {
    console.error('Error in budget alerts POST API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
