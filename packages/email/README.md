# @agency/email

<div align="center">

**Resend email integration with multi-tenant support**

[![npm version](https://img.shields.io/npm/v/@agency/email)](https://www.npmjs.org/package/@agency/email)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue)](https://www.typescriptlang.org/)
[![Resend](https://img.shields.io/badge/Resend-latest-black)](https://resend.com/)

</div>

Type-safe email service wrapper around Resend with tenant isolation, template management, and comprehensive delivery tracking for the agency platform.

## 🚀 Features

### 📧 **Email Delivery**
- **Multi-Tenant Support** - Separate email configurations per client
- **Template Management** - Dynamic email templates with variables
- **Delivery Tracking** - Real-time delivery status and analytics
- **Bounce Handling** - Automated bounce processing and list management
- **Reply Management** - Reply-to handling and routing

### 🎯 **Developer Experience**
- **Type Safety** - Full TypeScript support with strict typing
- **React Components** - Email template components for preview
- **Server Actions** - Next.js 16 Server Actions integration
- **Error Handling** - Comprehensive error reporting and retry logic
- **Rate Limiting** - Built-in rate limiting and quota management

### 🔒 **Security & Compliance**
- **Tenant Isolation** - Email data isolated by tenant
- **Content Security** - HTML sanitization and CSP compliance
- **GDPR Compliance** - Consent management and unsubscribe handling
- **Audit Logging** - Complete email delivery audit trail

## 📦 Installation

```bash
pnpm add @agency/email
```

## 🔧 Configuration

### **Environment Variables**

```bash
# Resend Configuration
RESEND_API_KEY=your_resend_api_key
RESEND_DOMAIN=your_verified_domain

# Optional: Custom SMTP
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password

# Email Settings
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=Your Agency
REPLY_TO_EMAIL=support@yourdomain.com
```

### **Domain Setup**

1. **Verify Domain** in Resend dashboard
2. **Configure DNS** records (TXT, CNAME, MX)
3. **Set up DKIM** for authentication
4. **Configure SPF** for sender verification

## 🚀 Quick Start

### **Basic Email Sending**

```typescript
import { emailService } from '@agency/email'

await emailService.send({
  to: 'customer@example.com',
  subject: 'Welcome to our service',
  template: 'welcome',
  data: {
    customerName: 'John Doe',
    companyName: 'Acme Corp'
  },
  tenantId: 'acme-corp'
})
```

### **Template-Based Email**

```typescript
import { emailService } from '@agency/email'

await emailService.sendTemplate({
  to: 'user@example.com',
  templateId: 'booking-confirmation',
  data: {
    bookingId: 'BK-12345',
    serviceName: 'Consultation',
    dateTime: '2024-03-20T10:00:00Z',
    location: '123 Main St'
  },
  tenantId: 'client-tenant'
})
```

### **React Email Template**

```tsx
// templates/WelcomeEmail.tsx
import { Email } from '@agency/email/components'

interface WelcomeEmailProps {
  customerName: string
  companyName: string
}

export function WelcomeEmail({ customerName, companyName }: WelcomeEmailProps) {
  return (
    <Email>
      <h1>Welcome to {companyName}!</h1>
      <p>Hi {customerName},</p>
      <p>Thank you for signing up. We're excited to have you on board!</p>
      <p>Best regards,<br />The {companyName} Team</p>
    </Email>
  )
}
```

## 📚 API Reference

### **EmailService**

#### **Methods**

| Method | Description | Parameters |
|--------|-------------|------------|
| `send(options)` | Send email with template | `EmailOptions` |
| `sendTemplate(options)` | Send predefined template | `TemplateOptions` |
| `getDeliveryStatus(messageId)` | Get delivery status | `messageId: string` |
| `listTemplates(tenantId)` | List available templates | `tenantId: string` |
| `createTemplate(template)` | Create email template | `EmailTemplate` |
| `updateTemplate(id, updates)` | Update template | `id: string`, `updates: Partial<EmailTemplate>` |

### **Types**

```typescript
interface EmailOptions {
  to: string | string[]
  cc?: string | string[]
  bcc?: string | string[]
  subject: string
  template?: string
  html?: string
  text?: string
  data?: Record<string, any>
  tenantId: string
  replyTo?: string
  attachments?: EmailAttachment[]
}

interface EmailTemplate {
  id: string
  name: string
  subject: string
  htmlTemplate: string
  textTemplate?: string
  variables: TemplateVariable[]
  tenantId: string
  isActive: boolean
}

interface DeliveryStatus {
  messageId: string
  status: 'sent' | 'delivered' | 'bounced' | 'complained'
  timestamp: Date
  events: DeliveryEvent[]
  analytics: DeliveryAnalytics
}
```

## 🎨 Email Templates

### **Template Structure**

```typescript
// templates/booking-confirmation.ts
export const bookingConfirmationTemplate = {
  id: 'booking-confirmation',
  name: 'Booking Confirmation',
  subject: 'Your booking is confirmed - {{bookingId}}',
  htmlTemplate: `
    <div class="email-container">
      <h1>Booking Confirmed</h1>
      <p>Hi {{customerName}},</p>
      <p>Your booking has been confirmed:</p>
      <div class="booking-details">
        <p><strong>Booking ID:</strong> {{bookingId}}</p>
        <p><strong>Service:</strong> {{serviceName}}</p>
        <p><strong>Date:</strong> {{dateTime}}</p>
        <p><strong>Location:</strong> {{location}}</p>
      </div>
      <p>We look forward to seeing you!</p>
    </div>
  `,
  variables: [
    { name: 'customerName', type: 'string', required: true },
    { name: 'bookingId', type: 'string', required: true },
    { name: 'serviceName', type: 'string', required: true },
    { name: 'dateTime', type: 'date', required: true },
    { name: 'location', type: 'string', required: true }
  ]
}
```

### **Styling Templates**

```css
/* templates/styles.css */
.email-container {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  background-color: #ffffff;
}

.booking-details {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin: 20px 0;
}

@media (max-width: 480px) {
  .email-container {
    padding: 10px;
  }
}
```

## 📊 Analytics & Tracking

### **Delivery Analytics**

```typescript
// Get email analytics
const analytics = await emailService.getAnalytics({
  tenantId: 'acme-corp',
  dateRange: 'last-30-days',
  metrics: ['sent', 'delivered', 'opened', 'clicked']
})

console.log('Email Performance:', {
  totalSent: analytics.sent,
  deliveryRate: analytics.delivered / analytics.sent,
  openRate: analytics.opened / analytics.delivered,
  clickRate: analytics.clicked / analytics.opened
})
```

### **Event Tracking**

```typescript
// Track email events
emailService.onEvent('delivered', (event) => {
  console.log(`Email delivered to ${event.recipient}`)
  
  // Update customer record
  await updateCustomerEmailStatus(event.customerId, 'verified')
})

emailService.onEvent('bounced', (event) => {
  console.log(`Email bounced for ${event.recipient}: ${event.reason}`)
  
  // Handle bounced email
  await handleBouncedEmail(event.recipient, event.reason)
})
```

## 🔒 Security & Compliance

### **Content Security**

```typescript
// HTML sanitization
import { sanitizeHtml } from '@agency/email/security'

const safeHtml = sanitizeHtml(userProvidedHtml, {
  allowedTags: ['p', 'br', 'strong', 'em', 'a'],
  allowedAttributes: {
    'a': ['href', 'target']
  }
})
```

### **GDPR Compliance**

```typescript
// Unsubscribe handling
emailService.onUnsubscribe(async (email, tenantId) => {
  // Update subscription preferences
  await updateSubscriptionPreferences(email, tenantId, {
    marketing: false,
    notifications: true
  })
  
  // Log unsubscribe event
  await logComplianceEvent('unsubscribe', {
    email,
    tenantId,
    timestamp: new Date(),
    source: 'email-link'
  })
})
```

## 🧪 Testing

### **Email Testing**

```typescript
// Test email sending
import { emailService } from '@agency/email'

describe('Email Service', () => {
  it('should send welcome email', async () => {
    const result = await emailService.send({
      to: 'test@example.com',
      subject: 'Test Welcome',
      template: 'welcome',
      data: { customerName: 'Test User' },
      tenantId: 'test-tenant'
    })
    
    expect(result.messageId).toBeDefined()
    expect(result.status).toBe('sent')
  })
  
  it('should handle template variables', async () => {
    const html = await emailService.renderTemplate('welcome', {
      customerName: 'John',
      companyName: 'Acme'
    })
    
    expect(html).toContain('John')
    expect(html).toContain('Acme')
  })
})
```

### **Preview Templates**

```typescript
// Preview email template
const preview = await emailService.previewTemplate('welcome', {
  customerName: 'Jane Doe',
  companyName: 'Test Company'
})

console.log('HTML Preview:', preview.html)
console.log('Text Preview:', preview.text)
```

## 🚀 **Real-World Examples**

### **Booking Confirmation Flow**

```typescript
// Send booking confirmation with follow-up
export async function sendBookingConfirmation(booking: Booking) {
  // 1. Send immediate confirmation
  await emailService.sendTemplate({
    to: booking.customerEmail,
    templateId: 'booking-confirmation',
    data: {
      customerName: booking.customerName,
      bookingId: booking.id,
      serviceName: booking.serviceName,
      dateTime: booking.startTime,
      location: booking.location
    },
    tenantId: booking.tenantId
  })
  
  // 2. Schedule reminder (24 hours before)
  await scheduleEmailReminder(booking, {
    templateId: 'booking-reminder',
    sendAt: new Date(booking.startTime.getTime() - 24 * 60 * 60 * 1000)
  })
  
  // 3. Schedule follow-up (1 hour after)
  await scheduleEmailReminder(booking, {
    templateId: 'booking-followup',
    sendAt: new Date(booking.startTime.getTime() + 60 * 60 * 1000)
  })
}
```

### **Marketing Campaign**

```typescript
// Send personalized marketing campaign
export async function sendMarketingCampaign(campaign: Campaign) {
  const customers = await getTargetCustomers(campaign.criteria)
  
  const emails = customers.map(customer => ({
    to: customer.email,
    templateId: campaign.templateId,
    data: {
      customerName: customer.firstName,
      personalizedOffer: getPersonalizedOffer(customer),
      campaignName: campaign.name
    },
    tenantId: customer.tenantId
  }))
  
  // Send in batches to respect rate limits
  await emailService.sendBatch(emails, {
    batchSize: 100,
    delayMs: 1000
  })
}
```

## 🆘 **Troubleshooting & Support**

### **🔧 Common Issues & Solutions**

#### **1. Email Delivery Failures**

**Symptoms**: Emails not being delivered, bounce messages

**Solutions**:
- ✅ Verify domain DNS records (SPF, DKIM, DMARC)
- ✅ Check Resend API key and domain verification
- ✅ Review email content for spam triggers
- ✅ Monitor delivery status and bounce reasons

```typescript
// Debug email delivery
const debugDelivery = async (emailOptions) => {
  try {
    console.log('Sending email:', emailOptions.to)
    const result = await emailService.send(emailOptions)
    console.log('Message ID:', result.messageId)
    
    // Check delivery status
    const status = await emailService.getDeliveryStatus(result.messageId)
    console.log('Delivery status:', status)
    
  } catch (error) {
    console.error('Email delivery failed:', error.message)
    console.log('Debug info:', {
      apiKeyConfigured: !!process.env.RESEND_API_KEY,
      domainVerified: await checkDomainVerification(),
      recipientValid: isValidEmail(emailOptions.to)
    })
  }
}
```

#### **2. Template Rendering Issues**

**Symptoms**: Variables not replaced, malformed HTML

**Solutions**:
- ✅ Verify template syntax and variable names
- ✅ Check data types and required fields
- ✅ Test template rendering in isolation
- ✅ Validate HTML structure and CSS

```typescript
// Debug template rendering
const debugTemplate = async (templateId, data) => {
  try {
    const template = await emailService.getTemplate(templateId)
    console.log('Template variables:', template.variables)
    
    const rendered = await emailService.renderTemplate(templateId, data)
    console.log('Rendered HTML length:', rendered.html.length)
    
    // Validate HTML
    const isValid = validateHTML(rendered.html)
    console.log('HTML valid:', isValid)
    
  } catch (error) {
    console.error('Template rendering failed:', error.message)
  }
}
```

#### **3. Rate Limiting Issues**

**Symptoms**: API rate limit errors, slow sending

**Solutions**:
- ✅ Implement exponential backoff retry
- ✅ Use batch sending for bulk emails
- ✅ Monitor rate limit usage
- ✅ Upgrade Resend plan if needed

```typescript
// Handle rate limiting
export async function sendWithRetry(emailOptions, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await emailService.send(emailOptions)
    } catch (error) {
      if (error.code === 'RATE_LIMIT' && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000 // Exponential backoff
        console.log(`Rate limited, retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      } else {
        throw error
      }
    }
  }
}
```

### **📞 Getting Help**

**Self-Service Debugging**:
1. Check Resend dashboard for delivery status
2. Verify domain DNS configuration
3. Test template rendering with sample data
4. Monitor API rate limits and quotas
5. Review email content for compliance issues

**Community Support**:
- **Resend Documentation**: [https://resend.com/docs](https://resend.com/docs)
- **GitHub Issues**: [Agency Platform Issues](https://github.com/agency/platform/issues)
- **Discord Community**: [Join our Discord](https://discord.gg/agency)
- **Email Support**: email@agency.com

**Common Debug Commands**:
```bash
# Test email configuration
pnpm run email:test-config

# Verify domain setup
pnpm run email:verify-domain

# Test template rendering
pnpm run email:test-template

# Check delivery status
pnpm run email:check-status

# Monitor email analytics
pnpm run email:analytics
```

## 📄 License

ISC License - see LICENSE file for details.

---

<div align="center">

**Part of the @agency monorepo**

[📖 Documentation](../../docs/) • [🎨 Design System](../design-tokens/) • [🔒 Security](../../SECURITY.md)

</div>
