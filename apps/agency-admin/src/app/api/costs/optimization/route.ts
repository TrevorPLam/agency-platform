/**
 * Cost Optimization API Route
 * 
 * Provides cost optimization recommendations and analysis for the Agency Platform.
 * Integrates with the @agency/cost package for advanced optimization algorithms.
 * 
 * Features:
 * - Resource usage analysis
 * - Optimization recommendations
 * - ROI analysis
 * - Scaling pattern generation
 * - Automated optimization workflows
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateTenantAccess } from '@/lib/auth/tenant-access'
import { CostOptimizationEngine, type ResourceUsage } from '@agency/cost/optimization'

const optimizer = new CostOptimizationEngine()

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
    const analysisType = searchParams.get('type') as 'recommendations' | 'scaling' | 'roi' | 'all'
    const category = searchParams.get('category')

    // Simulate resource usage data (in production, this would come from monitoring)
    const usageData: ResourceUsage[] = [
      {
        type: 'compute',
        provider: 'vercel',
        service: 'pro_compute',
        current: 850,
        recommended: 600,
        unit: 'bandwidth_gb',
        efficiency: 71,
        potentialSavings: 45.00,
        priority: 'high',
        metadata: { current_usage: 850, optimal_usage: 600 }
      },
      {
        type: 'storage',
        provider: 'supabase',
        service: 'database_storage',
        current: 120,
        recommended: 80,
        unit: 'gb',
        efficiency: 67,
        potentialSavings: 28.50,
        priority: 'medium',
        metadata: { current_usage: 120, optimal_usage: 80 }
      },
      {
        type: 'ci_cd',
        provider: 'github',
        service: 'actions_linux',
        current: 4500,
        recommended: 3200,
        unit: 'minutes',
        efficiency: 71,
        potentialSavings: 35.20,
        priority: 'high',
        metadata: { current_usage: 4500, optimal_usage: 3200 }
      }
    ]

    let response: any = {}

    switch (analysisType) {
      case 'recommendations':
        response.recommendations = await optimizer.analyzeUsage(usageData)
        break
        
      case 'scaling':
        response.scalingPatterns = await optimizer.generateScalingPatterns([])
        break
        
      case 'roi':
        const recommendations = await optimizer.analyzeUsage(usageData)
        response.roi = optimizer.calculateROI(recommendations)
        break
        
      case 'all':
      default:
        response.recommendations = await optimizer.analyzeUsage(usageData)
        response.scalingPatterns = await optimizer.generateScalingPatterns([])
        response.roi = optimizer.calculateROI(response.recommendations)
        break
    }

    // Filter by category if specified
    if (category && response.recommendations) {
      response.recommendations = response.recommendations.filter((rec: any) => 
        rec.category === category
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        ...response,
        lastUpdated: new Date(),
        usageSummary: {
          totalResources: usageData.length,
          averageEfficiency: Math.round(usageData.reduce((sum, u) => sum + u.efficiency, 0) / usageData.length),
          totalPotentialSavings: usageData.reduce((sum, u) => sum + u.potentialSavings, 0)
        }
      }
    })

  } catch (error) {
    console.error('Cost optimization API error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to generate optimization analysis',
        code: 'COST_OPTIMIZATION_ERROR'
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

    // Check if user has permission to run optimization
    if (!tenantContext.isPlatformAdmin) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { usageData } = body

    if (!usageData || !Array.isArray(usageData)) {
      return NextResponse.json(
        { error: 'Valid usage data array is required' },
        { status: 400 }
      )
    }

    // Run optimization analysis
    const recommendations = await optimizer.analyzeUsage(usageData)
    const roi = optimizer.calculateROI(recommendations)

    return NextResponse.json({
      success: true,
      data: {
        recommendations,
        roi,
        summary: {
          totalRecommendations: recommendations.length,
          totalSavings: roi.totalSavings,
          paybackPeriod: roi.paybackPeriod,
          annualROI: roi.annualROI
        }
      }
    })

  } catch (error) {
    console.error('Cost optimization POST error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process optimization request',
        code: 'COST_OPTIMIZATION_ERROR'
      },
      { status: 500 }
    )
  }
}
