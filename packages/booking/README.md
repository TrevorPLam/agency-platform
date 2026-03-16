# @agency/booking

Embeddable booking widget and configuration for client sites. Provides types, Zod schema, and a React widget component. No app currently consumes this package; it is ready for integration when you add booking flows to client apps.

## Integration

**Where to use:** Client apps only (e.g. `apps/prospective-clients/<slug>` or `apps/clients/<slug>`). Import the widget in a booking page or layout, or embed in a section of a client site.

**Tenant scoping:** All booking data is tenant-scoped in Supabase (`bookings` table with `tenant_id`). Pass the current tenant id (e.g. from `NEXT_PUBLIC_TENANT_SLUG` or from middleware/context) into `BookingConfig.tenantId` so the widget and any API calls are scoped to that client.

**Example (client app page or layout):**

```tsx
'use client'

import { BookingWidget } from '@agency/booking'

export default function BookingPage() {
  const tenantId = process.env.NEXT_PUBLIC_TENANT_SLUG ?? ''
  return (
    <BookingWidget
      config={{
        tenantId,
        serviceSlug: 'haircut',
        locale: 'en-US',
      }}
      className="max-w-md mx-auto"
    />
  )
}
```

**Required:** Add `@agency/booking` as a dependency in the client app’s `package.json` (`"@agency/booking": "workspace:*"`). Ensure the app has React/React-DOM as dependencies or peer dependencies.

**Config:** Use `bookingConfigSchema` from `@agency/booking` to validate config (e.g. from env or API) before passing to the widget. See `src/schema/config.schema.ts` and `src/types/config.ts` for full options (`minAdvanceHours`, `maxDaysAhead`, etc.).
