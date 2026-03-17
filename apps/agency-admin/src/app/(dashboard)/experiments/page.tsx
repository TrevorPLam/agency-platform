import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@agency/ui/card'
import { Badge } from '@agency/ui/badge'
import { Button } from '@agency/ui/button'
import { Plus, Play, Pause, BarChart3, Users } from 'lucide-react'
import Link from 'next/link'

// Mock data for demonstration
const mockExperiments = [
  {
    id: '1',
    name: 'Homepage Hero Variant Test',
    key: 'homepage-hero-2024-q1',
    status: 'running' as const,
    traffic_percentage: 50,
    total_assignments: 1250,
    total_variants: 2,
    primary_metric: 'conversion_rate',
    is_significant: false,
    owner_name: 'Sarah Chen',
    created_at: '2024-01-15T10:00:00Z',
    started_at: '2024-01-16T09:00:00Z',
  },
  {
    id: '2',
    name: 'Contact Form Layout',
    key: 'contact-form-layout',
    status: 'completed' as const,
    traffic_percentage: 100,
    total_assignments: 3420,
    total_variants: 3,
    primary_metric: 'form_completion_rate',
    is_significant: true,
    owner_name: 'Mike Johnson',
    created_at: '2024-01-10T14:30:00Z',
    started_at: '2024-01-11T08:00:00Z',
    ended_at: '2024-01-25T17:00:00Z',
  },
  {
    id: '3',
    name: 'Pricing Page CTA Colors',
    key: 'pricing-cta-colors',
    status: 'draft' as const,
    traffic_percentage: 25,
    total_assignments: 0,
    total_variants: 4,
    primary_metric: 'click_through_rate',
    is_significant: false,
    owner_name: 'Alex Rivera',
    created_at: '2024-01-28T11:15:00Z',
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

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'running':
      return <Play className="h-3 w-3" />
    case 'paused':
      return <Pause className="h-3 w-3" />
    default:
      return null
  }
}

export default function ExperimentsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Experiments</h1>
          <p className="text-muted-foreground">
            Manage A/B tests and feature experiments for your applications
          </p>
        </div>
        <Button asChild>
          <Link href="/experiments/new">
            <Plus className="mr-2 h-4 w-4" />
            New Experiment
          </Link>
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Experiments</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockExperiments.length}</div>
            <p className="text-xs text-muted-foreground">
              Across all applications
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Running</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockExperiments.filter(e => e.status === 'running').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Active experiments
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockExperiments.reduce((sum, e) => sum + e.total_assignments, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Users in experiments
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Significant Results</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockExperiments.filter(e => e.is_significant).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Statistically significant
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Experiments List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Experiments</CardTitle>
          <CardDescription>
            View and manage your A/B tests and feature experiments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockExperiments.map((experiment) => (
              <div
                key={experiment.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold">{experiment.name}</h3>
                    <Badge className={getStatusColor(experiment.status)}>
                      <span className="flex items-center space-x-1">
                        {getStatusIcon(experiment.status)}
                        <span className="capitalize">{experiment.status}</span>
                      </span>
                    </Badge>
                    {experiment.is_significant && (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Significant
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span>Key: <code className="bg-muted px-1 rounded">{experiment.key}</code></span>
                    <span>Traffic: {experiment.traffic_percentage}%</span>
                    <span>Participants: {experiment.total_assignments.toLocaleString()}</span>
                    <span>Owner: {experiment.owner_name}</span>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm">
                    <span>Primary metric: <strong>{experiment.primary_metric}</strong></span>
                    <span>Created: {new Date(experiment.created_at).toLocaleDateString()}</span>
                    {experiment.started_at && (
                      <span>Started: {new Date(experiment.started_at).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/experiments/${experiment.id}`}>
                      View Details
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/experiments/${experiment.id}/results`}>
                      Results
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Getting Started Card */}
      {mockExperiments.length === 0 && (
        <Card>
          <CardHeader className="text-center">
            <CardTitle>No experiments yet</CardTitle>
            <CardDescription>
              Get started by creating your first A/B test or feature experiment
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link href="/experiments/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Experiment
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
