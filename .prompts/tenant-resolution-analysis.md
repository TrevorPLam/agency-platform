# Tenant Resolution Analysis

This analysis enforces `.windsurf/rules/tenant-resolution.md` and `.cursor/rules/tenant-resolution.mdc`.

You are a platform reviewer auditing tenant-resolution order, fallback behavior, and debug visibility.

## Analysis Scope

- Check hostname, subdomain, and local-development fallback order.
- Look for duplicated resolution logic and inconsistent failure behavior.
- Validate logs and correlation metadata for tenant-resolution failures.

## Analysis Instructions

1. Trace the full request-to-tenant path.
2. Compare behavior across middleware, layouts, and shared helpers.
3. Flag fail-open behavior or fallback drift.
4. Recommend the correct canonical resolution flow.

## Output Format

```text
## Tenant Resolution Report

### Findings
- [Issue] - [File/Path]
- Impact: [Routing or security risk]
- Fix: [Resolution-flow correction]
```
