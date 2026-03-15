# Agency Platform — Gap-Closing Tasks

**Stack:** Next.js 16.1 · Turborepo 2.7 · pnpm 10.x · Supabase · Tailwind CSS v4 · Style Dictionary v4 · shadcn/ui · TypeScript 5.x  
**Complements:** TODO.md (full task specs, DoD, patterns)  
**Scope:** Shortlist of remaining work to close the gap from current state to full platform per GUIDE.md

> **How to use:** This list covers T-11 through T-25 only. For subtask details, Definition of Done, and implementation notes, see **TODO.md**. Task IDs match TODO.md — use them in commits and PRs (e.g. `feat(T-12): add auth.tenant_id() helper`).

---

## Task Index

| ID | Task | Phase |
|---|---|---|
| [T-11](#t-11-supabase-local-environment) | Supabase Local Environment | Database |
| [T-12](#t-12-database-schema--migrations) | Database Schema & Migrations | Database |
| [T-13](#t-13-row-level-security-policies) | Row-Level Security Policies | Database |
| [T-14](#t-14-rls-automated-testing) | RLS Automated Testing | Database |
| [T-15](#t-15-multi-tenant-auth) | Multi-Tenant Auth | Auth |
| [T-16](#t-16-inngest-background-jobs) | Inngest Background Jobs | Jobs |
| [T-17](#t-17-posthog-analytics) | PostHog Analytics | Analytics |
| [T-18](#t-18-ai-tool-configuration-cursor--windsurf) | AI Tool Configuration | DX |
| [T-19](#t-19-client-scaffolding-script) | Client Scaffolding Script | DX |
| [T-20](#t-20-vercel-deployment) | Vercel Deployment | Deployment |
| [T-21](#t-21-cicd--github-actions) | CI/CD — GitHub Actions | CI/CD |
| [T-22](#t-22-security-hardening) | Security Hardening | Security |
| [T-23](#t-23-second-client-app--onboarding-validation) | Second Client App & Onboarding Validation | Validation |
| [T-24](#t-24-prettier--code-formatting) | Prettier & Code Formatting | DX |
| [T-25](#t-25-contributingmd--local-dev-runbook) | CONTRIBUTING.md & Local Dev Runbook | DX |

---

## T-11: Supabase Local Environment

- [x] **T-11**  Supabase runs locally via Docker; production project linked; local stack verified.

### Shortlist

- [x] **T-11.03** Run `supabase start` with Docker — confirm full stack starts.
- [x] **T-11.09** Verify `supabase status` and Studio at `http://localhost:54323`.

*Full subtasks and DoD → TODO.md § T-11.*

### Implementation notes (T-11)

- **Verified:** From repo root, `npx supabase start` (Docker Desktop running) completed successfully. All four migrations applied (001_tenants, 002_tenant_users, 003_posts, 004_audit_log); seed ran. First run took ~5 min (image pulls).
- **Status:** `npx supabase status` reports "supabase local development setup is running." Studio at http://127.0.0.1:54323 (or http://localhost:54323). Optional services imgproxy and pooler may show stopped; core stack (API, DB, Studio, Auth, Storage) is up.
- **Local keys:** Use the Publishable and Secret keys printed by `supabase start` in each app's `.env.local` (NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321, NEXT_PUBLIC_SUPABASE_ANON_KEY=…, SUPABASE_SERVICE_ROLE_KEY=…). See `docs/SUPABASE_LOCAL.md`.

---

## T-12: Database Schema & Migrations

- [x] **T-12**  Schema matches spec: `tenants`, `posts`, `audit_log`, `customer_auth_mappings`; `public.tenant_id()` helper; types generated and committed.

### Shortlist

- [x] **T-12.04** Add `006_customer_auth_mappings.sql` (table for real_email → auth_email; RLS: own-read, service-role write).
- [x] **T-12.05** Add `005_auth_tenant_id_helper.sql` (public.tenant_id() STABLE PARALLEL SAFE); refactor RLS in `007_refactor_rls_use_tenant_id_helper.sql`.
- [x] **T-12.06** Apply migrations: `supabase db reset` (all 7 migrations apply; 502 on container restart is non-fatal).
- [x] **T-12.07** Generate and commit `packages/database/src/types.ts` (includes customer_auth_mappings, tenant_id function).
- [x] **T-12.09** Root script `db:generate-types` exists and runs `turbo run db:generate-types`; database package uses `supabase gen types typescript --local` for local.
- [x] **T-12.11** Test tenant in `supabase/seed.sql` (riverside-hotel); copy tenant UUID from Studio or after reset into `.env.local` for T-15.

*Full subtasks and DoD → TODO.md § T-12.*

### Implementation notes (T-12)

- **Helper:** Created in `public` schema as `public.tenant_id()` (migrations cannot create in `auth` schema). All RLS policies refactored to use `public.tenant_id()`.
- **customer_auth_mappings:** Table has tenant_id, user_id, real_email, auth_email; RLS SELECT USING (user_id = auth.uid()). `createUserForTenant` in `@agency/database` now inserts into this table for login-by-real-email (T-15).
- **Types:** Regenerated with `npx supabase gen types typescript --local`; added UserId/TenantId aliases and header comment.
- **Seed:** `supabase/seed.sql` inserts riverside-hotel tenant; use Studio or `SELECT id FROM tenants WHERE slug = 'riverside-hotel'` to get UUID for `.env.local`.

---

## T-13: Row-Level Security Policies

- [x] **T-13**  Every table has RLS enabled; all four policy types where applicable; `public.tenant_id()` used; indexes verified via `EXPLAIN ANALYZE`.

### Shortlist

- [x] **T-13.01** – **T-13.03** Verify/add RLS checklist comments and policies on all tenant-scoped tables.
- [x] **T-13.04** – **T-13.07** Confirm Index Scan (not Seq Scan) and `public.tenant_id()` STABLE PARALLEL SAFE.

*Full subtasks and DoD → TODO.md § T-13.*

### Implementation notes (T-13)

- **Checklist:** Added `docs/RLS_VERIFICATION.md` with per-table RLS summary (tenants, tenant_users, posts, audit_log, customer_auth_mappings), confirmation that `public.tenant_id()` is STABLE PARALLEL SAFE (005), and instructions to run the index verification script.
- **Index verification:** Added `supabase/verify-rls-indexes.sql` — run after `npx supabase start`; replace `YOUR_TENANT_UUID` with `SELECT id FROM public.tenants WHERE slug = 'riverside-hotel'`; confirms Index Scan on tenant_users and posts (not Seq Scan).
- **Comments:** Migration `008_rls_checklist_comments.sql` adds COMMENT ON TABLE for all five tables (documentation only).
- **Cursor rules:** Updated `.cursor/rules/rls.mdc` to recommend `public.tenant_id()` and link to RLS_VERIFICATION.md and verify-rls-indexes.sql.

---

## T-14: RLS Automated Testing

- [x] **T-14**  pgTAP suite runs locally and in CI; RLS coverage, tenant isolation, role hierarchy, positive access; Supashield allowlist documented.

### Shortlist

- [x] **T-14.01** Create `supabase/tests/database/000-setup-test-hooks.sql`.
- [x] **T-14.02** – **T-14.05** Create `00-rls-coverage.sql`, `01-tenant-isolation.sql`, `02-role-hierarchy.sql`, `03-positive-access.sql`.
- [x] **T-14.06** Run `supabase test db` — all pass.
- [x] **T-14.10** – **T-14.11** Add `SUPASHIELD_ALLOWLIST.md`, `EXPECTED_TABLE_COUNT.txt`.

*Full subtasks and DoD → TODO.md § T-14.*

### Implementation notes (T-14)

- **Setup:** `000-setup-test-hooks.sql` enables pgTAP in schema `extensions` and runs one trivial test so the harness is verified first (alphabetical order).
- **00-rls-coverage.sql:** Asserts expected policy names on all five tables (tenants, tenant_users, posts, audit_log, customer_auth_mappings) via `policies_are()`.
- **01-tenant-isolation.sql:** Inserts two tenants and two users, sets JWT to tenant A then B; asserts each role sees only one tenant_users and one post row.
- **02-role-hierarchy.sql:** anon with empty JWT (`{}`) sees 0 rows on tenant_users and posts; authenticated with tenant_id sees ≥1 tenant_users row.
- **03-positive-access.sql:** Authenticated user with tenant_id can SELECT/INSERT/UPDATE/DELETE own tenant's posts and SELECT own tenant row.
- **Fix:** anon test uses `set_config('request.jwt.claims', '{}', true)` (empty string is invalid JSON).
- **Run:** `npx supabase test db --local` — all 5 files, 18 tests pass. CI can run the same after `supabase start` (or use `--db-url` for a dedicated test DB).
- **Supashield:** `SUPASHIELD_ALLOWLIST.md` documents intentional “no policy” designs (audit_log, tenants write, customer_auth_mappings write). `EXPECTED_TABLE_COUNT.txt` is `5` for regression checks.

---

## T-15: Multi-Tenant Auth

- [ ] **T-15**  Login, signup, callback, protected dashboard in riverside-hotel; session has `app_metadata.tenant_id`; tenant-scoped queries; email aliasing if using `customer_auth_mappings`.

### Shortlist

- [ ] **T-15.01** – **T-15.04** Add `(auth)/login`, `(auth)/signup`, `(auth)/callback`, `/dashboard`; middleware redirect for unauthenticated.
- [ ] **T-15.05** – **T-15.09** Test admin user, tenant-scoped queries, cross-tenant isolation, email aliasing flow.

*Full subtasks and DoD → TODO.md § T-15.*

---

## T-16: Inngest Background Jobs

- [ ] **T-16**  Inngest client and `/api/inngest` in agency-admin; onboarding and email-sequence workflows; checkpointing config; docs.

### Shortlist

- [ ] **T-16.01** – **T-16.05** Add `inngest/client.ts`, `app/api/inngest/route.ts`, `inngest/functions/onboarding.ts`, `email-sequence.ts`; register in `serve()`.
- [ ] **T-16.06** – **T-16.09** Env vars; run Inngest dev server; trigger and verify workflows; test retries.
- [ ] **T-16.10** Create `docs/BACKGROUND_JOBS.md`.

*Full subtasks and DoD → TODO.md § T-16.*

---

## T-17: PostHog Analytics

- [ ] **T-17**  PostHog receives tenant-tagged events from riverside-hotel; GDPR IP capture off; identify after login; self-hosting decision documented.

### Shortlist

- [ ] **T-17.01** – **T-17.04** PostHog project; env in riverside-hotel; confirm `initAnalytics('riverside-hotel')` and events with `tenant`.
- [ ] **T-17.05** – **T-17.07** Disable IP capture; call `identifyUser` after login; create `docs/POSTHOG_DEPLOYMENT.md`.

*Full subtasks and DoD → TODO.md § T-17.*

---

## T-18: AI Tool Configuration (Cursor & Windsurf)

- [ ] **T-18**  All Cursor and Windsurf rules in place; stack-correct suggestions; prompt templates doc.

### Shortlist

- [ ] **T-18.04** Create `.cursor/rules/frontend.mdc` (App Router, `@source`, data fetching).
- [ ] **T-18.05** Create `.cursor/rules/tokens.mdc` (DTCG, Style Dictionary v4).
- [ ] **T-18.06** – **T-18.07** Create `.windsurf/rules/monorepo.md`, `.windsurfrules`.
- [ ] **T-18.08** – **T-18.11** Test Cursor on migration, component, styling, animation.
- [ ] **T-18.12** Create `docs/AI_PROMPTING.md` with prompt templates.

*Full subtasks and DoD → TODO.md § T-18.*

---

## T-19: Client Scaffolding Script

- [ ] **T-19**  `pnpm scaffold` creates a fully wired client app; build and tokens succeed with zero manual edits.

### Shortlist

- [ ] **T-19.01** – **T-19.09** Script creates all files (package.json, tsconfig, next.config, postcss, app skeleton, middleware, providers, client token JSON, tokens dir); prints next steps.
- [ ] **T-19.10** – **T-19.12** Run `pnpm scaffold` for `acme-health`; `pnpm turbo run build --filter=@agency/acme-health` and `pnpm tokens:build` succeed.

*Full subtasks and DoD → TODO.md § T-19.*

---

## T-20: Vercel Deployment

- [ ] **T-20**  riverside-hotel and agency-admin deployed; custom domain; env vars; Turborepo remote cache; cost cliff doc.

### Shortlist

- [ ] **T-20.01** – **T-20.05** Vercel team + projects; build from monorepo root; env vars; test deploy; custom domain.
- [ ] **T-20.06** – **T-20.10** Enable remote cache; add TURBO_* to Vercel and GitHub; Inngest integration; verify cache hits.
- [ ] **T-20.11** Create `docs/DEPLOYMENT.md` (project-per-client, Pro→Enterprise cliff, middleware option).

*Full subtasks and DoD → TODO.md § T-20.*

---

## T-21: CI/CD — GitHub Actions

- [ ] **T-21**  CI: affected builds, types drift check, RLS tests, Supashield; deploy migrations on merge to main; security grep.

### Shortlist

- [ ] **T-21.02** – **T-21.03** Use `--affected` for build/lint/type-check; add types-drift-check step.
- [ ] **T-21.04** – **T-21.05** Add `rls-tests` and `rls-supashield` jobs.
- [ ] **T-21.06** Create `.github/workflows/deploy.yml` (migrations on push to main).
- [ ] **T-21.07** – **T-21.08** Add required secrets; add security-scan grep for service role / `user_metadata`.
- [ ] **T-21.09** – **T-21.11** Verify CI on PR; verify `--affected`; verify deploy on merge.

*Full subtasks and DoD → TODO.md § T-21.*

---

## T-22: Security Hardening

- [ ] **T-22**  Five attack vectors tested and blocked; SECURITY.md; headers; password policy.

### Shortlist

- [ ] **T-22.01** – **T-22.07** Grep for `user_metadata`, cache keys, service role exposure, API auth gaps; document HIPAA isolation.
- [ ] **T-22.08** – **T-22.10** Add security headers in riverside-hotel and agency-admin next.config; verify Supabase password policy.
- [ ] **T-22.11** – **T-22.12** Create `SECURITY.md`; run final checklist and record baseline.

*Full subtasks and DoD → TODO.md § T-22.*

---

## T-23: Second Client App & Onboarding Validation

- [ ] **T-23**  acme-health onboarded via full checklist; RLS and affected build validated; ONBOARDING_CHECKLIST.md.

### Shortlist

- [ ] **T-23.01** – **T-23.10** Scaffold acme-health; tokens; tenant row; admin user; `supabase test db`; `build --affected`; Vercel deploy; cross-tenant test.
- [ ] **T-23.11** – **T-23.12** Record onboarding time; create/update `docs/ONBOARDING_CHECKLIST.md`.

*Full subtasks and DoD → TODO.md § T-23.*

---

## T-24: Prettier & Code Formatting

- [ ] **T-24**  Prettier configured; ESLint compatible; format:check in CI; format-on-save documented.

### Shortlist

- [ ] **T-24.01** – **T-24.06** Add `prettier.config.mjs`, catalog entry, root devDeps, `format`/`format:check` scripts, `.prettierignore`, eslint-config-prettier.
- [ ] **T-24.07** – **T-24.09** Add format:check to CI; run `pnpm format` and commit; document in AI_PROMPTING.

*Full subtasks and DoD → TODO.md § T-24.*

---

## T-25: CONTRIBUTING.md & Local Dev Runbook

- [ ] **T-25**  CONTRIBUTING.md and ARCHITECTURE.md; developer can get full stack running from docs alone.

### Shortlist

- [ ] **T-25.01** – **T-25.03** Create `CONTRIBUTING.md` (prereqs, pnpm, stack startup, migrations, client onboarding, scaffold, db:generate-types, format); document ports.
- [ ] **T-25.04** – **T-25.05** Create `docs/ARCHITECTURE.md`; update README links.

*Full subtasks and DoD → TODO.md § T-25.*

---

*Reference: TODO.md for full subtask lists, Definition of Done, Out of Scope, and implementation notes. Task IDs are stable across both documents.*
