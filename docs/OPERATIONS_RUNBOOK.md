# Operations Runbook

Single reference for backup, cost, communication, DORA metrics, geographic distribution, performance benchmarks, and artifact management. For deployment, local Supabase, background jobs, and PostHog, see [DEPLOYMENT.md](./DEPLOYMENT.md), [SUPABASE_LOCAL.md](./SUPABASE_LOCAL.md), [BACKGROUND_JOBS.md](./BACKGROUND_JOBS.md), and [POSTHOG_DEPLOYMENT.md](./POSTHOG_DEPLOYMENT.md).

---

## Backup procedures

**Strategy:** 4-3-2 (4 copies, 3 locations, 2 offsite).

- **Scope:** Source code (apps/, packages/, scripts/), docs, config, migrations, design tokens; metadata (issues, PRs, releases, branch protection). Exclude: node_modules, build artifacts, .env.local.
- **Methods:** (1) GitHub API automated backup (daily); (2) Git mirror (hourly); (3) Migration archive (weekly). Scripts: `./scripts/backup/automated-backup.sh`, `git clone --mirror`.
- **Storage:** Primary = GitHub; secondary = daily (e.g. S3, 30 days); tertiary = weekly (e.g. Azure, 90 days); quaternary = monthly archive (e.g. GCP, 1 year).
- **Recovery:** Corruption → restore from latest backup, validate, push. GitHub outage → use backup location until restored. Accidental deletion → contact GitHub support + restore from backup. Malicious attack → isolate, audit, restore from pre-attack backup, rotate credentials.
- **Validation:** Integrity (SHA-256), completeness, restore tests. Quarterly full restore drill; annual strategy review.

---

## Cost management

**Purpose:** Monitor and optimize storage, CI/CD, and bandwidth costs with tenant-isolated tracking and alerts.

- **Components:** Cost metrics (per tenant), budget alerts, optimization recommendations. When implemented: @agency/monitoring (or equivalent), Supabase tables (`cost_metrics`, `budget_alerts`, `optimization_recommendations`), GitHub Actions collection, dashboard.
- **Use:** Track spend per tenant; set thresholds and notification channels; review AI-driven recommendations. See dashboard and API routes when the system is in place.

---

## Communication protocols

**Channels:** Slack (#incidents, #alerts, #devops, #security) for real-time response; email for formal and external; phone for Severity 1 or when Slack is down.

- **Incident flow:** (1) Initial detection (0–15 min): alert to response team with template (Incident ID, severity, affected systems, commander, next update). (2) Assessment and containment (15–60 min): update stakeholders. (3) Resolution and post-mortem.
- **Response expectations:** Slack within 15 min during business hours; email within 4 hours; phone immediate for critical.
- **Templates:** Use standardized incident alert and status update templates; maintain contact list in password manager.

---

## DORA metrics

**Four metrics:** Deployment frequency; lead time for changes; change failure rate; mean time to recovery.

- **When implemented:** Data from GitHub events → GitHub Actions → database (deployments, incidents) → metrics calculator → dashboard/API. Package: @agency/metrics; tables: deployments, incidents.
- **Use:** Track delivery velocity and stability; drive improvements. Dashboard and API endpoints when available.

---

## Geographic distribution

**Multi-region backup strategy:** Primary (e.g. US East) = production and working copy; secondary (e.g. US West) = daily backup, 1–2 h recovery; tertiary (e.g. Europe) = weekly, 4–8 h recovery; quaternary (e.g. Asia Pacific) = monthly archive, 24–48 h recovery.

- **Use:** Ensures resilience against regional failures; choose restore region based on RTO/RPO. Align with [Backup procedures](#backup-procedures) storage locations.

---

## Performance benchmarks

**Purpose:** Measure Git and repository performance over time.

- **Commands:** `./scripts/benchmark/git-performance.ts` (basic run, `--save` for trends, `--trends` to view history). Benchmarks: git status, log, diff, add, commit, checkout, merge, fetch, push; plus repo size, commit/branch/tag counts, Git config.
- **Targets:** Excellent = e.g. git status < 500ms; Good = 500ms–2s; Needs optimization = > 2s. Use with [docs/development/PERFORMANCE.md](../development/PERFORMANCE.md) for tuning.

---

## Artifact management

**Purpose:** Centralized artifact registry, promotion pipelines, policy-driven retention. When implemented: @agency/artifacts (registry, promotion, policies, retention); Supabase with RLS; migrations (e.g. 012a_artifact_lifecycle_management.sql).

- **Use:** Register artifacts, run promotion workflows, enforce retention policies. CLI/scripts and dashboard per package documentation. See [packages/artifacts/README.md](../../packages/artifacts/README.md) for package-level details.

---

## Incident response

For severity levels, response team structure, and lifecycle (detection → containment → recovery → post-mortem), see [docs/security/INCIDENT_RESPONSE.md](../security/INCIDENT_RESPONSE.md). Coordinate with [Communication protocols](#communication-protocols) above.

---

## Error budget and SLO operations

**Target SLOs (30-day rolling):**

- **API availability:** 99.9% successful responses (excluding intentional 4xx client errors).
- **API latency p95:** 99.0% of requests under 800ms.

**Burn-rate policy:**

- **Fast burn (>=14.4x):** page on-call immediately, pause non-critical deploys.
- **Medium burn (>=6x):** escalate to incident commander and increase triage frequency.
- **Slow burn (>=2x):** create reliability issue and schedule remediation in current sprint.

**Verification routine:**

1. Check alert source and confirm request volume/traffic anomalies.
2. Correlate by `x-request-id`, `traceparent`, and error class code.
3. Execute the mapped runbook below.
4. Record mitigation + follow-up action in the incident timeline.

## Authentication failures

- **Signal:** `AUTHENTICATION_REQUIRED` spikes in API responses.
- **Checks:** session cookie validity, Supabase auth status, callback/login route health.
- **Immediate action:** verify auth provider availability and rollback recent auth changes if needed.

## Authorization and tenant isolation

- **Signal:** `AUTHORIZATION_DENIED` spikes or cross-tenant access anomalies.
- **Checks:** tenant assignment in `app_metadata`, tenant middleware headers, policy changes.
- **Immediate action:** lock impacted endpoints if isolation is uncertain and notify security owner.

## Tenant resolution failures

- **Signal:** `TENANT_RESOLUTION_FAILED` or repeated middleware tenant lookup failures.
- **Checks:** host/domain mapping in `tenants`, DNS/domain config drift, middleware request headers.
- **Immediate action:** restore known-good tenant routing config and invalidate stale edge caches.

## Database degradation or outage

- **Signal:** `DATABASE_OPERATION_FAILED`, elevated latency, or timeout/retry saturation.
- **Checks:** Supabase status, pool exhaustion, migration drift, query error rate.
- **Immediate action:** reduce load, disable expensive features, and execute database incident protocol.

## Third-party provider outages

- **Signal:** `EXTERNAL_SERVICE_FAILED` errors from analytics/email/other integrations.
- **Checks:** provider status pages, API rate limits, timeout/retry behavior.
- **Immediate action:** activate degraded mode, queue/retry non-critical jobs, and notify stakeholders.
