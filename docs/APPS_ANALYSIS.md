# Comprehensive Assessment: apps/ vs GUIDE and Research

This document assesses every application under `apps/` against **docs/GUIDE.md** and the research and verdicts in **docs/GUIDE_DEVIATIONS_ANALYSIS.md** and **docs/PACKAGES_ANALYSIS.md**. It provides a per-app summary and a consolidated gap list with recommended actions.

**Scope:** firm, agency-admin, prospective-clients/riley-day-care, prospective-clients/the-barber-cave. Structure, metadata, SEO, security, forms, rendering, conventions, and app-specific behavior.

---

## 1. App inventory and role

| App | Role | Public / auth | Key routes |
|-----|------|----------------|------------|
| **firm** | Agency marketing site (lead gen, services, blog, contact, booking) | Public + /book | /, /about, /services, /contact, /blog, /blog/[slug], /book |
| **agency-admin** | Internal dashboard (costs, DORA metrics, Inngest) | Auth required (Supabase) | /, /login, /(dashboard)/costs, /(dashboard)/metrics |
| **riley-day-care** | Client marketing site (prospective client) | Public + auth for dashboard | /, /about, /contact, /blog, /programs, /(auth)/login, /(auth)/signup, /dashboard |
| **the-barber-cave** | Client marketing site (prospective client) | Public + auth for dashboard | /, /contact, /services, /(auth)/login, /(auth)/signup, /dashboard |

---

## 2. Summary: GUIDE vs apps (consolidated)

| Area | GUIDE expectation | firm | agency-admin | riley-day-care | the-barber-cave |
|------|--------------------|------|--------------|----------------|-----------------|
| **metadataBase** | Set in root layout | ❌ | ❌ (internal) | ❌ | ❌ |
| **Metadata shape** | title, description, openGraph (full), twitter, robots, verification | Partial (title, desc, OG title/desc) | Minimal (title, desc) | Partial | Partial |
| **sitemap.ts** | Present for indexable apps | ❌ | N/A | ❌ | ❌ |
| **robots.ts** | Present; disallow /api, /_next | ❌ | N/A | ❌ | ❌ |
| **opengraph-image** | opengraph-image.tsx (ImageResponse) | ❌ | N/A | ❌ | ❌ |
| **Security headers** | X-Frame, X-Content-Type, Referrer, Permissions (incl. interest-cohort), HSTS | ❌ None | Partial (no HSTS, no interest-cohort) | Partial | Partial |
| **Root loading.tsx** | For loading states | ❌ | ✓ | ❌ (only dashboard/) | ❌ (only dashboard/) |
| **Root error.tsx** | Error boundary | ❌ | ✓ | ❌ | ❌ |
| **Middleware** | As needed (auth, tenant) | ❌ | ✓ (auth + tenant) | ✓ (auth + tenant) | ✓ (auth + tenant) |
| **Forms** | RHF + Zod or Server Action + Zod | Server Action, no Zod, no honeypot | N/A (login form) | Server Action, no Zod, no honeypot | Server Action, no Zod, no honeypot |
| **generateStaticParams** | Every dynamic route | ❌ (blog/[slug] uses in-memory data, no export) | N/A | ❌ blog/[slug] | N/A |
| **Revalidation** | ISR per page type (blog 3600, pricing 60, etc.) | Only /services has revalidate=60 | N/A | None set | None set |
| **JSON-LD / schema** | LocalBusiness, BlogPosting, etc. | ❌ | N/A | ❌ | ❌ |
| **Thank-you / booking success** | /thank-you, /booking/success for tracking | ❌ | N/A | ❌ | ❌ |
| **next/image / next/script** | Images via next/image; 3rd party via next/script | Not used (no images in pages) | Not used | Not used | Not used |
| **Internal links** | next/link only | ✓ | ✓ | ❌ <a> in auth (login/signup) | ❌ <a> in auth (login/signup) |

---

## 2.1 100% confidence verification (methodology)

The following was verified so that every claim in this document can be trusted at 100%:

1. **File existence:** Glob and grep for sitemap*, robots*, opengraph*, loading.tsx, error.tsx, middleware.ts in each app. No sitemap/robots/opengraph files exist in any app; firm has no middleware; only agency-admin has root loading + error.
2. **next.config headers:** Read each app’s next.config.ts. firm has no `headers()`; agency-admin, riley-day-care, the-barber-cave have identical header blocks. Grep for Strict-Transport and interest-cohort: **no matches** in any app.
3. **metadataBase:** Grep for `metadataBase` in apps/**/*.tsx: **no matches**. Confirmed no app sets metadataBase.
4. **revalidate / generateStaticParams:** Grep for `revalidate` and `generateStaticParams` in apps. Only firm/services sets revalidate=60; one Cache-Control in agency-admin API. No generateStaticParams in any app.
5. **Internal `<a>`:** Grep for `<a href=` and `<Link` in prospective-clients. Exactly four internal `<a>`: riley-day-care (auth)/login (href="/signup"), (auth)/signup (href="/login"); the-barber-cave (auth)/login (href="/signup"), (auth)/signup (href="/login"). All other internal nav uses Link.
6. **data-testid:** Grep for data-testid and testId in apps: **no matches**. Confirmed no test IDs in app components.
7. **Zod / honeypot:** Grep for zod/Zod and honeypot/website formData in apps: **no matches**. No Zod in app code; no honeypot field.
8. **@agency/metrics and @agency/monitoring:** Grep apps/agency-admin/src for these imports: **no matches**. Confirmed unused in app code.
9. **JSON-LD:** Grep for application/ld+json, schema.org, LocalBusiness, JSON-LD in apps: **no matches**. No structured data.
10. **Routes:** Listed app directory contents for firm (no thank-you, no booking/success; book/ exists). Glob for sitemap/robots/opengraph: 0 files in apps.

### Verified findings (high confidence)

| Claim | Verification method | Result |
|-------|---------------------|--------|
| firm has no security headers | Read apps/firm/next.config.ts | Only transpilePackages; no headers() |
| No app sets metadataBase | grep metadataBase apps | No matches |
| No sitemap/robots/opengraph in any app | glob **/sitemap*, **/robots*, **/opengraph* | 0 files |
| Only firm/services has revalidate | grep revalidate apps | Only services/page.tsx (and API cache in agency-admin) |
| No generateStaticParams in any app | grep generateStaticParams apps | No matches |
| Internal &lt;a&gt; only in auth pages (4 files) | grep "<a href=" and "<Link" in prospective-clients | 4 occurrences: login/signup in both riley and barber |
| No data-testid in apps | grep data-testid, testId apps | No matches |
| No Zod or honeypot in apps | grep zod, honeypot, website formData apps | No matches |
| agency-admin does not import metrics/monitoring | grep @agency/metrics, @agency/monitoring in agency-admin/src | No matches |
| No JSON-LD in apps | grep ld+json, schema.org, LocalBusiness apps | No matches |
| firm has no root loading or error | glob **/loading.tsx, **/error.tsx; list firm app dir | firm app has no loading.tsx or error.tsx at root |
| agency-admin has root loading + error | glob apps/agency-admin | loading.tsx and error.tsx at src/app/ |
| agency-admin metadata is plain object (no Metadata type) | Read agency-admin layout.tsx | `export const metadata = { title, description }` |
| Permissions-Policy in 3 apps omits interest-cohort | Read next.config.ts of each | Value is camera=(), microphone=(), geolocation() only |
| No HSTS in any app | grep Strict-Transport, HSTS apps | No matches |
| Contact forms use Server Action + Supabase + email | grep submitContactForm, sendContactNotification, getAdminClient in apps | firm, riley-day-care, the-barber-cave contact/actions.ts; useActionState in contact-form.tsx |
| No /thank-you or /booking/success route in firm | glob apps/firm/src/app | No thank-you/ or booking/ directory; only book/ |

### Route and layout verification

| App | Root layout | Middleware | Root loading | Root error | Public routes (sample) |
|-----|-------------|------------|---------------|------------|------------------------|
| firm | src/app/layout.tsx | None | None | None | /, /about, /services, /contact, /blog, /book |
| agency-admin | src/app/layout.tsx | src/middleware.ts | src/app/loading.tsx | src/app/error.tsx | /login only (rest auth) |
| riley-day-care | src/app/layout.tsx | src/middleware.ts | None (dashboard/loading only) | None | /, /about, /contact, /blog, /programs |
| the-barber-cave | src/app/layout.tsx | src/middleware.ts | None (dashboard/loading only) | None | /, /contact, /services |

---

## 3. Per-app assessment

### 3.1 firm

**Purpose:** Agency marketing site. Primary public-facing app for SEO and conversion.

**Structure**
- `src/app/`: layout.tsx, page.tsx, about, services, contact, blog, blog/[slug], book. No api/, no sitemap.ts, no robots.ts, no opengraph-image.tsx.
- No `lib/`, `components/sections/`, or `components/layout/` (GUIDE prescribes these for some setups); components live in `src/components/` (SiteHeader, SiteFooter, providers, contact-form).
- No middleware (tenant/auth not required for this app).

**Metadata (layout.tsx)**
- title (default + template), description, openGraph (title, description only). **Missing:** metadataBase, openGraph.type, openGraph.siteName, openGraph.locale, openGraph.images, twitter, robots, verification.

**SEO**
- No sitemap.ts, robots.ts, or opengraph-image.tsx. OG/Twitter URLs will be relative and may break when shared (GUIDE + research: metadataBase required).
- No JSON-LD or schema components.
- Blog [slug] has generateMetadata but no generateStaticParams (GUIDE: every dynamic route has generateStaticParams for SSG). Current implementation uses in-memory `posts` object and notFound() for unknown slugs — valid but no static generation of known slugs.

**Rendering**
- Only `services/page.tsx` sets `revalidate = 60`. Homepage, about, contact, blog, blog/[slug] have no revalidate (default SSG). GUIDE suggests blog ISR (e.g. revalidate = 3600); not implemented.

**Forms**
- Contact: Server Action (`submitContactForm`) → Supabase contact_submissions + @agency/email sendContactNotification. No Zod, no honeypot (GUIDE + TODO: add Zod in action, add honeypot).
- Booking: /book uses BookingWidget and Server Action; no thank-you or /booking/success route (GUIDE: conversion tracking and success URL).

**Security**
- next.config.ts has no headers. All security headers (X-Frame-Options, CSP, HSTS, interest-cohort) are missing (TODO TASK-01).

**Loading / error**
- No root loading.tsx or error.tsx (GUIDE_DEVIATIONS + TODO TASK-13: add for firm).

**E2E**
- apps/firm/e2e/smoke.spec.ts: one test (home, title, h1). No contact, nav, mobile menu, or data-testid (TODO TASK-09).

**Verdict**
- **Critical gaps:** metadataBase, sitemap, robots, security headers, root loading/error, Zod + honeypot on contact, thank-you (and optionally booking/success), revalidate on blog.
- **Align with GUIDE + research:** Add all of the above; opengraph-image and JSON-LD for SEO; expand Playwright and data-testid.

---

### 3.2 agency-admin

**Purpose:** Internal dashboard for agency operations (costs, DORA metrics, Inngest).

**Structure**
- `src/app/`: layout.tsx, page.tsx, login, (dashboard)/costs, (dashboard)/metrics; api/metrics/dora, api/costs/*, api/inngest. No sitemap/robots (not indexable).
- Middleware: auth + tenant resolution via @agency/database; redirects unauthenticated users to /login.
- Root loading.tsx and error.tsx present; (dashboard)/costs has loading.tsx and error.tsx.

**Metadata**
- Plain object: title, description. No metadataBase (not needed for internal tool). No openGraph/twitter (appropriate).

**Security**
- next.config headers: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy (camera, microphone, geolocation), CSP. **Missing:** Strict-Transport-Security (HSTS), interest-cohort in Permissions-Policy (TODO TASK-01).

**API routes**
- metrics/dora: returns mock data; does not use @agency/metrics (PACKAGES_ANALYSIS + TODO TASK-17).
- costs/summary, metrics, alerts, recommendations: use getAdminClient and Supabase RPC; do not use @agency/monitoring (TODO TASK-17).
- No Zod validation on query/body in these routes (TODO TASK-14).

**Dependencies**
- Declares @agency/metrics and @agency/monitoring but does not import them in app code (dead deps unless wired).

**Verdict**
- **Critical:** Add HSTS and interest-cohort to headers (TASK-01).
- **High:** Add Zod to API routes (TASK-14); wire metrics/monitoring or remove deps (TASK-17).
- **Other:** Root loading/error and auth flow are in good shape.

---

### 3.3 riley-day-care

**Purpose:** Prospective client marketing site with auth and dashboard.

**Structure**
- `src/app/`: layout.tsx, page, about, contact, blog, blog/[slug], programs; (auth)/login, (auth)/signup, (auth)/callback; dashboard. No api/ for contact (Server Action).
- Middleware: auth + tenant (same pattern as agency-admin). Loading only under dashboard/, no root loading/error.

**Metadata**
- title (default + template), description, openGraph (title, description). **Missing:** metadataBase, full OG/twitter/robots. If this app is ever indexed, metadataBase + sitemap + robots are needed.

**SEO**
- No sitemap.ts, robots.ts, opengraph-image.tsx, or JSON-LD. Same gaps as firm for any public indexable pages.

**Forms**
- Contact: Server Action + Supabase + @agency/email. No Zod, no honeypot.
- Auth: login/signup use Server Actions; **internal links** on login/signup pages use `<a href="/signup">` and `<a href="/login">` instead of next/link (GUIDE forbidden pattern; TODO TASK-12).

**Security**
- next.config: same as agency-admin (partial headers; no HSTS, no interest-cohort).

**Verdict**
- **Critical:** Replace internal `<a>` with Link in (auth) pages (TASK-12). Add HSTS and interest-cohort (TASK-01).
- **If indexed:** Add metadataBase, sitemap.ts, robots.ts for public routes; add Zod + honeypot to contact.
- **Optional:** Root loading.tsx and error.tsx for consistency.

---

### 3.4 the-barber-cave

**Purpose:** Prospective client marketing site (barber shop) with auth and dashboard.

**Structure**
- `src/app/`: layout.tsx, page, contact, services; (auth)/login, (auth)/signup, (auth)/callback; dashboard. No blog. No api/ for contact.
- Middleware: auth + tenant. Loading only under dashboard/; no root error.tsx.

**Metadata**
- title (default + template), description, openGraph (title, description). **Missing:** metadataBase, full OG/twitter/robots.

**Forms**
- Contact: Server Action + Supabase + @agency/email. No Zod, no honeypot.
- Auth: same internal `<a>` deviation as riley-day-care (TASK-12).

**Security**
- next.config: same partial headers; no HSTS, no interest-cohort (TASK-01).

**Verdict**
- Same as riley-day-care: fix internal links (TASK-12), add HSTS and interest-cohort (TASK-01). If indexed, add metadataBase/sitemap/robots and form hardening.

---

## 4. Cross-app gaps (by category)

### 4.1 Metadata and SEO (GUIDE + research: follow GUIDE)

| Gap | Apps affected | Action |
|-----|----------------|--------|
| metadataBase not set | firm, riley-day-care, the-barber-cave (agency-admin N/A) | Set in root layout from env (e.g. NEXT_PUBLIC_SITE_URL). Required for correct OG/Twitter URLs. |
| No sitemap.ts | firm, riley-day-care, the-barber-cave | Add app/sitemap.ts for indexable apps (at least firm). |
| No robots.ts | firm, riley-day-care, the-barber-cave | Add app/robots.ts; disallow /api/, /_next/; reference sitemap. |
| No opengraph-image | firm, riley-day-care, the-barber-cave | Add app/opengraph-image.tsx (static or ImageResponse) for shareable apps. |
| No JSON-LD | firm (and client apps if SEO desired) | Add LocalBusiness or similar schema in layout or key pages. |
| Full metadata shape | All public apps | Optionally add openGraph.images, twitter, robots, verification where GUIDE shows. |

### 4.2 Security headers (GUIDE + research: follow GUIDE)

| Gap | Apps affected | Action |
|-----|----------------|--------|
| No headers at all | firm | Add full set: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy (incl. interest-cohort=()), CSP, HSTS (production). |
| No HSTS | agency-admin, riley-day-care, the-barber-cave | Add Strict-Transport-Security when served over HTTPS. |
| No interest-cohort | agency-admin, riley-day-care, the-barber-cave | Add interest-cohort=() to Permissions-Policy. |

### 4.3 Forms and validation (GUIDE + research: hybrid — keep Server Actions, add Zod + honeypot)

| Gap | Apps affected | Action |
|-----|----------------|--------|
| No Zod in Server Actions | firm, riley-day-care, the-barber-cave (contact) | Validate FormData with Zod in action; return field-level errors. |
| No honeypot | firm, riley-day-care, the-barber-cave (contact) | Add hidden honeypot field; return success without persisting when filled. |
| No thank-you route | firm | Add /thank-you; redirect or link after contact success; wire conversion tracking. |
| No booking/success | firm | Add /booking/success if booking flow uses success_url; point Stripe or widget to it. |

### 4.4 Rendering and static generation (GUIDE: generateStaticParams for dynamic routes; ISR where appropriate)

| Gap | Apps affected | Action |
|-----|----------------|--------|
| No generateStaticParams | firm (blog/[slug]), riley-day-care (blog/[slug]) | Export generateStaticParams returning known slugs (from data or CMS) for SSG. |
| No revalidate on blog | firm, riley-day-care | Set revalidate on blog listing and blog [slug] (e.g. 3600) if content can change. |
| Only services has revalidate | firm | Keep; optionally add revalidate to about/home if they become dynamic. |

### 4.5 Loading and error boundaries (GUIDE + deviations: root loading/error for key apps)

| Gap | Apps affected | Action |
|-----|----------------|--------|
| No root loading.tsx | firm, riley-day-care, the-barber-cave | Add app/loading.tsx for suspense fallback (TASK-13). |
| No root error.tsx | firm, riley-day-care, the-barber-cave | Add app/error.tsx with 'use client' and reset (TASK-13). |

### 4.6 Conventions and forbidden patterns (GUIDE)

| Gap | Apps affected | Action |
|-----|----------------|--------|
| Internal `<a>` instead of Link | riley-day-care, the-barber-cave (auth pages) | Replace with next/link (TASK-12). |
| No data-testid for E2E | firm (contact success, mobile menu) | Add data-testid for success message and mobile menu (TASK-09). |

### 4.7 API and integration (GUIDE + PACKAGES_ANALYSIS)

| Gap | Apps affected | Action |
|-----|----------------|--------|
| DORA API returns mock | agency-admin | Wire @agency/metrics or remove dep and document (TASK-17). |
| Cost routes don't use @agency/monitoring | agency-admin | Wire monitoring or remove dep (TASK-17). |
| API routes without Zod | agency-admin (costs, metrics/dora) | Validate query/body with Zod; return 400 on failure (TASK-14). |

---

## 5. Checklist: app-by-app actions

### firm
- [ ] Add metadataBase to root layout (env-based).
- [ ] Add sitemap.ts and robots.ts.
- [ ] Add opengraph-image.tsx (static or dynamic).
- [ ] Add security headers in next.config (full set including HSTS and interest-cohort).
- [ ] Add root loading.tsx and error.tsx.
- [ ] Add Zod validation and honeypot to contact Server Action.
- [ ] Add /thank-you route and wire from contact success.
- [ ] Add /booking/success if booking success_url is used.
- [ ] Add JSON-LD (e.g. LocalBusiness) in layout or homepage.
- [ ] Consider generateStaticParams for blog/[slug] and revalidate for blog pages.
- [ ] Add data-testid to contact success and mobile menu; expand Playwright tests.

### agency-admin
- [ ] Add HSTS and interest-cohort to next.config headers.
- [ ] Add Zod validation to API routes (costs, metrics/dora).
- [ ] Wire @agency/metrics to DORA route or remove @agency/metrics dep.
- [ ] Wire @agency/monitoring to cost routes or remove @agency/monitoring dep.

### riley-day-care
- [ ] Replace internal `<a>` with Link in (auth)/login and (auth)/signup pages.
- [ ] Add HSTS and interest-cohort to next.config headers.
- [ ] If app is indexable: add metadataBase, sitemap.ts, robots.ts; add Zod + honeypot to contact.
- [ ] Optional: root loading.tsx and error.tsx.

### the-barber-cave
- [ ] Replace internal `<a>` with Link in (auth)/login and (auth)/signup pages.
- [ ] Add HSTS and interest-cohort to next.config headers.
- [ ] If app is indexable: add metadataBase, sitemap.ts, robots.ts; add Zod + honeypot to contact.
- [ ] Optional: root loading.tsx and error.tsx.

---

## 6. Reference: GUIDE and research sources

- **GUIDE (docs/GUIDE.md):** Part 7 (code quality), Part 8 (Next.js, metadata, sitemap, robots, opengraph-image), Part 12 (SEO, JSON-LD), Part 17 (performance), Part 20 (Playwright), Part 26/27 (checklists). Pre-launch: metadataBase, sitemap, robots, OG image, security headers.
- **GUIDE_DEVIATIONS_ANALYSIS.md:** Sections 3–6 (structure, metadata, forms, SEO, security), Section 30 (revalidation, Playwright, schema, thank-you/booking), Research and recommendations (03/2026), Path to perfection checklist.
- **PACKAGES_ANALYSIS.md:** Which packages are used by which app; metrics/monitoring unused in agency-admin; API validation.
- **TODO.md:** TASK-01 (headers), TASK-02 (metadataBase, sitemap, robots), TASK-06 (Zod + honeypot), TASK-09 (Playwright, data-testid), TASK-10 (thank-you, booking/success, revalidate), TASK-12 (internal Link), TASK-13 (loading/error), TASK-14 (API Zod), TASK-17 (metrics/monitoring).

---

*Assessment covers all four apps against GUIDE and research. Implementation order follows TODO.md priority (P0 → P1 → P2).*
