import { Metadata } from 'next'
import { DORAMetricsDashboard } from '@/components/metrics/dora-metrics-dashboard'

export const metadata: Metadata = {
  title: 'DORA Metrics | Agency Admin',
  description: 'DevOps Research and Assessment (DORA) metrics dashboard for software delivery performance',
}

export default function MetricsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">DORA Metrics</h1>
          <p className="text-muted-foreground">
            Monitor software delivery performance and identify improvement opportunities
          </p>
        </div>
      </div>
      
      <DORAMetricsDashboard />
    </div>
  )
}
