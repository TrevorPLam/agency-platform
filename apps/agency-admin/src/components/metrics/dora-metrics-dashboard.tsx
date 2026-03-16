'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@agency/ui'
import { Badge } from '@agency/ui'
import { Progress } from '@agency/ui'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@agency/ui'
import { 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Activity,
  BarChart3,
  LineChart,
  PieChart
} from 'lucide-react'

interface DORAMetrics {
  deploymentFrequency: number
  leadTimeForChanges: number
  changeFailureRate: number
  meanTimeToRecovery: number
}

interface PerformanceLevel {
  level: 'Elite' | 'High' | 'Medium' | 'Low'
  minThreshold: number
  maxThreshold: number
  description: string
}

interface MetricsResult {
  metrics: DORAMetrics
  performanceLevels: Record<string, PerformanceLevel>
  period: {
    start: string
    end: string
  }
  dataPoints: {
    deployments: number
    incidents: number
    pullRequests: number
  }
  calculatedAt: string
}

const performanceBadgeColors = {
  Elite: 'default',
  High: 'secondary',
  Medium: 'outline',
  Low: 'destructive'
} as const

export function DORAMetricsDashboard() {
  const [metrics, setMetrics] = useState<MetricsResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMetrics()
  }, [])

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/metrics/dora')
      
      if (!response.ok) {
        throw new Error('Failed to fetch metrics')
      }
      
      const data = await response.json()
      setMetrics(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-2">
              <div className="h-4 bg-muted rounded w-1/4"></div>
              <div className="h-8 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Error Loading Metrics
          </CardTitle>
          <CardDescription>
            {error}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <button 
            onClick={fetchMetrics}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Retry
          </button>
        </CardContent>
      </Card>
    )
  }

  if (!metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Metrics Available</CardTitle>
          <CardDescription>
            Metrics calculation is in progress or no data is available for the selected time period.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const metricCards = [
    {
      title: 'Deployment Frequency',
      value: metrics.metrics.deploymentFrequency,
      unit: 'deployments/week',
      description: 'How often code is deployed to production',
      icon: TrendingUp,
      performanceLevel: metrics.performanceLevels['deployment-frequency'],
      benchmark: {
        Elite: 7,
        High: 1,
        Medium: 0.25,
        Low: 0
      }
    },
    {
      title: 'Lead Time for Changes',
      value: metrics.metrics.leadTimeForChanges,
      unit: 'hours',
      description: 'Time from commit to production deployment',
      icon: Clock,
      performanceLevel: metrics.performanceLevels['lead-time-for-changes'],
      benchmark: {
        Elite: 24,
        High: 168,
        Medium: 720,
        Low: Infinity
      }
    },
    {
      title: 'Change Failure Rate',
      value: metrics.metrics.changeFailureRate,
      unit: '%',
      description: 'Percentage of deployments that cause failures',
      icon: AlertTriangle,
      performanceLevel: metrics.performanceLevels['change-failure-rate'],
      benchmark: {
        Elite: 15,
        High: 30,
        Medium: 46,
        Low: 100
      }
    },
    {
      title: 'Mean Time to Recovery',
      value: metrics.metrics.meanTimeToRecovery,
      unit: 'hours',
      description: 'Time to restore service after failure',
      icon: CheckCircle,
      performanceLevel: metrics.performanceLevels['mean-time-to-recovery'],
      benchmark: {
        Elite: 1,
        High: 24,
        Medium: 168,
        Low: Infinity
      }
    }
  ]

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((metric) => {
          const Icon = metric.icon
          const progress = metric.performanceLevel.level === 'Elite' ? 100 :
                         metric.performanceLevel.level === 'High' ? 75 :
                         metric.performanceLevel.level === 'Medium' ? 50 : 25
          
          return (
            <Card key={metric.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {metric.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">
                      {metric.value}
                    </div>
                    <Badge variant={performanceBadgeColors[metric.performanceLevel.level]}>
                      {metric.performanceLevel.level}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {metric.unit}
                  </div>
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {metric.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Detailed Views */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Data Points
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Deployments</span>
                  <span className="font-mono">{metrics.dataPoints.deployments}</span>
                </div>
                <div className="flex justify-between">
                  <span>Incidents</span>
                  <span className="font-mono">{metrics.dataPoints.incidents}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pull Requests</span>
                  <span className="font-mono">{metrics.dataPoints.pullRequests}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Performance Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(metrics.performanceLevels).map(([metric, level]) => (
                  <div key={metric} className="flex justify-between items-center">
                    <span className="text-sm capitalize">
                      {metric.replace('-', ' ')}
                    </span>
                    <Badge variant={performanceBadgeColors[level.level]}>
                      {level.level}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5" />
                Performance Trends
              </CardTitle>
              <CardDescription>
                Historical performance over time (Last 90 days)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Trend charts will be implemented with historical data
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="benchmarks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Industry Benchmarks
              </CardTitle>
              <CardDescription>
                How your performance compares to DORA industry standards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {metricCards.map((metric) => (
                  <div key={metric.title} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{metric.title}</span>
                      <Badge variant={performanceBadgeColors[metric.performanceLevel.level]}>
                        {metric.performanceLevel.level}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      {Object.entries(metric.benchmark).map(([level, threshold]) => (
                        <div 
                          key={level}
                          className={`p-2 rounded text-center ${
                            level === metric.performanceLevel.level 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted'
                          }`}
                        >
                          <div className="font-medium">{level}</div>
                          <div>
                            {level === 'Low' && metric.title === 'Lead Time for Changes' ? '>1 month' :
                             level === 'Low' && metric.title === 'Mean Time to Recovery' ? '>1 week' :
                             level === 'Low' && metric.title === 'Change Failure Rate' ? '>46%' :
                             threshold === Infinity ? 'N/A' :
                             metric.title.includes('Rate') ? `≤${threshold}%` :
                             metric.unit === 'hours' ? `≤${threshold}h` :
                             `≥${threshold}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Calculation Details</CardTitle>
              <CardDescription>
                Technical details about how metrics were calculated
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-2">Time Period</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>Start: {new Date(metrics.period.start).toLocaleDateString()}</div>
                    <div>End: {new Date(metrics.period.end).toLocaleDateString()}</div>
                    <div>Calculated: {new Date(metrics.calculatedAt).toLocaleString()}</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Methodology</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>• Deployment Frequency: Successful deployments per week</div>
                    <div>• Lead Time: Commit to production deployment time</div>
                    <div>• Failure Rate: Failed deployments ÷ total deployments</div>
                    <div>• MTTR: Average time to restore service</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
