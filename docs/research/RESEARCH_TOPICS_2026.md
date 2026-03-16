# Repository Topics — Up-to-Date Research (2025–2026)

Structured research on every major topic in this repository. For each topic: **1) Basics and fundamentals**, **2) Best practices and highest standards**, **3) Enterprise solutions**, **4) Novel / unique / innovative**. Written for spinning up sites via Cursor/Windsurf with natural language; use these sections when prompting or when validating agent output.

---

## 1. Monorepo (Turborepo, pnpm)

### 1.1 Basics and fundamentals

- **What it is:** A single repository containing multiple apps and shared packages, with one package manager (pnpm) and one build orchestrator (Turborepo).
- **Why use it:** Share code (UI, database clients, types) across apps; atomic commits; consistent tooling; single `pnpm install` and cached builds.
- **Core concepts:** Workspaces (pnpm-workspace.yaml), task pipeline (turbo.json with `dependsOn`, `outputs`), internal refs (`workspace:*`), catalog for dependency versions.
- **When it pays off:** 2+ apps sharing code, or 5+ apps total; 3+ published packages. Avoid for a single app with no shared code.

### 1.2 Best practices and highest standards

- **Structure:** `apps/` for deployable applications (Next.js, APIs); `packages/` for shared libs (ui, database, design-tokens). No app-to-app or package→app imports.
- **Tasks:** Use `^build` so dependencies build first; set `cache: false` and `persistent: true` for dev; define explicit `outputs` for cache correctness (e.g. `dist/**`, `*.css` for token builds). Ensure `tokens:build` (or design-tokens build) is in pipeline and consumed by apps that import client CSS so turbo doesn’t skip token generation.
- **Remote caching:** Enable Turborepo Remote Cache (or Nx Cloud) so CI hits cache in seconds; 70–85% faster builds cited.
- **Install from root only:** Run `pnpm install` at repo root; use catalog for versions and `workspace:*` for internal packages.

### 1.3 Enterprise solutions

- **At scale:** Nx preferred when package count grows (~30+), need module-boundary enforcement, code generation, or distributed CI. Nx can run alongside Turborepo; migration is low-friction.
- **Team size (2026):** 1–3 devs → workspaces + Makefile; 3–15 → Turborepo; 15–50 → Turborepo + Nx Cloud or full Nx; 50+ → Nx for governance.
- **Compliance:** Isolate secrets per app; use CODEOWNERS and branch protection; run security scans (e.g. service-role key, user_metadata) in CI.

### 1.4 Novel / unique / innovative

- **AI and agents (2026):** Monorepos are “infrastructure for autonomous AI agents”—full codebase visibility, cross-project deps, coordinated changes. Harder with polyrepo. Nx’s “configure-ai-agents” and agent skills load structured knowledge incrementally.
- **Meta-repository pattern:** Dedicated repo as an agent’s knowledge base (conventions, CI, release, cross-repo deps) to reduce “session amnesia” when building with Cursor/Windsurf.
- **Natural language:** When prompting “add a new client site,” reference: scaffold script, apps/prospective-clients vs apps/clients, one app = one Vercel project, tokens per client.

---

## 2. Design tokens (Style Dictionary, DTCG, Tailwind v4)

### 2.1 Basics and fundamentals

- **What they are:** Named, typed design decisions (colors, spacing, duration) stored as data (e.g. JSON) and compiled to platform outputs (CSS variables, iOS/Android).
- **W3C DTCG (2025.10):** First stable spec; tokens have `$type` (color, dimension, duration, fontFamily, etc.) and `$value`; groups have no `$value`; hierarchical names with periods.
- **Three layers:** (1) Primitives — raw values; (2) Semantic — intent (e.g. `--color-primary`); (3) Component — per-component (e.g. `--button-radius`). Rule: component → semantic → base; components never reference primitives directly.
- **Tailwind v4:** Config is CSS (`@theme`); no tailwind.config.js. Tokens = CSS variables; use `var(--token-name)` only, not `theme()` in CSS.

### 2.2 Best practices and highest standards

- **Style Dictionary v4:** ESM-only, async APIs (`await sd.hasInitialized`, `buildPlatform` returns Promise). Use DTCG format; output primitives in `:root`, semantic in `@theme inline` for Tailwind.
- **Motion:** Tokenize duration, easing, stagger. Respect `prefers-reduced-motion: reduce` (WCAG 2.3.3 AAA): override to `0ms` or `animation: none` via media query or token resolution.
- **Per-client tokens:** One JSON per client (e.g. `tokens/clients/[slug].json`); build to `apps/.../tokens/[slug].css`; apps import that CSS. Prevents style drift; one codebase, many brands.
- **No arbitrary values in components:** Prefer tokens; use ESLint or review to limit `bg-[#hex]` and magic numbers.

### 2.3 Enterprise solutions

- **Multi-brand at scale:** Monolithic component library + token-driven theming; version design system with semver + Changesets; document breaking vs non-breaking; support window (e.g. current + previous major).
- **Figma–code sync:** Define source of truth (Figma or code); export variables → JSON → Style Dictionary → CSS; automate via GitHub Actions or Tokens Studio; review token PRs.
- **Governance:** Roles (lead, maintainers, contributors); RFC or PR workflow; patch/minor/major cadence; codemods for breaking migrations (e.g. MUI, Carbon).

### 2.4 Novel / unique / innovative

- **OKLCH and Display P3:** DTCG supports OKLCH and wide-gamut color; Tailwind v4 recommends OKLCH for perceptually even steps. Future-proofs for better screens.
- **Runtime theming without rebuild:** With CSS variables, swap theme via `.dark`, `[data-theme="brand"]`, or `[data-brand="client-a"]`; no full rebuild.
- **Agent-friendly:** Keep token files in one place; consistent naming (`$type`, `$value`); build script that writes to app folders so “add a new client” = new JSON + run tokens:build + add tenant.

### 2.5 Style Dictionary v3 → v4 migration

- **ESM only:** v4 is ESM; no CommonJS. Ensure package.json has `"type": "module"` and build/scripts use ESM imports.
- **Async APIs:** `extend()` and `buildPlatform()` return Promises; use `await`. Check `await sd.hasInitialized` before building if using programmatic API. Codemod available: `npx codemod styledictionary/4/migration-recipe` to update config and build scripts.
- **No breaking token format:** DTCG format is compatible; focus migration on build config and async usage. Run codemod then run build and fix any remaining sync calls.
- **Agent-friendly:** When adding or changing Style Dictionary usage, assume v4 (async, ESM); reference migration docs if upgrading from v3.

---

## 3. Multi-tenant architecture (Supabase, RLS)

### 3.1 Basics and fundamentals

- **Tenant:** A customer or brand; data is isolated per tenant. One user can belong to multiple tenants (e.g. agency vs client sites).
- **RLS (Row Level Security):** PostgreSQL feature; policies restrict which rows each role can SELECT/INSERT/UPDATE/DELETE. Without RLS, anon key can access all data.
- **Tenant identity:** Must come from server-controlled context (e.g. JWT `app_metadata.tenant_id`), never from user-editable `user_metadata`. Use a helper like `public.tenant_id()` (STABLE) in policies so the value is computed once per query.
- **Service role:** Bypasses RLS; use only server-side (API routes, server actions, Inngest). Never in client or NEXT_PUBLIC_ vars.

### 3.2 Best practices and highest standards

- **Schema:** Every tenant-scoped table has `tenant_id` (uuid, NOT NULL, FK to tenants), index on `tenant_id`, composite index for time-ordered queries `(tenant_id, created_at DESC)`.
- **Policies:** Enable RLS on every public table; create separate policies per operation (SELECT, INSERT, UPDATE, DELETE). Use `tenant_id = public.tenant_id()` in USING and WITH CHECK.
- **Performance:** Index RLS columns; wrap JWT reads in a SELECT so Postgres can cache (e.g. `(select auth.uid())`). Use EXPLAIN ANALYZE to avoid sequential scans.
- **Testing:** pgTAP (or similar) tests: cross-tenant SELECT/UPDATE/DELETE/INSERT must fail or return empty; positive tests that authenticated user with tenant_id can CRUD own rows.

### 3.3 Enterprise solutions

- **Membership table:** Central “brain” for access—user–tenant–role; policies check membership. Optional: separate admin vs member roles; audit log for sensitive ops.
- **Tenant resolution:** In middleware or layout: resolve tenant from hostname, subdomain, or env (e.g. NEXT_PUBLIC_TENANT_SLUG in dev). Set headers (x-tenant-id, x-tenant-slug) for downstream use.
- **Scaling:** Phase 1 single DB + RLS; Phase 2 add Redis (or similar) for tenant config cache (`tenant:{slug}:config`); Phase 3 schema-per-tenant or dedicated DB per tenant for HIPAA/heavy isolation—requires staffing and migration strategy.
- **Security definer functions:** For complex cross-table permission checks, use SECURITY DEFINER to avoid cascading RLS evaluations; document and audit.

### 3.4 Novel / unique / innovative

- **Email aliasing for auth:** Same email across tenants (e.g. `user+tenant-{id}@domain.com`) so Supabase’s global email uniqueness is satisfied while users log in with “real” email; map via `customer_auth_mappings`.
- **White-label agency platform:** One codebase; per-client token files and env; RLS + per-app deployment (one Vercel project per client) for isolation and rollback. “New client” = scaffold app + token file + tenant row + deploy.
- **Agent-friendly:** Document in rules/code: “tenant_id only from app_metadata”; “every new table: RLS + four policies + pgTAP tests.” Reduces mistakes when generating migrations or server actions.

### 3.5 Supabase (clients, types, migrations)

- **Clients:** Anon client in browser (RLS applies); service-role server-only (Server Actions, API routes, Inngest). Create with `createBrowserClient` / `createServerClient`; never use service role in client or NEXT_PUBLIC_.
- **Types:** Generate from DB with `supabase gen types typescript --local` (or `--project-id`) → `packages/database/src/types.ts` (or app-level). Re-run after migrations; CI can fail if types are stale. Single source of truth for table/column types.
- **Migrations:** SQL files in `supabase/migrations/`; ordered by timestamp/prefix. Apply with `supabase db push` (remote) or `supabase migration up` (local). Every new tenant-scoped table: migration + RLS policies + pgTAP tests + update EXPECTED_TABLE_COUNT and RLS coverage list.
- **Local dev:** Use Supavisor port **6543** for connections (not 5432). Document in rules and .env.example so agents and devs use the correct port.
- **Agent-friendly:** “After adding a table or column, run type generation and commit updated types” and “use port 6543 for Supabase” in CONTRIBUTING/rules.

---

## 4. Next.js App Router & React Server Components

### 4.1 Basics and fundamentals

- **App Router:** File-based routing under `app/`; layouts wrap segments; `page.tsx` = route UI; `layout.tsx` = shared shell; `loading.tsx` / `error.tsx` for boundaries.
- **Server Components (default):** Render on server only; no client JS for them; can async and fetch data directly. No useState, useEffect, or browser APIs.
- **Client Components:** Opt-in with `'use client'`; needed for event handlers, hooks, browser APIs. Place as deep as possible (leaf nodes) to minimize client bundle.
- **Server Actions:** Async functions with `'use server'`; call from forms or client components; run on server; no separate API route needed. Validate with Zod; return typed payloads.

### 4.2 Best practices and highest standards

- **Default to Server:** Use `'use client'` only where necessary (forms, theme toggle, analytics init). Can cut client JS by up to ~70%.
- **Data fetching:** Fetch in Server Components or Server Actions; pass data as props to Client Components. Never fetch in useEffect for initial data.
- **Caching:** Use `revalidate`, `revalidateTag`, or `cache: 'force-cache'` intentionally; `no-store` only where freshness is critical (e.g. dashboard).
- **Streaming:** Wrap slow components in `<Suspense>` to stream static shell first; improves TTFB and LCP.
- **Turbopack:** Next.js 16 uses Turbopack by default; faster HMR and production builds. Node 20.9+ required.
- **Middleware:** Use for auth redirects, tenant resolution, A/B assignment. Keep it fast; avoid heavy logic.

### 4.3 Enterprise solutions

- **Rendering flexibility:** Per-route or per-component strategy—static, dynamic, ISR, PPR (Partial Prerendering), or `use cache` (Next 16). Marketing pages static/ISR; dashboards dynamic. Resolve tenant in middleware before render.
- **Metadata API:** Export `metadata` (or generateMetadata) per page for title, description, OpenGraph; critical for SEO and sharing.
- **Images:** Use `next/image` with `priority` for LCP image; `sizes` and modern formats (WebP/AVIF); preconnect critical domains.
- **Env:** Only `NEXT_PUBLIC_*` for client; keep secrets in server env. Document which app needs which vars (e.g. NEXT_PUBLIC_TENANT_SLUG).

### 4.4 Novel / unique / innovative

- **Partial Prerendering (PPR):** Static shell + streamed dynamic slots in one response; good for “fast hero + fresh CTA or promos.”
- **Cache Components (`use cache`):** Next 16 component- or function-level caching; mix static, cached, and dynamic in one page without route-level revalidate only.
- **Agent-friendly:** “Use Server Components by default; add 'use client' only for interactivity” is a clear rule. Explicit file layout (app/, components/, lib/) and “fetch in server, pass as props” reduce wrong patterns.

### 4.5 Forms and Server Actions (React 19, Zod)

- **Server Actions:** Async functions with `'use server'`; call from forms or client; run on server. Validate with **Zod** (e.g. `schema.safeParse(formData)`); return `{ success: boolean, message?: string, errors?: Record<string, string[]> }` or use `useActionState` payload.
- **useActionState (React 19):** Replaces useFormState; `const [state, formAction] = useActionState(serverAction, initialState)`. State holds previous result (errors, message); formAction is the action to pass to `<form action={formAction}>`. Enables progressive enhancement and clear error display without client-only state.
- **Pattern:** Server Action receives FormData; parse with Zod; on failure return structured errors; on success redirect or return success. Client can show `state.errors` and `state.message` next to fields and banner. Never trust client-only validation for security.
- **Agent-friendly:** “Forms: Server Action + Zod + useActionState; return typed FormState with errors/message” in rules so generated forms are consistent and secure.

---

## 5. Component library (Atomic Design, Radix, shadcn-style)

### 5.1 Basics and fundamentals

- **Atomic Design:** Atoms (primitives: Button, Input, Label) → Molecules (Card, Dialog, composed groups) → Organisms (sections with loading/empty/error) → Templates/Pages (in apps, not in package).
- **Radix UI:** Unstyled, accessible primitives (focus, keyboard, ARIA). Headless; you supply styles.
- **shadcn/ui:** Copy-paste components built on Radix (or Base UI); CVA for variants; compound components (e.g. Dialog.Root, Dialog.Trigger, Dialog.Content). You own the code; no npm version lock-in.
- **Composition:** Compound components share context; `asChild` for polymorphism; avoid one giant component with every prop.

### 5.2 Best practices and highest standards

- **Tokens only:** Components use design tokens (semantic colors, spacing); no hardcoded hex or arbitrary values. Enables theming and safe refactors.
- **Accessibility:** Radix handles focus, keyboard, roles; you add visible focus ring (tokenized), contrast, and touch targets (e.g. 44×44px). Document a11y for each component.
- **Server-first:** Build components that work as Server Components; add `'use client'` only at the boundary that needs interactivity (e.g. Dialog trigger, form).
- **Exports:** Named exports; optional subpath exports (`@org/ui/button`) for tree-shaking. React/React-DOM as peer deps; `sideEffects` for CSS.

### 5.3 Enterprise solutions

- **Definition of done (Carbon-style):** Tokenized colors/type/spacing; all states (hover, focus, disabled, error); a11y (contrast, focus); design + code + docs + kit before “Stable.”
- **Versioning:** Semver; Changesets for changelogs and version bumps. Breaking = prop renames/removals, token value changes that cause layout shift. Deprecation window and codemods for migrations.
- **Storybook:** Per-component docs (usage, props, a11y); autodocs and doc blocks; RSC support in Storybook 8 for server components. Visual regression and a11y addons.

### 5.4 Novel / unique / innovative

- **Unified Radix package (shadcn 2026):** Single `radix-ui` package instead of many `@radix-ui/react-*`; simpler deps. Optional Base UI as alternative primitive with same API.
- **shadcn/cli v4:** Presets, AI agent “skills,” dry-run/diff flags, multi-framework templates. Aligns with Cursor/Windsurf workflows (add component via CLI or natural language).
- **Agent-friendly:** “Use cn() for class merging; tokens only; Server by default” in rules. Component folder structure (atoms/, molecules/, organisms/) gives agents a clear place to add or edit.

---

## 6. Headless CMS & content strategy

### 6.1 Basics and fundamentals

- **Headless CMS:** Content stored and edited in a backend; delivered via API (REST or GraphQL). Frontend (Next.js) fetches and renders; no tight coupling to a single presentation layer.
- **When to use:** Content changes often; non-developers need to edit copy, blog, landing sections; multi-channel (web, email, app) from one source. Not required for Phase 1 static pages.
- **Common players:** Contentful, Sanity, Storyblok, Agility, Payload. Differ by API (GraphQL vs REST vs GROQ), visual editing, pricing, self-hosted vs SaaS.

### 6.2 Best practices and highest standards

- **Structured content:** Model content as types (page, post, block); avoid free-form HTML blobs where possible. Enables reuse and safe rendering.
- **Rendering strategy:** Keep most pages static or ISR; fetch at build or revalidate on interval. Use dynamic only for preview/draft or personalized blocks. Reduces TTFB and improves LCP.
- **Preview/draft:** Use draft mode or separate preview route so editors see changes before publish; production stays static/ISR where possible.
- **Multi-tenant:** If one CMS for many clients, use project/space per client or tenant-scoped content models so RLS or API keys enforce isolation.

### 6.3 Enterprise solutions

- **Contentful:** Mature GraphQL API; 300K+ developers; Compose/Launch for enterprise. Best when org size and reliability are top priorities.
- **Sanity:** GROQ, Portable Text, real-time collaboration; customizable Studio; strong for editorial and marketing. 1M+ projects.
- **Storyblok:** Visual editor; component-based; good for marketers with less dev dependency. Enterprise positioning.
- **Selection criteria:** Team velocity, content scalability, pricing at scale (Payload $0 self-hosted; Sanity/Contentful $300–500+/mo at scale). Poor choice leads to costly migrations.

### 6.4 Novel / unique / innovative

- **AI-assisted content:** Sanity and others integrate AI for summarization, suggestions, or generation within the CMS. Complements human editing.
- **Agency use case:** One CMS tenant or project per client; content delivered by tenant/slug to the right app. “New client” = new CMS space + env + webhook or fetch in app.
- **Agent-friendly:** “Content lives in CMS; app fetches by slug/type” is a clear instruction. Document API shape and which routes are static vs dynamic so agents don’t over-fetch or under-cache.

---

## 7. Analytics (PostHog, tenant-aware)

### 7.1 Basics and fundamentals

- **Product analytics:** Events (page view, click, signup) and user/account properties to measure usage, funnels, and retention.
- **PostHog:** Open-source-friendly product analytics; self-host or cloud; feature flags, session replay, surveys. API key + host; init once per app.
- **Tenant-aware:** For B2B or multi-tenant, associate events with a group (company/tenant) so you can analyze by account, not only by user. Prevents cross-tenant leakage and supports account-level metrics.

### 7.2 Best practices and highest standards

- **Client init:** Call `initAnalytics(tenantSlug)` once (e.g. in root layout or Providers); register tenant as super property so every event is tagged. Never send other tenants’ data.
- **Identify:** Use stable, tenant-scoped identity (e.g. `userId@tenantSlug`) so the same person in two tenants is two distinct “users” in analytics. Identify on login; reset on logout.
- **Server-side:** Optional server capture (e.g. signup, payment) with tenant in properties; use PostHog Node SDK; flush before serverless exit. Fail silently so analytics don’t break the app.
- **Privacy:** Respect GDPR; disable IP capture if needed; document in privacy policy. No PII in event names; use properties for context.

### 7.3 Enterprise solutions

- **PostHog Group Analytics:** Up to 5 group types per project; link events to company/project/channel; measure daily active companies, churn, feature adoption by account. Paid add-on.
- **B2B mode:** Filter insights by selected group (e.g. company); beta feature with Group Analytics.
- **Billing:** Events with group properties count toward volume; tiered pricing. Plan for event volume and group usage at scale.
- **Compliance:** If HIPAA/SOC2, verify PostHog (or chosen tool) compliance and data residency; consider self-hosted or dedicated instance.

### 7.4 Novel / unique / innovative

- **Single codebase, many brands:** One PostHog project; tenant slug on every event; dashboards filtered by tenant or “all.” Enables agency to see aggregate and per-client metrics without separate tools.
- **Feature flags by tenant:** Roll out or A/B test per tenant (e.g. beta feature for one client). PostHog supports group-level flags.
- **Agent-friendly:** “Init analytics with tenant slug in layout/Providers; identify on login with tenant-scoped ID” is a repeatable pattern for every new app in the monorepo.

---

## 8. Background jobs (Inngest)

### 8.1 Basics and fundamentals

- **What Inngest is:** Event-driven background job execution for serverless (e.g. Vercel). No queues or workers to run; you define functions that subscribe to events; Inngest invokes them via HTTP.
- **Concepts:** Events (e.g. `agency/client.created`); functions (async handlers with steps); steps (run, sleep, waitForEvent). Retries and observability built in.
- **Use cases:** Welcome emails, follow-up sequences, data sync, cleanup, notifications—anything that shouldn’t block the request.

### 8.2 Best practices and highest standards

- **Step-based design:** Break work into steps (e.g. provision DB → send email → wait for event → send follow-up). Each step is retried independently; state passed between steps.
- **Keep API fast:** Emit events from API or server action; handle heavy work in Inngest. Target &lt;1s response time for user-facing paths.
- **Idempotency:** (1) Event-level: set unique `id` on events as idempotency key; Inngest deduplicates within 24h. (2) Function-level: design steps so replay doesn’t duplicate (upsert by id, “already sent” check). Use both for critical flows.
- **Error handling:** Use **NonRetriableError** when retries won’t help (e.g. invalid input); use **RetryAfterError** for rate limits or temporary backoff. Try/catch per step so one failure doesn’t kill the whole run. Rely on Inngest retries for transient failures.
- **Type safety:** Use typed events and payloads so triggers and functions stay in sync. Inngest supports TypeScript end-to-end.
- **Local dev:** Use Inngest dev server + UI to trigger events and inspect runs.

### 8.3 Enterprise solutions

- **Long-running:** Use `step.sleep` and `step.waitForEvent` for delays and human-in-loop; max duration (e.g. 300s) per run; checkpointing for resume.
- **Fan-out:** Multiple functions can subscribe to the same event (e.g. onboarding + email sequence both on `client.created`); design so they’re complementary, not duplicate.
- **Security:** Verify webhook signature (INNGEST_SIGNING_KEY); use env for keys; never expose event key to client.
- **Observability:** Rely on Inngest dashboard for history, logs, failures; optionally forward to your logging/monitoring.

### 8.4 Novel / unique / innovative

- **No infra:** No Redis, no worker processes; runs on your existing serverless. Good fit for agency platform where you want minimal ops.
- **Agency onboarding flow:** Event “client created” → provision tenant in DB → send welcome email → wait 7 days for “profile completed” → else send follow-up. Same pattern for email sequences (day 1, day 3) without cron or queues.
- **Agent-friendly:** “Background work = emit event + Inngest function with steps” is a clear pattern. Document event names and payloads so new flows can be added by prompt.

---

## 9. Email (Resend, transactional)

### 9.1 Basics and fundamentals

- **Transactional email:** Triggered by user action (signup, contact form, password reset); one-off or short sequence. Not bulk marketing.
- **Resend:** Modern API for sending; React Email support; clear docs. Free tier (e.g. 3K/month); paid from ~$20. API key `re_`; domain verification (SPF, DKIM, etc.).
- **Flow:** Server or Inngest calls Resend API with to, from, subject, html; Resend delivers. Use subdomain (e.g. mail.yourdomain.com) and consistent From/Reply-To.

### 9.2 Best practices and highest standards

- **Clarity:** Subject and body should be clear and action-oriented; include identifiers (order #, account name). Structure: header → main message → details → CTA.
- **Mobile-first:** Single column; 44×44px buttons; 16px+ body; avoid image-heavy layouts. Most opens on mobile.
- **Deliverability:** DMARC; match links to sending domain; avoid lookalike domains; no fake test addresses in production; keep under 102KB (Gmail). Separate transactional from marketing sending.
- **Server-only:** Send from Server Actions or Inngest; never expose API key to client. Optional: webhooks for bounces/complaints; suppression list.

### 9.3 Enterprise solutions

- **Templates:** Use React Email or similar for consistent, versioned templates; variables for personalization. Store in repo or CMS.
- **Retries and idempotency:** Inngest (or your queue) retries; design so duplicate sends are avoided or acceptable. Log delivery status.
- **Multi-tenant:** From address or reply-to can be tenant-specific; track per-tenant volume and bounces if needed for compliance or support.
- **Compliance:** CAN-SPAM, GDPR (lawful basis, unsubscribe where applicable). Document in privacy policy.

### 9.4 Novel / unique / innovative

- **React Email in monorepo:** Shared package or app with `.tsx` email components; compile to HTML and send via Resend. One place for all transactional templates.
- **Contact form → DB + email:** Save submission to Supabase (contact_submissions) then send notification to inbox; if email fails, submission is still stored. Agent-friendly: “contact form = server action insert + sendContactNotification.”
- **Inngest + Resend:** Welcome and follow-up emails in Inngest steps; failure in one step doesn’t lose the rest; full audit trail in Inngest UI.

---

## 10. Accessibility (WCAG 2.2, reduced motion)

### 10.1 Basics and fundamentals

- **WCAG 2.2:** W3C recommendation (Oct 2023); builds on 2.1; adds 9 success criteria. Reference for ADA, Section 508, EAA.
- **Layers:** (1) Design tokens (focus, contrast, motion); (2) Component behavior (keyboard, labels, errors); (3) Page structure (headings, landmarks); (4) Content (alt text, captions).
- **Levels:** A (minimum), AA (common target), AAA (stricter). Many contracts require AA.
- **Reduced motion:** 2.3.3 Animation from Interactions (AAA): motion from interaction must be disableable unless essential. Use `prefers-reduced-motion: reduce` (e.g. `animation: none`, `transition: none`).

### 10.2 Best practices and highest standards

- **Focus:** 2.4.11 Focus Not Obscured (AA): focused element not fully hidden by sticky header/footer; use `scroll-padding-top`, `scroll-margin-top`. 2.4.13 Focus Appearance (AAA): ≥2px thickness, 3:1 contrast.
- **Tokenize focus ring:** Color and width as tokens so themes and high-contrast can override. Document in design system.
- **Touch targets:** Minimum 44×44px (2.5.5). Contrast: 4.5:1 normal text, 3:1 large (1.4.3).
- **Testing:** Automated (e.g. axe-core) + manual + assistive tech. Automation catches a portion; full coverage needs manual and AT. Test high-risk: forms, modals, tabs, menus.

### 10.3 Enterprise solutions

- **Governance:** A11y owner; definition of done per component (tokens + behavior + docs); gates in CI (e.g. axe); annual or per-release audit.
- **Documentation:** Per-component a11y notes (keyboard, ARIA, focus order); list of high-risk components; known limitations.
- **Vestibular and photosensitivity:** Respect reduced motion; avoid auto-play >5s without pause (2.2.2); avoid flashing. Over 35% of adults may have vestibular issues by 40.

### 10.4 Novel / unique / innovative

- **Motion tokens:** Duration and easing as tokens; in reduced-motion media query, set duration to 0 or use “reduced” token. One place to control all motion.
- **tw-animate-css:** Use library that respects reduced motion (e.g. duration override) so “add animation” doesn’t require custom keyframes. Aligns with “no custom keyframes” rule in this repo.
- **Agent-friendly:** Rules like “always use prefers-reduced-motion” and “focus ring from tokens” ensure generated code stays accessible. Include in Cursor/Windsurf rules.

---

## 11. Core Web Vitals (LCP, INP, CLS)

### 11.1 Basics and fundamentals

- **LCP (Largest Contentful Paint):** Loading; target ≤2.5s. Usually hero image or main block.
- **INP (Interaction to Next Paint):** Responsiveness; replaced FID (Mar 2024); target ≤200ms. Worst interaction in the page lifecycle.
- **CLS (Cumulative Layout Shift):** Visual stability; target &lt;0.1. Caused by images/fonts without dimensions, late-injected content, dynamic ads.
- **Impact:** Affects SEO and user experience; poor CWV can reduce conversions (e.g. 8–35% in studies). Many sites still miss targets; optimization pays off.

### 11.2 Best practices and highest standards

- **LCP:** Next.js `Image` with `priority` for above-fold; WebP/AVIF; preload critical fonts/CSS; edge/CDN; Server Components and static/ISR to reduce JS and speed TTFB.
- **INP:** Reduce client bundle; debounce/throttle where appropriate; passive listeners; prefer `transform`/`opacity` for animations; `useTransition`/Suspense. Avoid long tasks on main thread.
- **CLS:** Reserve space for images (width/height or aspect-ratio); font-display and fallback to avoid FOIT/FOUT; avoid inserting content above existing content without reserved space.
- **Third-party scripts:** Load with `strategy="lazyOnload"` or `afterInteractive` so analytics/chat don’t block LCP.

### 11.3 Enterprise solutions

- **Monitoring:** RUM (Real User Monitoring) with CWV; CrUX or provider (e.g. Vercel Analytics, PostHog). Set budgets and alerts.
- **Design system contribution:** Token-based spacing/sizing reduces arbitrary layout; explicit dimensions in components; documented image and font practices.
- **Marketing pages:** Static or ISR by default; dynamic only where needed; critical CSS and fonts inlined or preloaded. Test on mobile and slow networks.

### 11.4 Novel / unique / innovative

- **Partial Prerendering:** Static shell (fast LCP) + streamed dynamic parts; best of both for “static hero + fresh CTA.”
- **Agent-friendly:** “Use next/image with dimensions; reserve space for dynamic content; Server Components by default” keeps generated sites CWV-friendly. Add CWV to “definition of done” for new pages.

---

## 12. Design system versioning (Changesets, semver)

### 12.1 Basics and fundamentals

- **Semver:** MAJOR.MINOR.PATCH. Breaking = major; new feature backward-compatible = minor; fix = patch.
- **Breaking in design systems:** Token value/name changes that affect layout or theming; component renames/removals; prop removals or behavior changes. Non-breaking: new optional props, deprecation warnings, internal refactors.
- **Changesets:** Tool for multi-package repos; you run `pnpm changeset`, describe change (major/minor/patch), write summary; on release it bumps versions and generates changelogs. No manual version edits.

### 12.2 Best practices and highest standards

- **One changeset per logical change:** User-facing summary; list affected packages; for breaking, add migration steps or codemod reference.
- **Release cadence:** Patch frequently (fixes); minor on a schedule (new components/props); major with review window and communication. Document support window (e.g. current + one prior major).
- **Changelog:** Human-readable; link to PRs or commits. Consumers use it to decide when to upgrade and what to test.
- **Version design system independently:** UI package can be 2.1.0 while apps stay on 1.x until they migrate. Avoid “everything bumps together” unless intentional.

### 12.3 Enterprise solutions

- **Codemods:** For renames and prop migrations (e.g. jscodeshift); document or provide `packageName`/path so custom wrappers are updated. MUI and Carbon are references.
- **Governance:** Who can approve major; how long deprecations last; how breaking changes are communicated. Reduces surprise for product teams.
- **CI:** On merge to main, run `changeset version` (or similar) so versions and changelog are updated; optional publish step or manual publish from main.

### 12.4 Novel / unique / innovative

- **Container versioning (Supernova 2026):** Manage multiple design system versions in one place; new prototypes get latest; existing ones keep their version. Concept can apply to how you document “supported” versions for apps.
- **Agent-friendly:** “When you change a shared component or token, add a changeset (major/minor/patch) and describe the change” in contributing or rules. Ensures AI-generated changes are versioned correctly.

---

## 13. AI / agentic coding (Cursor, Windsurf, natural language)

### 13.1 Basics and fundamentals

- **Agentic coding:** AI assists by editing code, running commands, and exploring the repo in response to natural language. Not just autocomplete; multi-step, multi-file changes.
- **Cursor:** Composer for multi-file edits; Agent mode; strong for focused, surgical changes in medium-sized codebases. Subscription model.
- **Windsurf:** Cascade engine; codebase-wide context; persistent awareness; integrated browser and deployment. Free tier; Pro for teams; FedRAMP/HIPAA options.
- **Natural language:** You describe what you want (“add a contact form that saves to Supabase and emails me”); the agent generates or edits code, config, and docs.

### 13.2 Best practices and highest standards

- **Structured context:** Put conventions in rules (e.g. `.cursor/rules`, Windsurf rules): stack, patterns, “never X,” “always Y.” Reduces wrong patterns and rework.
- **Incremental skills:** Nx-style “skills” or rule files that load when relevant (e.g. “when editing RLS, use database.mdc”). Avoid one giant prompt; keep context focused.
- **Verification:** After agent changes, run type-check, lint, tests, and a quick manual check. Use “verify before claiming done” so agents don’t assert success without evidence.
- **Scaffolding:** Document or script “new client” and “new page” so the agent can follow a repeatable path instead of inventing structure.

### 13.3 Enterprise solutions

- **Monorepo as agent infrastructure:** Single repo gives agents full visibility; shared packages and apps in one place; atomic commits. Nx and others position monorepos for “autonomous AI agents” and provide agent-config commands.
- **Meta-repository:** Separate repo or doc set that encodes institutional knowledge (build, CI, release, cross-repo deps). Agents read it to avoid “session amnesia” and wrong assumptions.
- **Compliance:** Windsurf’s FedRAMP/HIPAA options for regulated work; Cursor for general product work. Control what code and data the tool sees.

### 13.4 Novel / unique / innovative

- **Teach the agent the map:** Nx “configure-ai-agents” and similar write config so agents understand project graph, boundaries, and tasks. Reduces “agent gets lost” in large repos.
- **Natural language → deploy:** Windsurf’s one-click deploy and visual preview; Cursor’s Composer for “build a landing page” then you run deploy. Fits “spin up websites via natural language.”
- **Persistent memory:** Some tools and patterns (e.g. AGENTS.md, continual-learning skills) accumulate corrections and preferences so future sessions don’t repeat the same mistakes. Use for stack-specific rules and tenant patterns.

---

## 14. Agency onboarding & scaffolding

### 14.1 Basics and fundamentals

- **Onboarding a client:** New brand/site in the platform: new app (or site config), new tenant in DB, design tokens, env, deployment (e.g. Vercel project + domain).
- **Scaffold script:** Automates “new app”: copy template (e.g. riley-day-care), rename package and slugs, create token stub, run install and token build. Reduces human error and keeps structure consistent.
- **Template:** One “reference” app (e.g. prospective-clients/riley-day-care) that has layout, middleware, contact, auth (if needed), tokens import. New clients are copies with find-replace for name/slug.

### 14.2 Best practices and highest standards

- **Checklist:** Document steps (scaffold → edit tokens → add tenant → create admin user → Vercel project → env → test). Target time (e.g. &lt;2 hours) and note bottlenecks.
- **Token file per client:** Distinct palette and optional typography; build outputs to that app’s `tokens/[slug].css`. No code change for new client beyond token JSON and tenant row.
- **Tenant in DB:** Insert into `tenants` (slug, domain, name, industry); optional seed for local. RLS and app_metadata tie data to tenant.
- **One deployment per app:** One Vercel project per client app; own env vars and domain. Isolates rollback and billing.
- **Vercel monorepo setup:** Set **Root Directory** to the app path (e.g. `apps/firm` or `apps/prospective-clients/the-barber-cave`). Build command from repo root: `pnpm turbo build --filter=@agency/firm` (or the app’s package name). Install command at root: `pnpm install`. Vercel can include source files outside the root directory when needed; use same repo, multiple projects (one per app). Env vars per project; no shared secrets across clients.

### 14.3 Enterprise solutions

- **White-label:** Same codebase; differentiation via tokens and env. No forking; “new client” = config + deploy. Scale to dozens of clients without N codebases.
- **Self-serve vs assisted:** Script + docs for technical users; optional UI or “request a site” flow for non-technical. Document who does what (agency vs client).
- **Compliance:** For HIPAA or high isolation, document “dedicated Supabase project and BAA” path; don’t onboard PHI clients on shared RLS DB without plan.

### 14.4 Novel / unique / innovative

- **Agent as onboarding actor:** “Add a new client called X, slug Y, industry Z” → agent runs scaffold (or suggests commands), edits token file, adds seed row, suggests Vercel steps. Natural language replaces clicking through docs.
- **create-turbo for net-new:** For a brand-new monorepo, `pnpm dlx create-turbo@latest`; for “new app in existing repo,” scaffold script. Document both in CONTRIBUTING so agents and humans follow the same path.
- **Time-to-value metric:** Record wall-clock for full onboarding; improve script and docs until under target (e.g. 2 hours). Good for agency sales and ops.

---

## 15. Testing (Vitest, Playwright, pgTAP)

### 15.1 Basics and fundamentals

- **Unit/integration:** Vitest—fast, ESM-native, parallel by default; shares Vite config. Use for packages (e.g. database auth helpers, email utils, token logic). Run per package or from root with Vitest projects.
- **E2E:** Playwright—browser automation; multi-browser; stable selectors and auto-waiting. Use for critical user flows (login, contact form, checkout). Typically one `e2e-tests` package or app-level `e2e/` with its own `playwright.config.ts`.
- **RLS/database:** pgTAP (or Supabase test db)—SQL tests that assert RLS policies (cross-tenant isolation, positive access). Run via `supabase test db`; required for every new tenant-scoped table per CONTRIBUTING.
- **When to use which:** Unit for pure logic and helpers; E2E for happy paths and key flows; RLS tests for every migration that adds a public table.

### 15.2 Best practices and highest standards

- **Monorepo layout:** Unit tests live next to source (e.g. `auth.email.test.ts` in package). E2E in dedicated package (`packages/e2e-tests` or `apps/web/e2e`) with `webServer` pointing at `pnpm --filter @agency/firm dev` (or similar). RLS in `supabase/tests/database/`.
- **Vitest:** Use `defineConfig` with `test.projects` for multi-package; each package can have its own env (node/dom). Coverage optional; focus on critical paths first.
- **Playwright:** Use `webServer` + `reuseExistingServer: !process.env.CI` so local dev can be reused. Global setup for auth (login once, save storage state). Reset DB or use test tenant for isolation.
- **CI:** Run unit tests with `pnpm turbo run test --affected`; run RLS with `supabase test db`; run E2E on PR or main with secrets for auth. Keep E2E suite small (smoke + a few critical flows).

### 15.3 Enterprise solutions

- **Test pyramid:** Many unit tests, fewer integration, minimal E2E. Design system: component tests (Storybook interaction or Vitest + RTL) for atoms/molecules; E2E for one app type (e.g. firm home + contact).
- **Visual regression:** Storybook Chromatic or Percy for UI package; or Playwright screenshots on key pages. Protects against unintended layout/token changes.
- **RLS coverage:** Every tenant-scoped table must have pgTAP assertions for cross-tenant SELECT/UPDATE/DELETE/INSERT (or documented exception, e.g. contact_submissions INSERT service-role only). Update EXPECTED_TABLE_COUNT and 00-rls-coverage when adding tables.
- **Flakiness:** Use stable selectors (data-testid or role+name); avoid sleep; prefer Playwright’s auto-wait. Isolate tests (clean DB or test tenant) so order doesn’t matter.

### 15.4 Novel / unique / innovative

- **Affected tests:** Turborepo/Nx run only tests for changed packages; RLS runs on full DB. Balance speed vs coverage; add E2E to “affected” only if app code changed.
- **Agent-friendly:** “Every new tenant-scoped table needs pgTAP tests and table count update” in CONTRIBUTING and rules. “Run `pnpm turbo run test` and `supabase test db` before claiming done” reduces unchecked assertions.
- **Single e2e package:** One Playwright config that can target different apps via env (e.g. BASE_URL or filter); reuse same flows for firm and one client app to avoid duplicate suites.

---

## 16. Security (multi-tenant agency platform)

### 16.1 Basics and fundamentals

- **Tenant isolation:** One vulnerability can expose all tenants. Every table with tenant data must have RLS (or equivalent); tenant context must come from verified auth (e.g. JWT `app_metadata.tenant_id`), never from client-supplied headers or input.
- **Secrets:** Service role key and API keys server-only; never in `NEXT_PUBLIC_*` or client bundles. Use env vars per app; rotate and audit.
- **Principle:** Default-deny; least privilege; defense in depth. Validate tenant exists and user belongs to it before any data access.

### 16.2 Best practices and highest standards

- **Tenant context:** Resolve from auth claims (Supabase `app_metadata.tenant_id`) or from server-side resolution (middleware/layout) that uses env or hostname and DB lookup. Never trust `X-Tenant-Id` or similar from the client for authorization.
- **RLS:** Enable on every public table; policies for SELECT, INSERT, UPDATE, DELETE using `public.tenant_id()` (or equivalent). Index `tenant_id`; use STABLE helper so Postgres evaluates once per query.
- **Service role:** Use only in Server Actions, API routes, Inngest, and scripts. Throw in browser; check `typeof window`. Scan CI for accidental exposure (e.g. grep for NEXT_PUBLIC_ + SERVICE_ROLE).
- **user_metadata vs app_metadata:** Tenant and role must live in `app_metadata` (server-controlled). `user_metadata` is user-editable; do not use for tenant_id or authorization.

### 16.3 Enterprise solutions

- **OWASP multi-tenant:** Address cross-tenant data leakage, IDOR, tenant impersonation, privilege escalation, shared-resource poisoning. Establish tenant context early (middleware); validate membership; scope all queries.
- **Audit and compliance:** Audit log for sensitive ops (e.g. admin actions); retain for compliance. Document data residency and encryption; use dedicated Supabase project and BAA for HIPAA tenants.
- **Session and headers:** Secure, HttpOnly, SameSite cookies; short session lifetime; CSRF protection where applicable. Security headers (CSP, HSTS) at edge or in Next.js config.
- **Vendor and supply chain:** Prefer dependencies with clear security posture; lock versions; run `pnpm audit` or similar in CI.

### 16.4 Novel / unique / innovative

- **Rules as enforcement:** Encode “tenant_id only from app_metadata,” “no service role in client,” “every new table: RLS + policies” in .cursor/rules or CONTRIBUTING so agents and humans follow the same constraints.
- **CI security steps:** Automated checks (e.g. no NEXT_PUBLIC_ service key, no user_metadata for tenant in database package except allowed auth payload). Fails PR if violated.
- **Agent-friendly:** Security checklist in docs and rules reduces mistakes when generating migrations, server actions, or new apps. Reference RESEARCH_TOPICS_2026 §16 when prompting for auth or tenant logic.

---

## How to use this document

- **When prompting Cursor/Windsurf:** Reference a topic and level, e.g. “Follow the multi-tenant best practices in RESEARCH_TOPICS_2026 §3.2 when adding this table.”
- **When validating agent output:** Check against “Best practices and highest standards” and “Enterprise solutions” for your scale.
- **When designing something new:** Skim “Novel / unique / innovative” for ideas and “Agent-friendly” bullets for rules to add.
- **When onboarding yourself or others:** “Basics and fundamentals” plus the repo’s ARCHITECTURE.md and CODEBASE_ANALYSIS.md give a full picture.

Sources for this research include official docs (Next.js, Supabase, PostHog, Inngest, Resend, W3C), vendor blogs and changelogs (Turborepo, Nx, shadcn, Style Dictionary), and third-party guides and comparisons (PkgPulse, Vercel Academy, accessibility and CWV guides) as of 2025–2026. Re-run targeted searches when you need the latest for a specific topic.
