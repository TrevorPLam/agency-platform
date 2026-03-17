# TODO Refresh Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Update `TODO.md` so it accurately reflects the latest verified security, API, CI, and reliability findings with clear priority ordering and actionable acceptance criteria.

**Architecture:** Treat `TODO.md` as the single source of execution truth. Apply a minimal-diff documentation change that preserves existing roadmap structure while adding missing P0/P1 work and tightening existing task definitions. Validate changes via deterministic content checks (`rg`) so documentation quality is testable.

**Tech Stack:** Markdown, ripgrep (`rg`), pnpm/turbo command surface (for command references), Next.js 16/Supabase security standards context

---

### Task 1: Create a failing content-check for missing security findings

**Files:**
- Modify: `TODO.md`
- Test: `TODO.md` (content assertions via `rg`)

**Step 1: Write the failing test**

Run:

```bash
rg "tenant_id from query/body|IDOR|getAdminClient\\(\\) scoping|types\\.ts is empty" "TODO.md"
```

Expected: No matches (this confirms the current TODO does not include newly verified gaps).

**Step 2: Run test to verify it fails**

Run:

```bash
rg "tenant_id from query/body|IDOR|getAdminClient\\(\\) scoping|types\\.ts is empty" "TODO.md"
```

Expected: Exit code 1 / no output.

**Step 3: Write minimal implementation**

Insert this block under `## 2) True Codebase State (Verified)` in `TODO.md`:

```markdown
### Additional verified risk findings (03/2026 hard evidence pass)

- `apps/agency-admin/src/app/api/costs/*` currently trusts client-provided `tenant_id` (query/body) while using admin client access, which creates cross-tenant authorization risk.
- `apps/agency-admin/src/app/api/costs/recommendations/route.ts` PATCH updates by `id` without tenant scoping, creating IDOR-style risk.
- `apps/agency-admin/src/components/costs/cost-management-dashboard.tsx` calls cost APIs without required `tenant_id`, causing contract-level runtime failures.
- `packages/database/src/types.ts` is currently empty in this branch state, which can block affected build/type/test workflows.
```

**Step 4: Run test to verify it passes**

Run:

```bash
rg "tenant_id from query/body|IDOR|getAdminClient\\(\\) scoping|types\\.ts is empty" "TODO.md"
```

Expected: 4+ matching lines.

**Step 5: Commit**

```bash
git add TODO.md
git commit -m "docs: record verified multi-tenant and build blockers in TODO"
```

---

### Task 2: Replace current TASK-10 with authz-first API hardening scope

**Files:**
- Modify: `TODO.md`
- Test: `TODO.md` section `TASK-10`

**Step 1: Write the failing test**

Run:

```bash
rg "TASK-10: API validation in agency-admin routes|Zod validation added for query/body in costs/metrics endpoints" "TODO.md"
```

Expected: Existing wording is found (outdated scope).

**Step 2: Run test to verify it fails**

Run:

```bash
rg "TASK-10: API authorization and tenant isolation hardening \\(agency-admin costs\\)" "TODO.md"
```

Expected: No matches.

**Step 3: Write minimal implementation**

Replace the full `TASK-10` block with:

```markdown
## [ ] TASK-10: API authorization and tenant isolation hardening (agency-admin costs)

**Why:** Current cost routes trust client-provided `tenant_id` and are vulnerable to cross-tenant access/mutation.

**Definition of Done**
- All `apps/agency-admin/src/app/api/costs/*` handlers derive tenant scope from authenticated session (`app_metadata.tenant_id`) or a validated platform-admin path.
- No route authorizes tenant scope from query params/body alone.
- `recommendations` PATCH includes tenant-scoped update guards (no update by `id` alone).
- API handlers enforce auth directly (not only middleware redirect behavior).
- Validation remains in place, but authorization is the primary gate.

**Target Files**
- `apps/agency-admin/src/app/api/costs/summary/route.ts`
- `apps/agency-admin/src/app/api/costs/metrics/route.ts`
- `apps/agency-admin/src/app/api/costs/alerts/route.ts`
- `apps/agency-admin/src/app/api/costs/recommendations/route.ts`
- `packages/database/src/middleware.ts` (documentation/guard usage notes if needed)
```

**Step 4: Run test to verify it passes**

Run:

```bash
rg "TASK-10: API authorization and tenant isolation hardening \\(agency-admin costs\\)|recommendations PATCH includes tenant-scoped update guards" "TODO.md"
```

Expected: Matches found; old task wording removed.

**Step 5: Commit**

```bash
git add TODO.md
git commit -m "docs: retarget task-10 to authz-first cost api hardening"
```

---

### Task 3: Add a new P0 task for dashboard/API contract alignment

**Files:**
- Modify: `TODO.md`
- Test: `TODO.md` new task insertion

**Step 1: Write the failing test**

Run:

```bash
rg "TASK-10A: Cost dashboard and API contract alignment" "TODO.md"
```

Expected: No matches.

**Step 2: Run test to verify it fails**

Run:

```bash
rg "fetch\\('/api/costs/summary'\\)" "apps/agency-admin/src/components/costs/cost-management-dashboard.tsx"
```

Expected: Matches found, proving contract mismatch context exists.

**Step 3: Write minimal implementation**

Insert immediately after `TASK-10`:

```markdown
## [ ] TASK-10A: Cost dashboard and API contract alignment

**Why:** Dashboard calls and route contracts are currently inconsistent, creating guaranteed runtime errors.

**Definition of Done**
- Cost dashboard requests match route contract for tenant context and optional filters.
- Route contract is documented in code comments or shared schema location.
- Error UX for cost dashboard distinguishes auth/authorization failure vs transient backend failure.

**Target Files**
- `apps/agency-admin/src/components/costs/cost-management-dashboard.tsx`
- `apps/agency-admin/src/app/api/costs/summary/route.ts`
- `apps/agency-admin/src/app/api/costs/metrics/route.ts`
- `apps/agency-admin/src/app/api/costs/alerts/route.ts`
- `apps/agency-admin/src/app/api/costs/recommendations/route.ts`
```

**Step 4: Run test to verify it passes**

Run:

```bash
rg "TASK-10A: Cost dashboard and API contract alignment|Error UX for cost dashboard" "TODO.md"
```

Expected: Matches found.

**Step 5: Commit**

```bash
git add TODO.md
git commit -m "docs: add task for cost dashboard and api contract alignment"
```

---

### Task 4: Add a P0 reliability task for database type-generation blocker

**Files:**
- Modify: `TODO.md`
- Test: `TODO.md` + `packages/database/src/types.ts` state assertion

**Step 1: Write the failing test**

Run:

```bash
rg "TASK-10B: Database type generation and drift gate recovery" "TODO.md"
```

Expected: No matches.

**Step 2: Run test to verify it fails**

Run:

```bash
rg "." "packages/database/src/types.ts"
```

Expected: No matches if file is empty (current observed blocker condition).

**Step 3: Write minimal implementation**

Insert after `TASK-10A`:

```markdown
## [ ] TASK-10B: Database type generation and drift gate recovery

**Why:** Empty/stale generated DB types can block build/type-check/test and reduce confidence in schema safety.

**Definition of Done**
- `packages/database/src/types.ts` is generated and non-empty.
- Generation command and ownership are documented for contributors.
- CI type drift gate remains green with deterministic regeneration flow.

**Target Files**
- `packages/database/src/types.ts`
- `packages/database/package.json`
- `.github/workflows/ci.yml`
- `CONTRIBUTING.md`
```

**Step 4: Run test to verify it passes**

Run:

```bash
rg "TASK-10B: Database type generation and drift gate recovery|types\\.ts is generated and non-empty" "TODO.md"
```

Expected: Matches found.

**Step 5: Commit**

```bash
git add TODO.md
git commit -m "docs: add p0 task for db type-generation reliability gate"
```

---

### Task 5: Tighten dependency graph and critical path ordering

**Files:**
- Modify: `TODO.md`
- Test: `TODO.md` dependency section

**Step 1: Write the failing test**

Run:

```bash
rg "TASK-10A|TASK-10B" "TODO.md"
```

Expected: Matches exist (from previous tasks) but not yet in dependency chain.

**Step 2: Run test to verify it fails**

Run:

```bash
rg "TASK-10 -> TASK-10A -> TASK-10B -> TASK-11" "TODO.md"
```

Expected: No matches.

**Step 3: Write minimal implementation**

Update `## 5) Task Dependencies (Critical Path)` to include:

```markdown
5. `TASK-10` -> `TASK-10A` -> `TASK-10B` -> `TASK-11` for API correctness before broader confidence claims.
```

Also update the earlier dependency bullets only as needed to avoid contradiction.

**Step 4: Run test to verify it passes**

Run:

```bash
rg "TASK-10 -> TASK-10A -> TASK-10B -> TASK-11" "TODO.md"
```

Expected: Match found.

**Step 5: Commit**

```bash
git add TODO.md
git commit -m "docs: encode cost-api and db-types path in critical dependencies"
```

---

### Task 6: Refresh source anchors with security/API standards used in this cycle

**Files:**
- Modify: `TODO.md`
- Test: `TODO.md` source anchors section

**Step 1: Write the failing test**

Run:

```bash
rg "OWASP Multi-Tenant Security Cheat Sheet|OWASP ASVS|RFC 9457" "TODO.md"
```

Expected: No matches or partial matches.

**Step 2: Run test to verify it fails**

Run:

```bash
rg "## 7\\) Source Anchors \\(Research Basis\\)" "TODO.md"
```

Expected: Section exists but lacks the new standards links.

**Step 3: Write minimal implementation**

Append these links under `## 7) Source Anchors (Research Basis)`:

```markdown
- [OWASP Multi-Tenant Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Multi_Tenant_Security_Cheat_Sheet.html)
- [OWASP ASVS](https://github.com/OWASP/ASVS)
- [RFC 9457: Problem Details for HTTP APIs](https://www.rfc-editor.org/rfc/rfc9457.html)
```

**Step 4: Run test to verify it passes**

Run:

```bash
rg "OWASP Multi-Tenant Security Cheat Sheet|OWASP ASVS|RFC 9457" "TODO.md"
```

Expected: 3 matches found.

**Step 5: Commit**

```bash
git add TODO.md
git commit -m "docs: add security and api-standard anchors for 2026 refresh"
```

---

### Task 7: Final verification and cleanup pass

**Files:**
- Modify: `TODO.md` (if needed for final polish only)
- Test: `TODO.md`

**Step 1: Write the failing test**

Run:

```bash
rg "TASK-10: API validation in agency-admin routes" "TODO.md"
```

Expected: No matches (old task title must be fully replaced).

**Step 2: Run test to verify it fails**

Run:

```bash
rg "TASK-10A|TASK-10B|tenant isolation hardening|critical dependencies" "TODO.md"
```

Expected: All new constructs are present.

**Step 3: Write minimal implementation**

If any heading/order/wording is inconsistent, apply a minimal markdown edit only; avoid scope creep into other tasks.

**Step 4: Run test to verify it passes**

Run:

```bash
rg "TASK-10: API authorization and tenant isolation hardening|TASK-10A: Cost dashboard and API contract alignment|TASK-10B: Database type generation and drift gate recovery" "TODO.md"
```

Expected: 3 matches found.

**Step 5: Commit**

```bash
git add TODO.md
git commit -m "docs: finalize todo refresh for authz, api contract, and reliability"
```

---

## Implementation Notes

- Keep edits DRY and minimal; only update sections impacted by this refresh.
- Do not reorder unrelated roadmap tasks unless dependency conflicts require it.
- Use @superpowers:test-driven-development for edit/verify loops.
- Use @superpowers:verification-before-completion before claiming done.

