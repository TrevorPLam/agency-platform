'use server'

import { redirect } from 'next/navigation'
import { getAdminClient } from '@agency/database/admin'
import { captureServerEvent } from '@agency/analytics/server'
import { z } from 'zod'

type BookingFormErrors = {
  name?: string
  email?: string
  message?: string
}

type BookingActionState = {
  success: boolean
  message?: string
  errors?: BookingFormErrors
}

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
  _prev: BookingActionState,
  formData: FormData
): Promise<BookingActionState> {
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

  // Insert booking record
  const { error, data: bookingData } = await admin.from('bookings').insert({
    tenant_id: tenant['id'],
    name: name || null,
    email,
    message: message || null,
    requested_at: new Date().toISOString(),
  }).select().single()

  if (error) {
    return { success: false, message: 'Something went wrong. Please try again.' }
  }

  if (!bookingData) {
    return { success: false, message: 'Booking could not be created.' }
  }

  // Capture server-side analytics event
  try {
    captureServerEvent(
      email, // Use email as distinctId for user identification
      'booking_submitted',
      {
        tenant: AGENCY_TENANT_SLUG,
        booking_id: bookingData['id'],
        has_name: !!name,
        has_message: !!message,
        submission_source: 'firm_booking_form',
      }
    )

    // Flush events to ensure they're sent before redirect
    await import('@agency/analytics/server').then(({ flushServerEvents }) => flushServerEvents())
  } catch (analyticsError) {
    // Log analytics error but don't fail the booking
    console.error('Failed to capture booking analytics:', analyticsError)
  }

  // Redirect to success page
  redirect('/booking/success')
}
