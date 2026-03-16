# Agency Platform — Task List

**Firm domain:** `www.yourdedicatedmarketer.com` (root: `yourdedicatedmarketer.com`). Prospective client demos use subdomains (e.g. `riley-day-care.yourdedicatedmarketer.com`). See docs/DEPLOYMENT.md § Subdomains.

Use this file as the single source of truth for open tasks, priorities, and status. Update it when you complete work or add new items.

---

## Done (reference)

- [x] RLS tests: expected table count 7; policy assertions for `bookings` and `contact_submissions` in 00-rls-coverage.sql
- [x] pgTAP isolation tests for `bookings` and `contact_submissions` in 01-tenant-isolation.sql
- [x] The Barber Cave: middleware tenant-only (resolveTenantFromRequest, no auth redirects)
- [x] .env.local.example: NEXT_PUBLIC_TENANT_SLUG=riley-day-care; removed GUIDE.md/TODO.md dead doc refs
- [x] DEPLOYMENT.md: subdomains section (domain set to yourdedicatedmarketer.com)
- [x] Scaffold: copy (auth) routes + dashboard + auth actions from riley-day-care with slug replace
- [x] Agency-admin: Providers + initAnalytics('agency-admin') in layout

---

## Deploy and DNS

- [ ] Add DNS records at registrar: CNAME (or A) for `www.yourdedicatedmarketer.com`, `admin.yourdedicatedmarketer.com`, `riley-day-care.yourdedicatedmarketer.com`, `the-barber-cave.yourdedicatedmarketer.com` → Vercel targets per project
- [ ] Vercel: create/link projects for firm, agency-admin, riley-day-care, the-barber-cave; set Root Directory and build command (see docs/DEPLOYMENT.md); add env vars; add custom domains
- [ ] Supabase production: set `tenants.domain` for each client to full hostname (e.g. `riley-day-care.yourdedicatedmarketer.com`) or rely on subdomain→slug match
- [ ] Deploy: push to main; confirm all four apps build and respond on their URLs

---

## When you want consistent client behavior / first real client

- [ ] Riley Day Care: add spec content to docs/riley-day-care-spec.md and complete implementation checklist (content, pages, forms, blog, tokens, navigation)
- [ ] Agency-admin: add auth if dashboard must be restricted (e.g. Supabase session); add “internal only” or placeholder note on dashboard if needed

---

## Optional / later

- [ ] Firm: design-tokens client CSS (or keep hardcoded dark overrides for now)
- [ ] Agency-admin: “client list” or “tenants list” stub page (read from `tenants` with admin client)
- [ ] Shared: one-page doc or lib/cms.ts stub for future headless CMS (Contentful/Sanity/etc.)
- [ ] Unit tests for high-value paths (email, booking); Playwright smoke tests per app type
- [ ] Changesets: CI step or doc for version/publish if you release packages

---

## T-18 Cursor verification (optional)

When running the T-18 behavior tests (see docs/T18_VERIFICATION_PLAYBOOK.md and docs/AI_PROMPTING.md), check off steps here:

- [ ] T-18.08 — Migration (bookings-style) uses public.tenant_id(), CONCURRENTLY, four RLS policies
- [ ] T-18.09 — Server Component fetch with createSupabaseServerClient, no useEffect
- [ ] T-18.10 — Style with cn() and token-based classes
- [ ] T-18.11 — Animation with tw-animate-css
- [ ] T-18 complete (all four above checked)
