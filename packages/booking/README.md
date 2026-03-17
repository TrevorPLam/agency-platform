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

## 🆘 **Troubleshooting & Support**

### **🔧 Common Issues & Solutions**

#### **1. Booking Widget Not Rendering**

**Symptoms**: Widget doesn't appear, blank space, React errors

**Solutions**:
- ✅ Check import path: `import { BookingWidget } from '@agency/booking'`
- ✅ Verify React and React-DOM are dependencies
- ✅ Ensure proper tenantId configuration
- ✅ Check for TypeScript errors in console

```tsx
// Debug booking widget
import { BookingWidget } from '@agency/booking'

export default function DebugBookingPage() {
  const config = { tenantId: 'test-tenant' }
  console.log('Booking config:', config)
  
  return (
    <div>
      <h1>Debug Booking</h1>
      <BookingWidget config={config} />
    </div>
  )
}
```

#### **2. Form Submission Failures**

**Symptoms**: Submit button not working, server action errors

**Solutions**:
- ✅ Verify server action is properly exported
- ✅ Check form validation with Zod schemas
- ✅ Ensure proper FormData handling
- ✅ Review tenant scoping in database operations

```tsx
// Debug form submission
export async function debugSubmitBooking(formData: FormData) {
  try {
    console.log('Form data received:', Object.fromEntries(formData))
    
    // Validate with Zod
    const validated = bookingFormSchema.parse(formData)
    console.log('Validated data:', validated)
    
    // Test database connection
    const result = await supabase.from('bookings').insert(validated)
    console.log('Database result:', result)
    
    return { success: true }
  } catch (error) {
    console.error('Submission error:', error)
    return { success: false, message: error.message }
  }
}
```

#### **3. Tenant Isolation Issues**

**Symptoms**: Data from wrong tenant, RLS policy errors

**Solutions**:
- ✅ Verify tenantId is properly passed to config
- ✅ Check RLS policies on bookings table
- ✅ Ensure middleware sets tenant context
- ✅ Test with different tenant values

```typescript
// Debug tenant isolation
export async function debugTenantIsolation(tenantId: string) {
  try {
    // Test tenant context
    const currentTenant = await getCurrentTenantId()
    console.log('Current tenant:', currentTenant)
    console.log('Expected tenant:', tenantId)
    
    // Test RLS policy
    const bookings = await supabase
      .from('bookings')
      .select('*')
      .eq('tenant_id', tenantId)
    
    console.log(`Found ${bookings.data?.length || 0} bookings for tenant ${tenantId}`)
    
    // Verify all bookings belong to correct tenant
    const hasWrongTenant = bookings.data?.some(b => b.tenant_id !== tenantId)
    if (hasWrongTenant) {
      console.error('RLS policy violation detected!')
    }
    
  } catch (error) {
    console.error('Tenant isolation error:', error.message)
  }
}
```

#### **4. Analytics Events Not Tracking**

**Symptoms**: No booking events in PostHog, missing analytics

**Solutions**:
- ✅ Verify PostHog configuration and API keys
- ✅ Check server-side analytics import
- ✅ Ensure proper event naming conventions
- ✅ Test analytics event structure

```typescript
// Debug analytics tracking
export async function debugAnalyticsTracking(email: string, bookingId: string) {
  try {
    console.log('Testing analytics tracking...')
    
    // Test basic event
    await captureServerEvent(email, 'test_event', {
      tenant: 'test-tenant',
      booking_id: bookingId,
      test: true
    })
    
    console.log('Analytics test event sent successfully')
    
    // Test booking event structure
    const bookingEvent = {
      tenant: 'test-tenant',
      booking_id: bookingId,
      has_name: true,
      has_message: true,
      submission_source: 'debug_form'
    }
    
    console.log('Booking event structure:', bookingEvent)
    
  } catch (error) {
    console.error('Analytics error:', error.message)
  }
}
```

#### **5. Styling and Theming Issues**

**Symptoms**: Widget not styled, CSS variables not working

**Solutions**:
- ✅ Ensure design tokens are imported
- ✅ Check CSS variable definitions
- ✅ Verify Tailwind CSS configuration
- ✅ Test custom theme overrides

```css
/* Debug booking widget styling */
.booking-widget {
  /* Debug borders */
  border: 2px solid red;
  
  /* Debug colors */
  background-color: var(--booking-background-color, yellow);
  color: var(--booking-text-color, black);
  
  /* Debug spacing */
  padding: 1rem;
  margin: 1rem;
}

/* Debug CSS variables */
:root {
  --debug-booking-primary: var(--booking-primary-color, red);
}
```

### **🔍 Advanced Debugging Tools**

#### **Booking Form Validator**
```typescript
// Comprehensive form validation
export function validateBookingForm(formData: FormData) {
  const errors: Record<string, string> = {}
  
  // Email validation
  const email = formData.get('email') as string
  if (!email || !email.includes('@')) {
    errors.email = 'Valid email required'
  }
  
  // Required fields
  const requiredFields = ['name', 'email', 'service']
  requiredFields.forEach(field => {
    const value = formData.get(field) as string
    if (!value || value.trim() === '') {
      errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`
    }
  })
  
  // Honeypot check (bot protection)
  const honeypot = formData.get('website') as string
  if (honeypot && honeypot.trim() !== '') {
    errors.bot = 'Bot detected'
  }
  
  console.log('Form validation results:', errors)
  return { isValid: Object.keys(errors).length === 0, errors }
}
```

#### **Database Connection Monitor**
```typescript
// Monitor database health
export async function monitorDatabaseHealth() {
  try {
    // Test basic connection
    const ping = await supabase.from('bookings').select('count').single()
    console.log('Database connection OK')
    
    // Test RLS policies
    const tenantTest = await supabase
      .from('bookings')
      .select('*')
      .eq('tenant_id', 'test-tenant')
      .limit(1)
    
    console.log('RLS policies working:', tenantTest.error === null)
    
    // Test write permissions
    const writeTest = await supabase
      .from('bookings')
      .insert({
        tenant_id: 'test-tenant',
        customer_email: 'test@example.com',
        service_slug: 'test-service',
        status: 'test'
      })
      .select()
    
    console.log('Write permissions OK:', writeTest.error === null)
    
    // Cleanup test data
    if (writeTest.data?.[0]?.id) {
      await supabase.from('bookings').delete().eq('id', writeTest.data[0].id)
    }
    
    return { healthy: true, message: 'All database checks passed' }
    
  } catch (error) {
    console.error('Database health check failed:', error.message)
    return { healthy: false, message: error.message }
  }
}
```

#### **Performance Monitor**
```typescript
// Monitor booking performance
export function useBookingPerformance() {
  const startTime = useRef(Date.now())
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    validationTime: 0,
    submissionTime: 0
  })
  
  const measureRender = () => {
    const renderTime = Date.now() - startTime.current
    setMetrics(prev => ({ ...prev, renderTime }))
    console.log(`Booking widget rendered in ${renderTime}ms`)
  }
  
  const measureValidation = (validationTime: number) => {
    setMetrics(prev => ({ ...prev, validationTime }))
    console.log(`Form validation completed in ${validationTime}ms`)
  }
  
  const measureSubmission = (submissionTime: number) => {
    setMetrics(prev => ({ ...prev, submissionTime }))
    console.log(`Form submission completed in ${submissionTime}ms`)
  }
  
  return { metrics, measureRender, measureValidation, measureSubmission }
}
```

### **📞 Getting Help**

**Self-Service Debugging**:
1. Check browser console for React errors
2. Verify booking widget imports and exports
3. Test form validation with sample data
4. Check database connection and RLS policies
5. Verify analytics event tracking

**Community Support**:
- **GitHub Issues**: [Agency Platform Issues](https://github.com/agency/platform/issues)
- **Discord Community**: [Join our Discord](https://discord.gg/agency)
- **Documentation**: [Complete booking guide](../../docs/booking/)
- **Email Support**: booking@agency.com

**Common Debug Commands**:
```bash
# Test booking widget
pnpm run booking:test-widget

# Validate booking schema
pnpm run booking:validate-schema

# Check database connection
pnpm run booking:test-db

# Test analytics tracking
pnpm run booking:test-analytics

# Run booking health check
pnpm run booking:health-check
```

## 📄 License

ISC License - see LICENSE file for details.

---

<div align="center">

**Part of the @agency monorepo**

[📖 Documentation](../../docs/) • [🎨 Design System](../../packages/design-tokens/) • [🔒 Security](../../SECURITY.md)

</div>
