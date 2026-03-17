# Deployment Procedures & Guidelines

## Deployment Philosophy

### Multi-Tenant Deployment
- **Tenant Safety**: Never deploy changes that could affect tenant data
- **Rollback Ready**: Every deployment must be instantly reversible
- **Database Safety**: Database migrations require careful testing
- **Environment Isolation**: Strict separation between environments

### Deployment Commands

```bash
# Build specific package
pnpm turbo run build --filter=@agency/database

# Build all packages
pnpm build

# Deploy specific app
pnpm turbo run deploy --filter=agency-admin

# Database migration
supabase db push

# Generate types after migration
supabase gen types typescript --local > types.ts
```

### Environment Setup

#### Development Environment
```bash
# Start local development
pnpm dev

# Start Supabase locally
supabase start

# Reset local database
supabase db reset

# Check migration status
supabase migration list
```

#### Staging Environment
```bash
# Deploy to staging
pnpm turbo run deploy:staging --filter=agency-admin

# Run staging tests
pnpm turbo run test:e2e --filter=agency-admin

# Verify database state
supabase db diff --schema public --use-migra
```

#### Production Environment
```bash
# Deploy to production
pnpm turbo run deploy:production --filter=agency-admin

# Run production smoke tests
pnpm turbo run test:smoke --filter=agency-admin

# Monitor deployment
pnpm turbo run monitor --filter=agency-admin
```

### Database Deployment

#### Migration Process
```bash
# 1. Create migration
supabase migration new add_new_feature

# 2. Write migration SQL
# Edit the generated migration file

# 3. Test migration locally
supabase db push

# 4. Run RLS tests
supabase test db

# 5. Deploy to staging
supabase db push --remote staging

# 6. Verify staging
supabase db diff --remote staging

# 7. Deploy to production
supabase db push --remote production
```

#### Migration Safety Checklist
- [ ] RLS policies included for new tables
- [ ] Tenant_id indexes created
- [ ] Backward compatible changes
- [ ] Rollback script prepared
- [ ] Tests passing locally
- [ ] Staging verification complete

### Application Deployment

#### Build Process
```bash
# Build for production
pnpm build

# Build specific app
pnpm turbo run build --filter=agency-admin

# Build with environment
NODE_ENV=production pnpm turbo run build --filter=agency-admin
```

#### Deployment Verification
```bash
# Health check
curl https://agency-admin.yourdomain.com/api/health

# Tenant isolation check
curl -H "X-Tenant-ID: tenant-1" https://agency-admin.yourdomain.com/api/data

# Performance check
curl -w "@curl-format.txt" https://agency-admin.yourdomain.com/
```

### CI/CD Integration

#### GitHub Actions Workflow
```yaml
name: Deploy Agency Admin

on:
  push:
    branches: [main]
    paths: ['apps/agency-admin/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: pnpm install
        
      - name: Run tests
        run: pnpm turbo run test --filter=agency-admin
        
      - name: Build application
        run: pnpm turbo run build --filter=agency-admin
        
      - name: Deploy to Vercel
        uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

### Database Deployment Safety

#### Pre-Deployment Checks
```bash
# Check for pending migrations
supabase migration list

# Validate RLS policies
supabase test db

# Check database size
supabase db shell --command "SELECT pg_size_pretty(pg_database_size(current_database()));"

# Check connection limits
supabase db shell --command "SELECT count(*) FROM pg_stat_activity;"
```

#### Post-Deployment Verification
```bash
# Verify new tables exist
supabase db shell --command "\dt new_table"

# Verify RLS policies
supabase db shell --command "\dp"

# Test tenant isolation
supabase test db --test-path tests/test_new_feature.sql

# Check performance
supabase db shell --command "EXPLAIN ANALYZE SELECT * FROM new_table WHERE tenant_id = 'test';"
```

### Rollback Procedures

#### Application Rollback
```bash
# Rollback to previous deployment
vercel rollback agency-admin

# Verify rollback
curl https://agency-admin.yourdomain.com/api/health

# Monitor for issues
pnpm turbo run monitor --filter=agency-admin
```

#### Database Rollback
```bash
# Create rollback migration
supabase migration new rollback_feature_name

# Write rollback SQL
-- Example rollback
DROP TABLE IF EXISTS new_feature_table;

# Apply rollback
supabase db push

# Verify rollback
supabase test db
```

### Monitoring & Alerting

#### Deployment Monitoring
```bash
# Check application health
pnpm turbo run health-check --filter=agency-admin

# Monitor error rates
pnpm turbo run monitor:errors --filter=agency-admin

# Check database performance
supabase db shell --command "SELECT * FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 10;"
```

#### Alert Thresholds
- **Error Rate**: > 5% triggers alert
- **Response Time**: > 2s triggers alert  
- **Database Connections**: > 80% triggers alert
- **Failed Deployments**: Immediate alert

### Environment Variables

#### Required Variables
```bash
# Production
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_key
VERCEL_TOKEN=your_vercel_token

# Staging
NEXT_PUBLIC_SUPABASE_URL=https://your-project-staging.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_staging_key
```

#### Variable Validation
```typescript
// deploy/validate-env.ts
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'VERCEL_TOKEN'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

console.log('✅ All required environment variables present');
```

### Deployment Best Practices

1. **Always** test migrations in staging first
2. **Always** verify RLS policies after database changes
3. **Always** have rollback plans ready
4. **Never** deploy without running tests
5. **Never** deploy to production during business hours
6. **Always** monitor deployments for at least 30 minutes
7. **Never** skip tenant isolation verification

### Troubleshooting

#### Common Issues
```bash
# Migration conflicts
supabase migration list
supabase migration fix

# Build failures
pnpm clean
pnpm install
pnpm build

# Database connection issues
supabase db shell --command "SELECT version();"
supabase db restart
```

#### Emergency Procedures
```bash
# Emergency rollback
vercel rollback agency-admin --latest

# Database emergency stop
supabase db stop

# Force reset (last resort)
supabase db reset --remote production
```

## Progressive Documentation

For more details:
- `docs/DEPLOYMENT.md` - Complete deployment guide
- `docs/DATABASE.md` - Database deployment patterns
- `docs/SECURITY.md` - Security deployment considerations
