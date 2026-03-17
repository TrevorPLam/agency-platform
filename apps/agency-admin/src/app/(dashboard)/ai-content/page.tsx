import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth'
import { createClient } from '@agency/database/admin'
import { AIContentDashboard } from './dashboard'

export const metadata: Metadata = {
  title: 'AI Content Operations | Agency Admin',
  description: 'Manage AI-assisted content generation and approval workflows',
}

export default async function AIContentPage() {
  const session = await getServerSession()
  if (!session) {
    redirect('/login')
  }

  const supabase = createClient()
  
  // Check if user has permission to access AI content operations
  const { data: userRole } = await supabase
    .from('tenant_users')
    .select('role')
    .eq('tenant_id', session.tenantId)
    .eq('user_id', session.userId)
    .single()

  if (!userRole || !['admin', 'content_manager'].includes(userRole.role)) {
    redirect('/dashboard')
  }

  return <AIContentDashboard tenantId={session.tenantId} />
}
