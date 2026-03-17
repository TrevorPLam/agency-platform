'use server'

import { getAdminClient } from '@agency/database/admin'
import { z } from 'zod'

// Zod schema for booking form validation
const bookingFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').optional(),
  email: z.string().email('Please enter a valid email address').max(255, 'Email must be less than 255 characters'),
  message: z.string().max(1000, 'Message must be less than 1000 characters').optional(),
  // Honeypot field - should be empty for legitimate submissions
  phone: z.string().max(0, 'Invalid submission').optional(),
})

const AGENCY_TENANT_SLUG = 'agency'

export async function submitBooking(
  _prev: { success: boolean; message?: string; errors?: Record<string, string> },
  formData: FormData
): Promise<{ success: boolean; message?: string; errors?: Record<string, string> }> {
  // Extract form data
  const rawData = {
    name: (formData.get('name') as string)?.trim() || '',
    email: (formData.get('email') as string)?.trim() || '',
    message: (formData.get('message') as string)?.trim() || '',
    phone: (formData.get('phone') as string)?.trim() || '',
  }

  // Validate with Zod
  const validationResult = bookingFormSchema.safeParse(rawData)
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

  const admin = getAdminClient()
  const { data: tenant } = await admin.from('tenants').select('id').eq('slug', AGENCY_TENANT_SLUG).single()
  if (!tenant) {
    return { success: false, message: 'Agency tenant not found.' }
  }

  const { error } = await admin.from('bookings').insert({
    tenant_id: tenant.id,
    name: name || null,
    email,
    message: message || null,
    requested_at: new Date().toISOString(),
  })

  if (error) return { success: false, message: 'Something went wrong. Please try again.' }
  return { success: true, message: "Thanks! We'll be in touch to schedule a call." }
}
