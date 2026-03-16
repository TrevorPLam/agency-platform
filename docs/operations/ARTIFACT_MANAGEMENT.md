# Artifact Lifecycle Management

This document provides comprehensive guidance for managing the Agency Platform's artifact lifecycle management system.

## Overview

The artifact lifecycle management system provides centralized tracking, automated promotion, policy-driven governance, and retention management for all build artifacts. It integrates with existing CI/CD pipelines and follows the agency platform's security and tenant isolation patterns.

## Architecture

### Core Components

1. **Artifact Registry** (`@agency/artifacts/registry`)
   - Centralized artifact tracking with metadata
   - Integrity verification using SHA-256 hashes
   - Full audit trail and version history

2. **Promotion System** (`@agency/artifacts/promotion`)
   - Environment-based promotion workflows
   - Approval mechanisms with configurable requirements
   - Automated security and compliance checks

3. **Policy Engine** (`@agency/artifacts/policies`)
   - Rule-based policy evaluation
   - Real-time policy violation detection
   - Integration with governance framework

4. **Retention Management** (`@agency/artifacts/retention`)
   - Automated cleanup based on configurable policies
   - Storage optimization and cost management
   - Archive and delete workflows

### Database Schema

The system uses Supabase with Row-Level Security (RLS) for tenant isolation:

- **artifacts** - Main artifact registry
- **promotion_steps** - Promotion workflow steps
- **promotion_approvals** - Approval records
- **promotion_rejections** - Rejection records
- **policy_rules** - Policy definitions
- **retention_policies** - Retention configurations
- **promotion_checks** - Check results

## Setup and Configuration

### Prerequisites

1. Supabase project with RLS enabled
2. Database migration applied (`012_artifact_lifecycle_management.sql`)
3. `@agency/artifacts` package installed
4. Environment variables configured

### Environment Variables

```bash
# Required
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional
GITHUB_TOKEN=github_token_for_integration
DEBUG=artifacts:*
```

### Database Migration

Apply the database migration:

```bash
supabase db push
```

Verify migration success:

```bash
supabase test db
```

## Daily Operations

### Monitoring Artifacts

#### View Registry Statistics

```bash
# Using CLI
pnpm tsx -e "
import { artifactRegistry } from '@agency/artifacts/registry';
artifactRegistry.getStatistics().then(console.log);
"

# Or use the cleanup script with --dry-run
pnpm run cleanup-artifacts --dry-run
```

#### Search for Artifacts

```bash
pnpm tsx -e "
import { artifactRegistry } from '@agency/artifacts/registry';
artifactRegistry.searchArtifacts('my-app').then(console.log);
"
```

### Managing Promotions

#### View Pending Promotions

```bash
pnpm tsx -e "
import { artifactPromotion } from '@agency/artifacts/promotion';
artifactPromotion.listPendingPromotions().then(console.log);
"
```

#### Approve Promotions

```bash
# Approve a specific promotion
pnpm run promote-artifact \
  --artifact-id "my-app-1.0.0-staging-abc123" \
  --environment "production" \
  --approve \
  --approver "admin@example.com"
```

#### Reject Promotions

```bash
pnpm run promote-artifact \
  --artifact-id "my-app-1.0.0-staging-abc123" \
  --environment "production" \
  --reject \
  --reason "Security vulnerabilities detected"
```

### Retention Management

#### View Retention Statistics

```bash
pnpm tsx -e "
import { retentionManager } from '@agency/artifacts/retention';
retentionManager.getRetentionStatistics().then(console.log);
"
```

#### Run Cleanup (Dry Run)

```bash
pnpm run cleanup-artifacts --dry-run --report
```

#### Run Cleanup (Production)

```bash
pnpm run cleanup-artifacts --report
```

## Policy Management

### Creating Policies

#### Security Policy

```typescript
import { policyManager } from '@agency/artifacts/policies';

const securityPolicy = await policyManager.createPolicy({
  type: 'security',
  name: 'Block Critical Vulnerabilities',
  description: 'Block artifacts with critical security vulnerabilities',
  enabled: true,
  conditions: [
    {
      field: 'metadata',
      operator: 'contains',
      value: 'critical'
    }
  ],
  actions: [
    {
      type: 'block',
      parameters: {
        message: 'Artifact has critical security vulnerabilities'
      }
    }
  ]
});
```

#### Retention Policy

```typescript
import { retentionManager } from '@agency/artifacts/retention';

const retentionPolicy = await retentionManager.createRetentionPolicy({
  name: 'Strict Production Retention',
  environment: 'production',
  maxAge: 365,
  maxVersions: 10,
  archiveOlderThan: 180,
  deleteOlderThan: 365,
  exceptions: ['*.*.*-release-*'] // Keep release versions
});
```

### Evaluating Policies

```typescript
import { policyManager } from '@agency/artifacts/policies';

const evaluation = await policyManager.evaluatePolicies(artifact);
console.log(`Blocked: ${evaluation.blocked}`);
console.log(`Warnings: ${evaluation.warnings.length}`);
console.log(`Errors: ${evaluation.errors.length}`);
```

## CI/CD Integration

### GitHub Actions Workflows

#### Artifact Promotion Workflow

Trigger: Manual dispatch or main branch push

```yaml
# Manual promotion
name: Artifact Promotion
on:
  workflow_dispatch:
    inputs:
      artifact_id: required
      target_environment: required
      required_approvals: optional
```

#### Integration Workflow

Trigger: Pull request or push to main

```yaml
# CI integration
name: Artifact Integration
on:
  pull_request:
    paths: ['packages/artifacts/**']
  push:
    paths: ['packages/artifacts/**']
```

### Pipeline Integration Examples

#### Register Build Artifacts

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
```

#### Auto-promote on Main Branch

```yaml
- name: Promote to production
  if: github.ref == 'refs/heads/main'
  run: |
    pnpm tsx scripts/artifacts/promote-artifact.ts \
      --artifact-id "my-app-${{ github.sha }}-staging" \
      --environment "production" \
      --approve \
      --approver "github-actions"
```

## Security and Compliance

### Row-Level Security

All database tables use RLS with tenant isolation:

```sql
-- Example RLS policy
CREATE POLICY "Users can view artifacts in their tenant" ON public.artifacts
  FOR SELECT USING (tenant_id = public.tenant_id());
```

### Integrity Verification

All artifacts have SHA-256 integrity hashes:

```typescript
const integrity = `sha256:${hash.digest('hex')}`;
```

### Access Controls

- Service role keys never exposed to client code
- Tenant isolation enforced at database level
- Approval workflows for production promotions
- Policy-based access controls

### Audit Trail

All operations are logged with:
- Timestamp and user context
- Operation details and results
- Error handling and troubleshooting
- Compliance audit information

## Monitoring and Alerting

### Key Metrics

Monitor these metrics regularly:

1. **Artifact Counts**
   - Total artifacts by type and environment
   - Growth trends over time
   - Storage usage by category

2. **Promotion Metrics**
   - Success/failure rates
   - Average time to approval
   - Bottlenecks in promotion pipeline

3. **Retention Metrics**
   - Cleanup execution success
   - Storage savings achieved
   - Policy violation rates

4. **Security Metrics**
   - Vulnerability detection rates
   - Policy block rates
   - Compliance check results

### Alerting Setup

Configure alerts for:

```typescript
// High artifact count
if (stats.totalArtifacts > 10000) {
  alert('High artifact count detected');
}

// Failed promotions
if (promotionErrors > 5) {
  alert('Multiple promotion failures detected');
}

// Security violations
if (securityBlocks > 0) {
  alert('Security policy violations detected');
}
```

### Dashboard Integration

Integrate with existing monitoring dashboards:

```typescript
// Export metrics for dashboard
export const artifactMetrics = {
  totalArtifacts: stats.totalArtifacts,
  promotionSuccessRate: calculateSuccessRate(),
  storageUsage: stats.totalSize,
  securityViolations: securityBlocks,
};
```

## Troubleshooting

### Common Issues

#### Database Connection Issues

**Symptoms**: Connection timeouts, authentication errors

**Solutions**:
1. Verify Supabase credentials
2. Check network connectivity
3. Review RLS policy permissions
4. Ensure service role key is valid

```bash
# Test database connection
supabase db ping
```

#### Permission Errors

**Symptoms**: Access denied, RLS policy violations

**Solutions**:
1. Verify user tenant context
2. Check RLS policy definitions
3. Review service role permissions
4. Ensure tenant_id is correctly set

```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'artifacts';
```

#### Promotion Failures

**Symptoms**: Promotion stuck in pending state

**Solutions**:
1. Check approval requirements
2. Verify security scan results
3. Review policy evaluations
4. Check environment configurations

```bash
# Check promotion status
pnpm tsx -e "
import { artifactPromotion } from '@agency/artifacts/promotion';
artifactPromotion.getPromotionStep('promotion-id').then(console.log);
"
```

#### Retention Policy Issues

**Symptoms**: Cleanup not executing, artifacts not being deleted

**Solutions**:
1. Verify policy configurations
2. Check exception patterns
3. Review artifact metadata
4. Ensure proper tenant isolation

```bash
# Test retention policy
pnpm run cleanup-artifacts --dry-run --report
```

### Debug Mode

Enable comprehensive debugging:

```bash
# Set debug environment
DEBUG=artifacts:* pnpm run dev

# Or enable for specific operations
DEBUG=artifacts:registry,artifacts:promotion pnpm tsx scripts/artifacts/register-artifact.ts ...
```

### Log Analysis

Review logs for troubleshooting:

```bash
# Check recent operations
supabase logs --limit 100

# Filter for artifact operations
supabase logs | grep "artifacts"
```

## Performance Optimization

### Database Optimization

1. **Index Usage**
   - Monitor index performance
   - Add composite indexes for common queries
   - Regular index maintenance

2. **Query Optimization**
   - Use appropriate filtering
   - Implement pagination for large result sets
   - Cache frequently accessed data

### Storage Optimization

1. **Compression**
   - Compress artifact content
   - Use efficient storage formats
   - Implement deduplication

2. **Cleanup Strategies**
   - Regular retention policy execution
   - Monitor storage usage trends
   - Implement automated cleanup schedules

### Caching

1. **Application Caching**
   - Cache artifact metadata
   - Implement promotion status caching
   - Use Redis for distributed caching

2. **Database Caching**
   - Enable query result caching
   - Use connection pooling
   - Implement read replicas for reporting

## Backup and Recovery

### Database Backups

1. **Regular Backups**
   - Daily automated backups
   - Point-in-time recovery capability
   - Cross-region replication

2. **Backup Verification**
   - Regular restore testing
   - Backup integrity validation
   - Recovery time objectives (RTO)

### Artifact Recovery

1. **Content Backup**
   - Separate artifact content storage
   - Version control for critical artifacts
   - Geographic distribution

2. **Recovery Procedures**
   - Documented recovery steps
   - Regular recovery drills
   - Incident response protocols

## Best Practices

### Development

1. **TypeScript Strict Mode**
   - Use strict typing throughout
   - Avoid `any` types
   - Implement proper error handling

2. **Testing**
   - Comprehensive unit tests
   - Integration tests with database
   - End-to-end workflow testing

3. **Documentation**
   - Keep API documentation current
   - Document policy configurations
   - Maintain troubleshooting guides

### Operations

1. **Monitoring**
   - Proactive monitoring setup
   - Alert threshold configuration
   - Regular metric review

2. **Security**
   - Regular security audits
   - Policy review and updates
   - Access control reviews

3. **Maintenance**
   - Regular cleanup execution
   - Performance optimization
   - Capacity planning

## Integration Points

### Existing Systems

1. **Governance Framework**
   - Policy synchronization
   - Compliance reporting
   - Audit trail integration

2. **CI/CD Pipeline**
   - Build artifact registration
   - Automated promotions
   - Test result integration

3. **Monitoring Systems**
   - Metric export
   - Alert integration
   - Dashboard connectivity

### Future Enhancements

1. **Advanced Analytics**
   - Usage pattern analysis
   - Predictive cleanup
   - Cost optimization insights

2. **Automation**
   - AI-driven policy recommendations
   - Automated issue detection
   - Self-healing capabilities

3. **Integration**
   - External registry support
   - Multi-cloud distribution
   - Advanced authentication

## Support and Escalation

### Issue Triage

1. **Severity Classification**
   - Critical: Production impact
   - High: Security or compliance
   - Medium: Performance degradation
   - Low: Documentation or usability

2. **Escalation Paths**
   - Level 1: Basic troubleshooting
   - Level 2: Technical expertise
   - Level 3: System architecture
   - Level 4: Vendor support

### Contact Information

- **Technical Lead**: [Contact information]
- **On-Call Engineering**: [Contact information]
- **Security Team**: [Contact information]
- **Compliance Officer**: [Contact information]

---

For additional information, see:
- [Package README](../../packages/artifacts/README.md)
- [API Documentation](../../packages/artifacts/docs/)
- [Security Documentation](../security/)
- [Governance Documentation](../governance/)
