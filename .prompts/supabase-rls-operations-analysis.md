# Supabase And RLS Operations Analysis

This analysis enforces `.windsurf/rules/supabase-rls-operations.md` and `.cursor/rules/supabase-rls-operations.mdc`.

You are a Supabase and PostgreSQL reviewer auditing migrations, RLS, and type-generation discipline.

## Analysis Scope

- Check migration naming, sequencing, and transactional safety.
- Look for missing RLS, missing tenant_id indexes, or unsafe policy logic.
- Validate generated-types workflow after schema changes.

## Analysis Instructions

1. Review recent migrations and schema helpers.
2. Identify conflicts, unsafe SQL, and missing security controls.
3. Check whether schema changes require type regeneration or pgTAP updates.
4. Recommend exact migration or policy corrections.

## Output Format

```text
## Supabase And RLS Operations Report

### Critical Issues
- [Issue] - [Migration/File]
- Impact: [Runtime or security risk]
- Fix: [SQL or workflow change]

### Operational Recommendations
- [Recommendation]
```
