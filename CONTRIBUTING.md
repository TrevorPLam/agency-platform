# Contributing to Agency Platform

This document covers everything you need to get running locally and contribute correctly. For tool versions and verification, see [TOOLCHAIN.md](./TOOLCHAIN.md). For high-level architecture, see [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md).

---

## Prerequisites and first-run setup

1. **Install required tools** (see [TOOLCHAIN.md](./TOOLCHAIN.md)):
   - Node.js 22.x LTS: `nvm install 22 && nvm use 22`
   - pnpm 10.x: `npm install -g pnpm@latest`
   - Turborepo: `pnpm add -g turbo` (or `npm install -g turbo`)
   - Supabase CLI: `npm install -g supabase`
   - Docker Desktop (required for `supabase start`)

2. **Clone and install dependencies**

   ```bash
   git clone <repository-url>
   cd agency-platform
   nvm use 22   # or fnm use 22
   pnpm install
   ```

   All dependencies use the **catalog** in `pnpm-workspace.yaml` — versions are centralised there. Internal packages use `workspace:*`. Do not add version strings to `package.json` for catalogued packages; use `catalog:` and add the entry to the root catalog if needed. See [docs/PNPM_NOTES.md](./docs/PNPM_NOTES.md) for the `catalogMode: strict` workaround.

3. **Git performance optimization**

   ```bash
   # Apply Git performance optimizations for large repositories
   ./scripts/setup/git-config.sh
   
   # Enable background maintenance
   git maintenance register
   git maintenance start
   
   # Verify performance
   ./scripts/benchmark/git-performance.ts
   ```

   For detailed Git performance guidance, see [docs/development/GIT_PERFORMANCE.md](./docs/development/GIT_PERFORMANCE.md).

4. **Environment setup**

   ```bash
   cp .env.local.example .env.local
   ```

   Edit `.env.local` with your values (per machine; file is gitignored). Copy Supabase URL and keys from the output of `supabase start` for local development, or use production keys if you use a linked remote project. See [docs/SUPABASE_LOCAL.md](./docs/SUPABASE_LOCAL.md) for local Supabase steps.

---

## Full local stack startup sequence

Run these in order when starting a full local development session.

```bash
# Step 1: Start Supabase (requires Docker)
supabase start

# Step 2: Apply latest migrations (if any new since last start)
supabase db reset

# Step 3: Start all apps in parallel
pnpm dev

# Step 4: Start Inngest dev server (separate terminal)
npx inngest-cli@latest dev -u http://localhost:3001/api/inngest

# Step 5: Compile design tokens (if token JSON changed)
pnpm tokens:build
```

**Important:** (1) Start Supabase before `pnpm dev` or app DB calls will fail. (2) After changing any file under `packages/design-tokens/tokens/**/*.json`, run `pnpm tokens:build` or client apps will use stale CSS. (3) After adding or changing migrations, run `pnpm db:generate-types` and commit the updated `packages/database/src/types.ts`.

---

## Port assignments

| Port  | Service                   |
| ----- | ------------------------- |
| 3000  | firm (agency marketing)   |
| 3001  | agency-admin app          |
| 3002  | riley-day-care client app |
| 3003  | the-barber-cave client app |
| 54321 | Supabase API              |
| 54323 | Supabase Studio           |
| 8288  | Inngest dev UI            |

To run a single app: `pnpm turbo run dev --filter=@agency/<name>` (e.g. `--filter=@agency/firm`).

To run **Storybook** for the shared UI component library (after `pnpm tokens:build`): `pnpm turbo run storybook --filter=@agency/ui`, or from `packages/ui`: `pnpm storybook`. Build static docs with `pnpm build-storybook` from `packages/ui`.

---

## Migration workflow

1. **Create** a new migration under `supabase/migrations/` with the next sequential number (e.g. `010_my_feature.sql`).
2. **Test locally:** `supabase db reset` then `supabase test db`. All pgTAP tests must pass.
3. **Update types:** `pnpm db:generate-types` and commit `packages/database/src/types.ts`.
4. **Commit** the migration file and the updated types (and see non-negotiable requirements below).
5. **CI** runs on every PR: types drift check, RLS tests, affected build/lint/type-check.
6. **On merge to `main`:** If the PR changed `supabase/migrations/**`, the deploy workflow runs `supabase db push` to apply migrations to the linked production project.

---

## Non-negotiable contribution requirements (migrations)

- **Every new migration** that adds or removes a **public table** must:
  1. Update `supabase/tests/EXPECTED_TABLE_COUNT.txt` to the new integer count of public tables.
  2. Add at least four pgTAP assertions in `supabase/tests/database/01-tenant-isolation.sql` (one per CRUD operation) for the new table.
- **Every new tenant-scoped table** must have the full RLS checklist: RLS enabled, `tenant_id` index, all four policy types (SELECT, INSERT, UPDATE, DELETE) using `public.tenant_id()`. See `.cursor/rules/rls.mdc` and the RLS policy template in `.cursor/rules/database.mdc`.

A PR that adds a migration without updating `EXPECTED_TABLE_COUNT.txt` and adding the corresponding pgTAP tests will fail CI when the table count or tests do not match.

---

## Onboarding a new client

Use the full checklist in [docs/ONBOARDING_CHECKLIST.md](./docs/ONBOARDING_CHECKLIST.md). In short:

1. Run `pnpm scaffold` and choose **prospective** (demo) or **real** (production). Prospective apps go to `apps/prospective-clients/[slug]/`, production to `apps/clients/[slug]/`.
2. Edit `packages/design-tokens/tokens/clients/[slug].json` with a distinct palette, then run `pnpm tokens:build`.
3. Add the tenant row (e.g. in `supabase/seed.sql` for local/CI), create an admin user, run `supabase test db` and `pnpm turbo run build --affected`.
4. Human steps: Vercel project, deploy, cross-tenant isolation test, document timing.

---

## Scaffolding a new client app

```bash
pnpm scaffold
```

Follow the prompts: display name, slug (kebab-case), industry, domain. The script creates the app under `apps/prospective-clients/[slug]/` or `apps/clients/[slug]/`, a token file placeholder, and tokens output directory. Then edit the client token JSON, run `pnpm tokens:build`, add the tenant to the DB and seed, and run RLS tests.

---

## Generating database types

After changing the schema (new migration or edits to existing migrations), regenerate TypeScript types:

```bash
# With local Supabase running (supabase start or supabase db start + supabase db reset)
pnpm db:generate-types
```

This overwrites `packages/database/src/types.ts`. Commit the updated file. CI will fail if a PR changes migrations but does not update `types.ts` (types drift check).

---

## Formatting

- **Check:** `pnpm format:check` (fails if any file is not formatted).
- **Fix:** `pnpm format` (writes Prettier output to all supported files).

Prettier is enforced in CI. Use the repo's `prettier.config.mjs` (semi: false, singleQuote: true, trailingComma: 'es5', printWidth: 100). Tailwind class names are auto-sorted via `prettier-plugin-tailwindcss`. See [.prettierignore](./.prettierignore) for exclusions.

---

## Style drift prevention

Prefer **design tokens** over arbitrary Tailwind values: use token-based spacing, colors, and typography (e.g. from `@agency/design-tokens`) instead of arbitrary values like `w-[17px]` or `text-[#abc]` where an equivalent token exists. This keeps client sites aligned with the design system and makes global changes safe. An optional ESLint rule (e.g. `eslint-plugin-tailwindcss` with `flat/recommended`, or a custom rule limiting arbitrary values) can be added to enforce this; see [packages/eslint-config](./packages/eslint-config) and [docs/RESEARCH_MARKETING_MONOREPO_DESIGN_2026.md](./docs/RESEARCH_MARKETING_MONOREPO_DESIGN_2026.md) (style drift prevention).

---

## Git Performance and Maintenance

### Regular Maintenance

Keep the repository performing optimally with regular maintenance:

```bash
# Weekly maintenance
git maintenance run
git fetch --prune

# Monthly deep clean
./scripts/maintenance/git-gc.sh
./scripts/audit/repository-audit.ts

# Performance monitoring
./scripts/benchmark/git-performance.ts --save
```

### Performance Issues

If Git operations feel slow:

```bash
# Quick performance check
./scripts/benchmark/git-performance.ts

# Run maintenance
git maintenance run --all

# Aggressive cleanup (if needed)
./scripts/maintenance/git-gc.sh --aggressive
```

### Repository Health

Monitor repository health with automated tools:

```bash
# Comprehensive audit
./scripts/audit/repository-audit.ts

# Performance trends
./scripts/benchmark/git-performance.ts --trends
```

For complete Git performance guidance, see [docs/development/PERFORMANCE_GUIDE.md](./docs/development/PERFORMANCE_GUIDE.md).

---

## Versioning and releases

Design-system packages (`@agency/ui`, `@agency/design-tokens`) use **Changesets** for changelogs and semver bumps. When your PR changes one of these packages, add a changeset from the repo root: `pnpm changeset` (choose packages and bump type, then commit the new file under `.changeset/`). To apply changesets and update versions/changelogs before a release: `pnpm version`. Full policy (semver meaning, breaking vs non-breaking, support window) is in [docs/VERSIONING.md](./docs/VERSIONING.md). See also [docs/RESEARCH_MARKETING_MONOREPO_DESIGN_2026.md](./docs/RESEARCH_MARKETING_MONOREPO_DESIGN_2026.md) §3a.

---

## 🌿 Branch Naming Conventions

All branches must follow our naming conventions to maintain organization and enable automation:

### ✅ Valid Branch Name Patterns
- `feature/branch-name` - New features
- `feat/branch-name` - New features (short)
- `fix/branch-name` - Bug fixes
- `bugfix/branch-name` - Bug fixes (long)
- `hotfix/branch-name` - Critical fixes
- `release/branch-name` - Release preparation
- `rel/branch-name` - Release preparation (short)
- `chore/branch-name` - Maintenance tasks
- `docs/branch-name` - Documentation changes
- `style/branch-name` - Code style changes
- `refactor/branch-name` - Code refactoring
- `test/branch-name` - Test additions
- `deploy/branch-name` - Deployment configurations

### 📝 Branch Name Rules
- Use lowercase letters, numbers, and hyphens only
- No spaces or special characters except hyphens
- Be descriptive but concise
- Examples: `feature/user-authentication`, `fix/login-bug`, `hotfix/security-patch`

### 🔧 Branch Validation
Branch names are automatically validated by GitHub Actions. Invalid branch names will be rejected with helpful feedback.

---

## 📋 Pull Request Templates

Use our comprehensive PR templates to ensure all required information is included:

### 📝 Required Information
- Related issue numbers
- Clear description of changes
- Type of change (bug fix, feature, etc.)
- Testing checklist
- Security considerations
- Documentation updates

### 🎯 PR Types
- 🐛 Bug fix
- ✨ New feature
- 💥 Breaking change
- 📚 Documentation update
- 🛠️ Refactor
- 🔧 Configuration change
- 🧪 Test addition

### 📊 Review Process
All PRs must pass:
- Format check (`pnpm format:check`)
- Linting (`pnpm lint`)
- Type checking (`pnpm type-check`)
- Tests (`pnpm test`)
- Security scans
- RLS tests (if database changes)

---

## 🧹 Branch Maintenance

### 📅 Stale Branch Cleanup
- Stale branches (90+ days inactive) are automatically cleaned up weekly
- Branches with open PRs are protected from deletion
- Owners are notified before branch deletion
- Protected branches: `main`, `develop`, `staging`, `production`

### 🔄 Merge Queue
- High-traffic branches use merge queues to prevent conflicts
- PRs are validated in queue order
- Failed PRs are automatically removed from queue
- Queue health is monitored continuously

---

## 📦 Dependency Management

### 🤖 Automated Updates
- **Daily**: Production dependency updates
- **Weekly**: Development dependency updates
- **Weekly**: GitHub Actions updates
- **Security**: Immediate vulnerability fixes

### 🔍 Dependency Reports
- Comprehensive dependency reports generated weekly
- Security vulnerability monitoring
- License compliance checking
- Update recommendations

### 📋 Update Categories
- 🟢 **Patch updates**: Auto-merged if tests pass
- 🟡 **Minor updates**: Require review
- 🔴 **Major updates**: Require planning and testing

---

## Day-to-day workflow summary

1. Start Supabase and run `supabase db reset` if migrations changed.
2. Run `pnpm tokens:build` if token JSON changed.
3. Run `pnpm dev` for apps; run Inngest dev server in a separate terminal if working on background jobs.
4. Before committing: `pnpm format:check`, and after migration changes: `pnpm db:generate-types` and commit `types.ts`.
5. Open a PR; CI runs affected build, lint, type-check, test, format check, security scans, types drift check, and RLS tests.
6. Follow branch naming conventions and use PR templates for consistency.
