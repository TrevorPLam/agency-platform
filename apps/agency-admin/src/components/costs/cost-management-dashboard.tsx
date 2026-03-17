'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Badge,
  Button,
  Alert,
  AlertDescription,
  AlertTitle,
  Progress,
} from '@agency/ui'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  HardDrive, 
  Cpu, 
  Wifi,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Lightbulb
} from 'lucide-react'
import type {
  CostSummary,
  CostMetrics,
  BudgetAlert,
  OptimizationRecommendation,
  HTTP_STATUS,
  AuthenticationError,
  AuthorizationError,
  NetworkError,
} from '@/types/cost-api'


export function CostManagementDashboard() {
  const [costSummary, setCostSummary] = useState<CostSummary | null>(null)
  const [metrics, setMetrics] = useState<CostMetrics[]>([])
  const [alerts, setAlerts] = useState<BudgetAlert[]>([])
  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCostData()
  }, [])

  const fetchCostData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch cost summary with proper error handling
      const summaryResponse = await fetch('/api/costs/summary')
      if (!summaryResponse.ok) {
        // Handle different error types appropriately
        if (summaryResponse.status === HTTP_STATUS.UNAUTHORIZED) {
          throw new AuthenticationError('Please log in again to access cost data.')
        }
        if (summaryResponse.status === HTTP_STATUS.FORBIDDEN) {
          throw new AuthorizationError('You do not have permission to access cost data.')
        }
        throw new NetworkError(`Failed to fetch cost summary (${summaryResponse.status})`)
      }
      const summaryData = await summaryResponse.json()
      setCostSummary(summaryData)

      // Fetch metrics with proper error handling
      const metricsResponse = await fetch('/api/costs/metrics')
      if (!metricsResponse.ok) {
        if (metricsResponse.status === HTTP_STATUS.UNAUTHORIZED) {
          throw new AuthenticationError('Please log in again to access metrics data.')
        }
        if (metricsResponse.status === HTTP_STATUS.FORBIDDEN) {
          throw new AuthorizationError('You do not have permission to access metrics data.')
        }
        throw new NetworkError(`Failed to fetch metrics (${metricsResponse.status})`)
      }
      const metricsData = await metricsResponse.json()
      setMetrics(metricsData)

      // Fetch alerts with proper error handling
      const alertsResponse = await fetch('/api/costs/alerts')
      if (!alertsResponse.ok) {
        if (alertsResponse.status === HTTP_STATUS.UNAUTHORIZED) {
          throw new AuthenticationError('Please log in again to access alerts data.')
        }
        if (alertsResponse.status === HTTP_STATUS.FORBIDDEN) {
          throw new AuthorizationError('You do not have permission to access alerts data.')
        }
        throw new NetworkError(`Failed to fetch alerts (${alertsResponse.status})`)
      }
      const alertsData = await alertsResponse.json()
      setAlerts(alertsData)

      // Fetch recommendations with proper error handling
      const recommendationsResponse = await fetch('/api/costs/recommendations')
      if (!recommendationsResponse.ok) {
        if (recommendationsResponse.status === HTTP_STATUS.UNAUTHORIZED) {
          throw new AuthenticationError('Please log in again to access recommendations data.')
        }
        if (recommendationsResponse.status === HTTP_STATUS.FORBIDDEN) {
          throw new AuthorizationError('You do not have permission to access recommendations data.')
        }
        throw new NetworkError(`Failed to fetch recommendations (${recommendationsResponse.status})`)
      }
      const recommendationsData = await recommendationsResponse.json()
      setRecommendations(recommendationsData)

    } catch (err) {
      // Use proper error type detection for better UX
      if (err instanceof AuthenticationError) {
        setError('Authentication required. Please refresh the page and log in again.')
      } else if (err instanceof AuthorizationError) {
        setError('Access denied. You do not have permission to view cost data.')
      } else if (err instanceof NetworkError) {
        setError('Unable to connect to the cost management service. Please try again later.')
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatCurrency = (amount: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount)
  }

  const getTrendIcon = (direction: 'up' | 'down' | 'stable') => {
    switch (direction) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-red-500" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-green-500" />
      default:
        return <div className="h-4 w-4 bg-gray-400 rounded-full" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'bg-yellow-100 text-yellow-800'
      case 'medium':
        return 'bg-orange-100 text-orange-800'
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'critical':
        return 'bg-red-200 text-red-900'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-orange-100 text-orange-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'hard':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
        <Button onClick={fetchCostData} className="mt-2">
          Retry
        </Button>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cost Summary Cards */}
      {costSummary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cost (7 days)</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(costSummary.totalCost)}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {getTrendIcon(costSummary.trendDirection)}
                <span className="ml-1">
                  {costSummary.trendDirection === 'stable' 
                    ? 'Stable' 
                    : `${costSummary.trendDirection} ${Math.abs(costSummary.trendPercentage).toFixed(1)}%`
                  }
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Storage Cost</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(costSummary.storageCost)}</div>
              <p className="text-xs text-muted-foreground">
                {((costSummary.storageCost / costSummary.totalCost) * 100).toFixed(1)}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">CI/CD Cost</CardTitle>
              <Cpu className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(costSummary.cicdCost)}</div>
              <p className="text-xs text-muted-foreground">
                {((costSummary.cicdCost / costSummary.totalCost) * 100).toFixed(1)}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bandwidth Cost</CardTitle>
              <Wifi className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(costSummary.bandwidthCost)}</div>
              <p className="text-xs text-muted-foreground">
                {((costSummary.bandwidthCost / costSummary.totalCost) * 100).toFixed(1)}% of total
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="details">Detailed Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Recent Alerts */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Alerts</CardTitle>
                <CardDescription>
                  Latest budget alerts and notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                {alerts.length === 0 ? (
                  <div className="flex items-center text-muted-foreground">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    No active alerts
                  </div>
                ) : (
                  <div className="space-y-3">
                    {alerts.slice(0, 3).map((alert) => (
                      <div key={alert.id} className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{alert.name}</p>
                          <p className="text-xs text-muted-foreground">{alert.category}</p>
                        </div>
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                      </div>
                    ))}
                    {alerts.length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        +{alerts.length - 3} more alerts
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>Top Recommendations</CardTitle>
                <CardDescription>
                  AI-driven optimization suggestions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recommendations.length === 0 ? (
                  <div className="flex items-center text-muted-foreground">
                    <Lightbulb className="h-4 w-4 mr-2" />
                    No recommendations available
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recommendations.slice(0, 3).map((rec) => (
                      <div key={rec.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{rec.title}</p>
                          <Badge className={getPriorityColor(rec.priority)}>
                            {rec.priority}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {rec.description}
                        </p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-green-600 font-medium">
                            Save {formatCurrency(rec.estimatedSavings)}
                          </span>
                          <Badge className={getDifficultyColor(rec.difficulty)}>
                            {rec.difficulty}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {recommendations.length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        +{recommendations.length - 3} more recommendations
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Cost Breakdown Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Cost Breakdown</CardTitle>
              <CardDescription>
                Cost distribution across categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              {costSummary && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Storage</span>
                      <span className="text-sm font-medium">
                        {formatCurrency(costSummary.storageCost)}
                      </span>
                    </div>
                    <Progress 
                      value={(costSummary.storageCost / costSummary.totalCost) * 100} 
                      className="h-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">CI/CD</span>
                      <span className="text-sm font-medium">
                        {formatCurrency(costSummary.cicdCost)}
                      </span>
                    </div>
                    <Progress 
                      value={(costSummary.cicdCost / costSummary.totalCost) * 100} 
                      className="h-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Bandwidth</span>
                      <span className="text-sm font-medium">
                        {formatCurrency(costSummary.bandwidthCost)}
                      </span>
                    </div>
                    <Progress 
                      value={(costSummary.bandwidthCost / costSummary.totalCost) * 100} 
                      className="h-2"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Budget Alerts</CardTitle>
              <CardDescription>
                Active budget alerts and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <CheckCircle className="h-8 w-8 mr-2" />
                  No active alerts
                </div>
              ) : (
                <div className="space-y-4">
                  {alerts.map((alert) => (
                    <div key={alert.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{alert.name}</h4>
                        <div className="flex items-center space-x-2">
                          <Badge className={getSeverityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                          <Badge variant="outline">{alert.category}</Badge>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span>Current:</span>
                          <span className="font-medium">
                            {alert.category === 'total' 
                              ? formatCurrency(alert.current)
                              : formatBytes(alert.current)
                            }
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Threshold:</span>
                          <span className="font-medium">
                            {alert.category === 'total' 
                              ? formatCurrency(alert.threshold)
                              : formatBytes(alert.threshold)
                            }
                          </span>
                        </div>
                        {alert.lastTriggered && (
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            Last triggered: {new Date(alert.lastTriggered).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Optimization Recommendations</CardTitle>
              <CardDescription>
                AI-driven suggestions to reduce costs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recommendations.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Target className="h-8 w-8 mr-2" />
                  No recommendations available
                </div>
              ) : (
                <div className="space-y-4">
                  {recommendations.map((rec) => (
                    <div key={rec.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{rec.title}</h4>
                        <div className="flex items-center space-x-2">
                          <Badge className={getPriorityColor(rec.priority)}>
                            {rec.priority}
                          </Badge>
                          <Badge className={getDifficultyColor(rec.difficulty)}>
                            {rec.difficulty}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {rec.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-green-600">
                          Potential savings: {formatCurrency(rec.estimatedSavings)}
                        </span>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            Dismiss
                          </Button>
                          <Button size="sm">
                            Implement
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Metrics</CardTitle>
              <CardDescription>
                Historical cost data and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              {metrics.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  No metrics data available
                </div>
              ) : (
                <div className="space-y-4">
                  {metrics.slice(0, 10).map((metric) => (
                    <div key={metric.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          {new Date(metric.timestamp).toLocaleString()}
                        </span>
                        <Badge variant="outline">{metric.period}</Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Storage:</span>
                          <div className="font-medium">{formatBytes(metric.storageUsage)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">CI/CD:</span>
                          <div className="font-medium">{metric.cicdRuntime} min</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Bandwidth:</span>
                          <div className="font-medium">{formatBytes(metric.bandwidthUsage)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Total Cost:</span>
                          <div className="font-medium">{formatCurrency(metric.totalCost)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {metrics.length > 10 && (
                    <p className="text-xs text-muted-foreground text-center">
                      Showing 10 of {metrics.length} metrics
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
