# Firm

<div align="center">

**Agency marketing website and client acquisition platform**

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v4-38B2AC)](https://tailwindcss.com/)
[![Port](https://img.shields.io/badge/Port-3000-green)](http://localhost:3000)

</div>

Professional marketing website showcasing agency services, case studies, and thought leadership. Serves as the primary client acquisition and brand awareness platform with integrated booking, contact, and content management capabilities.

## 🚀 Features

### 🎯 **Marketing & Branding**
- **Modern Design** - Clean, responsive design with accessibility compliance
- **Brand Storytelling** - Compelling narrative about agency expertise and values
- **Service Showcase** - Detailed service descriptions and value propositions
- **Client Portfolio** - Case studies, testimonials, and success stories

### 📝 **Content Management**
- **Blog Platform** - Thought leadership articles and industry insights
- **Dynamic Content** - SEO-optimized content with proper meta tags
- **Media Gallery** - Project showcases, images, and videos
- **Resource Library** - Whitepapers, guides, and downloadable assets

### 🤝 **Client Engagement**
- **Contact Forms** - Multi-channel contact and inquiry management
- **Booking System** - Integrated consultation scheduling and booking
- **Newsletter Signup** - Email subscription and lead capture
- **Social Proof** - Testimonials, awards, and industry recognition

### 📊 **Analytics & Optimization**
- **User Tracking** - Comprehensive analytics with PostHog integration
- **Performance Monitoring** - Page speed, Core Web Vitals, and user experience
- **Conversion Tracking** - Lead generation and conversion funnel analysis
- **SEO Optimization** - Search engine optimization and sitemap generation

## 🏗️ Architecture

### **Technology Stack**
- **Framework**: Next.js 16.1 with App Router
- **Language**: TypeScript 5.7+ strict mode
- **Styling**: Tailwind CSS v4 with design tokens
- **UI Components**: @agency/ui component library
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **Analytics**: PostHog for user behavior tracking
- **Email**: @agency/email for contact form submissions
- **Booking**: @agency/booking for consultation scheduling

### **Key Integrations**
- **@agency/ui** - Shared component library with consistent theming
- **@agency/analytics** - PostHog wrapper for usage analytics
- **@agency/booking** - Consultation booking and scheduling
- **@agency/database** - Type-safe database client factories
- **@agency/email** - Contact form notifications and communications

## 🚀 Quick Start

### **Prerequisites**
- Node.js 22.x
- pnpm 10.x
- Supabase local instance (for development)

### **Installation & Setup**

```bash
# Navigate to firm directory
cd apps/firm

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

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key

# Email Configuration
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=noreply@youragency.com

# Booking Configuration
NEXT_PUBLIC_CALENDAR_URL=your_calendar_webhook_url
```

## 📁 Project Structure

```
apps/firm/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── about/             # About us page
│   │   ├── blog/              # Blog and content
│   │   │   ├── [slug]/       # Dynamic blog posts
│   │   │   └── page.tsx      # Blog listing
│   │   ├── book/              # Booking and consultation
│   │   │   ├── confirmation/  # Booking confirmation
│   │   │   └── page.tsx      # Booking form
│   │   ├── contact/           # Contact pages
│   │   │   ├── success/       # Contact success
│   │   │   └── page.tsx      # Contact form
│   │   ├── services/          # Services pages
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Homepage
│   │   ├── robots.ts          # SEO robots.txt
│   │   └── sitemap.ts         # SEO sitemap
│   ├── components/             # Reusable components
│   │   ├── sections/          # Page sections
│   │   ├── ui/                # UI components
│   │   └── forms/             # Form components
│   └── lib/                   # Utilities and helpers
├── e2e/                       # Playwright E2E tests
├── tokens/                    # Design token overrides
├── package.json
├── playwright.config.ts       # E2E test configuration
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

## 🔧 Development

### **Available Scripts**

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server on port 3000 |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint with strict warnings |
| `pnpm type-check` | TypeScript type checking |
| `pnpm test` | Run Playwright E2E tests |

### **Development Workflow**

```bash
# 1. Start development server
pnpm dev

# 2. Make changes to components/pages
# 3. Test in browser at http://localhost:3000
# 4. Run linting and type checking
pnpm lint
pnpm type-check

# 5. Run E2E tests
pnpm test

# 6. Build to verify production readiness
pnpm build
```

## 🎨 Design System

### **Component Usage**
```tsx
import { Button, Card, Input } from '@agency/ui'

export default function ContactForm() {
  return (
    <Card className="max-w-md mx-auto">
      <Input placeholder="Your name" />
      <Input placeholder="Your email" type="email" />
      <Button variant="primary">Send Message</Button>
    </Card>
  )
}
```

### **Design Tokens**
The app uses design tokens from `@agency/design-tokens` with potential customizations in `tokens/`:

```css
/* Custom theme overrides for firm branding */
:root {
  --color-brand-primary: #1e40af;
  --color-brand-secondary: #3730a3;
  --font-brand: 'Inter', sans-serif;
}
```

## 🧪 Testing

### **E2E Testing with Playwright**
```bash
# Run all E2E tests
pnpm test:e2e

# Run specific test file
pnpm test:e2e e2e/smoke.spec.ts

# Run tests in headed mode
pnpm test:e2e --headed

# Run tests with UI mode
pnpm test:e2e --ui
```

### **Test Structure**
```
e2e/
├── smoke.spec.ts             # Primary render smoke checks
└── error-handling.spec.ts    # Not-found and form surface checks
```

### **Testing Guidelines**
- **Critical User Journeys** - Contact, booking, and navigation flows
- **Accessibility** - WCAG 2.1 AA compliance testing
- **Cross-browser** - Chrome, Firefox, Safari compatibility
- **Responsive Design** - Mobile, tablet, desktop layouts

## 📊 Analytics & SEO

### **PostHog Integration**
```tsx
import { usePostHog } from '@agency/analytics'

export default function HomePage() {
  const posthog = usePostHog()
  
  const handleContactSubmit = () => {
    posthog.capture('contact_form_submitted', {
      source: 'homepage'
    })
  }
}
```

### **SEO Optimization**
- **Meta Tags** - Dynamic meta tags for each page
- **Structured Data** - JSON-LD for search engines
- **Sitemap** - Auto-generated sitemap.xml
- **Robots.txt** - Search engine crawling instructions

### **Performance Metrics**
- **Core Web Vitals** - LCP, FID, CLS monitoring
- **Page Speed** - Image optimization and lazy loading
- **Bundle Size** - Code splitting and optimization
- **Cache Strategy** - Proper caching headers

## 🚀 Deployment

### **Production Deployment**
```bash
# Build for production
pnpm build

# Deploy to Vercel (recommended)
vercel --prod

# Or use other hosting platforms
npm start
```

### **Environment Configuration**
- **Development** - Local development with hot reload
- **Staging** - Pre-production testing environment
- **Production** - Live production environment with analytics

### **Performance Optimization**
- **Image Optimization** - Next.js Image component with CDN
- **Code Splitting** - Automatic route-based code splitting
- **Font Optimization** - Web font loading strategies
- **Cache Strategy** - Static asset caching and CDN distribution

## 📧 Email Integration

### **Contact Form Handling**
```tsx
import { sendContactEmail } from '@agency/email'

export async function POST(request: Request) {
  const { name, email, message } = await request.json()
  
  await sendContactEmail({
    to: 'contact@agency.com',
    subject: 'New Contact Form Submission',
    template: 'contact-form',
    data: { name, email, message }
  })
}
```

### **Email Templates**
- **Contact Notifications** - Admin notifications for new inquiries
- **Auto-responders** - Immediate confirmation to users
- **Newsletter Signup** - Welcome emails and subscription management

## 📅 Booking System

### **Consultation Booking**
```tsx
import { BookingWidget } from '@agency/booking'

export default function BookingPage() {
  return (
    <BookingWidget
      config={{
        tenantId: 'firm',
        serviceSlug: 'consultation',
        locale: 'en-US'
      }}
    />
  )
}
```

### **Booking Features**
- **Calendar Integration** - Sync with external calendar systems
- **Availability Management** - Real-time availability checking
- **Confirmation Emails** - Automated booking confirmations
- **Rescheduling** - Easy rescheduling and cancellation

## 🔒 Security

### **Data Protection**
- **Input Validation** - Form validation and sanitization
- **CSRF Protection** - Cross-site request forgery prevention
- **Rate Limiting** - Form submission rate limiting
- **Privacy Compliance** - GDPR and data protection compliance

### **Content Security**
- **XSS Prevention** - Content Security Policy headers
- **Secure Headers** - HTTP security headers configuration
- **Input Sanitization** - Safe HTML rendering and sanitization
- **API Security** - Secure API endpoint design

## 🤝 Contributing

1. **Follow Development Guidelines** - See [CONTRIBUTING.md](../../../CONTRIBUTING.md)
2. **Design System** - Use @agency/ui components consistently
3. **Accessibility** - Ensure WCAG 2.1 AA compliance
4. **Testing** - Add E2E tests for new features
5. **SEO** - Consider SEO implications for content changes

## 📄 License

Private - All rights reserved to the agency and its clients.

---

<div align="center">

**Part of the @agency monorepo**

[📖 Documentation](../../../docs/) • [🎨 Design System](../../../packages/design-tokens/) • [🔒 Security](../../../SECURITY.md)

</div>
