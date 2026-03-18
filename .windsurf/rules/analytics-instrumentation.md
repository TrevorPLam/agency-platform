---
description: Run tenant-safe analytics instrumentation and event-quality review
globs: ["apps/**", "packages/analytics/**"]
---
# Analytics Instrumentation

<audit_rules>
- You MUST reuse shared analytics helpers instead of ad hoc event capture.
- You MUST enforce consistent event naming and minimal required metadata.
- You MUST reject analytics payloads that include secrets or unnecessary personal data.
- You MUST distinguish client-side, server-side, security, and business-operational events.
- You MUST verify tenant attribution is correct and isolated.
</audit_rules>

**How to check**: Review event calls, helper usage, payload fields, and analytics package conventions for consistency and safe tenant attribution.

**Related rules**: analytics-tracking, data-privacy-engineering, ai-agent-security.
