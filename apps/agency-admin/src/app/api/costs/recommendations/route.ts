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
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      )
    }

    // Build query
    let query = admin
      .from('optimization_recommendations')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    // Filter by status if specified
    if (status) {
      query = query.eq('status', status)
    }

    // Filter by priority if specified
    if (priority) {
      query = query.eq('priority', priority)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching optimization recommendations:', error)
      return NextResponse.json(
        { error: 'Failed to fetch optimization recommendations' },
        { status: 500 }
      )
    }

    // Transform data to match expected format
    const recommendations = (data || []).map(rec => ({
      id: rec.id,
      tenantId: rec.tenant_id,
      category: rec.category,
      title: rec.title,
      description: rec.description,
      estimatedSavings: parseFloat(rec.estimated_savings) || 0,
      difficulty: rec.difficulty,
      priority: rec.priority,
      status: rec.status,
      createdAt: rec.created_at,
      reviewBy: rec.review_by,
    }))

    // Capture analytics event for cost recommendations view
    const tenantSlug = await getTenantSlug(tenantId)
    if (tenantSlug) {
      try {
        captureServerEvent(
          'system',
          'costs:recommendations_viewed',
          {
            tenant: tenantSlug,
            recommendations_count: recommendations.length,
            status_filter: status || 'all',
            priority_filter: priority || 'all',
          }
        )
      } catch (analyticsError) {
        console.error('Failed to capture cost recommendations analytics:', analyticsError)
      }
    }

    return NextResponse.json(recommendations)
  } catch (error) {
    console.error('Error in optimization recommendations API:', error)
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
      category,
      title,
      description,
      estimatedSavings = 0,
      difficulty = 'medium',
      priority = 'medium',
      status = 'pending',
      reviewBy,
    } = body

    if (!tenantId || !category || !title || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: tenantId, category, title, description' },
        { status: 400 }
      )
    }

    // Validate category
    const validCategories = ['storage', 'compute', 'bandwidth', 'general']
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate difficulty
    const validDifficulties = ['easy', 'medium', 'hard']
    if (!validDifficulties.includes(difficulty)) {
      return NextResponse.json(
        { error: `Invalid difficulty. Must be one of: ${validDifficulties.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high']
    if (!validPriorities.includes(priority)) {
      return NextResponse.json(
        { error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate status
    const validStatuses = ['pending', 'in_progress', 'completed', 'dismissed']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    // Insert new recommendation
    const { data, error } = await admin
      .from('optimization_recommendations')
      .insert({
        tenant_id: tenantId,
        category,
        title,
        description,
        estimated_savings: estimatedSavings,
        difficulty,
        priority,
        status,
        review_by: reviewBy,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating optimization recommendation:', error)
      return NextResponse.json(
        { error: 'Failed to create optimization recommendation' },
        { status: 500 }
      )
    }

    const recommendation = {
      id: data.id,
      tenantId: data.tenant_id,
      category: data.category,
      title: data.title,
      description: data.description,
      estimatedSavings: parseFloat(data.estimated_savings) || 0,
      difficulty: data.difficulty,
      priority: data.priority,
      status: data.status,
      createdAt: data.created_at,
      reviewBy: data.review_by,
    }

    // Capture analytics event for cost recommendation creation
    const tenantSlug = await getTenantSlug(tenantId)
    if (tenantSlug) {
      try {
        captureServerEvent(
          'system',
          'costs:recommendation_created',
          {
            tenant: tenantSlug,
            category,
            difficulty,
            priority,
            status,
          }
        )
      } catch (analyticsError) {
        console.error('Failed to capture cost recommendation creation analytics:', analyticsError)
      }
    }

    return NextResponse.json(recommendation, { status: 201 })
  } catch (error) {
    console.error('Error in optimization recommendations POST API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = getAdminClient()
    const body = await request.json()
    
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: id, status' },
        { status: 400 }
      )
    }

    // Validate status
    const validStatuses = ['pending', 'in_progress', 'completed', 'dismissed']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    // Update recommendation status
    const { data, error } = await admin
      .from('optimization_recommendations')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating optimization recommendation:', error)
      return NextResponse.json(
        { error: 'Failed to update optimization recommendation' },
        { status: 500 }
      )
    }

    const recommendation = {
      id: data.id,
      tenantId: data.tenant_id,
      category: data.category,
      title: data.title,
      description: data.description,
      estimatedSavings: parseFloat(data.estimated_savings) || 0,
      difficulty: data.difficulty,
      priority: data.priority,
      status: data.status,
      createdAt: data.created_at,
      reviewBy: data.review_by,
    }

    // Capture analytics event for cost recommendation update
    if (data.tenant_id) {
      const tenantSlug = await getTenantSlug(data.tenant_id)
      if (tenantSlug) {
        try {
          captureServerEvent(
            'system',
            'costs:recommendation_updated',
            {
              tenant: tenantSlug,
              new_status: status,
              category: data.category,
            }
          )
        } catch (analyticsError) {
          console.error('Failed to capture cost recommendation update analytics:', analyticsError)
        }
      }
    }

    return NextResponse.json(recommendation)
  } catch (error) {
    console.error('Error in optimization recommendations PATCH API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
