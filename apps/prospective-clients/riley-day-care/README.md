# Riley Day Care

<div align="center">

**Demo template for childcare center management**

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v4-38B2AC)](https://tailwindcss.com/)
[![Port](https://img.shields.io/badge/Port-3002-purple)](http://localhost:3002)

</div>

A comprehensive childcare management system demonstrating multi-tenant capabilities with parent portals, staff scheduling, activity tracking, and billing integration. Built as a production-ready template for childcare service providers.

## 🎯 **Live Demo**

![Riley Day Care Demo](https://placehold.co/800x400/6366f1/ffffff?text=Riley+Day+Care+Demo)

*Childcare management dashboard with parent communication and activity tracking*

## 🚀 Features

### 👶 **Child Management**
- **Child Profiles** - Complete information, medical records, emergency contacts
- **Activity Tracking** - Daily activities, meals, naps, and developmental milestones
- **Photo Sharing** - Secure photo galleries for parents (with consent)
- **Health Monitoring** - Allergy tracking, medication reminders, health alerts

### 👨‍👩‍👧‍👦 **Parent Portal**
- **Secure Access** - Role-based access for parents and guardians
- **Real-time Updates** - Live activity feeds and notifications
- **Communication** - Direct messaging with staff and teachers
- **Billing & Payments** - Integrated payment processing and invoice management

### 👥 **Staff Management**
- **Scheduling** - Staff scheduling, time tracking, and availability management
- **Classroom Management** - Room assignments, child-to-staff ratios
- **Training Records** - Professional development tracking and certifications
- **Performance Metrics** - Staff productivity and parent satisfaction scores

### 📊 **Operations & Compliance**
- **Attendance Tracking** - Automated check-in/out with biometric options
- **Regulatory Compliance** - State licensing requirements and reporting
- **Incident Reporting** - Automated incident documentation and parent notification
- **Analytics Dashboard** - Occupancy rates, revenue metrics, and growth insights

## 🏗️ Architecture

### **Technology Stack**
- **Framework**: Next.js 16.1 with App Router
- **Language**: TypeScript 5.7+ strict mode
- **Styling**: Tailwind CSS v4 with custom childcare theme
- **UI Components**: @agency/ui component library
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **Real-time**: WebSocket connections for live updates
- **Payments**: Stripe integration for billing
- **Notifications**: Email and SMS alerts

### **Multi-Tenant Features**
- **Tenant Isolation** - Complete data separation between centers
- **Custom Branding** - Per-center themes and logos
- **Domain Mapping** - Custom domains for each center
- **Feature Flags** - Optional features per subscription tier

## 🚀 Quick Start

### **Prerequisites**
- Node.js 22.x
- pnpm 10.x
- Supabase local instance (for development)

### **Installation & Setup**

```bash
# Navigate to riley-day-care directory
cd apps/prospective-clients/riley-day-care

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

# Notifications
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
RESEND_API_KEY=your_resend_api_key

# File Storage
NEXT_PUBLIC_CDN_URL=your_cdn_url
AWS_S3_BUCKET=your_s3_bucket
```

## 📁 Project Structure

```
apps/prospective-clients/riley-day-care/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (dashboard)/        # Parent dashboard layout
│   │   │   ├── children/      # Child management
│   │   │   ├── activities/    # Activity tracking
│   │   │   ├── billing/       # Payment management
│   │   │   └── layout.tsx     # Dashboard layout
│   │   ├── (staff)/           # Staff dashboard layout
│   │   │   ├── schedule/      # Staff scheduling
│   │   │   ├── classroom/     # Classroom management
│   │   │   └── layout.tsx     # Staff layout
│   │   ├── api/               # API routes
│   │   │   ├── children/      # Child management APIs
│   │   │   ├── billing/       # Payment processing
│   │   │   └── notifications/ # Alert system
│   │   ├── auth/              # Authentication pages
│   │   ├── onboarding/        # New parent/staff setup
│   │   └── layout.tsx         # Root layout
│   ├── components/             # Reusable components
│   │   ├── childcare/         # Childcare-specific components
│   │   ├── billing/           # Payment components
│   │   ├── notifications/    # Alert components
│   │   └── shared/            # Shared components
│   ├── lib/                   # Utilities and helpers
│   │   ├── auth.ts           # Authentication logic
│   │   ├── payments.ts       # Stripe integration
│   │   └── notifications.ts  # Notification system
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
| `pnpm dev` | Start development server on port 3002 |
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
# Parent Portal: http://localhost:3002/parent
# Staff Dashboard: http://localhost:3002/staff
# Admin Panel: http://localhost:3002/admin

# 3. Test authentication flows
# Create test parent and staff accounts
# Verify tenant isolation

# 4. Run quality checks
pnpm lint
pnpm type-check
pnpm build
```

## 🎨 Design System

### **Childcare-Specific Components**

```tsx
import { ChildCard, ActivityFeed, PaymentStatus } from '@/components/childcare'

export default function ChildDashboard() {
  return (
    <div className="space-y-6">
      <ChildCard child={child} showActivities />
      <ActivityFeed childId={child.id} />
      <PaymentStatus billingCycle="monthly" />
    </div>
  )
}
```

### **Theme Customization**

```css
/* Custom childcare theme */
:root {
  --color-brand-primary: #6366f1;
  --color-brand-secondary: #8b5cf6;
  --color-accent: #ec4899;
  --font-brand: 'Poppins', sans-serif;
}
```

## 📊 Key Features Demo

### **📱 Parent Mobile Experience**

![Mobile Parent Portal](https://placehold.co/375x667/6366f1/ffffff?text=Parent+Mobile)

*Optimized mobile experience for busy parents*

### **👥 Staff Dashboard**

![Staff Dashboard](https://placehold.co/800x400/8b5cf6/ffffff?text=Staff+Dashboard)

*Comprehensive staff management and scheduling interface*

### **💳 Billing Integration**

![Payment Processing](https://placehold.co/600x300/ec4899/ffffff?text=Billing+Dashboard)

*Automated billing and payment processing*

## 🔒 Security & Compliance

### **Child Safety & Privacy**
- **Role-Based Access** - Strict permissions for parents, staff, and admins
- **Data Encryption** - All sensitive data encrypted at rest and in transit
- **Audit Trails** - Complete logging of all access and changes
- **Photo Consent** - Explicit parental consent for photo sharing

### **Regulatory Compliance**
- **HIPAA-Ready** - Medical information protection
- **COPPA-Compliant** - Children's online privacy protection
- **State Licensing** - Configurable compliance requirements
- **Background Checks** - Staff verification and tracking

### **Payment Security**
- **PCI Compliance** - Secure payment processing
- **Fraud Detection** - Automated suspicious activity monitoring
- **Data Retention** - Configurable data retention policies
- **GDPR Support** - Right to deletion and data portability

## 📈 Business Metrics

### **Key Performance Indicators**
- **Occupancy Rate** - Real-time capacity utilization
- **Revenue per Child** - Average monthly revenue metrics
- **Parent Satisfaction** - Net Promoter Score tracking
- **Staff Retention** - Employee turnover and satisfaction

### **Analytics Dashboard**
```tsx
import { AnalyticsDashboard } from '@/components/analytics'

export default function AdminAnalytics() {
  return (
    <AnalyticsDashboard
      metrics={['occupancy', 'revenue', 'satisfaction', 'retention']}
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
vercel domains add riley-daycare.com
```

### **Environment Configuration**
- **Development** - Local development with mock data
- **Staging** - Pre-production testing with real payment sandbox
- **Production** - Live environment with full payment processing

## 🤝 Contributing

1. **Follow Development Guidelines** - See [CONTRIBUTING.md](../../../../CONTRIBUTING.md)
2. **Childcare Domain Knowledge** - Consider childcare best practices
3. **Accessibility** - Ensure WCAG 2.1 AA compliance for all users
4. **Privacy First** - Prioritize child safety and data protection
5. **Testing** - Add tests for childcare-specific workflows

## 🆘 Support

### **Getting Help**
- **📧 Email**: support@rileydaycare.com
- **💬 Chat**: In-app support for parents and staff
- **📚 Documentation**: [Complete guide](docs/)
- **🐛 Issues**: [GitHub Issues](https://github.com/agency/platform/issues)

### **Troubleshooting**
- **Payment Issues**: Check Stripe webhook configuration
- **Notification Failures**: Verify Twilio/SendGrid credentials
- **Performance**: Optimize image sizes and database queries

## 📄 License

Private - All rights reserved to the agency and Riley Day Care.

---

<div align="center">

**Demo Template for @agency Platform**

[📖 Documentation](../../../../docs/) • [🎨 Design System](../../../../packages/design-tokens/) • [🔒 Security](../../../../SECURITY.md)

</div>
