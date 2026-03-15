# PostHog Deployment and Self-Hosting

This document covers the decision criteria for PostHog Cloud vs self-hosted deployment, hardware and tuning for self-hosting, and GDPR compliance settings used in the agency platform.

## Cloud vs Self-Hosted: Break-Even

PostHog’s own guidance: for most teams below ~5M events/month, self-hosting is not cost-effective. Approximate break-even as of March 2026:

| Monthly Event Volume | Cloud Cost | Hetzner CCX23 Infra | Ops Cost (@$50/hr, 2 hr/mo) | Net Self-Hosted | Net Saving |
|----------------------|------------|----------------------|-----------------------------|------------------|------------|
| 1M                   | **$0**     | ~$34                 | ~$100                       | ~$134            | Cloud wins by $134 |
| 3M                   | ~$84       | ~$34                 | ~$100                       | ~$134            | Cloud wins by $50 |
| **~4–5M**            | ~$130–150  | ~$34                 | ~$100                       | ~$134            | **Break-even** |
| 10M                  | ~$324      | ~$34                 | ~$100                       | ~$134            | Self-hosted saves ~$190 |

If most events are identified (logged-in users), Cloud’s identified-event pricing is higher; break-even can drop to ~2–3M events/month.

**Recommendation:** Start with PostHog Cloud’s free tier. Move to self-hosted on Hetzner when event volume or GDPR/data-residency requirements justify it.

## Self-Hosting Hardware: CCX23 Required

PostHog needs at least 4 vCPU and 16 GB RAM.

- **CPX31:** 8 GB RAM — insufficient.
- **CPX41:** 16 GB RAM but shared vCPUs — ClickHouse merge work can cause CPU steal.

Use the **Hetzner CCX23**: 4 dedicated AMD vCPUs, 16 GB RAM, 230 GB NVMe (~€31.49/month post–April 2026). Deploy in **FSN1** or **NBG1** (Falkenstein or Nuremberg) for EU data residency.

## ClickHouse Tuning (Self-Hosted)

Default `background_pool_size` is 16. On a 4-vCPU node this can drive 300%+ CPU usage. Set it to **2** before going live.

Example `clickhouse/config.d/memory.xml`:

```xml
<?xml version="1.0"?>
<clickhouse>
    <max_server_memory_usage>12884901888</max_server_memory_usage>
    <max_memory_usage_for_all_queries>9663676416</max_memory_usage_for_all_queries>

    <background_pool_size>2</background_pool_size>
    <background_merges_mutations_concurrency_ratio>1</background_merges_mutations_concurrency_ratio>
    <background_move_pool_size>1</background_move_pool_size>

    <max_threads>2</max_threads>

    <logger>
        <level>warning</level>
        <size>100M</size>
        <count>3</count>
    </logger>
</clickhouse>
```

## Per-Client Setup

Each client has its own PostHog project. Set per client in Vercel (or `.env.local`):

- `NEXT_PUBLIC_POSTHOG_KEY` — project key from PostHog Cloud (or your self-hosted project).
- `NEXT_PUBLIC_POSTHOG_HOST` — e.g. `https://us.i.posthog.com` (Cloud US) or your self-hosted URL.

The `@agency/analytics` package calls `initAnalytics(tenantSlug)` and registers `{ tenant: tenantSlug }` as a super property so events can be filtered by tenant even in a shared project.

## GDPR Compliance

- **IP capture:** Disabled in the platform SDK. In `packages/analytics/src/client.ts`, `initAnalytics` uses `ph.set_config({ capture_ip: false })` in the `loaded` callback so IP is not stored.
- **Self-hosted:** Use the `beforeStorage` anonymization plugin in PostHog’s plugin server to strip PII before data is written to ClickHouse.
