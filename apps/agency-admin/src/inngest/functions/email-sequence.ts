import { sendEmail } from '@agency/email'
import { inngest } from '../client'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

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
      const { success, error } = await sendEmail({
        to: clientEmail,
        subject: `Day 1 — Getting started, ${escapeHtml(clientName)}`,
        html: `<p>Hi ${escapeHtml(clientName)},</p><p>Here's your Day 1 update. We're glad to have you with us.</p>`,
      })
      if (!success) throw new Error(`Day 1 email failed: ${error ?? 'unknown'}`)
      return { sent: true }
    })

    await step.sleep('day-3', '2d')
    await step.run('send-day-3', async () => {
      const { success, error } = await sendEmail({
        to: clientEmail,
        subject: `Day 3 — Check-in, ${escapeHtml(clientName)}`,
        html: `<p>Hi ${escapeHtml(clientName)},</p><p>Quick check-in. How's everything going? Reply if you need anything.</p>`,
      })
      if (!success) throw new Error(`Day 3 email failed: ${error ?? 'unknown'}`)
      return { sent: true }
    })

    return { status: 'sequence-complete', tenantId }
  }
)
