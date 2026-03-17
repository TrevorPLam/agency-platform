# The Barber Cave

<div align="center">

**Demo template for barbershop and salon management**

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v4-38B2AC)](https://tailwindcss.com/)
[![Port](https://img.shields.io/badge/Port-3003-orange)](http://localhost:3003)

</div>

A modern barbershop management system demonstrating multi-tenant capabilities with appointment booking, staff management, inventory tracking, and customer loyalty programs. Built as a production-ready template for barbershops and hair salons.

## 💈 **Live Demo**

![Barber Cave Demo](https://placehold.co/800x400/ea580c/ffffff?text=The+Barber+Cave+Demo)

*Barbershop management dashboard with appointment scheduling and customer management*

## 🚀 Features

### ✂️ **Appointment Booking**
- **Online Booking** - Customer self-service appointment scheduling
- **Calendar Integration** - Google Calendar and Outlook sync
- **Service Catalog** - Detailed service descriptions and pricing
- **Staff Availability** - Real-time availability and scheduling preferences
- **Automated Reminders** - SMS and email appointment reminders

### 👥 **Customer Management**
- **Customer Profiles** - Service history, preferences, and notes
- **Loyalty Program** - Points system and rewards tracking
- **Photo Gallery** - Before/after photos with customer consent
- **Communication** - Direct messaging and promotional campaigns
- **Feedback System** - Service ratings and review collection

### 💰 **Business Operations**
- **Point of Sale** - Integrated payment processing and tipping
- **Inventory Management** - Product tracking and automated reordering
- **Staff Commission** - Automated commission calculations and reporting
- **Revenue Analytics** - Daily, weekly, and monthly performance metrics
- **Expense Tracking** - Supply costs and operational expenses

### 🎨 **Brand & Marketing**
- **Custom Branding** - Salon-specific themes and logos
- **Social Media Integration** - Instagram gallery and social sharing
- **Promotional Campaigns** - Discount codes and special offers
- **Email Marketing** - Newsletter campaigns and customer retention
- **Online Presence** - SEO-optimized service pages

## 🏗️ Architecture

### **Technology Stack**
- **Framework**: Next.js 16.1 with App Router
- **Language**: TypeScript 5.7+ strict mode
- **Styling**: Tailwind CSS v4 with barber shop theme
- **UI Components**: @agency/ui component library
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **Real-time**: WebSocket connections for live booking
- **Payments**: Stripe integration for processing
- **Calendar**: Google Calendar API integration

### **Multi-Tenant Features**
- **Shop Isolation** - Complete data separation between locations
- **Custom Branding** - Per-shop themes and color schemes
- **Domain Mapping** - Custom domains for each shop
- **Feature Tiers** - Basic, Pro, and Enterprise plans

## 🚀 Quick Start

### **Prerequisites**
- Node.js 22.x
- pnpm 10.x
- Supabase local instance (for development)

### **Installation & Setup**

```bash
# Navigate to the-barber-cave directory
cd apps/prospective-clients/the-barber-cave

# Install dependencies
pnpm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your configuration

# Start development server
pnpm dev
```

### **Environment Variables**

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Payment Processing
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# Calendar Integration
GOOGLE_CALENDAR_CLIENT_ID=your_google_client_id
GOOGLE_CALENDAR_CLIENT_SECRET=your_google_client_secret

# SMS Reminders
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_number

# Email Marketing
RESEND_API_KEY=your_resend_api_key
MAILCHIMP_API_KEY=your_mailchimp_key
```

## 📁 Project Structure

```
apps/prospective-clients/the-barber-cave/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (booking)/          # Customer booking flow
│   │   │   ├── services/       # Service selection
│   │   │   ├── staff/          # Staff selection
│   │   │   ├── calendar/       # Time slot selection
│   │   │   └── checkout/       # Payment processing
│   │   ├── (dashboard)/        # Staff dashboard layout
│   │   │   ├── appointments/   # Appointment management
│   │   │   ├── customers/      # Customer management
│   │   │   ├── inventory/      # Product tracking
│   │   │   └── analytics/      # Business metrics
│   │   ├── api/               # API routes
│   │   │   ├── appointments/   # Booking APIs
│   │   │   ├── payments/       # Payment processing
│   │   │   ├── calendar/       # Calendar sync
│   │   │   └── notifications/ # Reminder system
│   │   ├── auth/              # Authentication pages
│   │   ├── gallery/           # Photo gallery
│   │   └── layout.tsx         # Root layout
│   ├── components/             # Reusable components
│   │   ├── booking/           # Appointment booking components
│   │   ├── calendar/          # Calendar components
│   │   ├── payments/          # Payment components
│   │   └── salon/             # Salon-specific components
│   ├── lib/                   # Utilities and helpers
│   │   ├── auth.ts           # Authentication logic
│   │   ├── calendar.ts       # Google Calendar integration
│   │   ├── payments.ts       # Stripe integration
│   │   └── sms.ts           # Twilio SMS service
│   └── middleware.ts          # Authentication and tenant middleware
├── package.json
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

## 🔧 Development

### **Available Scripts**

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server on port 3003 |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint with strict warnings |
| `pnpm type-check` | TypeScript type checking |
| `pnpm test` | Run tests (when implemented) |

### **Development Workflow**

```bash
# 1. Start development server
pnpm dev

# 2. Access the application
# Customer Booking: http://localhost:3003/book
# Staff Dashboard: http://localhost:3003/dashboard
# Admin Panel: http://localhost:3003/admin

# 3. Test appointment flow
# Create test services and staff
# Test booking and payment process

# 4. Verify calendar integration
# Connect Google Calendar
# Test appointment sync

# 5. Run quality checks
pnpm lint
pnpm type-check
pnpm build
```

## 🎨 Design System

### **Salon-Specific Components**

```tsx
import { BookingCalendar, ServiceCard, CustomerProfile } from '@/components/salon'

export default function BookingPage() {
  return (
    <div className="space-y-6">
      <ServiceCard service={service} showPrice />
      <BookingCalendar staffId={staffId} />
      <CustomerProfile customer={customer} showHistory />
    </div>
  )
}
```

### **Theme Customization**

```css
/* Custom barber shop theme */
:root {
  --color-brand-primary: #ea580c;
  --color-brand-secondary: #dc2626;
  --color-accent: #f59e0b;
  --font-brand: 'Barber', sans-serif;
}
```

## 📊 Key Features Demo

### **📱 Customer Booking Experience**

![Mobile Booking](https://placehold.co/375x667/ea580c/ffffff?text=Mobile+Booking)

*Mobile-first booking interface for customers*

### **📅 Staff Calendar View**

![Staff Calendar](https://placehold.co/800x400/dc2626/ffffff?text=Staff+Calendar)

*Real-time calendar with appointment management*

### **💳 Payment Processing**

![Payment Dashboard](https://placehold.co/600x300/f59e0b/ffffff?text=Payment+Dashboard)

*Integrated payment processing and tipping*

## 🔒 Security & Privacy

### **Data Protection**
- **Customer Privacy** - Secure handling of personal information
- **Payment Security** - PCI-compliant payment processing
- **Data Encryption** - All sensitive data encrypted
- **Access Controls** - Role-based permissions for staff

### **Business Security**
- **Appointment Security** - Prevent double-bookings and conflicts
- **Fraud Prevention** - Chargeback protection and verification
- **Staff Permissions** - Granular access controls by role
- **Audit Trails** - Complete logging of business operations

## 📈 Business Intelligence

### **Performance Metrics**
- **Revenue Tracking** - Daily, weekly, and monthly revenue
- **Customer Retention** - Repeat visit rates and loyalty metrics
- **Staff Performance** - Productivity and customer satisfaction
- **Service Analytics** - Most popular services and pricing optimization

### **Analytics Dashboard**
```tsx
import { BusinessAnalytics } from '@/components/analytics'

export default function SalonAnalytics() {
  return (
    <BusinessAnalytics
      metrics={['revenue', 'customers', 'staff', 'services']}
      dateRange="last-30-days"
      exportEnabled
    />
  )
}
```

## 🚀 Deployment

### **Production Setup**

```bash
# Build for production
pnpm build

# Deploy to Vercel (recommended)
vercel --prod

# Configure custom domain
vercel domains add thebarbercave.com
```

### **Environment Configuration**
- **Development** - Local development with mock data
- **Staging** - Pre-production with payment sandbox
- **Production** - Live environment with full processing

## 🤝 Contributing

1. **Follow Development Guidelines** - See [CONTRIBUTING.md](../../../../CONTRIBUTING.md)
2. **Salon Industry Knowledge** - Consider barbershop best practices
3. **Mobile-First Design** - Prioritize mobile booking experience
4. **Payment Testing** - Test payment flows thoroughly
5. **Calendar Integration** - Ensure reliable calendar sync

## 🆘 Support

### **Getting Help**
- **📧 Email**: support@thebarbercave.com
- **💬 Chat**: In-app support for staff and customers
- **📚 Documentation**: [Complete guide](docs/)
- **🐛 Issues**: [GitHub Issues](https://github.com/agency/platform/issues)

### **Troubleshooting**
- **Calendar Sync**: Check Google API credentials and permissions
- **Payment Issues**: Verify Stripe webhook configuration
- **SMS Failures**: Confirm Twilio number and credits
- **Performance**: Optimize image sizes and database queries

## 📄 License

Private - All rights reserved to the agency and The Barber Cave.

---

<div align="center">

**Demo Template for @agency Platform**

[📖 Documentation](../../../../docs/) • [🎨 Design System](../../../../packages/design-tokens/) • [🔒 Security](../../../../SECURITY.md)

</div>
