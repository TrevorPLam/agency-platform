import { getAdminClient } from '@agency/database/admin'
import { inngest } from '../client'

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

export const onboardingWorkflow = inngest.createFunction(
  {
    id: 'client-onboarding',
    retries: 3,
  },
  { event: 'agency/client.created' },
  async ({ event, step }) => {
    const { tenantId, clientName, clientEmail } = event.data

    await step.run('provision-database', async () => {
      const admin = getAdminClient()
      const slug = slugify(clientName) || 'client'
      const { error } = await admin.from('tenants').upsert(
        {
          id: tenantId,
          name: clientName,
          slug,
          domain: `https://${slug}.example.com`,
          industry: 'hospitality',
        },
        { onConflict: 'id' }
      )
      if (error) throw new Error(`Database provisioning failed: ${error.message}`)
      return { provisioned: tenantId }
    })

    await step.run('send-welcome-email', async () => {
      // Stub: real implementation will use Resend/SendGrid in a later task
      console.log('[INNGEST] Welcome email stub:', { to: clientEmail, clientName })
      return { sent: true }
    })

    const profileEvent = await step.waitForEvent('await-profile-completion', {
      event: 'agency/client.profile-completed',
      match: 'data.tenantId',
      timeout: '7d',
    })

    if (!profileEvent) {
      await step.run('send-followup', async () => {
        // Stub: 7-day timeout follow-up nudge
        console.log('[INNGEST] Follow-up email stub:', { to: clientEmail, clientName })
        return { sent: true }
      })
    }

    return { status: 'onboarded', tenantId }
  }
)
