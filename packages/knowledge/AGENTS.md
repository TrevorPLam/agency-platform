# @agency/knowledge Package

## User Information

- User has no formal software development experience or education
- User develops repositories 100% through agentic coding as a "solo-developer"
- User prefers best practices and highest standards
- User prefers up to date (2026) research conducted before task execution on proper implementation, best practices, and advanced coding patterns

## Purpose

Knowledge management system with automated documentation capture and AI-powered search. This package provides intelligent knowledge organization and retrieval for development workflows.

## Agent Skills (Available Commands)
- `pnpm knowledge:capture` - Capture knowledge from codebase
- `pnpm knowledge:index` - Index knowledge for search
- `pnpm knowledge:search` - Search knowledge base
- `pnpm knowledge:audit` - Audit knowledge quality

## Integration Points
- Depends on: `@agency/database` for knowledge storage, AI services for search
- Used by: Applications for knowledge features
- See also: `@.agents/security.md` - Knowledge security guidelines
- Reference: `docs/KNOWLEDGE.md` - Complete knowledge management guide

## Core Patterns

### Automated Knowledge Capture
```typescript
// ✅ Correct - Context-aware knowledge extraction
import { captureKnowledge } from '@agency/knowledge';

async function captureCodeKnowledge(filePath: string, tenantId: string) {
  const code = await readFile(filePath);
  const knowledge = await captureKnowledge({
    content: code,
    type: 'code',
    context: {
      file_path: filePath,
      tenant_id: tenantId,
      language: getLanguage(filePath),
      dependencies: extractDependencies(code),
    },
  });
  
  return await storeKnowledge(knowledge);
}

// ❌ Incorrect - Context-free capture
async function badCaptureKnowledge(filePath: string) {
  const code = await readFile(filePath);
  return await captureKnowledge({
    content: code,
    type: 'code',
    // No context, tenant info, or metadata
  });
}
```

### AI-Powered Search
```typescript
// ✅ Correct - Tenant-scoped intelligent search
import { searchKnowledge } from '@agency/knowledge';

async function searchTenantKnowledge(
  query: string,
  tenantId: string,
  context: SearchContext
) {
  return await searchKnowledge({
    query,
    tenant_id: tenantId,
    context: {
      user_role: context.userRole,
      current_task: context.currentTask,
      expertise_level: context.expertiseLevel,
    },
    filters: {
      content_types: ['documentation', 'code', 'examples'],
      date_range: context.dateRange,
    },
  });
}

// ❌ Incorrect - Unscoped search
async function badSearch(query: string) {
  return await searchKnowledge({
    query,
    // No tenant scoping or context
  });
}
```

## Package Commands

```bash
# Capture knowledge from codebase
pnpm knowledge:capture --scope=./src --tenant=tenant-123

# Index knowledge for search
pnpm knowledge:index --rebuild --tenant=tenant-123

# Search knowledge base
pnpm knowledge:search --query="database patterns" --tenant=tenant-123

# Audit knowledge quality
pnpm knowledge:audit --check-duplicates --validate-links
```

## File Structure

```
packages/knowledge/
├── src/
│   ├── index.ts              # Main exports
│   ├── capture.ts            # Knowledge capture
│   ├── indexing.ts           # Search indexing
│   ├── search.ts             # Intelligent search
│   ├── quality.ts            # Quality assessment
│   └── types.ts              # Knowledge types
├── AGENTS.md                 # This file
├── package.json
└── tsconfig.json
```

## Key Exports

### captureKnowledge()
```typescript
import { captureKnowledge } from '@agency/knowledge';

const knowledge = await captureKnowledge({
  content: 'function getUserData() { ... }',
  type: 'code',
  context: {
    file_path: '/src/user.ts',
    tenant_id: 'tenant-123',
    language: 'typescript',
  },
});
```

### searchKnowledge()
```typescript
import { searchKnowledge } from '@agency/knowledge';

const results = await searchKnowledge({
  query: 'database connection patterns',
  tenant_id: 'tenant-123',
  context: {
    user_role: 'developer',
    current_task: 'implementing auth',
  },
});
```

## Security Requirements

### Tenant Isolation
```typescript
// ✅ Correct - Tenant-scoped knowledge
async function getTenantKnowledge(tenantId: string) {
  return await getKnowledge({
    tenant_id: tenantId,
    filters: {
      access_level: 'public', // Respect access controls
    },
  });
}

// ❌ Incorrect - Cross-tenant access
async function badGetAllKnowledge() {
  return await getKnowledge(); // Cross-tenant data leak!
}
```

### Content Filtering
```typescript
// ✅ Correct - Filter sensitive content
import { filterSensitiveContent } from '@agency/knowledge';

async function captureSafeKnowledge(content: string, context: any) {
  const filteredContent = await filterSensitiveContent(content);
  
  return await captureKnowledge({
    content: filteredContent,
    context,
    sensitivity_level: 'public',
  });
}

// ❌ Incorrect - No content filtering
async function badCaptureKnowledge(content: string, context: any) {
  return await captureKnowledge({
    content, // Could contain secrets!
    context,
  });
}
```

## Testing Patterns

### Mock Knowledge Service
```typescript
// test/setup.ts
import { vi } from 'vitest';
import { captureKnowledge, searchKnowledge } from '@agency/knowledge';

vi.mock('@agency/knowledge', () => ({
  captureKnowledge: vi.fn(),
  searchKnowledge: vi.fn(),
  indexKnowledge: vi.fn(),
}));
```

### Unit Tests
```typescript
import { captureKnowledge, searchKnowledge } from '@agency/knowledge';

describe('Knowledge Management', () => {
  it('captures knowledge with proper context', async () => {
    await captureKnowledge({
      content: 'const x = 1;',
      type: 'code',
      context: {
        file_path: '/src/test.ts',
        tenant_id: 'tenant-123',
        language: 'typescript',
      },
    });
    
    expect(captureKnowledge).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'code',
        context: expect.objectContaining({
          tenant_id: 'tenant-123',
          language: 'typescript',
        }),
      })
    );
  });
});
```

## Dependencies

This package depends on:
- `@agency/database` - Knowledge storage
- AI service - For intelligent search
- TypeScript - For type safety

## Knowledge Categories

### Code Knowledge
```typescript
// Capture code patterns and examples
await captureKnowledge({
  content: `
    // Database connection pattern
    const client = createClient();
    const data = await client.from('users').select('*');
  `,
  type: 'code',
  category: 'database_patterns',
  context: {
    tenant_id: 'tenant-123',
    language: 'typescript',
  },
});
```

### Documentation Knowledge
```typescript
// Capture documentation insights
await captureKnowledge({
  content: 'Use Row-Level Security for tenant isolation',
  type: 'documentation',
  category: 'security_guidelines',
  context: {
    source: 'SECURITY.md',
    tenant_id: 'tenant-123',
  },
});
```

## Progressive Documentation

For more details:
- `@.agents/security.md` - Security guidelines
- `@packages/database/AGENTS.md` - Database patterns
- `docs/KNOWLEDGE.md` - Complete knowledge management guide
