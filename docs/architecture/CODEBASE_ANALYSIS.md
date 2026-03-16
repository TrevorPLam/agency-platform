# Comprehensive Codebase Analysis — Agency Platform Monorepo

**Purpose:** Identify what is not fully implemented, partially built, or missing so you can prioritize work when building the marketing firm monorepo via agentic coding.  
**Audience:** Repository owner with no formal software background; all findings are actionable.  
**Last updated:** After deep analysis (every app, package, migration, test, and critical config touched).

---

## Executive summary

The monorepo is **structurally complete**: apps (firm, agency-admin, two prospective clients), shared packages (ui, database, analytics, email, booking, design-tokens), Supabase migrations, scaffold script, and CI (build, lint, type-check, RLS tests) are in place. The main gaps are:

1. **CI and compliance** — Table count and RLS tests are out of date for newer tables (bookings, contact_submissions); **two** test files need updates.
2. **Documentation** — Most GUIDE.md references have been cleaned up; TODO.md references correctly point to root file.
3. **Riley Day Care** — Treated as “template with placeholder content”; spec checklist is not executed.
4. **The Barber Cave** — Middleware protects /dashboard, /login, /signup but those routes do not exist; tenant resolution not called.
5. **Agency-admin** — No authentication; dashboard is open to anyone. Analytics package is a dependency but **initAnalytics is never called** (no Providers wrapper).
6. **Firm** — No middleware (intentional for single-tenant “agency”); does not use design-tokens client CSS (hardcoded dark overrides in globals.css).
7. **Scaffold** — Copies auth-aware middleware from riley-day-care but does not copy the `(auth)` route folder, so new clients get redirects to /login with no login page.
8. **Env example** — `.env.local.example` still shows `NEXT_PUBLIC_TENANT_SLUG=riverside-hotel` (stale; should be riley-day-care or similar).

---

## 1. Critical: CI and database tests

### 1.1 Expected table count is wrong (two places)

- **Files:**
  - `supabase/tests/EXPECTED_TABLE_COUNT.txt` — contains `5`
  - `supabase/tests/database/00-rls-coverage.sql` — asserts `(select count(*) ... from pg_tables where schemaname = 'public')` equals `5` (line 20–23) and has `plan(7)` for seven assertions
- **Actual public tables:** 7  
  `tenants`, `tenant_users`, `posts`, `audit_log`, `customer_auth_mappings`, `bookings`, `contact_submissions`
- **Impact:** RLS test run will **fail**: table count assertion in `00-rls-coverage.sql` expects 5, and the file only lists policies for the first five tables. No assertions for `bookings` or `contact_submissions` policies.
- **Action:**  
  1. Update `EXPECTED_TABLE_COUNT.txt` to `7`.  
  2. In `00-rls-coverage.sql`: change the expected table count from `5` to `7`, increase `plan(...)` to account for two more tables, and add `policies_are` assertions for `bookings` (four policies: select, insert, update, delete) and `contact_submissions` (three: select, update, delete — no INSERT for anon/authenticated by design).

### 1.2 RLS pgTAP isolation tests missing for new tables

- **CONTRIBUTING.md** states: every new migration that adds a **public table** must add at least four pgTAP assertions in `supabase/tests/database/01-tenant-isolation.sql` (SELECT, INSERT, UPDATE, DELETE isolation).
- **Currently tested:** Only `tenants`, `tenant_users`, `posts` (plan is 12 tests).
- **Not covered in 01-tenant-isolation:**
  - **contact_submissions** — RLS: tenants SELECT/UPDATE/DELETE own rows only; INSERT is service-role only. Add tests: tenant A cannot SELECT/UPDATE/DELETE tenant B’s rows; INSERT as authenticated with tenant_id fails (no INSERT policy for role).
  - **bookings** — Full tenant-scoped; add four tests: tenant A cannot SELECT/UPDATE/DELETE/INSERT as tenant B.
- **Action:** Add pgTAP cases for `contact_submissions` and `bookings` in `01-tenant-isolation.sql` and bump the `plan(N)` count accordingly.

---

## 2. Documentation: broken references to deleted files

These files were referenced but are now located at the repo root: `TODO.md`. The following still reference them:

| Document | Reference |
|----------|-----------|
| `SECURITY.md` | "See GUIDE.md §16 for full context" |
| `docs/operations/BACKGROUND_JOBS.md` | "See also TODO.md Phase 7" |
| `docs/governance/PLAN_AGENCY_DIRECTION.md` | "Update **TODO.md** …" |
| `docs/guides/AI_DEVELOPMENT_GUIDE.md` | "check off … in TODO.md", "mark T-18 complete (line …) in TODO.md" |
| `docs/guides/AI_DEVELOPMENT_GUIDE.md` | "mark T-18.08–T-18.11 complete in TODO.md", "mark T-18 complete" |
| `docs/guides/CLIENT_ONBOARDING.md` | "Document … in … TODO.md T-23 implementation notes" |
| `PROMPT.md` | "Read all of @TODO.md", "Update @TODO.md with status" |

**Action:** Update `docs/BACKGROUND_JOBS.md` to reference root TODO.md. Other references to TODO.md are already correct.

---

## 3. Apps: what’s built vs what’s not (deep)

### 3.1 Firm (`apps/firm`)

- **Implemented:** Home, Contact (form + `contact_submissions` + email), About, Services, Blog (list + `[slug]`), Book (booking widget + server action → `bookings`). Layout uses `Providers` (initAnalytics('agency')), `SiteHeader`, `SiteFooter`. No middleware.
- **Design tokens:** Firm does **not** import any client token CSS. `globals.css` uses `@source` for Tailwind scan of `@agency/ui`, plus hardcoded `:root .dark { ... }` for dark mode. So firm theme is not driven by design-tokens build output.
- **Gaps:** None critical for Phase 1. Optional: add middleware only if you need tenant resolution or auth at edge for firm.

### 3.2 Agency-admin (`apps/agency-admin`)

- **Implemented:** Single dashboard page (lists recent posts from Supabase); Inngest route with `onboardingWorkflow` and `emailSequence`; middleware that calls `resolveTenantFromRequest` and sets `x-tenant-id`, `x-tenant-slug`, `x-tenant-source`. Layout has no `Providers` wrapper — only `ThemeToggle` in header.
- **Analytics:** `@agency/analytics` is in dependencies and next.config transpilePackages, but **initAnalytics is never called** (no Providers, no client-side analytics). Server-side exports (e.g. `captureServerEvent`) are not used anywhere in the repo.
- **Gap — No authentication:** Dashboard is not behind login; anyone with the URL can see “Recent posts.” If internal-only, acceptable; otherwise add auth (e.g. Supabase session) before rendering dashboard.
- **Gap — Analytics unused:** Either add a Providers that calls `initAnalytics('agency-admin')` if you want client tracking, or remove the dependency to avoid confusion.

### 3.3 Prospective clients: Riley Day Care (`apps/prospective-clients/riley-day-care`)

- **Implemented:** Full template: home, about, programs, contact (form + `contact_submissions` + email), blog (list + `[slug]`), auth: login, signup, callback, dashboard. Middleware: `resolveTenantFromRequest`, auth redirects (protected /dashboard → /login; auth routes → /dashboard when logged in). `globals.css` imports `../../tokens/riley-day-care.css` (design-tokens client output). Providers initAnalytics('riley-day-care'); auth-analytics identifies/resets on login/logout. Login uses `customer_auth_mappings` + server sign-in; signup uses `createUserForTenant`.
- **Gap — Placeholder content:** `docs/guides/riley-day-care-spec.md` states the app is "Day Care Template scaffold with Riley Day Care branding and **placeholder content**" and the implementation checklist is **entirely unchecked** (content, pages, forms, blog, tokens, final pass).
- **Action:** When spec content is added, work through the checklist so Riley Day Care matches the spec.

### 3.4 Prospective clients: The Barber Cave (`apps/prospective-clients/the-barber-cave`)

- **Implemented:** Home, Contact (form + `contact_submissions` + email), Services; layout with Providers (initAnalytics('the-barber-cave')), SiteHeader, SiteFooter. `globals.css` imports `../../tokens/the-barber-cave.css`.
- **Middleware mismatch:** The Barber Cave **has** middleware that:
  - Protects `/dashboard` (redirects to `/login` if not logged in)
  - Redirects `/login`, `/signup` to `/dashboard` when user is logged in
  - But the app **has no** `(auth)` routes: no `login`, `signup`, `callback`, or `dashboard` pages. So visiting `/dashboard` redirects to `/login`, which 404s. Middleware also **does not** call `resolveTenantFromRequest` (unlike Riley Day Care), so no tenant headers are set.
- **Conclusion:** Middleware was copied from a template that has auth; this client was not given auth routes. Either: (1) remove the auth-related branches from the-barber-cave middleware (and optionally add tenant resolution if needed), or (2) add the `(auth)` route group and pages if The Barber Cave should have client login/dashboard.
- **Scaffold note:** The scaffold script copies `middleware.ts` from riley-day-care (which includes tenant resolution + auth redirects) but does **not** copy the `(auth)` folder. So any newly scaffolded client gets redirects to /login/dashboard with no corresponding pages unless you add them manually.

### 3.5 Production clients (`apps/clients/`)

- **By design:** Folder does not exist until first production go-live. Scaffold creates `apps/clients/[slug]` when you choose “real” client. No implementation gap.

---

## 4. Packages: implementation status (deep)

| Package | Status | Notes |
|---------|--------|-------|
| **@agency/database** | Complete | Server/browser/admin clients (admin throws in browser, checks env). Auth: createUserForTenant, assignUserToTenant, customer_auth_mappings, email aliasing. Middleware: resolveTenantFromRequest (dev = NEXT_PUBLIC_TENANT_SLUG, prod = hostname). ids.ts: TenantId, UserId. One unit test: auth.email.test.ts (generateTenantSpecificEmail, extractOriginalEmail). |
| **@agency/ui** | Complete for current use | Atoms: Button, Input, Label, Badge. Molecules: Card, Dialog, Sheet, DropdownMenu, ThemeToggle. Organisms: placeholder only (no shared organisms). cn() from lib/utils (clsx + tailwind-merge). components.json points to globals.css and new-york style; no hooks folder present. |
| **@agency/analytics** | Complete, partially used | Client: initAnalytics(tenantSlug), captureEvent, identifyUser, resetUser, getPostHogClient. Server: captureServerEvent, identifyServerUser, aliasServerUser, flushServerEvents, getPostHogServerClient (tenant in properties). Used: firm, riley-day-care, the-barber-cave (via Providers). **Not used:** agency-admin (no Providers / initAnalytics). Server-side analytics not called anywhere. |
| **@agency/email** | Complete | sendEmail (Resend), sendContactNotification (CONTACT_TO_EMAIL). Used by firm + both client contact actions and by Inngest (onboarding, email-sequence). |
| **@agency/booking** | Complete | BookingWidget (useActionState, form with name/email/message), BookingConfig (tenantId, optional serviceSlug, etc.), bookingConfigSchema (Zod). Used on firm /book with submitBooking server action. |
| **@agency/design-tokens** | Complete | Style Dictionary v4; sd.config.ts builds primitives/semantic/component to dist/. scripts/build-clients.ts builds per-client to apps/prospective-clients/[slug]/tokens or apps/clients/[slug]/tokens (checks existence of prospective path). Client token filter: brand, font, color.semantic. Build order in package.json: build-clients then sd.config. Primitive/semantic/component token files present; motion tokens in primitive and semantic. |

---

## 5. Migrations and data usage

- **Migrations:** 001 tenants, 002 tenant_users, 003 posts, 004 audit_log, 005 tenant_id(), 006 customer_auth_mappings, 007 refactor RLS to use tenant_id(), 008–009 RLS checklist, 010 bookings, 011 contact_submissions, 012 bookings extend (name, email, requested_at, service_slug, message).
- **Seed:** Inserts agency, riley-day-care, the-barber-cave into `tenants`. No seed for posts, contact_submissions, or bookings.
- **Usage:** Firm contact → contact_submissions (tenant_id null, source 'firm'); client contacts → contact_submissions (tenant_id set, source slug). Firm book → bookings via getAdminClient(). All server actions use getAdminClient() for inserts. Database types (packages/database/src/types.ts) include all seven tables; generated from Supabase.

---

## 6. Testing

- **Unit:** Only `packages/database` has Vitest (auth.email.test.ts). No tests in email, booking, analytics, ui.
- **E2E / smoke:** None. ARCHITECTURE suggests Playwright smoke tests per app type when scaling.
- **RLS:** pgTAP in supabase/tests/database/: 00-rls-coverage (table count + policy names), 01-tenant-isolation (cross-tenant isolation), 02-role-hierarchy (anon vs authenticated), 03-positive-access (authenticated CRUD). **00-rls-coverage is out of date** (expects 5 tables; only asserts policies for 5 tables). **01-tenant-isolation** does not include bookings or contact_submissions.

---

## 7. CI/CD and tooling

- **CI (`.github/workflows/ci.yml`):** Checkout, pnpm install, format check, security scans (service role key, user_metadata), Supabase start, types drift check, build/lint/type-check/test affected, RLS pgTAP (`supabase test db`), Supashield RLS audit. **RLS tests will fail** until 00-rls-coverage and (if run) 01-tenant-isolation are updated for 7 tables.
- **Deploy (`.github/workflows/deploy.yml`):** On push to main when `supabase/migrations/**` change; runs `supabase db push`. App deployments are via Vercel (or similar), not this workflow.
- **Changesets:** `.changeset/config.json` present; root has `changeset`, `version` scripts. No CI release/publish step.
- **Scaffold (`scripts/scaffold-client.ts`):** Creates app under prospective-clients or clients from template riley-day-care. Copies package.json, tsconfig, next.config, postcss, eslint, globals.css (with slug.css import), layout, page, middleware, providers, auth-analytics; creates token stub; does **not** copy `(auth)` routes (login, signup, callback, dashboard). So new clients get auth middleware but no auth pages. Run `pnpm install`, `pnpm tokens:build`, and type-check after scaffold.
- **create-test-user.ts:** Creates a test user for a tenant (default riley-day-care) via createUserForTenant; requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.

---

## 8. Config and environment

- **turbo.json:** build depends on ^build and tokens:build; tokens:build outputs to dist/ and apps/prospective-clients/*/tokens, apps/clients/*/tokens. No test script for apps (firm, agency-admin have no test in package.json).
- **Root tsconfig.json:** References all packages and all four apps (firm, agency-admin, riley-day-care, the-barber-cave).
- **.env.local.example:** Contains `NEXT_PUBLIC_TENANT_SLUG=riley-day-care`. Correctly updated from riverside-hotel to riley-day-care per PLAN_AGENCY_DIRECTION.
- **.cursor/rules:** base.mdc, frontend.mdc, database.mdc, rls.mdc, tokens.mdc present; no references to deleted GUIDE/TODO.

---

## 9. Inngest and background jobs

- **Route:** `apps/agency-admin/src/app/api/inngest/route.ts` serves GET/POST/PUT with `onboardingWorkflow` and `emailSequence`, maxDuration 300.
- **onboardingWorkflow:** Triggered by `agency/client.created`. Steps: provision-database (upsert tenant), send-welcome-email, waitForEvent `agency/client.profile-completed` (7d), else send-followup email.
- **emailSequence:** Same trigger `agency/client.created`. Steps: sleep 1d → send day-1 email, sleep 2d → send day-3 email. So one `agency/client.created` event runs **both** workflows (welcome + sequence); complementary, not duplicate.

---

## 10. Design system and governance

- **Governance:** docs/governance/GOVERNANCE.md and docs/development/VERSIONING.md exist. Research §11a and §15 in RESEARCH_MARKETING_MONOREPO_DESIGN_2026.md; many checklist items are long-term (Figma, i18n, adoption metrics).
- **Firm/agency-admin theming:** Use hardcoded `:root .dark` in globals.css; only prospective clients consume design-tokens client CSS from `tokens/[slug].css`.

---

## 11. Prioritized action list

**Do first (unblocks CI and correctness):**

1. Update **both** `supabase/tests/EXPECTED_TABLE_COUNT.txt` and `supabase/tests/database/00-rls-coverage.sql` to expect **7** tables and add policy assertions for `bookings` and `contact_submissions`.
2. Add pgTAP isolation tests for `contact_submissions` and `bookings` in `01-tenant-isolation.sql` (and update `plan(N)`).
3. Update CODEBASE_ANALYSIS.md to reflect that documentation references are now current.
4. Update `.env.local.example`: set `NEXT_PUBLIC_TENANT_SLUG=riley-day-care` (or document which app uses which slug).

**Do when you want consistent client behavior:**

5. **The Barber Cave:** Either strip auth redirects from middleware (and optionally add `resolveTenantFromRequest` if needed) or add the `(auth)` route group (login, signup, callback, dashboard) so redirects resolve to real pages.
6. **Scaffold:** Decide whether new clients should have auth. If yes, copy the `(auth)` folder from riley-day-care into the scaffold template; if no, use a middleware template that does not protect /dashboard or redirect to /login.

**Do when you want a “first real client” (Riley Day Care):**

7. Add full Riley Day Care spec content to `docs/guides/riley-day-care-spec.md` and complete the implementation checklist (content, pages, forms, blog, tokens, navigation).

**Do when you care about access control and analytics:**

8. Agency-admin: add auth if dashboard must be restricted; optionally add Providers + initAnalytics('agency-admin') if you want client-side analytics, or remove @agency/analytics dependency if unused.
9. Optionally add unit tests for high-value paths (email, booking) and later Playwright smoke tests per app type.

**Optional / later:**

10. Changesets: add CI step or doc for version/publish if you release packages.
11. Add shared organisms in @agency/ui only when the same section appears in multiple apps.

---

## 12. What is already in good shape

- Monorepo layout (apps vs packages), Turborepo, pnpm catalog, port assignments (3000 firm, 3001 agency-admin, 3002/3003 clients).
- Tenant isolation: RLS, tenant_id from app_metadata, service role server-only, no NEXT_PUBLIC_ service keys. database package auth and middleware are well-documented and type-safe.
- Shared packages are used correctly where intended; design-tokens build order (clients then platforms) and client filter are correct.
- Riley Day Care is a complete template (auth, tenant resolution, tokens, contact, blog). Scaffold and create-test-user scripts work; CONTRIBUTING and onboarding checklist exist.
- CI runs format, security scans, types drift, affected build/lint/type-check, and RLS tests (once test files are updated).
- Prefers-reduced-motion and dark mode overrides are present in app globals; WCAG 2.3.3 and token usage are considered.

This document reflects a pass over every app (all routes, layouts, middleware, providers, globals.css), every package (source files, configs, token files), all Supabase migrations and tests, scaffold and create-test-user scripts, turbo/tsconfig, env example, and Inngest functions. Use the action list above to fix CI and consistency first, then client and auth behavior, then content and optional quality improvements.
