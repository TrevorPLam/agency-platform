# Day Care Template and New Client Creation

## Option A layout

- **Production clients** live under `apps/clients/` (empty until first go-live).
- **Prospective (demo) clients** live under `apps/prospective-clients/` (e.g. `riley-day-care`, `the-barber-cave`).

The **Day Care Template** in this repo is **Riley Day Care** at `apps/prospective-clients/riley-day-care`.

## Creating a new day-care-style client

1. From the repo root, run:
   ```bash
   pnpm scaffold
   ```
2. When prompted:
   - **Client display name:** e.g. "Sunshine Day Care"
   - **Client slug:** e.g. `sunshine-day-care` (kebab-case)
   - **Industry:** e.g. `general` or a future "daycare" option if added
   - **Production domain:** e.g. `sunshinedaycare.com`
   - **Prospective (demo) or real client?** Answer **p** for prospective (demo) or **r** for real (production under `apps/clients/`).
3. The script uses **Riley Day Care** as the template (see `scripts/scaffold-client.ts`). It copies from `apps/prospective-clients/riley-day-care/` and substitutes the new slug and name in `package.json`, layout, and token references.
4. After scaffolding:
   - Add a token file: `packages/design-tokens/tokens/clients/[slug].json` (copy from `riley-day-care.json` and adjust brand colours).
   - Run `pnpm install` and `pnpm tokens:build`.
   - Add the tenant to the database and configure env (Supabase, PostHog, etc.) per the main onboarding checklist.

A dedicated "day care" scaffold variant (e.g. a flag or template name in the script) can be added later if you want to distinguish day-care clients from other verticals at scaffold time.
