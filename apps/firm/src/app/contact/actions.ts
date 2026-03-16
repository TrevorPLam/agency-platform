'use server'

import { getAdminClient } from '@agency/database/admin'
import { sendContactNotification } from '@agency/email'

export type ContactFormState = {
  success: boolean
  message: string
}

export async function submitContactForm(
  _prev: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const name = (formData.get('name') as string)?.trim()
  const email = (formData.get('email') as string)?.trim()
  const message = (formData.get('message') as string)?.trim()

  if (!name || !email || !message) {
    return { success: false, message: 'Please fill in all fields.' }
  }

  const admin = getAdminClient()
  const { error: insertError } = await admin.from('contact_submissions').insert({
    tenant_id: null,
    source: 'firm',
    name,
    email,
    message,
  })

  if (insertError) {
    return { success: false, message: 'Something went wrong. Please try again.' }
  }

  const { success: emailOk, error: emailErr } = await sendContactNotification({
    source: 'firm',
    name,
    email,
    message,
  })
  if (!emailOk && emailErr) {
    // Submission saved; email failed (log but don't fail the form)
    console.error('Contact notification email failed:', emailErr)
  }

  return { success: true, message: 'Thank you! We will be in touch soon.' }
}
