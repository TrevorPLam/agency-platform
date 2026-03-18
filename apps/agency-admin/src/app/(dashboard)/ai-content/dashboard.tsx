'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@agency/ui/components/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@agency/ui/components/tabs'
import { Badge } from '@agency/ui/components/badge'
import { Button } from '@agency/ui/components/button'
import { Progress } from '@agency/ui/components/progress'
import { 
  BarChart3, 
  FileText, 
  AlertTriangle, 
  Users,
  TrendingUp,
  Shield,
  Settings
} from 'lucide-react'

interface DashboardProps {
  tenantId: string
}

interface Analytics {
  usageAnalytics: {
    totalRequests: number
    successfulGenerations: number
    averageBrandScore: number
    averageComplianceScore: number
    totalCost: number
    topContentTypes: Array<{ type: string; count: number }>
  }
  workflowAnalytics: {
    totalWorkflows: number
    activeWorkflows: number
    completedWorkflows: number
    averageCompletionTime: number
  }
}

export function AIContentDashboard({ tenantId }: DashboardProps) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAnalytics()
  }, [tenantId])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)

      // Mock analytics data - in production, fetch from API
      const mockAnalytics: Analytics = {
        usageAnalytics: {
          totalRequests: 156,
          successfulGenerations: 142,
          averageBrandScore: 87.3,
          averageComplianceScore: 91.2,
          totalCost: 23.45,
          topContentTypes: [
            { type: 'blog_post', count: 45 },
            { type: 'social_media', count: 38 },
            { type: 'email_newsletter', count: 28 },
            { type: 'landing_page', count: 22 },
            { type: 'product_description', count: 23 }
          ]
        },
        workflowAnalytics: {
          totalWorkflows: 12,
          activeWorkflows: 3,
          completedWorkflows: 87,
          averageCompletionTime: 4.2
        }
      }

      setAnalytics(mockAnalytics)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading AI Content Operations...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-4" />
          <p className="text-destructive mb-2">Error loading dashboard</p>
          <p className="text-muted-foreground text-sm">{error}</p>
          <Button onClick={fetchAnalytics} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (!analytics) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Content Operations</h1>
          <p className="text-muted-foreground">
            Manage AI-assisted content generation and approval workflows
          </p>
        </div>
        <Button>
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.usageAnalytics.totalRequests}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((analytics.usageAnalytics.successfulGenerations / analytics.usageAnalytics.totalRequests) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.usageAnalytics.successfulGenerations} successful
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Brand Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.usageAnalytics.averageBrandScore.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Out of 100
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.usageAnalytics.totalCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="content">Content Generation</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="brand-voice">Brand Voice</TabsTrigger>
          <TabsTrigger value="safety">Safety & Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Content Type Distribution</CardTitle>
                <CardDescription>
                  Breakdown of generated content by type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.usageAnalytics.topContentTypes.map((type) => (
                    <div key={type.type} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span className="text-sm font-medium capitalize">
                          {type.type.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">{type.count}</span>
                        <Progress 
                          value={(type.count / analytics.usageAnalytics.totalRequests) * 100} 
                          className="w-16"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Workflow Status</CardTitle>
                <CardDescription>
                  Current workflow activity and completion rates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active Workflows</span>
                    <Badge variant="secondary">{analytics.workflowAnalytics.activeWorkflows}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Completed Workflows</span>
                    <Badge variant="default">{analytics.workflowAnalytics.completedWorkflows}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Avg Completion Time</span>
                    <span className="text-sm font-medium">
                      {analytics.workflowAnalytics.averageCompletionTime.toFixed(1)} hours
                    </span>
                  </div>
                  <div className="pt-2">
                    <div className="text-sm text-muted-foreground mb-2">Completion Rate</div>
                    <Progress value={85} className="w-full" />
                    <div className="text-xs text-muted-foreground mt-1">85% this month</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Generation Queue</CardTitle>
              <CardDescription>
                Monitor and manage AI content generation requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Content generation interface coming soon</p>
                <Button variant="outline" className="mt-4">
                  View Documentation
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflows" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Approval Workflows</CardTitle>
              <CardDescription>
                Configure and manage content approval workflows
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Workflow management interface coming soon</p>
                <Button variant="outline" className="mt-4">
                  Configure Workflows
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="brand-voice" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Brand Voice Management</CardTitle>
              <CardDescription>
                Train and manage AI brand voice models
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Brand voice training interface coming soon</p>
                <Button variant="outline" className="mt-4">
                  Train Brand Voice
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="safety" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Safety & Compliance</CardTitle>
              <CardDescription>
                Monitor safety checks and compliance reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">PII Detection</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Toxicity Check</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Bias Detection</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Avg Compliance Score</span>
                    <span className="text-sm font-medium">
                      {analytics.usageAnalytics.averageComplianceScore.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Failed Checks This Month</span>
                    <Badge variant="destructive">3</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Last Safety Update</span>
                    <span className="text-sm text-muted-foreground">2 days ago</span>
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
