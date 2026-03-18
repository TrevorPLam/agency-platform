---
description: Run tenant-resolution flow and fallback-order review
globs: ["apps/**/middleware.ts", "apps/**/src/app/layout.tsx", "packages/database/**"]
---
# Tenant Resolution

<audit_rules>
- You MUST treat tenant resolution as a security-critical flow.
- You MUST preserve the established hostname, subdomain, and local-development fallback order.
- You MUST ensure missing or disabled tenants fail closed.
- You MUST reject duplicated tenant-resolution logic when shared middleware or package helpers already exist.
- You MUST require debuggable resolution metadata through logs or correlation IDs.
</audit_rules>

**How to check**: Trace the full resolution path from request host to resolved tenant, and verify consistent behavior across middleware, layouts, and APIs.

**Related rules**: multi-tenant-saas, auth-standards, nextjs-architecture.
