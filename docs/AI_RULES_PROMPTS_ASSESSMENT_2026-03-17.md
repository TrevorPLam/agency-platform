# AI Rules And Prompts Assessment

Date: 2026-03-17

## Scope

This assessment reviews the attached AI customization catalogs in:

- `.cursor/rules`
- `.windsurf/rules`
- `.windsurf/workflows`
- `.prompts`

The goal is to determine:

1. Which rules and prompts fit this codebase and should remain.
2. Which rules and prompts do not fit this codebase and should be removed.
3. Which important repo-specific rules and prompts are missing and should be added.

Decision basis:

- Optimize for the current codebase plus near-term roadmap areas already scaffolded in source or docs.
- Keep some broader prompts when they still support analysis or planning, even if the corresponding rule is not enforced.

## Repo Profile

Agency Platform is a multi-tenant marketing-agency monorepo using Next.js 16 App Router, React 19, TypeScript 5 strict mode, Tailwind CSS v4, pnpm workspaces, Turborepo, and Supabase with Row-Level Security.

Core repo constraints are already explicit in [AGENTS.md](../AGENTS.md):

- tenant isolation via RLS
- `app_metadata.tenant_id`, never `user_metadata`
- no cross-app imports
- no `any`
- prefer single-file validation commands

The repo also has strong documented emphasis on:

- rendering strategy and token architecture in [docs/FRONTEND_ARCHITECTURE.md](./FRONTEND_ARCHITECTURE.md)
- background workflows with Inngest in [docs/BACKGROUND_JOBS.md](./BACKGROUND_JOBS.md)
- task/process structure in [docs/TASK_TEMPLATE.md](./TASK_TEMPLATE.md)
- strict workspace dependency governance in [pnpm-workspace.yaml](../pnpm-workspace.yaml)

## High-Level Assessment

### Keep

Most rules covering:

- Next.js architecture and security
- TypeScript standards
- authentication, API security, input validation, secret management
- database integrity, query architecture, backend performance
- testing, accessibility, documentation hygiene, dependency management
- observability, logging, analytics, governance, compliance
- background jobs, frontend performance, styling architecture

These are relevant to the present repo or near-term roadmap.

### Remove

The clearly mismatched set is small and concentrated in technology domains the repo does not use:

- blockchain and Web3
- mobile
- AR/VR
- quantum
- IoT

These topics add noise and are not supported by source, packages, or docs.

### Add

The biggest gaps are not generic software topics. They are repo-specific operational rules that agents need in order to work safely in this monorepo:

- migration safety and naming discipline
- package export and monorepo boundary discipline
- Problem+JSON API conventions
- structured logging and request correlation
- tenant resolution algorithm and debugging
- rate limiting and admission control
- RLS testing patterns
- rendering strategy selection per route
- environment validation and setup consistency
- background jobs and analytics instrumentation standards

## Rules To Remove

These topics do not pertain to the current codebase or near-term roadmap and should be removed from enforced rules.

### Remove From `.cursor/rules`

- `blockchain-architecture.mdc`
- `defi-standards.mdc`
- `nft-standards.mdc`
- `web3-security.mdc`
- `decentralized-identity.mdc`
- `mobile-development.mdc`
- `ar-vr-development.mdc`
- `quantum-computing.mdc`
- `iot-security.mdc`
- `zero-trust-network.mdc`

### Remove From `.windsurf/rules`

- `blockchain-architecture.md`
- `defi-standards.md`
- `nft-standards.md`
- `web3-security.md`
- `decentralized-identity.md`
- `mobile-development.md`
- `ar-vr-development.md`
- `quantum-computing.md`
- `iot-security.md`
- `zero-trust-network.md`

## Prompts To Remove

Because prompts may stay broader than enforced rules, only the clearly mismatched prompts should be removed.

### Remove From `.prompts`

- `blockchain-architecture-analysis.md`
- `defi-standards-analysis.md`
- `nft-standards-analysis.md`
- `web3-security-analysis.md`
- `decentralized-identity-analysis.md`
- `mobile-development-analysis.md`
- `ar-vr-development-analysis.md`
- `quantum-computing-analysis.md`
- `iot-security-analysis.md`
- `zero-trust-network-analysis.md`

## Keep But Reclassify As Optional

These topics are not strongly evidenced in the current implementation, but they are plausible adjacent concerns for the roadmap, infrastructure maturity, or advanced analysis. They should not be removed yet, but they should be treated as optional instead of core enforcement.

### Rules

- `llm-integration`
- `advanced-automation`
- `platform-engineering`
- `cloud-native-standards`
- `multi-cloud`
- `privacy-enhancing-tech`
- `chaos-engineering`
- `edge-computing`
- `edge-ai`
- `service-mesh`
- `microservices-architecture`
- `event-sourcing`
- `distributed-data`
- `mlops-standards`
- `ml-pipeline-security`
- `model-monitoring`
- `feature-engineering`

### Prompts

Keep the matching analysis prompts for the optional topics above. They are still useful for research and planning, especially because this repo includes `packages/ai-content-ops`, advanced governance, and a documented long-term operations model.

## Missing Rules To Add

These are the highest-value missing rule topics for this repo.

### 1. `multi-tenant-saas.mdc` and `.windsurf/rules/multi-tenant-saas.md`

Why:

- The repo is tenant-isolated at every layer, but there is no single repo-level rule that combines tenant resolution, tenant-boundary design, and multi-tenant failure modes.
- Current guidance is spread across `AGENTS.md`, `.agents/security.md`, and database patterns.

Rule should cover:

- tenant boundary invariants
- per-tenant authorization checks
- safe tenant context propagation
- no tenant identifiers from untrusted client input when server context exists
- tenancy-aware caching, logging, analytics, and jobs

### 2. `supabase-rls-operations.mdc` and `.windsurf/rules/supabase-rls-operations.md`

Why:

- Existing database and RLS rules are helpful, but this repo needs stronger operational guidance around migrations, policy verification, local Supabase workflow, and generated types discipline.
- Migration conflicts and invalid transactional patterns have already occurred in this repo.

Rule should cover:

- deterministic migration naming and sequencing
- no `CREATE INDEX CONCURRENTLY` inside transactional migrations
- pgTAP expectations for new tenant-scoped tables
- generated types refresh expectations
- port 6543 discipline and Docker-local verification expectations

### 3. `monorepo-boundaries.mdc` and `.windsurf/rules/monorepo-boundaries.md`

Why:

- The repo has a no-cross-app-import rule, shared package constraints, and package export issues.
- Current guidance is split across `AGENTS.md` and package docs rather than expressed as an explicit monorepo rule.

Rule should cover:

- package-first sharing
- entrypoint/export correctness
- `workspace:*` and `catalog:` discipline
- no app-to-app imports
- single-file verification as default

### 4. `api-error-contracts.mdc` and `.windsurf/rules/api-error-contracts.md`

Why:

- Middleware already uses Problem+JSON style responses, but that convention is not explicitly standardized for the repo.
- Duplicate error hierarchies and inconsistent API shapes are a real risk.

Rule should cover:

- Problem+JSON format for 4xx and 5xx responses
- stable machine-readable `code` values
- request correlation IDs
- safe exposure of details by environment
- consistent success envelope guidance where needed

### 5. `structured-logging-observability.mdc` and `.windsurf/rules/structured-logging-observability.md`

Why:

- The repo has request context helpers, monitoring packages, and SLO docs, but no explicit logging rule tuned for agents.

Rule should cover:

- JSON-structured logs
- required fields like request ID, tenant ID, route, actor, severity
- no secret leakage
- event correlation across API, jobs, and database operations

### 6. `rendering-cache-strategy.mdc` and `.windsurf/rules/rendering-cache-strategy.md`

Why:

- The repo has a strong architecture doc for SSG, ISR, SSR, PPR, and cache components, but no AI rule telling agents how to choose among them.

Rule should cover:

- public marketing pages defaulting toward SSG or ISR
- session or tenant-dependent pages using SSR or dynamic rendering
- `revalidate` expectations
- `generateStaticParams` when applicable
- cache directives and no-store guidance for sensitive routes

### 7. `tenant-resolution.mdc` and `.windsurf/rules/tenant-resolution.md`

Why:

- Tenant resolution is central to this platform and already implemented, but the fallback order and failure behavior are not captured in a dedicated rule.

Rule should cover:

- hostname, subdomain, and local-development fallback order
- disabled or missing tenant behavior
- debugging steps
- interaction with middleware and layouts

### 8. `rate-limiting-admission-control.mdc` and `.windsurf/rules/rate-limiting-admission-control.md`

Why:

- Rate limiting exists in code and tests, but agents are not told when and how to apply the available presets.

Rule should cover:

- preset selection by endpoint type
- tenant-aware bucketing
- auth vs public routes
- header conventions and failure behavior

### 9. `background-jobs-inngest.mdc` and `.windsurf/rules/background-jobs-inngest.md`

Why:

- The repo has chosen Inngest specifically because of Vercel runtime constraints.
- This choice needs explicit rule status so agents do not reach for unsuitable worker patterns.

Rule should cover:

- when to use Inngest instead of `after()` or queue workers
- step idempotency
- tenant context propagation
- retry boundaries and timeouts
- event naming discipline

### 10. `analytics-instrumentation.mdc` and `.windsurf/rules/analytics-instrumentation.md`

Why:

- Analytics packages exist and events are already captured, but there is no repo-specific instrumentation standard.

Rule should cover:

- event naming
- required event metadata
- tenant-safe analytics
- PII constraints
- server vs client capture rules

### 11. `accessibility-testing.mdc` and `.windsurf/rules/accessibility-testing.md`

Why:

- Accessibility guidance exists in docs and tasks, but not as a focused AI rule tied to the repo test setup.

Rule should cover:

- a11y checks in UI changes
- axe-based test expectations
- semantic HTML and keyboard behavior
- color contrast and focus management

### 12. `documentation-task-governance.mdc` and `.windsurf/rules/documentation-task-governance.md`

Why:

- The repo uses a strong task-template and research-driven workflow, but agents are not explicitly told how to align TODOs, task docs, and implementation notes.

Rule should cover:

- when to update docs and task files
- how to structure implementation tasks
- requirement traceability
- linking changes back to research and runbooks

## Missing Prompts To Add

These prompt files should be added because they directly support the missing rules above.

### Add To `.prompts`

- `multi-tenant-saas-analysis.md`
- `supabase-rls-operations-analysis.md`
- `monorepo-boundaries-analysis.md`
- `api-error-contracts-analysis.md`
- `structured-logging-observability-analysis.md`
- `rendering-cache-strategy-analysis.md`
- `tenant-resolution-analysis.md`
- `rate-limiting-admission-control-analysis.md`
- `background-jobs-inngest-analysis.md`
- `analytics-instrumentation-analysis.md`
- `accessibility-testing-analysis.md`
- `documentation-task-governance-analysis.md`

## Possible Consolidation

The current catalogs have substantial duplication between Cursor and Windsurf. That is manageable, but a few topics can be simplified.

### Consolidation recommendations

1. Keep Cursor-only repo-core files as the primary source of truth for repo-specific behavior:
   - `base.mdc`
   - `database.mdc`
   - `frontend.mdc`
   - `rls.mdc`
   - `tokens.mdc`

2. Add the missing repo-specific rules above to both Cursor and Windsurf rather than only one tool.

3. Consider moving optional advanced topics into a separate `optional/` or `research/` tier if you want stricter day-to-day signal quality.

4. Keep broad analysis prompts where they support roadmap exploration, but do not let them imply that the topic is an active engineering concern.

## Final Recommendation

### Highest-confidence removals

Remove these from rules and prompts now:

- blockchain architecture
- DeFi standards
- NFT standards
- Web3 security
- decentralized identity
- mobile development
- AR/VR development
- quantum computing
- IoT security
- zero trust network

### Highest-priority additions

Add these next:

1. multi-tenant SaaS
2. Supabase RLS operations
3. monorepo boundaries
4. API error contracts
5. structured logging and observability
6. rendering and cache strategy
7. tenant resolution
8. rate limiting and admission control
9. background jobs with Inngest
10. analytics instrumentation

These additions are much more aligned with how this repo actually succeeds or fails than the currently irrelevant future-tech categories.

## Second-Tier Additions Implemented

After the first batch, an additional repo-specific operational layer was also added because it is directly supported by existing docs and runbooks.

### Added rules and prompts

- incident-response-runbooks
- slo-error-budget-operations
- cost-attribution-and-quotas
- posthog-privacy-deployment
- developer-environment-operations

These topics are less foundational than tenant isolation, RLS, monorepo boundaries, and rendering strategy, but they are still real repo concerns with strong documented backing.