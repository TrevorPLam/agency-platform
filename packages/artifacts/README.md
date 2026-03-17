# @agency/artifacts

<div align="center">

**Enterprise-grade artifact lifecycle management and registry**

[![npm version](https://img.shields.io/npm/v/@agency/artifacts)](https://www.npmjs.com/package/@agency/artifacts)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-ISC-blue)](LICENSE)

</div>

Provides centralized artifact tracking, automated promotion pipelines, policy-driven management, and retention policies for Agency Platform.

## 🚀 Features

### 🏷️ Centralized Artifact Registry
- **Multi-Type Support** - Packages, containers, binaries, documents
- **Metadata Tracking** - Complete artifact lifecycle information
- **Integrity Verification** - Cryptographic SHA-256 verification
- **Tenant Isolation** - Row-Level Security (RLS) for multi-tenant safety
- **Audit Trail** - Complete version history and change tracking

### 🚀 Automated Promotion Pipelines
- **Environment-Based Promotion** - development → staging → production
- **Approval Workflows** - Configurable approval requirements
- **Automated Checks** - Security, performance, and compliance validation
- **GitHub Actions Integration** - Seamless CI/CD pipeline integration
- **Rollback Support** - Quick rollback to previous stable versions

### 🏛️ Policy-Driven Management
- **Configurable Policies** - Security, compliance, and retention rules
- **Real-Time Evaluation** - Automated policy violation detection
- **Governance Integration** - Existing framework compatibility
- **Dynamic Policy Updates** - Runtime policy modification support

### 🗄️ Intelligent Retention Management
- **Automated Cleanup** - Policy-based artifact removal
- **Archive Management** - Smart archival with exception handling
- **Storage Optimization** - Cost-effective storage utilization
- **Compliance Support** - Regulatory retention requirements

## 📦 Installation

```bash
pnpm add @agency/artifacts
```

## 🔧 Configuration

### Environment Variables

```bash
# Supabase configuration
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional: GitHub token for integration
GITHUB_TOKEN=your_github_token

# Optional: Artifact storage configuration
ARTIFACT_STORAGE_URL=your_storage_url
ARTIFACT_STORAGE_KEY=your_storage_key
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

## 🚀 Quick Start

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

## 🔒 Security Considerations

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

- **Service Role Keys** - Never exposed to client code
- **Tenant Isolation** - Enforced at database level
- **Approval Workflows** - Required for production promotions
- **Policy-Based Access** - Role-based permissions
- **Audit Logging** - Complete operation tracking

### Compliance Frameworks

- **SOC 2** - Security and availability controls
- **ISO 27001** - Information security management
- **GDPR** - Data protection and privacy
- **HIPAA** - Healthcare data protection

## 📊 Monitoring and Observability

### Metrics Dashboard

The system provides comprehensive metrics:

| Metric Category | Specific Metrics | Purpose |
|----------------|------------------|---------|
| **Artifact Metrics** | Counts by type, environment, status | Inventory tracking |
| **Promotion Metrics** | Success/failure rates, approval times | Process efficiency |
| **Retention Metrics** | Cleanup statistics, storage savings | Cost optimization |
| **Security Metrics** | Access attempts, policy violations | Security monitoring |
| **Performance Metrics** | Upload/download times, processing latency | System health |

### Logging and Auditing

All operations are logged with:

- **Timestamp and User Context** - Who did what when
- **Operation Details** - Complete request/response information
- **Error Handling** - Comprehensive error tracking
- **Audit Trail** - Compliance-ready logging
- **Performance Data** - Latency and throughput metrics

### Alerting

Configurable alerts for:

- Promotion failures
- Policy violations
- Storage threshold breaches
- Security incidents
- Performance degradation

## 🆘 **Troubleshooting & Support**

### **🔧 Common Issues & Solutions**

#### **1. Artifact Registration Failures**

**Symptoms**: Artifact upload fails, integrity check errors

**Solutions**:
- ✅ Verify file integrity: `sha256sum your-file.tar.gz`
- ✅ Check storage configuration and credentials
- ✅ Ensure proper file permissions and size limits
- ✅ Validate metadata schema compliance

```typescript
// Debug artifact registration
const debugRegistration = async (artifactData) => {
  try {
    console.log('Registering artifact:', artifactData.name)
    const result = await artifactRegistry.registerArtifact(artifactData)
    console.log('Registration successful:', result.id)
  } catch (error) {
    console.error('Registration failed:', error.message)
    console.log('Debug info:', {
      fileSize: artifactData.content.length,
      checksum: artifactData.integrity,
      metadata: artifactData.metadata
    })
  }
}
```

#### **2. Promotion Workflow Issues**

**Symptoms**: Promotion requests stuck, approval failures

**Solutions**:
- ✅ Check user permissions for promotion approval
- ✅ Verify promotion policies and requirements
- ✅ Ensure artifact passes all validation checks
- ✅ Review GitHub Actions workflow status

```typescript
// Debug promotion workflow
const debugPromotion = async (promotionId) => {
  const promotion = await artifactPromotion.getPromotionStep(promotionId)
  console.log('Promotion status:', promotion.status)
  console.log('Required approvals:', promotion.requiredApprovals)
  console.log('Current approvals:', promotion.approvals.length)
  
  // Check validation results
  const checks = await artifactPromotion.getPromotionChecks(promotionId)
  console.log('Validation checks:', checks)
}
```

#### **3. Retention Policy Problems**

**Symptoms**: Cleanup not running, artifacts not being archived

**Solutions**:
- ✅ Verify retention policy configuration
- ✅ Check scheduled job execution status
- ✅ Ensure proper tenant scoping for cleanup
- ✅ Review storage quota and limits

```typescript
// Debug retention policies
const debugRetention = async () => {
  const policies = await retentionManager.listRetentionPolicies()
  console.log('Active policies:', policies)
  
  const stats = await retentionManager.getRetentionStatistics()
  console.log('Retention stats:', stats)
  
  // Dry run to see what would be cleaned up
  const dryRun = await retentionManager.applyRetentionPolicies({ dryRun: true })
  console.log('Dry run results:', dryRun)
}
```

#### **4. Database Connection Issues**

**Symptoms**: Connection timeouts, RLS policy errors

**Solutions**:
- ✅ Verify Supabase credentials and connection pool
- ✅ Check RLS policy definitions and tenant context
- ✅ Ensure database migrations are applied
- ✅ Monitor connection pool utilization

```typescript
// Debug database connection
const debugDatabase = async () => {
  try {
    // Test basic connection
    const result = await supabase.from('artifacts').select('count').single()
    console.log('Database connection OK:', result)
    
    // Test RLS policy
    const tenantArtifacts = await supabase
      .from('artifacts')
      .select('*')
      .eq('tenant_id', getCurrentTenantId())
    console.log('RLS policy test:', tenantArtifacts.data?.length || 0, 'artifacts')
  } catch (error) {
    console.error('Database error:', error.message)
  }
}
```

#### **5. Performance Issues**

**Symptoms**: Slow uploads, high memory usage, timeout errors

**Solutions**:
- ✅ Implement chunked uploads for large files
- ✅ Optimize database queries with proper indexing
- ✅ Monitor memory usage and implement streaming
- ✅ Use CDN for artifact distribution

```typescript
// Debug performance
const debugPerformance = async (artifactFile) => {
  const startTime = Date.now()
  
  // Monitor upload progress
  const uploadProgress = (progress) => {
    console.log(`Upload progress: ${progress.percent}%`)
  }
  
  try {
    await artifactRegistry.registerArtifact(artifactFile, { onProgress: uploadProgress })
    const duration = Date.now() - startTime
    console.log(`Upload completed in ${duration}ms`)
  } catch (error) {
    console.error('Performance error:', error.message)
  }
}
```

### **🔍 Advanced Debugging Tools**

#### **Artifact Integrity Verification**
```typescript
// Comprehensive integrity check
export function verifyArtifactIntegrity(artifact) {
  const checks = {
    size: artifact.content.length === artifact.metadata.size,
    checksum: artifact.integrity === calculateSHA256(artifact.content),
    format: isValidArtifactFormat(artifact.type),
    metadata: validateMetadataSchema(artifact.metadata)
  }
  
  const allValid = Object.values(checks).every(Boolean)
  console.log('Integrity check results:', checks)
  return allValid
}
```

#### **Policy Evaluation Debugger**
```typescript
// Debug policy evaluation
export function debugPolicyEvaluation(artifact, policies) {
  const results = policies.map(policy => {
    const evaluation = policy.evaluate(artifact)
    return {
      policyId: policy.id,
      policyType: policy.type,
      result: evaluation.passed ? 'PASS' : 'FAIL',
      reasons: evaluation.reasons || [],
      actions: evaluation.actions || []
    }
  })
  
  console.table(results)
  return results
}
```

#### **Promotion Workflow Monitor**
```typescript
// Monitor promotion workflow health
export async function monitorPromotionHealth() {
  const metrics = {
    pendingPromotions: await artifactPromotion.listPendingPromotions(),
    averageApprovalTime: await calculateAverageApprovalTime(),
    failureRate: await calculatePromotionFailureRate(),
    bottlenecks: await identifyWorkflowBottlenecks()
  }
  
  console.log('Promotion Health Metrics:', metrics)
  
  // Alert on issues
  if (metrics.failureRate > 0.1) {
    console.warn('High promotion failure rate detected')
  }
  
  if (metrics.averageApprovalTime > 24 * 60 * 60 * 1000) {
    console.warn('Slow approval times detected')
  }
  
  return metrics
}
```

### **📞 Getting Help**

**Self-Service Debugging**:
1. Check artifact integrity and metadata
2. Verify database connections and RLS policies
3. Review promotion workflow status
4. Monitor system performance metrics
5. Validate configuration and credentials

**Community Support**:
- **GitHub Issues**: [Agency Platform Issues](https://github.com/agency/platform/issues)
- **Discord Community**: [Join our Discord](https://discord.gg/agency)
- **Documentation**: [Complete artifact management guide](../../docs/artifacts/)
- **Email Support**: artifacts@agency.com

**Emergency Support**:
- **Production Issues**: artifacts-emergency@agency.com (response within 1 hour)
- **Security Incidents**: security@agency.com (immediate response)
- **Performance Issues**: performance@agency.com (response within 4 hours)

**Common Debug Commands**:
```bash
# Check artifact registry health
pnpm run artifacts:health-check

# Validate all artifacts
pnpm run artifacts:validate-all

# Test promotion workflow
pnpm run artifacts:test-promotion

# Cleanup debug artifacts
pnpm run artifacts:cleanup-debug

# Monitor system performance
pnpm run artifacts:monitor
```

## Contributing

1. Follow the existing code patterns and TypeScript strict mode
2. Add comprehensive tests for new features
3. Update documentation for API changes
4. Ensure RLS policies are updated for schema changes
5. Test integration with existing CI/CD workflows

## 📄 License

**ISC License** - see LICENSE file for details.

---

<div align="center">

**Part of the @agency monorepo**

[📖 Documentation](../../docs/) • [🔒 Security](../../SECURITY.md) • [🚀 CI/CD](../../.github/workflows/)

</div>
