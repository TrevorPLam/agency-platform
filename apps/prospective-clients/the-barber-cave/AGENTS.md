# The Barber Cave Application

## User Information

- User has no formal software development experience or education
- User develops repositories 100% through agentic coding as a "solo-developer"
- User prefers best practices and highest standards
- User prefers up to date (2026) research conducted before task execution on proper implementation, best practices, and advanced coding patterns

## Purpose

Demo template application showcasing barbershop management features. This serves as a reference implementation for prospective clients in the personal services industry.

## Agent Skills (Available Commands)
- `pnpm dev` - Start development server
- `pnpm build` - Build application
- `pnpm test` - Run tests with coverage
- `pnpm test:e2e` - Run end-to-end tests

## Integration Points
- Depends on: `@agency/database` for data, `@agency/ui` for components
- Uses: Barbershop-specific features and workflows
- See also: `@packages/ui/AGENTS.md` for component usage
- Reference: `@packages/database/AGENTS.md` for database patterns

## Application-Specific Patterns

### Appointment Management
```typescript
// ✅ Correct - Barbershop appointment handling
import { createAppointment, updateAppointmentStatus } from '@/lib/appointments';

async function bookAppointment(
  clientId: string,
  barberId: string,
  serviceId: string,
  startTime: Date,
  tenantId: string
) {
  return await createAppointment({
    client_id: clientId,
    barber_id: barberId,
    service_id: serviceId,
    start_time: startTime,
    duration: await getServiceDuration(serviceId),
    status: 'scheduled',
    tenant_id: tenantId,
  });
}

// ❌ Incorrect - Generic booking
async function badBookAppointment(data: any) {
  return await createBooking(data); // Not barbershop-specific!
}
```

### Service Catalog Management
```typescript
// ✅ Correct - Barbershop service management
import { updateServicePricing } from '@/lib/services';

async function updateServicePrice(
  serviceId: string,
  newPrice: number,
  tenantId: string
) {
  const service = await getService(serviceId, tenantId);
  
  return await updateServicePricing({
    service_id: serviceId,
    base_price: newPrice,
    price_history: [
      ...service.price_history,
      {
        price: newPrice,
        effective_date: new Date().toISOString(),
        changed_by: 'admin',
      },
    ],
    tenant_id: tenantId,
  });
}

// ❌ Incorrect - No price history tracking
async function badUpdatePrice(serviceId: string, newPrice: number) {
  return await updateService(serviceId, { price: newPrice }); // No history!
}
```

## Package Commands

```bash
# Development
pnpm dev

# Build
pnpm build

# Type check
pnpm type-check

# Lint
pnpm lint

# Run tests
pnpm test

# E2E tests
pnpm test:e2e
```

## File Structure

```
apps/prospective-clients/the-barber-cave/
├── src/
│   ├── app/
│   │   ├── (dashboard)/       # Dashboard routes
│   │   ├── (appointments)/    # Appointment management
│   │   ├── (services)/        # Service catalog
│   │   ├── (barbers)/         # Barber management
│   │   ├── (clients)/         # Client portal
│   │   ├── api/               # API routes
│   │   ├── globals.css
│   │   ├── layout.tsx         # App layout
│   │   └── page.tsx           # Homepage
│   ├── components/
│   │   ├── appointments/      # Appointment components
│   │   ├── booking/           # Booking interface
│   │   ├── services/          # Service catalog
│   │   ├── barbers/           # Barber profiles
│   │   └── ui/                # Reusable UI
│   ├── lib/
│   │   ├── appointments.ts    # Appointment logic
│   │   ├── services.ts        # Service management
│   │   ├── scheduling.ts      # Calendar management
│   │   ├── payments.ts        # Payment processing
│   │   └── notifications.ts   # Client notifications
│   └── types/
│       ├── appointments.ts    # Appointment types
│       ├── services.ts        # Service types
│       ├── barbers.ts         # Barber types
│       └── payments.ts        # Payment types
├── AGENTS.md                  # This file
├── package.json
└── next.config.js
```

## Key Features

### Appointment Booking
- Online appointment scheduling
- Barber availability calendar
- Service selection and pricing
- Client preference management
- Automated reminders and notifications

### Service Management
- Service catalog with pricing
- Service duration management
- Barber specialization tracking
- Seasonal service offerings
- Package deals and promotions

### Barber Management
- Barber profiles and specialties
- Work schedule management
- Performance tracking
- Commission calculation
- Client assignment preferences

### Client Portal
- Appointment history
- Favorite barbers
- Service preferences
- Payment methods
- Review and rating system

### Administrative Features
- Revenue reporting
- Inventory management
- Staff scheduling
- Marketing campaigns
- Customer analytics

## Industry-Specific Patterns

### Barber Schedule Optimization
```typescript
// ✅ Correct - Schedule optimization
import { optimizeBarberSchedule } from '@/lib/scheduling';

async function createOptimalSchedule(barberId: string, date: Date, tenantId: string) {
  const appointments = await getAppointments(barberId, date, tenantId);
  const services = await getBarberServices(barberId, tenantId);
  
  return await optimizeBarberSchedule({
    barber_id: barberId,
    date,
    existing_appointments: appointments,
    services,
    constraints: {
      max_working_hours: 8,
      required_breaks: [12, 15, 18], // Lunch and breaks
      service_preferences: services.map(s => s.preferred_times),
    },
    tenant_id: tenantId,
  });
}

// ❌ Incorrect - No optimization
async function badCreateSchedule(barberId: string, date: Date) {
  return await generateSchedule(barberId, date); // No optimization!
}
```

### Commission Calculation
```typescript
// ✅ Correct - Commission tracking
import { calculateCommission } from '@/lib/commissions';

async function processBarberCommission(
  barberId: string,
  appointmentId: string,
  tenantId: string
) {
  const appointment = await getAppointment(appointmentId, tenantId);
  const barber = await getBarber(barberId, tenantId);
  
  const commission = await calculateCommission({
    barber_id: barberId,
    service_revenue: appointment.service_price,
    commission_rate: barber.commission_rate,
    bonus_eligible: appointment.is_new_client,
    tenant_id: tenantId,
  });
  
  return await recordCommission(commission);
}

// ❌ Incorrect - Flat commission only
async function badProcessCommission(barberId: string, revenue: number) {
  return await recordCommission({
    barber_id: barberId,
    amount: revenue * 0.3, // Flat 30% - no bonuses!
  });
}
```

## Security Requirements

### Client Privacy
```typescript
// ✅ Correct - Client data protection
import { sanitizeClientData } from '@/lib/privacy';

async function getClientProfile(clientId: string, requestingUserId: string, tenantId: string) {
  const client = await getClient(clientId, tenantId);
  
  if (!await canAccessClient(requestingUserId, clientId, tenantId)) {
    throw new Error('Unauthorized access to client data');
  }
  
  return await sanitizeClientData(client, 'barber_view');
}

// ❌ Incorrect - No privacy protection
async function badGetClientProfile(clientId: string) {
  return await getClient(clientId); // No access control!
}
```

### Payment Security
```typescript
// ✅ Correct - Secure payment processing
import { processPayment } from '@/lib/payments';

async function chargeForAppointment(
  appointmentId: string,
  paymentMethod: string,
  tenantId: string
) {
  const appointment = await getAppointment(appointmentId, tenantId);
  
  // Validate payment method belongs to client
  if (!await validatePaymentMethod(paymentMethod, appointment.client_id, tenantId)) {
    throw new Error('Invalid payment method');
  }
  
  return await processPayment({
    appointment_id: appointmentId,
    amount: appointment.service_price,
    payment_method: paymentMethod,
    tenant_id: tenantId,
  });
}

// ❌ Incorrect - No payment validation
async function badChargeForAppointment(appointmentId: string, paymentMethod: string) {
  return await processPayment(appointmentId, paymentMethod); // No validation!
}
```

## Testing Patterns

### Appointment Booking Testing
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { BookingForm } from '@/components/booking/booking-form';

describe('Appointment Booking', () => {
  it('prevents double booking same time slot', async () => {
    const mockBarber = createMockBarber({ id: 'barber-1' });
    const mockService = createMockService({ id: 'service-1', duration: 30 });
    
    render(
      <BookingForm 
        barber={mockBarber}
        service={mockService}
        date={new Date('2024-01-01')}
      />
    );
    
    const timeSlot = screen.getByText('10:00 AM');
    fireEvent.click(timeSlot);
    
    // Should show unavailable if already booked
    expect(screen.getByText('Time slot unavailable')).toBeInTheDocument();
  });
});
```

## Progressive Documentation

For more details:
- `@.agents/security.md` - Security guidelines
- `@packages/database/AGENTS.md` - Database patterns
- `@packages/ui/AGENTS.md` - Component usage
- `docs/BARBERSHOP.md` - Barbershop industry guide
