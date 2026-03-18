'use server'

import { getAdminClient } from '@agency/database/admin'
import { sendContactNotification } from '@agency/email'
import { z } from 'zod'

// Zod schema for contact form validation
const contactFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Please enter a valid email address').max(255, 'Email must be less than 255 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000, 'Message must be less than 2000 characters'),
  // Honeypot field - should be empty for legitimate submissions
  website: z.string().max(0, 'Invalid submission').optional(),
})

export type ContactFormState = {
  success: boolean
  message: string
  errors?: Record<string, string>
}

export async function submitContactForm(
  _prev: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  // Extract form data
  const rawData = {
    name: (formData.get('name') as string)?.trim() || '',
    email: (formData.get('email') as string)?.trim() || '',
    message: (formData.get('message') as string)?.trim() || '',
    website: (formData.get('website') as string)?.trim() || '',
  }

  // Validate with Zod
  const validationResult = contactFormSchema.safeParse(rawData)
  if (!validationResult.success) {
    const errors = validationResult.error.flatten().fieldErrors
    return {
      success: false,
      message: 'Please correct the errors below.',
      errors: {
        name: errors.name?.[0] || '',
        email: errors.email?.[0] || '',
        message: errors.message?.[0] || '',
      }
    }
  }

  const { name, email, message } = validationResult.data

  const slug = process.env.NEXT_PUBLIC_TENANT_SLUG
  if (!slug) {
    return { success: false, message: 'Tenant not configured.' }
  }

  const admin = getAdminClient()
  const { data: tenant } = await admin.from('tenants').select('id').eq('slug', slug).single()
  if (!tenant) {
    return { success: false, message: 'Tenant not found.' }
  }

  const { error: insertError } = await admin.from('contact_submissions').insert({
    tenant_id: tenant.id,
    source: slug,
    name,
    email,
    message,
  })

  if (insertError) {
    return { success: false, message: 'Something went wrong. Please try again.' }
  }

  const { success: emailOk, error: emailErr } = await sendContactNotification({
    source: slug,
    name,
    email,
    message,
  })
  if (!emailOk && emailErr) {
    console.error('Contact notification email failed:', emailErr)
  }

  return { success: true, message: 'Thank you! We will get back to you soon.' }
}
