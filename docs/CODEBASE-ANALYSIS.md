# Agency Platform — Codebase Analysis (True State)

**Date:** March 2026  
**Sources:** GUIDE.md, TODO.md, TASKS.md, and full repository inspection  
**Purpose:** Authoritative snapshot of the codebase state for gap-closing work (T-11 through T-25).

---

## 1. Executive Summary

| Phase | Status | Notes |
|-------|--------|------|
| **T-01 – T-10** | ✅ Complete | Foundation, packages, first client (riverside-hotel), firm, agency-admin, Tailwind v4, design tokens |
| **T-11** | ✅ Complete | Supabase local/production linked; migrations apply; Studio verified when Docker runs |
| **T-12** | ✅ Complete | 7 migrations, `public.tenant_id()`, `customer_auth_mappings`, types generated, seed, `db:generate-types` |
| **T-13** | ✅ Complete | RLS verification doc, verify-rls-indexes.sql, 008_rls_checklist_comments.sql, rls.mdc updated |
| **T-14** | ✅ Complete | pgTAP suite in supabase/tests/database/ (000-setup, 00–03); SUPASHIELD_ALLOWLIST.md, EXPECTED_TABLE_COUNT.txt |
| **T-15 – T-25** | ❌ Not done | Auth UI, Inngest, PostHog, AI rules, scaffold polish, Vercel, CI/CD, security, Prettier, CONTRIBUTING |

The repo is a **working monorepo** with schema, types, and shared packages aligned to GUIDE.md. The **next actionable work** is T-13 (RLS verification) and T-14 (RLS tests), then T-15 (multi-tenant auth UI).

---

## 2. Repository Structure (Verified)

### 2.1 Apps

| Path | Purpose | Verified |
|------|---------|----------|
| `apps/agency-admin/` | Internal dashboard; Supabase + Inngest deps; middleware for session refresh | ✅ Present. No `(auth)/*` or `/dashboard`; no Inngest route or functions yet |
| `apps/clients/riverside-hotel/` | First client; tokens, Tailwind v4, `@source`, dark mode test page | ✅ Present. No auth routes or dashboard |
| `apps/firm/` | Agency marketing site; `@agency/ui`, `@agency/analytics` | ✅ Present |

- **No** `apps/clients/acme-health/` (planned in T-23).

### 2.2 Packages

| Package | Role | Verified |
|---------|------|----------|
| `packages/ui` | shadcn/ui components, `cn()`, new-york style | ✅ Exports Button, Card, Input, Label, Dialog, Sheet, Badge, DropdownMenu |
| `packages/database` | Supabase client factories, middleware, auth helpers, types | ✅ `createSupabaseServerClient`, `createSupabaseBrowserClient`, `resolveTenantFromRequest`, `assignUserToTenant`, `createUserForTenant`; `types.ts` generated (audit_log, customer_auth_mappings, tenants, tenant_users, posts, etc.); admin via `@agency/database/admin` only |
| `packages/analytics` | PostHog client/server, tenant-aware | ✅ `initAnalytics`, `captureEvent`, `identifyUser`, `captureServerEvent` (tenant required) |
| `packages/design-tokens` | Style Dictionary v4, W3C DTCG, per-client CSS | ✅ `tokens:build`; `build-clients.ts` → `apps/clients/[slug]/tokens/[slug].css`; riverside-hotel.json |
| `packages/typescript-config` | base.json, nextjs.json | ✅ Present |
| `packages/eslint-config` | Next + TypeScript, no-restricted-imports (apps) | ✅ index.js + flat.cjs |

- **No** `packages/booking/` (GUIDE defers to first hospitality client).

### 2.3 Supabase

| Item | Status |
|------|--------|
| `supabase/config.toml` | ✅ Present |
| `supabase/seed.sql` | ✅ Inserts `riverside-hotel` tenant; ON CONFLICT DO NOTHING |
| `supabase/migrations/` | ✅ **7 migrations** (see §3) |
| `supabase/tests/database/` | ✅ pgTAP: 000-setup-test-hooks.sql, 00-rls-coverage.sql, 01-tenant-isolation.sql, 02-role-hierarchy.sql, 03-positive-access.sql |

### 2.4 Root and Supporting

| Item | Status |
|------|--------|
| `package.json` | ✅ Scripts: dev, build, lint, test, type-check, tokens:build, scaffold, db:generate-types; preinstall only-allow pnpm |
| `pnpm-workspace.yaml` | ✅ catalog with next, react, supabase, inngest, etc.; catalogMode: strict |
| `turbo.json` | ✅ build (^build, tokens:build), dev, lint, type-check, test, tokens:build; outputs include `apps/clients/*/tokens/*.css` |
| `tsconfig.json` | ✅ References: all 6 packages + firm, agency-admin, riverside-hotel |
| `scripts/scaffold-client.ts` | ✅ Creates app dir, package.json, tsconfig, next.config, eslint.config.mjs, postcss.config.mjs, globals.css, layout, page, client token JSON; **does not** create middleware or `@source` / tw-animate in globals.css (T-19 “zero manual edits” not met) |
| `.cursor/rules/` | ✅ base.mdc, database.mdc, rls.mdc. ❌ frontend.mdc, tokens.mdc (T-18) |
| `.github/workflows/ci.yml` | ✅ Checkout, pnpm 10, Node 22, install, type-check, lint, build, test. ❌ No --affected, no types-drift, no RLS job, no deploy.yml |
| `.env.local.example` | ✅ Tenant, Supabase, PostHog, Inngest, DEBUG, SKIP_SSL_VERIFY |

---

## 3. Database Migrations (Exact State)

| Migration | Content |
|------------|---------|
| `001_tenants.sql` | tenants (id, slug, domain, name, industry); RLS; SELECT with inline JWT (refactored in 007) |
| `002_tenant_users.sql` | tenant_users (user_id, tenant_id, role); RLS + indexes; policies refactored in 007 |
| `003_posts.sql` | posts (tenant_id, title, slug, content, published, …); RLS + indexes; refactored in 007 |
| `004_audit_log.sql` | audit_log; RLS with policy USING (false) (service-role only); index (tenant_id, created_at DESC) |
| `005_auth_tenant_id_helper.sql` | `public.tenant_id()` STABLE PARALLEL SAFE; GRANT EXECUTE to authenticated, anon |
| `006_customer_auth_mappings.sql` | customer_auth_mappings (tenant_id, user_id, real_email, auth_email); RLS SELECT USING (user_id = auth.uid()); no INSERT/UPDATE/DELETE for anon/authenticated |
| `007_refactor_rls_use_tenant_id_helper.sql` | Replaces policies on tenants, tenant_users, posts to use `public.tenant_id()` |
| `008_rls_checklist_comments.sql` | COMMENT ON TABLE for all five tables (RLS checklist; docs only) |

- **Final RLS:** tenants (id = public.tenant_id()), tenant_users and posts (tenant_id = public.tenant_id()); audit_log service-only; customer_auth_mappings own-read, service-write.
- **Types:** `packages/database/src/types.ts` is generated (Database, public.* tables); includes TenantId/UserId aliases and header comment per T-12.

---

## 4. Configuration and Conventions

### 4.1 Tenant identity and security

- **Tenant ID:** Always from `app_metadata`, never `user_metadata` (enforced in GUIDE and .cursor/rules). In `packages/database/src/auth.ts`, `createUserForTenant` sets `app_metadata: { tenant_id }`; `user_metadata` is used only for profile fields (e.g. real_email), not for tenant resolution.
- **Service role:** Exposed only via `@agency/database/admin`; not in barrel export.
- **Port:** Supabase connections use Supavisor (6543) per GUIDE; client uses `@supabase/ssr` with project URL.

### 4.2 Tailwind v4

- No `tailwind.config.js` or `tailwind.config.ts` in the repo.
- Apps use `postcss.config.mjs` with `@tailwindcss/postcss`.
- `globals.css`: `@import "tailwindcss"`, `@import "tw-animate-css"`, `@source` for `@agency/ui`; riverside-hotel imports `../../tokens/riverside-hotel.css`.
- No `theme()` in CSS; tokens via `var(--token-name)`.

### 4.3 Design tokens

- Three-tier: primitive → semantic → component.
- Client CSS: `pnpm tokens:build` → `apps/clients/[slug]/tokens/[slug].css` (in .gitignore); turbo.json outputs include these paths.

---

## 5. Gaps vs TASKS.md (T-11–T-25)

| Task | TASKS.md | True state |
|------|----------|------------|
| **T-11** | Done | Done. Local stack verified when Docker runs; production linked; docs/SUPABASE_LOCAL.md |
| **T-12** | Done | Done. 7 migrations, public.tenant_id(), customer_auth_mappings, types, seed, db:generate-types (root + database package) |
| **T-13** | Not done | Not done. RLS checklist and EXPLAIN ANALYZE verification still to do |
| **T-14** | ✅ Complete | pgTAP suite in supabase/tests/database/; SUPASHIELD_ALLOWLIST.md, EXPECTED_TABLE_COUNT.txt |
| **T-15** | Not done | Not done. No (auth)/login, signup, callback, /dashboard in riverside-hotel |
| **T-16** | Not done | Not done. No inngest client, no app/api/inngest/route.ts, no functions in agency-admin |
| **T-17** | Not done | Not done. PostHog not wired in riverside-hotel with tenant + IP/identify docs |
| **T-18** | Not done | Not done. frontend.mdc, tokens.mdc, .windsurf rules, AI_PROMPTING.md missing |
| **T-19** | Not done | Scaffold exists but globals.css lacks @source and tw-animate; no middleware; build not “zero manual edits” |
| **T-20 – T-25** | Not done | No Vercel/deploy workflow, no RLS/affected/types-drift in CI, no security hardening doc, no second client, no Prettier, no CONTRIBUTING/ARCHITECTURE |

---

## 6. Build and Scripts

- **Root:** `pnpm build` / `pnpm type-check` / `pnpm lint` / `pnpm test` delegate to Turbo.
- **Database types:** Root `db:generate-types` runs `turbo run db:generate-types`; database package has `db:generate-types` (project-id) and `db:generate-types:local` (--local). Types written to `packages/database/src/types.ts`.
- **Scaffold:** `pnpm scaffold` runs `tsx scripts/scaffold-client.ts`; prompts for name, slug, industry, domain; creates app under `apps/clients/[slug]` and client token file. Post-scaffold, manual steps: add `@source`, tw-animate, middleware if needed, then `pnpm tokens:build` and add tenant row.

---

## 7. Documentation Present

- `docs/PNPM_NOTES.md`
- `docs/TAILWIND_V4_NOTES.md`
- `docs/SUPABASE_LOCAL.md`
- `docs/QA_ASSESSMENT_T01_T10.md`
- `docs/RESEARCH-marketing-first-repository.md`
- `docs/CODEBASE-ANALYSIS.md` (this file)

Missing per GUIDE/TASKS: BACKGROUND_JOBS.md, POSTHOG_DEPLOYMENT.md, DEPLOYMENT.md, AI_PROMPTING.md, ONBOARDING_CHECKLIST.md, SECURITY.md, ARCHITECTURE.md, CONTRIBUTING.md, SUPASHIELD_ALLOWLIST.md, EXPECTED_TABLE_COUNT.txt.

---

## 8. Confidence Summary

- **Repository layout, packages, and apps:** Verified by path and file content.
- **Migrations 001–007:** Read in full; RLS and helper state as described.
- **Database package:** types.ts generated; exports and admin boundary as specified.
- **Scaffold:** Implemented; gaps for T-19 called out.
- **CI:** Single workflow; no RLS, no deploy, no --affected.
- **Cursor rules:** Three files present; two (frontend, tokens) missing for T-18.

This document reflects the **true state** of the codebase as of the analysis date and should be used as the single source of truth for planning T-13 through T-25.
