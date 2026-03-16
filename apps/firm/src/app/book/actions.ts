'use server'

import { getAdminClient } from '@agency/database/admin'

const AGENCY_TENANT_SLUG = 'agency'

export async function submitBooking(
  _prev: { success: boolean; message?: string },
  formData: FormData
): Promise<{ success: boolean; message?: string }> {
  const name = (formData.get('name') as string)?.trim()
  const email = (formData.get('email') as string)?.trim()
  const message = (formData.get('message') as string)?.trim()

  if (!email) {
    return { success: false, message: 'Email is required.' }
  }

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
