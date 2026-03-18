---
description: Run PostHog deployment, privacy, and tenant-filtering review for analytics infrastructure
globs: ["docs/POSTHOG_DEPLOYMENT.md", "packages/analytics/**", "apps/**"]
---
# PostHog Privacy And Deployment

<audit_rules>
- You MUST preserve the documented Cloud versus self-hosted decision model unless architecture is deliberately changed.
- You MUST keep analytics configuration privacy-aware, especially around IP capture, personal data, and tenant segmentation.
- You MUST keep tenant attribution compatible with the repo's shared analytics strategy.
- You MUST reject code that assumes self-hosted infrastructure behavior without an explicit deployment change.
- You MUST respect GDPR and data-residency requirements already documented for analytics.
</audit_rules>

**How to check**: Review analytics initialization, environment assumptions, tenant filters, and privacy-related config against the documented PostHog deployment guidance.

**Related rules**: analytics-instrumentation, data-privacy-engineering, compliance-governance.
