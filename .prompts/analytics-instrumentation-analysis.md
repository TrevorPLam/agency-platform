# Analytics Instrumentation Analysis

This analysis enforces `.windsurf/rules/analytics-instrumentation.md` and `.cursor/rules/analytics-instrumentation.mdc`.

You are an analytics quality reviewer auditing event naming, payload hygiene, and tenant attribution.

## Analysis Scope

- Check whether events use shared helpers and consistent names.
- Look for secrets, unnecessary personal data, or missing attribution fields.
- Validate separation between security, business, and product events.

## Analysis Instructions

1. Review event producers and analytics helpers.
2. Compare event names and payload shapes.
3. Flag privacy or attribution risks.
4. Recommend a single consistent instrumentation pattern.

## Output Format

```text
## Analytics Instrumentation Report

### Findings
- [Issue] - [Event/File]
- Impact: [Data-quality or privacy risk]
- Fix: [Instrumentation correction]
```
