# @agency/booking

<div align="center">

**Embeddable booking widget and configuration for client sites**

[![npm version](https://img.shields.io/npm/v/@agency/booking)](https://www.npmjs.org/package/@agency/booking)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18+-blue)](https://reactjs.org/)

</div>

Provides types, Zod schema, and a React widget component for booking functionality. **Currently implemented and in use** in the agency's firm booking flow with server-side analytics integration.

## 🚀 Features

### 🎯 Core Functionality
- **Embeddable Widget** - React component for seamless integration
- **Type Safety** - Full TypeScript support with Zod validation
- **Tenant Isolation** - Multi-tenant data isolation via Supabase RLS
- **Configurable** - Flexible configuration options for different booking types
- **Server Actions** - Next.js 16 Server Actions with redirect patterns
- **Analytics Integration** - Server-side PostHog event tracking

### 🏗️ Architecture Benefits
- **Zero Dependencies** - Lightweight implementation
- **Framework Agnostic** - Works with any React app
- **Accessible** - WCAG 2.1 AA compliant components
- **Performance Optimized** - Minimal bundle size impact
- **Conversion Focused** - Success page optimization and analytics

## 📦 Installation

```bash
pnpm add @agency/booking
```

## 🔧 Integration

### 📍 Current Implementation (Agency Firm)

The booking system is **actively implemented** in `apps/firm/src/app/book/` with:

- **Booking Page**: `/book` with form validation and honeypot protection
- **Success Page**: `/booking/success` with conversion-optimized UX
- **Server Actions**: Form submission with analytics and redirect
- **Analytics Events**: `booking_submitted` events with tenant context

### 🔒 Tenant Scoping

All booking data is tenant-scoped in Supabase (`bookings` table with `tenant_id`). Pass the current tenant id (e.g. from `NEXT_PUBLIC_TENANT_SLUG` or from middleware/context) into `BookingConfig.tenantId` so the widget and any API calls are scoped to that client.

### 💡 Real Usage Example (Agency Firm)

```tsx
// apps/firm/src/app/book/page.tsx
import { BookingWidget } from '@agency/booking'
import { submitBooking } from './actions'

export default async function BookPage() {
  const tenantId = await getAgencyTenantId()
  
  return (
    <main>
      <BookingWidget 
        config={{ tenantId }} 
        submitAction={submitBooking}
      />
    </main>
  )
}
```

```tsx
// apps/firm/src/app/book/actions.ts
'use server'
import { redirect } from 'next/navigation'
import { captureServerEvent } from '@agency/analytics/server'

export async function submitBooking(formData: FormData) {
  // 1. Validate form data with Zod
  // 2. Insert booking into database
  // 3. Capture analytics event
  captureServerEvent(email, 'booking_submitted', {
    tenant: 'agency',
    booking_id: bookingData.id,
    submission_source: 'firm_booking_form',
  })
  
  // 4. Redirect to success page
  redirect('/booking/success')
}
```

### ⚙️ Configuration Requirements

**Required:** Add `@agency/booking` as a dependency in the client app's `package.json` (`"@agency/booking": "workspace:*"`). Ensure the app has React/React-DOM as dependencies or peer dependencies.

**Validation:** Use `bookingConfigSchema` from `@agency/booking` to validate config (e.g. from env or API) before passing to the widget. See `src/schema/config.schema.ts` and `src/types/config.ts` for full options (`minAdvanceHours`, `maxDaysAhead`, etc.).

## 📚 API Reference

### BookingWidget

The main React component for rendering the booking interface.

#### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `config` | `BookingConfig` | ✅ | Booking configuration object |
| `className` | `string` | ❌ | Additional CSS classes |
| `submitAction` | `BookingSubmitAction` | ❌ | Server action for form submission |

### BookingConfig

Configuration object for the booking widget.

#### Properties

| Property | Type | Required | Description |
|-----------|------|----------|-------------|
| `tenantId` | `string` | ✅ | Tenant identifier for data isolation |
| `serviceSlug` | `string` | ❌ | Service type identifier |
| `locale` | `string` | ❌ | Localization (default: 'en-US') |
| `minAdvanceHours` | `number` | ❌ | Minimum booking advance time |
| `maxDaysAhead` | `number` | ❌ | Maximum booking window |
| `timeSlotInterval` | `number` | ❌ | Time slot duration in minutes |

### Types

```typescript
interface Booking {
  id: string
  tenantId: string
  serviceSlug: string
  customerEmail: string
  startTime: Date
  endTime: Date
  status: 'pending' | 'confirmed' | 'cancelled'
  createdAt: Date
}

interface BookingConfig {
  tenantId: string
  serviceSlug?: string
  locale?: string
  minAdvanceHours?: number
  maxDaysAhead?: number
  timeSlotInterval?: number
}

type BookingSubmitAction = (
  prev: { success: boolean; message?: string },
  formData: FormData
) => Promise<{ success: boolean; message?: string } | void>
```

## 🗄️ Database Schema

The booking system uses the following database tables:

- `bookings` - Main booking records (✅ **IMPLEMENTED**)
- `services` - Available services and configurations (📋 **PLANNED**)
- `time_slots` - Available time slots for booking (📋 **PLANNED**)

All tables include Row-Level Security (RLS) for tenant isolation.

## � Analytics Integration

### Server-Side Events

The booking system automatically captures analytics events:

```typescript
// Event: booking_submitted
captureServerEvent(email, 'booking_submitted', {
  tenant: 'agency',
  booking_id: bookingData.id,
  has_name: !!name,
  has_message: !!message,
  submission_source: 'firm_booking_form',
})
```

### Event Schema

- **Event Name**: `booking_submitted` (follows `[object] [verb]` convention)
- **Properties**:
  - `tenant`: Tenant slug for multi-tenant analytics
  - `booking_id`: Database record ID for attribution
  - `has_name`: Whether user provided their name
  - `has_message`: Whether user included a message
  - `submission_source`: Which form/widget submitted the booking

## �🔒 Security Considerations

### Row-Level Security (RLS)

All booking data is isolated by tenant:

```sql
-- Only users can access bookings in their tenant
CREATE POLICY "Users can view bookings in their tenant" ON public.bookings
  FOR SELECT USING (tenant_id = public.tenant_id());
```

### Data Validation

- **Zod Validation**: All form inputs validated with strict schemas
- **Honeypot Protection**: Bot detection via hidden form fields
- **Rate Limiting**: Booking submissions rate limited
- **Audit Logging**: All booking operations logged

### Server Actions Security

- **No Client Secrets**: Server actions handle sensitive operations
- **Tenant Scoping**: All database operations tenant-scoped
- **Input Sanitization**: Comprehensive input validation

## 🎨 Styling & Theming

The widget uses CSS variables for theming:

```css
.booking-widget {
  --booking-primary-color: #3b82f6;
  --booking-background-color: #ffffff;
  --booking-text-color: #1f2937;
  --booking-border-color: #e5e7eb;
  --booking-border-radius: 0.5rem;
}
```

## 🧪 Testing

```bash
# Run tests
pnpm test

# Run tests with coverage
pnpm test --coverage

# Type checking
pnpm type-check
```

## 🔧 Development

```bash
# Install dependencies
pnpm install

# Start development
pnpm dev

# Build package
pnpm build

# Lint code
pnpm lint
```

## 🚀 Current Status

### ✅ Implemented
- **Basic Booking Flow**: Form validation, database storage, success page
- **Server Actions**: Next.js 16 Server Actions with proper redirects
- **Analytics Integration**: Server-side PostHog event tracking
- **Security**: Zod validation, honeypot protection, tenant isolation
- **UI/UX**: Conversion-optimized success page and form experience

### 📋 Planned Enhancements
- **Time Slot Selection**: Calendar integration for specific booking times
- **Service Configuration**: Multiple service types and pricing
- **Email Notifications**: Automated confirmation and reminder emails
- **Admin Dashboard**: Booking management interface
- **Client Widget**: Embeddable widget for client sites

## 🤝 Contributing

1. Follow the existing code patterns and TypeScript strict mode
2. Add comprehensive tests for new features
3. Update documentation for API changes
4. Ensure accessibility compliance (WCAG 2.1 AA)
5. Test with different client configurations

## 📄 License

ISC License - see LICENSE file for details.

---

<div align="center">

**Part of the @agency monorepo**

[📖 Documentation](../../docs/) • [🎨 Design System](../../packages/design-tokens/) • [🔒 Security](../../SECURITY.md)

</div>
