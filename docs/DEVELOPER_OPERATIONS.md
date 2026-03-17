# Developer Environment & Operations Guide

This document covers repository setup, Git optimization, IDE configuration, workflow automation, and package management for the Agency Platform monorepo.

For first-run setup steps, see [CONTRIBUTING.md](../../CONTRIBUTING.md).

---

## Table of Contents
1. [Environment Setup](#environment-setup)
2. [Git Performance Tuning](#git-performance-tuning)
3. [Sparse Checkout](#sparse-checkout)
4. [IDE Performance](#ide-performance)
5. [Workflow Automation](#workflow-automation)
6. [Package Management](#package-management)
7. [Performance Monitoring](#performance-monitoring)
8. [Developer Experience Monitoring](#developer-experience-monitoring)

---

## Environment Setup

### Quick Start

Run from repo root after clone and `pnpm install`:

```bash
# Git tuning (memory, fsmonitor, maintenance)
./scripts/performance/git-tuning.sh apply standard

# Background maintenance (Git 2.37+)
git maintenance register
git maintenance start

# Sparse checkout (optional; faster status and checkout)
./scripts/performance/sparse-checkout.sh init
./scripts/performance/sparse-checkout.sh role frontend   # or backend, fullstack

# IDE optimization (VSCode/TypeScript)
./scripts/performance/ide-optimization.ts optimize

# Verify
./scripts/performance/git-tuning.sh benchmark
./scripts/performance/dx-monitor.ts health
```

---

## Git Performance Tuning

### Script-based Setup

- **Apply:** `./scripts/performance/git-tuning.sh apply standard` (or `enterprise` for more aggressive settings).
- **Benchmark:** `./scripts/performance/git-tuning.sh benchmark` to measure `git status` and checkout times.
- **Maintenance:** `git maintenance run` (or use `git maintenance start` for background).

### Key Settings (Applied by Script)

- **Memory:** `core.packedGitLimit`, `core.packedGitWindowSize`, `pack.windowMemory` for large repos.
- **File watching:** With Watchman installed, `core.fsmonitor` and `core.untrackedcache` speed up `git status`.
- **GC:** `gc.auto`, `gc.autoPackLimit`, `gc.pruneExpire` for incremental maintenance.

### Daily and Weekly Maintenance

- **Daily:** `git status`, `git fetch --prune`; rely on background maintenance.
- **Weekly:** `git maintenance run`; optionally `./scripts/performance/git-tuning.sh benchmark` to track trends.
- **Monthly:** `git gc --aggressive` if needed; run `./scripts/audit/repository-audit.ts` if available.

### Troubleshooting

| Issue | Solution |
|-------|----------|
| Slow `git status` | Enable Watchman and fsmonitor; ensure `.gitignore` is effective |
| Large repo | Run `git gc --aggressive`; consider sparse checkout (see below) |
| CI Performance | Use shallow clone or `--filter=blob:none` where full history is not required; see CONTRIBUTING for affected builds |

---

## Sparse Checkout

Check out only the directories you need for faster Git operations and smaller workspace.

### Commands

```bash
# Init (cone mode, Git 2.25+)
./scripts/performance/sparse-checkout.sh init

# Roles
./scripts/performance/sparse-checkout.sh list
./scripts/performance/sparse-checkout.sh role frontend   # UI, firm, prospective-clients, design-tokens, analytics
./scripts/performance/sparse-checkout.sh role backend   # database, booking, email, supabase, scripts
./scripts/performance/sparse-checkout.sh role fullstack # apps + packages + supabase + scripts + docs

# Custom
./scripts/performance/sparse-checkout.sh custom "apps/agency-admin packages/ui packages/database"

# Status and benchmark
./scripts/performance/sparse-checkout.sh status
./scripts/performance/sparse-checkout.sh benchmark

# Disable (full repo again)
./scripts/performance/sparse-checkout.sh disable
```

### Benefits

- Much faster `git status` and branch checkout (often 90%+ improvement)
- Smaller disk usage and IDE indexing
- Turborepo and `pnpm dev` / `pnpm build` work with the checked-out subset

### Requirements

- Git 2.25.0+ for cone mode. Upgrade with `brew upgrade git` (macOS) or `sudo apt install git` (Ubuntu) if needed.

---

## IDE Performance

- **Optimize:** `./scripts/performance/ide-optimization.ts optimize` (VSCode/TypeScript and workspace)
- **Report:** `./scripts/performance/ide-optimization.ts report` for memory, indexing, IntelliSense

### VSCode Specifics

- Exclude `node_modules`, `dist`, `.next`, `.cache` in settings
- Consider `typescript.tsserver.maxTsServerMemory` (e.g. 8192) for large workspaces

---

## Workflow Automation

### Templates and Validation

| Area | Files / Location |
|------|------------------|
| **Pull request template** | `.github/pull_request_template.md` — applied when creating PRs |
| **Issue templates** | `.github/ISSUE_TEMPLATE/bug_report.md`, `feature_request.md`, `security_issue.md` |
| **Branch naming validation** | `.github/workflows/branch-validation.yml`, `scripts/validation/branch-name.ts` — enforces `feature/`, `fix/`, `docs/`, etc. |

### Automated Maintenance

- **Stale branch cleanup:** Automated weekly; branches 90+ days inactive; protected branches and open PRs excluded
- **Merge queue:** For high-traffic branches; PRs validated in queue order. Check status with `tsx scripts/performance/merge-queue.ts status` (if present)
- **Flaky tests:** `tsx scripts/performance/flaky-test-detector.ts` for analysis/report (if present)
- **Dependency updates:** Automated (daily/weekly/security); patch/minor/major policies in CONTRIBUTING

**Usage and detailed rules:** See [CONTRIBUTING.md](../../CONTRIBUTING.md) (Branch Naming Conventions, Pull Request Templates, Branch Maintenance, Merge Queue, Dependency Management).

---

## Package Management

### Workspace Structure

This monorepo uses pnpm with workspace catalog features.

### Known Issue: catalogMode: strict Bug

When running `pnpm add <pkg>` in a sub-package with `catalogMode: strict`, pnpm may write `catalog:` (the protocol itself) back into `pnpm-workspace.yaml` as the version instead of the actual version from the catalog.

**Incorrect Behavior:**
```yaml
# Before (correct)
catalog:
  react: ^19.0.0

# After running pnpm add react in a sub-package (incorrect)
catalog:
  react: catalog:
```

#### Workarounds

1. **Manual Edit Method:** After running `pnpm add <pkg>`, manually edit `pnpm-workspace.yaml` to correct any entries that show `catalog:` instead of the actual version
2. **Avoid pnpm add:** For new dependencies, prefer manually editing `pnpm-workspace.yaml` to add the dependency to the catalog, then run `pnpm install` 
3. **Verification:** Always check `pnpm-workspace.yaml` after any `pnpm add` operation to ensure no `catalog:` protocol entries exist

#### Best Practices

- Always run `pnpm install` from the repo root after modifying the catalog
- Use `pnpm ls -r` to verify workspace structure after changes
- Consider the catalog as the single source of truth for dependency versions
- Never hardcode versions in individual package.json files - always use `catalog:` 

#### Recovery

If the bug occurs and your workspace becomes broken:

1. Edit `pnpm-workspace.yaml` to fix all `catalog:` entries
2. Run `pnpm install --force` to regenerate the lockfile
3. Verify with `pnpm ls -r` that all packages resolve correctly

---

## Database Migration Safety

### Critical Migration Rules

1. **NEVER use CREATE INDEX CONCURRENTLY in transactional migrations**
   - PostgreSQL prohibits this and Supabase CLI will fail
   - Use regular `CREATE INDEX` or separate index-only migrations

2. **Deterministic Migration Ordering**
   - Use sequential naming: `010_`, `011_`, `012_`, etc.
   - Index-only migrations: `010_table_indexes.sql`
   - Document dependencies in migration comments

3. **Lock Timeout Safeguards**
   ```sql
   SET lock_timeout TO '5s';
   SET statement_timeout TO '5s';
   CREATE INDEX idx_table_column ON public.table(column);
   ```

### Migration Workflow

```bash
# Create new migration
npx supabase migration new create_feature_table

# Apply locally
npx supabase db push

# Test in CI
npx supabase db start  # Postgres only for CI
npx supabase test db  # Run pgTAP tests

# Deploy to production
npx supabase db push  # Applies pending migrations
```

### Production Index Strategy

For large tables where index creation might block writes:

1. **Schedule during maintenance windows**
2. **Monitor progress**: `SELECT * FROM pg_stat_progress_create_index;`
3. **Failure recovery**: 
   ```sql
   DROP INDEX CONCURRENTLY IF EXISTS idx_failed;
   CREATE INDEX CONCURRENTLY idx_table_column ON public.table(column);
   ```

### Troubleshooting Migrations

| Issue | Solution |
|-------|----------|
| Migration fails with CONCURRENTLY error | Remove CONCURRENTLY, use regular CREATE INDEX |
| Lock timeout during index creation | Reduce timeout values or schedule during low traffic |
| Invalid index after failed CONCURRENTLY | `DROP INDEX CONCURRENTLY` + rebuild or `REINDEX CONCURRENTLY` |
| Migration ordering conflicts | Use sequential naming, check dependencies |

---

## Performance Monitoring

### Core Web Vitals Tracking

The agency platform includes comprehensive performance monitoring with Core Web Vitals tracking:

```bash
# View performance dashboard (agency-admin)
pnpm dev --filter=@agency/agency-admin
# Navigate to /performance

# Check performance budgets during build
pnpm build --filter=@agency/firm
# Performance reports saved to .next/performance-reports/

# Run performance tests
pnpm test:performance

# Check performance alerts
pnpm performance:alerts
```

### Performance Budgets

Performance budgets are enforced at build time to prevent regressions:

- **LCP**: ≤ 2.5s (Loading performance)
- **INP**: ≤ 200ms (Responsiveness) 
- **CLS**: ≤ 0.1 (Visual stability)
- **Bundle Size**: ≤ 244KB (JavaScript)
- **Image Size**: ≤ 500KB (Optimization)

### Monitoring Setup

Add to your app providers:

```typescript
import { useWebVitals, usePerformanceBudgetPresets } from '@agency/monitoring'

function PerformanceMonitor({ tenantId }: { tenantId: string }) {
  const monitor = useWebVitals({
    tenantId,
    enableRealUserMonitoring: true,
    onAlert: (alert) => console.warn('Performance alert:', alert),
  })

  const { getDefaultBudgets, addBudget } = usePerformanceBudgets(monitor)

  useEffect(() => {
    const budgets = getDefaultBudgets(tenantId)
    budgets.forEach(budget => addBudget(budget))
  }, [tenantId])

  return null
}
```

### Performance Alerts

Automated alerting for performance regressions:

- **Low**: 1 violation, 1-hour cooldown
- **Medium**: 3 violations, 30-minute cooldown  
- **High**: 5 violations, 15-minute cooldown
- **Critical**: 1 violation, 5-minute cooldown

Alert channels: Webhook, Email, Slack, SMS

### Performance Optimization

#### Quick Wins

1. **Image Optimization**
   ```bash
   # Check image sizes
   pnpm performance:images
   
   # Optimize images
   pnpm performance:optimize-images
   ```

2. **Bundle Analysis**
   ```bash
   # Analyze bundle sizes
   pnpm build --filter=@agency/firm --analyze
   ```

3. **Lighthouse Audits**
   ```bash
   # Run Lighthouse performance audits
   pnpm lighthouse:audit
   ```

#### Advanced Optimization

- **Code Splitting**: Dynamic imports for heavy components
- **Tree Shaking**: Remove unused code
- **Critical CSS**: Inline critical CSS, lazy load rest
- **Service Workers**: Cache strategies for repeat visits

---

## Developer Experience Monitoring

- **Health check:** `./scripts/performance/dx-monitor.ts health` 
- **Report:** `./scripts/performance/dx-monitor.ts report` (if available)

Use to track performance trends and catch regressions.

---

## Accessibility Testing

### Automated Accessibility Testing

```bash
# Run accessibility tests for all packages
pnpm test:a11y

# Run accessibility tests for specific package
pnpm turbo run test:a11y --filter=@agency/ui

# Run accessibility tests for affected packages only
pnpm turbo run test:a11y --affected

# Run accessibility tests with coverage
pnpm turbo run test:a11y --filter=@agency/ui --coverage
```

### Accessibility Testing Tools

- **axe-core**: Automated WCAG 2.2 compliance checking
- **@axe-core/playwright**: E2E accessibility testing
- **jest-axe**: Unit test accessibility assertions
- **WCAG 2.2**: Latest accessibility standards compliance

### Accessibility Checklist

All new components and features must pass:

1. **Automated Testing**: All accessibility tests pass
2. **Keyboard Navigation**: Full keyboard access to all interactive elements
3. **Screen Reader Support**: Proper ARIA labels and announcements
4. **Focus Management**: Visible focus indicators and logical tab order
5. **Target Size**: Minimum 24×24px touch targets (WCAG 2.2 2.5.8)
6. **Color Contrast**: 4.5:1 for normal text, 3:1 for large text

### Accessibility Documentation

- **Complete Guide**: `docs/ACCESSIBILITY_CHECKLIST.md`
- **WCAG 2.2 Standards**: Latest accessibility requirements
- **Testing Patterns**: `test/utils/accessibility.ts`
- **Component Examples**: `packages/ui/src/components/**/*.test.tsx`

---

## References

- [CONTRIBUTING.md](../../CONTRIBUTING.md) — First-run setup and detailed workflow rules
- [Frontend Architecture & Styling Guide](./FRONTEND_ARCHITECTURE.md) — Rendering strategies and Tailwind configuration
- [Release Management Guide](./VERSIONING.md) — Semantic versioning and Changesets
- [Git maintenance](https://git-scm.com/docs/git-maintenance) — Background tasks and configuration
- [Sparse checkout](https://git-scm.com/docs/git-sparse-checkout) — Cone mode and patterns
