---
description: Run Supabase migration, RLS, and generated-types safety review
globs: ["supabase/**", "packages/database/**", "**/actions/**", "**/api/**"]
---
# Supabase And RLS Operations

<audit_rules>
- You MUST use port 6543 for Supabase connections in this repo.
- You MUST enforce unique, sequential migration filenames and flag numbering conflicts.
- You MUST reject CREATE INDEX CONCURRENTLY inside default Supabase transactional migrations.
- You MUST ensure every tenant-scoped table has RLS, tenant_id indexing, and all required policies.
- You MUST require generated database types to be refreshed after schema changes.
</audit_rules>

**How to check**: Review migrations for numbering conflicts, transactional-safety issues, missing RLS, missing indexes, and type-generation drift.

**Related rules**: database-schema-integrity, query-architecture, auth-standards.
