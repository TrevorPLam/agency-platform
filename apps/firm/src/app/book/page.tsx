import { getAdminClient } from '@agency/database/admin'
import { BookingWidget } from '@agency/booking'
import { submitBooking } from './actions'

const AGENCY_TENANT_SLUG = 'agency'

async function getAgencyTenantId(): Promise<string | null> {
  const admin = getAdminClient()
  const { data } = await admin.from('tenants').select('id').eq('slug', AGENCY_TENANT_SLUG).single()
  return data?.id ?? null
}

export const metadata = {
  title: 'Book a Call',
  description: 'Request a call or demo with our agency.',
}

export default async function BookPage() {
  const tenantId = await getAgencyTenantId()
  if (!tenantId) {
    return (
      <main className="container mx-auto max-w-md px-4 py-12">
        <p className="text-slate-600">Booking is not configured. Add the agency tenant to the database.</p>
      </main>
    )
  }

  return (
    <main className="container mx-auto max-w-md px-4 py-12">
      <h1 className="mb-6 text-3xl font-bold text-slate-900 dark:text-white">Book a Call</h1>
      <p className="mb-8 text-slate-600 dark:text-slate-300">
        Tell us a bit about yourself and we&apos;ll get back to you to schedule a time.
      </p>
      <BookingWidget config={{ tenantId }} submitAction={submitBooking} />
    </main>
  )
}
