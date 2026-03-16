import { getAdminClient } from '@agency/database/admin'
import { sendEmail } from '@agency/email'
import { inngest } from '../client'

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
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
      const { success, error } = await sendEmail({
        to: clientEmail,
        subject: `Welcome to the agency, ${clientName}`,
        html: `<p>Hi ${escapeHtml(clientName)},</p><p>Welcome! We're excited to have you on board. If you have any questions, just reply to this email.</p>`,
      })
      if (!success) throw new Error(`Welcome email failed: ${error ?? 'unknown'}`)
      return { sent: true }
    })

    const profileEvent = await step.waitForEvent('await-profile-completion', {
      event: 'agency/client.profile-completed',
      match: 'data.tenantId',
      timeout: '7d',
    })

    if (!profileEvent) {
      await step.run('send-followup', async () => {
        const { success, error } = await sendEmail({
          to: clientEmail,
          subject: `Quick follow-up, ${clientName}`,
          html: `<p>Hi ${escapeHtml(clientName)},</p><p>We noticed you haven't completed your profile yet. Need any help? Reply to this email and we'll get back to you.</p>`,
        })
        if (!success) throw new Error(`Follow-up email failed: ${error ?? 'unknown'}`)
        return { sent: true }
      })
    }

    return { status: 'onboarded', tenantId }
  }
)
