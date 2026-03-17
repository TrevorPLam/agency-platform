# Next.js + Supabase Multi-Tenant Security: Best Practices Research (2024–2026)

**Purpose:** Highest-standard implementation guidance for tenant isolation, authorization, service-role usage, trust boundaries, RBAC/ABAC, and defense-in-depth in the agency platform monorepo.

**Sources:** OWASP Multi-Tenant Security Cheat Sheet, OWASP ASVS 4.3.4, Supabase RLS docs, internal `docs/MULTI_TENANT_SECURITY.md`, `SECURITY.md`, and codebase analysis.

---

## Executive Summary

The repo has strong foundations (RLS, `app_metadata.tenant_id`, `public.tenant_id()` helper, admin client safeguards) but **critical gaps** in `apps/agency-admin` API routes: tenant ID is taken from **untrusted** query params and request body, enabling cross-tenant data access. This document provides current best practices, anti-patterns, a target checklist, priority mapping, and references, with explicit ties to repo areas.

---

## 1. Tenant Isolation and Authorization in API Routes

### Current Best Practices (2024–2026)

| Practice | Rationale | Source |
|---------|-----------|--------|
| **Derive tenant from authenticated session only** | JWT `app_metadata.tenant_id` is server-controlled; query params, headers, and body are client-controlled and must never be trusted for authorization | OWASP Cheat Sheet, SECURITY.md Vector 1 |
| **Validate tenant membership before any data access** | User must belong to tenant via `tenant_users`; platform admins need explicit RBAC | OWASP ASVS 4.3.4 |
| **Establish tenant context early** | Middleware or first handler should resolve tenant from session and fail fast if missing | OWASP Cheat Sheet §1 |
| **Use cryptographically secure tenant IDs** | UUIDs are non-guessable; avoid sequential IDs | OWASP Cheat Sheet §1 |
| **Validate tenant existence and active status** | Reject requests for non-existent or inactive tenants | OWASP Cheat Sheet §1 |

### Anti-Patterns to Avoid

| Anti-Pattern | Risk | Example |
|--------------|------|---------|
| **Trusting `tenant_id` from query params** | IDOR; any user can access any tenant’s data | `searchParams.get('tenant_id')` |
| **Trusting `tenant_id` from request body** | Same as above for POST/PATCH | `body.tenantId` |
| **Trusting `X-Tenant-ID` from client** | Client can spoof header; only trust headers set by your middleware | `request.headers.get('x-tenant-id')` from incoming request |
| **Using `user_metadata` for tenant** | User-editable; can be forged | `user.user_metadata.tenant_id` |
| **Skipping auth check** | Unauthenticated access to tenant data | No `getUser()` before data access |

### Target Standard Checklist

- [ ] Every API route that accesses tenant data calls `createSupabaseServerClient` and `getUser()` (or equivalent) first
- [ ] Tenant ID is read only from `session.user.app_metadata.tenant_id`
- [ ] For platform-admin routes: tenant ID may come from params **only after** verifying user has platform-admin role and requested tenant is in allowed set
- [ ] All data queries include `.eq('tenant_id', verifiedTenantId)` when using admin client
- [ ] 401 returned when no session; 403 when user lacks tenant membership

### Repo Mapping

| Area | Current State | Action |
|------|---------------|--------|
| `apps/agency-admin/src/app/api/costs/summary/route.ts` | Uses `searchParams.get('tenant_id')` | **P0:** Use session `app_metadata.tenant_id`; add platform-admin path if needed |
| `apps/agency-admin/src/app/api/costs/metrics/route.ts` | Same | Same |
| `apps/agency-admin/src/app/api/costs/recommendations/route.ts` | Same for GET; `body.tenantId` for POST | Same |
| `apps/agency-admin/src/app/api/costs/alerts/route.ts` | Same | Same |
| `packages/database/src/middleware.ts` | `getTenantFromHeaders` reads client headers | Only use for routing; never for auth. Middleware sets headers from `resolveTenantFromRequest` (hostname) — OK for routing, not for API auth |
| `apps/agency-admin/src/components/costs/cost-management-dashboard.tsx` | Fetches without `tenant_id` | Pass tenant from server (session) or use middleware-set header **only if** API validates session first |

---

## 2. Secure Use of Supabase Service-Role / Admin Clients

### Current Best Practices (2024–2026)

| Practice | Rationale | Source |
|---------|-----------|--------|
| **Server-only** | Service role bypasses RLS; must never reach client | Supabase docs, SECURITY.md Vector 3 |
| **Explicit import** | `import { getAdminClient } from '@agency/database/admin'` — not in barrel | packages/database |
| **Runtime guard** | `typeof window !== 'undefined` check in `getAdminClient()` | packages/database/src/admin.ts |
| **Scoped usage** | When using admin client, always filter by verified tenant | SECURITY.md Vector 4 |
| **Audit logging** | `logAdminOperation()` for sensitive admin actions | packages/database/src/admin.ts |
| **Prefer anon client + RLS** | Use `createSupabaseServerClient` when RLS can enforce access | Defense in depth |

### Anti-Patterns to Avoid

| Anti-Pattern | Risk | Example |
|--------------|------|---------|
| **Admin client without tenant scoping** | Full table access; cross-tenant leakage | `admin.from('cost_metrics').select('*')` without `.eq('tenant_id', ...)` |
| **Admin client in client components** | Service role key could be bundled | `'use client'` + `getAdminClient` |
| **NEXT_PUBLIC_ for service role** | Key exposed to browser | `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` |
| **Admin for user-initiated reads** | Prefer anon client so RLS enforces | Using admin when user session + RLS would suffice |

### Target Standard Checklist

- [ ] `getAdminClient()` only in API routes, Server Actions, middleware, Inngest functions, scripts
- [ ] Every admin query that touches tenant data includes `.eq('tenant_id', verifiedTenantId)` or equivalent
- [ ] `assertAdminContext()` used in admin-only helpers
- [ ] `logAdminOperation()` for create/update/delete of users, tenants, or sensitive data
- [ ] Grep for `getAdminClient` in `apps/` returns no client components

### Repo Mapping

| Area | Current State | Action |
|------|---------------|--------|
| `packages/database/src/admin.ts` | Strong: window check, docs, `assertAdminContext`, `logAdminOperation` | Keep; ensure all callers scope by tenant |
| `apps/agency-admin` cost API routes | Use admin + untrusted tenant_id | **P0:** Switch to session tenant or platform-admin check |
| `apps/agency-admin/src/inngest/functions/onboarding.ts` | Uses `event.data.tenantId` (Inngest payload) | OK — event is trusted |
| `packages/database/src/auth.ts` | Uses admin for `createUserForTenant`, `assignUserToTenant` | OK — tenant from function args, not request |

---

## 3. Trust Boundaries for Request Headers, Query Params, Body

### Current Best Practices (2024–2026)

| Input | Trust Level | Use For |
|-------|-------------|---------|
| **JWT `app_metadata`** | Trusted | Tenant ID, role (server-set) |
| **Session from cookies** | Trusted | Auth, tenant resolution |
| **Middleware-set headers** | Trusted | Passing tenant to downstream (set by your code) |
| **Query params** | Untrusted | Filtering, pagination — never for tenant ID in auth |
| **Request body** | Untrusted | Business data — never for tenant ID in auth |
| **Client-set headers** | Untrusted | `X-Tenant-ID` from client is spoofable |

### Anti-Patterns to Avoid

| Anti-Pattern | Risk |
|--------------|------|
| Using `?tenant_id=...` for authorization | Attacker changes to another tenant |
| Using `body.tenantId` for authorization | Same |
| Trusting `X-Tenant-ID` from incoming request | Client can set any value |
| Using `user_metadata` for tenant | User-editable |

### Target Standard Checklist

- [ ] Tenant ID for authorization comes only from: (a) `session.user.app_metadata.tenant_id`, or (b) platform-admin path with explicit role check + allowed-tenant validation
- [ ] Query params used only for filters (status, period, etc.), not tenant
- [ ] Request body validated with Zod (or similar); `tenantId` in body rejected or overwritten with session tenant
- [ ] Middleware sets `x-tenant-id` from hostname/session; API routes read from session, not from request headers for auth

### Repo Mapping

| Area | Current State | Action |
|------|---------------|--------|
| Cost API routes | `tenant_id` from `searchParams` / `body` | **P0:** Remove; use session |
| `packages/database/src/middleware.ts` | `getTenantFromHeaders` reads `x-tenant-id` | Document: use for routing only; API routes must not use for auth |
| `cost-management-dashboard.tsx` | Fetches without tenant | Server Component or wrapper that passes session-derived tenant to client |

---

## 4. RBAC/ABAC Patterns for Admin Dashboards

### Current Best Practices (2024–2026)

| Pattern | Use Case | Implementation |
|---------|----------|----------------|
| **Tenant-scoped roles** | User is admin/member within one tenant | `tenant_users.role` + `app_metadata.role` |
| **Platform admin** | User can manage multiple tenants | Separate role (e.g. `platform_admin` in `app_metadata` or dedicated table) |
| **Resource-level checks** | "Can user edit this post?" | RLS + optional app-level check on `tenant_users.role` |
| **Attribute-based** | "User can access if tenant is active" | Policy: `tenant_id = public.tenant_id() AND EXISTS (SELECT 1 FROM tenants t WHERE t.id = tenant_id AND t.status = 'active')` |

### Anti-Patterns to Avoid

| Anti-Pattern | Risk |
|--------------|------|
| Single global admin flag without tenant context | Platform admin confused with tenant admin |
| No role check before admin client use | Any authenticated user could call admin APIs |
| Assuming "admin" means platform admin | Tenant admin ≠ platform admin |

### Target Standard Checklist

- [ ] `agency-admin` distinguishes: (a) tenant user viewing own tenant, (b) platform admin viewing any tenant
- [ ] Platform admin check: `app_metadata.role === 'platform_admin'` or equivalent, validated server-side
- [ ] Tenant admin: `tenant_users.role === 'admin'` for that tenant
- [ ] Admin dashboard routes return 403 when user lacks required role
- [ ] Role stored in `app_metadata` (server-controlled), not `user_metadata`

### Repo Mapping

| Area | Current State | Action |
|------|---------------|--------|
| `apps/agency-admin` | Auth redirect only; no role check | **P1:** Add role check; define platform_admin vs tenant_admin |
| `tenant_users.role` | Exists | Use for tenant-scoped RBAC |
| `app_metadata.role` | Set in `createUserForTenant` | Extend for platform_admin if needed |

---

## 5. Defense-in-Depth and Auditability

### Current Best Practices (2024–2026)

| Control | Layer | Purpose |
|---------|-------|---------|
| **RLS** | Database | Last line of defense; enforces tenant isolation even if app bugs |
| **Session validation** | API | Reject unauthenticated and invalid tenants |
| **Explicit tenant filter** | Application | `.eq('tenant_id', ...)` when using admin client |
| **Audit logging** | Application | `logAdminOperation`, `audit_log` table |
| **Index on tenant_id** | Database | Performance + RLS efficiency |
| **Cache key prefix** | Cache | `tenant:{id}:` per `.cursor/rules/database.mdc` |

### Anti-Patterns to Avoid

| Anti-Pattern | Risk |
|--------------|------|
| Relying only on app-level checks | Admin client bypasses RLS |
| Relying only on RLS | Admin client bypasses RLS; need both |
| No audit trail for admin actions | Compliance, forensics |
| Missing tenant_id index | RLS causes full table scans |

### Target Standard Checklist

- [ ] All tenant-scoped tables: RLS enabled, `tenant_id` index, four policies (SELECT, INSERT, UPDATE, DELETE)
- [ ] Admin operations logged via `logAdminOperation` or `audit_log`
- [ ] API routes validate session before any data access
- [ ] `audit_log` table used for sensitive mutations (see `supabase/migrations/004_audit_log.sql`)

### Repo Mapping

| Area | Current State | Action |
|------|---------------|--------|
| `supabase/migrations/` | RLS, indexes, `public.tenant_id()` | Strong; maintain pattern for new tables |
| `packages/database/src/admin.ts` | `logAdminOperation` | Use in cost API mutations |
| Cost API routes | No audit logging | **P2:** Add for POST/PATCH |
| `audit_log` | Exists | Consider writing from admin operations |

---

## 6. Priority Mapping (P0 / P1 / P2)

### P0 — Critical (Fix Immediately)

| Item | Location | Action |
|------|----------|--------|
| **Stop trusting tenant_id from query/body** | `apps/agency-admin/src/app/api/costs/*` | Use `session.user.app_metadata.tenant_id`; require auth |
| **Add session validation** | Same | Call `createSupabaseServerClient` + `getUser()`; return 401 if no user |
| **Scope admin queries by verified tenant** | Same | `.eq('tenant_id', sessionTenantId)` — never from request |

### P1 — High (Next Sprint)

| Item | Location | Action |
|------|----------|--------|
| **Define platform vs tenant admin** | `apps/agency-admin` | Add role check; platform admin may pass tenant_id only after validation |
| **Update SECURITY.md Vector 4 baseline** | `SECURITY.md` | Include cost routes; mark as non-compliant until fixed |
| **Document trust boundaries** | `docs/MULTI_TENANT_SECURITY.md` | Add "Trust Boundaries" section |
| **Cost dashboard tenant source** | `cost-management-dashboard.tsx` | Ensure tenant comes from server (session or validated context) |

### P2 — Medium (Backlog)

| Item | Location | Action |
|------|----------|--------|
| **Audit logging for cost mutations** | Cost API POST/PATCH | Call `logAdminOperation` or write to `audit_log` |
| **Input validation with Zod** | Cost API routes | Validate body/params; reject `tenantId` in body |
| **RBAC for agency-admin** | Middleware or route helpers | Centralized `requireTenantAdmin` / `requirePlatformAdmin` |

---

## 7. References and Authoritative Sources

| Source | URL | Relevance |
|--------|-----|-----------|
| OWASP Multi-Tenant Security Cheat Sheet | https://cheatsheetseries.owasp.org/cheatsheets/Multi_Tenant_Security_Cheat_Sheet.html | Tenant ID from session, IDOR prevention, cache isolation |
| OWASP ASVS 4.3.4 | https://github.com/OWASP/ASVS | Cross-tenant access control requirement |
| Supabase RLS | https://supabase.com/docs/guides/database/postgres/row-level-security | RLS patterns, defense in depth |
| Supabase RLS Performance | https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv | Index RLS columns, wrap in SELECT |
| Internal: MULTI_TENANT_SECURITY.md | `docs/MULTI_TENANT_SECURITY.md` | RLS, `app_metadata`, verification |
| Internal: SECURITY.md | `SECURITY.md` | Five attack vectors, Vector 4 (admin client scoping) |
| Internal: database.mdc | `.cursor/rules/database.mdc` | tenant_id from app_metadata, cache keys |
| Internal: rls.mdc | `.cursor/rules/rls.mdc` | RLS policy template, `public.tenant_id()` |

---

## 8. Quick Reference: Secure API Route Template

```typescript
// apps/agency-admin/src/app/api/costs/summary/route.ts (corrected pattern)
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@agency/database'
import { getAdminClient } from '@agency/database/admin'

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createSupabaseServerClient({
    getAll: () => cookieStore.getAll().map((c) => ({ name: c.name, value: c.value })),
    setAll: () => {}, // No-op for read-only
  })
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const tenantId = user.app_metadata?.tenant_id as string | undefined
  if (!tenantId) {
    return NextResponse.json({ error: 'No tenant context' }, { status: 403 })
  }

  // Optional: For platform admin, allow ?tenant_id= with validation
  // if (user.app_metadata?.role === 'platform_admin' && searchParams.get('tenant_id')) {
  //   const requested = searchParams.get('tenant_id')
  //   if (await userCanAccessTenant(user.id, requested)) tenantId = requested
  // }

  const admin = getAdminClient()
  const { data, error } = await admin.rpc('get_tenant_cost_summary', {
    p_tenant_id: tenantId,
    p_days: 7,
  })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }

  return NextResponse.json(data?.[0] ?? { totalCost: 0, /* ... */ })
}
```

---

*Generated from best-practices research. Last updated: 2026-03-16.*
