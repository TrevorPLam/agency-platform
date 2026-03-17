/**
 * Security Dashboard Page
 * 
 * Main security monitoring page for the agency admin dashboard.
 * Provides comprehensive security oversight and threat intelligence.
 */

import { Metadata } from 'next'
import { SecurityDashboard } from '@/components/security/security-dashboard'

export const metadata: Metadata = {
  title: 'Security Dashboard | Agency Platform',
  description: 'Real-time security monitoring and threat intelligence dashboard',
}

export default function SecurityPage() {
  return (
    <div className="container mx-auto py-6">
      <SecurityDashboard />
    </div>
  )
}
