# Agency Platform — Full Codebase Analysis

**Date:** March 2026  
**Scope:** Current status, code quality, configuration, tooling, and architecture vs. GUIDE.md and RESEARCH.

---

## Executive Summary

The repository is a **working but incomplete** implementation of the agency monorepo described in GUIDE.md. Core pieces (pnpm workspace, Turborepo, shared packages, design tokens, one client app, agency-admin, firm app) are in place. Several **blocking issues** prevent `pnpm type-check` and `pnpm lint` from passing: empty database types, TypeScript config resolution, Next.js lint configuration, and middleware type mismatch. Supabase has **no migrations** and no RLS tests. The **scaffold** script is broken (no implementation). Aligning with the GUIDE and fixing these items will make the repo production-ready.

---

## 1. Repository Structure

### 1.1 Current Layout

| Path | Status | Notes |
|------|--------|------|
| `apps/agency-admin/` | ✅ Present | Internal dashboard; uses @agency/ui, database, analytics |
| `apps/firm/` | ✅ Present | Agency marketing site (GUIDE calls this out as optional; you have it) |
| `apps/clients/riverside-hotel/` | ✅ Present | Sample client; tokens, Tailwind v4, @agency/ui, analytics |
| `packages/ui/` | ✅ Present | shadcn-style components, `cn()`, exported components |
| `packages/database/` | ⚠️ Broken | Types empty; client uses createClient not @supabase/ssr |
| `packages/design-tokens/` | ✅ Present | Style Dictionary v4, clients + primitives/semantic/component |
| `packages/analytics/` | ✅ Present | PostHog client/server, tenant-aware |
| `packages/typescript-config/` | ⚠️ Incomplete | base.json/nextjs.json exist but resolution fails in dependents |
| `packages/eslint-config/` | ✅ Present | no-restricted-imports (apps), TypeScript rules |
| `supabase/` | ⚠️ Incomplete | config.toml, seed.sql only — **no migrations**, no tests |
| `scripts/` | ❌ Missing | No `scaffold-client.ts`; root `scaffold` runs `turbo run scaffold` (no package defines it) |
| `.cursor/rules/` | ❌ Missing | Empty; GUIDE specifies base, database, rls, frontend, tokens |
| `.github/workflows/` | ❌ Missing | Only CODEOWNERS; no ci.yml, deploy.yml |

### 1.2 Comparison to GUIDE.md

- **Apps:** GUIDE has `agency-admin` + `clients/[slug]`. You also have `firm` (agency site) — aligns with RESEARCH “agency marketing site.”
- **Packages:** Same set except GUIDE’s `booking` package is absent (acceptable if not needed yet).
- **Root config:** `package.json` scripts match except `scaffold` and root has `db:generate-types` (delegated to database package).
- **Missing from GUIDE:** `supabase/migrations/`, `supabase/tests/`, `scripts/scaffold-client.ts`, `.cursor/rules/`, `.github/workflows/`.

---

## 2. Configuration & Tooling

### 2.1 pnpm-workspace.yaml

- **Status:** ✅ Solid  
- **Details:** `packages: apps/**`, `packages/**`; catalog with next, react, tailwind, supabase, inngest, zod, eslint, vitest, etc. `catalogMode: strict`, `cleanupUnusedCatalogs: true`.  
- **Gaps:** None. Optional: ensure every package uses `catalog:` for shared deps (e.g. `packages/ui` uses raw versions for `clsx` / `tailwind-merge`; they are in catalog).

### 2.2 turbo.json

- **Status:** ✅ Aligned with GUIDE  
- **Tasks:** build (depends on ^build + tokens:build), dev, lint, type-check, test, tokens:build.  
- **Note:** `tokens:build` outputs `dist/**/*.css`; design-tokens also writes to `apps/clients/*/tokens/*.css`. Those outputs are outside `dist/` so Turbo cache may not fully capture client token changes. Consider adding `apps/clients/*/tokens/*.css` to outputs or documenting that client tokens are side effects.

### 2.3 Root tsconfig.json

- **Status:** ✅  
- **References:** All packages and apps (firm, agency-admin, riverside-hotel). Correct for composite/reference structure.

### 2.4 TypeScript Config (@agency/typescript-config)

- **Status:** ❌ Failing in dependents  
- **Issue:** `@agency/analytics` (and any package extending `@agency/typescript-config/base.json`) fails with:  
  `File '@agency/typescript-config/base.json' not found.`  
- **Cause:** Package has no `exports` in package.json; in some resolution contexts the subpath `base.json` is not found.  
- **Fix:** In `packages/typescript-config/package.json` add exports, e.g.:  
  `"exports": { "./base.json": "./base.json", "./nextjs.json": "./nextjs.json" }`  
  and ensure the files are included in the published/linked package.

### 2.5 ESLint

- **Status:** ❌ Next.js apps fail lint  
- **Error:** `Invalid project directory provided, no such directory: .../apps/agency-admin/lint` (and same for firm, riverside-hotel).  
- **Cause:** `next lint` is being given a wrong directory (e.g. a `lint` folder or misconfigured eslint config).  
- **Fix:** Ensure no custom `next lint --dir lint` (or similar); use default `next lint` or correct dir. Check for `eslint.config.*` or `.eslintrc` that might pass an incorrect path.

### 2.6 Environment Template

- **Status:** ✅ Good  
- **File:** `.env.local.example` documents tenant, Supabase, PostHog, Inngest, debug.  
- **Gap:** Example uses `NEXT_PUBLIC_POSTHOG_API_KEY` / `NEXT_PUBLIC_POSTHOG_API_HOST`; `@agency/analytics` uses `NEXT_PUBLIC_POSTHOG_KEY` / `NEXT_PUBLIC_POSTHOG_HOST`. Unify names so copy-paste works.

---

## 3. Package-by-Package Assessment

### 3.1 @agency/ui

- **Purpose:** Shared UI (shadcn-style) and `cn()`.  
- **Quality:** ✅ Good: clean exports, `cn()` in utils, catalog deps (plus direct clsx/tailwind-merge; consider `catalog:`).  
- **Build:** Script is `node -e "process.exit(0)"` (no-op). Fine if consumed as source via `main: "./src/index.ts"` and transpiled by apps.  
- **Gap:** GUIDE suggests installing shadcn into this package; you have components; ensure any new shadcn components are added here.

### 3.2 @agency/database

- **Purpose:** Typed Supabase client, tenant resolution, auth helpers, admin client.  
- **Critical issues:**
  1. **`src/types.ts` is empty.** All of client, admin, auth, index import `Database`, `TenantId`, `UserId` from it. Type-check fails: “File is not a module.”  
     - **Fix:** Run `pnpm db:generate-types` (Supabase project linked) or add a minimal hand-written `Database`/`TenantId`/`UserId` stub until migrations exist.
  2. **Server client uses `@supabase/supabase-js` `createClient`** with a custom cookie adapter. GUIDE recommends `@supabase/ssr` `createServerClient` for correct Supavisor/session behavior. Consider migrating to `@supabase/ssr` for server.
  3. **`createSupabaseServerClient(cookieStore: Promise<...>)`** — API takes a Promise; GUIDE pattern often uses synchronous cookie store. Document or align with Next 15+ `cookies()` usage.
  4. **client.ts** uses `next/headers` (cookies); **middleware.ts** uses `next/server`. Database package does not depend on `next`; type-check fails with “Cannot find module 'next/headers'”. Add `next` as optional/peer or move server/middleware code to a Next-specific package.
  5. **SupabaseClientOptions:** Type-check reports `'cookies' does not exist on type 'SupabaseClientOptions'`. The current options shape may not match `@supabase/supabase-js` typings; use the correct options for createClient (or switch to createServerClient from @supabase/ssr).
  6. **middleware.ts** returns `{ ...tenant, source: 'hostname' }` where `tenant` has `id`, `slug`, `domain`. `TenantResolution` expects `tenantId`, `tenantSlug`. So the object is missing required properties. Fix: map `id` → `tenantId`, `slug` → `tenantSlug` in the return.
- **Positive:** admin.ts is server-only guarded; auth has tenant assignment and email-aliasing helpers; middleware has dev hostname + production DB lookup.

### 3.3 @agency/design-tokens

- **Purpose:** Style Dictionary v4, primitives/semantic/component + per-client tokens.  
- **Status:** ✅ Implemented and consistent with GUIDE ideas.  
- **Details:** ESM, async build (`hasInitialized`, `buildPlatform`), builds to `dist/` and to `apps/clients/<name>/tokens/<name>.css`. riverside-hotel.json uses W3C-style `$type`/`$value` and references.  
- **Gaps:** Package has `main`/`types` pointing at `dist/index.js` and `dist/index.d.ts` but the build only produces CSS (no JS entry). If nothing imports `@agency/design-tokens` as JS, this is harmless; otherwise add a stub or remove main/types.

### 3.4 @agency/analytics

- **Status:** ✅ Tenant-aware PostHog init, capture, identify, reset.  
- **Issue:** type-check fails only due to typescript-config resolution (see above).  
- **Env:** Uses `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST`; align .env.example with these names.

### 3.5 @agency/typescript-config

- **Status:** base.json and nextjs.json exist and are reasonable.  
- **Issue:** Subpath resolution fails when other packages extend them. Add `exports` so `@agency/typescript-config/base.json` and `./nextjs.json` resolve.

### 3.6 @agency/eslint-config

- **Status:** ✅ Extends next/core-web-vitals and TypeScript; no-restricted-imports for `../apps/**`; good for dependency direction.

---

## 4. Applications

### 4.1 agency-admin

- **Stack:** Next.js, @agency/ui, database, analytics, Inngest.  
- **Config:** Uses catalog and workspace deps; type-check fails due to database/types and possibly typescript-config.  
- **Lint:** Fails with “Invalid project directory .../lint” (see ESLint section).

### 4.2 firm

- **Stack:** Next.js, @agency/ui, analytics (no database).  
- **Role:** Agency marketing site; no tenant DB dependency.  
- **Lint:** Same Next lint issue as above.

### 4.3 clients/riverside-hotel

- **Stack:** Next.js, @agency/ui, analytics; no @agency/database.  
- **Design:** globals.css uses Tailwind v4, `@source` for UI package, client tokens, dark mode variables.  
- **next.config:** CommonJS; transpilePackages: ui, analytics.  
- **Gaps:** Missing `type-check` script (GUIDE has it); missing `@agency/eslint-config` in devDependencies (has TypeScript ESLint directly).  
- **Lint:** Same Next lint issue.

---

## 5. Supabase & Data Layer

### 5.1 Migrations

- **Status:** ❌ None.  
- **Current:** `supabase/config.toml` and `seed.sql` only; `supabase/migrations/` is missing.  
- **Impact:** No versioned schema; no RLS policies; `db:generate-types` has no schema to generate from (types.ts is empty).  
- **Recommendation:** Add migrations per GUIDE (e.g. 001_tenants.sql, 002_rls_policies.sql, 003_audit_log.sql) and run them locally/linked project, then run `db:generate-types`.

### 5.2 RLS & Tests

- **Status:** ❌ No `supabase/tests/` and no pgTAP/RLS tests.  
- **GUIDE:** Expects `supabase/tests/database/` with tenant isolation and RLS coverage.  
- **Recommendation:** Add test suite and run `supabase test db` in CI once migrations exist.

---

## 6. Code Quality Summary

| Area | Status | Notes |
|------|--------|--------|
| Type-check | ❌ Failing | types.ts empty; typescript-config resolution; database next/cookies types; middleware return type |
| Lint | ❌ Failing | Next.js apps: invalid lint directory |
| Tests | ❌ None | No package defines `test` script; turbo run test runs nothing |
| Dependency direction | ✅ | ESLint blocks packages importing from apps |
| Catalog usage | ⚠️ | Mostly catalog; ui (and optionally others) could standardize on catalog: for all shared deps |
| Documentation | ✅ | GUIDE.md, RESEARCH, .env.example, CODEOWNERS |

---

## 7. Architecture vs. GUIDE & RESEARCH

- **Multi-client, multi-site:** One repo, multiple apps (agency-admin, firm, clients/riverside-hotel); tenant resolution in database package; design tokens per client. Aligned.
- **Multi-industry:** Not yet modeled (no industry field or branching); can be added via tenant config/CMS later.
- **Shared packages:** ui, database, analytics, design-tokens, typescript-config, eslint-config. Structure matches GUIDE; database and typescript-config need fixes.
- **Missing for “marketing-first” research:** Agency site (firm) ✅. Landing pages as first-class app or routes: not yet. Native/booking app: not in repo. These are optional next steps.

---

## 8. Recommendations (Priority Order)

### P0 — Unblock build and lint

1. **Database types:** Add minimal `Database` (e.g. `export interface Database { public: { Tables: {}; Views: {}; Functions: {}; Enums: {} } }`) and `TenantId`/`UserId` in `packages/database/src/types.ts`, or run `pnpm db:generate-types` after adding at least one migration and linking the project.
2. **TenantResolution in middleware:** In `resolveTenantFromRequest`, return `{ tenantId: tenant.id, tenantSlug: tenant.slug, source: 'hostname' }` (and same for dev) so the type matches.
3. **TypeScript config resolution:** In `packages/typescript-config/package.json`, add `"exports": { "./base.json": "./base.json", "./nextjs.json": "./nextjs.json" }`.
4. **Database + Next types:** Add `next` as peer (or dev) dependency of `@agency/database` so `next/headers` and `next/server` resolve, or isolate server/middleware in an app-specific layer.
5. **Next.js lint:** Fix `next lint` usage (remove wrong directory argument or fix eslint config so no “lint” directory is implied).

### P1 — Align with GUIDE and security

6. **Supabase migrations:** Introduce `supabase/migrations/` with tenants and at least one RLS table; run migrations and regenerate types.
7. **Auth metadata:** Store tenant_id in `app_metadata` (not `user_metadata`) in auth.ts so users cannot change it (GUIDE §6, §18).
8. **Server client:** Consider switching server client to `@supabase/ssr` `createServerClient` and Supavisor (port 6543) as in GUIDE.

### P2 — Tooling and consistency

9. **Scaffold:** Add `scripts/scaffold-client.ts` and root script `"scaffold": "tsx scripts/scaffold-client.ts"` (and add tsx to root devDependencies), or implement `scaffold` in a package and wire it in turbo.
10. **PostHog env:** Unify .env.example with analytics (e.g. `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`).
11. **Tests:** Add at least one package with a `test` script (e.g. vitest) and optional `supabase/tests/database/` for RLS.
12. **Cursor rules:** Add `.cursor/rules/` (e.g. base.mdc, database.mdc) as in GUIDE for AI-assisted consistency.
13. **CI/CD:** Add `.github/workflows/ci.yml` (build, lint, type-check, test) and optionally deploy workflow.

### P3 — Optional

14. **Turbo tokens output:** Include `apps/clients/*/tokens/*.css` in `tokens:build` outputs if you want cache correctness for client token changes.  
15. **riverside-hotel:** Add `type-check` script and @agency/eslint-config; consider adding @agency/database if the client app will use tenant/auth.  
16. **design-tokens:** Remove or stub `main`/`types` if the package is never imported as JS.

---

## 9. Verification Commands

After fixes:

```bash
pnpm install
pnpm run tokens:build
pnpm run type-check
pnpm run lint
pnpm run build
```

For Supabase (after migrations exist):

```bash
supabase db reset   # or link + push
pnpm db:generate-types
```

---

*This analysis is based on the repository state at the time of review. Re-run type-check and lint after applying the P0/P1 fixes to confirm.*
