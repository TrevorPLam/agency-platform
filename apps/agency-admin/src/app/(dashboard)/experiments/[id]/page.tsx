import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@agency/ui/card'
import { Badge } from '@agency/ui/badge'
import { Button } from '@agency/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@agency/ui/tabs'
import { Progress } from '@agency/ui/progress'
import { 
  ArrowLeft, 
  Pause, 
  Square, 
  BarChart3, 
  Users, 
  Clock, 
  Target,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react'
import Link from 'next/link'

// Mock data for demonstration
const mockExperiment = {
  id: '1',
  name: 'Homepage Hero Variant Test',
  key: 'homepage-hero-2024-q1',
  status: 'running' as const,
  traffic_percentage: 50,
  hypothesis: 'Changing the hero section from the current design to the new design will increase conversion rate by 15% over 14 days for mobile users.',
  population: 'Mobile users',
  intervention: 'New hero section design with larger CTA',
  control: 'Current hero section design',
  outcome_metric: 'Conversion rate',
  time_horizon: '14 days or 1000 conversions',
  owner_name: 'Sarah Chen',
  created_at: '2024-01-15T10:00:00Z',
  started_at: '2024-01-16T09:00:00Z',
  total_assignments: 1250,
  statistical_power: 0.8,
  confidence_level: 0.95,
}

const mockVariants = [
  {
    id: '1',
    name: 'Control',
    key: 'control',
    is_control: true,
    traffic_percentage: 50,
    description: 'Current hero section design',
    assignments_count: 625,
    conversion_rate: 0.032,
    confidence_interval: [0.028, 0.036] as [number, number],
  },
  {
    id: '2',
    name: 'Variant A',
    key: 'variant_a',
    is_control: false,
    traffic_percentage: 50,
    description: 'New hero section with larger CTA button',
    assignments_count: 625,
    conversion_rate: 0.041,
    confidence_interval: [0.037, 0.045] as [number, number],
    relative_lift: 28.1,
    absolute_lift: 0.009,
    p_value: 0.002,
    is_significant: true,
  },
]

const mockMetrics = [
  {
    metric_name: 'conversion_rate',
    variant_id: '1',
    variant_name: 'Control',
    metric_value: 0.032,
    sample_size: 625,
    is_significant: false,
  },
  {
    metric_name: 'conversion_rate',
    variant_id: '2',
    variant_name: 'Variant A',
    metric_value: 0.041,
    sample_size: 625,
    is_significant: true,
    p_value: 0.002,
  },
  {
    metric_name: 'click_through_rate',
    variant_id: '1',
    variant_name: 'Control',
    metric_value: 0.156,
    sample_size: 625,
    is_significant: false,
  },
  {
    metric_name: 'click_through_rate',
    variant_id: '2',
    variant_name: 'Variant A',
    metric_value: 0.168,
    sample_size: 625,
    is_significant: false,
    p_value: 0.12,
  },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'running':
      return 'bg-green-100 text-green-800'
    case 'completed':
      return 'bg-blue-100 text-blue-800'
    case 'draft':
      return 'bg-gray-100 text-gray-800'
    case 'paused':
      return 'bg-yellow-100 text-yellow-800'
    case 'archived':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getLiftIcon = (lift?: number) => {
  if (!lift) return <Minus className="h-4 w-4" />
  if (lift > 0) return <TrendingUp className="h-4 w-4 text-green-600" />
  return <TrendingDown className="h-4 w-4 text-red-600" />
}

const getLiftColor = (lift?: number) => {
  if (!lift) return 'text-gray-600'
  if (lift > 0) return 'text-green-600'
  return 'text-red-600'
}

export default function ExperimentDetailPage() {
  const progress = mockExperiment.total_assignments / 1000 * 100 // Assuming target of 1000

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/experiments">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Experiments
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{mockExperiment.name}</h1>
            <p className="text-muted-foreground">
              Key: <code className="bg-muted px-1 rounded">{mockExperiment.key}</code>
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={getStatusColor(mockExperiment.status)}>
            <span className="capitalize">{mockExperiment.status}</span>
          </Badge>
          <Button variant="outline" size="sm">
            <Pause className="mr-2 h-4 w-4" />
            Pause
          </Button>
          <Button variant="outline" size="sm">
            <Square className="mr-2 h-4 w-4" />
            Stop
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <div className="flex justify-between text-sm">
                <span>{mockExperiment.total_assignments.toLocaleString()} / 1,000</span>
                <span>{Math.round(progress)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.floor((Date.now() - new Date(mockExperiment.started_at!).getTime()) / (1000 * 60 * 60 * 24))}
            </div>
            <p className="text-xs text-muted-foreground">
              Days running
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Participants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockExperiment.total_assignments.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Total users
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Traffic</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockExperiment.traffic_percentage}%</div>
            <p className="text-xs text-muted-foreground">
              Of total traffic
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="variants">Variants</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* PICOT Framework */}
            <Card>
              <CardHeader>
                <CardTitle>PICOT Framework</CardTitle>
                <CardDescription>
                  Experiment design using evidence-based framework
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm">Population</h4>
                  <p className="text-sm text-muted-foreground">{mockExperiment.population}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Intervention</h4>
                  <p className="text-sm text-muted-foreground">{mockExperiment.intervention}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Control</h4>
                  <p className="text-sm text-muted-foreground">{mockExperiment.control}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Outcome</h4>
                  <p className="text-sm text-muted-foreground">{mockExperiment.outcome_metric}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Time Horizon</h4>
                  <p className="text-sm text-muted-foreground">{mockExperiment.time_horizon}</p>
                </div>
              </CardContent>
            </Card>

            {/* Hypothesis */}
            <Card>
              <CardHeader>
                <CardTitle>Hypothesis</CardTitle>
                <CardDescription>
                  Clear testable statement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{mockExperiment.hypothesis}</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Primary Results</CardTitle>
              <CardDescription>
                Key metrics and statistical significance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockVariants.map((variant) => (
                  <div key={variant.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold">{variant.name}</h4>
                        {variant.is_control && <Badge variant="outline">Control</Badge>}
                        {variant.is_significant && (
                          <Badge className="bg-green-100 text-green-800">Significant</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{variant.description}</p>
                      <div className="mt-2 flex items-center space-x-4 text-sm">
                        <span>Conversion: <strong>{(variant.conversion_rate * 100).toFixed(2)}%</strong></span>
                        <span>Users: <strong>{variant.assignments_count.toLocaleString()}</strong></span>
                        <span>
                          CI: <strong>[{(variant.confidence_interval[0] * 100).toFixed(2)}%, {(variant.confidence_interval[1] * 100).toFixed(2)}%]</strong>
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      {variant.relative_lift && (
                        <div className="flex items-center space-x-1">
                          {getLiftIcon(variant.relative_lift)}
                          <span className={`font-semibold ${getLiftColor(variant.relative_lift)}`}>
                            {variant.relative_lift > 0 ? '+' : ''}{variant.relative_lift.toFixed(1)}%
                          </span>
                        </div>
                      )}
                      {variant.p_value && (
                        <p className="text-sm text-muted-foreground">
                          p = {variant.p_value.toFixed(3)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="variants" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Experiment Variants</CardTitle>
              <CardDescription>
                Detailed breakdown of each test variant
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockVariants.map((variant) => (
                  <div key={variant.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">{variant.name}</h3>
                        {variant.is_control && <Badge variant="outline">Control</Badge>}
                        <Badge variant="outline">{variant.traffic_percentage}% traffic</Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{variant.description}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Assignments:</span>
                        <p className="font-semibold">{variant.assignments_count.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Conversion Rate:</span>
                        <p className="font-semibold">{(variant.conversion_rate * 100).toFixed(2)}%</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Confidence Interval:</span>
                        <p className="font-semibold">
                          [{(variant.confidence_interval[0] * 100).toFixed(2)}%, {(variant.confidence_interval[1] * 100).toFixed(2)}%]
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Significance:</span>
                        <p className="font-semibold">
                          {variant.is_significant ? `p = ${(variant as any).p_value?.toFixed(3)}` : 'Not significant'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Results</CardTitle>
              <CardDescription>
                All metrics and statistical analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {['conversion_rate', 'click_through_rate'].map((metric) => (
                  <div key={metric} className="space-y-4">
                    <h3 className="font-semibold capitalize">{metric.replace('_', ' ')}</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      {mockMetrics
                        .filter(m => m.metric_name === metric)
                        .map((metric_data) => (
                          <div key={`${metric_data.variant_id}-${metric_data.metric_name}`} className="border rounded-lg p-4">
                            <h4 className="font-semibold">{metric_data.variant_name}</h4>
                            <div className="mt-2 space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span>Value:</span>
                                <span className="font-semibold">
                                  {metric_data.metric_name === 'conversion_rate' || metric_data.metric_name === 'click_through_rate'
                                    ? `${(metric_data.metric_value * 100).toFixed(2)}%`
                                    : metric_data.metric_value.toFixed(2)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Sample Size:</span>
                                <span className="font-semibold">{metric_data.sample_size.toLocaleString()}</span>
                              </div>
                              {(metric_data as any).p_value && (
                                <div className="flex justify-between">
                                  <span>P-value:</span>
                                  <span className="font-semibold">{(metric_data as any).p_value.toFixed(3)}</span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span>Significant:</span>
                                <span className={`font-semibold ${metric_data.is_significant ? 'text-green-600' : 'text-gray-600'}`}>
                                  {metric_data.is_significant ? 'Yes' : 'No'}
                                </span>
                              </div>
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

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Experiment Settings</CardTitle>
              <CardDescription>
                Configuration and metadata
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-semibold">Owner</h4>
                  <p className="text-sm text-muted-foreground">{mockExperiment.owner_name}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Traffic Percentage</h4>
                  <p className="text-sm text-muted-foreground">{mockExperiment.traffic_percentage}%</p>
                </div>
                <div>
                  <h4 className="font-semibold">Confidence Level</h4>
                  <p className="text-sm text-muted-foreground">{(mockExperiment.confidence_level * 100).toFixed(0)}%</p>
                </div>
                <div>
                  <h4 className="font-semibold">Statistical Power</h4>
                  <p className="text-sm text-muted-foreground">{(mockExperiment.statistical_power * 100).toFixed(0)}%</p>
                </div>
                <div>
                  <h4 className="font-semibold">Created</h4>
                  <p className="text-sm text-muted-foreground">{new Date(mockExperiment.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Started</h4>
                  <p className="text-sm text-muted-foreground">{new Date(mockExperiment.started_at!).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
