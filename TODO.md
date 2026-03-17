# Agency Platform TODO (03/2026 Refresh)

This roadmap reflects:

- Up-to-date 03/2026 standards and market direction.
- Verified repository state from `apps/`, `packages/`, `supabase/`, and `docs/`.
- Practical execution order for an agency platform monorepo:
  - agency marketing site,
  - client sites,
  - native tools (booking, analytics, operations).

---

## 1) Research Synthesis (03/2026)

### 1.1 Basics and Fundamentals

- Use a composable monorepo architecture with clear app/package boundaries.
- Keep public websites fast, indexable, and accessible by default.
- Prefer Server Components by default and only add client boundaries where needed.
- Treat tenant isolation and RLS as non-negotiable for all client data paths.
- Track outcomes, not pageviews: conversion events, lead quality, and downstream revenue signals.

### 1.2 Best Practices and Highest Standards

- **Next.js 16 baseline:** Node >= 20.9, Turbopack default, App Router file conventions (`sitemap.ts`, `robots.ts`, metadata APIs).
- **Accessibility baseline:** WCAG 2.2 AA target for product quality; legal floor differs by jurisdiction.
- **Security baseline:** security headers + CSP + strict secret handling + validated server actions/routes.
- **Privacy baseline:** consent-aware analytics, first-party event collection, and explicit data minimization.
- **Performance baseline:** Core Web Vitals monitored in field (LCP/INP/CLS), not just local lab checks.

### 1.3 Enterprise Solutions

- Decision gates are required for:
  - CMS (Sanity / Payload / Contentful class),
  - CRM + marketing automation,
  - CMP/consent tooling,
  - warehouse/CDP path for first-party analytics.
- Use feature-flagged rollout for cross-tenant features.
- Standardize operational controls: incident runbooks, observability, deployment checks, and dependency governance.

### 1.4 Novel / Unique / Innovative Techniques

- AI-assisted content operations:
  - assisted brief generation,
  - reusable content blocks,
  - controlled variant generation for tests.
- Experimentation as a platform capability:
  - reusable event taxonomy,
  - server-side assignment where needed,
  - outcome-level reporting in admin.
- Agent-ready operations:
  - deterministic workflows for onboarding, QA, and launch checks,
  - auditable automation for repetitive agency tasks.

---

## 2) True Codebase State (Verified)

### What is already strong

- Multi-app monorepo structure with shared packages and clear domains.
- Supabase tenant model + RLS-oriented data architecture.
- CI/security workflow coverage is broad.
- Shared UI, analytics, booking, database, and operational packages are present.

### What is materially missing or partial

- Public SEO essentials missing in apps (`metadataBase`, `sitemap.ts`, `robots.ts`, OG image files).
- Security headers incomplete across apps (HSTS + `interest-cohort=()` missing; firm has none).
- Form hardening incomplete (Zod + honeypot not consistently implemented).
- Tests are thin (1 Playwright smoke test, very limited unit coverage).
- Native tools are partial:
  - booking works but is basic (no stronger validation/funnel instrumentation),
  - server-side analytics capability exists but is mostly unwired.
- Content stack is still static/hardcoded (no CMS pipeline).
- Accessibility/performance programs are not yet formalized in CI and release gates.

### Information gaps closed by this refresh

- Converted external standards into concrete engineering tasks.
- Converted codebase findings into explicit priorities and dependency order.
- Added enterprise decision gates (not just implementation tasks).
- Added innovation lane with guardrails so experimentation does not weaken core quality.

### Additional verified risk findings (03/2026 hard evidence pass)

- `apps/agency-admin/src/app/api/costs/*` currently trusts client-provided `tenant_id` (query/body) while using admin client access, which creates cross-tenant authorization risk.
- `apps/agency-admin/src/app/api/costs/recommendations/route.ts` PATCH updates by `id` without tenant scoping, creating IDOR-style risk.
- `apps/agency-admin/src/components/costs/cost-management-dashboard.tsx` calls cost APIs without required `tenant_id`, causing contract-level runtime failures.
- `packages/database/src/types.ts` is currently empty in this branch state, which can block affected build/type/test workflows.
- `apps/prospective-clients/*/src/app/(auth)/callback/route.ts` and login actions currently accept unvalidated redirect targets (`next`/`redirect`), creating open-redirect risk.
- `supabase/migrations/006_dora_metrics.sql` policies currently allow broad authenticated reads without tenant-scoped checks.
- `supabase/migrations/011_cost_monitoring.sql` uses `SECURITY DEFINER` in `get_tenant_cost_summary` without explicit caller-tenant enforcement.
- `supabase/migrations/010_bookings.sql`, `011_cost_monitoring.sql`, and `012_artifact_lifecycle_management.sql` use `CREATE INDEX CONCURRENTLY`, which is unsafe in transactional migration flows.
- `supabase/migrations/012_artifact_lifecycle_management.sql` uses `tenant_id TEXT` instead of UUID-aligned tenant typing, creating policy/type mismatch risk.
- `.github/workflows/recovery-test.yml` and `.github/workflows/governance.yml` reference scripts/files that do not exist, creating guaranteed CI failure paths.
- docs include high-volume broken links and stale path references (e.g. `docs/architecture/*`), reducing operational trust in runbooks.

---

## 3) Execution Rules

- Follow workspace constraints in `.cursor/rules/base.mdc`.
- No `any`; use `unknown` + narrowing or typed interfaces.
- Use named exports only (except Next.js page defaults).
- No cross-app imports; use `packages/*`.
- Keep tasks small and independently reviewable.

---

## [x] TASK-10: API authorization and tenant isolation hardening (agency-admin costs)

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

---

## [x] TASK-10A: Cost dashboard and API contract alignment

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

---

## [x] TASK-10B: Database type generation and drift gate recovery

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

---

## [x] TASK-11: Comprehensive Testing Strategy Implementation

**Why:** Test coverage was <5% across entire codebase with no integration testing framework, representing critical quality risk for production deployment.

**Definition of Done**

- Unit test coverage >80% across all packages with Vitest setup
- Integration testing framework for API endpoints, database operations, and middleware
- Test data factories and utilities for deterministic test generation
- Coverage reporting and quality gates established in CI/CD
- E2E testing framework for critical user journeys

**Target Files**

- `vitest.config.ts`, `vitest.workspace.ts` - Test configuration
- `test/utils/factory.ts` - Test data factory system
- `test/factories/*.ts` - Domain-specific test factories
- `packages/*/src/*.test.ts` - Unit tests across packages
- `apps/*/src/app/api/**/*.test.ts` - API integration tests

---

## P2 - Production Readiness

## [x] TASK-14: Accessibility program baseline (WCAG 2.2 AA target)

**Why:** Accessibility quality is not yet a programmatic release gate.

**Definition of Done**

- ✅ Accessibility acceptance checklist added for public apps.
- ✅ Automated checks integrated into CI/lint/test flow (initial baseline).
- ✅ Focus visibility, form semantics, keyboard support, and target size checks covered in test strategy.

**Implementation Summary**

- Created comprehensive WCAG 2.2 AA compliance checklist (`docs/ACCESSIBILITY_CHECKLIST.md`)
- Added axe-core dependencies to catalog for automated accessibility testing
- Implemented accessibility test utilities (`test/utils/accessibility.ts`) with WCAG 2.2 specific rules
- Added accessibility tests to Button component as example pattern
- Created E2E accessibility tests for firm application with keyboard navigation, focus appearance, target size
- Integrated accessibility testing into CI pipeline (`pnpm test:a11y`)
- Updated documentation with accessibility testing patterns and commands

**Target Files**

- ✅ `.github/workflows/ci.yml` - Added accessibility test step
- ✅ `docs/ACCESSIBILITY_CHECKLIST.md` - Complete WCAG 2.2 AA checklist
- ✅ `test/utils/accessibility.ts` - Accessibility testing utilities
- ✅ `packages/ui/src/components/atoms/button.test.tsx` - Component accessibility tests
- ✅ `apps/firm/e2e/accessibility.spec.ts` - E2E accessibility tests
- ✅ `docs/DEVELOPER_OPERATIONS.md` - Added accessibility testing section
- ✅ `.agents/testing.md` - Updated with accessibility testing patterns

---

## [x] TASK-15: Consent and privacy architecture hardening

**Why:** Consent task exists but needs explicit architecture and event policy.

**Definition of Done**

- ✅ Consent state model documented and implemented for public apps.
- ✅ Analytics/event capture honors consent state.
- ✅ Data retention/minimization rules documented at implementation level.

**Implementation Summary**

- Created comprehensive consent management system with React Context API
- Implemented consent-aware analytics using PostHog's built-in consent methods
- Built consent banner components with granular controls (analytics, marketing, functional)
- Updated all public apps (firm, riley-day-care, the-barber-cave) to use consent management
- Documented comprehensive data retention policies following GDPR/CCPA best practices
- Added consent storage with localStorage persistence
- Implemented data retention periods: analytics (365 days), marketing (180 days), functional (730 days)

**Target Files**

- ✅ `packages/analytics/src/consent.ts` - Consent types and interfaces
- ✅ `packages/analytics/src/consent-context.tsx` - React Context provider
- ✅ `packages/analytics/src/consent-banner.tsx` - Consent banner components
- ✅ `packages/analytics/src/client.ts` - Updated with consent-aware functions
- ✅ `apps/firm/src/components/providers.tsx` - Consent integration
- ✅ `apps/prospective-clients/*/src/components/providers.tsx` - Consent integration
- ✅ `docs/DATA_RETENTION_POLICIES.md` - Comprehensive retention policies

---

## [ ] TASK-16: Core Web Vitals field observability

**Why:** No consistent field performance feedback loop yet.

**Definition of Done**

- CWV reporting path defined and integrated (LCP, INP, CLS).
- alerting/reporting baseline documented for regressions.
- performance budgets or threshold policy added for launch quality.

**Target Files**

- `apps/firm/src/*` (where vitals reporting hooks live)
- `apps/prospective-clients/*/src/*`
- `docs/DEVELOPER_OPERATIONS.md`
- `docs/DEPLOYMENT.md`

---

## P3 - Innovation Lane (Guardrailed)

## [ ] TASK-17: Experimentation framework bootstrap

**Why:** Agency growth depends on repeated, measurable experimentation.

**Definition of Done**

- Standard experiment schema defined (hypothesis, metric, window, owner).
- Event taxonomy supports attribution to experiments.
- Initial admin visibility for experiment outcomes is specified.

**Target Files**

- `docs/GUIDE.md`
- `docs/ARCHITECTURE.md`
- `apps/agency-admin/src/app/(dashboard)/*` (follow-up implementation)

---

## [ ] TASK-18: AI-assisted content ops pilot (safe mode)

**Why:** AI can accelerate content delivery but needs quality and compliance guardrails.

**Definition of Done**

- Pilot scope defined (internal drafting only first).
- Human review, brand voice, and legal/compliance checks documented.
- No direct auto-publish without approval workflow.

**Target Files**

- `docs/AI_DEVELOPMENT_GUIDE.md`
- `docs/GUIDE.md`
- `TODO.md` (future implementation subtasks)

---

## P4 - Advanced Repository Management (Industry-Leading)

## [ ] TASK-19: DORA Metrics Implementation & Automation

**Why:** No automated collection of key engineering metrics for organizational improvement.

**Definition of Done**

- Automated DORA metrics collection pipeline implemented
- Deployment frequency, lead time, change failure rate, MTTR tracked
- Metrics dashboard in agency-admin with historical trends
- Integration with existing CI/CD pipeline for automatic data capture
- Alerting for metric regressions and improvements

**Target Files**

- `scripts/metrics/dora-collector.ts`
- `scripts/metrics/metrics-dashboard.ts`
- `apps/agency-admin/src/app/(dashboard)/metrics/*`
- `.github/workflows/metrics.yml`
- `packages/metrics/src/dora.ts`

---

## [ ] TASK-20: Advanced Supply Chain Security (SLSA & SBOM)

**Why:** Current supply chain security is basic GitHub scanning; industry leaders implement SLSA and comprehensive SBOM.

**Definition of Done**

- SBOM generation automation for all builds and releases
- SLSA attestation implementation (Levels 1-3)
- Build provenance tracking and verification
- Cryptographic artifact integrity verification
- Supply chain monitoring and vulnerability correlation
- Integration with existing security workflows

**Target Files**

- `scripts/security/generate-sbom.ts`
- `scripts/security/generate-attestation.ts`
- `scripts/security/verify-integrity.ts`
- `scripts/security/track-provenance.ts`
- `packages/security/src/slsa.ts`
- `packages/security/src/sbom.ts`
- `.github/workflows/supply-chain.yml`

---

## [ ] TASK-21: Repository Metadata & Classification System

**Why:** Manual repository management doesn't scale; enterprise requires dynamic policy targeting.

**Definition of Done**

- Custom repository properties implementation
- Repository classification schema (risk-based categorization)
- Dynamic policy targeting based on repository metadata
- Automated compliance checks and policy enforcement
- Repository metadata-driven automation
- Integration with GitHub Enterprise governance features

**Target Files**

- `scripts/governance/manage-properties.ts`
- `scripts/governance/metadata-workflows.ts`
- `scripts/governance/dynamic-policies.ts`
- `scripts/governance/compliance-automation.ts`
- `packages/governance/src/metadata.ts`
- `packages/governance/src/classification.ts`

---

## [ ] TASK-22: Artifact Lifecycle Management

**Why:** No centralized artifact registry or automated promotion pipelines.

**Definition of Done**

- Centralized artifact registry (JFrog Artifactory/Nexus integration)
- Automated version tagging and semantic versioning
- Environment promotion pipelines (dev → staging → prod)
- Automated auditing for artifact lifecycle
- Policy-driven artifact management
- Artifact integrity verification across environments

**Target Files**

- `scripts/artifacts/register-artifact.ts`
- `scripts/artifacts/promote-artifact.ts`
- `scripts/artifacts/cleanup-artifacts.ts`
- `packages/artifacts/src/registry.ts`
- `packages/artifacts/src/lifecycle.ts`
- `packages/artifacts/src/promotion.ts`

---

## [ ] TASK-23: Large Monorepo Performance Optimization

**Why:** Current monorepo lacks performance optimizations needed at scale.

**Definition of Done**

- Sparse checkout implementation for specific directories
- Merge queue system for sequential validation
- IDE performance optimization (custom IntelliJ/VSCode plugin)
- Flaky test identification and quarantining
- Git performance tuning and optimization
- Automated repository maintenance (garbage collection, cleanup)

**Target Files**

- `scripts/performance/ide-optimization.ts`
- `scripts/performance/merge-queue.ts`
- `scripts/performance/flaky-test-detector.ts`
- `scripts/maintenance/cleanup-branches.ts`
- `scripts/maintenance/git-performance.ts`
- `.gitattributes` (sparse checkout config)
- `docs/DEVELOPER_EXPERIENCE.md`

---

## [ ] TASK-24: Integrated Knowledge Management

**Why:** Knowledge is siloed in documentation; not embedded in daily workflows.

**Definition of Done**

- Automated knowledge capture from development activities
- Workflow-integrated knowledge systems
- AI-powered search across code, docs, and conversations
- Expertise mapping and knowledge graphs
- Systematic knowledge audits and updates
- Knowledge-driven development assistance

**Target Files**

- `scripts/knowledge/capture.ts`
- `scripts/knowledge/expertise-map.ts`
- `scripts/knowledge/search.ts`
- `packages/knowledge/src/graph.ts`
- `packages/knowledge/src/search.ts`
- `packages/knowledge/src/automation.ts`

---

## [ ] TASK-25: Cost Management & Resource Optimization

**Why:** No monitoring of storage costs, CI/CD resource usage, or optimization budgeting.

**Definition of Done**

- Storage optimization monitoring and alerts
- CI/CD resource usage tracking and optimization
- Telemetry budgeting and cost allocation
- Automated cost recommendations and optimization
- Resource usage dashboards and reporting
- Cost-aware development workflows

**Target Files**

- `scripts/cost/cost-monitor.ts`
- `scripts/cost/resource-optimizer.ts`
- `scripts/cost/budget-manager.ts`
- `packages/cost/src/monitoring.ts`
- `packages/cost/src/optimization.ts`
- `apps/agency-admin/src/app/(dashboard)/costs/*`

---

## [ ] TASK-26: Disaster Recovery & Business Continuity

**Why:** Relies only on GitHub; no documented recovery procedures or geographic distribution.

**Definition of Done**

- Automated repository backup procedures
- Geographic distribution strategy
- Recovery testing and validation procedures
- Incident response plans and communication protocols
- Business continuity documentation and runbooks
- Regular recovery drills and validation

**Target Files**

- `scripts/backup/backup-repository.ts`
- `scripts/incident/response-automation.ts`
- `scripts/incident/communication-protocols.ts`
- `docs/DISASTER_RECOVERY.md`
- `docs/BUSINESS_CONTINUITY.md`
- `docs/INCIDENT_RESPONSE.md`

---

## [ ] TASK-27: Advanced AI Agent Operations

**Why:** Basic Copilot integration exists; no advanced AI-driven repository automation.

**Definition of Done**

- AI-driven repository automation and assistance
- Autonomous CI/CD agents for self-healing pipelines
- Multimodal code analysis (text, image, sound processing)
- AI-assisted code review and quality checks
- Predictive maintenance and issue detection
- Agent orchestration and governance integration

**Target Files**

- `scripts/ai/repository-automation.ts`
- `scripts/ai/autonomous-cicd.ts`
- `scripts/ai/code-review-assistant.ts`
- `scripts/ai/predictive-maintenance.ts`
- `packages/ai/src/automation.ts`
- `packages/ai/src/orchestration.ts`
- `docs/AI_OPERATIONS.md`

---

## 5) Task Dependencies (Critical Path)

1. ✅ `TASK-10` -> `TASK-10A` -> `TASK-10B` -> ✅ `TASK-11` for API correctness before broader confidence claims.
2. `TASK-14` -> `TASK-15` -> `TASK-16` for production readiness baseline.
3. `TASK-19` -> `TASK-20` -> `TASK-21` for advanced repository management foundation.
4. `TASK-22` -> `TASK-23` -> `TASK-24` for scale optimization workflow.
5. `TASK-25` -> `TASK-26` -> `TASK-27` for enterprise operations maturity.

---

## 7) Source Anchors (Research Basis)

- [OWASP Multi-Tenant Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Multi_Tenant_Security_Cheat_Sheet.html)
- [OWASP ASVS](https://github.com/OWASP/ASVS)
- [RFC 9457: Problem Details for HTTP APIs](https://www.rfc-editor.org/rfc/rfc9457.html)

---
