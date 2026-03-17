# Agency Platform

Multi-client marketing agency monorepo with tenant isolation via Row-Level Security. Uses pnpm workspaces and Turborepo.

## User Information

- User has no formal software development experience or education
- User develops repositories 100% through agentic coding as a "solo-developer"
- User prefers best practices and highest standards
- User prefers up to date (2026) research conducted before task execution on proper implementation, best practices, and advanced coding patterns

## Quick Start
- Development: `pnpm dev`
- Build: `pnpm build`
- Test: `pnpm test`

## Architecture
- **Apps**: `apps/` (agency-admin, firm, prospective-clients)
- **Packages**: `packages/` (shared code)
- **Database**: Supabase on port 6543 (never 5432)

## Critical Rules
- Never use `user_metadata` for tenant_id (use `app_metadata`)
- Never expose SUPABASE_SERVICE_ROLE_KEY to client
- Never import between apps (use packages/)
- Never write `any` types (use `unknown` + narrowing)

## Commands

### Single File Operations (Preferred)
```bash
# Type check single file
pnpm tsc --noEmit path/to/file.ts

# Format single file  
pnpm prettier --write path/to/file.ts

# Lint single file
pnpm eslint --fix path/to/file.ts

# Test single file
pnpm vitest run path/to/file.test.ts
```

### Project-Wide Operations (Use Sparingly)
```bash
# Full build (only when explicitly requested)
pnpm build

# Full test suite
pnpm test

# Type check all files
pnpm type-check
```

Note: Always prefer single-file operations for faster feedback loops.

## Safety & Permissions

### ✅ Always Allowed (No Prompt Needed)
- Read files and list directories
- Single file operations (tsc, prettier, eslint, vitest)
- Follow existing patterns and examples
- Use progressive documentation links

### ⚠️ Ask First (Requires Confirmation)
- Package installations (`pnpm add`)
- Database schema changes
- Git operations (commit, push)
- Running full build or test suites
- Modifying CI/CD configuration
- Deleting files or directories

### 🚫 Never Allowed (Prohibited)
- Commit secrets or API keys
- Edit node_modules/ or vendor/ directories
- Bypass RLS policies
- Connect to Supabase on port 5432
- Import between applications

## Project Structure Index

### Key Files for Context
- `apps/firm/src/app/layout.tsx` - Main app layout
- `apps/agency-admin/src/app/layout.tsx` - Admin layout
- `packages/database/src/client.ts` - Database client factory
- `packages/ui/src/components/` - Shared component library
- `packages/design-tokens/src/tokens/` - Design token definitions

### Common Patterns
- Forms: See `apps/firm/src/components/forms/`
- Tables: See `packages/ui/src/components/data-table.tsx`
- Auth: See `packages/database/src/auth.ts`
- API routes: See `apps/*/src/app/api/`

## When Stuck

If unsure about implementation:
1. Ask a clarifying question
2. Propose a short plan with options
3. Reference existing similar patterns
4. Create draft PR with notes for review

Never push large speculative changes without confirmation.

## Test-First Mode (For Complex Features)

When implementing new features:
1. Write/update unit tests first
2. Code until tests pass
3. Add integration tests for critical paths
4. Update documentation

For bug fixes:
1. Add failing test that reproduces issue
2. Fix code to make test pass
3. Verify no regressions

## File Structure

```
apps/
├── agency-admin/          # Port 3001 - Internal management
├── firm/                  # Port 3000 - Agency website
└── prospective-clients/   # Demo templates

packages/                  # Shared code
├── ui/                    # shadcn/ui components
├── database/              # Supabase client factories
├── design-tokens/         # W3C DTCG tokens
└── [other packages]

.agents/                   # Shared patterns and utilities
├── database.md           # Database-specific patterns
├── security.md           # Security guidelines
├── testing.md            # Testing patterns
└── deployment.md         # Deployment procedures

supabase/
├── migrations/            # Database schema changes
└── tests/                # pgTAP RLS tests
```

## Tech Stack

- **Next.js 16.1** with Turbopack (default, no flags needed)
- **React 19, TypeScript 5** strict mode
- **Tailwind CSS v4** (CSS-first, @import "tailwindcss", @theme {} for tokens)
- **pnpm 10** (catalog: protocol for versions, workspace:* for internal packages)
- **Turborepo 2.7** (turbo.json defines the task pipeline)
- **Supabase** (PostgreSQL + Auth + Storage) — Port 6543 (Supavisor), not 5432

## Navigation

For detailed patterns, see:
- Database work: `@.agents/database.md`
- UI components: `@packages/ui/AGENTS.md`
- Security: `@.agents/security.md`
- Testing: `@.agents/testing.md`
- Client apps: See specific app AGENTS.md files
