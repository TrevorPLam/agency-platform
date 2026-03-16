import { Metadata } from 'next'
import { CostManagementDashboard } from '@/components/costs/cost-management-dashboard'

export const metadata: Metadata = {
  title: 'Cost Management | Agency Admin',
  description: 'Monitor and optimize costs across storage, CI/CD, and bandwidth usage',
}

export default function CostsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cost Management</h1>
          <p className="text-muted-foreground">
            Monitor and optimize costs across storage, CI/CD, and bandwidth usage
          </p>
        </div>
      </div>
      
      <CostManagementDashboard />
    </div>
  )
}
