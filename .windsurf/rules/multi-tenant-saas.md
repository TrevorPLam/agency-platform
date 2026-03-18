---
description: Run multi-tenant SaaS isolation and tenant-context review
globs: ["apps/**", "packages/**", "supabase/**"]
---
# Multi-Tenant SaaS Invariants

<audit_rules>
- You MUST preserve tenant isolation across database, API, caching, analytics, background jobs, and logs.
- You MUST prefer server-derived tenant context over client-supplied tenant identifiers.
- You MUST verify that tenant-aware failures fail closed and never fall through to another tenant.
- You MUST ensure tenant context is propagated consistently through auth, APIs, jobs, analytics, and storage.
- You MUST flag any design that can mix tenant data in shared caches, exports, or observability systems.
</audit_rules>

**How to check**: Trace tenant resolution, authorization, cache keys, analytics payloads, and job payloads. Verify that one tenant cannot influence or access another tenant's data or operations.

**Related rules**: auth-standards, api-security, data-privacy-engineering, query-architecture.
