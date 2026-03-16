# Sparse Checkout Configuration Guide

This guide covers sparse checkout configuration for the Agency Platform monorepo, designed to dramatically improve Git performance for developers working with specific subsets of the codebase.

## Overview

The Agency Platform monorepo contains multiple applications, packages, and extensive documentation. While this provides excellent code sharing and consistency, it can slow down Git operations for developers who only work with specific components.

Sparse checkout allows developers to check out only the directories they need, reducing:
- **Git status time** from seconds to milliseconds
- **Git checkout time** for large branches
- **IDE indexing and file system scanning**
- **Disk space usage** for local clones

## Quick Start

### 1. Initialize Sparse Checkout

```bash
# Initialize sparse checkout in cone mode (O(1) performance)
./scripts/performance/sparse-checkout.sh init
```

### 2. Choose Your Role

```bash
# List available roles
./scripts/performance/sparse-checkout.sh list

# Set up for frontend development
./scripts/performance/sparse-checkout.sh role frontend

# Set up for backend development
./scripts/performance/sparse-checkout.sh role backend

# Set up for full-stack development
./scripts/performance/sparse-checkout.sh role fullstack
```

### 3. Verify Configuration

```bash
# Check current status
./scripts/performance/sparse-checkout.sh status

# Benchmark performance improvements
./scripts/performance/sparse-checkout.sh benchmark
```

## Role-Based Configurations

### Frontend Role
**Who**: Frontend developers working on UI components and client applications

**Included directories**:
- `apps/agency-admin/` - Admin dashboard
- `apps/firm/` - Agency marketing site
- `apps/prospective-clients/` - Demo client sites
- `packages/ui/` - Shared UI components
- `packages/design-tokens/` - Design system tokens
- `packages/analytics/` - Client-side analytics

**Use case**: Perfect for developers focused on UI/UX, component development, and client-facing features.

### Backend Role
**Who**: Backend developers working on database, APIs, and infrastructure

**Included directories**:
- `packages/database/` - Supabase database client
- `packages/booking/` - Booking system logic
- `packages/email/` - Email services
- `supabase/` - Database migrations and tests
- `scripts/` - Build and utility scripts

**Use case**: Ideal for developers focused on database design, API development, and infrastructure.

### Full Stack Role
**Who**: Full stack developers working across the entire platform

**Included directories**:
- `apps/` - All applications
- `packages/` - All shared packages
- `supabase/` - Database layer
- `scripts/` - Build scripts
- `docs/` - Documentation

**Use case**: Comprehensive access for developers who need to work across the entire stack.

### Client Role
**Who**: Developers working on specific client implementations

**Included directories**:
- `apps/clients/riverside-hotel/` - Client implementation
- `packages/ui/` - UI components
- `packages/design-tokens/` - Client-specific tokens
- `packages/database/` - Database access

**Use case**: Focused development for client-specific features and customizations.

### Admin Role
**Who**: Administrators and platform managers

**Included directories**:
- `apps/agency-admin/` - Admin interface
- `packages/database/` - Database management
- `packages/analytics/` - Analytics and metrics
- `packages/ui/` - Admin UI components
- `docs/` - Documentation

**Use case**: Platform administration, monitoring, and documentation management.

### DevOps Role
**Who**: DevOps engineers and platform maintainers

**Included directories**:
- `.github/` - CI/CD workflows
- `scripts/` - Automation scripts
- `docs/operations/` - Operations documentation
- `turbo.json`, `package.json`, `pnpm-workspace.yaml` - Build configuration

**Use case**: CI/CD pipeline management, deployment automation, and infrastructure.

### Minimal Role
**Who**: New developers or minimal setup requirements

**Included directories**:
- `apps/agency-admin/` - Primary admin interface
- `packages/ui/` - Essential UI components
- `packages/database/` - Database access

**Use case**: Quick onboarding, minimal development setup, or testing environments.

## Custom Configurations

### Creating Custom Sparse Checkout

```bash
# Specify exactly which directories you need
./scripts/performance/sparse-checkout.sh custom "apps/agency-admin packages/ui packages/database docs/development"

# Multiple directories
./scripts/performance/sparse-checkout.sh custom "apps/firm packages/design-tokens scripts/performance"
```

### Adding/Removing Directories

```bash
# Add a directory to existing sparse checkout
git sparse-checkout add apps/clients/new-client

# Remove a directory
git sparse-checkout remove docs/research

# Set completely new configuration
git sparse-checkout set apps/agency-admin packages/ui
```

## Performance Benefits

### Before Sparse Checkout
```bash
# Full repository (all files)
git status          # 2-5 seconds
git log --oneline -10   # 1-2 seconds
git checkout main    # 5-10 seconds
```

### After Sparse Checkout (Frontend Role)
```bash
# Sparse checkout (reduced file set)
git status          # 50-100ms (95% faster)
git log --oneline -10   # 100-200ms (90% faster)
git checkout main    # 500ms-1s (90% faster)
```

### File Count Reduction
- **Full repository**: ~15,000 files
- **Frontend role**: ~3,000 files (80% reduction)
- **Backend role**: ~2,500 files (83% reduction)
- **Minimal role**: ~1,000 files (93% reduction)

## Cone Mode Performance

The sparse checkout implementation uses **cone mode** (Git 2.25.0+), which provides:

- **O(1) performance** vs O(N*M) for pattern matching
- **Hash-based lookups** instead of linear pattern evaluation
- **Scalable to thousands of directories** without performance degradation
- **Automatic optimization** for directory-based patterns

## Integration with Development Workflow

### VSCode Integration

VSCode automatically detects sparse checkout and optimizes:
- TypeScript language server indexing
- File search and navigation
- Extension performance

### Turborepo Integration

Turborepo works seamlessly with sparse checkout:
- `pnpm dev` runs only on available packages
- `pnpm build` builds only accessible applications
- `--affected` detection works correctly

### CI/CD Integration

The CI/CD pipeline uses full checkout, but local development benefits from sparse checkout:
- GitHub Actions: Full checkout (fetch-depth: 0)
- Local development: Sparse checkout (role-based)

## Best Practices

### 1. Choose the Right Role

Start with the most restrictive role that meets your needs:
```bash
# Start minimal
./scripts/performance/sparse-checkout.sh role minimal

# Expand as needed
./scripts/performance/sparse-checkout.sh role frontend
```

### 2. Monitor Performance

Regularly benchmark your setup:
```bash
# Check performance metrics
./scripts/performance/sparse-checkout.sh benchmark

# Verify included directories
./scripts/performance/sparse-checkout.sh status
```

### 3. Switch Roles as Needed

Don't hesitate to switch roles when your work changes:
```bash
# Working on frontend today
./scripts/performance/sparse-checkout.sh role frontend

# Backend work tomorrow
./scripts/performance/sparse-checkout.sh role backend
```

### 4. Use Custom for Edge Cases

For specific requirements, create custom configurations:
```bash
# Working on a specific client
./scripts/performance/sparse-checkout.sh custom "apps/clients/riverside-hotel packages/ui packages/design-tokens"
```

## Troubleshooting

### Common Issues

#### "Git version too old"
```bash
# Upgrade Git (required 2.25.0+ for cone mode)
brew upgrade git  # macOS
sudo apt update && sudo apt install git  # Ubuntu
```

#### "Directory not found"
```bash
# Verify directory exists
find . -name "desired-directory" -type d

# Check current sparse checkout
./scripts/performance/sparse-checkout.sh status
```

#### "Build failures"
```bash
# Some directories might be required for builds
# Add missing directories
git sparse-checkout add packages/eslint-config
```

### Recovery Commands

```bash
# Disable sparse checkout (return to full)
./scripts/performance/sparse-checkout.sh disable

# Reset to clean state
git sparse-checkout disable
git sparse-checkout init --cone
git sparse-checkout set <desired-directories>
```

## Advanced Usage

### Script Integration

Add to your shell profile for quick role switching:
```bash
# ~/.bashrc or ~/.zshrc
alias sparse='./scripts/performance/sparse-checkout.sh'
alias sparse-frontend='sparse role frontend'
alias sparse-backend='sparse role backend'
alias sparse-full='sparse role fullstack'
```

### Git Hooks

Create Git hooks to automatically suggest sparse checkout:
```bash
# .git/hooks/post-checkout
#!/bin/bash
if [ "$3" == "1" ]; then  # Branch checkout
    echo "💡 Consider using sparse checkout for better performance:"
    echo "   ./scripts/performance/sparse-checkout.sh role frontend"
fi
```

## Performance Monitoring

### Metrics to Track

1. **Git status time**: Should be <100ms with sparse checkout
2. **Git checkout time**: Should be <1s for branch switches
3. **VSCode startup time**: Faster with smaller workspace
4. **Disk usage**: Reduced by 70-90% depending on role

### Benchmark Script

Run regular benchmarks to monitor performance:
```bash
# Weekly performance check
./scripts/performance/sparse-checkout.sh benchmark

# Track improvements over time
echo "$(date): $(git status --porcelain 2>&1 | head -1)" >> ~/.git-performance.log
```

## Migration Guide

### From Full Checkout

1. **Initialize sparse checkout**:
   ```bash
   ./scripts/performance/sparse-checkout.sh init
   ```

2. **Choose appropriate role**:
   ```bash
   ./scripts/performance/sparse-checkout.sh role frontend
   ```

3. **Verify everything works**:
   ```bash
   pnpm dev  # Should work with available packages
   ./scripts/performance/sparse-checkout.sh benchmark
   ```

### Returning to Full Checkout

If you need full repository access:
```bash
./scripts/performance/sparse-checkout.sh disable
```

This preserves all your work and restores the complete repository.

## Conclusion

Sparse checkout dramatically improves Git performance for large monorepos while maintaining full functionality. By using role-based configurations, developers can enjoy fast Git operations tailored to their specific work patterns.

For most developers, the **frontend** or **backend** roles provide the best balance of functionality and performance. Start with these and adjust based on your specific needs.
