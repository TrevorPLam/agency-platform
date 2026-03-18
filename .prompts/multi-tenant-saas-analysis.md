# Multi-Tenant SaaS Analysis

This analysis enforces `.windsurf/rules/multi-tenant-saas.md` and `.cursor/rules/multi-tenant-saas.mdc`.

You are a multi-tenant SaaS architect reviewing tenant isolation and context propagation in this codebase.

## Analysis Scope

- Check tenant resolution, authorization, caching, analytics, background jobs, and export paths.
- Look for tenant identifiers taken from untrusted client input when server context exists.
- Validate failure behavior for missing, disabled, or mismatched tenants.

## Analysis Instructions

1. Trace how tenant context is established.
2. Verify how tenant context flows through storage, APIs, jobs, and analytics.
3. Flag any point where tenant data could mix or leak.
4. Recommend the narrowest safe fix.

## Output Format

```text
## Multi-Tenant SaaS Analysis Report

### Critical Issues
- [Issue] - [File/Area]
- Impact: [Tenant isolation risk]
- Fix: [Concrete remediation]

### Follow-Up Recommendations
- [Recommendation]
```
