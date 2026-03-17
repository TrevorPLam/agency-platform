import { Resend } from 'resend'

const resend = new Resend(process.env['RESEND_API_KEY'])

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  from?: string
}

export interface SendContactNotificationOptions {
  /** Inbox to receive the notification; defaults to CONTACT_TO_EMAIL env */
  to?: string
  source: string
  name: string
  email: string
  message: string
}

/**
 * Send a generic email. Used by Inngest (welcome, follow-up) and by contact notification.
 * Requires RESEND_API_KEY. Optional FROM_EMAIL env (defaults to onboarding@resend.dev for development).
 */
export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
  const from = options.from ?? process.env['FROM_EMAIL'] ?? 'Agency <onboarding@resend.dev>'
  const to = Array.isArray(options.to) ? options.to : [options.to]
  const { error } = await resend.emails.send({
    from,
    to,
    subject: options.subject,
    html: options.html,
  })
  if (error) return { success: false, error: error.message }
  return { success: true }
}

/**
 * Send a contact form notification to the configured inbox.
 * Requires RESEND_API_KEY and CONTACT_TO_EMAIL (or pass to explicitly).
 */
export async function sendContactNotification(
  options: SendContactNotificationOptions
): Promise<{ success: boolean; error?: string }> {
  const to = options.to ?? process.env['CONTACT_TO_EMAIL'] ?? ''
  if (!to) return { success: false, error: 'CONTACT_TO_EMAIL not set' }
  const subject = `New contact from ${options.source}: ${options.name}`
  const html = `
    <p><strong>Source:</strong> ${escapeHtml(options.source)}</p>
    <p><strong>Name:</strong> ${escapeHtml(options.name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(options.email)}</p>
    <p><strong>Message:</strong></p>
    <pre>${escapeHtml(options.message)}</pre>
  `.trim()
  return sendEmail({ to, subject, html })
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
