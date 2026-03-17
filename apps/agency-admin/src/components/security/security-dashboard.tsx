/**
 * Security Dashboard Component
 * 
 * Comprehensive security monitoring dashboard with real-time metrics,
 * alerts, and threat intelligence visualization.
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@agency/ui/card'
import { Badge } from '@agency/ui/badge'
import { Button } from '@agency/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@agency/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@agency/ui/tabs'
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  Globe,
  Lock,
  Eye,
  RefreshCw,
  Download,
  Filter,
  Bell,
} from 'lucide-react'

// Types for the security dashboard
interface SecurityMetrics {
  totalEvents: number
  criticalEvents: number
  highEvents: number
  mediumEvents: number
  lowEvents: number
  activeAlerts: number
  acknowledgedAlerts: number
  resolvedAlerts: number
  authenticationFailureRate: number
  rateLimitViolationRate: number
  suspiciousActivityRate: number
  dataAccessAnomalyRate: number
  riskScore: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  securityPostureScore: number
  trends: {
    authenticationFailures: number[]
    rateLimitViolations: number[]
    suspiciousActivity: number[]
    dataAccessAnomalies: number[]
    timestamps: string[]
  }
  topConcerns: Array<{
    type: string
    severity: string
    title: string
    description: string
    recommendation: string
  }>
}

interface SecurityAlert {
  id: string
  timestamp: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  type: string
  title: string
  description: string
  status: 'active' | 'acknowledged' | 'investigating' | 'resolved' | 'false_positive'
  assignedTo?: string
  metadata: {
    riskScore: number
    affectedUsers?: number
    affectedSystems?: string[]
    mitigation?: string
    recommendation?: string
  }
}

interface SecurityDashboardProps {
  tenantId?: string
  className?: string
}

export function SecurityDashboard({ tenantId, className }: SecurityDashboardProps) {
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null)
  const [alerts, setAlerts] = useState<SecurityAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h')
  const [refreshing, setRefreshing] = useState(false)

  // Fetch security data
  const fetchSecurityData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [metricsResponse, alertsResponse] = await Promise.all([
        fetch(`/api/security/metrics?timeRange=${timeRange}&tenantId=${tenantId || ''}`),
        fetch(`/api/security/alerts?limit=10&tenantId=${tenantId || ''}`)
      ])

      if (!metricsResponse.ok || !alertsResponse.ok) {
        throw new Error('Failed to fetch security data')
      }

      const metricsData = await metricsResponse.json()
      const alertsData = await alertsResponse.json()

      setMetrics(metricsData.metrics)
      setAlerts(alertsData.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    fetchSecurityData()
  }, [timeRange, tenantId])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchSecurityData()
    }, 30000)

    return () => clearInterval(interval)
  }, [timeRange, tenantId])

  // Handle manual refresh
  const handleRefresh = () => {
    setRefreshing(true)
    fetchSecurityData()
  }

  // Get risk level color
  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-50'
      case 'high': return 'text-orange-600 bg-orange-50'
      case 'medium': return 'text-yellow-600 bg-yellow-50'
      case 'low': return 'text-green-600 bg-green-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive'
      case 'high': return 'destructive'
      case 'medium': return 'secondary'
      case 'low': return 'outline'
      default: return 'outline'
    }
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'destructive'
      case 'acknowledged': return 'secondary'
      case 'investigating': return 'default'
      case 'resolved': return 'outline'
      case 'false_positive': return 'outline'
      default: return 'outline'
    }
  }

  // Format number with commas
  const formatNumber = (num: number) => {
    return num.toLocaleString()
  }

  // Format percentage
  const formatPercentage = (num: number) => {
    return `${num.toFixed(1)}%`
  }

  if (loading && !metrics) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
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
        <XCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load security data: {error}
        </AlertDescription>
      </Alert>
    )
  }

  if (!metrics) {
    return null
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Security Dashboard</h2>
          <p className="text-muted-foreground">
            Real-time security monitoring and threat intelligence
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Risk Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.riskScore}</div>
            <p className="text-xs text-muted-foreground">
              Overall security risk assessment
            </p>
            <Badge className={`mt-2 ${getRiskLevelColor(metrics.riskLevel)}`}>
              {metrics.riskLevel.toUpperCase()}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Posture</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.securityPostureScore}</div>
            <p className="text-xs text-muted-foreground">
              Security posture score (0-100)
            </p>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  metrics.securityPostureScore >= 80 ? 'bg-green-500' :
                  metrics.securityPostureScore >= 60 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${metrics.securityPostureScore}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeAlerts}</div>
            <p className="text-xs text-muted-foreground">
              Alerts requiring attention
            </p>
            {metrics.activeAlerts > 0 && (
              <Badge variant="destructive" className="mt-2">
                Action Required
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Event Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.totalEvents)}</div>
            <p className="text-xs text-muted-foreground">
              Security events detected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Events</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatNumber(metrics.criticalEvents)}</div>
            <p className="text-xs text-muted-foreground">
              Critical security events
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auth Failures</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(metrics.authenticationFailureRate)}</div>
            <p className="text-xs text-muted-foreground">
              Authentication failure rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rate Limits</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(metrics.rateLimitViolationRate)}</div>
            <p className="text-xs text-muted-foreground">
              Rate limit violations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="alerts">Active Alerts</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="concerns">Security Concerns</TabsTrigger>
        </TabsList>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Security Alerts</CardTitle>
              <CardDescription>
                Latest security alerts requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">No Active Alerts</h3>
                  <p className="text-muted-foreground">
                    All systems are operating normally
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-start justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={getSeverityColor(alert.severity)}>
                            {alert.severity.toUpperCase()}
                          </Badge>
                          <Badge variant={getStatusColor(alert.status)}>
                            {alert.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(alert.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <h4 className="font-semibold">{alert.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {alert.description}
                        </p>
                        {alert.assignedTo && (
                          <p className="text-xs text-muted-foreground">
                            Assigned to: {alert.assignedTo}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          Risk: {alert.metadata.riskScore}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Event Trends</CardTitle>
              <CardDescription>
                Security event patterns over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Authentication Failures
                  </h4>
                  <div className="space-y-2">
                    {metrics.trends.authenticationFailures.slice(-6).map((count, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Hour {index + 1}
                        </span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Rate Limit Violations
                  </h4>
                  <div className="space-y-2">
                    {metrics.trends.rateLimitViolations.slice(-6).map((count, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Hour {index + 1}
                        </span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Concerns Tab */}
        <TabsContent value="concerns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Security Concerns</CardTitle>
              <CardDescription>
                Priority security issues requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              {metrics.topConcerns.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">No Security Concerns</h3>
                  <p className="text-muted-foreground">
                    All security metrics are within acceptable ranges
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {metrics.topConcerns.map((concern, index) => (
                    <Alert key={index}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>{concern.title}</AlertTitle>
                      <AlertDescription>
                        <p className="mb-2">{concern.description}</p>
                        <p className="font-medium">Recommendation:</p>
                        <p className="text-sm">{concern.recommendation}</p>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
