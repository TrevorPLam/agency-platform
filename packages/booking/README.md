# @agency/booking

<div align="center">

**Embeddable booking widget and configuration for client sites**

[![npm version](https://img.shields.io/npm/v/@agency/booking)](https://www.npmjs.com/package/@agency/booking)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18+-blue)](https://reactjs.org/)

</div>

Provides types, Zod schema, and a React widget component for booking functionality. No app currently consumes this package; it is ready for integration when you add booking flows to client apps.

## 🚀 Features

### 🎯 Core Functionality
- **Embeddable Widget** - React component for seamless integration
- **Type Safety** - Full TypeScript support with Zod validation
- **Tenant Isolation** - Multi-tenant data isolation via Supabase RLS
- **Configurable** - Flexible configuration options for different booking types

### 🏗️ Architecture Benefits
- **Zero Dependencies** - Lightweight implementation
- **Framework Agnostic** - Works with any React app
- **Accessible** - WCAG 2.1 AA compliant components
- **Performance Optimized** - Minimal bundle size impact

## 📦 Installation

```bash
pnpm add @agency/booking
```

## 🔧 Integration

### 📍 Where to Use
**Client apps only** (e.g. `apps/prospective-clients/<slug>` or `apps/clients/<slug>`). Import the widget in a booking page or layout, or embed in a section of a client site.

### 🔒 Tenant Scoping
All booking data is tenant-scoped in Supabase (`bookings` table with `tenant_id`). Pass the current tenant id (e.g. from `NEXT_PUBLIC_TENANT_SLUG` or from middleware/context) into `BookingConfig.tenantId` so the widget and any API calls are scoped to that client.

### 💡 Quick Example

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
| `onBookingComplete` | `(booking: Booking) => void` | ❌ | Callback for successful bookings |
| `onError` | `(error: Error) => void` | ❌ | Error handler |

### BookingConfig

Configuration object for the booking widget.

#### Properties

| Property | Type | Required | Description |
|-----------|------|----------|-------------|
| `tenantId` | `string` | ✅ | Tenant identifier for data isolation |
| `serviceSlug` | `string` | ✅ | Service type identifier |
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
  serviceSlug: string
  locale?: string
  minAdvanceHours?: number
  maxDaysAhead?: number
  timeSlotInterval?: number
}
```

## 🗄️ Database Schema

The booking system uses the following database tables:

- `bookings` - Main booking records
- `services` - Available services and configurations
- `time_slots` - Available time slots for booking

All tables include Row-Level Security (RLS) for tenant isolation.

## 🔒 Security Considerations

### Row-Level Security (RLS)

All booking data is isolated by tenant:

```sql
-- Only users can access bookings in their tenant
CREATE POLICY "Users can view bookings in their tenant" ON public.bookings
  FOR SELECT USING (tenant_id = public.tenant_id());
```

### Data Validation

- All configuration validated via Zod schemas
- Input sanitization for booking data
- Rate limiting for booking submissions
- Audit logging for all booking operations

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
