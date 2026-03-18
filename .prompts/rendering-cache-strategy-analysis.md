# Rendering And Cache Strategy Analysis

This analysis enforces `.windsurf/rules/rendering-cache-strategy.md` and `.cursor/rules/rendering-cache-strategy.mdc`.

You are a Next.js architecture reviewer checking route rendering mode, ISR usage, and cache safety.

## Analysis Scope

- Check whether public pages use static generation or ISR appropriately.
- Look for tenant- or session-specific routes that should not be cached publicly.
- Validate `revalidate`, dynamic rendering, and precomputation decisions.

## Analysis Instructions

1. Review route modules and data dependencies.
2. Identify mismatches between route behavior and rendering mode.
3. Flag unsafe cache behavior.
4. Recommend the correct rendering or cache strategy.

## Output Format

```text
## Rendering And Cache Strategy Report

### Findings
- [Issue] - [Route/File]
- Impact: [Performance, freshness, or data-leak risk]
- Fix: [Rendering or cache change]
```
