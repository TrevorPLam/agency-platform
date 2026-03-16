# @agency/artifacts

Artifact lifecycle management and registry for Agency Platform. Provides centralized artifact tracking, automated promotion pipelines, policy-driven management, and retention policies.

## Features

### 🏷️ Centralized Artifact Registry
- Track all build artifacts with metadata and integrity verification
- Support for multiple artifact types (packages, containers, binaries, documents)
- Full audit trail and version history
- Tenant isolation with Row-Level Security (RLS)

### 🚀 Automated Promotion Pipelines
- Environment-based promotion (development → staging → production)
- Approval workflows with configurable requirements
- Automated security, performance, and compliance checks
- Integration with GitHub Actions

### 🏛️ Policy-Driven Management
- Configurable policy rules for security, compliance, and retention
- Automated policy evaluation and enforcement
- Integration with existing governance framework
- Real-time policy violation detection

### 🗄️ Retention Management
- Automated cleanup based on configurable policies
- Archive and delete old artifacts
- Storage optimization and cost management
- Exception handling for critical versions

## Installation

```bash
pnpm add @agency/artifacts
```

## Quick Start

### Register an Artifact

```typescript
import { artifactRegistry } from '@agency/artifacts/registry';

const artifact = await artifactRegistry.registerArtifact(
  'my-app',
  '1.0.0',
  'package',
  'development',
  fileContent,
  {
    buildId: 'build-123',
    commitSha: 'abc123',
    branch: 'main',
    author: 'developer@example.com',
    description: 'Application package',
    tags: ['web', 'production'],
    dependencies: ['react', 'typescript'],
  }
);
```

### Create a Promotion Request

```typescript
import { artifactPromotion } from '@agency/artifacts/promotion';

const promotion = await artifactPromotion.createPromotionRequest(
  artifact.id,
  'staging',
  2 // Required approvals
);
```

### Approve a Promotion

```typescript
const approvedPromotion = await artifactPromotion.approvePromotion(
  promotion.id,
  'approver@example.com'
);
```

### Apply Retention Policies

```typescript
import { retentionManager } from '@agency/artifacts/retention';

const report = await retentionManager.applyRetentionPolicies();
console.log(`Archived: ${report.artifactsArchived}, Deleted: ${report.artifactsDeleted}`);
```

## CLI Tools

### Register Artifact

```bash
pnpm run register-artifact \
  --name "my-app" \
  --version "1.0.0" \
  --type "package" \
  --environment "development" \
  --file "./dist/my-app.tar.gz" \
  --build-id "build-123" \
  --commit-sha "abc123" \
  --branch "main" \
  --author "developer@example.com" \
  --description "Application package" \
  --tags "web,production"
```

### Promote Artifact

```bash
# Create promotion request
pnpm run promote-artifact \
  --artifact-id "my-app-1.0.0-development-abc123" \
  --environment "staging" \
  --required-approvals 2

# Approve promotion
pnpm run promote-artifact \
  --artifact-id "my-app-1.0.0-development-abc123" \
  --environment "staging" \
  --approve \
  --approver "reviewer@example.com"

# Reject promotion
pnpm run promote-artifact \
  --artifact-id "my-app-1.0.0-development-abc123" \
  --environment "staging" \
  --reject \
  --reason "Security scan failed"
```

### Cleanup Artifacts

```bash
# Dry run to see what would be deleted
pnpm run cleanup-artifacts --dry-run --report

# Actual cleanup
pnpm run cleanup-artifacts --report

# Environment-specific cleanup
pnpm run cleanup-artifacts --environment "production" --dry-run
```

## API Reference

### ArtifactRegistry

#### Methods

- `registerArtifact(name, version, type, environment, content, metadata)` - Register a new artifact
- `getArtifact(id)` - Get artifact by ID
- `listArtifacts(filters)` - List artifacts with optional filtering
- `updateArtifactStatus(id, status)` - Update artifact status
- `updateArtifactMetadata(id, metadata)` - Update artifact metadata
- `deleteArtifact(id)` - Delete an artifact
- `searchArtifacts(query, limit)` - Search artifacts
- `getStatistics()` - Get registry statistics

### ArtifactPromotion

#### Methods

- `createPromotionRequest(artifactId, toEnvironment, requiredApprovals)` - Create promotion request
- `approvePromotion(promotionId, approver)` - Approve a promotion
- `rejectPromotion(promotionId, reason, rejector)` - Reject a promotion
- `getPromotionStep(promotionId)` - Get promotion details
- `listArtifactPromotions(artifactId)` - List promotions for an artifact
- `listPendingPromotions(environment)` - List pending promotions

### PolicyManager

#### Methods

- `createPolicy(rule)` - Create a policy rule
- `getPolicy(policyId)` - Get policy by ID
- `listPolicies(filters)` - List policies
- `updatePolicy(policyId, updates)` - Update a policy
- `deletePolicy(policyId)` - Delete a policy
- `evaluatePolicies(artifact)` - Evaluate policies against an artifact

### RetentionManager

#### Methods

- `createRetentionPolicy(policy)` - Create retention policy
- `getRetentionPolicy(policyId)` - Get retention policy
- `listRetentionPolicies(environment)` - List retention policies
- `updateRetentionPolicy(policyId, updates)` - Update retention policy
- `deleteRetentionPolicy(policyId)` - Delete retention policy
- `applyRetentionPolicies()` - Apply retention policies
- `getRetentionStatistics()` - Get retention statistics

## Types

### ArtifactType

```typescript
type ArtifactType = 'package' | 'container' | 'binary' | 'document';
```

### ArtifactStatus

```typescript
type ArtifactStatus = 'created' | 'testing' | 'staging' | 'production' | 'archived' | 'deprecated';
```

### Environment

```typescript
type Environment = 'development' | 'staging' | 'production';
```

### PolicyType

```typescript
type PolicyType = 'retention' | 'promotion' | 'security' | 'compliance';
```

## Database Schema

The artifact management system uses the following database tables:

- `artifacts` - Main artifact registry
- `promotion_steps` - Promotion workflow steps
- `promotion_approvals` - Promotion approval records
- `promotion_rejections` - Promotion rejection records
- `policy_rules` - Policy rule definitions
- `retention_policies` - Retention policy configurations
- `promotion_checks` - Promotion check results

All tables include Row-Level Security (RLS) for tenant isolation.

## Configuration

### Environment Variables

```bash
# Supabase configuration
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional: GitHub token for integration
GITHUB_TOKEN=your_github_token
```

### Retention Policy Defaults

```typescript
const defaultRetentionPolicy = {
  development: {
    maxAge: 30,        // days
    maxVersions: 3,    // versions per artifact
    archiveOlderThan: 15, // days
    deleteOlderThan: 30,  // days
  },
  staging: {
    maxAge: 90,
    maxVersions: 5,
    archiveOlderThan: 45,
    deleteOlderThan: 90,
  },
  production: {
    maxAge: 365,
    maxVersions: 10,
    archiveOlderThan: 180,
    deleteOlderThan: 365,
  },
};
```

## Integration with CI/CD

### GitHub Actions

The system includes GitHub Actions workflows for:

- **Artifact Promotion** (`artifact-promotion.yml`) - Manual and automated promotions
- **CI Integration** (`artifact-integration.yml`) - Build, test, and validation
- **Retention Cleanup** - Scheduled cleanup jobs

### Example Workflow Integration

```yaml
- name: Register build artifact
  run: |
    pnpm tsx scripts/artifacts/register-artifact.ts \
      --name "my-app" \
      --version "${{ github.sha }}" \
      --type "package" \
      --environment "staging" \
      --file "./dist/my-app.tar.gz" \
      --build-id "${{ github.run_id }}" \
      --commit-sha "${{ github.sha }}" \
      --branch "${{ github.ref_name }}" \
      --author "${{ github.actor }}"

- name: Promote to production
  if: github.ref == 'refs/heads/main'
  run: |
    pnpm tsx scripts/artifacts/promote-artifact.ts \
      --artifact-id "my-app-${{ github.sha }}-staging" \
      --environment "production" \
      --approve \
      --approver "github-actions"
```

## Security Considerations

### Row-Level Security (RLS)

All database tables use RLS to ensure tenant isolation:

```sql
-- Only users can access artifacts in their tenant
CREATE POLICY "Users can view artifacts in their tenant" ON public.artifacts
  FOR SELECT USING (tenant_id = public.tenant_id());
```

### Integrity Verification

All artifacts are cryptographically verified:

```typescript
// SHA-256 integrity hash
const integrity = `sha256:${hash.digest('hex')}`;
```

### Access Controls

- Service role keys are never exposed to client code
- Tenant isolation enforced at database level
- Approval workflows for production promotions
- Policy-based access controls

## Monitoring and Observability

### Metrics

The system provides comprehensive metrics:

- Artifact counts by type, environment, and status
- Promotion success/failure rates
- Retention policy execution statistics
- Storage usage and optimization metrics

### Logging

All operations are logged with:

- Timestamp and user context
- Operation details and results
- Error handling and troubleshooting
- Audit trail for compliance

## Troubleshooting

### Common Issues

1. **TypeScript Configuration Errors**
   - Ensure `@agency/typescript-config` is installed
   - Check workspace dependencies in `pnpm-workspace.yaml`

2. **Database Connection Issues**
   - Verify Supabase credentials
   - Check database migration status
   - Ensure RLS policies are correctly configured

3. **Permission Errors**
   - Verify user has appropriate tenant access
   - Check service role key permissions
   - Review RLS policy definitions

### Debug Mode

Enable debug logging:

```typescript
// Set environment variable
DEBUG=artifacts:* pnpm run dev
```

## Contributing

1. Follow the existing code patterns and TypeScript strict mode
2. Add comprehensive tests for new features
3. Update documentation for API changes
4. Ensure RLS policies are updated for schema changes
5. Test integration with existing CI/CD workflows

## License

ISC License - see LICENSE file for details.
