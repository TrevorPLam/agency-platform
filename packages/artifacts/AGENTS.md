# @agency/artifacts Package

## User Information

- User has no formal software development experience or education
- User develops repositories 100% through agentic coding as a "solo-developer"
- User prefers best practices and highest standards
- User prefers up to date (2026) research conducted before task execution on proper implementation, best practices, and advanced coding patterns

## Purpose

Artifact lifecycle management for build outputs and deployment assets. This package provides centralized artifact handling with integrity verification and promotion workflows.

## Agent Skills (Available Commands)
- `pnpm artifacts:register` - Register new artifact
- `pnpm artifacts:promote` - Promote artifact to next environment
- `pnpm artifacts:verify` - Verify artifact integrity
- `pnpm artifacts:cleanup` - Clean up old artifacts

## Integration Points
- Depends on: `@agency/security` for integrity verification
- Used by: CI/CD pipelines for artifact management
- See also: `@.agents/security.md` for artifact security
- Reference: `docs/ARTIFACTS.md` for artifact lifecycle procedures

## Core Patterns

### Artifact Registration
```typescript
// ✅ Correct - Secure artifact registration
import { registerArtifact } from '@agency/artifacts';

async function registerBuildArtifact(artifactPath: string) {
  const hash = await calculateSHA256(artifactPath);
  
  return await registerArtifact({
    path: artifactPath,
    hash,
    environment: 'staging',
    integrity: 'verified',
  });
}

// ❌ Incorrect - No integrity verification
async function badRegister(artifactPath: string) {
  return await registerArtifact({
    path: artifactPath,
    // No hash or integrity check
  });
}
```

### Environment Promotion
```typescript
// ✅ Correct - Verified promotion
import { promoteArtifact } from '@agency/artifacts';

async function promoteToProduction(artifactId: string) {
  const artifact = await getArtifact(artifactId);
  
  if (artifact.integrity !== 'verified') {
    throw new Error('Cannot promote unverified artifact');
  }
  
  return await promoteArtifact(artifactId, 'production');
}

// ❌ Incorrect - Unverified promotion
async function badPromote(artifactId: string) {
  return await promoteArtifact(artifactId, 'production'); // No checks!
}
```

## Package Commands

```bash
# Register artifact
pnpm artifacts:register --path=./dist/app.js --env=staging

# Promote artifact
pnpm artifacts:promote --id=artifact-123 --env=production

# Verify integrity
pnpm artifacts:verify --id=artifact-123

# Cleanup old artifacts
pnpm artifacts:cleanup --older-than=30d
```

## File Structure

```
packages/artifacts/
├── src/
│   ├── index.ts              # Main exports
│   ├── registry.ts           # Artifact registration
│   ├── promotion.ts          # Environment promotion
│   ├── verification.ts       # Integrity verification
│   └── cleanup.ts            # Artifact cleanup
├── AGENTS.md                 # This file
├── package.json
└── tsconfig.json
```

## Key Exports

### registerArtifact()
```typescript
import { registerArtifact } from '@agency/artifacts';

await registerArtifact({
  path: './dist/app.js',
  hash: 'sha256:abc123...',
  environment: 'staging',
  metadata: { build_number: 123 },
});
```

### promoteArtifact()
```typescript
import { promoteArtifact } from '@agency/artifacts';

await promoteArtifact('artifact-123', 'production', {
  verified_by: 'ci-cd',
  promotion_reason: 'release-v1.2.0',
});
```

## Security Requirements

### Integrity Verification
```typescript
// ✅ Correct - Hash verification
import { verifyArtifact } from '@agency/artifacts';

async function verifyBeforeDeploy(artifactId: string) {
  const verification = await verifyArtifact(artifactId);
  
  if (!verification.valid) {
    throw new Error('Artifact integrity check failed');
  }
  
  return verification;
}

// ❌ Incorrect - Skip verification
async function badDeploy(artifactId: string) {
  // Deploy without verification
  return deploy(artifactId);
}
```

### Access Control
```typescript
// ✅ Correct - Permission check
import { canPromote } from '@agency/artifacts';

async function promoteWithPermission(user: User, artifactId: string) {
  if (!await canPromote(user, 'production')) {
    throw new Error('Insufficient permissions');
  }
  
  return await promoteArtifact(artifactId, 'production');
}

// ❌ Incorrect - No permission check
async function badPromote(user: User, artifactId: string) {
  return await promoteArtifact(artifactId, 'production'); // No auth!
}
```

## Testing Patterns

### Mock Registry
```typescript
// test/setup.ts
import { vi } from 'vitest';
import { registerArtifact, promoteArtifact } from '@agency/artifacts';

vi.mock('@agency/artifacts', () => ({
  registerArtifact: vi.fn(),
  promoteArtifact: vi.fn(),
  verifyArtifact: vi.fn(),
}));
```

### Unit Tests
```typescript
import { registerArtifact } from '@agency/artifacts';

describe('Artifact Management', () => {
  it('registers artifact with integrity check', async () => {
    const artifact = await registerArtifact({
      path: './test.js',
      hash: 'sha256:test123',
      environment: 'staging',
    });
    
    expect(artifact.integrity).toBe('verified');
  });
});
```

## Dependencies

This package depends on:
- `crypto` - Hash generation
- TypeScript - For type safety

## Progressive Documentation

For more details:
- `@.agents/security.md` - Artifact security guidelines
- `docs/ARTIFACTS.md` - Complete artifact lifecycle
- `docs/DEPLOYMENT.md` - Deployment procedures
