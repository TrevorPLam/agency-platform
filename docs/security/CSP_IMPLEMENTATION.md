# Content Security Policy (CSP) Implementation

This document describes the CSP hardening implementation across the agency platform monorepo.

## Overview

The agency platform implements nonce-based Content Security Policy (CSP) to mitigate XSS attacks and other injection vulnerabilities. This implementation removes unsafe-inline directives and uses cryptographically secure nonces for dynamic script execution.

## Implementation Details

### CSP Middleware

Each application has a middleware (`src/middleware.ts`) that:

1. **Generates a cryptographically secure nonce** for each request
2. **Builds CSP headers** with environment-specific directives
3. **Sets security headers** including CSP, HSTS, and others
4. **Handles API routes** by not applying CSP to API endpoints

### CSP Directives

#### Development Environment

```csp
default-src 'self';
script-src 'self' 'nonce-{nonce}' 'unsafe-eval';
style-src 'self' 'nonce-{nonce}' 'unsafe-inline';
connect-src 'self' https://*.posthog.com;
img-src 'self' blob: data:;
font-src 'self';
object-src 'none';
media-src 'self';
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
upgrade-insecure-requests;
report-uri /api/csp-report
```

#### Production Environment

```csp
default-src 'self';
script-src 'self' 'nonce-{nonce}' 'strict-dynamic';
style-src 'self' 'nonce-{nonce}';
connect-src 'self' https://*.posthog.com;
img-src 'self' blob: data:;
font-src 'self';
object-src 'none';
media-src 'self';
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
upgrade-insecure-requests;
report-uri /api/csp-report
```

### Key Differences from Previous Implementation

1. **Removed 'unsafe-inline'** from script-src directive
2. **Added nonce-based CSP** for dynamic scripts
3. **Added object-src 'none'** and media-src restrictions
4. **Added CSP violation reporting** endpoint
5. **Configured PostHog analytics** with nonce support

### PostHog Integration

The analytics package (`@agency/analytics`) has been updated to:

1. **Support nonce injection** for PostHog scripts
2. **Provide CSP nonce utilities** for server components
3. **Include provider components** for easier integration

#### Usage in Components

```tsx
import { CspNonceProvider, AnalyticsProvider } from '@agency/analytics'

export default async function Layout({ children }) {
  return (
    <CspNonceProvider>
      <AnalyticsProvider tenantSlug="your-tenant">
        {children}
      </AnalyticsProvider>
    </CspNonceProvider>
  )
}
```

### CSP Violation Reporting

Each application includes a violation reporting endpoint at `/api/csp-report` that:

1. **Logs CSP violations** to console
2. **Captures request metadata** (user agent, IP, timestamp)
3. **Returns success response** to the browser

#### Sample Violation Report

```json
{
  "timestamp": "2026-03-16T10:30:00.000Z",
  "report": {
    "blockedURI": "inline",
    "documentURI": "https://example.com/page",
    "referrer": "https://example.com/",
    "violatedDirective": "script-src",
    "effectiveDirective": "script-src",
    "originalPolicy": "...",
    "sourceFile": "https://example.com/app.js",
    "lineNumber": 123,
    "columnNumber": 45
  },
  "userAgent": "Mozilla/5.0...",
  "ip": "192.168.1.100"
}
```

## Security Benefits

1. **XSS Prevention**: Eliminates inline script execution without nonce
2. **Injection Protection**: Prevents various code injection attacks
3. **Data Exfiltration Prevention**: Controls external resource loading
4. **Clickjacking Protection**: Maintains frame-ancestors restrictions
5. **Monitoring**: CSP violation reporting for attack detection

## Development Considerations

### React Development Mode

React requires `'unsafe-eval'` in development for enhanced debugging. This is automatically added in development mode only.

### Style Handling

Development mode allows `'unsafe-inline'` for styles to support CSS-in-JS libraries. Production mode uses nonce-based style loading.

### Testing CSP Changes

1. **Start with development mode** to identify violations
2. **Monitor browser console** for CSP violations
3. **Update directives** as needed for legitimate resources
4. **Test in production mode** before deployment

## Migration Guide

### For Existing Components

1. **Add CspNonceProvider** to layouts
2. **Update AnalyticsProvider** usage
3. **Test functionality** with CSP enabled
4. **Monitor violations** in development

### For New Features

1. **Use nonce-compatible scripts** where possible
2. **Avoid inline scripts** and event handlers
3. **Use CSP-compliant libraries** (most modern libraries are)
4. **Test CSP compliance** early in development

## Troubleshooting

### Common Issues

1. **Third-party scripts blocked**: Add domains to connect-src
2. **Inline styles blocked**: Use nonce-compatible CSS solutions
3. **Font loading issues**: Add font domains to font-src
4. **Analytics not working**: Ensure PostHog domains are allowed

### Debugging Steps

1. **Check browser console** for CSP violation messages
2. **Verify CSP headers** in browser dev tools
3. **Test with relaxed CSP** to identify specific issues
4. **Review violation reports** for patterns

## Future Enhancements

1. **Hash-based CSP**: For static inline scripts
2. **Stricter CSP**: Remove development exceptions
3. **Advanced Reporting**: Integration with monitoring services
4. **Automated Testing**: CSP compliance in CI/CD

## Compliance

This implementation helps with:

- **OWASP ASVS**: Control 5.5 (Content Security Policy)
- **SOC 2**: Security controls for web applications
- **HIPAA**: Security safeguards for protected health information
- **PCI DSS**: Requirement 6.5.7 (Content Security Policy)

## References

- [MDN CSP Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Next.js CSP Guide](https://nextjs.org/docs/app/guides/content-security-policy)
- [PostHog CSP Guide](https://posthog.com/docs/advanced/content-security-policy)
- [OWASP CSP Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)
