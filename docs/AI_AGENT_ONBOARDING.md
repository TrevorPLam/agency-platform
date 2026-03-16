# AI / Agent Onboarding

This document gives AI coding agents (Cursor, Windsurf, etc.) enough context to work safely in the agency monorepo without breaking conventions or tenant isolation.

## Repository layout

- **`apps/`** — Deployable applications. Do not import from one app into another.
  - `apps/firm` — Agency marketing site
  - `apps/agency-admin` — Internal multi-tenant dashboard (session refresh + tenant headers)
  - `apps/prospective-clients/<slug>` — Demo/test client sites (e.g. `riley-day-care`, `the-barber-cave`)
  - `apps/clients/<slug>` — Production client sites (one directory per client)
- **`packages/`** — Shared code only. All apps depend on packages; packages never depend on apps.
  - `@agency/ui` — Shared UI components (shadcn-style), `cn()` utility
  - `@agency/database` — Supabase client factories, auth helpers, tenant resolution, RLS-aware types
  - `@agency/analytics` — PostHog client/server
  - `@agency/design-tokens` — Style Dictionary v4; primitive/semantic/component + per-client tokens
  - `@agency/booking` — Embeddable booking widget types, schema (Zod), and widget component
  - `@agency/typescript-config`, `@agency/eslint-config` — Shared configs
- **`supabase/`** — Migrations and pgTAP tests. Tenant isolation is enforced via RLS; `tenant_id` in JWT `app_metadata` only.
- **`scripts/`** — `scaffold-client.ts` (run with `pnpm scaffold`) creates a new client app and updates root `tsconfig.json`.

## Adding a new client site

1. Run **`pnpm scaffold`** from the repo root. The script will:
   - Create the app under `apps/prospective-clients/<slug>` or `apps/clients/<slug>`
   - Copy from the template `apps/prospective-clients/riley-day-care`
   - Create client token file and add a reference in root `tsconfig.json`
   - Run `pnpm install` and `pnpm tokens:build`
2. **Do not** create client apps by hand; use the scaffold so references and tokens stay in sync.
3. After scaffolding, follow the printed “Next steps” (tenant row in Supabase, Vercel project, env vars).

## Rules agents must follow

- **Shared code** lives only in `packages/`. Never import from `apps/*` inside another app or inside a package.
- **Tenant identity** is always from **`app_metadata.tenant_id`** (UUID) in the JWT. Never use `user_metadata` for tenant; never trust tenant from request headers for auth/RLS (headers are for convenience after middleware resolution).
- **Supabase**: Use `createSupabaseServerClient` / `createSupabaseBrowserClient` from `@agency/database`; never instantiate Supabase directly in app code. Never expose the service role key or put it in `NEXT_PUBLIC_*` variables.
- **Design tokens**: Tailwind v4 uses `@theme {}` and `var(--token-name)`; no `tailwind.config.js`, no `theme()` in CSS. Client-specific tokens live in `packages/design-tokens/tokens/clients/<slug>.json` and are built to each app’s `tokens/` directory (output dir is derived from app location; no hardcoded slug list).
- **Cursor/Windsurf**: Project rules in `.cursor/rules/*.mdc` and `.windsurf/rules/` encode stack and conventions; respect them (e.g. base.mdc, database.mdc, rls.mdc, frontend.mdc, tokens.mdc).

## Common agent tasks

- **Add a new client site:** Run `pnpm scaffold` (interactive or env-driven: `SCAFFOLD_SLUG`, `SCAFFOLD_NAME`, `SCAFFOLD_INDUSTRY`, `SCAFFOLD_DOMAIN`, `SCAFFOLD_PROSPECTIVE`). Do not create client apps by hand; the scaffold creates the app, token file, and tsconfig reference. Then follow the printed next steps (Supabase tenant row, Vercel project, env vars).
- **Update an existing client site:** Edit under `apps/prospective-clients/<slug>` or `apps/clients/<slug>`. If you change branding, update `packages/design-tokens/tokens/clients/<slug>.json` and run `pnpm tokens:build`. If you change tenant metadata, update Supabase `tenants` (and any RLS-affected data) accordingly.
- **Add a shared component:** Add or edit components in `packages/ui` under `src/components/atoms/`, `molecules/`, or `organisms/` (Atomic Design). Use the lowest level that fits; promote when a pattern repeats. Use them in any app via `import { … } from '@agency/ui'`. Ensure consuming apps have `@source` in globals.css pointing at `packages/ui` so Tailwind scans the package. See `packages/ui/src/components/README.md`, `.cursor/rules/frontend.mdc`, and `tokens.mdc`.

## Useful commands

- `pnpm dev` — Run all apps in watch mode
- `pnpm turbo run dev --filter=@agency/<slug>` — Run one client app
- `pnpm scaffold` — Create a new client app (interactive or env-driven)
- `pnpm tokens:build` — Rebuild design tokens (including per-client CSS)
- `pnpm turbo run build --affected` — Build only changed packages/apps
- `supabase test db` — Run RLS pgTAP tests
