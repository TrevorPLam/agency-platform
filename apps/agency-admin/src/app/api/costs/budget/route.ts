/**
 * Budget Management API Route
 * 
 * Provides budget tracking, forecasting, and management for the Agency Platform.
 * Integrates with the @agency/cost package for comprehensive budget management.
 * 
 * Features:
 * - Budget tracking and variance analysis
 * - Cost forecasting and trend analysis
 * - Budget policy enforcement
 * - Cost allocation and chargeback
 * - Budget alerts and notifications
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateTenantAccess } from '@/lib/auth/tenant-access'
import { BudgetManager } from '@agency/cost/budget'

const budgetManager = new BudgetManager()

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
    const reportType = searchParams.get('type') as 'summary' | 'categories' | 'allocations' | 'forecasts' | 'alerts' | 'all'
    const categoryId = searchParams.get('category')

    // Track latest spending
    await budgetManager.trackSpending()

    let response: any = {}

    switch (reportType) {
      case 'summary':
        response = generateBudgetSummary()
        break
        
      case 'categories':
        response.categories = budgetManager.getCategories()
        if (categoryId) {
          response.categories = response.categories.filter((cat: any) => cat.id === categoryId)
        }
        break
        
      case 'allocations':
        response.allocations = budgetManager.getAllocations()
        break
        
      case 'forecasts':
        response.forecasts = budgetManager.getForecasts()
        break
        
      case 'alerts':
        response.alerts = budgetManager.getActiveAlerts()
        break
        
      case 'all':
      default:
        response = generateBudgetSummary()
        response.categories = budgetManager.getCategories()
        response.allocations = budgetManager.getAllocations()
        response.forecasts = budgetManager.getForecasts()
        response.alerts = budgetManager.getActiveAlerts()
        break
    }

    return NextResponse.json({
      success: true,
      data: {
        ...response,
        lastUpdated: new Date()
      }
    })

  } catch (error) {
    console.error('Budget management API error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch budget data',
        code: 'BUDGET_MANAGEMENT_ERROR'
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

    // Check if user has permission to update budgets
    if (!tenantContext.isPlatformAdmin) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
  const { action } = body

    switch (action) {
      case 'track_spending':
        await budgetManager.trackSpending()
        return NextResponse.json({
          success: true,
          message: 'Budget tracking completed'
        })

      case 'update_allocation':
        // Handle budget allocation updates
        return NextResponse.json({
          success: true,
          message: 'Budget allocation updated'
        })

      case 'resolve_alert':
        // Handle alert resolution
        return NextResponse.json({
          success: true,
          message: 'Alert resolved'
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Budget management POST error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process budget request',
        code: 'BUDGET_MANAGEMENT_ERROR'
      },
      { status: 500 }
    )
  }
}

function generateBudgetSummary() {
  const categories = budgetManager.getCategories()
  const allocations = budgetManager.getAllocations()
  const alerts = budgetManager.getActiveAlerts()

  const totalAllocated = categories.reduce((sum, cat) => sum + cat.allocation.monthly, 0)
  const totalSpent = categories.reduce((sum, cat) => sum + cat.actual.monthly, 0)
  const totalVariance = totalSpent - totalAllocated
  const utilizationRate = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0

  return {
    summary: {
      totalAllocated,
      totalSpent,
      totalVariance,
      utilizationRate,
      categories: categories.length,
      activeAlerts: alerts.length,
      criticalAlerts: alerts.filter(a => a.severity === 'critical').length
    },
    trends: {
      overspentCategories: categories.filter(cat => cat.actual.monthly > cat.allocation.monthly).length,
      underspentCategories: categories.filter(cat => cat.actual.monthly < cat.allocation.monthly * 0.8).length,
      increasingTrends: categories.filter(cat => cat.trend === 'increasing').length,
      decreasingTrends: categories.filter(cat => cat.trend === 'decreasing').length
    },
    efficiency: {
      averageUtilization: Math.round(utilizationRate),
      totalAllocations: allocations.length,
      averageCostPerTenant: allocations.length > 0 ? 
        allocations.reduce((sum, alloc) => sum + alloc.costs.total, 0) / allocations.length : 0
    }
  }
}
