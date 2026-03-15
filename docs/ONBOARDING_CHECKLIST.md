# Client Onboarding Checklist

Step-by-step process to onboard a new prospective (demo) or production client. Target: under 2 hours with zero code changes for structural setup. Both **riley-day-care** and **the-barber-cave** are prospective clients under `apps/prospective-clients/`. Production clients go under `apps/clients/` (empty until first go-live).

---

## Agent steps (no manual file editing for structure)

### 1. Scaffold the app

From repo root:

```bash
pnpm scaffold
```

- Choose **prospective** (demo) or **real** (production). Prospective apps go to `apps/prospective-clients/[slug]/`, production to `apps/clients/[slug]/`.
- Enter display name, slug (kebab-case), industry, domain. Example for a second demo: name="The Barber Cave", slug="the-barber-cave", industry="general", domain="thebarbercave.com".
- Script creates the app skeleton, token file placeholder, and tokens output directory. Aborts if slug directory already exists.

### 2. Design tokens (distinct palette)

- Edit `packages/design-tokens/tokens/clients/[slug].json` with a **visually distinct** palette from existing clients (e.g. riley-day-care uses green/teal/blue; use different hue ranges).
- Build client tokens:

```bash
pnpm tokens:build
```

- Verify `apps/prospective-clients/[slug]/tokens/[slug].css` (or `apps/clients/[slug]/tokens/[slug].css`) exists.

### 3. HIPAA isolation (documentation)

- **Prospective/demo clients** share the platform for validation only; no PHI. See SECURITY.md Vector 5.
- **Healthcare clients with PHI** require a **dedicated Supabase project** and signed BAA before go-live. Do not onboard them on the shared RLS database.

### 4. Tenant row in database

- **Local:** Add the new tenant to `supabase/seed.sql` so `supabase db reset` (or `npx supabase db reset`) creates it:

```sql
INSERT INTO public.tenants (slug, domain, name, industry)
VALUES ('your-slug', 'yourdomain.com', 'Your Client Name', 'general')
ON CONFLICT (slug) DO NOTHING;
```

- Then run `npx supabase db reset` (or ensure migrations + seed have run). For CI/local tests, seed runs automatically with `supabase test db`.

### 5. Admin user for the tenant

From repo root with Supabase env vars set (e.g. copy from `apps/prospective-clients/riley-day-care/.env.local` or set `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`):

```bash
TENANT_SLUG=the-barber-cave pnpm exec tsx scripts/create-test-user.ts
# Optional: custom email/password
TENANT_SLUG=the-barber-cave pnpm exec tsx scripts/create-test-user.ts admin@thebarbercave.com YourPassword123!
```

- Creates a user with `app_metadata: { tenant_id, role: 'admin' }` and `tenant_users.role = 'admin'`. Default role is `admin`; override with `ROLE=member` if needed.

### 6. RLS tests (two tenants)

```bash
npx supabase test db
```

- All tests must pass. Seed must include both tenants (e.g. riley-day-care and the new slug) so isolation tests see two tenant rows where relevant.

### 7. Affected build

```bash
pnpm turbo run build --affected
```

- Only the new app and changed shared packages should rebuild. Unchanged apps (e.g. riley-day-care) should be cache hits when no inputs changed. If you see `spawn UNKNOWN` on Windows during Next.js TypeScript step, retry or run `pnpm turbo run build --filter=@agency/your-slug` for a single app.

---

## Human steps (deployment and validation)

### 8. Vercel project and deploy

- Create a Vercel project for the new app. Root directory: `apps/prospective-clients/[slug]` (or `apps/clients/[slug]`). Build command from repo root: `pnpm turbo run build --filter=@agency/[slug]`. Set all env vars from `.env.local.example`.
- Deploy and (optional) connect custom domain.

### 9. Cross-tenant isolation test

- Log in as a riley-day-care user in one browser and as the new client’s user in another. Confirm neither can see the other’s data (dashboard, posts, etc.).

### 10. Timing and bottlenecks

- Record wall-clock time for the full onboarding. Target: under 2 hours. Document any bottlenecks (e.g. token build, DB seed, Vercel config) in this checklist or in TODO.md T-23 implementation notes.

---

## References

- **Scaffold script:** `scripts/scaffold-client.ts` (T-19)
- **Token build:** `packages/design-tokens/scripts/build-clients.ts`; prospective slugs in `PROSPECTIVE_SLUGS`
- **Security and HIPAA:** SECURITY.md (Vector 5)
- **Deployment and cost cliff:** docs/DEPLOYMENT.md
