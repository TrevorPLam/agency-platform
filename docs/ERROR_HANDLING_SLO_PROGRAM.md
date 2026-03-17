# Error Handling SLO Program

This document defines the default reliability targets and error-class runbook mapping used by the platform.

## Service-level objectives

- API availability: 99.9% over a 30-day rolling window.
- API latency p95: 99.0% under 800ms over a 30-day rolling window.

## Error budget burn-rate thresholds

- Fast burn: 14.4x (urgent page + deploy freeze).
- Medium burn: 6x (incident commander escalation).
- Slow burn: 2x (scheduled reliability remediation).

## Required dashboard panels

- Request success rate (exclude 4xx).
- Error rate by `code` and route.
- P95/P99 latency by route.
- Error volume by `correlationId` and `traceparent`.
- Top error classes in last 1h/24h/7d.

## Runbook mapping

| Error class | Severity | Runbook |
| --- | --- | --- |
| `AUTHENTICATION_REQUIRED` | SEV2 | `docs/OPERATIONS_RUNBOOK.md#authentication-failures` |
| `AUTHORIZATION_DENIED` | SEV2 | `docs/OPERATIONS_RUNBOOK.md#authorization-and-tenant-isolation` |
| `TENANT_RESOLUTION_FAILED` | SEV1 | `docs/OPERATIONS_RUNBOOK.md#tenant-resolution-failures` |
| `DATABASE_OPERATION_FAILED` | SEV1 | `docs/OPERATIONS_RUNBOOK.md#database-degradation-or-outage` |
| `EXTERNAL_SERVICE_FAILED` | SEV2 | `docs/OPERATIONS_RUNBOOK.md#third-party-provider-outages` |

## Review cadence

- Weekly: triage open reliability actions.
- Monthly: evaluate SLO and burn-rate thresholds.
- Quarterly: run incident simulation for top three error classes.
