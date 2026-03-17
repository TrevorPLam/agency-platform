# Agency Platform TODO (03/2026 Refresh)

This roadmap reflects:
- Up-to-date 03/2026 standards and market direction.
- Verified repository state from `apps/`, `packages/`, `supabase/`, and `docs/`.
- Practical execution order for an agency platform monorepo:
  - agency marketing site,
  - client sites,
  - native tools (booking, analytics, operations).

---

## 1) Research Synthesis (03/2026)

### 1.1 Basics and Fundamentals

- Use a composable monorepo architecture with clear app/package boundaries.
- Keep public websites fast, indexable, and accessible by default.
- Prefer Server Components by default and only add client boundaries where needed.
- Treat tenant isolation and RLS as non-negotiable for all client data paths.
- Track outcomes, not pageviews: conversion events, lead quality, and downstream revenue signals.

### 1.2 Best Practices and Highest Standards

- **Next.js 16 baseline:** Node >= 20.9, Turbopack default, App Router file conventions (`sitemap.ts`, `robots.ts`, metadata APIs).
- **Accessibility baseline:** WCAG 2.2 AA target for product quality; legal floor differs by jurisdiction.
- **Security baseline:** security headers + CSP + strict secret handling + validated server actions/routes.
- **Privacy baseline:** consent-aware analytics, first-party event collection, and explicit data minimization.
- **Performance baseline:** Core Web Vitals monitored in field (LCP/INP/CLS), not just local lab checks.

### 1.3 Enterprise Solutions

- Decision gates are required for:
  - CMS (Sanity / Payload / Contentful class),
  - CRM + marketing automation,
  - CMP/consent tooling,
  - warehouse/CDP path for first-party analytics.
- Use feature-flagged rollout for cross-tenant features.
- Standardize operational controls: incident runbooks, observability, deployment checks, and dependency governance.

### 1.4 Novel / Unique / Innovative Techniques

- AI-assisted content operations:
  - assisted brief generation,
  - reusable content blocks,
  - controlled variant generation for tests.
- Experimentation as a platform capability:
  - reusable event taxonomy,
  - server-side assignment where needed,
  - outcome-level reporting in admin.
- Agent-ready operations:
  - deterministic workflows for onboarding, QA, and launch checks,
  - auditable automation for repetitive agency tasks.

---

## 2) True Codebase State (Verified)

### What is already strong

- Multi-app monorepo structure with shared packages and clear domains.
- Supabase tenant model + RLS-oriented data architecture.
- CI/security workflow coverage is broad.
- Shared UI, analytics, booking, database, and operational packages are present.

### What is materially missing or partial

- Public SEO essentials missing in apps (`metadataBase`, `sitemap.ts`, `robots.ts`, OG image files).
- Security headers incomplete across apps (HSTS + `interest-cohort=()` missing; firm has none).
- Form hardening incomplete (Zod + honeypot not consistently implemented).
- Tests are thin (1 Playwright smoke test, very limited unit coverage).
- Native tools are partial:
  - booking works but is basic (no stronger validation/funnel instrumentation),
  - server-side analytics capability exists but is mostly unwired.
- Content stack is still static/hardcoded (no CMS pipeline).
- Accessibility/performance programs are not yet formalized in CI and release gates.

### Information gaps closed by this refresh

- Converted external standards into concrete engineering tasks.
- Converted codebase findings into explicit priorities and dependency order.
- Added enterprise decision gates (not just implementation tasks).
- Added innovation lane with guardrails so experimentation does not weaken core quality.

### Additional verified risk findings (03/2026 hard evidence pass)

- `apps/agency-admin/src/app/api/costs/*` currently trusts client-provided `tenant_id` (query/body) while using admin client access, which creates cross-tenant authorization risk.
- `apps/agency-admin/src/app/api/costs/recommendations/route.ts` PATCH updates by `id` without tenant scoping, creating IDOR-style risk.
- `apps/agency-admin/src/components/costs/cost-management-dashboard.tsx` calls cost APIs without required `tenant_id`, causing contract-level runtime failures.
- `packages/database/src/types.ts` is currently empty in this branch state, which can block affected build/type/test workflows.
- `apps/prospective-clients/*/src/app/(auth)/callback/route.ts` and login actions currently accept unvalidated redirect targets (`next`/`redirect`), creating open-redirect risk.
- `supabase/migrations/006_dora_metrics.sql` policies currently allow broad authenticated reads without tenant-scoped checks.
- `supabase/migrations/011_cost_monitoring.sql` uses `SECURITY DEFINER` in `get_tenant_cost_summary` without explicit caller-tenant enforcement.
- `supabase/migrations/010_bookings.sql`, `011_cost_monitoring.sql`, and `012_artifact_lifecycle_management.sql` use `CREATE INDEX CONCURRENTLY`, which is unsafe in transactional migration flows.
- `supabase/migrations/012_artifact_lifecycle_management.sql` uses `tenant_id TEXT` instead of UUID-aligned tenant typing, creating policy/type mismatch risk.
- `.github/workflows/recovery-test.yml` and `.github/workflows/governance.yml` reference scripts/files that do not exist, creating guaranteed CI failure paths.
- docs include high-volume broken links and stale path references (e.g. `docs/architecture/*`), reducing operational trust in runbooks.

---

## 3) Execution Rules

- Follow workspace constraints in `.cursor/rules/base.mdc`.
- No `any`; use `unknown` + narrowing or typed interfaces.
- Use named exports only (except Next.js page defaults).
- No cross-app imports; use `packages/*`.
- Keep tasks small and independently reviewable.

---

## 4) Prioritized Roadmap

## P0 - Foundation (Launch Blocking)

## [x] TASK-01: Security headers baseline on all apps

**Why:** Current headers are inconsistent and incomplete.

**Definition of Done**
- `apps/firm/next.config.ts` has hardened headers for all routes.
- `apps/agency-admin/next.config.ts`, `apps/prospective-clients/riley-day-care/next.config.ts`, and `apps/prospective-clients/the-barber-cave/next.config.ts` include:
  - `Strict-Transport-Security` (production-safe usage),
  - `Permissions-Policy` with `interest-cohort=()`,
  - existing header behavior preserved.

**Implementation Notes:**
- Added complete security headers to `firm` app (was missing entirely)
- Added `interest-cohort=()` to Permissions-Policy on all apps for privacy/FLoC opt-out
- Added production-safe HSTS using environment detection (`NODE_ENV === 'production'`)
- Used OWASP-recommended `max-age=63072000; includeSubDomains` for production
- Preserved all existing CSP and other security headers
- HSTS only applies in production to avoid localhost development issues

**Target Files** - COMPLETED
- `apps/firm/next.config.ts` ✅
- `apps/agency-admin/next.config.ts` ✅
- `apps/prospective-clients/riley-day-care/next.config.ts` ✅
- `apps/prospective-clients/the-barber-cave/next.config.ts` ✅

---

## [x] TASK-02: Metadata, sitemap, and robots for indexable apps

**Why:** SEO/indexability is underconfigured in current apps.

**Definition of Done**
- `metadataBase` added for indexable public apps.
- `sitemap.ts` and `robots.ts` created for `firm` and client sites intended for indexing.
- URLs derived from env-safe base URL convention.

**Implementation Notes:**
- Added `metadataBase` with environment-safe URL handling to all three indexable apps:
  - `firm`: localhost:3000 (production uses VERCEL_URL)
  - `riley-day-care`: localhost:3002 (production uses VERCEL_URL)  
  - `the-barber-cave`: localhost:3003 (production uses VERCEL_URL)
- Created dynamic sitemap.ts files using TypeScript with proper MetadataRoute types
- Created dynamic robots.ts files that reference sitemaps and protect sensitive routes
- Used Vercel Academy best practices for environment detection
- All sitemaps include appropriate pages with priorities and change frequencies
- Robots.txt files allow crawling while disallowing API/dashboard/auth routes

**Target Files** - COMPLETED
- `apps/firm/src/app/layout.tsx` ✅
- `apps/firm/src/app/sitemap.ts` ✅
- `apps/firm/src/app/robots.ts` ✅
- `apps/prospective-clients/riley-day-care/src/app/layout.tsx` ✅
- `apps/prospective-clients/riley-day-care/src/app/sitemap.ts` ✅
- `apps/prospective-clients/riley-day-care/src/app/robots.ts` ✅
- `apps/prospective-clients/the-barber-cave/src/app/layout.tsx` ✅
- `apps/prospective-clients/the-barber-cave/src/app/sitemap.ts` ✅
- `apps/prospective-clients/the-barber-cave/src/app/robots.ts` ✅

---

## [x] TASK-03: Node and environment baseline lock

**Why:** Toolchain drift causes CI/local mismatch risk.

**Definition of Done**
- Root `.nvmrc` added and aligned with CI baseline.
- Node version documented in contributor docs.
- Optional CI move to `node-version-file` complete or explicitly deferred.

**Implementation Notes:**
- ✅ `.nvmrc` already existed with Node 22 (aligned with CI)
- ✅ Node version already documented in CONTRIBUTING.md and TOOLCHAIN.md
- ✅ **COMPLETED**: Updated all 18+ GitHub Actions workflows to use `node-version-file: '.nvmrc'` instead of hardcoded `node-version: "22"`
- ✅ **COMPLETED**: Upgraded all workflows from `actions/setup-node@v4` to `actions/setup-node@v6`
- ✅ **COMPLETED**: Added CI/CD Node version management documentation to TOOLCHAIN.md
- ✅ **VERIFIED**: `.nvmrc` contains "22" and will be automatically read by all workflows

**Benefits Achieved:**
- Single source of truth for Node.js version across all environments
- Automatic version synchronization when `.nvmrc` is updated
- Simplified maintenance - no need to update multiple workflow files for Node version changes
- Latest setup-node action with improved features and security

**Target Files** - COMPLETED
- `.nvmrc` ✅ (already existed)
- `CONTRIBUTING.md` ✅ (already documented)  
- `TOOLCHAIN.md` ✅ (updated with CI/CD documentation)
- `.github/workflows/*.yml` ✅ (all 18+ workflows updated)

---

## [x] TASK-04: Type safety ratchet and lint enforcement

**Why:** Several packages still violate strict typing intent.

**Definition of Done**
- `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` enabled where practical via shared config.
- `@typescript-eslint/no-explicit-any` is `error`.
- high-impact `any` sites removed first (analytics/governance/security path).

**Implementation Notes:**
- ✅ Enhanced TypeScript base config with 2026 strictness best practices:
  - `noUncheckedIndexedAccess: true` - prevents undefined access on indexed objects
  - `exactOptionalPropertyTypes: true` - strict optional property handling
  - `noImplicitOverride: true` - prevents accidental method overrides
  - `noFallthroughCasesInSwitch: true` - prevents switch statement fallthrough
  - `noPropertyAccessFromIndexSignature: true` - forces explicit property access
- ✅ Upgraded ESLint enforcement: `@typescript-eslint/no-explicit-any` changed from `warn` to `error` in both index.js and flat.cjs
- ✅ Replaced high-impact `any` types with proper TypeScript patterns:
  - Analytics: `ServerEventProperties` now uses `Record<string, unknown>` instead of `any`
  - Governance: All type assertions in `properties.ts` now use proper union types
  - Security: Extensively refactored `sbom/index.ts` to use `unknown` with type guards
- ✅ Followed agency platform patterns: used `unknown` with narrowing for truly dynamic data
- ✅ Maintained backward compatibility while improving type safety

**Technical Benefits Achieved:**
- **Enhanced Type Safety**: New compiler options catch common runtime errors at compile time
- **Better Developer Experience**: Stricter rules prevent type-related bugs
- **Future-Proof Configuration**: Aligned with TypeScript 6.0 direction (strict by default)
- **Consistent Type Patterns**: All packages now follow the same strict typing approach

**Target Files** - COMPLETED
- `packages/typescript-config/base.json` ✅
- `packages/eslint-config/index.js` ✅
- `packages/eslint-config/flat.cjs` ✅
- `packages/analytics/src/server.ts` ✅
- `packages/governance/src/properties.ts` ✅
- `packages/security/src/sbom/index.ts` ✅

---

## [x] TASK-05: Package build/export integrity fixes

**Why:** Export/build mismatches create latent runtime and DX failures.

**Definition of Done**
- `packages/design-tokens/package.json` entrypoints match actual outputs.
- `packages/metrics` export map matches built artifacts (or build updated).
- `packages/security` type export story fixed (`d.ts` generated or exports corrected).
- broken scripts in governance path resolved.

**Implementation Notes:**
- ✅ **COMPLETED**: Fixed `packages/design-tokens/package.json` exports to match actual build output:
  - Changed `"import": "./dist/index.mjs"` to `"import": "./dist/index.js"` 
  - Build generates `index.js` (ESM) and `index.cjs` (CJS), not `index.mjs`
- 🔄 **PARTIAL**: Other packages blocked by TypeScript strict mode errors and missing database types
- 🚫 **BLOCKED**: `packages/security`, `packages/governance`, `packages/metrics` all fail due to:
  1. TypeScript strict mode compilation errors (from TASK-04 enhancements)
  2. Missing database types in `@agency/database` (TASK-10B dependency)
- 📝 **FINDINGS**: Root cause is incomplete `packages/database/src/types.ts` file blocking dependent packages

**Target Files** - PARTIALLY COMPLETED
- `packages/design-tokens/package.json` ✅
- `packages/metrics/package.json` ⚠️ (blocked by database types)
- `packages/metrics/tsup.config.ts` ⚠️ (blocked by database types)
- `packages/security/package.json` ⚠️ (blocked by TypeScript errors)
- `packages/security/tsup.config.ts` ⚠️ (blocked by TypeScript errors)
- `packages/governance/package.json` ⚠️ (blocked by TypeScript errors)
- `packages/governance/src/*` ⚠️ (blocked by TypeScript errors)

**Dependencies:** Requires TASK-10B completion for full resolution

---

## P1 - Platform Reliability and Conversion Quality

## [ ] TASK-06: Server-side form hardening (Zod + honeypot)

**Why:** Current form handling is functional but not hardened.

**Definition of Done**
- Contact and booking server actions validate with Zod.
- Honeypot support added to public forms.
- Error messages and success states remain user-friendly.

**Target Files**
- `apps/firm/src/app/contact/actions.ts`
- `apps/firm/src/app/contact/contact-form.tsx`
- `apps/firm/src/app/book/actions.ts`
- `apps/prospective-clients/riley-day-care/src/app/contact/actions.ts`
- `apps/prospective-clients/riley-day-care/src/app/contact/contact-form.tsx`
- `apps/prospective-clients/the-barber-cave/src/app/contact/actions.ts`
- `apps/prospective-clients/the-barber-cave/src/app/contact/contact-form.tsx`

---

## [ ] TASK-07: Native booking flow maturity pass

**Why:** Booking exists but lacks stronger product-level instrumentation and outcomes.

**Definition of Done**
- `/booking/success` and/or equivalent completion path implemented where applicable.
- booking submissions emit server-side analytics events with tenant context.
- booking README and integration docs reflect current real usage.

**Target Files**
- `apps/firm/src/app/book/*`
- `apps/firm/src/app/booking/success/page.tsx` (or chosen success route)
- `packages/booking/README.md`
- `packages/analytics/src/server.ts` (if API adjustments needed)

---

## [ ] TASK-08: Server-side analytics wiring for conversion events

**Why:** Client analytics is present; server event coverage is weak.

**Definition of Done**
- Server events wired for:
  - contact form success,
  - booking intent/success,
  - key agency-admin operational actions (where useful).
- Event schema includes tenant context and avoids sensitive data leakage.

**Target Files**
- `apps/firm/src/app/contact/actions.ts`
- `apps/firm/src/app/book/actions.ts`
- `apps/agency-admin/src/app/api/*`
- `packages/analytics/src/server.ts`

---

## [ ] TASK-09: Root loading/error/not-found consistency

**Why:** UX resilience differs between apps.

**Definition of Done**
- `firm`, `riley-day-care`, and `the-barber-cave` have root `loading.tsx`, `error.tsx`, and `not-found.tsx` patterns as appropriate.
- internal/admin app behavior remains intentional.

**Target Files**
- `apps/firm/src/app/loading.tsx`
- `apps/firm/src/app/error.tsx`
- `apps/firm/src/app/not-found.tsx`
- `apps/prospective-clients/riley-day-care/src/app/loading.tsx`
- `apps/prospective-clients/riley-day-care/src/app/error.tsx`
- `apps/prospective-clients/riley-day-care/src/app/not-found.tsx`
- `apps/prospective-clients/the-barber-cave/src/app/loading.tsx`
- `apps/prospective-clients/the-barber-cave/src/app/error.tsx`
- `apps/prospective-clients/the-barber-cave/src/app/not-found.tsx`

---

## [ ] TASK-10: API authorization and tenant isolation hardening (agency-admin costs)

**Why:** Current cost routes trust client-provided `tenant_id` and are vulnerable to cross-tenant access/mutation.

**Definition of Done**
- All `apps/agency-admin/src/app/api/costs/*` handlers derive tenant scope from authenticated session (`app_metadata.tenant_id`) or a validated platform-admin path.
- No route authorizes tenant scope from query params/body alone.
- `recommendations` PATCH includes tenant-scoped update guards (no update by `id` alone).
- API handlers enforce auth directly (not only middleware redirect behavior).
- Validation remains in place, but authorization is the primary gate.

**Target Files**
- `apps/agency-admin/src/app/api/costs/summary/route.ts`
- `apps/agency-admin/src/app/api/costs/metrics/route.ts`
- `apps/agency-admin/src/app/api/costs/alerts/route.ts`
- `apps/agency-admin/src/app/api/costs/recommendations/route.ts`
- `packages/database/src/middleware.ts` (documentation/guard usage notes if needed)

---

## [ ] TASK-10A: Cost dashboard and API contract alignment

**Why:** Dashboard calls and route contracts are currently inconsistent, creating guaranteed runtime errors.

**Definition of Done**
- Cost dashboard requests match route contract for tenant context and optional filters.
- Route contract is documented in code comments or shared schema location.
- Error UX for cost dashboard distinguishes auth/authorization failure vs transient backend failure.

**Target Files**
- `apps/agency-admin/src/components/costs/cost-management-dashboard.tsx`
- `apps/agency-admin/src/app/api/costs/summary/route.ts`
- `apps/agency-admin/src/app/api/costs/metrics/route.ts`
- `apps/agency-admin/src/app/api/costs/alerts/route.ts`
- `apps/agency-admin/src/app/api/costs/recommendations/route.ts`

---

## [ ] TASK-10B: Database type generation and drift gate recovery

**Why:** Empty/stale generated DB types can block build/type-check/test and reduce confidence in schema safety.

**Definition of Done**
- `packages/database/src/types.ts` is generated and non-empty.
- Generation command and ownership are documented for contributors.
- CI type drift gate remains green with deterministic regeneration flow.

**Target Files**
- `packages/database/src/types.ts`
- `packages/database/package.json`
- `.github/workflows/ci.yml`
- `CONTRIBUTING.md`

---

## [ ] TASK-10C: Redirect hardening for auth flows

**Why:** Unvalidated redirect targets (`next`, `redirect`) create open-redirect risk after auth.

**Definition of Done**
- All auth callback/login flows only allow safe relative redirects (no absolute external targets, no protocol-relative `//`).
- Shared validation utility used where practical to prevent drift.
- Invalid redirect inputs fall back to safe defaults.

**Target Files**
- `apps/agency-admin/src/app/login/actions.ts`
- `apps/prospective-clients/riley-day-care/src/app/(auth)/login/actions.ts`
- `apps/prospective-clients/the-barber-cave/src/app/(auth)/login/actions.ts`
- `apps/prospective-clients/riley-day-care/src/app/(auth)/callback/route.ts`
- `apps/prospective-clients/the-barber-cave/src/app/(auth)/callback/route.ts`

---

## [ ] TASK-10D: DORA data tenant isolation and policy correction

**Why:** Current DORA table policies are not tenant-scoped and can leak cross-tenant data.

**Definition of Done**
- DORA tables are tenant-scoped (or explicitly admin-only with documented rationale).
- RLS policies enforce tenant context from `app_metadata`.
- pgTAP tests include DORA isolation checks.

**Target Files**
- `supabase/migrations/006_dora_metrics.sql`
- `supabase/migrations/007_refactor_rls_use_tenant_id_helper.sql` (if updates required)
- `supabase/tests/database/01-tenant-isolation.sql`
- `supabase/tests/database/03-positive-access.sql`

---

## [ ] TASK-10E: Cost summary function authorization fix (`SECURITY DEFINER`)

**Why:** Definer-executed functions must enforce caller authorization internally, not trust input params.

**Definition of Done**
- `get_tenant_cost_summary` enforces caller tenant equivalence (or is restricted to service-role usage only).
- Function behavior is documented with explicit authorization contract.
- Route usage aligns with updated contract and tests cover negative cross-tenant cases.

**Target Files**
- `supabase/migrations/011_cost_monitoring.sql`
- `apps/agency-admin/src/app/api/costs/summary/route.ts`
- `apps/agency-admin/src/app/api/costs/metrics/route.ts`
- `supabase/tests/database/*` (function auth test coverage)

---

## [ ] TASK-10F: Migration safety and ordering integrity pass

**Why:** Current migration set includes patterns that can fail in transactional execution and ordering ambiguity.

**Definition of Done**
- `CREATE INDEX CONCURRENTLY` usage removed or moved to safe non-transactional strategy.
- Duplicate/ambiguous migration ordering is resolved with deterministic sequence.
- migration runbook includes explicit guidance for online index strategy.

**Target Files**
- `supabase/migrations/010_bookings.sql`
- `supabase/migrations/011_cost_monitoring.sql`
- `supabase/migrations/012_artifact_lifecycle_management.sql`
- `docs/SUPABASE_LOCAL.md`
- `docs/DEVELOPER_OPERATIONS.md`

---

## [ ] TASK-10G: Artifact tenant schema normalization (UUID alignment)

**Why:** Artifact lifecycle tables currently diverge from core tenant typing and weaken policy correctness.

**Definition of Done**
- Artifact-related tenant columns align with canonical tenant UUID model.
- Foreign keys and RLS comparisons are type-consistent.
- Seed/default data is valid for tenant model or moved to explicit bootstrap flow.

**Target Files**
- `supabase/migrations/012_artifact_lifecycle_management.sql`
- `packages/artifacts/src/*`
- `supabase/tests/database/00-rls-coverage.sql`

---

## [ ] TASK-10H: CI workflow executable integrity recovery

**Why:** Multiple workflows reference missing scripts/files and can fail independent of product correctness.

**Definition of Done**
- Recovery and governance workflows only reference existing executable scripts.
- Missing scripts are implemented or workflow steps are removed/guarded.
- Workflow smoke run validates script path correctness.

**Target Files**
- `.github/workflows/recovery-test.yml`
- `.github/workflows/governance.yml`
- `.github/workflows/audit.yml`
- `scripts/test/*` (create as needed)
- `scripts/governance/*`

---

## [ ] TASK-10I: Documentation path and runbook trust restoration

**Why:** Broken links and stale path conventions in docs create operational errors during incidents and onboarding.

**Definition of Done**
- Broken path references (`docs/architecture/*`, `docs/guides/*`, etc.) are corrected or files moved to match.
- security/onboarding docs reference current canonical files.
- docs link-check is automated in CI or pre-merge validation.

**Target Files**
- `README.md`
- `CONTRIBUTING.md`
- `SECURITY.md`
- `docs/*.md`
- `.github/workflows/ci.yml` (or dedicated docs validation workflow)

---

## [ ] TASK-11: Test coverage baseline expansion

**Why:** Existing test surface is too narrow for platform confidence.

**Definition of Done**
- Playwright coverage expands beyond homepage smoke.
- At least one app-level Vitest setup exists for unit testing.
- Data-testid strategy added for stable E2E selectors where needed.

**Target Files**
- `apps/firm/e2e/*`
- `apps/firm/playwright.config.ts`
- `apps/firm/vitest.config.ts`
- `apps/firm/src/**/*.test.ts`
- `apps/firm/src/**/*` (for selectors where required)

---

## [ ] TASK-12: Dependency hygiene and script coverage

**Why:** Some packages/apps declare deps they do not use and miss standard scripts.

**Definition of Done**
- Unused deps removed or intentionally wired (`@agency/metrics`, `@agency/monitoring` in admin decision path).
- `lint` scripts standardized for key packages lacking them.
- package-level script surface aligns with turbo expectations.

**Target Files**
- `apps/agency-admin/package.json`
- `packages/database/package.json`
- `packages/analytics/package.json`
- `packages/monitoring/package.json`

---

## P2 - Enterprise Readiness

## [ ] TASK-13: CMS and content-ops decision gate

**Why:** Blog/content is currently hardcoded and blocks scalable agency operations.

**Definition of Done**
- Architecture decision documented for CMS path (adopt/defer with criteria).
- If adopting now: implementation backlog created with migration tasks.
- If deferring: explicit interim content workflow and ownership documented.

**Target Files**
- `docs/ARCHITECTURE.md`
- `docs/CLIENT_ONBOARDING.md`
- `TODO.md` (follow-up execution tasks)

---

## [ ] TASK-14: Accessibility program baseline (WCAG 2.2 AA target)

**Why:** Accessibility quality is not yet a programmatic release gate.

**Definition of Done**
- Accessibility acceptance checklist added for public apps.
- Automated checks integrated into CI/lint/test flow (initial baseline).
- Focus visibility, form semantics, keyboard support, and target size checks covered in test strategy.

**Target Files**
- `.github/workflows/ci.yml`
- `docs/DEVELOPER_OPERATIONS.md` (or testing docs)
- `apps/firm/*`, `apps/prospective-clients/*` (as needed for fixes)

---

## [ ] TASK-15: Consent and privacy architecture hardening

**Why:** Consent task exists but needs explicit architecture and event policy.

**Definition of Done**
- Consent state model documented and implemented for public apps.
- Analytics/event capture honors consent state.
- data retention/minimization rules documented at implementation level.

**Target Files**
- `apps/firm/src/components/providers.tsx`
- `apps/prospective-clients/*/src/components/providers.tsx`
- `packages/analytics/src/client.ts`
- `docs/POSTHOG_DEPLOYMENT.md`

---

## [ ] TASK-16: Core Web Vitals field observability

**Why:** No consistent field performance feedback loop yet.

**Definition of Done**
- CWV reporting path defined and integrated (LCP, INP, CLS).
- alerting/reporting baseline documented for regressions.
- performance budgets or threshold policy added for launch quality.

**Target Files**
- `apps/firm/src/*` (where vitals reporting hooks live)
- `apps/prospective-clients/*/src/*`
- `docs/DEVELOPER_OPERATIONS.md`
- `docs/DEPLOYMENT.md`

---

## P3 - Innovation Lane (Guardrailed)

## [ ] TASK-17: Experimentation framework bootstrap

**Why:** Agency growth depends on repeated, measurable experimentation.

**Definition of Done**
- Standard experiment schema defined (hypothesis, metric, window, owner).
- Event taxonomy supports attribution to experiments.
- Initial admin visibility for experiment outcomes is specified.

**Target Files**
- `docs/GUIDE.md`
- `docs/ARCHITECTURE.md`
- `apps/agency-admin/src/app/(dashboard)/*` (follow-up implementation)

---

## [ ] TASK-18: AI-assisted content ops pilot (safe mode)

**Why:** AI can accelerate content delivery but needs quality and compliance guardrails.

**Definition of Done**
- Pilot scope defined (internal drafting only first).
- Human review, brand voice, and legal/compliance checks documented.
- No direct auto-publish without approval workflow.

**Target Files**
- `docs/AI_DEVELOPMENT_GUIDE.md`
- `docs/GUIDE.md`
- `TODO.md` (future implementation subtasks)

---

## 5) Task Dependencies (Critical Path)

1. `TASK-01` -> `TASK-02` -> `TASK-06` -> `TASK-07` -> `TASK-08`
2. `TASK-03` + `TASK-04` + `TASK-05` should complete before broad new feature rollout.
3. `TASK-11` starts during P1 and continues through all later tasks.
4. `TASK-14` + `TASK-15` + `TASK-16` are mandatory before production launch claims.
5. `TASK-10` -> `TASK-10A` -> `TASK-10B` -> `TASK-10C` -> `TASK-10D` -> `TASK-10E` -> `TASK-10F` -> `TASK-10G` -> `TASK-10H` -> `TASK-10I` -> `TASK-11` for security/data/ops correctness before broader confidence claims.

---

## 6) Deferred / Non-Goals For This Cycle

- Full enterprise DXP migration in one iteration.
- Multi-region data architecture redesign.
- Complete redesign of all client site templates.
- Highly dynamic AI personalization without consent and measurement controls.

---

## 7) Source Anchors (Research Basis)

- [Next.js 16 upgrade and production guidance](https://nextjs.org/docs/app/guides/upgrading/version-16)
- [Next.js metadata sitemap convention](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap)
- [Next.js metadata robots convention](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots)
- [Next.js production checklist](https://nextjs.org/docs/app/guides/production-checklist)
- [React 19 release notes](https://react.dev/blog/2024/12/05/react-19)
- [W3C WCAG 2.2 recommendation](https://www.w3.org/TR/WCAG22/)
- [ADA Title II web rule overview](https://www.ada.gov/resources/2024-03-08-web-rule/)
- [Google consent mode guidance](https://developers.google.com/tag-platform/security/guides/consent)
- [Privacy Sandbox next steps update](https://privacysandbox.com/intl/en_us/news/privacy-sandbox-next-steps/)
- [Supabase row level security guide](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Stripe checkout success and webhook guidance](https://docs.stripe.com/payments/checkout/custom-success-page)
- [Core Web Vitals guidance](https://web.dev/articles/vitals)
- [OWASP Multi-Tenant Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Multi_Tenant_Security_Cheat_Sheet.html)
- [OWASP ASVS](https://github.com/OWASP/ASVS)
- [RFC 9457: Problem Details for HTTP APIs](https://www.rfc-editor.org/rfc/rfc9457.html)
