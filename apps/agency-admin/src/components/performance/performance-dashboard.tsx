/**
 * Performance monitoring dashboard component
 * 
 * Provides comprehensive view of Core Web Vitals, performance budgets,
 * and alerting for all tenant applications.
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@agency/ui'
import { Badge } from '@agency/ui'
import { Button } from '@agency/ui'
import { 
  usePerformanceData, 
  useWebVitals,
  usePerformanceBudgets,
  usePerformanceBudgetPresets,
  type PerformanceAlert,
  type PerformanceAggregation
} from '@agency/monitoring'

interface PerformanceDashboardProps {
  tenantId: string
}

export function PerformanceDashboard({ tenantId }: PerformanceDashboardProps) {
  const [selectedApp, setSelectedApp] = useState<string>('firm')
  const [selectedPeriod, setSelectedPeriod] = useState<'hourly' | 'daily' | 'weekly' | 'monthly'>('daily')
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([])

  // Initialize Web Vitals monitoring for dashboard
  const webVitalsMonitor = useWebVitals({
    tenantId: tenantId as any,
    enableRealUserMonitoring: false, // Disable for admin dashboard
  })

  const { data: performanceData, loading, error } = usePerformanceData(webVitalsMonitor, selectedPeriod)
  const { getAlerts } = usePerformanceBudgets(webVitalsMonitor)

  // Load alerts
  useEffect(() => {
    if (webVitalsMonitor) {
      const currentAlerts = getAlerts()
      setAlerts(currentAlerts)
    }
  }, [webVitalsMonitor, getAlerts])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-muted-foreground">Loading performance data...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-destructive">Error loading performance data: {error}</div>
      </div>
    )
  }

  if (!performanceData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-muted-foreground">No performance data available</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Monitoring</h2>
          <p className="text-muted-foreground">Core Web Vitals and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedApp}
            onChange={(e) => setSelectedApp(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="firm">Firm</option>
            <option value="riley-day-care">Riley Day Care</option>
            <option value="the-barber-cave">The Barber Cave</option>
          </select>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="hourly">Hourly</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Performance Alerts
              <Badge variant="destructive">{alerts.length}</Badge>
            </CardTitle>
            <CardDescription>Active performance budget violations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{alert.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {alert.metric.toUpperCase()}: {alert.currentValue} {alert.thresholdType === 'absolute' ? '>' : '<'} {alert.threshold}
                    </div>
                  </div>
                  <Badge variant={alert.severity === 'critical' ? 'destructive' : alert.severity === 'high' ? 'destructive' : 'secondary'}>
                    {alert.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Core Web Vitals Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <CoreWebVitalCard
          title="Largest Contentful Paint (LCP)"
          value={performanceData.avgLcp}
          unit="ms"
          threshold={2500}
          trend={performanceData.trends.lcp}
          description="Loading performance"
        />
        <CoreWebVitalCard
          title="Interaction to Next Paint (INP)"
          value={performanceData.avgInp}
          unit="ms"
          threshold={200}
          trend={performanceData.trends.inp}
          description="Responsiveness"
        />
        <CoreWebVitalCard
          title="Cumulative Layout Shift (CLS)"
          value={performanceData.avgCls}
          unit=""
          threshold={0.1}
          trend={performanceData.trends.cls}
          description="Visual stability"
        />
      </div>

      {/* Performance Rating Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Rating Distribution</CardTitle>
          <CardDescription>How users experience your site performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Good</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${(performanceData.ratingDistribution.good / performanceData.dataPoints) * 100}%` }}
                  />
                </div>
                <span className="text-sm text-muted-foreground">
                  {performanceData.ratingDistribution.good} ({Math.round((performanceData.ratingDistribution.good / performanceData.dataPoints) * 100)}%)
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Needs Improvement</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-500 h-2 rounded-full"
                    style={{ width: `${(performanceData.ratingDistribution.needsImprovement / performanceData.dataPoints) * 100}%` }}
                  />
                </div>
                <span className="text-sm text-muted-foreground">
                  {performanceData.ratingDistribution.needsImprovement} ({Math.round((performanceData.ratingDistribution.needsImprovement / performanceData.dataPoints) * 100)}%)
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Poor</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: `${(performanceData.ratingDistribution.poor / performanceData.dataPoints) * 100}%` }}
                  />
                </div>
                <span className="text-sm text-muted-foreground">
                  {performanceData.ratingDistribution.poor} ({Math.round((performanceData.ratingDistribution.poor / performanceData.dataPoints) * 100)}%)
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Trends</CardTitle>
          <CardDescription>How your performance metrics are changing over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <TrendItem
              label="LCP Trend"
              trend={performanceData.trends.lcp}
              description="Loading performance trend"
            />
            <TrendItem
              label="INP Trend"
              trend={performanceData.trends.inp}
              description="Responsiveness trend"
            />
            <TrendItem
              label="CLS Trend"
              trend={performanceData.trends.cls}
              description="Visual stability trend"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Core Web Vital metric card
 */
function CoreWebVitalCard({
  title,
  value,
  unit,
  threshold,
  trend,
  description,
}: {
  title: string
  value: number
  unit: string
  threshold: number
  trend: { direction: 'up' | 'down' | 'stable'; percentageChange: number }
  description: string
}) {
  const rating = value <= threshold ? 'good' : value <= threshold * 1.6 ? 'needs-improvement' : 'poor'
  const ratingColor = rating === 'good' ? 'text-green-600' : rating === 'needs-improvement' ? 'text-yellow-600' : 'text-red-600'
  const trendIcon = trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'
  const trendColor = trend.direction === 'up' ? 'text-red-600' : trend.direction === 'down' ? 'text-green-600' : 'text-gray-600'

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className={`text-2xl font-bold ${ratingColor}`}>
            {value.toLocaleString()}{unit}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className={trendColor}>
              {trendIcon} {Math.abs(trend.percentageChange).toFixed(1)}%
            </span>
            <span className="text-muted-foreground">vs last period</span>
          </div>
          <Badge variant={rating === 'good' ? 'default' : rating === 'needs-improvement' ? 'secondary' : 'destructive'}>
            {rating === 'good' ? 'Good' : rating === 'needs-improvement' ? 'Needs Improvement' : 'Poor'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Trend item component
 */
function TrendItem({
  label,
  trend,
  description,
}: {
  label: string
  trend: { direction: 'up' | 'down' | 'stable'; percentageChange: number }
  description: string
}) {
  const trendIcon = trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'
  const trendColor = trend.direction === 'up' ? 'text-red-600' : trend.direction === 'down' ? 'text-green-600' : 'text-gray-600'
  const trendLabel = trend.direction === 'up' ? 'worsened' : trend.direction === 'down' ? 'improved' : 'stable'

  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="font-medium">{label}</div>
        <div className="text-sm text-muted-foreground">{description}</div>
      </div>
      <div className="text-right">
        <div className={`flex items-center gap-1 ${trendColor}`}>
          <span>{trendIcon}</span>
          <span>{Math.abs(trend.percentageChange).toFixed(1)}%</span>
        </div>
        <div className="text-sm text-muted-foreground">{trendLabel}</div>
      </div>
    </div>
  )
}
