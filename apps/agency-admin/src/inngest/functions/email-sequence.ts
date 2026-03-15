import { inngest } from '../client'

export const emailSequence = inngest.createFunction(
  {
    id: 'email-sequence',
    retries: 2,
  },
  { event: 'agency/client.created' },
  async ({ event, step }) => {
    const { tenantId, clientName, clientEmail } = event.data

    await step.sleep('day-1', '1d')
    await step.run('send-day-1', async () => {
      // Stub: real implementation will use Resend/SendGrid in a later task
      console.log('[INNGEST] Day 1 email stub:', { to: clientEmail, clientName, tenantId })
      return { sent: true }
    })

    await step.sleep('day-3', '2d')
    await step.run('send-day-3', async () => {
      // Stub: real implementation will use Resend/SendGrid in a later task
      console.log('[INNGEST] Day 3 email stub:', { to: clientEmail, clientName, tenantId })
      return { sent: true }
    })

    return { status: 'sequence-complete', tenantId }
  }
)
