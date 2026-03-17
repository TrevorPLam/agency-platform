# @agency/email Package

## User Information

- User has no formal software development experience or education
- User develops repositories 100% through agentic coding as a "solo-developer"
- User prefers best practices and highest standards
- User prefers up to date (2026) research conducted before task execution on proper implementation, best practices, and advanced coding patterns

## Purpose

Tenant-aware email service using Resend for transactional emails. This package provides secure email sending with tenant isolation and template management.

## Agent Skills (Available Commands)
- `pnpm test` - Run email tests with coverage
- `pnpm build` - Build email package
- `pnpm templates:validate` - Validate email templates
- `pnpm send:test` - Send test email

## Integration Points
- Depends on: `resend` for email delivery, `@agency/database` for tenant context
- Used by: Applications for email notifications
- See also: `@.agents/security.md` for email security guidelines
- Reference: Resend documentation for email patterns

## Core Patterns

### Tenant-Isolated Email Sending
```typescript
// ✅ Correct - Tenant-specific sending
import { sendEmail } from '@agency/email';

async function sendTenantEmail(
  to: string,
  template: string,
  data: any,
  tenantId: string
) {
  return await sendEmail({
    to,
    from: getTenantFromEmail(tenantId),
    template,
    data: { ...data, tenant_id: tenantId },
    tenant_id: tenantId,
  });
}

// ❌ Incorrect - Cross-tenant sending
async function badSendEmail(to: string, template: string, data: any) {
  return await sendEmail({
    to,
    template,
    data, // No tenant context
  });
}
```

### Template Management
```typescript
// ✅ Correct - Tenant-branded templates
import { getTemplate } from '@agency/email';

async function sendBrandedEmail(tenantId: string, userEmail: string) {
  const template = await getTemplate('welcome', tenantId);
  
  return await sendEmail({
    to: userEmail,
    from: template.from_email,
    subject: template.subject,
    html: template.html,
    tenant_id: tenantId,
  });
}

// ❌ Incorrect - Generic templates
async function badSendWelcome(userEmail: string) {
  return await sendEmail({
    to: userEmail,
    from: 'noreply@agency.com', // Generic sender
    subject: 'Welcome',
    html: '<h1>Welcome!</h1>', // No branding
  });
}
```

## Package Commands

```bash
# Build package
pnpm build

# Run tests
pnpm test

# Validate templates
pnpm templates:validate

# Send test email
pnpm send:test --to=test@example.com --template=welcome

# Type check
pnpm type-check

# Lint
pnpm lint
```

## File Structure

```
packages/email/
├── src/
│   ├── index.ts              # Main exports
│   ├── client.ts             # Resend client factory
│   ├── templates.ts          # Template management
│   ├── sending.ts            # Email sending logic
│   └── types.ts              # Email types
├── templates/                # Email templates
│   ├── welcome.html
│   ├── reset-password.html
│   └── tenant-specific/
├── AGENTS.md                 # This file
├── package.json
└── tsconfig.json
```

## Key Exports

### sendEmail()
```typescript
import { sendEmail } from '@agency/email';

await sendEmail({
  to: 'user@example.com',
  from: 'noreply@tenant-123.agency.com',
  subject: 'Welcome to our platform',
  html: '<h1>Welcome!</h1>',
  tenant_id: 'tenant-123',
});
```

### getTemplate()
```typescript
import { getTemplate } from '@agency/email';

const template = await getTemplate('welcome', 'tenant-123');
// Returns: { subject, html, from_email, ... }
```

## Security Requirements

### Never Send PII in Templates
```typescript
// ✅ Correct - Safe template data
async function sendSafeEmail(userEmail: string, tenantId: string) {
  return await sendEmail({
    to: userEmail,
    template: 'welcome',
    data: {
      user_id: 'user-123', // Safe identifier
      tenant_name: 'Tenant Name', // Non-sensitive data
    },
    tenant_id: tenantId,
  });
}

// ❌ Incorrect - PII in templates
async function badSendEmail(userEmail: string, tenantId: string) {
  return await sendEmail({
    to: userEmail,
    template: 'welcome',
    data: {
      email: userEmail, // PII exposure!
      phone: '+1-555-123-4567', // PII exposure!
    },
    tenant_id: tenantId,
  });
}
```

### Rate Limiting
```typescript
// ✅ Correct - Rate-limited sending
import { checkRateLimit } from '@agency/email';

async function sendWithRateLimit(userEmail: string, tenantId: string) {
  const canSend = await checkRateLimit({
    email: userEmail,
    tenant_id: tenantId,
    type: 'transactional',
  });
  
  if (!canSend) {
    throw new Error('Rate limit exceeded');
  }
  
  return await sendEmail({
    to: userEmail,
    template: 'welcome',
    tenant_id: tenantId,
  });
}

// ❌ Incorrect - No rate limiting
async function badSendEmail(userEmail: string, tenantId: string) {
  return await sendEmail({
    to: userEmail,
    template: 'welcome',
    tenant_id: tenantId,
  }); // Could spam users!
}
```

## Testing Patterns

### Mock Email Service
```typescript
// test/setup.ts
import { vi } from 'vitest';
import { sendEmail, getTemplate } from '@agency/email';

vi.mock('@agency/email', () => ({
  sendEmail: vi.fn(),
  getTemplate: vi.fn(),
  checkRateLimit: vi.fn(() => Promise.resolve(true)),
}));
```

### Unit Tests
```typescript
import { sendEmail } from '@agency/email';

describe('Email Service', () => {
  it('sends tenant-branded emails', async () => {
    await sendEmail({
      to: 'test@example.com',
      from: 'noreply@tenant-123.agency.com',
      subject: 'Welcome',
      html: '<h1>Welcome!</h1>',
      tenant_id: 'tenant-123',
    });
    
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'noreply@tenant-123.agency.com',
        tenant_id: 'tenant-123',
      })
    );
  });
});
```

## Dependencies

This package depends on:
- `resend` - Email delivery service
- `@agency/database` - Tenant context
- TypeScript - For type safety

## Progressive Documentation

For more details:
- `@.agents/security.md` - Email security guidelines
- `@packages/database/AGENTS.md` - Database patterns
- `docs/EMAIL.md` - Complete email system guide
