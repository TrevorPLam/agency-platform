# Firm Application

## User Information

- User has no formal software development experience or education
- User develops repositories 100% through agentic coding as a "solo-developer"
- User prefers best practices and highest standards
- User prefers up to date (2026) research conducted before task execution on proper implementation, best practices, and advanced coding patterns

## Purpose

Agency marketing website and public-facing content. Port 3000. This is the main marketing site for prospective clients.

## Agent Skills (Available Commands)
- `pnpm dev` - Start development server
- `pnpm build` - Build application
- `pnpm build:production` - Build for production deployment
- `pnpm test` - Run tests with coverage
- `pnpm test:e2e` - Run end-to-end tests

## Integration Points
- Depends on: `@agency/database` for data access, `@agency/ui` for components
- Uses: Marketing analytics and lead capture systems
- See also: `@.agents/security.md` for security patterns
- Reference: `@packages/ui/AGENTS.md` for component usage

## Application-Specific Patterns

### Public-Facing Content
```typescript
// ✅ Correct - Public content with SEO
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Digital Marketing Agency | Transform Your Business',
  description: 'We help businesses grow with data-driven digital marketing strategies.',
  openGraph: {
    title: 'Digital Marketing Agency',
    description: 'Transform your business with our expert marketing services',
    type: 'website',
  },
};

// ❌ Incorrect - Missing SEO
export default function HomePage() {
  return <div>Welcome to our agency</div>; // No metadata
}
```

### Content Management
```typescript
// ✅ Correct - CMS-integrated content
import { getContent } from '@/lib/cms';
import { CMSPage } from '@/components/cms-page';

export default async function AboutPage() {
  const content = await getContent('about-page');
  
  return <CMSPage content={content} />;
}

// ❌ Incorrect - Hardcoded content
export default function AboutPage() {
  return (
    <div>
      <h1>About Us</h1>
      <p>We are a marketing agency...</p> {/* Hardcoded */}
    </div>
  );
}
```

### Lead Capture Forms
```typescript
// ✅ Correct - Secure lead capture
import { createLead } from '@/lib/leads';

export async function ContactForm(formData: FormData) {
  const lead = {
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    company: formData.get('company') as string,
    message: formData.get('message') as string,
    source: 'contact-form',
    utm_source: formData.get('utm_source') as string,
  };
  
  await createLead(lead);
  
  return { success: true };
}

// ❌ Incorrect - Insecure form handling
export async function badContactForm(formData: FormData) {
  // No validation, no sanitization
  const email = formData.get('email');
  // Direct email send without validation
}
```

## Application Commands

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

# Build for production
pnpm build:production
```

## File Structure

```
apps/firm/
├── src/
│   ├── app/
│   │   ├── (marketing)/       # Public marketing routes
│   │   ├── api/               # API routes
│   │   ├── globals.css
│   │   ├── layout.tsx         # Marketing layout
│   │   └── page.tsx           # Homepage
│   ├── components/
│   │   ├── marketing/         # Marketing-specific components
│   │   │   ├── hero.tsx
│   │   │   ├── features.tsx
│   │   │   └── testimonials.tsx
│   │   ├── forms/             # Contact and lead forms
│   │   └── ui/                # Reusable UI
│   ├── lib/
│   │   ├── cms.ts             # Content management
│   │   ├── leads.ts           # Lead capture
│   │   ├── analytics.ts       # Marketing analytics
│   │   └── seo.ts             # SEO utilities
│   └── types/
│       ├── marketing.ts        # Marketing types
│       └── content.ts         # Content types
├── AGENTS.md                  # This file
├── package.json
└── next.config.js
```

## Key Features

### Marketing Pages
- Homepage with hero section
- Services overview
- Case studies and portfolio
- About us page
- Contact and quote forms

### Content Management
- CMS integration for dynamic content
- Blog and articles
- Case study management
- Testimonial system

### Lead Generation
- Contact forms with validation
- Quote request forms
- Newsletter subscription
- UTM parameter tracking

## SEO & Performance

### Meta Tags
```typescript
// ✅ Correct - Comprehensive SEO metadata
export const metadata: Metadata = {
  title: {
    default: 'Digital Marketing Agency',
    template: '%s | Marketing Agency',
  },
  description: 'Expert digital marketing services to grow your business',
  keywords: ['digital marketing', 'SEO', 'PPC', 'social media'],
  authors: [{ name: 'Marketing Agency' }],
  creator: 'Marketing Agency',
  publisher: 'Marketing Agency',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://your-agency.com'),
  alternates: {
    canonical: '/about',
  },
  openGraph: {
    title: 'About Our Marketing Agency',
    description: 'Learn about our expert marketing team',
    type: 'website',
    url: 'https://your-agency.com/about',
    siteName: 'Marketing Agency',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Marketing Agency',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Marketing Agency',
    description: 'Expert digital marketing services',
    images: ['/twitter-image.jpg'],
  },
};
```

### Structured Data
```typescript
// ✅ Correct - JSON-LD structured data
export function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Marketing Agency',
    url: 'https://your-agency.com',
    logo: 'https://your-agency.com/logo.png',
    description: 'Expert digital marketing services',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '123 Marketing St',
      addressLocality: 'City',
      addressRegion: 'State',
      postalCode: '12345',
      addressCountry: 'US',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+1-555-123-4567',
      contactType: 'sales',
      availableLanguage: 'English',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
```

## Analytics & Tracking

### Marketing Analytics
```typescript
// ✅ Correct - Marketing analytics integration
import { trackEvent, trackPageView } from '@/lib/analytics';

export function ContactButton() {
  const handleClick = () => {
    trackEvent('contact_form_opened', {
      source: 'homepage_hero',
      button_text: 'Get Started',
    });
  };

  return (
    <Button onClick={handleClick}>
      Get Started
    </Button>
  );
}

// ❌ Incorrect - No analytics tracking
export function BadContactButton() {
  return <Button>Get Started</Button>; // No tracking
}
```

### UTM Parameter Handling
```typescript
// ✅ Correct - UTM parameter capture
export function captureUTMParameters(searchParams: URLSearchParams) {
  return {
    utm_source: searchParams.get('utm_source'),
    utm_medium: searchParams.get('utm_medium'),
    utm_campaign: searchParams.get('utm_campaign'),
    utm_content: searchParams.get('utm_content'),
    utm_term: searchParams.get('utm_term'),
  };
}

export async function createLeadWithUTM(lead: LeadData, utm: UTMData) {
  const enrichedLead = {
    ...lead,
    marketing_attributes: utm,
    captured_at: new Date().toISOString(),
  };

  return await createLead(enrichedLead);
}
```

## Form Handling

### Form Validation
```typescript
// ✅ Correct - Comprehensive form validation
import { z } from 'zod';

const contactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  company: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  budget: z.enum(['<5k', '5k-10k', '10k-25k', '25k-50k', '>50k']).optional(),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

export async function validateContactForm(data: unknown): Promise<ContactFormData> {
  return contactFormSchema.parse(data);
}

// ❌ Incorrect - No validation
export async function badValidateContactForm(data: unknown) {
  return data as any; // No type safety
}
```

### Form Security
```typescript
// ✅ Correct - Secure form submission
export async function submitContactForm(formData: FormData) {
  try {
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      message: formData.get('message'),
    };

    const validatedData = await validateContactForm(data);
    
    // Rate limiting check
    await checkRateLimit(validatedData.email);
    
    // Create lead
    const lead = await createLead(validatedData);
    
    // Send notification
    await sendNotification(lead);
    
    return { success: true, leadId: lead.id };
  } catch (error) {
    console.error('Form submission error:', error);
    return { success: false, error: 'Failed to submit form' };
  }
}

// ❌ Incorrect - Insecure submission
export async function badSubmitContactForm(formData: FormData) {
  // Direct database insertion without validation
  await db.insert('leads').values({
    name: formData.get('name'),
    email: formData.get('email'),
  });
}
```

## Performance Optimization

### Image Optimization
```typescript
// ✅ Correct - Optimized images
import Image from 'next/image';

export function HeroImage() {
  return (
    <Image
      src="/hero-image.jpg"
      alt="Digital marketing team working together"
      width={1200}
      height={600}
      priority
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,..."
    />
  );
}

// ❌ Incorrect - Unoptimized images
export function BadHeroImage() {
  return (
    <img
      src="/hero-image.jpg"
      alt="Digital marketing team"
      width={1200}
      height={600}
    /> // No Next.js optimization
  );
}
```

### Code Splitting
```typescript
// ✅ Correct - Lazy load heavy components
import { lazy, Suspense } from 'react';

const ContactForm = lazy(() => import('@/components/forms/contact-form'));
const CaseStudyModal = lazy(() => import('@/components/case-study-modal'));

export function HomePage() {
  return (
    <div>
      <HeroSection />
      <Suspense fallback={<div>Loading contact form...</div>}>
        <ContactForm />
      </Suspense>
      <Suspense fallback={<div>Loading case studies...</div>}>
        <CaseStudyModal />
      </Suspense>
    </div>
  );
}
```

## Testing Patterns

### Component Testing
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { ContactForm } from '@/components/forms/contact-form';

describe('ContactForm', () => {
  it('should validate form fields', async () => {
    const user = userEvent.setup();
    render(<ContactForm />);
    
    const submitButton = screen.getByRole('button', { name: 'Submit' });
    await user.click(submitButton);
    
    expect(screen.getByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Email is required')).toBeInTheDocument();
  });

  it('should submit valid form', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    
    render(<ContactForm onSubmit={onSubmit} />);
    
    await user.type(screen.getByLabelText('Name'), 'John Doe');
    await user.type(screen.getByLabelText('Email'), 'john@example.com');
    await user.type(screen.getByLabelText('Message'), 'Test message');
    
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Test message',
    });
  });
});
```

## Progressive Documentation

For more details:
- `@.agents/security.md` - Security guidelines
- `@.agents/testing.md` - Testing patterns
- `docs/MARKETING.md` - Marketing-specific documentation
- `@packages/ui/AGENTS.md` - UI component usage
