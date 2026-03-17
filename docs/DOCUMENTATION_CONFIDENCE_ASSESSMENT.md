# Documentation Confidence Assessment

**Date:** March 2026  
**Scope:** All workspace documentation (README, CONTRIBUTING, TOOLCHAIN, docs/, .cursor/rules, package READMEs)  
**Goal:** 100% confidence assessment — what matches the codebase, what does not, and what is missing.

**Updates applied (March 2026):** CONTRIBUTING governance commands changed to `pnpm exec tsx scripts/governance/...`; table count docs updated to reference `00-rls-coverage.sql`; platform metrics set to 14 packages; setup wording tidied (repository root, unified Turborepo install in TOOLCHAIN). **Consolidation (March 2026):** Single-source-of-truth established; README and docs/README trimmed; PERFORMANCE and workflow docs deduplicated; Windsurf rules point to .cursor/rules; confidence assessment updated.

---

## Executive Summary

| Category | Confidence | Notes |
|----------|------------|--------|
| **Architecture & structure** | High (~95%) | ARCHITECTURE is canonical; README and docs/README link to it. Platform metrics in docs/README (14 packages). |
| **Setup & toolchain** | High (~90%) | TOOLCHAIN for versions/install; CONTRIBUTING links to it and to PERFORMANCE for Git/IDE tuning. |
| **Security & RLS** | High (~95%) | MULTI_TENANT_SECURITY, SECURITY.md, Supabase keys, port 6543 vs 54322 correctly scoped. |
| **Operations & deployment** | High (~90%) | DEPLOYMENT, SUPABASE_LOCAL, BACKGROUND_JOBS, runbooks align with repo. |
| **Development workflows** | High (~85%) | CONTRIBUTING is single place for branch/PR/dependency workflow; governance commands use tsx invocations; PERFORMANCE linked not duplicated. |
| **Package inventory** | High (~90%) | docs/README "Current Status" is the only place for app/package/table counts; reminder to update when adding. (Previously: docs listed 6–7 packages; repo has 14.) Architecture “what to use” list is correct; platform metrics are not. |

**Overall:** Documentation is in much better shape after consolidation. Single-source-of-truth is documented below; a full script/CI verification pass would raise confidence to 100%.

---

## What Matches (High Confidence)

- **Monorepo layout:** `apps/firm`, `apps/agency-admin`, `apps/prospective-clients/{riley-day-care,the-barber-cave}`, `apps/clients/` (empty), and `packages/*` match ARCHITECTURE and README.
- **App count:** 4 apps documented and present (firm, agency-admin, riley-day-care, the-barber-cave).
- **Port assignments:** CONTRIBUTING ports (3000–3003, 54321, 54323, 8288) and SUPABASE_LOCAL (54321 API, 54323 Studio) match. Base rule “Port 6543 (Supavisor)” correctly refers to production/Supavisor; local Postgres 54322 is used only in verify-rls-indexes examples.
- **Supabase:** Local vs production keys (SUPABASE_KEYS.md), RLS and tenant from `app_metadata` (SECURITY.md, MULTI_TENANT_SECURITY), and migration workflow match code and rules.
- **Design system:** Atomic Design (ATOMIC_DESIGN, packages/ui README), three-tier tokens, Style Dictionary v4, Tailwind v4, `var(--token-name)` and no `theme()` in CSS are consistent across docs and .cursor/rules.
- **Stack versions:** Next.js 16.1, React 19, Turborepo 2.7, pnpm 10, catalog in pnpm-workspace.yaml align with README, TOOLCHAIN, and base rules.
- **Scripts that exist and are documented:** `pnpm dev`, `pnpm build`, `pnpm scaffold`, `pnpm tokens:build`, `pnpm db:generate-types`, `pnpm format` / `pnpm format:check`, `pnpm changeset`, `pnpm version`. Performance scripts (git-tuning.sh, sparse-checkout.sh, ide-optimization.ts, dx-monitor.ts) exist under `scripts/performance/`. `verify-rls-indexes.sql` exists; docs/README and MULTI_TENANT_SECURITY point to it correctly.
- **RLS table count:** Enforced in `supabase/tests/database/00-rls-coverage.sql` with literal `7`; test structure matches CONTRIBUTING’s RLS and migration requirements.

---

## Gaps and Inaccuracies (Reduce Confidence)

### Previously fixed (March 2026)

- **Governance commands:** CONTRIBUTING now uses `pnpm exec tsx scripts/governance/...` (manage-properties, compliance-automation, risk-assessment) and `pnpm turbo run validate-properties --filter=@agency/governance`.
- **Table count:** CONTRIBUTING and PR template now say to update the expected table count in `supabase/tests/database/00-rls-coverage.sql` (no EXPECTED_TABLE_COUNT.txt).
- **Platform metrics:** docs/README Current Status shows 14 packages and includes a reminder to update when adding apps, packages, or public tables.
- **Clone / setup wording:** README and CONTRIBUTING use repository root with a note that the clone directory name may vary.
- **Turborepo install:** TOOLCHAIN and CONTRIBUTING both recommend `pnpm add -g turbo` or `npm install -g turbo`.

---

### Remaining (low impact)

CONTRIBUTING and the PR template say:

- “Update `supabase/tests/EXPECTED_TABLE_COUNT.txt` to the new integer count of public tables.”
- CI is described as failing if this file is not updated.

**Reality:** There is **no** `EXPECTED_TABLE_COUNT.txt` in the repo. The expected table count is enforced **inside** `supabase/tests/database/00-rls-coverage.sql` as the literal `7` in `select plan(9);` and the assertion “Expected exactly 7 tables in public schema”.

**Fix:** Either (a) create `EXPECTED_TABLE_COUNT.txt` and add a CI step that compares it to the pgTAP expectation, or (b) update CONTRIBUTING and the PR template to say “update the expected table count in `supabase/tests/database/00-rls-coverage.sql`” (and remove references to EXPECTED_TABLE_COUNT.txt).

---

### 3. Package count (docs/README platform metrics) — **Stale**

docs/README says: “**Packages:** 7 shared packages (@agency/*)”.

**Reality:** There are **14** packages under `packages/`: analytics, artifacts, booking, database, design-tokens, email, eslint-config, governance, knowledge, metrics, monitoring, security, typescript-config, ui.

**Fix:** Update docs/README “Current Status” to “14 shared packages” (or the current count) and optionally list them or link to a single source of truth (e.g. pnpm-workspace or ARCHITECTURE).

---

### 4. Clone / directory name — **Minor**

README and CONTRIBUTING say `cd agency-platform` after clone. The repo `package.json` name is `"agency-platform"`, but the workspace path may be different (e.g. `firm`). This can confuse new contributors.

**Fix:** Use “repository root” or “monorepo root” in place of “agency-platform”, or add a note: “Clone directory may differ (e.g. `firm`); all commands run from the repository root.”

---

### 5. Turborepo install (CONTRIBUTING vs TOOLCHAIN) — **Minor**

- CONTRIBUTING: “Turborepo: `pnpm add -g turbo` (or `npm install -g turbo`)”
- TOOLCHAIN: “Turborepo … `npm install -g turbo`”

**Fix:** Use one recommended approach (e.g. “`pnpm add -g turbo` or `npm install -g turbo`”) in both files.

---

### 6. PERFORMANCE.md maintenance scripts — **Verify**

CONTRIBUTING and PERFORMANCE reference:

- `./scripts/maintenance/git-gc.sh`
- `./scripts/audit/repository-audit.ts`
- `./scripts/benchmark/git-performance.ts`

**Reality:** These files exist under `scripts/`. No inconsistency found; only worth a quick run to confirm they execute as described.

---

## Single-source-of-truth (post-consolidation)

| Topic | Canonical location |
|-------|--------------------|
| Monorepo structure (apps/packages, isolation) | docs/architecture/ARCHITECTURE.md |
| Platform metrics (app count, package count, table count) | docs/README.md "Current Status" |
| Prerequisites and tool versions | TOOLCHAIN.md |
| First-run and daily workflow | CONTRIBUTING.md |
| Performance (Git, sparse checkout, IDE) | docs/development/PERFORMANCE.md |
| Branch/PR/dependency workflow | CONTRIBUTING.md |
| Atomic Design (levels + in-repo rules) | docs/architecture/ATOMIC_DESIGN.md |
| Agent/IDE rules (stack, RLS, tokens) | .cursor/rules/ (Windsurf points here) |

**Post-consolidation maintenance:** When adding packages, apps, or public tables, update only docs/README platform metrics. When changing conventions (stack, RLS, tokens), update .cursor/rules (and TOOLCHAIN if tool versions change); Windsurf rules reference Cursor rules. Keep structure and workflow in ARCHITECTURE and CONTRIBUTING only; do not duplicate structure or setup in the root README.

---

## Coverage and Consistency Notes

- **ARCHITECTURE “what to use” list:** Correctly includes `@agency/ui`, `@agency/database`, `@agency/analytics`, `@agency/email`, `@agency/booking`, and design-tokens. It is a subset of packages to use from apps, not a full package inventory; keeping it as-is is fine if platform metrics are fixed.
- **Research and guides:** RESEARCH_TOPICS_2026, RESEARCH_MARKETING_MONOREPO_DESIGN_2026, MULTI_SITE_SCALE_AND_FLEXIBLE_UI, CLIENT_ONBOARDING, AI_DEVELOPMENT_GUIDE are consistent with architecture and stack. Links from docs/README and research/README resolve.
- **Knowledge management:** docs/knowledge-management/README correctly states the feature is “planned” and points to AI_DEVELOPMENT_GUIDE.
- **.cursor/rules:** base.mdc, database.mdc, frontend.mdc, rls.mdc, tokens.mdc align with ARCHITECTURE, SECURITY, and CONTRIBUTING (tenant from app_metadata, port 6543, no theme() in CSS, tw-animate-css, etc.).

---

## Recommendations for 100% Confidence

1. **Light verification pass:** Run each documented script path and command once (e.g. in a clean clone) and fix any failures or path errors.
2. Optionally add a short "Last verified" line in README or CONTRIBUTING to maintain confidence over time.
3. _Removed (done)._ Set “Packages” in docs/README to the actual count (14) and keep it updated when adding/removing packages.
4. _Removed (done)._ Prefer “repository root” and/or note that the clone directory name may vary.
5. _Removed (done)._ Same sentence in CONTRIBUTING and TOOLCHAIN.
6. _Duplicate of item 1._ Run each documented script path and command once (e.g. in a clean clone) and fix any failures or path errors.

After these changes, re-run this assessment and optionally add a short “Last verified” line in README or CONTRIBUTING (e.g. “Doc/script verification: YYYY-MM-DD”) to maintain confidence over time.

---

*This assessment was generated by analyzing the documentation tree and cross-referencing with package.json, pnpm-workspace.yaml, scripts/, apps/, packages/, supabase/tests/, and .cursor/rules. Updated after consolidation (March 2026).*
